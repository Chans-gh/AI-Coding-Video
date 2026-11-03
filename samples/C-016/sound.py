"""C-016 纸雕灯影：暖色长音铺底，灯笼摆动时偶尔一声小铃，
一段慢悠悠的五声音阶拨弦旋律。"""
from synth import pad, string, bell, hz


def score(m):
    m.put(pad([hz(55), hz(62), hz(67), hz(74)], m.dur, 1300, a=.7), 0, .2)
    for k, (n, d) in enumerate([(67, 0), (69, .75), (72, 1.12), (74, 1.5), (72, 2.25)]):
        m.put(string(m, hz(n), 1.6), d + .05, .28, pan=-.2 + k * .1)
    for k, d in enumerate([.4, 1.3, 2.0, 2.6]):
        m.put(bell(hz(91 - k * 2), 1.0, ratio=3.0, index=.8), d, .08, pan=[-.6, 0, .6, 0][k])
