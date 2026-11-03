"""C-058 可玩游戏录屏：芯片音——轻快的方波主旋律和贝斯一直走，
每次起跳一个上滑方波，吃到金币一声脆响，踩中小怪一声低的爆音，中间穿插踩镲当鼓点。"""
import numpy as np
from synth import square, saw, beep, hat, kick, thud, hz, tt


def chirp(f0, f1, d, duty=.5):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    ph = np.cumsum(f) / 44100
    return (np.sign(np.sin(2 * np.pi * ph) + (duty - .5)) * np.exp(-t * 9)).astype(np.float32)


def score(m):
    beat = 60 / 150
    mel = [76, 79, 83, 79, 81, 76, 79, 74, 76, 79, 83, 86, 84, 79, 76, 72]
    for k, n in enumerate(mel):                                   # 主旋律
        m.put(square(hz(n), beat * .9, duty=.25), k * beat * .5, .13, pan=.15)
    for k in range(14):                                           # 贝斯
        m.put(square(hz([40, 40, 45, 43][k % 4]), beat * .8, duty=.5), k * beat, .16, pan=-.15)
        m.put(kick(m), k * beat, .22)
        m.put(hat(m), k * beat + beat / 2, .09, pan=.3)
    for t0 in (.52, 1.18, 1.56, 2.10, 2.62, 3.24, 3.86):          # 起跳
        m.put(chirp(420, 1100, .16, .25), t0, .28)
    for t0 in (.78, 1.42, 2.0, 2.52, 3.1, 3.64):                  # 金币
        m.put(beep(1760, .05), t0, .2, pan=.25)
        m.put(beep(2640, .07), t0 + .05, .16, pan=.25)
    for t0 in (2.2, 3.4):                                         # 踩中小怪
        m.put(chirp(900, 120, .22, .5), t0, .3)
        m.put(thud(m, .3), t0, .3)
