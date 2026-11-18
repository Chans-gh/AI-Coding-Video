"""C-136 威尼斯风景画：安静明亮的长和弦像午后的空气，船桨一下一下拨水（柔软的低刷声），远处钟楼响两下，水面碎光是零星的高音拨弦。"""
from synth import pad, whoosh, bell, pluck, hz


def score(m):
    m.put(pad([hz(55), hz(62), hz(67), hz(71)], m.dur, 1600, a=1.2), 0, .14)
    t = .3
    while t < 4.8:                                                       # 划桨
        m.put(whoosh(m, .5, 150, 700), t, .12, pan=-.2)
        t += 2 * 3.14159 / 2.4
    for i, at in enumerate([1.0, 2.2]):                                  # 钟楼
        m.put(bell(hz(55), 2.5, ratio=2.4, index=1.2), at, .1, pan=.3)
    for i in range(10):                                                  # 碎光
        m.put(pluck(hz([83, 86, 88, 91][i % 4]), .4), 1.4 + i * .33 + .08 * m.rng.random(), .05, pan=m.rng.uniform(-.8, .8))
