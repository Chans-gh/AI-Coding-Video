"""C-184 书法：只有毛笔擦过纸面的沙沙声。每一笔一段带通噪声，起笔、收笔轻，中段重；干笔（飞白）的笔画声音更粗、更碎；盖印时一声闷响。"""
import numpy as np
from synth import filt, tt, thud

STROKES = [(.25, .65, .25), (.72, 1.25, .45), (1.3, 1.4, .2), (1.46, 1.72, .5),
           (1.85, 2.3, .4), (2.36, 2.78, .55), (2.84, 3.0, .35), (3.06, 3.4, .5)]     # 和 scene.js 一致


def rasp(m, d, dry):
    t = tt(d)
    x = filt(m.noise(d), "band", [900 + 600 * dry, 5000])
    grit = 1 + dry * 3 * (m.rng.random(len(t)) > .7)                 # 干笔：碎
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** .8 * (1 + .3 * np.sin(t * 40))
    return x * env * grit


def score(m):
    for k, (a, b, dry) in enumerate(STROKES):
        m.put(rasp(m, b - a + .06, dry), a - .02, .55, -.3 + .6 * (k % 2))
        m.put(filt(m.noise(.05), "low", 1500) * np.exp(-tt(.05) / .01), a - .02, .2)    # 落笔
    m.put(thud(m, .4), 4.05, .7)
    m.put(filt(m.noise(.08), "low", 800) * np.exp(-tt(.08) / .02), 4.05, .4)
