"""C-094 民间故事绘本：拨弦奏一段五声音阶的乡间小调，长音垫底；铅笔起稿时细细的沙沙声，水彩晕开时柔和的扫过，水粉一笔笔铺上时一串轻轻的木鱼，灯笼亮起时一声铃。"""
from synth import pluck, pad, whoosh, tick, woodblock, bell, hz


def score(m):
    m.put(pad([hz(50), hz(57), hz(62)], 5.0, 900, .8, 1.0), 0, .1)
    tune = [62, 64, 67, 69, 67, 64, 62, 64, 67, 72, 69, 67, 64]
    for i, n in enumerate(tune):
        m.put(pluck(hz(n), .5, 3000), .15 + i * .375, .17, pan=(i % 2 - .5) * .3)
    for k in range(14):
        m.put(tick(m, 6000), .1 + k * .1, .03, pan=-.4 + .06 * k)
    m.put(whoosh(m, 1.2, 250, 900), 1.6, .08)
    for k in range(10):
        m.put(woodblock(900 + 60 * (k % 4), .08), 2.3 + k * .12, .06, pan=(-1) ** k * .3)
    m.put(bell(hz(79), 2.0, 3.0, 1.0), 3.7, .08, pan=.3)
