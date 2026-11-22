"""从配乐算节拍：速度（BPM）、一拍几秒、第一拍落在哪，给风格包的分镜表对拍用。

    python3 tools/beats.py ../packs/news-brief/demo/assets/music.mp3            # 打出速度、拍长、第一拍、可信度
    python3 tools/beats.py music.mp3 --ss 3.2 --dur 75                          # 只看 3.2 秒起的 75 秒
    python3 tools/beats.py music.mp3 --json beats.json                          # 另把每一拍的时刻写成 JSON

做法：解码成单声道 → 短时频谱的正向变化量（谱通量）做起音曲线 → 自相关在 70–180 BPM 里找最强的周期，
用抛物线插值细到毫秒 → 按这个周期做梳状求和，找第一拍的相位。速度在 120 上下常有倍半的歧义，
--min / --max 收窄区间（如 --min 140 --max 170）就能选定一种。

分镜表的用法：segments.json 顶层写 "beat"（这里的拍长，秒）和 "music_ss"（配乐从第几秒起放，等于第一拍的时刻，
这样第 0 秒就落在拍上）；scene.js 启动时检查每个镜头的时长都是整拍，声音照同一个拍长放节拍和音效。
"""
import argparse, json, sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "lib"))
from synth import SR, load  # noqa: E402

HOP = 441                       # 10 毫秒一帧


def onset_curve(x):
    """单声道 → 每 10 毫秒一点的起音强度（对数幅度谱的正向差之和），去掉缓慢起伏"""
    n, win = 2048, np.hanning(2048)
    frames = (len(x) - n) // HOP
    idx = np.arange(n)[None, :] + HOP * np.arange(frames)[:, None]
    spec = np.log1p(30 * np.abs(np.fft.rfft(x[idx] * win, axis=1)))
    flux = np.maximum(spec[1:] - spec[:-1], 0).sum(axis=1)
    k = 40                                        # 0.4 秒的滑动平均当基线
    base = np.convolve(flux, np.ones(k) / k, mode="same")
    return np.maximum(flux - base, 0)


def tempo(env, lo=70, hi=180):
    """自相关找周期（帧），返回 (周期帧数，浮点；可信度 0–1)"""
    e = env - env.mean()
    ac = np.correlate(e, e, mode="full")[len(e) - 1:]
    ac /= ac[0] + 1e-9
    fps = SR / HOP
    a, b = int(fps * 60 / hi), int(fps * 60 / lo) + 1
    # 同时看两倍周期的峰，压掉半拍的假峰
    score = np.array([ac[k] + .5 * (ac[2 * k] if 2 * k < len(ac) else 0) for k in range(a, b)])
    k = a + int(np.argmax(score))
    if a < k < b - 1:                             # 抛物线插值
        y0, y1, y2 = ac[k - 1], ac[k], ac[k + 1]
        d = .5 * (y0 - y2) / (y0 - 2 * y1 + y2 + 1e-12)
        k = k + float(np.clip(d, -.5, .5))
    return k, float(max(0.0, min(1.0, ac[int(round(k))])))


def phase(env, per):
    """梳状求和：从哪一帧起每隔 per 帧取一次，取到的起音最强"""
    best, off = -1, 0.0
    for k in np.arange(0, per, .25):
        pos = np.arange(k, len(env) - 1, per)
        s = env[np.round(pos).astype(int)].sum()
        if s > best:
            best, off = s, k
    return off


def analyze(path, ss=0.0, dur=None, lo=70, hi=180):
    x = load(str(path), ss, dur).mean(axis=1)
    env = onset_curve(x)
    per, conf = tempo(env, lo, hi)
    fps = SR / HOP
    beat = per / fps
    first = phase(env, per) / fps + 1024 / SR      # 窗口中心
    n = int((len(x) / SR - first) / beat) + 1
    return {"bpm": round(60 / beat, 2), "beat": round(beat, 4), "first": round(first + ss, 3),
            "confidence": round(conf, 2), "beats": [round(ss + first + i * beat, 3) for i in range(n)]}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("audio")
    ap.add_argument("--ss", type=float, default=0.0)
    ap.add_argument("--dur", type=float)
    ap.add_argument("--min", type=float, default=70)
    ap.add_argument("--max", type=float, default=180)
    ap.add_argument("--json")
    a = ap.parse_args()
    r = analyze(a.audio, a.ss, a.dur, a.min, a.max)
    print(f"{r['bpm']} BPM · 一拍 {r['beat']} 秒 · 第一拍 {r['first']} 秒 · 可信度 {r['confidence']} · 共 {len(r['beats'])} 拍")
    if a.json:
        Path(a.json).write_text(json.dumps(r, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
