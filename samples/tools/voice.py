"""完整出片的配音：合成旁白、切句、排段长和分镜的起止，回听。输入是用户项目的 videos/<短名>/（分镜脚本、逐字稿），见 Skill 的 sound.md「完整出片的配音流程」。

    python3 tools/voice.py ../videos/<短名> --dry-run   # 要请求几次、多少字；不请求
    python3 tools/voice.py ../videos/<短名>             # 合成缺的句子、切句、写 timing.json
    python3 tools/voice.py ../videos/<短名> --check     # 回听：逐句识别，和稿子比读音
    python3 tools/voice.py ../videos/<短名> --import 整稿.mp3 --subs 字幕.json   # 已有的整稿录音读进缓存，不重配

合成只走 AICV_TTS_CMD（约定见 tools/gen.py；本地 Kokoro 用 tools/adapters/kokoro.py）。音色取分镜脚本的 unify.voice {"model", "voice", "speed"}。
一段里连着缺的句子请求一次，按返回的逐字时间切回每句；改了一句，只合成那一句（句子池 vo/cache/pool/：同音色、同语速、同文字的复用）。
请求超过 --max-chars（默认 3000 字）或 --max-requests（默认 20 次）的，不加 --yes 就停，退出码 2。

产物：vo/<段号>_<两位句号>.wav（每句一个）、vo/cache/（每次请求的原样返回和句子池）、vo/usage.jsonl（每次请求一行）、
timing.json（每段的段长、每句的起止和逐字时间）。适配命令的日志写在 out/log/（可能有任务编号，不提交）。
退出码：0 通过；1 有问题（切点落在发音上、回听不一致…）；2 停下没做（超过预估上限、读不了）。
"""
import argparse
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.request
from pathlib import Path

import numpy as np
from scipy.io import wavfile

TOOLS = Path(__file__).resolve().parent
sys.path.insert(0, str(TOOLS))
import gen  # noqa: E402
import heavy  # noqa: E402
for _p in (TOOLS.parent.parent / "scripts", TOOLS.parent.parent / "skills" / "ai-coding-video" / "scripts"):
    if (_p / "check_storyboard.py").is_file():   # 装好的 Skill 里在 samples/ 旁边；本仓库里在 skills/ai-coding-video/
        sys.path.insert(0, str(_p))
        break
from check_storyboard import layout  # noqa: E402  分镜的起止和检查脚本同一套算法

SR = 24000
FPS = 30
QUIET = -45            # 停顿的电平（dB）；切出来的每句首尾 EDGE 秒也要低于它
EDGE = 0.03
PAD = 0.06             # 每句有声部分前后各留几秒（落在停顿里）
HOP = 0.005
MIN_PAUSE = 0.06
PACE = {"lead": 0.6, "gap": 0.3, "tail": 0.8, "min": 0}
WARN_SEC = 0.2         # 算出的段长和段的 sec 差这么多（比例）就提醒
PUNCT = re.compile(r"[\s，。！？；：、,.!?;:—…·“”\"'‘’（）()《》【】\-]")
ASR_URL = ("https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/"
           "sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17.tar.bz2")


class Stop(Exception):
    """停下：code 1 有问题，2 没做"""
    def __init__(self, msg, code=1):
        super().__init__(msg); self.code = code


# ---------- 读项目 ----------

def load(d):
    try:
        sb = json.loads((d / "storyboard.json").read_text(encoding="utf-8"))
        sc = json.loads((d / "script.json").read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        raise Stop(f"读不了 {d} 的 storyboard.json、script.json：{e}", 2)
    if len(sb.get("segments", [])) != len(sc.get("segments", [])):
        raise Stop("逐字稿和分镜脚本的段数不一样，先跑 check_storyboard.py", 2)
    v = (sb.get("unify") or {}).get("voice")
    if isinstance(v, str):
        raise Stop('unify.voice 要写成对象 {"model": …, "voice": …, "speed": …}（无旁白写 null），见 film.md「分镜脚本」', 2)
    if v is not None:
        v = {"model": os.environ.get("AICV_TTS_MODEL") or v.get("model") or "",       # gen.py 认的覆盖，也算进句子池的键
             "voice": os.environ.get("AICV_TTS_VOICE") or v.get("voice") or "", "speed": float(v.get("speed") or 1)}
    return sb, sc, v


def segments(sb, sc):
    """[(段号, 段的 sec, 句子, pace, 分镜 shots 或 None)]"""
    out = []
    for a, b in zip(sb["segments"], sc["segments"]):
        out.append((a["seg"], a.get("sec"), [s for s in b.get("vo", []) if s.strip()], {**PACE, **(b.get("pace") or {})},
                    a.get("shots")))
    return out


def bare(s):
    return PUNCT.sub("", s)


def show(s, table):
    for k, v in table.items():
        s = s.replace(k, v)
    return s


def key(v, text):
    return hashlib.sha1(json.dumps([v["model"], v["voice"], v["speed"], text], ensure_ascii=False).encode()).hexdigest()[:16]


# ---------- 声音 ----------

def ffmpeg():
    if shutil.which("ffmpeg"):
        return shutil.which("ffmpeg")
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def read(path, sr=SR):
    raw = subprocess.run([ffmpeg(), "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def write(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(path, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))


def db(x):
    return float(20 * np.log10(np.sqrt(np.mean(x.astype(np.float64) ** 2)) + 1e-9)) if len(x) else -200.0


def levels(x):
    """每 HOP 秒里的峰值电平（dB）。用峰值不用均方根：句尾轻的余音、轻起的辅音均方根已低于 QUIET，峰值还在，不算进停顿"""
    n = int(HOP * SR); m = len(x) // n
    r = np.abs(x[: m * n].reshape(m, n)).max(axis=1).astype(np.float64)
    return 20 * np.log10(r + 1e-9)


def pauses(lv, quiet=QUIET):
    """低于 quiet、至少 MIN_PAUSE 秒的停顿 [(起, 止)]，秒"""
    q = np.concatenate([[False], lv < quiet, [False]])
    d = np.diff(q.astype(int))
    st, en = np.where(d == 1)[0], np.where(d == -1)[0]
    return [(a * HOP, b * HOP) for a, b in zip(st, en) if (b - a) * HOP >= MIN_PAUSE]


def voiced(lv):
    on = np.where(lv >= QUIET)[0]
    return (on[0] * HOP, (on[-1] + 1) * HOP) if len(on) else (0.0, len(lv) * HOP)


def edges(x):
    n = int(EDGE * SR)
    return max(db(x[:n]), db(x[-n:]))


# ---------- 切句 ----------

def char_times(sents, subs):
    """字幕 → 每个字（去掉标点后的第几个字）的 (起, 止)；对不上稿子的返回 None。没有逐字时间的按行里的字数均分"""
    want = sum(len(bare(s)) for s in sents)
    if not subs or sum(len(bare(l.get("text", ""))) for l in subs) != want:
        return None
    out = []
    for l in subs:
        txt, n = l["text"], len(bare(l["text"]))
        ws = l.get("words") or []
        if ws:
            per = [None] * n
            for w in ws:
                b = len(bare(txt[: w["begin"]])); e = len(bare(txt[: w["end"]]))
                for k in range(b, min(e, n)):
                    f0 = (k - b) / max(e - b, 1); f1 = (k - b + 1) / max(e - b, 1)
                    per[k] = (w["t0"] + (w["t1"] - w["t0"]) * f0, w["t0"] + (w["t1"] - w["t0"]) * f1)
            last = l["t0"]
            for k in range(n):                               # 没覆盖到的字（标点前后）接在前一个字后面
                per[k] = per[k] or (last, last); last = per[k][1]
            out += per
        else:
            d = (l["t1"] - l["t0"]) / max(n, 1)
            out += [(l["t0"] + k * d, l["t0"] + (k + 1) * d) for k in range(n)]
    return out, bool(any(l.get("words") for l in subs))


def find_cut(lv, est, lo, hi):
    """句界：从时间戳 est 往后找声音真正停下的地方（时间戳常偏早），返回 (本句止, 下句起, 准不准)"""
    for quiet in (QUIET, QUIET + 5):                         # 停顿里有点底噪的，放宽 5 dB 再找
        for a, b in pauses(lv, quiet):
            if b > est and a <= est + 0.8 and a > lo and b < hi:      # 头一个盖住或跟在 est 后面的停顿
                return a, b, True
    i0, i1 = int(max(lo, est - 0.2) / HOP), int(min(hi, est + 0.8) / HOP)   # 找不到够静的：在最静处切，不切在字中间
    w = max(1, int(EDGE / HOP))
    if i1 - i0 <= w:
        return est, est, False
    s = np.convolve(10 ** (lv[i0:i1] / 10), np.ones(w), "valid")
    c = (i0 + int(np.argmin(s)) + w / 2) * HOP
    return c, c, False


def cut(x, sents, subs, shown=None):
    """一次请求的音频切回每句：[(片段, 前留, 后留, 逐字时间)]；切不准（没有字幕又找不到够多的停顿）返回 None。
    字幕是屏幕上的写法（shown：念法换成写法后的句子，如「406,771 公里」）的也认，只是不出逐字时间"""
    lv = levels(x)
    v0, v1 = voiced(lv)
    base = sents
    ct = char_times(sents, subs)
    if ct is None and shown and shown != sents:
        ct = char_times(shown, subs)
        if ct:
            base, ct = shown, (ct[0], False)
    ends = np.cumsum([len(bare(s)) for s in base])
    bounds, rough = [], []
    if ct:
        times, has_words = ct
        lo = v0
        for k in range(len(sents) - 1):
            est = times[ends[k] - 1][1]
            nxt = times[ends[k]][0]
            a, b, ok = find_cut(lv, est, lo, max(nxt + 0.8, est + 0.9))
            bounds.append((a, b)); lo = b
            if not ok:
                rough.append(k)
    elif len(sents) > 1:                                     # 没有字幕：按句数在停顿里切，每个句界取预计位置附近最长的停顿
        times, has_words = None, False
        ps = [p for p in pauses(lv) if p[0] > v0 and p[1] < v1]
        lo = v0
        for k in range(len(sents) - 1):
            exp = v0 + (v1 - v0) * ends[k] / ends[-1]
            near = [p for p in ps if p[0] > lo and abs((p[0] + p[1]) / 2 - exp) < 0.15 * (v1 - v0)]
            if not near:
                return None
            p = max(near, key=lambda p: p[1] - p[0])
            bounds.append(p); lo = p[1]
    else:
        times, has_words = None, False
    starts = [v0] + [b for _, b in bounds]
    stops = [a for a, _ in bounds] + [v1]
    out = []
    for k, (s0, s1) in enumerate(zip(starts, stops)):
        pre = min(PAD, (s0 - stops[k - 1]) / 2) if k else PAD
        post = min(PAD, (starts[k + 1] - s1) / 2) if k + 1 < len(sents) else PAD
        a, b = int(round((s0 - pre) * SR)), int(round((s1 + post) * SR))
        clip = x[max(0, a): min(len(x), b)]
        clip = np.concatenate([np.zeros(max(0, -a), np.float32), clip, np.zeros(max(0, b - len(x)), np.float32)])
        chars = []
        if times and has_words:                              # 逐字时间：text[i:j] 在本句片段里第 s 秒起、念 d 秒
            raw = sents[k]
            idx = [i for i, ch in enumerate(raw) if not PUNCT.match(ch)]
            base = ends[k - 1] if k else 0
            for n, i in enumerate(idx):
                t0, t1 = times[base + n]
                chars.append({"i": i, "j": i + 1, "s": round(max(0.0, t0 - (s0 - pre)), 3), "d": round(max(0.0, t1 - t0), 3)})
        out.append((clip, pre, post, chars))
    if rough:
        print(f"！这些句界附近没有够静的停顿，在最静处切：{[sents[k][:12] for k in rough]}")
    return out


# ---------- 合成 ----------

def plan(d, sb, sc, v):
    """要请求的：[(段号, [句子])]，一段里连着缺的句子一次；以及池里已有的句数"""
    pool = d / "vo" / "cache" / "pool"
    reqs, have = [], 0
    if v is None:
        return reqs, have
    for seg, _, sents, _, _ in segments(sb, sc):
        run = []
        for s in sents:
            if (pool / f"{key(v, s)}.json").exists():
                have += 1
                if run:
                    reqs.append((seg, run)); run = []
            elif s not in run:
                run.append(s)
        if run:
            reqs.append((seg, run))
    return reqs, have


def request(d, v, seg, sents, table=None):
    """一次请求：原样返回存进 vo/cache/req/<哈希>/，切好的句子存进句子池。已请求过（中途停下的）直接用缓存"""
    rk = hashlib.sha1(json.dumps([v, sents], ensure_ascii=False).encode()).hexdigest()[:12]
    work = d / "vo" / "cache" / "req"
    got = work / rk / "result.json"
    if got.exists():
        res = json.loads(got.read_text(encoding="utf-8"))
        audio = work / rk / res["file"]
        subs = json.loads((work / rk / res["subs"]).read_text(encoding="utf-8")) if res.get("subs") else None
    else:
        job = {"model": v["model"], "voice": v["voice"], "text": "".join(sents), "sentences": sents,
               "params": {"speed": v["speed"]}}
        try:
            r = gen.generate("tts", "voice", rk, job, work=work, logdir=d / "out" / "log")
        except RuntimeError as e:
            raise Stop(f"语音合成失败（{seg}）：{e}")
        audio, sp = r
        subs = json.loads(sp.read_text(encoding="utf-8")) if sp else None
        dest = work / rk
        if not audio.is_relative_to(dest):                    # 适配命令写到别处的，拷进缓存
            shutil.copy(audio, dest / audio.name); audio = dest / audio.name
        if sp and not sp.is_relative_to(dest):
            shutil.copy(sp, dest / sp.name); sp = dest / sp.name
        got.write_text(json.dumps({"file": audio.name, "subs": sp.name if sp else None}), encoding="utf-8")
        x = read(audio)
        with open(d / "vo" / "usage.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps({"at": time.strftime("%Y-%m-%d %H:%M:%S"), "seg": seg, "chars": len(bare("".join(sents))),
                                "dur": round(len(x) / SR, 2)}, ensure_ascii=False) + "\n")
    x = read(audio)
    parts = cut(x, sents, subs, [show(s, table or {}) for s in sents])
    if parts is None:
        return False
    pool = d / "vo" / "cache" / "pool"
    for s, (clip, pre, post, chars) in zip(sents, parts):
        k = key(v, s)
        write(pool / f"{k}.wav", clip)
        (pool / f"{k}.json").write_text(json.dumps({"text": s, **v, "t": round(len(clip) / SR, 3), "pre": round(pre, 3),
                                                    "post": round(post, 3), "chars": chars, "req": rk},
                                                   ensure_ascii=False), encoding="utf-8")
    return True


def take(d, sb, sc, v, audio, subs):
    """已有的整稿录音（--import）当成一次覆盖全部段的请求放进缓存，切进句子池；不请求、不花钱"""
    if v is None:
        raise Stop("分镜脚本的 unify.voice 是 null（无旁白），不能导入录音", 2)
    sents = [s for _, _, ss, _, _ in segments(sb, sc) for s in ss]
    rk = hashlib.sha1(json.dumps([v, sents], ensure_ascii=False).encode()).hexdigest()[:12]
    dest = d / "vo" / "cache" / "req" / rk
    dest.mkdir(parents=True, exist_ok=True)
    try:
        shutil.copy(audio, dest / f"take{audio.suffix}")
        if subs:
            shutil.copy(subs, dest / "take-subs.json")
    except OSError as e:
        raise Stop(f"读不了要导入的录音、字幕：{e}", 2)
    (dest / "result.json").write_text(json.dumps({"file": f"take{audio.suffix}", "subs": "take-subs.json" if subs else None,
                                                  "import": audio.name}, ensure_ascii=False), encoding="utf-8")
    if not request(d, v, "导入", sents, sc.get("show")):
        raise Stop("导入的录音切不回每句：没有字幕，停顿也对不上句数；给 --subs 字幕（格式同适配命令返回的）", 2)
    print(f"导入 {audio.name}：{len(sents)} 句放进句子池")


def frames_up(x):
    return math.ceil(x * FPS - 1e-6) / FPS


def assemble(d, sb, sc, v):
    """句子池 → vo/<段号>_<句号>.wav 和 timing.json（段长、每句的起止、分镜的起止）；切点落在发音上的报错"""
    pool, vo = d / "vo" / "cache" / "pool", d / "vo"
    table = sc.get("show") or {}
    segs, bad, keep, notes, cramped = [], [], set(), [], []
    for k, (seg, sec, sents, p, shots) in enumerate(segments(sb, sc), 1):
        items, at = [], None
        for n, s in enumerate(sents, 1):
            k = key(v, s)
            meta = json.loads((pool / f"{k}.json").read_text(encoding="utf-8"))
            f = vo / f"{seg}_{n:02d}.wav"
            src = pool / f"{k}.wav"
            if not f.exists() or f.read_bytes() != src.read_bytes():
                shutil.copy(src, f)
            keep.add(f.name)
            e = edges(read(f))
            if e > QUIET:
                bad.append(f"{f.name}（{e:.1f} dB）")
            at = p["lead"] - meta["pre"] if at is None else at + p["gap"] - meta["pre"]
            it = {"file": f"vo/{f.name}", "at": round(at, 3), "t": meta["t"], "text": s, "show": show(s, table)}
            if meta["chars"]:
                it["chars"] = [{**c, "s": round(at + c["s"], 3)} for c in meta["chars"]]
            items.append(it)
            at += meta["t"] - meta["post"]                   # at 现在是本句有声部分的结束
        end = (at + p["tail"]) if items else (sec or 0)
        dur = frames_up(max(p["min"], end))
        if sec and abs(dur - sec) > WARN_SEC * sec:
            notes.append(f"{seg} 算出 {dur:.1f} 秒，段的 sec 写 {sec} 秒（差 {(dur - sec) / sec:+.0%}）：照实改 sec")
        row = {"seg": seg, "dur": round(dur, 3), "vo": items}
        if shots:
            spans, e = layout(shots, dur, [it["at"] for it in items], FPS)
            cramped += [f"第 {k} 段（{seg}）{x}" for x in e]
            fixed = [x.get("sec") for x in shots]
            if all(isinstance(x, (int, float)) for x in fixed) and abs(sum(fixed) - dur) > 1 / FPS:
                notes.append(f"{seg} 分镜秒数合计 {sum(fixed):g}，段长 {dur:.2f}：最后一个分镜排成 "
                             f"{spans[-1][1] - spans[-1][0]:.2f} 秒；照实改分镜的 sec，或改成随旁白（不写 sec）")
            row["shots"] = [{"t0": round(a, 3), "t1": round(b, 3), "cut": x.get("cut") or "硬切"}
                            for (a, b), x in zip(spans, shots)]
        segs.append(row)
    for f in vo.glob("*_[0-9][0-9].wav"):                    # 稿子删掉、挪走的句子
        if f.name not in keep:
            f.unlink()
    if bad:
        raise Stop(f"这些句子的切点落在发音上（首尾 {EDGE * 1000:.0f} 毫秒高于 {QUIET} dB），会听到断句：{'、'.join(bad)}")
    (d / "timing.json").write_text(json.dumps({"fps": FPS, "voice": v, "segments": segs}, ensure_ascii=False, indent=1) + "\n",
                                   encoding="utf-8")
    if cramped:
        raise Stop("timing.json 写好了，但这些分镜排不开，改分镜脚本的 sec 或 vo 再跑一次：" + "；".join(cramped))
    return segs, notes


def synth(d, a):
    sb, sc, v = load(d)
    if a.take:
        take(d, sb, sc, v, Path(a.take).resolve(), Path(a.subs).resolve() if a.subs else None)
    reqs, have = plan(d, sb, sc, v)
    chars = sum(len(bare("".join(s))) for _, s in reqs)
    if reqs:
        detail = "、".join(f"{seg} {len(s)} 句" for seg, s in reqs)
        print(f"要请求 {len(reqs)} 次，共 {chars} 字（{detail}）；句子池里已有 {have} 句")
    else:
        print(f"不用请求：{'无旁白' if v is None else f'全部 {have} 句都在句子池里'}")
    if a.dry_run:
        return 0
    if reqs and (chars > a.max_chars or len(reqs) > a.max_requests) and not a.yes:
        print(f"超过上限（{a.max_chars} 字、{a.max_requests} 次）：确认后加 --yes 再跑，或调 --max-chars、--max-requests")
        return 2
    if reqs and gen.missing("tts"):
        raise Stop(gen.missing("tts"), 2)
    for seg, sents in reqs:
        if not request(d, v, seg, sents, sc.get("show")):
            print(f"！{seg} 的 {len(sents)} 句没有字幕、停顿也对不上句数，改成一句一次请求")
            for s in sents:
                if not request(d, v, seg, [s], sc.get("show")):
                    raise Stop(f"{seg}「{s[:12]}」切不出来")
    segs, notes = assemble(d, sb, sc, v)
    for n in notes:
        print("！" + n)
    tot = sum(s["dur"] for s in segs)
    print("  ".join(f"{s['seg']} {s['dur']:.2f}s" for s in segs))
    print(f"合计 {tot:.1f} 秒，{sum(len(s['vo']) for s in segs)} 句 → timing.json")
    return 0


# ---------- 回听 ----------

DIG = "零一二三四五六七八九"


def num_zh(n):
    """整数的念法（10 念「十」，不念「一十」）"""
    def four(g):
        out, zero = "", False
        for i, u in ((3, "千"), (2, "百"), (1, "十"), (0, "")):
            q = g // 10 ** i % 10
            if q:
                out += ("零" if zero else "") + DIG[q] + u; zero = False
            elif out:
                zero = True
        return out
    if n == 0:
        return "零"
    out, gap = "", False
    for big, name in ((10 ** 8, "亿"), (10 ** 4, "万"), (1, "")):
        g = n // big % 10000 if big < 10 ** 8 else n // big
        if not g:
            gap = bool(out); continue
        out += ("零" if out and (g < 1000 or gap) else "") + four(g) + name; gap = False
    return out[1:] if out.startswith("一十") else out


def readings(text):
    """文字里的阿拉伯数字的两种念法：按数念（四百零六）、逐位念（四零六）"""
    pat = re.compile(r"(\d+(?:\.\d+)?)(%?)")
    def say(m, digitwise):
        a, _, b = m.group(1).partition(".")
        s = "".join(DIG[int(c)] for c in a) if digitwise else num_zh(int(a))
        if b:
            s += "点" + "".join(DIG[int(c)] for c in b)
        return ("百分之" + s) if m.group(2) else s
    return {pat.sub(lambda m: say(m, False), text), pat.sub(lambda m: say(m, True), text)}


def tokens(text, script=False):
    """无声调拼音的字串；稿子里两个以上字母的英文词换成通配（只查那里听到了东西）"""
    from pypinyin import lazy_pinyin
    out = []
    for m in re.finditer(r"[一-鿿]+|[A-Za-z]+|\d", text):
        s = m.group()
        if s[0].isascii() and s[0].isalpha():
            out.append(("*" + s) if script and len(s) >= 2 else s.lower())
        else:
            out += [{"liang": "er"}.get(p, p) for p in lazy_pinyin(s) if p != "ling"]   # 二、两不分；「零」念不念都算对
    return out


def matches(want, heard):
    """稿子的拼音和听到的比；返回 None（对不上）或通配处听到的东西"""
    pat = "".join(r"((?:\S+ )+?)" if t.startswith("*") else re.escape(t) + " " for t in want)
    m = re.fullmatch(pat, " ".join(heard) + " " if heard else "")
    return None if m is None else [g.strip() for g in m.groups()]


class Ear:
    def __init__(self, lang):
        self.lang = lang
        if lang == "zh":
            try:
                import sherpa_onnx
            except ImportError:
                raise Stop("回听要 sherpa-onnx：pip install sherpa-onnx pypinyin", 2)
            root = Path(os.environ.get("AICV_MODELS") or Path.home() / ".cache" / "aicv" / "models")
            name = ASR_URL.rsplit("/", 1)[1][: -len(".tar.bz2")]
            m = root / name
            if not (m / "model.int8.onnx").exists():
                root.mkdir(parents=True, exist_ok=True)
                print(f"首次回听：下载 SenseVoice 模型到 {root}（约 160 MB，解开约 230 MB）")
                tmp = root / f"{name}.tar.bz2"
                urllib.request.urlretrieve(ASR_URL, tmp)
                with tarfile.open(tmp) as t:
                    t.extractall(root, filter="data")
                tmp.unlink()
            self.r = sherpa_onnx.OfflineRecognizer.from_sense_voice(
                model=str(m / "model.int8.onnx"), tokens=str(m / "tokens.txt"), language="zh", use_itn=False,
                num_threads=min(4, os.cpu_count() or 1))
        else:
            try:
                from faster_whisper import WhisperModel
            except ImportError:
                raise Stop("中文以外的回听要 faster-whisper：pip install faster-whisper", 2)
            self.w = WhisperModel("small", device="cpu", compute_type="int8")

    def hear(self, path):
        if self.lang == "zh":
            s = self.r.create_stream()
            s.accept_waveform(16000, read(path, 16000))
            self.r.decode_stream(s)
            return re.sub(r"<\|[^|]*\|>", "", s.result.text).strip()
        segs, _ = self.w.transcribe(str(path), language=self.lang)
        return "".join(x.text for x in segs).strip()


def compare(want_text, heard_text, heard_map):
    for word, alts in heard_map.items():                     # 识别器总听错的词：换回稿子的写法再比
        if word in want_text:
            for alt in alts:
                heard_text = heard_text.replace(alt, word)
    if want_text.isascii() and tokens(want_text, True):                         # 整句外文：不比拼音，比词
        w = re.findall(r"[a-z0-9']+", want_text.lower()); h = re.findall(r"[a-z0-9']+", heard_text.lower())
        return [] if w == h else None
    for w in readings(want_text):                            # 稿子和听到的阿拉伯数字都按两种念法试
        for r in readings(heard_text):
            got = matches(tokens(w, True), tokens(r))
            if got is not None:
                return got
    return None


def check(d):
    sb, sc, v = load(d)
    tf = d / "timing.json"
    if not tf.exists():
        raise Stop("还没有 timing.json：先跑 python3 tools/voice.py <目录>", 2)
    T = json.loads(tf.read_text(encoding="utf-8"))
    done = {s["seg"]: [it["text"] for it in s["vo"]] for s in T["segments"]}   # 回听比的是配好的句子，先核它们还是不是现在的稿子
    stale = [f"{seg} 没配「{s}」" for seg, _, sents, _, _ in segments(sb, sc) for s in sents if s not in done.get(seg, [])]
    stale += [f"{seg} 多了「{s}」" for seg, _, sents, _, _ in segments(sb, sc) for s in done.get(seg, []) if s not in sents]
    if stale:
        raise Stop("稿子改了还没重配，先跑 python3 tools/voice.py <目录>：\n  " + "\n  ".join(stale), 1)
    lang = (sb.get("brief") or {}).get("lang") or "zh"
    heard_map = sc.get("heard") or {}
    items = [(s["seg"], it) for s in T["segments"] for it in s["vo"]]
    with heavy.slot("回听"):
        ear = Ear(lang)
        res = [(seg, it, ear.hear(d / it["file"])) for seg, it in items]
    ok = [compare(it["text"], h, heard_map) for _, it, h in res]
    moved = set()
    for k in range(len(res) - 1):                            # 只因一个字挪到相邻句：切句问题，单独报
        if res[k][0] == res[k + 1][0] and (ok[k] is None or ok[k + 1] is None):
            if compare(res[k][1]["text"] + res[k + 1][1]["text"], res[k][2] + res[k + 1][2], heard_map) is not None:
                moved |= {k, k + 1}
    bad, ask = 0, []
    for k, ((seg, it, h), got) in enumerate(zip(res, ok)):
        name = Path(it["file"]).name
        if k in moved and got is None:
            print(f"✗ {name} 跨句挪字（切句问题，不是读音）\n    稿子 {it['text']}\n    听到 {h}")
        elif got is None:
            bad += 1
            print(f"✗ {name} 读音对不上\n    稿子 {it['text']}\n    听到 {h}")
        else:
            words = re.findall(r"[A-Za-z]{2,}", it["text"])
            if words:
                ask.append(f"{name}：{'、'.join(f'{w} 听到「{g}」' for w, g in zip(words, got))}")
    if ask:
        print("请人听这些英文词：\n  " + "\n  ".join(ask))
    nm = len([k for k in moved if ok[k] is None])
    if nm:
        print(f"{nm} 句跨句挪字：重切那一段（删掉 vo/cache/pool/ 里那几句再跑 voice.py），不用改稿子")
    print(f"回听 {len(res)} 句（{'SenseVoice' if lang == 'zh' else 'faster-whisper'}）")
    print(f"{bad} 句不一致")
    return 1 if bad or nm else 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="完整出片的配音：合成、切句、排段长、回听")
    ap.add_argument("dir", help="用户项目的 videos/<短名>/")
    ap.add_argument("--dry-run", action="store_true", help="只打印要请求几次、多少字，不请求")
    ap.add_argument("--check", action="store_true", help="回听：逐句识别，和稿子比读音")
    ap.add_argument("--yes", action="store_true", help="超过预估上限也照样请求")
    ap.add_argument("--max-chars", type=int, default=3000)
    ap.add_argument("--max-requests", type=int, default=20)
    ap.add_argument("--import", dest="take", metavar="录音", help="已有的整稿录音当成一次覆盖全部段的请求读进缓存，不重配")
    ap.add_argument("--subs", metavar="字幕.json", help="--import 的录音的字幕：[{t0, t1, text, words 可选}]，写法可以是屏幕上的")
    a = ap.parse_args(argv)
    d = Path(a.dir).resolve()
    try:
        return check(d) if a.check else synth(d, a)
    except Stop as e:
        print(f"✗ {e}")
        return e.code


if __name__ == "__main__":
    sys.exit(main())
