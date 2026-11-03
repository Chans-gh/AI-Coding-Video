"""C-060 16mm 黑白纪录片：放映机的齿孔咔哒一直走（24 格一秒），片头倒数每秒一声提示音，
片名卡一声低沉的重击，正片里织机按节奏哐当，底下是胶片与光学声轨的嘶嘶声和电源嗡鸣。"""
import numpy as np
from synth import tick, impact, thud, beep, hum, woodblock, whoosh, filt, tt, SR


def score(m):
    d = m.dur
    hiss = filt(m.noise(d), "high", 2200) * .5 + filt(m.noise(d), "band", [300, 1200]) * .3
    m.put(hiss, 0, .10)                                     # 光学声轨的嘶嘶
    m.put(hum(50, d), 0, .05)                               # 放映机电源
    for k in range(int(d * 24)):                            # 齿孔：每格一声极轻的咔哒
        m.put(tick(m, 5200), k / 24, .035, pan=-.25)
    for k in range(3):                                      # 倒数提示音
        m.put(beep(1000, .06), .06 + k * .42, .3)
    m.put(impact(m), 1.25, .5)                              # 片名卡落下
    m.put(whoosh(m, .5, 200, 1800), 1.2, .18)               # 接片
    m.put(thud(m, .4), 2.4, .35)                            # 正片开始
    t0 = 2.45
    while t0 < d:                                           # 织机：梭子来回，一下一下
        m.put(woodblock(300, .16), t0, .4, pan=-.3)
        m.put(woodblock(360, .14), t0 + .42, .34, pan=.3)
        t0 += .84
