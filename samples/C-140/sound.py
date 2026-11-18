"""C-140 综合主义平涂：一段温暖的长和弦像午后的空气，两阵风声跟着树冠摆动，
深蓝色面滑入时一声低沉的鼓和风声，标题弹出时一声低铃。"""
from synth import pad, whoosh, thud, bell, pluck, hz


def score(m):
    m.put(pad([hz(50), hz(57), hz(62), hz(66)], m.dur + .4, 800, a=.9), 0, .16)
    m.put(whoosh(m, 1.6, 200, 900), .1, .08, pan=-.3)
    m.put(whoosh(m, 1.4, 250, 1100), 1.3, .07, pan=.3)
    for i, n in enumerate([62, 66, 69, 74, 69, 66]):
        m.put(pluck(hz(n), .8, 2500), .3 + i * .4, .07, pan=-.2 + i * .08)
    m.put(whoosh(m, .7, 300, 2500), 2.55, .14)
    m.put(thud(m, .5), 3.1, .35)
    m.put(bell(hz(57), 2.0, 3.5, 1.5), 3.25, .14)
