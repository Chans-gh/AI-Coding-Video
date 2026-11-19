"""C-090 炭笔擦除重绘：安静的钢琴般低音长音打底；起形时几下轻刮的沙沙声，铺调子时侧锋擦纸的长扫，橡皮来回擦的几下摩擦，第二版压黑时三下短促的重笔。"""
from synth import pad, whoosh, tick, thud, bell, hz


def score(m):
    m.put(pad([hz(45), hz(52), hz(60), hz(64)], 5.0, 700, 1.0, 1.0), 0, .12)
    for k in range(6):
        m.put(whoosh(m, .35, 2500, 5000), .1 + k * .13, .05, pan=-.2 + .08 * k)
    m.put(whoosh(m, 1.1, 800, 2600), .6, .1, pan=-.3)
    for k in range(5):
        m.put(whoosh(m, .22, 1500, 3500), 2.45 + k * .16, .09, pan=(-1) ** k * .3)
    m.put(whoosh(m, .9, 700, 2200), 3.0, .09, pan=.3)
    for k in range(3):
        m.put(thud(m, .2), 3.95 + k * .15, .18)
        m.put(tick(m, 1800), 3.95 + k * .15, .08)
    for i, n in enumerate([64, 67, 71]):
        m.put(bell(hz(n), 1.5, 2.0, .7), 4.35 + i * .1, .05)
