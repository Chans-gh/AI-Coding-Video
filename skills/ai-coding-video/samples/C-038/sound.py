"""C-038 科普扁平：明亮的长音和弦铺底，拨弦弹一段上行琶音，
火箭飞过时一道由低到高的风声。"""
from synth import pad, pluck, whoosh, hz


def score(m):
    m.put(pad([hz(48), hz(55), hz(64), hz(67)], m.dur + .5, 1800, a=.5), 0, .22)
    for k, n in enumerate([72, 76, 79, 84, 79, 76, 79, 83]):
        m.put(pluck(hz(n), .45, 3000), .1 + k * .34, .3, pan=-.4 + k * .1)
    m.put(whoosh(m, 2.4, 250, 2500), .2, .3, pan=-.5)                  # 火箭
