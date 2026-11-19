"""C-107 地铁线路图生长：每条线开画时一声轻扫，笔尖经过普通站点是一下钢片琴似的拨音（每条线一个调），经过换乘站落一记低音；最后一个开放的和弦收住。站点时间与 scene.js 用同样的折线、比例算法算出。"""
import math
from synth import bell, pluck, thud, whoosh, pad, hz

LINES = [
    ([[4, 30], [30, 30], [40, 20], [70, 20], [80, 30], [96, 30]], .3, 1.6, 79),
    ([[20, 2], [20, 15], [30, 25], [30, 45], [40, 55], [62, 55]], 1.1, 1.5, 76),
    ([[50, 2], [50, 40], [60, 50], [92, 50]], 1.9, 1.4, 81),
    ([[8, 50], [25, 50], [40, 35], [75, 35], [85, 25], [85, 6]], 2.6, 1.6, 84),
]
IX = [[30, 30], [50, 20], [50, 35], [30, 45], [80, 30]]


def frac_on(p, q):
    L = [math.dist(p[i - 1], p[i]) for i in range(1, len(p))]
    s, tot = sum(L), 0
    for i in range(1, len(p)):
        (ax, ay), (bx, by), l = p[i - 1], p[i], L[i - 1]
        u = ((q[0] - ax) * (bx - ax) + (q[1] - ay) * (by - ay)) / (l * l)
        cx, cy = ax + (bx - ax) * u, ay + (by - ay) * u
        if -1e-6 <= u <= 1 + 1e-6 and math.hypot(cx - q[0], cy - q[1]) < .01:
            return (tot + u * l) / s
        tot += l
    return -1


def score(m):
    for li, (p, t0, d, root) in enumerate(LINES):
        m.put(whoosh(m, .4, 600, 2600), t0, .04)
        ixf = [g for g in (frac_on(p, q) for q in IX) if g >= 0]
        for k in range(7):
            f = k / 6
            if f == 0 or any(abs(g - f) < .07 for g in ixf):
                continue
            n = root + [0, 2, 4, 7, 9, 12][k % 6]
            m.put(bell(hz(n), .8, 3.5, 1.2), t0 + f * d, .06)
            m.put(pluck(hz(n), .25, 4000), t0 + f * d, .04)
        for g in ixf:
            m.put(thud(m, .4), t0 + g * d, .1)
            m.put(pluck(hz(36 + li * 2), .6, 600), t0 + g * d, .12)
    m.put(pad([hz(55), hz(62), hz(67), hz(71), hz(74)], .9, 1800, .1, .8), 4.2, .1)
