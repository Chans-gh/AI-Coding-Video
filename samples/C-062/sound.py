"""C-062 后室录像带：荧光灯的 60 Hz 嗡鸣和空调般的低频风声一直在，磁带的嘶嘶声压底；
灯闪时一声电流爆音，脚步在地毯上很闷，每条规则出现前一声极轻的磁带咔哒。恐惧全靠环境音，没有怪物音效。"""
import numpy as np
from synth import hum, thud, tick, whoosh, drone, filt, tt


def score(m):
    d = m.dur
    m.put(hum(60, d), 0, .13)                                   # 荧光灯
    m.put(hum(120, d), 0, .05)
    m.put(drone(31, d, wobble=.4), 0, .10)                      # 空调低频
    m.put(filt(m.noise(d), "high", 3000), 0, .06)               # 磁带嘶嘶
    m.put(filt(m.noise(d), "band", [200, 900]), 0, .05)         # 远处的风
    for k in range(10):                                         # 地毯上的脚步
        m.put(thud(m, .32), .25 + k * .48, .22, pan=-.15 + (k % 2) * .3)
    for t0 in (.55, 1.95, 3.35):                                # 规则出现
        m.put(tick(m, 1800), t0, .18)
    for t0 in (1.2, 2.6, 4.1):                                  # 灯闪一下的电流声
        m.put(filt(m.noise(.12), "band", [900, 5000]) * np.exp(-tt(.12) * 26), t0, .3, pan=.25)
    m.put(whoosh(m, 1.4, 80, 420), 3.3, .12)
