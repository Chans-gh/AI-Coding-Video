"""C-175 窗光与尘：只有墙上钟表的滴答声（每秒一下，木质的咔哒），加很轻的室内空气声和远处偶尔的鸟叫。"""
import numpy as np
from synth import woodblock, tick, filt, tt


def score(m):
    m.put(filt(m.noise(m.dur + .5), "low", 300), 0, .08)
    k = 0
    while k + .5 < m.dur:                                                 # 秒针在 t = k + 0.5 时跳
        m.put(woodblock(2400 if k % 2 else 2100, .08), k + .5, .5)
        m.put(tick(m, 5000), k + .5, .25)
        k += 1
    for t0 in (1.2, 1.38):                                                 # 窗外一声鸟叫
        t = tt(.12)
        f = 3200 + 1200 * np.sin(np.pi * t / .12)
        m.put(np.sin(2 * np.pi * np.cumsum(f) / 44100) * np.sin(np.pi * t / .12), t0, .05, .6)
