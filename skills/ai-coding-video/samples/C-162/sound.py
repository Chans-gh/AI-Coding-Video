"""C-162 木雕彩绘微缩景：台灯的轻微电流声和一层暖的长音铺底；小木人每走一步一声木鱼般的「笃」（一拍二的节奏，两种音高交替），拨弦弹一句轻快的小调旋律；镜头掠过时一阵柔和的风，结尾一声钟收住。"""
from synth import pad, hum, woodblock, string, whoosh, bell, hz


def score(m):
    m.put(hum(60, m.dur), 0, .02)
    m.put(pad([hz(55), hz(62), hz(67), hz(71)], m.dur, 1200, .6, 1.0), 0, .09)
    step = 1 / 6
    k = 0
    t0 = .1
    while t0 < m.dur - .3:
        m.put(woodblock(820 if k % 2 else 1040, .07), t0, .1, -.3 if k % 2 else .3)
        t0 += step * 2
        k += 1
    for t0, n in ((.2, 67), (.5, 71), (.8, 74), (1.4, 72), (1.7, 71), (2.0, 69), (2.6, 67), (2.9, 71), (3.2, 74), (3.8, 79)):
        m.put(string(m, hz(n), 1.4, .996, .6), t0, .35, .15)
    m.put(whoosh(m, 3.5, 250, 1400), .5, .08)
    m.put(bell(hz(79), 1.8), 4.2, .12)
