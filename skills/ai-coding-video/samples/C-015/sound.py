"""C-015 窗花：红纸展开时一阵沙沙的纸声（高频噪声扫过），
纸透出暖光时一组钟声和弦慢慢铺开，飘落的光点是零星的小铃。"""
from synth import whoosh, bell, pad, hz


def score(m):
    m.put(whoosh(m, 1.05, 2500, 7000), 0, .35)                          # 展开
    m.put(pad([hz(55), hz(62), hz(67), hz(71)], m.dur - .8, 1600, a=.5), .9, .22)
    for k, n in enumerate([67, 71, 74]):                                # 透光
        m.put(bell(hz(n), 2.2, ratio=2.0, index=1.2), .95 + k * .12, .3, pan=-.3 + k * .3)
    for k in range(7):                                                  # 光点
        m.put(bell(hz(86 + (k * 5) % 12), .5, ratio=3.0, index=.8), 1.2 + k * .23, .1, pan=m.rng.uniform(-.7, .7))
