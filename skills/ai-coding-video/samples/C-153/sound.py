"""C-153 合成波（Synthwave）：模拟合成器的十六分音符琶音在小调和弦上循环，底鼓四拍、军鼓式拍手在后拍，低音锯齿波跟着根音走；标题落下时一记重击加长长的混响钟声，画面抖动的地方有一下短促的磁带卡顿般的下滑音。"""
from synth import kick, clap, hat, saw, impact, bell, pad, square, whoosh, hz


def score(m):
    b = .375
    chords = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 55, 59, 64]]
    roots = [45, 41, 43, 40]
    for k in range(14):
        m.put(kick(m), k * b, .5)
        if k % 2:
            m.put(clap(m), k * b, .22)
        m.put(hat(m), k * b + b / 2, .07)
    for bar in range(4):
        c = chords[bar]
        m.put(pad([hz(n) for n in c], 1.5, 1200, .1, .4), bar * 1.5, .07)
        m.put(saw(hz(roots[bar]), 1.4, 600), bar * 1.5, .12)
        for s in range(16):
            n = c[s % 4] + (12 if s % 8 >= 4 else 0)
            m.put(saw(hz(n), .09, 2400, .002, .04), bar * 1.5 + s * b / 4, .045)
    m.put(impact(m), 1.2, .4)
    m.put(bell(hz(69), 2.4, 2.0, 1.2), 1.2, .1)
    for g in (.75, 2.25, 3.75):
        m.put(whoosh(m, .15, 2000, 300), g, .06)
        m.put(square(hz(50), .08, .5, .05), g, .04)
