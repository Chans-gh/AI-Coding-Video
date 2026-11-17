"""C-020 复古半调案卷：低音拨弦走一段鬼祟的爵士式下行贝斯，刷镲轻扫；色块和标题落下各一声闷击，
吉祥物登场一声滑稽的方波下滑，三张证物卡每张一声木鱼，最后橡皮章重重一记。"""
from synth import string, hat, impact, square, woodblock, thud, hz


def score(m):
    bass = [45, 44, 43, 42, 45, 44, 43, 40, 45, 44]
    for i, n in enumerate(bass):
        m.put(string(m, hz(n), .5, damp=.993, bright=.3), .1 + i * .48, .5)
        m.put(hat(m), .34 + i * .48, .07, pan=.4)
    m.put(thud(m, .4), .1, .4)
    m.put(impact(m), .35, .35)
    for k in range(5):
        m.put(square(hz(72 - k * 2), .06, dec=.04), .6 + k * .05, .1)
    for i in range(3):
        m.put(woodblock(640 + i * 120, .15), 1.4 + i * .55, .45, pan=-.3 + i * .3)
    m.put(impact(m), 3.6, .6)
    m.put(thud(m, .5), 3.6, .5)
