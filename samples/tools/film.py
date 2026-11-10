"""完整出片的整片工具：分段渲染、检查、接片、混音、自检。输入是用户项目的 videos/<短名>/，见 Skill 的 making.md「整片」。

    python3 tools/film.py ../videos/<短名> P2 --quick     # 改代码时：本段每 2 秒半分辨率抽一帧，检查，出总览图
    python3 tools/film.py ../videos/<短名> --typical      # 第 5 步：typical 标的段各出一支带声音的典型样片到 typical/
    python3 tools/film.py ../videos/<短名> all -j 2       # 第 6 步：各段整帧渲染（无声）到 out/seg/，逐段检查
    python3 tools/film.py ../videos/<短名> --join         # 接片、混音、整片自检，出成片和报告
    python3 tools/film.py ../videos/<短名> --sound        # 只混整片的声音到 out/mix.wav，试听

先跑 tools/voice.py 写好 timing.json（段长、每句的时间）。每段的场景是 segments/<段号>.js，写法同样片，段长取 SEG.dur；
画幅取分镜的 ar。段代码、lib/、player.html、本段的 timing.json 条目、assets.json 都没变的段不重渲（--force 全部重渲）。
可选的 sound.py 写 score(m, T)：m 是整片长的 synth.Mix，T = {"fps", "dur" 整片秒数, "segments": [{"seg", "start" 在整片第几秒,
"dur", "vo": [{"at" 在整片第几秒, "t", "text"}]}]}，配乐跨段连续；旁白由本工具照 timing.json 摆，说话时把配乐压低约 9 dB。
混好后两遍定响度到 −14 LUFS，4 倍采样率限幅，真峰值不超过 −1 dBTP。
退出码：0 通过；1 有 ✗；2 停下没做（缺 timing.json、读不了）。整片可能跑半小时以上：脱离会话运行，日志写文件（见 making.md）。
"""
import argparse
import hashlib
import importlib.util
import io
import json
import os
import re
import shutil
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

TOOLS = Path(__file__).resolve().parent
HERE = TOOLS.parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / "lib")); sys.path.insert(0, str(TOOLS))
import render as R  # noqa: E402
import heavy  # noqa: E402

LUFS, TP, TP_AIM = -14.0, -1.0, -1.5
DUCK_DB = 9.0
CRF = 20
SEG_MIN, SEG_MAX = 10, 60
GAP = .2


class Stop(Exception):
    def __init__(self, msg, code=2):
        super().__init__(msg); self.code = code


# ---------- 读项目 ----------

class Project:
    def __init__(self, d):
        self.d = Path(d).resolve()
        try:
            self.sb = json.loads((self.d / "storyboard.json").read_text(encoding="utf-8"))
        except (OSError, ValueError) as e:
            raise Stop(f"读不了 {self.d / 'storyboard.json'}：{e}")
        tf = self.d / "timing.json"
        if not tf.exists():
            raise Stop("还没有 timing.json：先跑 python3 tools/voice.py <目录>")
        self.T = json.loads(tf.read_text(encoding="utf-8"))
        self.fps = self.T.get("fps", 30)
        self.ar = (self.sb.get("ar") or "16:9").replace(":", "x")
        self.segs = self.T["segments"]
        sec = {s["seg"]: s.get("sec") for s in self.sb.get("segments", [])}
        self.sec = sec
        self.typical = [s["seg"] for s in self.sb.get("segments", []) if s.get("typical")]
        t = 0.0
        for s in self.segs:
            s["start"] = t; t += s["dur"]
        self.dur = t
        self.short = self.d.name
        self.out = self.d / "out"

    def seg(self, name):
        s = next((s for s in self.segs if s["seg"] == name), None)
        if s is None:
            raise Stop(f"timing.json 里没有 {name}（有 {'、'.join(x['seg'] for x in self.segs)}）")
        if not (self.d / "segments" / f"{name}.js").exists():
            raise Stop(f"缺场景代码 segments/{name}.js")
        return s

    def query(self, name):
        from urllib.parse import quote
        return f"&p={quote(os.path.relpath(self.d, HERE))}&seg={quote(name)}"

    def fingerprint(self, name, extra=""):
        """段代码、lib/、player.html、本段的 timing.json 条目、assets.json 的哈希：一样就不重渲"""
        h = hashlib.sha1()
        src = self.d / "segments" / f"{name}.js"
        m = re.search(r"needs\s*:\s*\[([^\]]*)\]", src.read_text(encoding="utf-8"))       # 本段和它 needs 的文件
        needs = [src.parent / n for n in re.findall(r"['\"]([^'\"]+)['\"]", m.group(1))] if m else []
        files = [src, *needs] + sorted((HERE / "lib").glob("*")) + [HERE / "player.html", self.d / "assets.json"]
        for f in files:
            if f.is_file():
                h.update(f.name.encode()); h.update(f.read_bytes())
        s = {k: v for k, v in self.seg(name).items() if k != "start"}
        h.update(json.dumps([s, self.ar, self.fps, CRF, extra], ensure_ascii=False, sort_keys=True).encode())
        return h.hexdigest()[:16]


# ---------- 画面 ----------

def checks_frames(grays, pairs):
    """同 batch.py：黑屏或白屏、画面不动"""
    import batch
    return batch.check_frames(grays, pairs)


def events(P, s, grays):
    """每句有没有画面事件：一句话的时间里画面主区（中间 80%）8×8 的块一块都没变的，列出来（只作提醒）"""
    quiet = []
    for i, v in enumerate(s["vo"]):
        a, b = int(v["at"] * P.fps), min(len(grays), int((v["at"] + v["t"]) * P.fps))
        if b - a < 2:
            continue
        g = np.stack(grays[a:b])
        hh, ww = g.shape[1:]
        g = g[:, int(hh * .1): int(hh * .9), int(ww * .1): int(ww * .9)]
        by, bx = g.shape[1] // 8, g.shape[2] // 8
        blocks = g[:, : by * 8, : bx * 8].reshape(len(g), 8, by, 8, bx).mean(axis=(2, 4))
        if np.abs(blocks - blocks[0]).max() < 4:
            quiet.append(f"{s['seg']} 第 {i + 1} 句")
    return quiet


def sheet(jpegs, path, cols=4, h=270):
    ims = [Image.open(io.BytesIO(b)).convert("RGB") for b in jpegs]
    ims = [im.resize((round(im.width * h / im.height), h), Image.LANCZOS) for im in ims]
    w, pad = ims[0].width, 6
    rows = (len(ims) + cols - 1) // cols
    out = Image.new("RGB", (cols * (w + pad) + pad, rows * (h + pad) + pad), (24, 24, 24))
    for k, im in enumerate(ims):
        out.paste(im, (pad + k % cols * (w + pad), pad + k // cols * (h + pad)))
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path, quality=85)


def render_seg(args):
    """一段：整帧渲染成无声 mp4（quick 只抽帧），返回检查结果。在子进程里跑"""
    d, name, quick, dest = args
    from playwright.sync_api import sync_playwright
    P = Project(d)
    s = P.seg(name)
    t0, why, notes = time.time(), [], []
    with sync_playwright() as pw:
        try:
            p = R.Page(pw, "", P.ar, scale=.5 if quick else 1.0, query=P.query(name))
        except R.SceneError as e:
            return {"seg": name, "why": [f"脚本报错：{str(e)[:120]}"], "notes": [], "info": ""}
        n = round(s["dur"] * P.fps)
        if quick:
            ts = list(np.arange(0, s["dur"] - 1e-6, 2.0)) or [0.0]
            shots = [(p.frame(t, quality=80), p.frame(min(t + GAP, s["dur"] - 1 / P.fps), quality=80)) for t in ts]
            grays = [R.probe(a) for a, _ in shots]
            pairs = [float(np.abs(R.probe(a) - R.probe(b)).mean()) for a, b in shots]
            sheet([a for a, _ in shots], dest)
            info = f"{s['dur']:.2f}s 抽 {len(ts)} 帧"
        else:
            dest.parent.mkdir(parents=True, exist_ok=True)
            tmp = dest.with_suffix(".part.mp4")
            enc = subprocess.Popen([R.ffmpeg(), "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(P.fps),
                                    "-vcodec", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", str(CRF),
                                    "-pix_fmt", "yuv420p", "-r", str(P.fps), "-video_track_timescale", str(P.fps * 512),
                                    "-bsf:v", "filter_units=remove_types=6", "-map_metadata", "-1", "-fflags", "+bitexact",
                                    "-metadata:s:v:0", "encoder=", str(tmp)], stdin=subprocess.PIPE)
            grays, thumbs = [], []
            pick = {min(n - 1, round(n * k / 12)) for k in range(12)}
            for i in range(n):
                b = p.frame(i / P.fps, quality=92)
                enc.stdin.write(b)
                grays.append(R.probe(b))
                if i in pick:
                    thumbs.append(b)
            enc.stdin.close(); enc.wait()
            if enc.returncode:
                return {"seg": name, "why": ["编码失败"], "notes": [], "info": ""}
            tmp.replace(dest)
            sheet(thumbs, P.out / "sheets" / f"{name}.jpg")
            gap = round(GAP * P.fps)
            pairs = [float(np.abs(grays[i] - grays[i - gap]).mean()) for i in range(gap, len(grays))]
            notes += [f"{q} 画面主区没变化" for q in events(P, s, grays)]
            got = R.mp4_duration(dest)
            if got is not None and abs(got - s["dur"]) > .5 / P.fps:
                why.append(f"视频 {got:.3f}s ≠ 段长 {s['dur']}s")
            info = f"{s['dur']:.2f}s {dest.stat().st_size / 1e6:.1f} MB"
        p.close()
        why += [f"脚本报错：{e[:100]}" for e in p.errors[:1]]
        why += checks_frames(grays, pairs)
    if not SEG_MIN <= s["dur"] <= SEG_MAX:
        why.append(f"段长 {s['dur']:.1f}s 不在 {SEG_MIN}–{SEG_MAX} 秒")
    return {"seg": name, "why": why, "notes": notes, "info": f"{info}  {time.time() - t0:.0f}s"}


# ---------- 声音 ----------

def load_score(P):
    f = P.d / "sound.py"
    if not f.exists():
        return None
    spec = importlib.util.spec_from_file_location(f"film_sound_{P.short}".replace("-", "_"), f)
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod.score


def film_T(P):
    return {"fps": P.fps, "dur": P.dur, "segments": [
        {"seg": s["seg"], "start": s["start"], "dur": s["dur"],
         "vo": [{"at": s["start"] + v["at"], "t": v["t"], "text": v["text"]} for v in s["vo"]]} for s in P.segs]}


def ramp(n_total, spans, sr, k=.25):
    """说话的时间段 → 0–1 的包络，前后各 k 秒渐变"""
    env = np.zeros(n_total)
    for a, b in spans:
        i0, i1 = int(max(0, a - k) * sr), int(min(n_total / sr, b + k) * sr)
        t = np.arange(i0, i1) / sr
        env[i0:i1] = np.maximum(env[i0:i1], np.clip(np.minimum(t - (a - k), (b + k) - t) / k, 0, 1))
    return env


def mixdown(P):
    """整片一条时间轴：配乐（sound.py）+ 旁白（timing.json），说话时配乐压低，返回 (采样数, 2) 的立体声（未定响度）"""
    import synth
    sr, n = synth.SR, int(round(P.dur * synth.SR))
    music = np.zeros((n, 2))
    score = load_score(P)
    if score:
        m = synth.Mix(P.dur)
        score(m, film_T(P))
        music = m.buf[:n].copy()
    voice = np.zeros((n, 2))
    spans = []
    for s in P.segs:
        for v in s["vo"]:
            x = synth.load(P.d / v["file"])
            i = int(round((s["start"] + v["at"]) * sr))
            x = x[: max(0, n - i)]
            voice[i:i + len(x)] += x
            spans.append((s["start"] + v["at"], s["start"] + v["at"] + v["t"]))
    merged = []
    for a, b in sorted(spans):                       # 句间不到 0.6 秒的空隙不抬起配乐
        if merged and a - merged[-1][1] < .6:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    env = 1 - (1 - 10 ** (-DUCK_DB / 20)) * ramp(n, merged, sr)
    x = music * env[:, None] + voice
    t = np.arange(n) / sr                            # 整片首尾 20 毫秒、0.5 秒的淡入淡出
    x *= (np.clip(t / .02, 0, 1) * np.clip((P.dur - t) / .5, 0, 1))[:, None]
    return x, sr


def measure(x, sr):
    """ffmpeg ebur128：(整体响度 LUFS, 真峰值 dBTP)"""
    from scipy.io import wavfile
    tmp = R.OUT / f"measure-{os.getpid()}.wav"
    R.OUT.mkdir(exist_ok=True)
    wavfile.write(tmp, sr, x.astype(np.float32))
    r = probe_loud(tmp)
    tmp.unlink()
    return r


def probe_loud(path):
    r = subprocess.run([R.ffmpeg(), "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    tail = r.stderr[r.stderr.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", tail)
    p = re.search(r"True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS", tail)
    f = lambda m: float(m.group(1)) if m and m.group(1) != "-inf" else -99.0
    return f(i), f(p)


def limit4x(x, ceil_db=TP_AIM, look=.005, rel=.08, sr=44100):
    """4 倍采样率看峰值的限幅：增益只在超过 ceil 的地方往下压，提前 look 秒、release 秒放开"""
    from scipy.signal import resample_poly
    up = np.max(np.abs(resample_poly(x, 4, 1, axis=0)), axis=1)
    peak = up.reshape(-1, 4).max(axis=1)[: len(x)] if len(up) >= 4 * len(x) else np.pad(up, (0, 4 * len(x) - len(up))).reshape(-1, 4).max(axis=1)
    c = 10 ** (ceil_db / 20)
    g = np.minimum(1.0, c / np.maximum(peak, 1e-9))
    w = max(1, int(look * sr))
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(g, 2 * w + 1)               # 提前 look 秒开始压
    a = np.exp(-1 / (rel * sr))
    out, cur = np.empty_like(g), 1.0
    for i, v in enumerate(g):                        # 压得快、放得慢
        cur = v if v < cur else a * cur + (1 - a) * v
        out[i] = cur
    return x * out[:, None]


def master(x, sr):
    """两遍定响度：量 → 拉到 −14 LUFS → 4 倍采样率限幅 → 再量、补差 → 再限幅；返回 (母带, 响度, 真峰值)"""
    for _ in range(2):
        lu, _ = measure(x, sr)
        if lu <= -98:
            return x, lu, -99.0
        x = limit4x(x * 10 ** ((LUFS - lu) / 20), sr=sr)
    lu, tp = measure(x, sr)
    return x, lu, tp


def write_mix(P, path):
    from scipy.io import wavfile
    x, sr = mixdown(P)
    x, lu, tp = master(x, sr)
    path.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(path, sr, (np.clip(x, -1, 1) * 32767).astype(np.int16))
    return x, sr, lu, tp


def align(P, mix, sr):
    """音频和 timing.json 对得上：每句旁白的包络在成片音轨里的位置，偏差超过一帧的列出来"""
    import synth
    hop = int(.005 * sr)
    def envl(y):
        y = np.abs(y.mean(axis=1) if y.ndim == 2 else y)
        m = len(y) // hop
        return y[: m * hop].reshape(m, hop).mean(axis=1)
    E = envl(mix)
    worst, bad = 0.0, []
    for s in P.segs:
        for k, v in enumerate(s["vo"]):
            e = envl(synth.load(P.d / v["file"]))
            at = int((s["start"] + v["at"]) * sr / hop)
            span = int(.3 * sr / hop)
            best, lag = -1, 0
            for L in range(-span, span + 1):
                a = at + L
                if a < 0 or a + len(e) > len(E):
                    continue
                seg = E[a:a + len(e)]
                c = float(np.dot(seg - seg.mean(), e - e.mean()) / (np.linalg.norm(seg - seg.mean()) * np.linalg.norm(e - e.mean()) + 1e-9))
                if c > best:
                    best, lag = c, L
            off = lag * hop / sr
            worst = max(worst, abs(off))
            if abs(off) > 1 / P.fps or best < .5:
                bad.append(f"{s['seg']} 第 {k + 1} 句偏 {off * 1000:+.0f} 毫秒（相关 {best:.2f}）")
    return worst, bad


# ---------- 整片自检 ----------

def ffprobe(*a):
    return subprocess.run([shutil.which("ffprobe") or "ffprobe", "-v", "error", *a], capture_output=True, text=True).stdout


def blacks(path):
    r = subprocess.run([R.ffmpeg(), "-hide_banner", "-nostats", "-i", str(path), "-vf", "blackdetect=d=0.05:pix_th=0.10",
                        "-an", "-f", "null", "-"], capture_output=True, text=True)
    return [(float(a), float(b)) for a, b in re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", r.stderr)]


def frame_gaps(path, fps):
    pts = [float(x) for x in ffprobe("-select_streams", "v:0", "-show_entries", "packet=pts_time", "-of", "csv=p=0", str(path)).split() if x.strip()]
    pts.sort()
    d = np.diff(pts)
    return len(pts), (float(np.max(np.abs(d - 1 / fps))) if len(d) else 0.0)


# ---------- 命令 ----------

def run_segments(P, names, quick, force, jobs, max_mb):
    work, skipped = [], []
    for nm in names:
        P.seg(nm)
        if quick:
            work.append((str(P.d), nm, True, P.out / "quick" / f"{nm}.jpg"))
            continue
        dest, meta = P.out / "seg" / f"{nm}.mp4", P.out / "seg" / f"{nm}.json"
        fp = P.fingerprint(nm)
        if not force and dest.exists() and meta.exists() and json.loads(meta.read_text())["hash"] == fp:
            skipped.append(nm); continue
        work.append((str(P.d), nm, False, dest))
    if skipped:
        print(f"没变、不重渲：{'、'.join(skipped)}")
    bad = 0
    with heavy.slot("渲染"):
        with ProcessPoolExecutor(max_workers=max(1, min(jobs, len(work) or 1))) as ex:
            for res in ex.map(render_seg, work):
                nm = res["seg"]
                if not quick and not res["why"]:
                    dest = P.out / "seg" / f"{nm}.mp4"
                    if max_mb and dest.stat().st_size > max_mb * 1e6:
                        res["why"].append(f"体积 {dest.stat().st_size / 1e6:.1f} MB > {max_mb} MB")
                    (P.out / "seg" / f"{nm}.json").write_text(json.dumps({"hash": P.fingerprint(nm), "dur": P.seg(nm)["dur"]}), encoding="utf-8")
                bad += bool(res["why"])
                print(f"{'✓' if not res['why'] else '✗'} {nm} {res['info']}" + ("  " + "；".join(res["why"]) if res["why"] else ""))
                for n in res["notes"]:
                    print(f"  ！{n}（只作提醒）")
    if quick:
        print(f"总览图：{os.path.relpath(P.out / 'quick', Path.cwd())}/<段号>.jpg")
    if work and not quick:
        why = sound_checks(P, [w[1] for w in work])
        for w in why:
            print("✗ " + w)
        bad += len(why)
    return 1 if bad else 0


def sound_checks(P, names):
    """各段的声音：整片混音里本段那一截不静音、没削波"""
    x, sr = mixdown(P)
    why = []
    for s in P.segs:
        if s["seg"] not in names:
            continue
        y = x[int(s["start"] * sr): int((s["start"] + s["dur"]) * sr)]
        rms = 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-12)
        if rms < -50:
            why.append(f"{s['seg']} 声音静音（{rms:.0f} dB）")
        if np.mean(np.abs(y) > .999) > .001:
            why.append(f"{s['seg']} 声音削波")
    return why


def mux(video, wav, dest):
    subprocess.run([R.ffmpeg(), "-y", "-loglevel", "error", "-i", str(video), "-i", str(wav), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-map_metadata", "-1", "-fflags", "+bitexact",
                    "-flags:a", "+bitexact", "-metadata:s:v:0", "encoder=", "-metadata:s:a:0", "encoder=",
                    "-movflags", "+faststart", str(dest)], check=True)


def typical(P, force, jobs):
    if not P.typical:
        raise Stop("分镜里没有段标 typical")
    code = run_segments(P, P.typical, False, force, jobs, None)
    from scipy.io import wavfile
    import synth
    x, sr = mixdown(P)
    (P.d / "typical").mkdir(exist_ok=True)
    for nm in P.typical:
        s = P.seg(nm)
        y = x[int(round(s["start"] * sr)): int(round((s["start"] + s["dur"]) * sr))].copy()
        t = np.arange(len(y)) / sr
        y *= (np.clip(t / .02, 0, 1) * np.clip((s["dur"] - t) / .3, 0, 1))[:, None]
        y, lu, tp = master(y, sr)
        wav = P.out / f"typical-{nm}.wav"
        wavfile.write(wav, synth.SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))
        dest = P.d / "typical" / f"{nm}-{P.ar}.mp4"
        mux(P.out / "seg" / f"{nm}.mp4", wav, dest)
        wav.unlink()
        shutil.copy(P.out / "sheets" / f"{nm}.jpg", P.d / "typical" / f"{nm}-{P.ar}.jpg")
        lu2, tp2 = probe_loud(dest)
        sec = P.sec.get(nm)
        print(f"典型样片 {os.path.relpath(dest, Path.cwd())}：{s['dur']:.2f}s（分镜 {sec}s），{lu2:.1f} LUFS，真峰值 {tp2:.1f} dBTP，"
              f"音色 {(P.T.get('voice') or {}).get('voice', '无旁白')}")
    return code


def join(P):
    seg = P.out / "seg"
    names = [s["seg"] for s in P.segs]
    stale = [nm for nm in names if not (seg / f"{nm}.json").exists() or json.loads((seg / f"{nm}.json").read_text())["hash"] != P.fingerprint(nm)]
    if stale:
        raise Stop(f"这些段没渲染或改过：{'、'.join(stale)}，先跑 python3 tools/film.py <目录> all", 1)
    lst = P.out / "concat.txt"
    lst.write_text("".join(f"file '{(seg / f'{nm}.mp4').as_posix()}'\n" for nm in names), encoding="utf-8")
    silent = P.out / "video.mp4"
    subprocess.run([R.ffmpeg(), "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(silent)], check=True)
    wav = P.out / "mix.wav"
    with heavy.slot("混音"):
        mix, sr, lu0, tp0 = write_mix(P, wav)
    dest = P.out / f"{P.short}-{P.ar}.mp4"
    mux(silent, wav, dest)
    silent.unlink(); lst.unlink()
    # 整片自检
    rows, why = [], []
    real = R.mp4_duration(dest) or 0
    vdur = float(ffprobe("-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "csv=p=0", str(dest)).strip() or 0)
    if abs(vdur - P.dur) >= 1 / P.fps:
        why.append(f"总时长 {vdur:.3f}s ≠ 各段之和 {P.dur:.3f}s")
    bl = blacks(dest)
    if bl:
        why.append(f"有 {len(bl)} 处 0.05 秒以上的黑段：" + "、".join(f"{a:.2f}–{b:.2f}s" for a, b in bl[:5]))
    nf, jitter = frame_gaps(dest, P.fps)
    if jitter > .5 / P.fps:
        why.append(f"帧间隔不均（最多偏 {jitter * 1000:.1f} 毫秒）")
    lu, tp = probe_loud(dest)
    if abs(lu - LUFS) > 1:
        why.append(f"响度 {lu:.1f} LUFS，不在 {LUFS:g} ± 1")
    if tp > TP:
        why.append(f"真峰值 {tp:.1f} dBTP > {TP:g}")
    from scipy.io import wavfile
    _, y = wavfile.read(wav)
    worst, off = align(P, y.astype(np.float32) / 32768, sr)
    if off:
        why.append("旁白和 timing.json 对不上：" + "；".join(off[:4]))
    for s in P.segs:
        rows.append(f"| {s['seg']} | {P.sec.get(s['seg'], '')} | {s['dur']:.2f} | {s['start']:.2f} | [抽帧](sheets/{s['seg']}.jpg) |")
    v = P.T.get("voice") or {}
    rep = [f"# {P.short} 整片报告", "", f"- 成片：`{dest.name}`（{P.ar.replace('x', ':')}，{P.fps} fps，{nf} 帧，{real:.2f} 秒，"
           f"{dest.stat().st_size / 1e6:.1f} MB）",
           f"- 音色：{v.get('voice', '无旁白')}（{v.get('model', '')}，语速 {v.get('speed', '')}）" if v else "- 音色：无旁白",
           f"- 响度：{lu:.1f} LUFS，真峰值 {tp:.1f} dBTP（目标 {LUFS:g} ± 1 LUFS、≤ {TP:g} dBTP）",
           f"- 黑段（0.05 秒以上）：{len(bl)} 处；帧间隔最多偏 {jitter * 1000:.1f} 毫秒；旁白位置最多偏 {worst * 1000:.0f} 毫秒",
           f"- 检查：{'全部通过' if not why else '；'.join(why)}", "",
           "| 段 | 分镜 sec | 实际秒数 | 起点 | 抽帧 |", "|---|---|---|---|---|", *rows, "",
           f"合计 {P.dur:.2f} 秒"]
    (P.out / "report.md").write_text("\n".join(rep) + "\n", encoding="utf-8")
    print("\n".join(rep[2:7]))
    print(f"{'✓' if not why else '✗'} {os.path.relpath(dest, Path.cwd())}，报告 {os.path.relpath(P.out / 'report.md', Path.cwd())}")
    return 1 if why else 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="完整出片的整片工具：分段渲染、检查、接片、混音、自检")
    ap.add_argument("dir", help="用户项目的 videos/<短名>/")
    ap.add_argument("segs", nargs="*", help="段号（P2 P3），all 是全部")
    ap.add_argument("--quick", action="store_true", help="每 2 秒半分辨率抽一帧，检查，出总览图")
    ap.add_argument("--typical", action="store_true", help="typical 标的段各出一支带声音的典型样片")
    ap.add_argument("--join", action="store_true", help="接片、混音、整片自检")
    ap.add_argument("--sound", action="store_true", help="只混整片的声音到 out/mix.wav")
    ap.add_argument("--force", action="store_true", help="没变的段也重渲")
    ap.add_argument("-j", type=int, default=1, help="并行渲染几段（默认 1；4 核 15 GB 的机器最多 2）")
    ap.add_argument("--max-mb", type=float, help="每段视频的体积上限（MB）")
    a = ap.parse_args(argv)
    try:
        P = Project(a.dir)
        if a.sound:
            _, _, lu, tp = write_mix(P, P.out / "mix.wav")
            print(f"整片声音 {P.dur:.1f} 秒 → {os.path.relpath(P.out / 'mix.wav', Path.cwd())}（{lu:.1f} LUFS，真峰值 {tp:.1f} dBTP）")
            return 0
        if a.typical:
            return typical(P, a.force, a.j)
        if a.join:
            return join(P)
        names = [s["seg"] for s in P.segs] if a.segs in (["all"], []) else a.segs
        if not a.segs:
            raise Stop("写段号（P2）或 all；接片用 --join")
        return run_segments(P, names, a.quick, a.force, a.j, a.max_mb)
    except Stop as e:
        print(f"✗ {e}")
        return e.code


if __name__ == "__main__":
    sys.exit(main())
