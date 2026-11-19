"""C-075 抽象品牌片：每拍一记底鼓加一下方波数码碎音，碎音的音高逐拍往上爬，后拍一声拍手；字标定格时一记重击、一个红蓝两音的钟声和长长的低音铺底。"""
from synth import kick, clap, hat, impact, bell, square, pad, whoosh, saw, hz


def score(m):
    b = .375
    notes = [52, 55, 57, 59, 62, 64, 67, 69, 71, 74]
    for k in range(10):
        m.put(kick(m), k * b, .55)
        m.put(square(hz(notes[k]), .07, .25, .05), k * b, .1)
        m.put(square(hz(notes[k] + 12), .04, .5, .03), k * b + .09, .06)
        if k % 2:
            m.put(clap(m), k * b, .22)
        m.put(hat(m), k * b + b / 2, .08)
        m.put(saw(hz(33), b * .8, 500), k * b, .1)
    m.put(whoosh(m, .5, 400, 6000), 3.25, .12)
    m.put(impact(m), 3.75, .55)
    m.put(bell(hz(64), 2.2, 2.0, 1.2), 3.75, .16)
    m.put(bell(hz(71), 2.0, 2.0, 1.2), 3.9, .12)
    m.put(pad([hz(40), hz(52), hz(59), hz(64)], 1.25, 700, .05, .9), 3.75, .14)
