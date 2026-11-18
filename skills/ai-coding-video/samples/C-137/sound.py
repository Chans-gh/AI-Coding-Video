"""C-137 新艺术运动：竖琴般的拨弦琶音随金线绕框上行，弦乐似的长音和弦铺底，
画面展开时一阵柔和的风声，花藤长叶时几声细小的钟音。"""
from synth import string, pad, bell, whoosh, hz


def score(m):
    m.put(pad([hz(53), hz(57), hz(60), hz(64)], m.dur + .4, 1500, a=.8), 0, .2)
    for k, n in enumerate([65, 69, 72, 76, 77, 81, 84, 88]):
        m.put(string(m, hz(n), 1.6, .995, .5), k * .16, .22, pan=-.6 + k * .15)
    m.put(whoosh(m, 1.2, 200, 1500), .5, .2)
    for k, n in enumerate([88, 91, 93, 96]):
        m.put(bell(hz(n), 1.2, 3.5, 1.2), 1.0 + k * .38, .06, pan=(-1) ** k * .5)
    m.put(pad([hz(58), hz(62), hz(65), hz(69)], 2.2, 1600, a=.5), 1.9, .14)
