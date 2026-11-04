"""C-076 黑洞：超低频的持续音和缓慢起伏的铺底和弦，滤过的噪声像远处的轰鸣，
偶尔一声很轻的高音钟声，结尾一道慢慢升高的风声。"""
from synth import drone, pad, whoosh, bell, filt, hz, tt
import numpy as np


def score(m):
    d = m.dur + .5
    m.put(drone(hz(28), d, wobble=.35), 0, .35)                        # 41 Hz 低频
    m.put(pad([hz(n) for n in (52, 59, 62, 66)], d, cutoff=900, a=1.2, rel=1.0), 0, .5)
    t = tt(d)
    m.put(filt(m.noise(d), "low", 160) * (.6 + .4 * np.sin(2 * np.pi * .3 * t)), 0, .5)  # 轰鸣
    m.put(bell(hz(88), 2.5, ratio=3.5, index=1.5), .6, .07, pan=-.5)
    m.put(bell(hz(83), 2.5, ratio=3.5, index=1.5), 2.1, .06, pan=.5)
    m.put(whoosh(m, 2.2, 120, 1400), 1.8, .2)
