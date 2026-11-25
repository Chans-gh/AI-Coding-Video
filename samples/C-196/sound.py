"""C-196 Hydra 视觉反馈合成：模拟视频合成器风味——滤波锯齿低音、八分音符琶音、节拍脉冲与扫频"""
from synth import pad, pluck, kick, hat, whoosh, bell, hz


def score(m):
    m.put(pad([hz(45), hz(52), hz(57)], 4.0, cutoff=1600), 0.0, .28)
    notes = [57, 60, 64, 67, 69, 67, 64, 60, 62, 65, 69, 72, 74, 72, 69, 64]
    for i, n in enumerate(notes):
        t = i * 0.25
        if t < m.dur - 0.1:
            m.put(pluck(hz(n), 0.35), t, .19, pan=(-0.35 if i % 2 == 0 else 0.35))
    for i in range(8):
        t = i * 0.5
        if t < m.dur - 0.1:
            m.put(kick(m), t, .32)
            m.put(hat(m), t + 0.25, .14)
    m.put(whoosh(m, 0.9, 300, 3800), 1.7, .22)
    m.put(bell(hz(76), 1.4), 3.1, .18)
