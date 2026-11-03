"""C-183 京剧脸谱：开场一串板鼓（木鱼加闷鼓）催起来；描线时一句京胡式的拉弦旋律（锯齿波加揉弦颤音，再用带通滤成尖细的鼻音）；每次变脸一声大锣加铙钹，后面跟一声小锣。"""
import numpy as np
from synth import woodblock, thud, bell, filt, tt, hz

GONG = [1.95, 3.0]          # 和 scene.js 一致


def huqin(f, d):
    t = tt(d)
    vib = 1 + .012 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / .25, 0, 1)
    ph = np.cumsum(f * vib) / 44100
    x = 2 * (ph % 1) - 1
    env = np.clip(t / .04, 0, 1) * np.clip((d - t) / .06, 0, 1)
    return filt(x, "band", [700, 4200]) * env


def daluo(f=hz(43), d=2.6):
    return bell(f, d, 1.37, 3.5) * .6 + bell(f * 1.5, d, 1.19, 2.0) * .3


def score(m):
    for i, t0 in enumerate([0, .3, .5, .62, .72, .8, .86, .92]):     # 板鼓越打越密
        m.put(woodblock(1200, .1), .05 + t0, .4)
        if i in (0, 3, 7):
            m.put(thud(m, .3), .05 + t0, .4)
    for t0, n, d in ((1.0, 74, .25), (1.25, 76, .2), (1.45, 79, .4), (1.85, 76, .12)):
        m.put(huqin(hz(n), d), t0, .35, .15)
    for t0, n, d in ((2.15, 81, .3), (2.45, 79, .2), (2.65, 76, .35), (3.2, 74, .3), (3.5, 76, .25), (3.75, 72, .45)):
        m.put(huqin(hz(n), d), t0, .3, .15)
    for g in GONG:
        m.put(daluo(), g, .75)
        m.put(filt(m.noise(.6), "high", 4000) * np.exp(-tt(.6) / .15), g, .35, -.3)
        m.put(bell(hz(79), .6, 1.41, 1.5), g + .38, .25, .3)
    for t0 in (2.5, 2.75, 3.55, 3.85):
        m.put(woodblock(1100, .1), t0, .3, -.2)
