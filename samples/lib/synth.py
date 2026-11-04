"""样片的声音。1 级（C 类）全部用代码合成的电子音，不用任何录音素材、曲库或声音模型，所以没有版权问题。

每个样片的 <编号>/sound.py 写一个 score(m) 函数，用这里的乐器往混音台 m 上放音符；
render.py 调它生成 44.1 kHz 立体声，再和视频合在一起。同样的代码每次合成的声音完全一样。
乐器改写自 opus40 的 audio.py，另加了拨弦、钟、方波、风声、木鱼等。
T 类、G 类的样片不用这些电子音：用 load() 读 assets/ 里的旁白、配乐、音效（出处和许可记在 assets.json），
一般直接调 assets(m, 样片目录)，照 assets.json 摆好。
"""
import json
import shutil
import subprocess
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt, sawtooth

SR = 44100


def hz(n):
    """MIDI 音高 → 频率（69 = A4 = 440 Hz）"""
    return 440 * 2 ** ((n - 69) / 12)


def tt(d):
    """d 秒的时间轴数组（采样点对应的秒数）"""
    return np.arange(int(d * SR)) / SR


def filt(x, kind, f, order=2):
    """巴特沃斯滤波：kind 为 "low"、"high"、"band"（f 传 [低, 高]）"""
    return sosfilt(butter(order, f, btype=kind, fs=SR, output="sos"), x)


class Mix:
    """混音台：put(声音, 时刻, 音量, 声像)；最后 master() 得到归一化的立体声。"""

    def __init__(self, dur, seed=7):
        self.dur = dur
        self.buf = np.zeros((int((dur + 2) * SR), 2))
        self.rng = np.random.default_rng(seed)

    def noise(self, d):
        """d 秒白噪声（用混音台自己的种子，结果固定）"""
        return self.rng.uniform(-1, 1, int(d * SR))

    def put(self, x, t, g=1.0, pan=0.0):
        """在 t 秒处放入声音 x，音量 g，声像 pan（-1 左 … 1 右）"""
        i = int(round(t * SR))
        if i < 0 or i >= len(self.buf):
            return
        x = x[: len(self.buf) - i]
        l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        if x.ndim == 2:                             # 立体声素材（load 读进来的）：声像只调左右平衡
            l, r = min(1.0, l), min(1.0, r)
            self.buf[i:i + len(x), 0] += x[:, 0] * g * l
            self.buf[i:i + len(x), 1] += x[:, 1] * g * r
            return
        self.buf[i:i + len(x), 0] += x * g * l
        self.buf[i:i + len(x), 1] += x * g * r

    def master(self, fade_in=.02, fade_out=.35, level=.89):
        """淡入淡出、软限幅、归一化，返回 (采样数, 2) 的立体声"""
        n = int(self.dur * SR)
        x = self.buf[:n].copy()
        t = np.arange(n) / SR
        env = np.clip(t / fade_in, 0, 1) * np.clip((self.dur - t) / fade_out, 0, 1)
        x *= env[:, None]
        x = np.tanh(x * 1.1)
        return x / (np.max(np.abs(x)) + 1e-9) * level


# ---------- 打击乐 ----------
def kick(m):
    """底鼓"""
    t = tt(.45)
    x = np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-t / .035)) / SR) * np.exp(-t / .22)
    x[:80] += m.rng.uniform(-.4, .4, 80) * np.linspace(1, 0, 80)
    return x


def clap(m):
    """拍手"""
    t = tt(.25)
    return filt(m.noise(.25), "band", [900, 3200]) * (np.exp(-t / .12) + np.where(t < .02, np.exp(-(t % .008) / .002), 0) * .6)


def hat(m, open_=False):
    """踩镲，open_=True 为开镲"""
    d, dec, f = (.2, .07, 6500) if open_ else (.05, .012, 8000)
    t = tt(d)
    return filt(m.noise(d), "high", f) * np.exp(-t / dec)


def impact(m):
    """重击：低频下坠加噪声，标题落地、大数字砸下"""
    t = tt(1.2)
    return np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t / .08)) / SR) * np.exp(-t / .45) + filt(m.noise(1.2), "low", 2500) * np.exp(-t / .09) * .6


def tick(m, f=3000):
    """很短的高频咔哒：钟表、放映机、按键"""
    t = tt(.06)
    return filt(m.noise(.06), "high", f) * np.exp(-t / .01)


def woodblock(f=900, d=.18):
    """木鱼、盖章一类短促的木质敲击"""
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t / .03)


def thud(m, d=.5):
    """闷响：低频正弦加一点低通噪声"""
    t = tt(d)
    return np.sin(2 * np.pi * np.cumsum(70 + 50 * np.exp(-t / .03)) / SR) * np.exp(-t / .12) + filt(m.noise(d), "low", 600) * np.exp(-t / .05) * .5


# ---------- 音调乐器 ----------
def saw(f, d, cutoff, a=.005, rel=.08):
    """双锯齿波合成器音，低通 cutoff：贝斯、主旋律"""
    t = tt(d)
    x = sawtooth(2 * np.pi * f * t) * .6 + sawtooth(2 * np.pi * f * 1.006 * t) * .4
    return filt(x, "low", cutoff) * np.minimum(1, t / a) * np.minimum(1, np.maximum(d - t, 0) / rel)


def pluck(f, d=.35, bright=4000):
    """短促的电子拨音"""
    t = tt(d)
    x = np.sign(np.sin(2 * np.pi * f * t)) * .5 + sawtooth(2 * np.pi * f * t) * .5
    return filt(x, "low", bright) * np.exp(-t / .09)


def string(m, f, d=2.0, damp=.996, bright=.5):
    """Karplus-Strong 拨弦：一段噪声在延迟线里反复低通，像古琴、吉他的弦"""
    n, p = int(d * SR), max(2, int(SR / f))
    buf = filt(m.rng.uniform(-1, 1, p), "low", 400 + 6000 * bright)
    out = np.zeros(n)
    for i in range(n):
        j = i % p
        out[i] = buf[j]
        buf[j] = damp * .5 * (buf[j] + buf[(j + 1) % p])
    return out


def bell(f, d=2.5, ratio=3.5, index=2.0):
    """FM 钟声：调制器频率是载波的非整数倍，泛音像金属"""
    t = tt(d)
    env = np.exp(-t / (d / 4))
    return np.sin(2 * np.pi * f * t + index * env * np.sin(2 * np.pi * f * ratio * t)) * env


def square(f, d, duty=.5, dec=None):
    """芯片方波（8-bit 游戏音）"""
    t = tt(d)
    x = np.where((t * f) % 1 < duty, 1.0, -1.0)
    return x * (np.exp(-t / dec) if dec else 1) * np.minimum(1, np.maximum(d - t, 0) / .01)


def beep(f=1000, d=.08):
    """正弦提示音：完成、确认"""
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * np.minimum(1, t / .003) * np.minimum(1, np.maximum(d - t, 0) / .01)


def pad(fs, d, cutoff=1400, a=.4, rel=.8):
    """几个音叠成的长音铺底"""
    x = sum(saw(f * det, d, cutoff, a=a, rel=rel) for f in fs for det in (1.0, 1.004))
    return x / (2 * len(fs))


def drone(f, d, wobble=.3):
    """低频持续音，带缓慢起伏"""
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.01 * t)) * (1 - wobble + wobble * np.sin(2 * np.pi * .4 * t))


# ---------- 氛围 ----------
def whoosh(m, d, f0=300, f1=3000):
    """带通噪声扫频：转场、风、墨晕"""
    t = tt(d)
    x, out = m.noise(d), np.zeros(int(d * SR))
    for k in range(8):
        a, b = int(len(t) * k / 8), int(len(t) * (k + 1) / 8)
        f = f0 * (f1 / f0) ** (k / 7)
        out[a:b] = filt(x, "band", [f, f * 1.5])[a:b]
    return out * np.sin(np.pi * t / d)


def riser(m, d):
    """渐强上扬的噪声，接在高潮前"""
    return whoosh(m, d, 600, 600 * 1.45 ** 7) * (tt(d) / d) ** 2


def hum(f=60, d=1.0):
    """电源嗡嗡声（CRT、荧光灯）"""
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * .6 + np.sin(2 * np.pi * f * 3 * t) * .25 + np.sin(2 * np.pi * f * 5 * t) * .1


# ---------- 素材里的声音（T 类、G 类） ----------
def load(path, ss=0.0, dur=None):
    """读音频文件（mp3、wav、ogg、mp4 的音轨…）→ (采样数, 2) 的立体声，44.1 kHz；ss 起点秒，dur 长度秒。用 ffmpeg 解码"""
    exe = shutil.which("ffmpeg")
    if not exe:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [exe, "-loglevel", "error", "-ss", f"{ss:.3f}", "-i", str(path)] + (["-t", f"{dur:.3f}"] if dur else [])
    raw = subprocess.run(cmd + ["-vn", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def fade(x, a=0.0, b=0.0):
    """淡入 a 秒、淡出 b 秒（单声道或立体声都行）"""
    n = len(x)
    env = np.ones(n)
    if a > 0:
        env[: int(a * SR)] = np.linspace(0, 1, int(a * SR))[: n]
    if b > 0:
        k = min(n, int(b * SR))
        env[n - k:] *= np.linspace(1, 0, k)
    return x * (env[:, None] if x.ndim == 2 else env)


def cue_time(a, kw, fallback=None):
    """旁白说到关键词 kw 的时刻（秒）：a 是 assets() 返回的 assets.json 内容，和 lib.js 的 cueTime 算法相同；找不到返回 fallback"""
    for it in a["items"]:
        at = float(it.get("at", 0))
        for l in it.get("lines", []):
            i = l["text"].find(kw)
            if i >= 0:
                return at + l["t0"] + (l["t1"] - l["t0"]) * i / len(l["text"])
    return fallback


def assets(m, here, music=0.32, duck=0.45, voice=0.9):
    """照 <样片目录>/assets.json 把声音摆上混音台：旁白、原声（G 类的旁白记作 语音合成）按 at（秒）放；配乐从 at 起铺到片尾，旁白、原声响的时候压低 duck；音效按 at 放。返回 assets.json 的内容。
    每份素材可写 gain（音量倍数）、ss（从素材的第几秒起）、at；配乐可写 fade（淡入秒数）"""
    here = Path(here)
    a = json.loads((here / "assets.json").read_text(encoding="utf-8"))
    talk = []
    for it in a["items"]:
        kind, f = it.get("kind"), here / it["file"]
        at, g = float(it.get("at", 0)), float(it.get("gain", 1))
        if kind in ("旁白", "原声", "语音合成"):
            x = load(f, it.get("ss", 0), it.get("len"))
            m.put(fade(x, .01, .05), at, voice * g)
            talk.append((at, at + len(x) / SR))
        elif kind == "音效":
            m.put(load(f, it.get("ss", 0), it.get("len")), at, g)
    for it in a["items"]:
        if it.get("kind") != "配乐":
            continue
        at = float(it.get("at", 0))
        x = load(here / it["file"], it.get("ss", 0), m.dur - at + .1)
        x = fade(x, float(it.get("fade", .3)), 0)
        env = np.ones(len(x))
        t = at + np.arange(len(x)) / SR
        for t0, t1 in talk:                          # 说话时压低配乐，前后各 0.25 秒渐变
            k = np.clip(np.minimum((t - (t0 - .25)) / .25, ((t1 + .25) - t) / .25), 0, 1)
            env = np.minimum(env, 1 - duck * k)
        m.put(x * env[:, None], at, music * float(it.get("gain", 1)))
    return a
