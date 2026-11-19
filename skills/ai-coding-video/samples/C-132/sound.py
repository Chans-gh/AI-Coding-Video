"""C-132 哥特泥金手抄本：低沉的修道院式长音和五度和声，金光扫过时一串细小的钟声闪烁；3 秒翻页一声纸的沙沙扫频，再在新页上闪一次光。"""
from synth import pad, drone, bell, whoosh, hz


def score(m):
    m.put(drone(hz(45), m.dur, wobble=.15), 0, .14)
    m.put(pad([hz(57), hz(64), hz(69)], m.dur, 1100, a=1.2), 0, .14)
    for k, n in enumerate([88, 93, 91, 96, 95, 100]):                    # 金光闪
        m.put(bell(hz(n), 1.2, ratio=3.0, index=1.0), .8 + k * .3, .05, pan=-.6 + k * .24)
    m.put(whoosh(m, .9, 900, 5000), 2.9, .22, pan=.4)                   # 翻页
    m.put(whoosh(m, .5, 2000, 7000), 3.4, .1, pan=-.3)
    for k, n in enumerate([93, 98, 100, 105]):
        m.put(bell(hz(n), 1.2, ratio=3.0, index=1.0), 4.0 + k * .22, .05, pan=.5 - k * .3)
