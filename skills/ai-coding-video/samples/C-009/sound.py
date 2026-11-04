"""C-009 白板讲解：马克笔在白板上划的“吱吱”声跟着每一笔走，
每画好一个方框响一个轻快的拨弦音，最后镜头拉远时一阵轻风。"""
from synth import pluck, whoosh, pad, filt, tt, hz
import numpy as np


def squeak(m, d):
    """马克笔：带通噪声，音高轻微抖动，振幅随笔压起伏"""
    t = tt(d)
    x = filt(m.noise(d), "band", [1800, 3600])
    return x * (.55 + .45 * np.sin(2 * np.pi * 9 * t + 3 * m.rng.random())) * np.minimum(1, t / .02) * np.minimum(1, (d - t) / .03)


def score(m):
    m.put(pad([hz(60), hz(64), hz(67)], m.dur + .5, 900, a=.6), 0, .12)
    for a, b in [(0, .55), (.62, 1.0), (1.08, 1.45), (1.52, 1.9), (1.98, 2.36)]:   # 每一段笔画
        m.put(squeak(m, b - a), a, .16, pan=m.rng.uniform(-.3, .3))
    for k, (t0, n) in enumerate([(1.0, 72), (1.45, 76), (1.9, 79), (2.36, 84)]):  # 方框画完
        m.put(pluck(hz(n), .5, 3500), t0, .45, pan=-.3 + k * .2)
    m.put(whoosh(m, .6, 400, 1600), 2.4, .2)                                       # 镜头拉远
