"""C-205 千人千面年度报告：温暖合成器铺底、热力图逐周点亮琶音与成就落版钟声"""
from synth import pad, pluck, tick, bell, hz


def score(m):
    m.put(pad([hz(60), hz(64), hz(67), hz(71)], 4.0, cutoff=1300), 0.0, .22)
    for i, n in enumerate((64, 67, 71, 72, 76, 79, 83, 84)):
        t = 0.25 + i * 0.34
        if t < m.dur - 0.15:
            m.put(pluck(hz(n), 0.45), t, .18, pan=-0.3 + i * 0.08)
    m.put(tick(m, 2500), 2.5, .2)
    m.put(bell(hz(84), 1.5), 2.95, .22)
