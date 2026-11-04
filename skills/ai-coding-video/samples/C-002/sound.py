"""C-002 水彩：暖色长音铺底，每块颜色晕开时一声轻柔的拨弦（大调五声音阶往上走），
铅笔线描出时一阵很轻的沙沙声，标题出现时一组钟声。"""
from synth import pad, pluck, bell, filt, hz, tt
import numpy as np


def score(m):
    m.put(pad([hz(60), hz(64), hz(67), hz(72)], m.dur, 1500, a=.6), 0, .2)
    notes = [72, 74, 76, 79, 81, 84, 79, 81, 84, 86, 88]
    for k, d in enumerate([0, .15, .3, .45, .6, .8, .85, .9, 1.0, 1.05, 1.1]):   # 每块颜色落下
        m.put(pluck(hz(notes[k]), .6, bright=2200), d + .05, .22, pan=-.5 + k * .1)
    n = filt(m.noise(1.0), "band", [2500, 6000]) * (.5 + .5 * np.sin(tt(1.0) * 40))  # 铅笔
    m.put(n, .2, .05)
    for k, f in enumerate([84, 88, 91]):                                 # 标题
        m.put(bell(hz(f), 1.4, ratio=2.0, index=1.0), 1.8 + k * .1, .18)
