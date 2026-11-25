"""C-201 Skia 离屏矢量动效：清爽科技电子音——卡片弹出咔哒、弧线增长扫频与柔和钟声"""
from synth import pad, tick, pluck, whoosh, bell, hz


def score(m):
    m.put(pad([hz(55), hz(62), hz(67)], 4.0, cutoff=1300), 0.0, .2)
    for i, t0 in enumerate((0.2, 0.55, 0.9)):
        m.put(tick(m, 2200 + i * 260), t0, .22)
        m.put(pluck(hz(67 + i * 4), 0.4), t0 + 0.03, .16)
    m.put(whoosh(m, 0.75, 400, 3200), 1.75, .2)
    m.put(bell(hz(79), 1.4), 2.95, .2)
