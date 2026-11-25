"""C-200 NumPy 干涉像素场：电子合成低频铺底、波源脉冲点音与高频铃声"""
from synth import pad, pluck, bell, tick, hz


def score(m):
    m.put(pad([hz(45), hz(52), hz(57)], 4.0, cutoff=1300), 0.0, .25)
    for i, n in enumerate((64, 67, 71, 74, 76, 74, 71, 67)):
        t = i * 0.45 + 0.15
        if t < m.dur - 0.15:
            m.put(pluck(hz(n), 0.42), t, .18, pan=-0.35 + i * 0.1)
    for t_tk in (0.5, 1.5, 2.5):
        m.put(tick(m, 2300), t_tk, .16)
    m.put(bell(hz(79), 1.5), 3.0, .2)
