"""C-179 平铺整理：每件物品滑入是一小段摩擦声，落定时一声干脆的“嗒”（木块加短咔哒，音高按物品轮换）；整组换位时一阵轻的滑动声，标注出现时几下细小的提示音；底下是很轻的拨音节奏。"""
import numpy as np
from synth import filt, tt, woodblock, tick, pluck, beep, hz

N = 13


def slide(m, d):
    return filt(m.noise(d), "band", [600, 3000]) * np.sin(np.pi * tt(d) / d) ** 2


def score(m):
    for i in range(N):
        t0 = .15 + i * .15
        m.put(slide(m, .3), t0, .12, -.6 + 1.2 * (i % 4) / 3)
        m.put(woodblock(700 + 90 * (i % 5), .12), t0 + .33, .45, -.3 + .6 * (i % 3) / 2)
        m.put(tick(m, 4200), t0 + .33, .25)
    m.put(slide(m, .8), 2.45, .35, -.2)
    m.put(slide(m, .8), 2.6, .3, .2)
    for k in range(6):
        m.put(beep(hz(84 + (k % 3) * 3), .05), 3.3 + k * .12, .1, -.5 + k * .2)
    for b in range(12):
        m.put(pluck(hz((50, 57, 55, 57)[b % 4]), .3, 1200), b * .375, .18)
