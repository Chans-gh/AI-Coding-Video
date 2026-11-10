"""案例出片：配音、分段渲染、接片都调 Skill 的出片工具（samples/tools/voice.py、film.py），这里只做本仓库发布用的部分：
把 case.json、script.json 对照成 Skill 认的分镜，接片后把每段起止写回 case.json，出原版、中版、封面、附带短片。

    python3 cases/tools/render.py news-artemis --voice       # 配音：script.json 和整稿 assets/vo.mp3 一致就导入它（不重配），否则只合成改了的句子
    python3 cases/tools/render.py news-artemis --check       # 回听：逐句识别，和稿子比读音（voice.py --check）
    python3 cases/tools/render.py news-artemis 3 5 --quick   # 改代码时：第 3、5 段每 2 秒抽一帧半分辨率，检查，出总览图
    python3 cases/tools/render.py news-artemis all -j 2      # 各段整帧渲染（无声）到 out/seg/，逐段检查；没变的段不重渲
    python3 cases/tools/render.py news-artemis --join        # 接片、混音、整片自检，出原版、中版、封面，写起止进 case.json
    python3 cases/tools/render.py news-artemis --shorts      # 从原版按旁白的整句切附带短片（script.json 的 shorts）
    python3 cases/tools/render.py news-artemis --sound       # 只混整支的声音到 out/mix.wav，试听用

对照：case.json 的第 k 段 = Skill 分镜的段 "0k"（场景文件 segments/0k.js），script.json 的段按顺序一一对应；
每次运行先从 case.json、script.json 写出 storyboard.json（生成的，不进仓库，正本仍是 case.json）。
voice.py 写 timing.json 和 vo/（vo/ 能从 assets/vo.mp3 重新导入，不进仓库）；film.py 写 out/。
成品（不进仓库，scripts/media.py 传到 Release media）：media/<名字>.mp4（原版 1080p，≤120 MB，另要低于 PUSH_MB 才推得上去）、
<名字>-mid.mp4（长边 1280，≤25 MB）、<名字>.jpg（封面，长边 1280）、<名字>-short-<k>.mp4（附带短片）。
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

CASES = Path(__file__).resolve().parent.parent
ROOT = CASES.parent
TOOLS = ROOT / "samples" / "tools"
sys.path.insert(0, str(ROOT / "samples"))
import render as R  # noqa: E402  samples/render.py

SIZE = {"9:16": (1080, 1920), "16:9": (1920, 1080)}
FULL_MB, MID_MB = 120, 25
PUSH_MB = 99            # scripts/media.py 经 git 中转分支上传，GitHub 拒收 100 MB 以上的单个文件：原版另要压到这以下
VO = "assets/vo.mp3"     # 老案例的整稿旁白（一次合成、带逐句字幕，字幕在 assets.json 这一项的 lines）
STRIP = ["-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", "-metadata:s:v:0", "encoder=", "-metadata:s:a:0", "encoder="]


def ff(*a):
    subprocess.run([R.ffmpeg(), "-y", "-loglevel", "error", *map(str, a)], check=True)


def name(k):
    return f"{k:02d}"


def load(case):
    d = CASES / case
    rd = lambda f: json.loads((d / f).read_text(encoding="utf-8"))
    return d, rd("case.json"), rd("script.json")


def storyboard(d, C, S):
    """case.json + script.json → Skill 认的 storyboard.json（只写 voice.py、film.py 读的字段）"""
    if len(C["segments"]) != len(S["segments"]):
        sys.exit("case.json 和 script.json 的段数不一样")
    v = S.get("voice")
    sb = {"about": "由 cases/tools/render.py 从 case.json、script.json 生成，不要手改", "ar": C["ar"],
          "unify": {"voice": {"model": v["model"], "voice": v["voice"], "speed": (v.get("params") or {}).get("speed", 1)} if v else None},
          "segments": [{"seg": name(k), "title": s["title"], "sec": s.get("sec")} for k, s in enumerate(C["segments"], 1)]}
    (d / "storyboard.json").write_text(json.dumps(sb, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def tool(script, d, *a):
    return subprocess.run([sys.executable, str(TOOLS / script), str(d), *map(str, a)]).returncode


def voice(d, S):
    A = json.loads((d / "assets.json").read_text(encoding="utf-8"))
    it = next((i for i in A["items"] if i["file"] == VO), None)
    imported = bool(it and it.get("lines") and "".join("".join(s["vo"]) for s in S["segments"]) == it.get("text"))
    if imported:
        (d / "out").mkdir(exist_ok=True)
        subs = d / "out" / "vo-lines.json"
        subs.write_text(json.dumps(it["lines"], ensure_ascii=False), encoding="utf-8")
        code = tool("voice.py", d, "--import", d / VO, "--subs", subs)
    else:
        code = tool("voice.py", d)       # 稿子改过：句子池里没变的句子照用，只合成改了的（走 AICV_TTS_CMD，超过上限会先停下）
    if code == 0:
        extra(d, S, it["lines"] if imported else None)
    return code


def cut_at(V, text, n):
    """text 里第 n 个字（不算标点、空格）后面、连同紧跟的标点的位置"""
    c = 0
    for i, ch in enumerate(text):
        if not V.PUNCT.match(ch):
            c += 1
            if c == n:
                j = i + 1
                while j < len(text) and V.PUNCT.match(text[j]):
                    j += 1
                return j
    return len(text)


def extra(d, S, lines):
    """timing.json 里补本仓库的场景要用的两样：每段的 title；整稿字幕的每一行（lines，本段时间）。
    字幕行按句分好，句内的时间从整稿字幕的起止等比例挪到这句真实有声的起止上（字幕时间比真实发音早 0.3–0.5 秒）"""
    sys.path.insert(0, str(TOOLS))
    import voice as V
    tf = d / "timing.json"
    T = json.loads(tf.read_text(encoding="utf-8"))
    pool = d / "vo" / "cache" / "pool"
    k = 0
    for s, src in zip(T["segments"], S["segments"]):
        s["title"] = src["title"]
        for it in s["vo"]:
            it.pop("lines", None)
            if lines is None:
                continue
            want, got, mine = len(V.bare(it["show"])), 0, []
            while k < len(lines) and got < want:
                l, n = lines[k], len(V.bare(lines[k]["text"]))
                if got + n > want:                           # 一行跨两句：在句界处拆开，时间按字数分
                    i = cut_at(V, l["text"], want - got)
                    mid = l["t0"] + (l["t1"] - l["t0"]) * (want - got) / n
                    mine.append({"t0": l["t0"], "t1": mid, "text": l["text"][:i].strip()})
                    lines[k] = {"t0": mid, "t1": l["t1"], "text": l["text"][i:].strip()}
                    got = want
                    break
                mine.append(l); got += n; k += 1
            if got != want:
                sys.exit(f"整稿字幕对不上「{it['show']}」：先查 assets.json 的 lines")
            m = json.loads((pool / f"{V.key(T['voice'], it['text'])}.json").read_text(encoding="utf-8"))
            b, e = it["at"] + m["pre"], it["at"] + m["t"] - m["post"]
            a0, a1 = mine[0]["t0"], mine[-1]["t1"]
            mv = lambda t: round(b + (t - a0) * (e - b) / max(a1 - a0, 1e-3), 3)
            it["lines"] = [{"t0": mv(l["t0"]), "t1": mv(l["t1"]), "text": l["text"]} for l in mine]
    tf.write_text(json.dumps(T, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def timing(d):
    T = json.loads((d / "timing.json").read_text(encoding="utf-8"))
    t = 0.0
    for s in T["segments"]:
        s["start"], s["end"] = t, t + s["dur"]
        t = s["end"]
    return T, t


def probe_dur(f):
    return R.mp4_duration(f) or 0.0


def sizes(d, T, tot):
    """每段视频的体积：按时长分摊原版 FULL_MB 的上限"""
    bad = 0
    for s in T["segments"]:
        f = d / "out" / "seg" / f"{s['seg']}.mp4"
        lim = FULL_MB * s["dur"] / tot
        if f.exists() and f.stat().st_size > lim * 1e6:
            print(f"✗ {s['seg']} 体积 {f.stat().st_size / 1e6:.1f} MB > 按时长分摊的 {lim:.1f} MB")
            bad += 1
    return bad


def join(case, d, C, S):
    src = d / "out" / f"{d.name}-{C['ar'].replace(':', 'x')}.mp4"
    src.unlink(missing_ok=True)
    code = tool("film.py", d, "--join")
    if not src.exists():
        return code or 1
    if code:                                                                     # 整片自检有 ✗（见 out/report.md）：照样出发布用的文件，人看过再决定，退出码仍是 1
        print("！整片自检有 ✗，照样出原版、中版、封面，先看 out/report.md 再上传")
    T, tot = timing(d)
    media = d / "media"
    media.mkdir(exist_ok=True)
    full = media / f"{case}.mp4"
    ff("-i", src, "-c", "copy", *STRIP, "-movflags", "+faststart", full)
    for crf in (23, 26, 29):                                                     # 超过 120 MB（或推送上限）就加大压缩重编画面，声音照抄
        if full.stat().st_size <= min(FULL_MB, PUSH_MB) * 1e6:
            break
        ff("-i", src, "-c:v", "libx264", "-preset", "medium", "-crf", crf, "-pix_fmt", "yuv420p", "-bsf:v", "filter_units=remove_types=6",
           "-c:a", "copy", *STRIP, "-movflags", "+faststart", full)
    # 中版：长边 1280，按 25 MB 的 92% 算码率，两遍编码
    w, h = SIZE[C["ar"]]
    k = 1280 / max(w, h)
    vf = f"scale={round(w * k / 2) * 2}:{round(h * k / 2) * 2}:flags=lanczos"
    vbr = int(MID_MB * 1e6 * 8 * .92 / tot - 96_000)
    mid = media / f"{case}-mid.mp4"
    pl = d / "out" / "pass"
    ff("-i", full, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-b:v", vbr, "-pass", 1, "-passlogfile", pl, "-an", "-f", "mp4", "/dev/null")
    ff("-i", full, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-b:v", vbr, "-pass", 2, "-passlogfile", pl, "-pix_fmt", "yuv420p",
       "-bsf:v", "filter_units=remove_types=6", "-c:a", "aac", "-b:a", "96k", *STRIP, "-movflags", "+faststart", mid)
    # 封面：script.json 的 cover [段号, 段内秒]，长边 1280 的 JPG
    cn, ct = S.get("cover", [1, 1])
    jpg = media / f"{case}.jpg"
    ff("-ss", f"{T['segments'][cn - 1]['start'] + ct:.3f}", "-i", full, "-frames:v", "1", "-vf", vf, "-q:v", 3, "-map_metadata", "-1", d / "out" / "cover.jpg")
    im = Image.open(d / "out" / "cover.jpg").convert("RGB"); clean = Image.new("RGB", im.size); clean.paste(im)
    clean.save(jpg, quality=88, optimize=True)
    # 每段起止写进 case.json（正本），再生成 README
    for s, t in zip(C["segments"], T["segments"]):
        s["start"], s["end"] = round(t["start"], 2), round(t["end"], 2)
    (d / "case.json").write_text(dump_case(C), encoding="utf-8")
    subprocess.run([sys.executable, str(CASES / "tools" / "build.py")], check=True)
    bad = 0
    for f, lim in ((full, FULL_MB), (mid, MID_MB)):
        mb = f.stat().st_size / 1e6
        bad += mb > lim
        print(f"{'✓' if mb <= lim else '✗'} {f.relative_to(ROOT)} {mb:.1f} MB（上限 {lim}）{probe_dur(f):.1f}s")
    print(f"✓ {jpg.relative_to(ROOT)} {Image.open(jpg).size}")
    return 1 if bad or code else 0


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


# ---------- 附带短片：按旁白的整句切 ----------
def shorts(case, d, S):
    """script.json 的 shorts：[{seg 段号, sec 目标秒数, ar 可选}]。ar 写 "9x16" 时把横屏原版切成竖屏（原画面居中，上下垫模糊底）。以这一段为主体，往前、往后按整句（timing.json 的旁白句）补，
    补到不超过 sec 为止；从原版里切（画面、声音都是接好、混好的那一版，不重混），头尾 0.3 秒淡入淡出。"""
    T, _ = timing(d)
    segs = T["segments"]
    full = d / "media" / f"{case}.mp4"
    for k, sh in enumerate(S.get("shorts", []), 1):
        n, sec = sh["seg"], sh.get("sec", 60)
        a, b = segs[n - 1]["start"], segs[n - 1]["end"]
        before = segs[n - 2] if n > 1 else None
        after = segs[n] if n < len(segs) else None
        # 候选切点：前一段每句旁白开始前 0.4 秒；后一段每句旁白结束后 0.5 秒
        pre = [before["start"] + c["at"] - .4 for c in before["vo"]] if before else []
        post = [after["start"] + c["at"] + c["t"] + .5 for c in after["vo"]] if after else []
        room = sec - (b - a)
        lead = max([x for x in pre if a - x <= room * .5] or [a], key=lambda x: a - x)
        room -= a - lead
        tail = max([x for x in post if x - b <= room] or [b])
        a, b = lead, tail
        dst = d / "media" / f"{case}-short-{k}.mp4"
        fades = f"fade=in:st=0:d=0.3,fade=out:st={b - a - .4:.3f}:d=0.4"
        if sh.get("ar") == "9x16":       # 横屏原版切竖屏：原画面按宽铺在中间，上下垫同一画面放大、模糊、压暗的底
            vf = ("split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:4,eq=brightness=-0.18[bg];"
                  f"[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2,{fades}")
        else:
            vf = fades
        ff("-ss", f"{a:.3f}", "-i", full, "-t", f"{b - a:.3f}", "-vf", vf,
           "-af", f"afade=in:st=0:d=0.3,afade=out:st={b - a - .4:.3f}:d=0.4", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
           "-pix_fmt", "yuv420p", "-bsf:v", "filter_units=remove_types=6", "-c:a", "aac", "-b:a", "160k", *STRIP, "-movflags", "+faststart", dst)
        print(f"✓ {dst.relative_to(ROOT)} {b - a:.1f}s（原版 {a:.1f}–{b:.1f}，第 {n} 段）{dst.stat().st_size / 1e6:.1f} MB")
    return 0


def main():
    ap = argparse.ArgumentParser(description="案例出片：配音、渲染、接片调 Skill 的 voice.py、film.py，另出中版、封面、附带短片")
    ap.add_argument("case")
    ap.add_argument("segs", nargs="*", help="段号（3 5）或 all")
    ap.add_argument("--voice", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--quick", action="store_true")
    ap.add_argument("--join", action="store_true")
    ap.add_argument("--shorts", action="store_true")
    ap.add_argument("--sound", action="store_true")
    ap.add_argument("--force", action="store_true", help="没变的段也重渲")
    ap.add_argument("-j", type=int, default=2)
    a = ap.parse_args()
    d, C, S = load(a.case)
    storyboard(d, C, S)
    if a.voice:
        return voice(d, S)
    if a.check:
        return tool("voice.py", d, "--check")
    if a.sound:
        return tool("film.py", d, "--sound")
    if a.join:
        return join(a.case, d, C, S)
    if a.shorts:
        return shorts(a.case, d, S)
    if not a.segs:
        sys.exit("写段号（3 5）或 all；配音 --voice，接片 --join")
    segs = ["all"] if a.segs == ["all"] else [name(int(s)) for s in a.segs]
    code = tool("film.py", d, *segs, *(["--quick"] if a.quick else []), *(["--force"] if a.force else []), "-j", a.j)
    if not a.quick:
        T, tot = timing(d)
        code = code or sizes(d, T, tot)
    return code


if __name__ == "__main__":
    sys.exit(main())
