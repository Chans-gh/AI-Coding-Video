"""C-198 HyperFrames 编排发布片：科技发布会节奏——低频铺底、卡片入场咔哒、扫光嗖声与核心数字重击钟声"""
from synth import pad, kick, tick, whoosh, impact, bell, hz


def score(m):
    m.put(pad([hz(48), hz(55), hz(62)], 4.5, cutoff=1300), 0.0, .24)
    m.put(kick(m), 0.2, .3)
    m.put(whoosh(m, 0.7, 300, 3200), 0.3, .22)
    for t_c in (1.15, 1.45, 1.75):
        m.put(tick(m, 2400), t_c, .22)
    m.put(whoosh(m, 0.8, 420, 3800), 2.55, .24)
    m.put(impact(m), 2.9, .34)
    m.put(bell(hz(74), 1.6), 2.95, .2)
