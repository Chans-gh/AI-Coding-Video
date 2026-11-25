"""C-071 Blender 程序化场景：灰模搭建清脆咔哒声 → 材质与夜景灯光切换扫频 → 三组烟花绽放低频轰鸣与星火铃音"""
from synth import pad, tick, whoosh, impact, bell, pluck, hz


def score(m):
    # 灰模搭建延时咔哒声
    for i in range(6):
        m.put(tick(m, 1800 + i * 220), 0.15 + i * 0.2, .22)
    # 灰模切入夜景材质与灯光
    m.put(whoosh(m, 0.85, 280, 2600), 1.35, .26)
    m.put(pad([hz(48), hz(55), hz(60)], 3.1, cutoff=1000), 1.4, .24)
    # 三组烟花绽放
    for t_fw, note in ((1.95, 76), (2.65, 79), (3.35, 83)):
        m.put(impact(m), t_fw, .34)
        m.put(bell(hz(note), 1.1), t_fw + 0.04, .18)
        m.put(pluck(hz(note + 5), 0.35), t_fw + 0.12, .14)
