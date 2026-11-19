"""C-160 玻璃版长曝光：低沉的风声和极轻的长音像时间被拉长，钟表的滴答越走越快（曝光时间在加速），偶尔一声远处的钟。"""
from synth import drone, pad, tick, whoosh, bell, hz


def score(m):
    m.put(drone(hz(36), m.dur, wobble=.4), 0, .14)
    m.put(pad([hz(48), hz(55), hz(60), hz(63)], m.dur, 600, a=1.5), 0, .12)
    m.put(whoosh(m, m.dur, 200, 600), 0, .05)
    t, k = .1, 0
    while t < m.dur - .1:                                                # 滴答越来越快
        m.put(tick(m, 3200 if k % 2 else 2400), t, .1, pan=.4)
        t += max(.07, .5 / (1 + t * t * .4))
        k += 1
    for t in (1.2, 3.6):
        m.put(bell(hz(57), 3.0, ratio=1.4, index=1.5), t, .06, pan=-.5)
