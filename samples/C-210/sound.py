"""C-210 财报与经营 KPI 拆解盘：稳重商讯铺底、KPI 计数轻响、瀑布柱生长与漏斗完成和弦"""
from synth import pad, tick, pluck, bell, hz


def score(m):
    m.put(pad([hz(45), hz(52), hz(57)], 4.5, cutoff=1000), 0.0, .22)
    for i, note in enumerate([69, 72, 76]):
        m.put(pluck(hz(note), 0.25), 0.15 + i * 0.16, .20)
    for i in range(5):
        m.put(tick(m, 1800 + i * 110), 0.95 + i * 0.25, .18)
    for i, note in enumerate([74, 76, 79, 84]):
        m.put(bell(hz(note), 0.6), 1.75 + i * 0.24, .16)
