"""C-193 南方公园式数字剪纸：办公室空调的低嗡声铺底；员工颠着走进来，每一步一声纸板轻响（短促带通噪声）；老板说话是一串忽高忽低的方波「嘟嘟」声，代替台词；停顿处什么都没有；2.75 秒硬切到特写时一声短促的弦乐刺，员工开口是低一点的嘟嘟声；4.0 秒切回远景，老板走掉的脚步声，员工整片倒下时一声闷响加纸板拍地。"""
import numpy as np
from synth import hum, square, thud, string, filt, tt, hz


def step(m):
    return filt(m.noise(.06), "band", [600, 2400]) * np.exp(-tt(.06) * 50)


def babble(m, t0, t1, base, seed):
    rng = np.random.default_rng(seed)
    t = t0
    while t < t1:
        d = rng.uniform(.06, .13)
        m.put(square(hz(base + rng.integers(-3, 5)), d, .35, 20), t, .09)
        t += d + rng.uniform(.01, .05)


def score(m):
    m.put(hum(50, m.dur), 0, .05)
    for i in range(6):
        m.put(step(m), .15 + i * .2, .3, -.4)
    babble(m, 1.45, 2.3, 52, 1)
    for n in (64, 67, 71):
        m.put(string(m, hz(n), .9, .99, .9), 2.75, .18)
    babble(m, 3.35, 3.85, 60, 2)
    for i in range(4):
        m.put(step(m), 4.1 + i * .2, .25, .5)
    m.put(thud(m, .4), 4.55, .6)
    m.put(filt(m.noise(.12), "low", 1500) * np.exp(-tt(.12) * 25), 4.55, .5)
