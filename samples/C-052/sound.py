"""C-052 连环漫画：每格弹出时一声短促的“嗖”加闷响，“咦？”一声上扬的啵嘤，
第三格的爆炸是重响，“砰！”是最重的一下，最后气泡一声轻点。"""
from synth import whoosh, thud, impact, kick, pluck, hz, tt
import numpy as np


def boing(d=.3, f0=300, f1=900):
    t = tt(d)
    f = f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / 44100) * np.exp(-t / .15)


def score(m):
    for i in range(4):
        m.put(whoosh(m, .15, 1000, 4000), i * .6, .2)
        m.put(thud(m, .25), i * .6 + .05, .35)
    m.put(boing(), .75, .3)
    m.put(impact(m), 1.25, .4)
    m.put(impact(m), 1.85, .6); m.put(kick(m), 1.85, .5)
    m.put(pluck(hz(84), .2), 2.32, .3)
