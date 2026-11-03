"""C-069 海面：低通噪声叠成的浪声，一层在左一层在右、起伏错开，
下面是很轻的长音和弦，像日落时的空气。"""
from synth import pad, drone, filt, tt, hz
import numpy as np


def surf(m, d, ph):
    t = tt(d)
    return filt(m.noise(d), "low", 900) * (.45 + .55 * np.sin(2 * np.pi * .3 * t + ph) ** 2)


def score(m):
    d = m.dur + .5
    m.put(surf(m, d, 0), 0, .5, pan=-.5)
    m.put(surf(m, d, 1.6), 0, .5, pan=.5)
    m.put(drone(hz(36), d, .2), 0, .08)
    m.put(pad([hz(57), hz(64), hz(69), hz(71)], d, 1000, a=1.2, rel=1.0), 0, .14)
