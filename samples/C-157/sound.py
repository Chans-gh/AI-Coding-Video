"""C-157 粗描边贴纸科普：轻快的电子拨音和底鼓打底，每张贴纸弹出一声“啵”，
数字滚动时一串细密的咔哒，柱子长高一道上扬的音，镜头平移时一道柔和的风声。"""
from synth import pluck, kick, hat, beep, tick, whoosh, pad, hz


def score(m):
    m.put(pad([hz(52), hz(59), hz(64), hz(68)], m.dur + .3, 1300, a=.4), 0, .15)
    for i in range(int(m.dur / .375)):
        if i % 2 == 0:
            m.put(kick(m), i * .375, .3)
        m.put(hat(m), i * .375 + .187, .06, pan=.3)
        m.put(pluck(hz([64, 68, 71, 76][i % 4]), .2, 2600), i * .375, .1, pan=-.2)
    for t0 in (.05, 2.5, 3.9):
        m.put(beep(1200, .06), t0 + .1, .25)
        m.put(beep(1800, .05), t0 + .16, .15)
    for i in range(16):
        m.put(tick(m, 3500), .5 + i * .05, .08)
    for i in range(3):
        m.put(beep(500 + i * 200, .5), 2.2 + i * .18, .06)
    for t0 in (1.4, 3.3):
        m.put(whoosh(m, .8, 300, 1800), t0, .2)
