"""C-091 彩色铅笔：温和的长音铺底，一段轻快的电子拨音小旋律；每换一种颜色有一串沙沙的涂色声，最后补外形线时一声钟。"""
from synth import pad, pluck, whoosh, bell, hz


def score(m):
    m.put(pad([hz(60), hz(64), hz(67), hz(71)], m.dur, 1300, a=.8), 0, .14)
    mel = [72, 76, 79, 76, 74, 77, 81, 79, 76, 72]
    for i, n in enumerate(mel):
        m.put(pluck(hz(n), .4, 3000), .2 + i * .42, .16, pan=(-1) ** i * .2)
    for i in range(8):                                                   # 每层颜色：一串涂色声
        for j in range(6):
            m.put(whoosh(m, .07, 2200, 5500), .15 + i * .42 + j * .11, .05, pan=m.rng.uniform(-.5, .5))
    m.put(bell(hz(84), 1.8, ratio=2.0, index=.8), 3.95, .1)
