"""C-178 折纸：每折一步是一段纸张摩擦的沙沙声（带通噪声，随折叠速度起落），折到底压折痕时一声短促的“嚓”；弹跳是两下轻的纸面落地声，展开时一串快速的翻纸声；底下一层很轻的木质拨弦。"""
import numpy as np
from synth import filt, tt, string, hz

FOLDS = [(.35, 1.15), (1.35, 1.9), (1.95, 2.5), (2.65, 3.15)]      # 和 scene.js 的折叠时刻一致
UNFOLD = [(3.95, 4.15), (4.15, 4.33), (4.33, 4.5)]


def rustle(m, d, f0=1500, f1=7000):
    x = filt(m.noise(d), "band", [f0, f1])
    env = np.sin(np.pi * tt(d) / d) ** 1.5 * (.6 + .4 * np.abs(np.sin(tt(d) * 37)))
    return x * env


def crease(m):
    d = .07
    return filt(m.noise(d), "high", 2500) * np.exp(-tt(d) / .015)


def tap(m):
    d = .12
    return filt(m.noise(d), "low", 900) * np.exp(-tt(d) / .02)


def score(m):
    for k, (a, b) in enumerate(FOLDS):
        m.put(rustle(m, b - a), a, .5, -.3 + .2 * k)
        m.put(crease(m), b - .04, .7, .1)
    for k, h in enumerate((3.25 + .325, 3.25 + .65)):
        m.put(tap(m), h, .8 - .3 * k)
    for a, b in UNFOLD:
        m.put(rustle(m, b - a + .05, 2000, 8000), a, .45, .3)
    for k, n in enumerate((62, 66, 69, 74)):
        m.put(string(m, hz(n), 1.6, .996, .4), FOLDS[k][1] - .05, .18, -.4 + .25 * k)
    m.put(string(m, hz(81), 2.0, .997, .5), 3.25, .2)
