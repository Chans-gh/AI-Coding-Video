"""C-010 黑板粉笔：每写一笔放一段粉笔摩擦声（带通噪声，按笔画时长切），
画圈“考点”时摩擦声更尖，最后用粉笔在黑板上点两下。"""
from synth import woodblock, filt, tt
import numpy as np


def chalk(m, d, f=2600):
    t = tt(d)
    x = filt(m.noise(d), "band", [f, f * 2.4]) * (.55 + .45 * np.abs(np.sin(t * 55)))
    return x * np.minimum(1, t / .02) * np.minimum(1, (d - t) / .03 + .001)


def score(m):
    for a, b in [(0, .55), (.5, .7), (.6, .95), (1.0, 1.45), (1.1, 1.35), (1.4, 1.55), (1.6, 1.8), (1.8, 2.0), (2.0, 2.15), (2.1, 2.2)]:
        m.put(chalk(m, b - a), a, .32, pan=m.rng.uniform(-.3, .3))
    m.put(chalk(m, .3, 3600), 2.25, .35)                                 # 圈考点
    m.put(chalk(m, .25, 3000), 2.5, .3)
    m.put(woodblock(1400, .08), 2.78, .35); m.put(woodblock(1400, .08), 2.9, .3)
