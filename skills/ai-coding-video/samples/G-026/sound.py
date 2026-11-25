"""G-026 历史人物第一视角自拍 Vlog：轻快古风五声拨弦铺底、录制提示音与字幕切点轻响"""
from synth import pad, tick, pluck, bell, hz


def score(m):
    # Pentatonic warm ambience (C-D-E-G-A)
    m.put(pad([hz(48), hz(55), hz(60)], m.dur, cutoff=950), 0.0, .20)
    m.put(tick(m, 2400), 0.05, .20)
    notes = [60, 62, 64, 67, 69, 72, 67, 64, 62, 67, 72, 74]
    for i, n in enumerate(notes):
        t = 0.35 + i * 0.65
        if t < m.dur - 0.3:
            m.put(pluck(hz(n), 0.35), t, .18)
    m.put(bell(hz(72), 1.0), 5.5, .16)
