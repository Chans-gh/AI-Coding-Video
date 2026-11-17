"""C-122 16-bit 街机闯关：投币“叮”的两音上行接一记低沉的震动，按下开始一段快速琶音；地图上每跳一格一声方波“噔”，
最高分滚动时一串高频嘀嗒；对战屏底鼓加方波低音推进，命中一记噪声爆破；通关一段方波号角加和弦。"""
import numpy as np
from synth import square, beep, kick, thud, hz, SR


def score(m):
    m.put(square(hz(83), .08, dec=20), .55, .12); m.put(square(hz(95), .3, dec=6), .63, .12)
    m.put(thud(m, .3), .55, .4)
    for k, n in enumerate([60, 64, 67, 72, 76, 79, 84]):
        m.put(square(hz(n), .08, dec=14), 1.0 + k * .05, .07)
    for h in (1.85, 2.25, 2.65):
        m.put(square(hz(72), .06, dec=20), h, .1); m.put(square(hz(79), .1, dec=12), h + .25, .1)
    for k in range(int(.9 / .035)):
        m.put(beep(3000 + (k % 3) * 400, .015), 1.7 + k * .035, .03)
    for k in range(8):
        t = 2.9 + k * .14
        if k % 2 == 0:
            m.put(kick(m), t, .5)
        m.put(square(hz([36, 36, 43, 36, 39, 39, 46, 41][k]), .12, dec=8), t, .1)
    n = int(.25 * SR)
    m.put(m.noise(.25) * np.exp(-np.arange(n) / SR * 18), 3.35, .35)
    for k, nn in enumerate([67, 72, 76, 79]):
        m.put(square(hz(nn), .12, dec=8), 4.0 + k * .09, .08)
    for nn in (72, 76, 79, 84):
        m.put(square(hz(nn), .6, dec=3), 4.36, .045)
