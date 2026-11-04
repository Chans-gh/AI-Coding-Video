"""C-188 新海诚式光影：全程是夏天的蝉鸣（高频带通噪声按快节奏起伏）和远处飞机的低沉轰鸣；钢琴式的慢分解和弦配一层弦乐长音，旋律在 2 秒后升高；窗边风铃两三声，结尾镜头推到最近时一声高音钟。"""
import numpy as np
from synth import string, bell, pad, filt, tt, hz


def piano(m, f, d=2.4):
    return string(m, f, d, .998, .7) * .6 + bell(f, d, 1.0, .5) * .4


def score(m):
    t = tt(m.dur)
    cicada = filt(m.noise(m.dur), "band", [4200, 7000]) * (.6 + .4 * np.sin(2 * np.pi * 38 * t)) * (.7 + .3 * np.sin(2 * np.pi * .3 * t))
    m.put(cicada, 0, .08, .4)
    m.put(filt(m.noise(m.dur), "low", 180) * np.clip(t / 2, 0, 1), 0, .35, -.3)
    chords = [(52, 59, 64, 67), (48, 55, 60, 64), (55, 62, 67, 71), (50, 57, 62, 66)]
    for i, ch in enumerate(chords):
        t0 = .05 + i * 1.2
        m.put(piano(m, hz(ch[0] - 12), 2.6), t0, .3)
        for j, n in enumerate(ch[1:] + (ch[1] + 12,)):
            m.put(piano(m, hz(n)), t0 + .15 + j * .2, .2, (j - 1.5) * .25)
        m.put(pad([hz(n) for n in ch], 1.4, 1100, a=.5), t0, .1)
    for t0, n in ((2.1, 79), (2.5, 83), (2.9, 84), (3.5, 83)):
        m.put(piano(m, hz(n), 1.8), t0, .22, .15)
    for t0, n in ((.6, 96), (1.7, 98), (3.1, 96)):
        m.put(bell(hz(n), 1.6, 2.76, 1.2), t0, .07, .6)
    m.put(bell(hz(91), 2.4), 4.1, .16)
