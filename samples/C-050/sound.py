"""C-050 科幻情景喜剧卡通：实验室里机器低频嗡嗡、表盘偶尔滴答，按下遥控器“哔”一声，传送门是一段扫频的哗啦声加颤动的低音，
每次穿越宇宙一记“噗”的下沉音效；最后摊手时一声拖长的长号式滑音。"""
import numpy as np
from synth import hum, tick, beep, whoosh, drone, thud, SR, hz


def score(m):
    m.put(hum(55, 5.0), 0, .1)
    for k in range(9):
        m.put(tick(m, 2400), .3 + k * .52, .12, pan=-.5)
    m.put(beep(1320, .12), 1.08, .25)
    m.put(whoosh(m, .7, 300, 2600), 1.2, .35)
    m.put(drone(hz(38), 3.6, wobble=.5), 1.3, .16)
    for x in (1.6, 2.4, 3.2):
        d = .35
        tt = np.arange(int(d * SR)) / SR
        fr = 900 * np.exp(-tt * 9) + 90
        m.put(np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 7), x, .35)
        m.put(thud(m, .2), x, .3)
    d = .8
    tt = np.arange(int(d * SR)) / SR
    fr = hz(46) * (1 - .25 * tt / d)
    m.put(np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.minimum(1, tt * 20) * np.exp(-tt * 2), 4.35, .3)
