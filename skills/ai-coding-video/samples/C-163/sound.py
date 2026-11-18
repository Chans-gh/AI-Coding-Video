"""C-163 夜色平涂海报：温柔的电钢琴似拨弦弹一段慢和弦，三格各一声不同高度的铃对应三个时刻，
远处一阵车声；三格收拢成楼时一段上行的扫频，窗户亮灯时三声叮。"""
from synth import pluck, pad, bell, whoosh, riser, hz


def score(m):
    m.put(pad([hz(50), hz(57), hz(64), hz(69)], m.dur + .4, 900, a=.7), 0, .14)
    for i, n in enumerate([69, 72, 76, 74, 72, 69, 67, 69]):
        m.put(pluck(hz(n), .9, 2400), .1 + i * .28, .1, pan=-.3 + (i % 3) * .3)
    for i, n in enumerate([81, 79, 76]):
        m.put(bell(hz(n), 1.0, 3.5, .8), .3 + i * .6, .08, pan=-.5 + i * .5)
    m.put(whoosh(m, 1.6, 100, 400), .6, .06, pan=.5)
    m.put(riser(m, .9), 2.3, .12)
    for i, n in enumerate([84, 88, 91]):
        m.put(bell(hz(n), 1.2, 3.5, .6), 3.15 + i * .1, .1, pan=-.4 + i * .4)
