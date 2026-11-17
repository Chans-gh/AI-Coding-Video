"""C-154 逐帧沸腾线：轻快的拨弦小调铺一层，起跑前憋气的上滑音，冲刺“嗖”一声，落进水洼一记扑通加水花噪声，
甩水时三下短促的抖动声，最后招手一个小木琴音。"""
import numpy as np
from synth import pluck, whoosh, thud, filt, woodblock, bell, hz, SR


def score(m):
    for k, n in enumerate([67, 71, 74, 71, 67, 71, 74, 79]):
        m.put(pluck(hz(n), .3, bright=3000), .1 + k * .14, .12, pan=-.2)
    d = .45
    tt = np.arange(int(d * SR)) / SR
    m.put(np.sin(2 * np.pi * np.cumsum(300 + 500 * tt / d) / SR) * np.minimum(1, tt * 8), 1.15, .1)
    m.put(whoosh(m, .25, 800, 4000), 1.6, .4)
    m.put(thud(m, .5), 1.8, .6)
    n = int(.6 * SR)
    m.put(filt(m.noise(.6), 'band', [1500, 6000]) * np.exp(-np.arange(n) / SR * 6), 1.8, .35)
    for k in range(3):
        m.put(filt(m.noise(.12), 'band', [2000, 7000]) * np.exp(-np.arange(int(.12 * SR)) / SR * 25), 3.0 + k * .22, .3, pan=(-1) ** k * .4)
        m.put(woodblock(700 + k * 120, .06), 3.0 + k * .22, .15)
    for k, nn in enumerate([79, 84]):
        m.put(bell(hz(nn), .8, ratio=4.0, index=.5), 4.05 + k * .17, .1)
