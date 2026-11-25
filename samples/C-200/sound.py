"""C-200 播客金句与频谱卡：温暖电台底噪铺底、清脆鼓点与中频琶音，为 NumPy 真实 FFT 频谱提供丰富动态频段"""
from synth import pad, kick, hat, pluck, bell, hz


def score(m):
    m.put(pad([hz(48), hz(55), hz(60), hz(64)], 4.0, cutoff=1500), 0.0, .24)
    for i in range(8):
        t = i * 0.5
        if t < m.dur - 0.1:
            m.put(kick(m), t, .34)
            m.put(hat(m), t + 0.25, .16)
    notes = [60, 64, 67, 72, 71, 67, 64, 62, 64, 67, 72, 76, 74, 72, 67, 64]
    for i, n in enumerate(notes):
        t = i * 0.25
        if t < m.dur - 0.1:
            m.put(pluck(hz(n), 0.32), t, .22, pan=(-0.25 if i % 2 == 0 else 0.25))
    m.put(bell(hz(79), 1.4), 3.1, .2)
