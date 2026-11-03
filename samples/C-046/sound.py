"""C-046 UI 形变循环：两次鼠标点击，卡片每次形变时一声轻柔的“嗖”，
进度走动时细碎的滴答声，渲染完成时两声上扬的提示音。"""
from synth import tick, whoosh, beep, pad, hz


def score(m):
    m.put(pad([hz(60), hz(64), hz(67)], m.dur, 1200, a=.5), 0, .12)
    for d in (.5, 2.05):
        m.put(tick(m, 2500), d, .5)
    for d in (.55, 1.35, 2.2):
        m.put(whoosh(m, .3, 800, 3000), d, .2)
    for k in range(12):
        m.put(tick(m, 5000), .75 + k * .05, .08)
    m.put(beep(1047, .1), 1.45, .25); m.put(beep(1568, .16), 1.55, .25)
