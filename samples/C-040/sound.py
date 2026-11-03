"""C-040 数据叙事：铅笔在方格纸上画线的沙沙声，每画到一个数据点一声拨音，
数值越高音越高；跳涨处红笔圈出时一阵快速的笔声，拉远时一声“叮”。"""
from synth import pluck, bell, filt, hz, tt
import numpy as np


def score(m):
    data = [12, 14, 13, 17, 16, 19, 18, 22, 38, 50, 58, 64]
    d = 1.9
    m.put(filt(m.noise(d), "band", [2200, 5000]) * (.6 + .4 * np.sin(tt(d) * 31)), .1, .07)
    for i, v in enumerate(data):                                          # 每个点
        p = i / 11
        t0 = .1 + 1.9 * (np.arccos(1 - 2 * p) / np.pi)                    # 和画面的 eInOutCubic 大致对齐
        m.put(pluck(hz(60 + round(v / 3)), .3, bright=3000), t0, .25, pan=-.5 + p)
    m.put(filt(m.noise(.45), "band", [2500, 6000]), 1.55, .12)            # 红笔
    m.put(bell(hz(84), 1.2, ratio=2.0, index=1.0), 2.1, .25)
