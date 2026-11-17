"""C-120 体育直播包装：开场体育馆的人群噪声（低通噪声起伏）和厚重的锯齿和弦，探照灯扫过一阵风声；
数据卡滑入一声扫频，每条对比条填满一声短拨音、数字滚动时一串咔哒；3.6 秒进球一记重击、人群欢呼涌起、拍手。"""
from synth import saw, impact, whoosh, pluck, tick, clap, kick, filt, hz, SR
import numpy as np


def score(m):
    crowd = filt(m.noise(5.0), "band", [300, 2500])
    tl = np.arange(len(crowd)) / SR
    env = np.where(tl < 3.6, .25, 1 - .4 * (tl - 3.6) / 1.4)
    m.put(crowd * env, 0, .3)
    for i, n in enumerate([38, 38, 41, 43]):
        m.put(saw(hz(n), .9, 900), i * .9, .2)
    m.put(whoosh(m, 1.0, 300, 1500), .2, .12)
    m.put(whoosh(m, .45, 800, 5000), 1.35, .3)
    for i in range(3):
        m.put(pluck(hz(72 + i * 4), .4, 3500), 2.5 + i * .25, .25)
        for k in range(8):
            m.put(tick(m, 3200), 1.8 + i * .25 + k * .07, .06)
    m.put(impact(m), 3.6, .7)
    m.put(kick(m), 3.6, .5)
    for k in range(6):
        m.put(clap(m), 3.75 + k * .17, .2, pan=-.4 + k * .16)
    m.put(saw(hz(50), 1.2, 1600), 3.6, .2)
