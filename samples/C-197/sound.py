"""C-197 Motion 弹簧卡片动效：清脆 UI 点击、弹性过渡嗖声与柔和和弦"""
from synth import pad, pluck, tick, whoosh, bell, hz


def score(m):
    m.put(pad([hz(60), hz(64), hz(67)], 4.0, cutoff=1200), 0.0, .22)
    for i, t_card in enumerate((0.25, 0.50, 0.75)):
        m.put(tick(m, 2100 + i * 300), t_card, .24)
        m.put(pluck(hz(64 + i * 5), 0.45), t_card + 0.02, .16)
    m.put(whoosh(m, 0.45, 500, 2800), 1.65, .18)
    m.put(tick(m, 2600), 1.85, .25)
    m.put(whoosh(m, 0.45, 600, 3200), 2.75, .18)
    m.put(bell(hz(79), 1.3), 3.05, .2)
