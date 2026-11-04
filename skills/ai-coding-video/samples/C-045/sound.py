"""C-045 玻璃质感产品：影棚里的低频铺底，长条灯扫过是两道轻扫频；
零件散开时一串上行的玻璃钟声，重音处零件「咔」地合拢——一声金属撞击加低频重击，之后余韵拉长。"""
from synth import bell, impact, thud, whoosh, pad, drone, tick, hz


def score(m):
    m.put(drone(hz(34), m.dur + .4, wobble=.1), 0, .09)
    m.put(pad([hz(55), hz(62), hz(67)], m.dur, cutoff=1400, a=.8, rel=1.2), .2, .09)
    m.put(whoosh(m, 1.2, 400, 5000), .3, .14, pan=-.4)                  # 灯扫过
    m.put(whoosh(m, 1.2, 400, 5000), 1.9, .12, pan=.4)
    for k, n in enumerate([72, 76, 79, 83, 86]):                        # 零件散开
        m.put(bell(hz(n), 2.2, ratio=3.2, index=1.4), .5 + k * .22, .15, pan=-.4 + k * .2)
    m.put(tick(m, 6000), 3.3, .12)
    m.put(impact(m), 3.38, .62)                                         # 咔地合拢
    m.put(bell(hz(60), 3.0, ratio=2.0, index=2.2), 3.38, .3)
    m.put(thud(m, .6), 3.4, .4)
    m.put(pad([hz(60), hz(67), hz(72), hz(79)], 1.4, cutoff=2600, a=.05), 3.7, .13)
