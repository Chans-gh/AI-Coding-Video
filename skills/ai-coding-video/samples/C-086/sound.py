"""C-086 无缝循环科普插画：柔和的长音和弦铺满 4 秒，拨音每个阶段换一组琶音（四段对应四个标签），
下雨那一段加细碎的雨点，水汽上升时一道很轻的风声。"""
from synth import pad, pluck, whoosh, filt, hz


def score(m):
    m.put(pad([hz(50), hz(57), hz(62), hz(66)], m.dur + .5, 1200, a=.6), 0, .2)
    for k, root in enumerate([74, 78, 81, 76]):
        for j, d in enumerate([0, 4, 7, 12]):
            m.put(pluck(hz(root + d - 4), .5, 2400), k + j * .22, .2, pan=-.3 + j * .2)
    m.put(whoosh(m, 1.2, 300, 1600), .1, .12, pan=.4)                       # 蒸发
    for i in range(24):                                                    # 降水
        m.put(filt(m.noise(.03), "band", [3000, 7000]), 2.05 + m.rng.random() * .9, .05, pan=m.rng.uniform(-.6, .2))
