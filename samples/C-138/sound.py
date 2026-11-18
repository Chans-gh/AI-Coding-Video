"""C-138 后印象派厚涂：低沉的弦乐长音在夜里打转，厚重的笔一下下按进画布（短的低频刷声），光晕向外扩时一圈圈钟声，越往后越亮。"""
from synth import pad, drone, whoosh, bell, hz


def score(m):
    m.put(drone(hz(38), m.dur, wobble=.3), 0, .14)
    m.put(pad([hz(50), hz(57), hz(62), hz(66)], m.dur, 900, a=1.2), 0, .14)
    t = .1
    while t < 3.0:                                                       # 厚涂落笔
        m.put(whoosh(m, .12, 200, 900), t, .12, pan=m.rng.uniform(-.7, .7))
        t += .16 - .07 * min(1, t / 2.5)
    for k, n in enumerate([74, 78, 81, 86, 85, 90]):                     # 光晕
        m.put(bell(hz(n), 1.8, ratio=2.0, index=.8), 1.4 + k * .55, .07, pan=(-1) ** k * .5)
