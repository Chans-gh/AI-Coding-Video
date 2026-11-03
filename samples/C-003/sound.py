"""C-003 钢笔淡彩：安静的街景写生——笔尖沙沙（带通噪声一小段一小段），
每画一栋房子一声轻木响，上色时一阵低缓的水声，落款盖章一声闷响，底下一直有极轻的街声。"""
import numpy as np
from synth import woodblock, thud, whoosh, pluck, pad, drone, hz, tt, filt


def scratch(m, d, seed=0):
    n = m.noise(d)
    env = np.exp(-tt(d) * 7) * (0.6 + 0.4 * np.sin(2 * np.pi * 26 * tt(d)))
    return filt(n, "band", [1800, 5200]) * env


def score(m):
    m.put(drone(hz(40), m.dur + .4, wobble=.15), 0, .05)              # 街的底噪
    m.put(pad([hz(60), hz(64), hz(67), hz(71)], m.dur, cutoff=900, a=.6), .2, .06)
    for i in range(6):                                                # 一栋栋画出来
        t0 = .25 + i * .42
        m.put(scratch(m, .34, i), t0, .30, pan=-.5 + i * .18)
        m.put(woodblock(560 + i * 40, .1), t0 + .3, .14, pan=-.4 + i * .16)
        m.put(whoosh(m, .5, 150, 700), t0 + .36, .10, pan=.3 - i * .1)  # 淡彩铺上
    m.put(whoosh(m, 1.0, 120, 600), 2.55, .16)                        # 路面大笔一刷
    for k, n in enumerate([69, 74, 76]):                              # 人影几笔
        m.put(scratch(m, .2, 20 + k), 3.3 + k * .18, .22, pan=.2)
        m.put(pluck(hz(n), .5, 1800), 3.32 + k * .18, .13)
    m.put(thud(m, .45), 4.3, .4)                                      # 盖章
    m.put(woodblock(420, .22), 4.3, .4)
