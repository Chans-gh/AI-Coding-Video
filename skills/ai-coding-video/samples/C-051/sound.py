"""C-051 扁平矢量角色短片：卡通音效——蹲下一声低的“啵”，起跳上滑音，落地闷响，
架子吱呀一歪，饼干下落的下滑哨音，砸中头顶木鱼一响，最后开心的两声钟。"""
import numpy as np
from synth import woodblock, thud, bell, pluck, pad, tick, hz, tt, filt


def glide(f0, f1, d, dec=4):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / 44100) * np.exp(-t * dec)


def score(m):
    m.put(pad([hz(65), hz(69), hz(72)], m.dur, cutoff=1000), 0, .06)
    for k, n in enumerate([72, 74, 76]):
        m.put(pluck(hz(n), .25, 2000), .05 + k * .12, .12)
    m.put(glide(300, 180, .2, 10), .45, .3)                     # 蹲下
    m.put(glide(400, 1300, .35, 3), .73, .26)                    # 起跳
    m.put(thud(m, .4), 1.44, .55)                                # 落地
    m.put(woodblock(500, .15), 1.46, .3)
    creak = filt(m.noise(.35), "band", [700, 1400]) * np.sin(2 * np.pi * 9 * tt(.35)) ** 2
    m.put(creak, 2.15, .35, pan=.4)                              # 架子吱呀
    m.put(glide(2200, 600, .55, 1), 2.25, .18, pan=.2)           # 饼干下落
    m.put(woodblock(1000, .14), 2.8, .6)                         # 砸中
    m.put(tick(m, 2500), 2.96, .25)
    m.put(bell(hz(84), 1.2, ratio=2.0, index=1.0), 3.3, .2)      # 开心
    m.put(bell(hz(88), 1.2, ratio=2.0, index=1.0), 3.45, .2, pan=.3)
