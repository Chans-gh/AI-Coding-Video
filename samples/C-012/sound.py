"""C-012 手绘卡通角色片：轻快的拨弦铺底；雨滴落下一声高音“滴”，角色吓一跳是木鱼加短促上滑，
花瓣张开时一串钟声琶音，高兴蹦两下各一个弹跳的方波音。"""
import numpy as np
from synth import string, bell, woodblock, square, pluck, pad, whoosh, hz, tt


def score(m):
    m.put(pad([hz(60), hz(64), hz(67)], m.dur, cutoff=900), 0, .07)
    for k, n in enumerate([72, 76, 79, 76]):                          # 开场轻拨
        m.put(pluck(hz(n), .3, 2500), .05 + k * .18, .16, pan=-.2 + k * .1)
    m.put(beep_drop(), .9, .4)                                        # 雨滴落到芽尖
    m.put(woodblock(1200, .12), .96, .5, pan=-.1)                     # 吓一跳
    m.put(slide(500, 1100, .3), 1.08, .22)                            # 跳起来
    m.put(woodblock(700, .1), 1.5, .35)                               # 落地
    m.put(whoosh(m, .7, 600, 3000), 1.6, .1, pan=.2)                  # 芽往上长
    for k, n in enumerate([72, 76, 79, 84, 88]):                      # 花开
        m.put(bell(hz(n), 1.4, ratio=2.0, index=1.2), 2.1 + k * .07, .16, pan=-.3 + k * .15)
    for t0 in (2.75, 3.3):                                            # 蹦两下
        m.put(slide(400, 900, .2), t0, .18)
        m.put(woodblock(900, .08), t0 + .36, .3)
    m.put(string(m, hz(67), 1.2, bright=.6), 2.7, .25)
    m.put(string(m, hz(72), 1.0, bright=.6), 2.9, .2, pan=.3)


def slide(f0, f1, d):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / 44100) * np.exp(-t * 6)


def beep_drop():
    t = tt(.25)
    f = 1800 * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / 44100) * np.exp(-t * 18)
