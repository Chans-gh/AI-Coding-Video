"""C-177 信号故障：底鼓卡在强拍，每个拍点一阵“数据噪音”（降采样的方波噪声，强度跟画面故障一样），中间断断续续的电流声；第 5 拍冻结时声音也卡住、重复一小段。"""
import numpy as np
from synth import kick, square, filt, hz, tt

K = [1, .45, .8, .35, 1, .5, .9, .6]
BEAT = 60 / 160


def data_noise(m, d, hold):
    """降采样噪声：每 hold 个采样才换一个值，听起来像数据"""
    n = int(d * 44100)
    x = np.repeat(m.rng.uniform(-1, 1, n // hold + 1), hold)[:n]
    return x * np.exp(-tt(d) / (d / 3))


def score(m):
    for b in range(8):
        t = b * BEAT
        if b % 2 == 0:
            m.put(kick(m), t, .9)
        m.put(data_noise(m, .2, 6 + b % 3 * 8), t, .45 * K[b], m.rng.uniform(-.5, .5))
        m.put(filt(square(hz(36 + (b * 5) % 12), .12), "low", 1800), t, .25 * K[b])
    buzz = square(50, .9, .5) * (np.sin(2 * np.pi * 7 * tt(.9)) > .2)      # 断续的电流声
    m.put(filt(buzz, "low", 900), .55, .12, -.3)
    m.put(filt(buzz, "low", 900), 2.1, .12, .3)
    stut = filt(square(hz(60), .045, .3), "low", 2500)                     # 冻结：同一小段反复
    for k in range(7):
        m.put(stut, 5 * BEAT + k * .045, .3)
