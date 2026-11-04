"""C-041 公式推导：每拍多加一项正弦，声音也是一样：基音之上每拍叠一个奇次谐波（音量 1/n），
声音一拍比一拍更像方波；新项出现时一声轻提示。"""
from synth import beep, tt
import numpy as np


def tone(f, d, a):
    t = tt(d)
    return a * np.sin(2 * np.pi * f * t) * np.minimum(1, t / .05) * np.minimum(1, (d - t) / .3 + .001)


def score(m):
    beat = 60 / 160
    for k in range(8):
        n = 2 * k + 1
        m.put(tone(110 * n, m.dur - k * beat, .6 / n), k * beat, .5)
        m.put(beep(1760, .05), k * beat, .08)
