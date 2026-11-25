"""C-203 动态数据排行竞速：节奏紧凑的电子脉冲与每次排名反超提示音"""
from synth import pad, kick, hat, tick, pluck, bell, hz


def score(m):
    m.put(pad([hz(50), hz(57), hz(62)], 4.5, cutoff=1300), 0.0, .2)
    for i in range(9):
        t = i * 0.5
        if t < m.dur - 0.1:
            m.put(kick(m), t, .3)
            m.put(hat(m), t + 0.25, .14)
    for i, t_ov in enumerate((0.9, 1.8, 2.7, 3.5)):
        m.put(tick(m, 2200 + i * 250), t_ov, .22)
        m.put(pluck(hz(67 + i * 3), 0.35), t_ov + 0.02, .18)
    m.put(bell(hz(81), 1.4), 3.6, .2)
