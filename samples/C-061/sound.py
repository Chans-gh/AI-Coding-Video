"""C-061 1920 年代默片：放映机按每秒 16 格咔嗒作响，钢琴味的拨弦弹一段散拍小曲，
绅士踩到香蕉皮时一声下滑的口哨音和一记闷响，字幕卡出现时一个和弦。"""
from synth import tick, string, thud, hum, hz, tt
import numpy as np


def slide(d=.3, f0=1400, f1=500):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / 44100) * np.minimum(1, (d - t) / .05 + .001)


def score(m):
    m.put(hum(50, m.dur), 0, .04)
    for k in range(48):
        m.put(tick(m, 1200), k / 16, .06)
    for k, n in enumerate([60, 64, 67, 72, 71, 67, 69]):
        m.put(string(m, hz(n), .5, bright=.6), k * .19, .3, pan=-.2)
    m.put(slide(), 1.1, .25)
    m.put(thud(m, .4), 1.38, .55)
    for n in [48, 55, 60, 64]:
        m.put(string(m, hz(n), 1.4, bright=.5), 1.7, .25)
