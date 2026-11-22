"""C-087 多画风穿越：同一句旋律贯穿全片，每进一个新世界就换一种音色（拨弦 → 明亮的拨音 → 木鱼般的黏土音 → 8-bit 方波），配同一组脚步；每次画风切换（1.05、2.3、3.55 秒）一阵扫频加一声钟；进像素世界时多一串金币的方波提示音。"""
from synth import string, pluck, woodblock, square, whoosh, bell, tick, pad, hz

SW = [1.05, 2.3, 3.55]


def score(m):
    m.put(pad([hz(55), hz(62), hz(67)], m.dur, 1200, .5, 1.0), 0, .07)
    mel = [67, 71, 74, 72, 71, 67, 69, 71]
    step = 5 / 32
    for i in range(32):
        t0 = i * step
        w = sum(t0 >= s + .35 for s in SW)
        n = mel[i % 8] + (12 if w == 3 else 0)
        if i % 2 == 0:
            if w == 0:
                m.put(string(m, hz(n), 1.0, .995, .5), t0, .3)
            elif w == 1:
                m.put(pluck(hz(n), .3, 4500), t0, .18)
            elif w == 2:
                m.put(woodblock(hz(n) * 2, .15), t0, .22)
            else:
                m.put(square(hz(n), .12, .25, .1), t0, .1)
        m.put(tick(m, 1800 if i % 2 else 1400), t0, .04, -.2 if i % 2 else .2)
    for s in SW:
        m.put(whoosh(m, .7, 400, 5000), s, .22, .4)
        m.put(bell(hz(84), 1.2), s + .35, .1)
    for k in range(4):
        m.put(square(hz(88 + k * 4), .06, .5, .04), 3.9 + k * .07, .06)
