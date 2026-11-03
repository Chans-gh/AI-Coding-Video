"""C-055 HD-2D：夜里的小镇——低缓的和弦铺底，拨弦弹一段五声音阶的小调，
钟声每隔一会儿敲一下，脚步用很轻的木响，底下有风和虫鸣般的高频噪声。"""
from synth import pluck, bell, pad, drone, woodblock, filt, whoosh, hz, tt
import numpy as np


def crickets(m, d):
    n = filt(m.noise(d), "band", [4200, 7000])
    return n * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tt(d))) * 0.6


def score(m):
    m.put(drone(hz(36), m.dur + .4, wobble=.2), 0, .08)
    m.put(pad([hz(55), hz(58), hz(62), hz(65)], m.dur, cutoff=1000, a=.7, rel=1.2), .1, .10)
    m.put(crickets(m, m.dur), 0, .05, pan=.4)
    m.put(whoosh(m, 2.2, 90, 500), .2, .08, pan=-.3)                 # 夜风
    for k, n in enumerate([74, 77, 81, 77, 74, 72, 74, 79, 81, 84]):
        m.put(pluck(hz(n), .5, 1800), .3 + k * .42, .14, pan=-.3 + (k % 4) * .2)
    m.put(bell(hz(50), 3.2, ratio=2.4, index=1.8), .6, .18)
    m.put(bell(hz(57), 3.0, ratio=2.4, index=1.6), 3.1, .16, pan=.25)
    for k in range(14):                                              # 脚步
        m.put(woodblock(240 + (k % 3) * 40, .09), .5 + k * .33, .07, pan=-.2)
