"""C-180 工笔：古筝式的拨弦（Karplus-Strong）。开头一串五声音阶的刮奏，勾线时零星的单音，上色时慢一点的和音，题款出现时一声低音收住；底下一层很轻的长音。"""
from synth import string, pad, filt, hz

PENTA = [50, 52, 54, 57, 59, 62, 64, 66, 69, 71, 74]     # D 宫五声


def score(m):
    d = m.dur + .5
    m.put(filt(pad([hz(38), hz(45)], d, 500, a=1.2, rel=1.5), "low", 600), 0, .25)
    for i, n in enumerate(PENTA[2:]):                       # 刮奏
        m.put(string(m, hz(n), 1.6, .996, .55), .05 + i * .045, .32, -.6 + i * .12)
    for t0, n in ((.7, 69), (1.1, 66), (1.5, 64), (1.85, 62)):
        m.put(string(m, hz(n), 1.8, .997, .45), t0, .4, .2)
    for t0, ns in ((2.2, (57, 64)), (2.9, (59, 66))):
        for j, n in enumerate(ns):
            m.put(string(m, hz(n), 2.0, .997, .4), t0 + j * .06, .35, -.3 + .6 * j)
    m.put(string(m, hz(38), 2.5, .998, .3), 3.45, .55)
    m.put(string(m, hz(62), 2.0, .997, .4), 3.5, .3)
