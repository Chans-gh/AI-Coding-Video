"""C-021 蓝图：描一个零件就有一段针管笔划过纸的声音，尺寸线和标注落下时一声短促的提示音，
最后盖修订章是一记闷响，底下一层冷色铺底。"""
from synth import pad, beep, thud, filt, tt, hz
import numpy as np


def pen(m, d):
    t = tt(d)
    return filt(m.noise(d), "band", [3000, 7000]) * np.minimum(1, t / .015) * np.minimum(1, (d - t) / .02 + .001)


def score(m):
    m.put(pad([hz(50), hz(57), hz(64)], m.dur, 900, a=.5), 0, .16)
    for a, b in [(0, .35), (.3, .7), (.65, .72), (.7, .77), (.75, .95), (.8, 1.0), (.95, 1.15), (1.1, 1.3), (1.2, 1.5)]:
        m.put(pen(m, b - a), a, .2, pan=m.rng.uniform(-.3, .3))
    for d, f in [(1.4, 1320), (1.65, 1480), (1.85, 1760), (2.05, 1760), (2.25, 1980)]:
        m.put(beep(f, .07), d, .2)
    m.put(thud(m, .4), 2.42, .6)                                          # 盖章
