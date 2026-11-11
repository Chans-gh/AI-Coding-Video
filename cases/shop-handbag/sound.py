"""整支的配乐和环境声：一首 CC0 吉他曲铺满全片，加一层风声。旁白不在这里：samples/tools/film.py 照 timing.json 摆，说话时把这里的声音整体压低。
film.py 调 score(m, T)：m 是整支的 synth.Mix，T = {"dur", "segments": [{"seg", "start", "dur", "vo"}]}（见 film.py 开头）。
配乐 Sunset Plains（Yoiyami，CC0）从片头起放，片尾 3 秒淡出；风声 wind（Écrivain，CC0）循环，前半（第 1–5 段，短片的调子）大一些，
第 6 段起（讲解的调子）降到一半，两边在第 6 段开头 3 秒内过渡。
"""
from pathlib import Path

import numpy as np
from synth import SR, fade, load

MUSIC, WIND_HI, WIND_LO, XF = .34, .30, .14, 3.0


def loop(src, n):
    return src[np.arange(n) % len(src)]


def score(m, T):
    d = Path(__file__).resolve().parent / "assets" / "dl"
    dur, S = T["dur"], T["segments"]
    n = int(dur * SR)
    music = fade(loop(load(d / "sunset-plains.mp3"), n), 1.5, 3.0)
    m.put(music, 0, MUSIC)
    # 风声：前半大、后半小，第 6 段开头过渡
    wind = fade(loop(load(d / "wind.mp3"), n), 2.0, 3.0)
    s6 = next((s["start"] for s in S if s["seg"] == "06"), dur)
    t = np.arange(n) / SR
    k = np.clip((t - s6) / XF, 0, 1)
    env = WIND_HI + (WIND_LO - WIND_HI) * k
    m.put(wind * env[:, None], 0, 1.0)
