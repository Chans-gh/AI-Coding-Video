"""整支的声音：旁白（语音合成的公开音色，按 segments/timing.json 摆）+ 第 1 段课上成片自带的电子音 + 一首 CC0 配乐。
render.py 调 score(m, T)：m 是整支的 synth.Mix，T.start(k) 第 k 段在整支里的起点，T.vo() 摆旁白、返回说话的区间。
第 1 段放成片原声（由本仓库的 synth.py 合成，见 lesson/sound.py），旁白响时压低；配乐从第 2 段垫到结尾，旁白响时压低，结尾淡出。
"""
import numpy as np
from synth import SR, fade, load

MUSIC, DUCK = .26, .6


def duck(x, at, talk, amount):
    env = np.ones(len(x))
    t = at + np.arange(len(x)) / SR
    for t0, t1 in talk:
        k = np.clip(np.minimum((t - (t0 - .3)) / .3, ((t1 + .4) - t) / .4), 0, 1)
        env = np.minimum(env, 1 - amount * k)
    return x * env[:, None]


def score(m, T):
    a = T.dir / "assets"
    talk = T.vo(m, .95)
    short = fade(load(a / "C-038-16x9.mp4"), .02, 1.0)                 # 第 1 段：课上成片的原声
    m.put(duck(short, T.start(1), talk, .5), T.start(1), .8)
    t0, t1 = T.start(2) - 1.0, T.dur
    src = load(a / "dl" / "lofi.mp3")
    n = int((t1 - t0) * SR)
    x = fade(src[np.arange(n) % len(src)], 2.0, 3.0)                   # 不够长就循环
    m.put(duck(x, t0, talk, DUCK), t0, MUSIC)
