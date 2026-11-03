"""C-174 雨窗：持续的雨声（两层滤过的噪声，一层沙沙一层哗哗），玻璃上零星的水滴声，远处一辆车由左到右开过，底下很轻的城市低频。"""
import numpy as np
from synth import filt, drone, hz, tt


def drip(m):
    t = tt(.05)
    f = 2500 + 2500 * m.rng.random()
    return np.sin(2 * np.pi * f * t * (1 + 2 * t)) * np.exp(-t / .008)


def score(m):
    d = m.dur + .5
    n = m.noise(d)
    m.put(filt(n, "band", [800, 6000]), 0, .25, -.2)                       # 沙沙
    m.put(filt(m.noise(d), "low", 900), 0, .35, .2)                         # 哗哗
    m.put(filt(drone(hz(31), d, .2), "low", 200), 0, .3)
    for _ in range(40):
        m.put(drip(m), m.rng.uniform(0, m.dur), .08 + .1 * m.rng.random(), m.rng.uniform(-.9, .9))
    car = filt(m.noise(3.0), "low", 500) * np.sin(np.pi * tt(3.0) / 3.0) ** 2
    for k in range(12):                                                    # 车声：声像从左到右
        a, b = int(len(car) * k / 12), int(len(car) * (k + 1) / 12)
        m.put(car[a:b], .6 + 3.0 * k / 12, .5, -.8 + 1.6 * k / 11)
