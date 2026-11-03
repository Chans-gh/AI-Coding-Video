"""C-124 平板黑板马克笔：这类片子本来只配人声；本仓库不用语音合成，所以只留笔尖在板上的沙沙声——
每一笔响一段带通噪声，盖红章一声闷响，末尾一声轻提示音。"""
import numpy as np
from synth import thud, beep, woodblock, filt, tt


def pen(m, d, seed=0):
    n = m.noise(d)
    e = np.minimum(1, tt(d) * 24) * np.exp(-tt(d) * 2.2)
    return filt(n, "band", [1400, 4600]) * e * (0.75 + 0.25 * np.sin(2 * np.pi * (18 + seed) * tt(d)))


def score(m):
    for k, (t0, d) in enumerate([(.35, .35), (.75, .55), (1.3, .2), (1.6, .5), (2.05, .18), (2.2, .18),
                                 (2.45, .4), (2.8, .14), (3.0, .3), (3.25, .22)]):
        m.put(pen(m, d, k), t0, .34, pan=-.3 + (k % 5) * .15)
    m.put(thud(m, .45), 3.9, .5)                     # 盖章
    m.put(woodblock(380, .2), 3.9, .45)
    m.put(beep(1200, .07), 4.3, .16)
