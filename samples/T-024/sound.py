"""T-024 文献与财报 3D 荧光笔扫读：沉稳调查纪录片底噪、荧光笔划纸轻响与批注弹出提示"""
from synth import pad, tick, pluck, bell, hz


def score(m):
    m.put(pad([hz(45), hz(52), hz(57)], m.dur, cutoff=850), 0.0, .20)
    for t0 in [1.2, 2.0, 5.2, 6.0]:
        for k in range(6):
            m.put(tick(m, 1600 + k * 140), t0 + k * 0.11, .12)
    m.put(pluck(hz(72), 0.35), 1.6, .18)
    m.put(bell(hz(76), 1.0), 5.4, .18)
