"""C-171 流动的丝线：柔和的长音铺底慢慢起伏；1.5 秒重音处一声低沉的鼓和明亮的钟，丝线散开时有一阵细碎的高频闪烁，再归于平静。"""
import numpy as np
from synth import pad, bell, thud, whoosh, filt, hz, tt


def score(m):
    d = m.dur + .5
    m.put(pad([hz(n) for n in (50, 57, 62, 66)], d, 900, a=.8, rel=1.2), 0, .55)
    m.put(whoosh(m, d, 400, 1200), 0, .08)
    m.put(thud(m, .9), 1.5, .7)                                              # 重音
    m.put(bell(hz(74), 3.0, 2.0, 1.5), 1.5, .35, -.2)
    m.put(bell(hz(81), 2.6, 3.0, 1.0), 1.53, .2, .3)
    for k in range(26):                                                    # 散开时的闪烁
        t = 1.5 + .9 * (k / 26) ** 1.5
        m.put(bell(hz(88 + (k * 5) % 12), .5, 3.5, .6), t, .05 * (1 - k / 26), m.rng.uniform(-.8, .8))
