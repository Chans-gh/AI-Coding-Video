"""C-072 爆炸图 / 剖面：安静的影棚底噪和一层干净的长音；零件一层层弹开时各有一声轻轻的机械「咔」和上行的拨音，标注引线出现时细小的滴答，最后零件按原路合拢，每层一声下行的拨音，合上的一刻一记沉稳的闷响。"""
from synth import pad, tick, pluck, thud, whoosh, hz


def score(m):
    m.put(pad([hz(57), hz(64), hz(69), hz(71)], 5.0, 1200, .6, .8), 0, .07)
    for k in range(6):
        t = .8 + k * .12 + .25
        m.put(tick(m, 2600 - k * 150), t, .12)
        m.put(pluck(hz(64 + k * 2), .4, 2500), t, .1)
    m.put(whoosh(m, 1.0, 300, 2000), .8, .05)
    for k in range(6):
        m.put(tick(m, 4200), 1.5 + k * .05 + .2, .05)
    for k in range(6):
        t = 3.6 + (5 - k) * .06 + .5
        m.put(pluck(hz(76 - k * 2), .35, 2200), t, .08)
    m.put(whoosh(m, .8, 2000, 300), 3.6, .05)
    m.put(thud(m, .4), 4.62, .3)
    m.put(tick(m, 1500), 4.62, .15)
