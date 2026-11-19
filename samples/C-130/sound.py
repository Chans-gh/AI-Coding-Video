"""C-130 古希腊黑绘陶瓶：里拉琴拨弦弹一段多利亚调式的分解和弦，低音长音托底；2.2–3.6 秒瓶子转得快时一阵轻风声，琴声跟着密起来。"""
from synth import string, drone, whoosh, hz


def score(m):
    m.put(drone(hz(43), m.dur, wobble=.15), 0, .12)
    mode = [55, 57, 58, 60, 62, 64, 65, 67, 69]                          # D 多利亚
    t, i = .1, 0
    while t < m.dur - .5:
        n = mode[[0, 2, 4, 7, 4, 2, 5, 3][i % 8]]
        m.put(string(m, hz(n + 12), 1.6, bright=.45), t, .26, pan=(i % 3 - 1) * .4)
        if i % 4 == 0:
            m.put(string(m, hz(n), 2.0, bright=.3), t, .18)
        t += .22 if 2.2 < t < 3.6 else .375
        i += 1
    m.put(whoosh(m, 1.4, 200, 900), 2.2, .12)
