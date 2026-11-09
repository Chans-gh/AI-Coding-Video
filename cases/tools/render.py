"""长片出片：分段渲染、每段单独检查，整支只接一次、混一次音，出原版、中版、封面和附带短片，把每段起止写进 case.json。

    python3 cases/tools/render.py news-artemis 3 5 --quick   # 改代码时用：第 3、5 段每 2 秒抽一帧半分辨率，检查，出总览图
    python3 cases/tools/render.py news-artemis 3 5           # 渲染第 3、5 段（整帧，无声视频）到 out/seg/，并检查
    python3 cases/tools/render.py news-artemis all -j 2      # 所有段，2 段并行
    python3 cases/tools/render.py news-artemis --join        # 各段都渲好之后：接片、混音、出原版、中版、封面，写起止进 case.json
    python3 cases/tools/render.py news-artemis --shorts      # 从原版按文字稿切附带短片（script.json 的 shorts）
    python3 cases/tools/render.py news-artemis --sound       # 只混整支的声音到 out/mix.wav，试听用

段：cases/<名字>/segments/<两位段号>.js，由 cases/tools/player.html 载入（写法和样片的 scene.js 一样，每帧只由 t 决定）；
时长取 segments/timing.json（cases/tools/timing.py 按旁白算）。出片方式沿用 samples/render.py：Playwright 逐帧截图、ffmpeg 编码、去元数据。
声音：cases/<名字>/sound.py 的 score(m, T)，m 是整支的 synth.Mix，T 见 Timeline；检查时混一遍整支、取本段那一截看，出片时只混一次。

每段的检查（任一项不过打 ✗）：脚本报错、黑屏或白屏、画面不动（相隔 0.2 秒的两帧几乎一样，连续超过 3 秒，或占本段 40% 以上）、
无声（本段里连续 3 秒以上低于 -50 dBFS）、削波、时长 10–60 秒、体积（按时长分摊原版 120 MB 的上限）。
成品（不进仓库，scripts/media.py 传到 Release media）：cases/<名字>/media/<名字>.mp4（原版 1080p，≤120 MB）、<名字>-mid.mp4（长边 1280，≤25 MB）、
<名字>.jpg（封面，长边 1280）、<名字>-short-<k>.mp4（附带短片）。
"""
import argparse
import importlib.util
import io
import json
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

CASES = Path(__file__).resolve().parent.parent
ROOT = CASES.parent
sys.path.insert(0, str(ROOT / "samples"))
sys.path.insert(0, str(ROOT / "samples" / "lib"))
import render as R  # noqa: E402  samples/render.py
import synth  # noqa: E402

SIZE = {"9:16": (1080, 1920), "16:9": (1920, 1080)}
FULL_MB, MID_MB = 120, 25
PUSH_MB = 99            # scripts/media.py 经 git 中转分支上传，GitHub 拒收 100 MB 以上的单个文件：原版另要压到这以下
GAP = .2
SEG_RANGE = (10, 60)
STRIP = ["-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", "-metadata:s:v:0", "encoder=", "-metadata:s:a:0", "encoder="]


def ff(*a):
    subprocess.run([R.ffmpeg(), "-y", "-loglevel", "error", *map(str, a)], check=True)


def load_case(name):
    d = CASES / name
    return d, json.loads((d / "case.json").read_text(encoding="utf-8")), json.loads((d / "segments" / "timing.json").read_text(encoding="utf-8"))


class Page(R.Page):
    """案例的一段：开 cases/tools/player.html，接口和 samples/render.py 的 Page 一样（dur、fps、frame、close）"""

    def __init__(self, pw, name, n, ar, scale=1.0):
        w, h = SIZE[ar]
        self.errors, self.log = [], []
        self.b = pw.chromium.launch(args=R.ARGS, executable_path=R.CHROME)
        self.pg = self.b.new_page(viewport={"width": w, "height": h}, device_scale_factor=scale)
        self.pg.set_default_timeout(300000)
        self.pg.on("console", self._console)
        self.pg.on("pageerror", lambda e: (self.errors.append(str(e)), self.log.append(f"pageerror: {e}")))
        q = "16x9" if ar == "16:9" else "9x16"
        self.pg.goto((CASES / "tools" / "player.html").as_uri() + f"?c={name}&seg={n}&ar={q}&render=1&t=0")
        self.pg.wait_for_function("READY === true || document.title === 'ERROR'", timeout=600000)
        if self.pg.title() == "ERROR":
            self.close()
            raise R.SceneError(self.errors[0] if self.errors else "页面出错")
        self.dur, self.fps = self.pg.evaluate("DUR"), self.pg.evaluate("FPS")


# ---------- 声音 ----------
class Timeline:
    """传给 sound.py 的 T：T.dir 案例目录，T.segs 每段 {title, dur, vo, lines, start, end}（start、end 是整支里的秒），T.dur 总长。
    T.start(k) 第 k 段（从 1 数）的起点；T.vo(m, gain) 把各段的旁白按 timing.json 摆好，返回说话的区间（压低配乐用）"""

    def __init__(self, d, timing):
        self.dir, self.segs, t = d, [], 0.0
        for s in timing["segments"]:
            self.segs.append({**s, "start": t, "end": t + s["dur"]})
            t += s["dur"]
        self.dur = t

    def start(self, k):
        return self.segs[k - 1]["start"]

    def vo(self, m, gain=.9):
        x = synth.load(self.dir / "assets" / "vo.mp3")
        talk = []
        for s in self.segs:
            for c in s["vo"]:
                a = int(c["ss"] * synth.SR)
                clip = synth.fade(x[a:a + int(c["t"] * synth.SR)], .01, .06)
                at = s["start"] + c["at"]
                m.put(clip, at, gain)
                talk.append((at, at + c["t"]))
        return talk


def mix(d, timing):
    """整支混一次：返回 (母带, 混音原始电平, Timeline)"""
    T = Timeline(d, timing)
    spec = importlib.util.spec_from_file_location("case_sound", d / "sound.py")
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    m = synth.Mix(T.dur)
    mod.score(m, T)
    raw = m.buf[: int(T.dur * synth.SR)].copy()
    return m.master(fade_in=.05, fade_out=1.0), raw, T


def audio_check(x, raw, a, b):
    """本段那一截：最长的静音（秒）、峰值、削波比例"""
    y = x[int(a * synth.SR): int(b * synth.SR)].mean(axis=1)
    hop = int(.1 * synth.SR)
    n = len(y) // hop
    rms = np.sqrt((y[: n * hop].reshape(n, hop) ** 2).mean(axis=1)) + 1e-9
    quiet, run = 0, 0
    for v in 20 * np.log10(rms):
        run = run + 1 if v < -50 else 0
        quiet = max(quiet, run)
    over = float(np.mean(np.abs(raw[int(a * synth.SR): int(b * synth.SR)] * 1.1) > 2.0))
    return quiet * .1, 20 * np.log10(np.abs(y).max() + 1e-12), over


# ---------- 分段渲染、检查 ----------
def seg_task(name, n, ar, quick):
    from playwright.sync_api import sync_playwright
    d, case, timing = load_case(name)
    out = d / "out" / "seg"
    out.mkdir(parents=True, exist_ok=True)
    log, why, t0 = [], [], time.time()
    thumbs, pairs, grays = [], [], []
    with sync_playwright() as pw:
        try:
            p = Page(pw, name, n, ar, scale=.5 if quick else 1.0)
        except R.SceneError as e:
            return {"n": n, "why": [f"脚本报错：{str(e)[:120]}"], "log": [str(e)], "thumbs": [], "secs": time.time() - t0}
        dur, fps = p.dur, p.fps
        nf, gap = round(dur * fps), round(GAP * fps)
        if quick:
            for k in range(0, int(dur // 2) + 1):
                t = min(k * 2.0, dur - GAP - 1 / fps)
                a, b = p.frame(t, quality=80), p.frame(t + GAP, quality=80)
                grays.append(R.probe(a)); pairs.append(float(np.abs(R.probe(a) - R.probe(b)).mean())); thumbs.append(a)
            step = 2.0
        else:
            mp4 = out / f"{n:02d}.mp4"
            enc = subprocess.Popen([R.ffmpeg(), "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-vcodec", "mjpeg", "-i", "-",
                                    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-g", str(fps * 2), "-pix_fmt", "yuv420p",
                                    "-bsf:v", "filter_units=remove_types=6", "-map_metadata", "-1", "-fflags", "+bitexact", "-metadata:s:v:0", "encoder=",
                                    str(mp4)], stdin=subprocess.PIPE)
            prev = {}
            for i in range(nf):
                b = p.frame(i / fps, quality=92)
                enc.stdin.write(b)
                if i % (fps // 2) == 0:                     # 每 0.5 秒抽一帧查黑屏，和 0.2 秒后的那帧比查画面不动
                    prev[i] = R.probe(b); grays.append(prev[i])
                    if i % (fps * 2) == 0:
                        thumbs.append(b)
                if i - gap in prev:
                    pairs.append(float(np.abs(prev.pop(i - gap) - R.probe(b)).mean()))
            enc.stdin.close(); enc.wait()
            step = .5
        errs = p.errors
        p.close()
    import batch as B                                       # samples/batch.py 的黑屏、白屏、画面不动判定
    why += B.check_frames(grays, pairs)
    run = best = 0
    for v in pairs:
        run = run + 1 if v < .05 else 0
        best = max(best, run)
    if best * step > 3:
        why.append(f"画面不动连续 {best * step:.1f} 秒")
    if errs:
        why.append(f"脚本报错：{errs[0][:100]}")
    if not SEG_RANGE[0] <= dur <= SEG_RANGE[1]:
        why.append(f"时长 {dur:.1f} 秒，不在 {SEG_RANGE[0]}–{SEG_RANGE[1]} 秒")
    x, raw, T = mix(d, timing)
    s = T.segs[n - 1]
    quiet, peak, over = audio_check(x, raw, s["start"], s["end"])
    if quiet >= 3:
        why.append(f"无声 {quiet:.1f} 秒")
    if over > .002:
        why.append(f"削波 {over:.1%}")
    info = f"{dur:.1f}s 峰值 {peak:.1f} dB"
    if not quick:
        mp4 = out / f"{n:02d}.mp4"
        size = mp4.stat().st_size
        budget = FULL_MB * 1e6 * .93 * dur / T.dur              # 留 7% 给声音
        for crf in (23, 26):                                    # 超过分摊的体积：从本段成品加大压缩重编（画面细碎的，如发射的烟和火）
            if size <= budget:
                break
            tmp = mp4.with_suffix(".tmp.mp4")
            ff("-i", mp4, "-c:v", "libx264", "-preset", "medium", "-crf", crf, "-g", fps * 2, "-pix_fmt", "yuv420p",
               "-bsf:v", "filter_units=remove_types=6", *STRIP, tmp)
            tmp.replace(mp4); size = mp4.stat().st_size
            info += f" 重编 crf {crf}"
        info += f" {size / 1e6:.1f} MB"
        if size > budget:
            why.append(f"体积 {size / 1e6:.1f} MB 超过分摊的 {budget / 1e6:.1f} MB")
    (out / f"{n:02d}.log").write_text("\n".join(log + p.log), encoding="utf-8")
    return {"n": n, "why": why, "info": info, "thumbs": [small(b) for b in thumbs], "secs": time.time() - t0}


def small(jpeg, h=320):
    im = Image.open(io.BytesIO(jpeg)).convert("RGB")
    im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=82)
    return b.getvalue()


def sheet(d, results):
    """每段一行：每 2 秒一帧（最多 16 帧），总览图 out/seg/sheet.jpg"""
    rows = [r for r in results if r["thumbs"]]
    if not rows:
        return
    ims = [[Image.open(io.BytesIO(b)) for b in r["thumbs"][:16]] for r in rows]
    w0, h0 = ims[0][0].size
    S = Image.new("RGB", (w0 * 16 + 60, h0 * len(rows)), (24, 24, 24))
    g = ImageDraw.Draw(S)
    for k, (r, row) in enumerate(zip(rows, ims)):
        g.text((8, k * h0 + 8), f"{r['n']:02d}", fill=(255, 220, 0))
        for j, im in enumerate(row):
            S.paste(im, (60 + j * w0, k * h0))
    S.thumbnail((3200, 3200))
    S.save(d / "out" / "seg" / "sheet.jpg", quality=82)


def run_segs(name, segs, quick, jobs):
    d, case, timing = load_case(name)
    ar = case["ar"]
    results = []
    with ProcessPoolExecutor(jobs) as ex:
        futs = [ex.submit(seg_task, name, n, ar, quick) for n in segs]
        for f in as_completed(futs):
            r = f.result(); results.append(r)
            print(f"{'✗' if r['why'] else '✓'} 第 {r['n']} 段 {r.get('info', '')} 用时 {r['secs']:.0f}s" + (f"  {'；'.join(r['why'])}" if r["why"] else ""), flush=True)
    results.sort(key=lambda r: r["n"])
    sheet(d, results)
    return all(not r["why"] for r in results)


# ---------- 接片、混音、出版本 ----------
def probe_dur(f):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                                capture_output=True, text=True).stdout)


def join(name):
    d, case, timing = load_case(name)
    out, media = d / "out", d / "media"
    media.mkdir(exist_ok=True)
    segs = [out / "seg" / f"{k:02d}.mp4" for k in range(1, len(timing["segments"]) + 1)]
    miss = [s.name for s in segs if not s.exists()]
    if miss:
        sys.exit("还没渲染：" + "、".join(miss))
    for s, t in zip(segs, timing["segments"]):
        if abs(probe_dur(s) - t["dur"]) > .05:
            sys.exit(f"{s.name} 的时长 {probe_dur(s):.2f} 和 timing.json 的 {t['dur']} 对不上：timing 改过，重渲这一段")
    lst = out / "concat.txt"
    lst.write_text("".join(f"file '{s.resolve()}'\n" for s in segs))
    silent = out / "joined.mp4"
    ff("-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent)          # 只接一次：各段编码参数一样，直接拼，不重编
    x, raw, T = mix(d, timing)                                                   # 只混一次
    from scipy.io import wavfile
    wav = out / "mix.wav"
    wavfile.write(wav, synth.SR, (x * 32767).astype(np.int16))
    full = media / f"{name}.mp4"
    ff("-i", silent, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", *STRIP, "-movflags", "+faststart", full)
    for crf in (23, 26, 29):                                                     # 超过 120 MB（或推送上限）就加大压缩重编
        if full.stat().st_size <= min(FULL_MB, PUSH_MB) * 1e6:
            break
        ff("-i", silent, "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", crf, "-pix_fmt", "yuv420p", "-bsf:v", "filter_units=remove_types=6",
           "-c:a", "aac", "-b:a", "192k", "-shortest", *STRIP, "-movflags", "+faststart", full)
    # 中版：长边 1280，按 25 MB 的 92% 算码率，两遍编码
    w, h = SIZE[case["ar"]]
    k = 1280 / max(w, h)
    vf = f"scale={round(w * k / 2) * 2}:{round(h * k / 2) * 2}:flags=lanczos"
    vbr = int(MID_MB * 1e6 * 8 * .92 / T.dur - 96_000)
    mid = media / f"{name}-mid.mp4"
    pl = out / "pass"
    ff("-i", full, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-b:v", vbr, "-pass", 1, "-passlogfile", pl, "-an", "-f", "mp4", "/dev/null")
    ff("-i", full, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-b:v", vbr, "-pass", 2, "-passlogfile", pl, "-pix_fmt", "yuv420p",
       "-bsf:v", "filter_units=remove_types=6", "-c:a", "aac", "-b:a", "96k", *STRIP, "-movflags", "+faststart", mid)
    # 封面：script.json 的 cover [段号, 段内秒]，长边 1280 的 JPG
    S = json.loads((d / "script.json").read_text(encoding="utf-8"))
    cn, ct = S.get("cover", [1, 1])
    jpg = media / f"{name}.jpg"
    ff("-ss", f"{T.start(cn) + ct:.3f}", "-i", full, "-frames:v", "1", "-vf", vf, "-q:v", 3, "-map_metadata", "-1", out / "cover.jpg")
    im = Image.open(out / "cover.jpg").convert("RGB"); clean = Image.new("RGB", im.size); clean.paste(im)
    clean.save(jpg, quality=88, optimize=True)
    # 每段起止写进 case.json（正本），再生成 README
    for s, t in zip(case["segments"], T.segs):
        s["start"], s["end"] = round(t["start"], 2), round(t["end"], 2)
    (d / "case.json").write_text(dump_case(case), encoding="utf-8")
    subprocess.run([sys.executable, str(CASES / "tools" / "build.py")], check=True)
    for f, lim in ((full, FULL_MB), (mid, MID_MB)):
        mb = f.stat().st_size / 1e6
        print(f"{'✓' if mb <= lim else '✗'} {f.relative_to(ROOT)} {mb:.1f} MB（上限 {lim}）{probe_dur(f):.1f}s")
    print(f"✓ {jpg.relative_to(ROOT)} {Image.open(jpg).size}")
    silent.unlink()


def dump_case(case):
    """case.json 的排版：顶层每个键一行起，段、用量一项一行（和手写的一致，diff 好看）"""
    head = {k: v for k, v in case.items() if k not in ("segments", "extras", "usage", "downgrade", "compare")}
    j = lambda v: json.dumps(v, ensure_ascii=False)
    out = ["{"] + [f' {j(k)}: {j(v)},' for k, v in head.items()]
    segs = []
    for s in case["segments"]:
        a = {k: v for k, v in s.items() if k != "uses"}
        body = j(a)[:-1] + ', "uses": [\n      ' + ",\n      ".join(j(u) for u in s["uses"]) + "]}"
        segs.append("    " + body)
    out.append(' "segments": [\n' + ",\n".join(segs) + "\n ],")
    for k in ("extras", "usage", "downgrade", "compare"):
        if k in case:
            out.append(f' {j(k)}: [\n' + ",\n".join("    " + j(v) for v in case[k]) + "\n ],")
    out[-1] = out[-1].rstrip(",")
    return "\n".join(out) + "\n}\n"


# ---------- 附带短片：按文字稿切 ----------
def shorts(name):
    """script.json 的 shorts：[{seg 段号, sec 目标秒数, ar 可选}]。ar 写 "9x16" 时把横屏原版切成竖屏（原画面居中，上下垫模糊底）。以这一段为主体，往前、往后按整句（timing.json 的旁白句）补，
    补到不超过 sec 为止；从原版里切（画面、声音都是接好、混好的那一版，不重混），头尾 0.3 秒淡入淡出。"""
    d, case, timing = load_case(name)
    S = json.loads((d / "script.json").read_text(encoding="utf-8"))
    T = Timeline(d, timing)
    full = d / "media" / f"{name}.mp4"
    for k, sh in enumerate(S.get("shorts", []), 1):
        n, sec = sh["seg"], sh.get("sec", 60)
        a, b = T.segs[n - 1]["start"], T.segs[n - 1]["end"]
        before = T.segs[n - 2] if n > 1 else None
        after = T.segs[n] if n < len(T.segs) else None
        # 候选切点：前一段每句旁白开始前 0.4 秒；后一段每句旁白结束后 0.5 秒
        pre = [before["start"] + c["at"] - .4 for c in before["vo"]] if before else []
        post = [after["start"] + c["at"] + c["t"] + .5 for c in after["vo"]] if after else []
        room = sec - (b - a)
        lead = max([x for x in pre if a - x <= room * .5] or [a], key=lambda x: a - x)
        room -= a - lead
        tail = max([x for x in post if x - b <= room] or [b])
        a, b = lead, tail
        dst = d / "media" / f"{name}-short-{k}.mp4"
        fades = f"fade=in:st=0:d=0.3,fade=out:st={b - a - .4:.3f}:d=0.4"
        if sh.get("ar") == "9x16":       # 横屏原版切竖屏：原画面按宽铺在中间，上下垫同一画面放大、模糊、压暗的底
            vf = ("split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:4,eq=brightness=-0.18[bg];"
                  f"[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2,{fades}")
        else:
            vf = fades
        ff("-ss", f"{a:.3f}", "-i", full, "-t", f"{b - a:.3f}", "-vf", vf,
           "-af", f"afade=in:st=0:d=0.3,afade=out:st={b - a - .4:.3f}:d=0.4", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
           "-pix_fmt", "yuv420p", "-bsf:v", "filter_units=remove_types=6", "-c:a", "aac", "-b:a", "160k", *STRIP, "-movflags", "+faststart", dst)
        print(f"✓ {dst.relative_to(ROOT)} {b - a:.1f}s（原版 {a:.1f}–{b:.1f}，第 {n} 段 {T.segs[n - 1]['title']}）{dst.stat().st_size / 1e6:.1f} MB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case")
    ap.add_argument("segs", nargs="*")
    ap.add_argument("--quick", action="store_true")
    ap.add_argument("--join", action="store_true")
    ap.add_argument("--shorts", action="store_true")
    ap.add_argument("--sound", action="store_true")
    ap.add_argument("-j", type=int, default=2)
    a = ap.parse_args()
    d, case, timing = load_case(a.case)
    if a.sound:
        from scipy.io import wavfile
        x, raw, T = mix(d, timing)
        (d / "out").mkdir(exist_ok=True)
        wavfile.write(d / "out" / "mix.wav", synth.SR, (x * 32767).astype(np.int16))
        print(f"out/mix.wav {T.dur:.1f}s")
        return
    if a.join:
        return join(a.case)
    if a.shorts:
        return shorts(a.case)
    n = len(timing["segments"])
    segs = list(range(1, n + 1)) if a.segs in ([], ["all"]) else [int(s) for s in a.segs]
    sys.exit(0 if run_segs(a.case, segs, a.quick, a.j) else 1)


if __name__ == "__main__":
    main()
