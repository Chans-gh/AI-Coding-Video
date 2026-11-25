"""C-204 金融 K 线行情复盘：沉稳低频铺底、K 线逐根走出的脉冲咔哒与突破买点提示钟声"""
from synth import pad, tick, beep, pluck, bell, hz


def score(m):
    m.put(pad([hz(45), hz(52), hz(57)], 4.5, cutoff=1050), 0.0, .22)
    for i in range(10):
        t = 0.25 + i * 0.35
        if t < m.dur - 0.15:
            m.put(tick(m, 1900 + i * 80), t, .15)
    m.put(beep(1560, 0.08), 2.15, .18)
    m.put(pluck(hz(72), 0.45), 2.2, .18)
    m.put(bell(hz(76), 1.5), 3.25, .22)
