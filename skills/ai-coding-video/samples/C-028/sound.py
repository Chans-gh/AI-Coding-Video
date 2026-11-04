"""C-028 黏土定格：小家伙每跳一下是一声“啵嘤”（正弦音高先升后落），落地时一声软软的闷响，
背景是轻快的拨音。"""
from synth import thud, pluck, hz, tt
import numpy as np


def boing(d=.35, f0=260, f1=620):
    t = tt(d)
    f = f0 + (f1 - f0) * np.sin(np.pi * t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / 44100) * np.exp(-t / .2)


def score(m):
    beat = 60 / 160
    for k in range(4):                                                    # 两拍一跳
        m.put(boing(), k * 2 * beat + .05, .35)
        m.put(thud(m, .25), (k + 1) * 2 * beat - .02, .45)
    for k, n in enumerate([72, 76, 79, 76, 74, 77, 81, 77]):
        m.put(pluck(hz(n), .25, bright=2500), k * beat + beat / 2, .15, pan=.4)
