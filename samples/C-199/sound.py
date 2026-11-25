"""C-199 Manim 数学几何证明：清澈电子钢琴/铃音琶音与柔和铺底，配合单位圆与正弦波联动节奏"""
from synth import pad, pluck, bell, tick, hz


def score(m):
    m.put(pad([hz(57), hz(64), hz(69)], 4.5, cutoff=1100), 0.0, .2)
    m.put(tick(m, 2400), 0.35, .18)
    for i, n in enumerate((64, 67, 69, 71, 72, 76, 79, 81)):
        t = 0.55 + i * 0.42
        if t < m.dur - 0.15:
            m.put(pluck(hz(n), 0.55), t, .18, pan=-0.2 + i * 0.06)
    m.put(bell(hz(76), 1.6), 3.4, .22)
