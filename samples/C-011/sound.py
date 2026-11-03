"""C-011 沙画：全程一层很轻的沙沙声，沙子流动换画时一阵起伏的风声，
新画面停稳时一串拨弦。"""
from synth import whoosh, string, pad, filt, hz
import numpy as np


def score(m):
    m.put(filt(m.noise(m.dur), "band", [3000, 9000]) * .5, 0, .08)        # 细沙
    m.put(pad([hz(57), hz(64), hz(69)], m.dur, 1000, a=.6), 0, .16)
    m.put(whoosh(m, 1.2, 300, 2500), .95, .35)                            # 沙子流动
    for k, n in enumerate([69, 72, 76, 81]):
        m.put(string(m, hz(n), 1.4), 2.05 + k * .08, .25, pan=-.3 + k * .2)
