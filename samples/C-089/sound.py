"""C-089 碎色印象派：温暖的长音和缓的铺底；画笔一下下落在布上，是短而软的刷声，越画越密；水面碎光出现时一串轻轻的钟声。"""
from synth import pad, whoosh, bell, hz


def score(m):
    m.put(pad([hz(53), hz(60), hz(64), hz(69)], m.dur, 1200, a=1.0), 0, .16)
    t = .1
    while t < 3.9:                                                       # 落笔
        m.put(whoosh(m, .09, 500, 1600), t, .1, pan=m.rng.uniform(-.6, .6))
        t += .14 - .06 * min(1, t / 3)
    for k, n in enumerate([81, 84, 88, 86, 91, 88]):                     # 碎光
        m.put(bell(hz(n), 1.4, ratio=2.0, index=.6), 2.8 + k * .3, .07, pan=(-1) ** k * .4)
