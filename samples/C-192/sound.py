"""C-192 瑞克和莫蒂式扁平卡通：车库里的电器低频嗡嗡声铺满全程；0.78 秒按按钮一声「哔」，1.0 秒传送门打开是一道湿润的上扬扫频加持续的旋涡声（调制的带通噪声）；每次换姿势配一声短促的木鱼或滑音，看镜头的停顿处全部安静；3.35 秒杯子落地碎裂，4.35 秒传送门「啵」地关上。"""
import numpy as np
from synth import hum, beep, whoosh, woodblock, tick, filt, tt, hz, SR


def slide(f0, f1, d):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)


def score(m):
    m.put(hum(60, m.dur), 0, .08)
    m.put(beep(1800, .06), .78, .25)
    m.put(beep(2400, .05), .86, .2)
    m.put(slide(200, 1400, .4), 1.0, .3)
    d = 4.35 - 1.0
    t = tt(d)
    swirl = filt(m.noise(d), "band", [500, 1600]) * (.6 + .4 * np.sin(2 * np.pi * 6 * t / 6.28 * 6))
    m.put(swirl * np.clip(t / .2, 0, 1), 1.0, .25)
    for t0, f in ((1.12, 900), (2.45, 600), (2.75, 500), (3.35, 1100)):
        m.put(woodblock(f, .12), t0, .3)
    m.put(slide(700, 350, .2), 1.75, .15)
    crash = filt(m.noise(.35), "high", 2500) * np.exp(-tt(.35) * 14)
    m.put(crash, 3.55, .5, .3)
    for k in range(4):
        m.put(tick(m, 4000 + k * 700), 3.57 + k * .04, .2, .3)
    m.put(slide(1400, 120, .25), 4.35, .4)
    m.put(woodblock(400, .2), 4.5, .25)
