"""C-097 单线雕版：一根线从圆心绕出去，配一道从低到高、越来越亮的长扫频和缓慢的铺底；线收尾时一声钟，月相变化时铺底转到大调。"""
from synth import whoosh, pad, bell, drone, hz


def score(m):
    m.put(drone(hz(38), m.dur, .3), 0, .2)
    m.put(whoosh(m, 3.4, 200, 2600), .1, .22)                            # 刻刀绕圈
    m.put(pad([hz(57), hz(60), hz(64)], 3.0, 1000, a=1.2), 0, .14)
    m.put(pad([hz(57), hz(61), hz(64), hz(69)], 2.2, 1400, a=.6), 2.8, .14)
    m.put(bell(hz(76), 2.4, ratio=2.0, index=1.0), 3.4, .16, pan=.2)
    m.put(bell(hz(81), 2.0, ratio=2.0, index=.8), 3.75, .1, pan=-.2)
