"""旁白驱动的分段时间：整稿一次语音合成，按字幕把旁白切回每一段，算出每段的时长。

    python3 cases/tools/timing.py news-artemis --sync   # 把 script.json 的整稿写进 assets.json 的旁白项（语音合成之前）
    python3 cases/tools/timing.py news-artemis          # 语音合成之后：写 segments/timing.json

script.json：segments 和 case.json 的段按顺序一一对应；每段 vo（念的句子）、pace（可选）{lead 旁白前留几秒, gap 句与句之间另留几秒（给画面）, tail 旁白后留几秒, min 最短几秒}。
assets.json 里 file 为 assets/vo.mp3 的那一项是整稿旁白（tools/assets.py 合成、写回逐句字幕 lines）。
timing.json：每段 {title, dur 秒（整帧）, vo: [每句 {ss 从整稿旁白的第几秒起, t 长度, at 在本段的第几秒放}], lines 本段字幕（本段时间，带 s 第几句）}。
各段的场景读它定动画时刻，sound.py 读它摆旁白；接片时 render.py 按它累加出每段起止写进 case.json。
"""
import json
import re
import subprocess
import sys
from pathlib import Path

CASES = Path(__file__).resolve().parent.parent
FPS = 30
VO = "assets/vo.mp3"
QUIET, SNAP, PAD = -45, .7, .06   # 停顿的电平（dB）；句界离停顿最多几秒还算这个停顿；切点在发音前后各留几秒（落在停顿里）
PUNCT =r"[\s，。！？；：、,.!?;:—…·“”\"'（）()]"


def load(d):
    return json.loads((d / "script.json").read_text(encoding="utf-8")), json.loads((d / "assets.json").read_text(encoding="utf-8"))


def vo_item(A):
    return next(i for i in A["items"] if i["file"] == VO)


def bare(s, show):
    for k, v in show.items():
        s = s.replace(k, v)
    return re.sub(PUNCT, "", s)


def sync(d):
    S, A = load(d)
    it = vo_item(A)
    text = "".join("".join(s["vo"]) for s in S["segments"])
    it.update(model=S["voice"]["model"], voice=S["voice"]["voice"], params=S["voice"]["params"], text=text, show=S["show"])
    (d / "assets.json").write_text(json.dumps(A, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"旁白 {len(text)} 字 → assets.json")


def silences(path, quiet=QUIET):
    """旁白里的停顿 [(起, 止)]，秒"""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"silencedetect=n={quiet}dB:d=0.06", "-f", "null", "-"],
                       capture_output=True, text=True)
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    return list(zip(st, en))


def edges(path, clips, sr=16000):
    """每个旁白片段首尾 30 毫秒的电平，高于 QUIET 的（切在发音上）返回 [(第几句, 起点秒, dB)]"""
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True).stdout
    x, n, bad = np.frombuffer(raw, np.float32), int(.03 * sr), []
    for i, c in enumerate(clips):
        a, b = int(c["ss"] * sr), int((c["ss"] + c["t"]) * sr)
        db = max(20 * np.log10(np.sqrt(np.mean(x[j:j + n] ** 2)) + 1e-9) for j in (a, max(a, b - n)))
        if db > QUIET:
            bad.append((i + 1, round(c["ss"], 2), round(float(db), 1)))
    return bad


def frames(x):
    return round(x * FPS) / FPS


def build(d):
    S, A = load(d)
    it = vo_item(A)
    if "".join("".join(s["vo"]) for s in S["segments"]) != it.get("text"):
        sys.exit("script.json 改过、旁白还没重配：先 --sync，再 python3 cases/tools/assets.py <名字> --only assets/vo.mp3 --force")
    lines, k, out, segs = it["lines"], 0, [], []
    for i, s in enumerate(S["segments"]):
        want, got, mine = bare("".join(s["vo"]), S["show"]), "", []
        while k < len(lines) and len(got) < len(want):
            mine.append(lines[k]); got += bare(lines[k]["text"], {}); k += 1
        if got != want:
            sys.exit(f"第 {i + 1} 段的字幕对不上旁白：\n  稿子 {want}\n  字幕 {got}")
        p = {"lead": .6, "gap": 0, "tail": .8, "min": 0, **s.get("pace", {})}
        ends, n = [], 0                                    # 每句在本段稿子里的结束位置（去掉标点后的字数）
        for v in s["vo"]:
            n += len(bare(v, S["show"])); ends.append(n)
        pos, clips, outl = 0, [], []
        for l in mine:                                     # 字幕行归到句子：行尾落在第几句里
            pos += len(bare(l["text"], {}))
            si = next(j for j, e in enumerate(ends) if pos <= e)
            if not clips or clips[-1]["s"] != si:
                clips.append({"s": si, "t0": l["t0"], "t1": l["t1"]})
            clips[-1]["t1"] = l["t1"]
            outl.append({**l, "s": si})
        segs.append((s, p, clips, outl))
    # 字幕的时间和真实发音差 0.3–0.5 秒，直接按字幕切会切掉句尾、下一句开头带上上一句的尾音：
    # 每个句界改到旁白里离它最近的真实停顿上，在停顿中间切；句内字幕按真实起止等比例挪
    allc = [c for _, _, cl, _ in segs for c in cl]
    pauses, bad = silences(d / VO), []
    loose = silences(d / VO, QUIET + 5)                    # 停顿里有一点底噪、没到 QUIET 的，放宽 5 dB 再找一次
    for a, b in zip(allc, allc[1:]):
        x = (a["t1"] + b["t0"]) / 2
        q = min(pauses, key=lambda q: abs((q[0] + q[1]) / 2 - x), default=None)
        if q is None or abs((q[0] + q[1]) / 2 - x) > SNAP:
            q = min(loose, key=lambda q: abs((q[0] + q[1]) / 2 - x), default=None)
        if q is None or abs((q[0] + q[1]) / 2 - x) > SNAP:
            bad.append(round(x, 2)); q = (x, x)
        a["e"], b["b"] = q[0], q[1]
    allc[0]["b"] = max(0, next((q[1] for q in pauses if q[0] <= .05), 0)) if pauses else 0
    allc[-1]["e"] = next((q[0] for q in pauses if q[1] >= it["dur"] - .05), it["dur"])
    if bad:
        print(f"！这些句界附近没有停顿，按字幕切：{bad}")
    for s, p, clips, outl in segs:
        vo, at = [], p["lead"]
        for c in clips:
            ss, end = max(0, c["b"] - PAD), c["e"] + PAD
            c.update(ss=ss, t=end - ss, at=at)
            vo.append({"ss": round(ss, 3), "t": round(end - ss, 3), "at": round(at, 3)})
            at += end - ss + p["gap"]
        at -= p["gap"]
        dur = frames(max(p["min"], at + p["tail"]))
        C = {c["s"]: c for c in clips}

        def mv(t, c):                                      # 字幕时间 → 本段时间：句内按真实发音起止等比例挪
            k = (c["e"] - c["b"]) / max(c["t1"] - c["t0"], 1e-3)
            return round(c["at"] + (c["b"] - c["ss"]) + (t - c["t0"]) * k, 3)
        out.append({"title": s["title"], "dur": dur, "vo": vo,
                    "lines": [{"t0": mv(l["t0"], C[l["s"]]), "t1": mv(l["t1"], C[l["s"]]), "text": l["text"], "s": l["s"]} for l in outl]})
    cut = edges(d / VO, [c for _, _, cl, _ in segs for c in cl])
    if cut:
        sys.exit(f"这些句子的切点落在发音上（首尾 30 毫秒高于 {QUIET} dB），会听到断句：{cut}")
    (d / "segments").mkdir(exist_ok=True)
    (d / "segments" / "timing.json").write_text(json.dumps({"fps": FPS, "segments": out}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    tot = sum(s["dur"] for s in out)
    print("  ".join(f"{i + 1} {s['title']} {s['dur']:.1f}s" for i, s in enumerate(out)))
    print(f"合计 {tot:.1f} 秒（{int(tot // 60)}:{tot % 60:04.1f}）→ segments/timing.json")


if __name__ == "__main__":
    d = CASES / sys.argv[1]
    sync(d) if "--sync" in sys.argv else build(d)
