"""C-185 水墨漫画：每进一格一声大鼓，第 1 格是风声，第 2 格一声拔刀的金属轻鸣，第 3 格冲刺的呼啸（扫频噪声），第 4 格刀光一声重击加金属擦响、拟声字落下时再补一鼓；最后拉远时一声长的金属余音。"""
import numpy as np
from synth import thud, kick, impact, whoosh, bell, filt, tt, hz

BEATS = [.1, 1.05, 1.95, 2.85]         # 和 scene.js 一致


def ring(m, f, d):
    return bell(f, d, 2.76, 1.2) * .6 + filt(m.noise(d), "band", [5000, 9000]) * np.exp(-tt(d) / .05) * .4


def score(m):
    for b in BEATS:
        m.put(thud(m, .6), b, .7)
        m.put(kick(m), b, .4)
    m.put(whoosh(m, 1.0, 200, 900), 0, .35, -.4)
    m.put(ring(m, hz(88), 1.2), 1.4, .3, .3)
    m.put(whoosh(m, .5, 400, 4000), 1.85, .5, .5)
    m.put(whoosh(m, .3, 800, 6000), 2.62, .5, -.3)
    m.put(impact(m), 2.85, .8)
    m.put(ring(m, hz(84), 1.6), 2.86, .4)
    m.put(thud(m, .5), 3.15, .6)
    m.put(ring(m, hz(91), 1.5), 3.7, .18, .2)
