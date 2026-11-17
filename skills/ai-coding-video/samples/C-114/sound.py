"""C-114 霓虹灯牌：雨声铺底（过滤的噪声）和一层变压器低频嗡鸣；每块灯通电时一串不规则的电弧噼啪，
稳住后嗡鸣更响一点；“通宵面馆”中途闪一下再补一记噼啪。"""
import numpy as np
from synth import hum, filt, tick, hz, SR


def crackle(m, d, seed):
    r = np.random.default_rng(seed)
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 40)):
        i = r.integers(0, len(out) - 200)
        out[i:i + 200] += filt(m.noise(200 / SR), 'high', 2500) * np.exp(-np.arange(200) / 30) * r.uniform(.3, 1)
    return out


def score(m):
    m.put(filt(m.noise(5.0), 'band', [800, 6000]) * .5, 0, .12)
    m.put(hum(100, 5.0), 0, .05)
    for t0, seed, pan in ((.5, 1, 0), (1.3, 2, -.5), (2.2, 3, .4)):
        m.put(crackle(m, .55, seed), t0, .4, pan)
        m.put(hum(hz(33 + seed * 4), 5.0 - t0 - .55), t0 + .55, .05, pan)
        m.put(tick(m, 1800), t0, .3, pan)
    m.put(crackle(m, .25, 9), 3.9, .35)
