"""C-187 吉卜力式手绘动画：开头是轻风（低通噪声）、两三声鸟叫和木吉他式的拨弦分解和弦（大调）；1.3 秒阵风从左边起、一路扫到右边（扫频噪声由左到右移声像），树叶沙沙；女孩抬手按住帽子时旋律落到主音，长音铺底收尾。"""
import numpy as np
from synth import string, pad, whoosh, filt, tt, hz, SR


def chirp(f0, f1, d):
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(f0 + (f1 - f0) * (t / d) ** .6) / SR
    return np.sin(ph) * np.sin(np.pi * t / d) ** 2


def score(m):
    m.put(filt(m.noise(m.dur), "low", 600) * .5, 0, .35)
    for t0, n in ((.4, 0), (.55, 1), (1.05, 0), (3.9, 1)):
        m.put(chirp(3200 + n * 500, 4400 + n * 300, .09), t0, .12, .5 - n)
        m.put(chirp(3600, 2900, .07), t0 + .12, .1, .5 - n)
    chords = [(55, 59, 62, 67), (52, 55, 59, 64), (48, 52, 55, 60), (50, 54, 57, 62)]
    for i, ch in enumerate(chords):
        t0 = .1 + i * 1.15
        for j, n in enumerate(ch + (ch[1] + 12,)):
            m.put(string(m, hz(n), 1.6, .996, .55), t0 + j * .14, .22, (j - 2) * .15)
    for t0, n in ((.2, 74), (.8, 76), (1.4, 79), (2.0, 76), (2.6, 74), (3.05, 71), (3.35, 67)):
        m.put(string(m, hz(n), 1.4, .997, .7), t0, .2, .1)
    m.put(pad([hz(43), hz(55), hz(62), hz(67)], 2.2, 900), 2.8, .16)
    # 阵风：由左到右扫过，分几段换声像
    for k in range(5):
        m.put(whoosh(m, 1.2, 250 + k * 80, 1600), 1.25 + k * .22, .22, -.8 + k * .4)
    leaves = filt(m.noise(2.0), "band", [3000, 8000]) * np.sin(np.pi * tt(2.0) / 2.0) ** 2
    m.put(leaves * (1 + .6 * np.sin(2 * np.pi * 9 * tt(2.0))), 1.4, .14, -.2)
