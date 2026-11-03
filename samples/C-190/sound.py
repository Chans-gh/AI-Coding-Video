"""C-190 草间弥生式无限波点：一层随波点胀缩同速起伏的长音（每秒 5.5/2π 次的音量呼吸）；窗里彩灯飞来时一串高音铃片按十六分音符重复同一个短句，越来越密；3.3 秒边界开始扩大，加一道上扬的噪声和下沉的低音，最后整屏被点吞没时一声长钟。"""
import numpy as np
from synth import pad, bell, beep, riser, drone, tt, hz


def score(m):
    t = tt(m.dur)
    breath = 1 + .45 * np.sin(5.5 * t)
    m.put(pad([hz(57), hz(64), hz(69), hz(72)], m.dur, 1200, a=.6) * breath, 0, .3)
    phrase = [81, 84, 88, 84, 86, 84, 81, 79]
    i, t0 = 0, .1
    while t0 < 4.6:
        m.put(bell(hz(phrase[i % 8]), .5, 3.0, 1.0), t0, .12, ((i % 4) - 1.5) * .3)
        t0 += .19 - .07 * min(t0 / 4.6, 1)
        i += 1
    m.put(riser(m, 1.3), 3.2, .3)
    m.put(drone(hz(33), 1.6), 3.3, .3)
    m.put(bell(hz(69), 2.0, 1.4, 2.0), 4.6, .3)
    for k in range(6):
        m.put(beep(hz(96 + k), .05), 3.4 + k * .2, .05, (k % 2) - .5)
