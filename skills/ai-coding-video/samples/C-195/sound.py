"""C-195 末日工业：全程一层低频轰鸣（两条错开的持续低音加低通噪声）；不定时的金属回响（低音钟声，加一串衰减的回声）；焊接处一串细碎的电弧噼啪声（短促高频噪声）；镜头升到高处时一声渐强的风。"""
import numpy as np
from synth import drone, bell, thud, whoosh, filt, tt, hz


def clank(m, f, d=2.4):
    x = bell(f, d, 2.76, 3.0) * .6 + bell(f * 1.5, d, 1.41, 1.5) * .3
    y = np.copy(x)
    for k, g in ((int(.23 * 44100), .45), (int(.47 * 44100), .25), (int(.71 * 44100), .12)):
        y[k:] += x[:-k] * g
    return y


def score(m):
    m.put(drone(hz(29), m.dur, .4), 0, .55)
    m.put(drone(hz(36), m.dur, .25), 0, .35)
    m.put(filt(m.noise(m.dur), "low", 220) * 1.5, 0, .5)
    for t0, n, g, pan in ((.6, 38, .35, -.4), (2.1, 33, .4, .3), (3.5, 41, .25, -.1)):
        m.put(clank(m, hz(n)), t0, g, pan)
        m.put(thud(m, .5), t0, .3)
    for i in range(40):
        t0 = m.rng.uniform(.2, m.dur - .3)
        d = m.rng.uniform(.01, .04)
        m.put(filt(m.noise(d), "high", 4000) * np.exp(-tt(d) / d * 3), t0, m.rng.uniform(.08, .2), .45)
    m.put(whoosh(m, 2.2, 150, 900), 2.2, .35)
