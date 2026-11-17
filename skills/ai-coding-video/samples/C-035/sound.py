"""C-035 70 年代电视片头：开机一声低沉嗡鸣，接一段放克：底鼓、拍手和十六分开镲，锯齿贝斯走切分，
铜管感的方波和弦在标题砸进来时齐奏，副标弹出时一声颤音钟。"""
from synth import kick, clap, hat, saw, square, bell, hum, hz

BT = .3


def score(m):
    m.put(hum(60, .5), 0, .18)
    for b in range(16):
        t = .4 + b * BT
        if t > 4.9:
            break
        if b % 4 in (0, 3) or b % 8 == 6:
            m.put(kick(m), t, .7)
        if b % 4 == 2:
            m.put(clap(m), t, .4)
        m.put(hat(m), t, .12)
        m.put(hat(m), t + BT / 2, .07, pan=.3)
    bass = [40, 0, 40, 43, 0, 45, 47, 0, 40, 0, 40, 43, 0, 52, 50, 47]
    for b, n in enumerate(bass):
        t = .4 + b * BT
        if n and t < 4.9:
            m.put(saw(hz(n), BT * .9, cutoff=900), t, .3)
    for k, t0 in enumerate([.9, 1.02, 1.14, 1.26, 1.38]):
        m.put(square(hz([64, 67, 69, 71, 76][k]), .18, dec=6), t0, .08, pan=-.3 + k * .15)
    for t0 in (2.0, 3.2):
        for n in (64, 68, 71):
            m.put(square(hz(n), .5, dec=3), t0, .06)
    m.put(bell(hz(88), 1.2, ratio=3.5, index=1.2), 2.05, .12)
