"""C-127 发光宇宙：深沉的太空长音和缓慢展开的和弦铺底，镜头飞行时有长长的扫声；每张玻璃卡片出现时一声清亮的铃音（青、紫两张高一些），最后琥珀色结论出现时一声温暖的钟和低音。"""
from synth import pad, drone, whoosh, bell, impact, riser, hz


def score(m):
    m.put(drone(hz(33), 5.0, .3), 0, .14)
    m.put(pad([hz(45), hz(52), hz(57), hz(64)], 3.4, 800, 1.0, 1.0), 0, .1)
    m.put(whoosh(m, 1.4, 150, 1800), .1, .07)
    m.put(whoosh(m, 1.4, 150, 2200), 1.7, .07)
    m.put(riser(m, 1.2), 2.2, .06)
    m.put(bell(hz(81), 1.6, 3.0, .9), .9, .07)
    m.put(bell(hz(76), 1.6, 2.5, .9), 2.1, .07)
    m.put(impact(m), 3.4, .3)
    m.put(bell(hz(57), 2.2, 1.5, 1.4), 3.4, .16)
    m.put(pad([hz(41), hz(53), hz(57), hz(60), hz(65)], 1.6, 1300, .3, 1.0), 3.4, .14)
