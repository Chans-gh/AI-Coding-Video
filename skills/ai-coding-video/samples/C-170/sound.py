"""C-170 字的隧道：风声越吹越急（扫频噪声逐渐升高、变响），每穿过一个文字环有一声轻轻的气流擦过，底下一个缓慢上行的低音。"""
import numpy as np
from synth import whoosh, riser, saw, filt, hz, tt

SP = 1.1


def cam(t):
    return 5 * t + 2.4 * t * t


def score(m):
    d = m.dur + .3
    m.put(whoosh(m, d, 200, 2600) * (.4 + .6 * tt(d) / d), 0, .5)        # 加速的风
    m.put(riser(m, 2.2), m.dur - 2.2, .35)
    t, i = 0.0, 1
    while t < m.dur:                                                       # 穿过每个环
        while cam(t) < i * SP and t < m.dur:
            t += .002
        x = filt(m.noise(.12), "band", [900, 2600]) * np.sin(np.pi * tt(.12) / .12)
        m.put(x, t, .12, .5 if i % 2 else -.5)
        i += 1
    for k, n in enumerate([33, 35, 36, 38, 40, 43]):                       # 上行低音
        m.put(saw(hz(n), .62, 380, a=.04, rel=.2), k * .56, .32)
