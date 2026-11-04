"""C-063 移轴微缩：城市的远景噪声压得很低，车流用一串快速掠过的扫频表现延时节奏，
轻快的拨弦走一条简单的旋律，云影经过时低频轻轻起伏。"""
from synth import pluck, whoosh, pad, drone, hat, hz


def score(m):
    m.put(drone(hz(38), m.dur + .4, wobble=.3), 0, .07)                  # 城市底噪
    m.put(pad([hz(60), hz(64), hz(67), hz(71)], m.dur, cutoff=1300), .1, .08)
    for k in range(16):                                                  # 延时的车流
        m.put(whoosh(m, .35, 500, 2600), k * .3 + .05, .07, pan=-.6 + (k % 5) * .3)
    for k, n in enumerate([76, 79, 83, 79, 81, 84, 79, 76, 74, 76, 79, 83]):
        m.put(pluck(hz(n), .3, 2800), .2 + k * .38, .13, pan=.2 - (k % 3) * .2)
    for k in range(20):
        m.put(hat(m), .15 + k * .25, .06, pan=.35)
