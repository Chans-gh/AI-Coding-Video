"""C-054 16-bit 像素 RPG：野外是方波主旋律加三角感的低音，带一份延迟的回声；对话框每打一个字“哔”一下，
碰到存档点一串上行琶音；转场一阵下扫；战斗换成更急的低音，光标移动“嘀”，砍击是噪声，胜利一段小号式短号角。"""
from synth import square, beep, whoosh, impact, hz, SR
import numpy as np


def echo(m, s, t, g, pan=0):
    m.put(s, t, g, pan)
    m.put(s, t + .18, g * .35, -pan)


def score(m):
    mel = [72, 76, 79, 76, 74, 77, 81, 77]
    for k, n in enumerate(mel):
        echo(m, square(hz(n), .22, dec=5), .1 + k * .3, .07, .2)
        echo(m, square(hz(n - 24), .28, dec=3), .1 + k * .3, .06)
    for k in range(int((2.4 - .5) / .055)):
        if k % 2 == 0:
            m.put(beep(1800, .025), .5 + k * .055, .05, pan=.1)
    for k, n in enumerate([72, 76, 79, 84, 88]):
        m.put(square(hz(n), .15, dec=7), 1.55 + k * .05, .07)
    m.put(whoosh(m, .4, 3000, 200), 2.45, .3)
    bass = [45, 45, 52, 45, 48, 48, 55, 48]
    for k in range(8):
        echo(m, square(hz(bass[k]), .12, dec=6), 2.85 + k * .2, .08)
    for x in (2.8 + .35, 2.8 + .55):
        m.put(beep(2400, .03), x, .1)
    m.put(beep(1600, .06), 2.8 + .62, .12)
    m.put(m.noise(.12) * np.exp(-np.arange(int(.12 * SR)) / SR * 30), 2.8 + .9, .4)
    m.put(impact(m), 2.8 + .95, .25)
    for k, n in enumerate([67, 67, 67, 72, 76, 79]):
        echo(m, square(hz(n), .2 if k < 5 else .5, dec=4), 4.55 + k * .07, .08)
