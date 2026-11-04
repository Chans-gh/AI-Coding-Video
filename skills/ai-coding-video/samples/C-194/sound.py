"""C-194 旧学院风：窗外的雨（低通噪声）铺满全程；钢琴式的慢分解和弦（拨弦加谐和钟声叠出琴音）弹 A 小调四个和弦；写字时一串钢笔划纸的沙沙声（高频带通噪声按字母节奏起伏）；3.45 秒翻页，纸张抖动加一声短扫频。"""
import numpy as np
from synth import string, bell, whoosh, filt, tt, hz

WRITE, TURN = (.5, 3.2), (3.45, 4.35)       # 和 scene.js 一致


def piano(m, f, d=2.2):
    return string(m, f, d, .998, .7) * .6 + bell(f, d, 1.0, .6) * .4


def score(m):
    m.put(filt(m.noise(m.dur), "low", 1800) * .35, 0, .6)
    chords = [(57, 60, 64), (53, 57, 60), (48, 55, 60), (52, 56, 59)]
    for i, ch in enumerate(chords):
        t0 = .15 + i * 1.1
        m.put(piano(m, hz(ch[0] - 12), 2.5), t0, .35)
        for j, n in enumerate(ch):
            m.put(piano(m, hz(n + 12)), t0 + .18 + j * .22, .28, (j - 1) * .3)
    d = WRITE[1] - WRITE[0]
    t = tt(d)
    scratch = filt(m.noise(d), "band", [3000, 9000]) * (.35 + .65 * np.abs(np.sin(2 * np.pi * 4.5 * t)) ** 2)
    scratch *= np.clip(t / .05, 0, 1) * np.clip((d - t) / .1, 0, 1)
    m.put(scratch, WRITE[0], .22, .1)
    d2 = TURN[1] - TURN[0] + .2
    t2 = tt(d2)
    rustle = filt(m.noise(d2), "band", [1500, 7000]) * (1 + np.sin(2 * np.pi * 23 * t2)) * np.sin(np.pi * t2 / d2) ** 2
    m.put(rustle, TURN[0], .3, -.1)
    m.put(whoosh(m, .5, 300, 2000), TURN[1] - .25, .25)
