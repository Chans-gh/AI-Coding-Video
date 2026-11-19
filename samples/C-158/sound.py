"""C-158 大理石纹染纸：每滴颜料落进水槽是一声清亮的水滴般的铃音，越落越密；梳子拉过水面时是三段长长的扫声，配一层缓慢起伏的长音；最后梳子往回退时扫声反向、音高往下走。"""
from synth import bell, whoosh, pad, hz


def score(m):
    m.put(pad([hz(50), hz(57), hz(64), hz(69)], 5.0, 1000, 1.0, 1.0), 0, .09)
    notes = [79, 83, 86, 88, 91, 86, 83, 88, 91, 95, 93, 91, 88, 86, 83, 81, 79, 76]
    n = 18
    for i in range(n):
        m.put(bell(hz(notes[i % len(notes)]), .5, 2.0, 1.4), .1 + i * 1.55 / n, .07, pan=-.5 + i / n)
    m.put(whoosh(m, .9, 300, 1400), 1.75, .12, pan=-.3)
    m.put(whoosh(m, .8, 300, 1400), 2.55, .12, pan=.3)
    m.put(whoosh(m, .7, 400, 1800), 3.25, .11)
    m.put(whoosh(m, .5, 1800, 400), 4.0, .1, pan=.3)
    m.put(whoosh(m, .5, 1400, 300), 4.45, .1, pan=-.3)
