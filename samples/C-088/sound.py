"""C-088 圆珠笔速写：钟表的滴答声从头走到尾；描轮廓时几道圆珠笔划纸的长声，排线时短促的沙沙声一层比一层密，最后闹铃响一小串。"""
from synth import tick, whoosh, bell, pad, hz


def score(m):
    m.put(pad([hz(60), hz(67), hz(72)], m.dur, 1000, a=.8), 0, .1)
    for k in range(10):                                                  # 滴答
        m.put(tick(m, 2600 if k % 2 else 3400), k * .5, .16, pan=.2)
    for k in range(8):                                                   # 轮廓
        m.put(whoosh(m, .3, 1500, 3800), .05 + k * .1, .07, pan=-.2)
    t = 1.1
    while t < 4.5:                                                       # 排线
        m.put(whoosh(m, .05, 3000, 7000), t, .06 + .03 * (t - 1.1) / 3.4, pan=m.rng.uniform(-.4, .4))
        t += .11 - .05 * (t - 1.1) / 3.4
    for k in range(10):                                                  # 闹铃
        m.put(bell(hz(88 if k % 2 else 86), .3, ratio=3.1, index=2.2), 4.3 + k * .06, .09, pan=(-1) ** k * .3)
