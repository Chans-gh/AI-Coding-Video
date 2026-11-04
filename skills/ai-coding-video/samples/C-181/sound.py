"""C-181 年画：锣鼓。每印一块版是一声鼓加刷纸的沙声，墨线版印上时一声大锣；之后一段“咚咚锵”的锣鼓点，小镲（高通噪声）跟着打。"""
import numpy as np
from synth import thud, kick, bell, filt, tt, hz

T0 = [.25, .7, 1.15, 1.6, 2.1]          # 和 scene.js 的 T0 一致


def gong(f=hz(45), d=2.8):
    return bell(f, d, 1.41, 3.0) * .7 + bell(f * 2.02, d, 1.13, 1.5) * .3


def cymbal(m, d=.35):
    return filt(m.noise(d), "high", 5000) * np.exp(-tt(d) / .08)


def brush(m, d=.38):
    return filt(m.noise(d), "band", [1500, 6000]) * np.sin(np.pi * tt(d) / d)


def score(m):
    for k, t0 in enumerate(T0[:4]):
        m.put(thud(m, .5), t0, .7)
        m.put(kick(m), t0, .4)
        m.put(brush(m), t0, .25, -.5 + k * .3)
    m.put(brush(m, .45), T0[4], .3)
    m.put(gong(), T0[4] + .05, .8)
    b = .1875
    for i, kind in enumerate("ddc.ddc.dcdc"):         # d 鼓、c 锵（镲 + 小锣）
        t0 = 2.65 + i * b
        if kind == "d":
            m.put(thud(m, .3), t0, .6)
        elif kind == "c":
            m.put(cymbal(m), t0, .5, .3)
            m.put(bell(hz(76), .5, 1.41, 2.0), t0, .2, -.3)
