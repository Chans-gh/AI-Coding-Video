"""C-202 MoviePy 卡点字卡片头：每 1 秒一次强力卡点底鼓与切镜咔哒、扫频转场与终场钟声"""
from synth import pad, kick, hat, tick, whoosh, impact, bell, hz


def score(m):
    m.put(pad([hz(48), hz(55), hz(60)], 4.0, cutoff=1400), 0.0, .22)
    for beat_t in (0.0, 1.0, 2.0, 3.0):
        m.put(kick(m), beat_t, .36)
        m.put(tick(m, 2600), beat_t + 0.02, .22)
        if beat_t + 0.5 < m.dur:
            m.put(hat(m), beat_t + 0.5, .16)
    m.put(whoosh(m, 0.45, 350, 3200), 0.85, .2)
    m.put(whoosh(m, 0.45, 350, 3200), 1.85, .2)
    m.put(impact(m), 3.0, .32)
    m.put(bell(hz(76), 1.2), 3.05, .2)
