"""C-115 热敏小票：每打一行一段短促的走纸马达声（带通噪声）加打印头的细碎咔哒；
打勾时笔划过纸的沙声，盖章一声闷响，撕纸一段由高到低的撕裂噪声。"""
from synth import filt, tick, thud, whoosh, beep, SR
import numpy as np


def score(m):
    for i in range(15):                                 # 走纸：每行 0.17 秒
        t0 = .3 + i * .17
        n = m.noise(.13) * np.exp(-np.linspace(0, 2, int(SR * .13)))
        m.put(filt(n, "band", [700, 2600]), t0, .35)
        for k in range(4):
            m.put(tick(m, 4200), t0 + k * .03, .06)
    for j in range(4):                                  # 打勾
        m.put(filt(m.noise(.12), "band", [2500, 7000]), 3.0 + j * .17, .12, pan=-.2 + j * .12)
    m.put(thud(m, .35), 3.8, .6)                        # 盖章
    m.put(whoosh(m, .5, 5000, 800), 4.35, .35)          # 撕下
    m.put(beep(1568, .1), 3.0 - .05, .1)
