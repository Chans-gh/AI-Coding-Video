"""C-189 皮克斯式 3D 动画：开头球滚过木桌（低通噪声加滚动的轻颤），停下时一声木鱼；玩具探身时弹簧「嘣」一声上扬，压缩预备是下滑的弹簧声，起跳一声上扬滑音、落地一声闷响加弹簧余振；顶球时一声清脆的敲击，球滚走；铃片式的小旋律在三个关键动作上各点一下，结尾两下开心的小跳配两声短促上扬。"""
import numpy as np
from synth import woodblock, thud, bell, pluck, filt, tt, hz, SR


def boing(f0, f1, d, wob=9.):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d) * (1 + .06 * np.sin(2 * np.pi * wob * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5) * np.minimum(1, t / .005)


def score(m):
    d = 1.15
    roll = filt(m.noise(d), "low", 500) * (1 + .5 * np.sin(2 * np.pi * 14 * tt(d))) * np.linspace(1, .2, int(d * SR))
    m.put(roll, 0, .5, .5)
    m.put(woodblock(700), 1.12, .3, .3)
    m.put(boing(300, 520, .35), .95, .3)              # 探身
    m.put(boing(420, 180, .4, 6), 1.5, .3)            # 压缩预备
    m.put(boing(220, 700, .45), 1.95, .35)            # 起跳
    m.put(thud(m, .4), 2.45, .55)
    m.put(boing(260, 240, .7, 14), 2.47, .28)         # 落地余振
    m.put(woodblock(1200, .12), 3.1, .45, .3)         # 顶球
    roll2 = filt(m.noise(1.6), "low", 600) * np.exp(-tt(1.6) * 1.6)
    m.put(roll2, 3.1, .4, .7)
    for t0, n in ((.95, 79), (2.45, 74), (3.12, 83)):
        m.put(bell(hz(n), 1.2, 2.0, 1.5), t0, .12)
    for t0 in (3.9, 4.3):
        m.put(boing(500, 800, .18), t0, .22)
        m.put(pluck(hz(86), .3), t0 + .02, .12)
