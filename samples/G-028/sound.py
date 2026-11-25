"""G-028 实景转粘土定格微缩重绘：童话木琴拨弦铺底、扫光变身音与轻快定格节拍"""
from synth import pad, tick, pluck, bell, hz


def score(m):
    m.put(pad([hz(48), hz(52), hz(55)], m.dur, cutoff=1050), 0.0, .18)
    m.put(bell(hz(76), 0.9), 1.50, .20)
    melody = [72, 76, 79, 84, 79, 76, 74, 79, 76, 72]
    for i, n in enumerate(melody):
        t = 3.05 + i * 0.52
        if t < m.dur - 0.2:
            m.put(pluck(hz(n), 0.26), t, .19)
            m.put(tick(m, 2100), t, .10)
