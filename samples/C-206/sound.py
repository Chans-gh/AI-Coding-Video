"""C-206 电商卖点与价签参数卡：明快带货节奏——卖点弹出咔哒、对比表扫频与活动价重击提示音"""
from synth import pad, kick, hat, tick, whoosh, impact, bell, hz


def score(m):
    m.put(pad([hz(53), hz(60), hz(65)], 4.5, cutoff=1500), 0.0, .2)
    for i in range(9):
        t = i * 0.5
        if t < m.dur - 0.1:
            m.put(kick(m), t, .34)
            m.put(hat(m), t + 0.25, .15)
    for t_tk in (0.2, 0.55, 0.9):
        m.put(tick(m, 2500), t_tk, .22)
    m.put(whoosh(m, 0.45, 400, 3400), 1.4, .22)
    m.put(whoosh(m, 0.45, 450, 3800), 2.85, .24)
    m.put(impact(m), 3.05, .36)
    m.put(bell(hz(79), 1.3), 3.1, .22)
