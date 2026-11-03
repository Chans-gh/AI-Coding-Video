"""C-008 一笔画：一条线从头画到尾，就用一条不断的细噪声当笔尖声；
每拍一个拨音沿五声音阶往上走，镜头拉远、题字出来时一记钟声。"""
from synth import pluck, bell, pad, filt, hz, tt
import numpy as np


def score(m):
    d = 2.45
    n = filt(m.noise(d), "band", [1800, 4500]) * (.6 + .4 * np.sin(tt(d) * 23))
    m.put(n, 0, .06)
    mel = [67, 69, 72, 74, 76, 79, 81]
    for k in range(7):
        m.put(pluck(hz(mel[k]), .5, bright=2600), k * .375, .25, pan=-.4 + k * .13)
    m.put(pad([hz(55), hz(62), hz(67)], 1.0, 1200, a=.3), 2.0, .18)
    m.put(bell(hz(79), 2.0, ratio=2.0, index=1.0), 2.6, .3)
