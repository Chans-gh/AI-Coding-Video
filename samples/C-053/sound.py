"""C-053 像素平台：全部是方波（老游戏机的声音）。
主旋律加低音一直走，主角跳起时一声上滑的“咻”，吃到金币“叮叮”两声，最后过关小号角。"""
from synth import square, tt, hz
import numpy as np


def jump():
    """跳：方波音高从低滑到高"""
    t = tt(.18)
    f = 300 + 900 * t / .18
    return np.where(np.cumsum(f / 44100) % 1 < .25, 1.0, -1.0) * (1 - t / .18)


def score(m):
    beat = 60 / 160
    mel = [76, 76, 0, 76, 0, 72, 76, 0, 79, 0, 0, 0]
    for k, n in enumerate(mel[:int(2.3 / (beat / 2))]):              # 主旋律（八分音符）
        if n:
            m.put(square(hz(n), beat / 2 - .03, .5, .25), k * beat / 2, .12, pan=.15)
    for b in range(6):                                                 # 低音
        m.put(square(hz([40, 40, 43, 45, 43, 40][b]), beat - .05, .5, .3), b * beat, .14, pan=-.15)
    for t0 in (.35, 1.1, 1.85):                                        # 跳
        m.put(jump(), t0, .18)
    for t0 in (.62, 1.38, 2.1):                                        # 金币
        m.put(square(hz(83), .07, .5), t0, .15)
        m.put(square(hz(88), .3, .5, .12), t0 + .07, .15)
    for k, n in enumerate([67, 72, 76, 79]):                           # 过关
        m.put(square(hz(n), .12 if k < 3 else .55, .25, None if k < 3 else .3), 2.3 + k * .11, .16)
