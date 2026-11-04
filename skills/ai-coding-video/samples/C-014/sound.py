"""C-014 浮世绘：海浪是低通噪声一阵阵涌起，巨浪升起时一道风声，
拨弦（像筝）用都节音阶（日本五声音阶）弹几个音。"""
from synth import string, whoosh, drone, filt, tt, hz
import numpy as np


def surf(m, d):
    """海浪：低通噪声，振幅慢慢起伏"""
    t = tt(d)
    return filt(m.noise(d), "low", 700) * (.5 + .5 * np.sin(2 * np.pi * .45 * t - 1.5)) ** 2


def score(m):
    m.put(surf(m, m.dur + .5), 0, .6)
    m.put(drone(hz(40), m.dur + .5, .25), 0, .06)
    m.put(whoosh(m, 1.6, 200, 1400), .1, .3, pan=-.4)                 # 巨浪升起
    for k, n in enumerate([62, 63, 67, 69, 70, 69]):                    # 都节音阶 D Eb G A Bb
        m.put(string(m, hz(n), 1.8, damp=.996, bright=.6), .3 + k * .375, .38, pan=.3 - k * .1)
    m.put(string(m, hz(50), 2.5, damp=.997, bright=.3), 0, .4)
