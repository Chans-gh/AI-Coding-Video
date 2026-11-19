"""C-129 古埃及墓室壁画：低沉的长音铺底，竖琴一样的拨弦随象形符号一笔笔写出，叉铃沙沙响；3 秒石板下滑时一声闷响加低频摩擦，再接着写下一栏。"""
from synth import drone, pad, string, whoosh, thud, tick, hz


def score(m):
    m.put(drone(hz(38), m.dur, wobble=.2), 0, .16)
    m.put(pad([hz(50), hz(57), hz(62)], m.dur, 700, a=1.0), 0, .1)
    scale = [62, 64, 65, 69, 71, 74, 76]                                 # 弗里几亚味的音阶
    for i, t in enumerate([.3 + k * .33 for k in range(7)] + [3.5 + k * .3 for k in range(5)]):
        m.put(string(m, hz(scale[(i * 3) % 7]), 1.4, bright=.6), t, .22, pan=(-1) ** i * .3)
    for k in range(10):                                                  # 叉铃
        m.put(tick(m, 6000), .2 + k * .27, .05, pan=.5)
    m.put(whoosh(m, .7, 80, 400), 2.8, .35)
    m.put(thud(m, .8), 3.42, .6)
