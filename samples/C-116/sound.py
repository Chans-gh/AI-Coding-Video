"""C-116 夜间博物馆特展：空旷展厅的低频嗡声和若有若无的空气声垫底；开场和每次聚光灯落定都有一声沉稳的钟和“咔”的开灯声，灯移动时一道暗下去又抬起的气流声；讲解字条逐字打出时是轻柔的打字嗒嗒。"""
from synth import drone, hum, whoosh, bell, tick, thud, pad, hz

MOVES = [[1.35, 1.95], [3.05, 3.65]]
LAND = [0.1, 1.95, 3.65]
CAP = [(0.4, 12), (2.0, 13), (3.7, 13)]  # 字条开始时间、字数


def score(m):
    m.put(drone(hz(33), 5.0, .2), 0, .12)
    m.put(hum(50, 5.0), 0, .04)
    for a, b in MOVES:
        m.put(whoosh(m, b - a, 900, 300), a, .05)
    for i, t in enumerate(LAND):
        m.put(tick(m, 1800), t, .12)
        m.put(thud(m, .5), t + .02, .08)
        m.put(bell(hz([57, 60, 64][i]), 2.2, 2.0, .8), t + .05, .07)
    for t0, n in CAP:
        for k in range(n):
            m.put(tick(m, 3200 + (k * 211) % 900), t0 + k * .9 / n, .03)
    m.put(pad([hz(45), hz(52), hz(57), hz(64)], 1.2, 900, .3, .8), 3.8, .06)
