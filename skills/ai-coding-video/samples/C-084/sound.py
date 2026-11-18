"""C-084 1950 年代科学教科书：老式教学片似的方波小旋律，吸管“折断”时一声铃，
知识补充框出现时一声木鱼，翻页是一段由高到低的纸声加轻风声，三棱镜分光时一串上行的铃。"""
from synth import bell, square, woodblock, whoosh, filt, hz


def score(m):
    for i, n in enumerate([67, 72, 76, 72, 67, 72, 76, 79]):
        m.put(square(hz(n), .18), .1 + i * .28, .05, pan=-.2 + (i % 2) * .4)
    m.put(bell(hz(84), 1.2, 4.0, .5), .9, .12)
    m.put(woodblock(700, .14), 1.35, .2)
    m.put(filt(m.noise(.5), "band", [900, 4500]), 2.4, .12)
    m.put(whoosh(m, .5, 2500, 400), 2.45, .1)
    for i, n in enumerate([72, 76, 79, 84, 88]):
        m.put(bell(hz(n), 1.0, 4.0, .5), 3.45 + i * .08, .08, pan=-.4 + i * .2)
    m.put(woodblock(700, .14), 3.85, .2)
