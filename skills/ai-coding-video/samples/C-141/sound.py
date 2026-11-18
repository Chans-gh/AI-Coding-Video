"""C-141 表现主义：不安的低音持续往上爬，长笔触落下是拖长的刷声；画面开始扭动后，失谐的弦乐和越来越紧的心跳一起压上来。"""
from synth import drone, whoosh, string, thud, riser, hz


def score(m):
    m.put(drone(hz(36), m.dur, wobble=.3), 0, .16)
    m.put(drone(hz(37), m.dur, wobble=.3), 0, .1, pan=.4)                  # 半音失谐
    t = .1
    while t < 2.2:                                                       # 长笔
        m.put(whoosh(m, .25, 300, 1400), t, .1, pan=m.rng.uniform(-.7, .7))
        t += .22
    m.put(riser(m, 2.6), 2.2, .08)
    for k, n in enumerate([61, 62, 66, 67]):                             # 扭动：失谐的弦
        m.put(string(m, hz(n), 2.2), 2.3 + k * .5, .1, pan=(-1) ** k * .5)
    b = 2.4
    while b < 4.9:                                                       # 心跳，越来越快
        m.put(thud(m, .35), b, .3); m.put(thud(m, .3), b + .18, .2)
        b += .8 - .3 * (b - 2.4) / 2.5
