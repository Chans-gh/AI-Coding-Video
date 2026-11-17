"""C-148 街头波普涂鸦：每拍 0.375 秒的派对节拍，底鼓、拍手和开镲；方波贝斯跳八度，
每 8 帧换姿势的地方叠一声短促的木鱼；转场时一声放大的哨音滑上去，进到第二幕和弦更亮。"""
import numpy as np
from synth import kick, clap, hat, square, woodblock, whoosh, hz, SR

BT = .375


def score(m):
    for b in range(14):
        t = b * BT
        if t > 4.95:
            break
        m.put(kick(m), t, .7)
        if b % 2:
            m.put(clap(m), t, .45)
        m.put(hat(m, open_=True), t + BT / 2, .12)
        root = 41 if t < 3.05 else 46
        m.put(square(hz(root + (12 if b % 2 else 0)), .16, dec=10), t, .12)
    for k in range(int(5 / (8 / 30))):
        m.put(woodblock(1200 + (k % 3) * 300, .05), k * 8 / 30, .12, pan=((k % 3) - 1) * .4)
    d = .7
    tt = np.arange(int(d * SR)) / SR
    fr = 600 * np.exp(tt / d * np.log(5))
    m.put(np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.minimum(1, tt * 10) * np.exp(-((tt - d) ** 2) * 4), 2.35, .14)
    m.put(whoosh(m, .7, 200, 4000), 2.35, .3)
    for n in (70, 74, 77):
        m.put(square(hz(n), .3, dec=5), 3.05, .06)
