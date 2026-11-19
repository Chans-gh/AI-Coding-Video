"""C-068 低多边形等距岛：轻快的海浪声垫底，每块地块落地是一下短促的木琴音（一圈比一圈高），每个物件落地响一个钟琴音符，八个物件连起来是一句上行的五声音阶旋律，最后一个和弦收住。"""
from synth import woodblock, bell, pluck, whoosh, pad, hz

# 与 scene.js 的时间表一致
T0, DT, N = [.15, .4, 1.05, 1.95], [0, .11, .07, .045], [1, 6, 12, 18]
OBJ = [2.85, 3.0, 3.15, 3.3, 3.5, 3.7, 3.85, 4.0]


def score(m):
    for k in range(9):
        m.put(whoosh(m, 1.4, 150, 700), k * .55, .04)
    for k in range(4):
        for i in range(N[k]):
            if k == 3 and i % 4 == 3:
                continue
            t = T0[k] + i * DT[k] + .12
            m.put(woodblock(500 + k * 160 + (i % 3) * 40, .1), t, .12 - k * .015)
    notes = [67, 69, 72, 74, 76, 79, 81, 84]
    for t, n in zip(OBJ, notes):
        m.put(bell(hz(n), .9, 3.0, 1.0), t + .15, .1)
        m.put(pluck(hz(n - 24), .3, 1200), t + .15, .1)
    m.put(pad([hz(60), hz(64), hz(67), hz(72)], .9, 1500, .05, .7), 4.2, .12)
