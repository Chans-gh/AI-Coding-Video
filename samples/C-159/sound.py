"""C-159 魔灯幻灯片：油灯的低嗡和放映机咔哒的底子，讲堂里一架小风琴弹着慢和弦；1.6 秒换片一声木框滑动，3 秒万花筒片转起来时一串上行的钟声，镜头拉远时嗡声变大。"""
from synth import hum, pad, tick, whoosh, woodblock, bell, hz


def score(m):
    m.put(hum(55, m.dur), 0, .05)
    m.put(m.noise(m.dur) * .3, 0, .02)
    m.put(pad([hz(55), hz(59), hz(62), hz(67)], 1.7, 900, a=.4), 0, .16)
    m.put(pad([hz(57), hz(60), hz(64), hz(69)], 1.5, 900, a=.3), 1.7, .16)
    m.put(pad([hz(53), hz(57), hz(60), hz(65)], 2.0, 1300, a=.5), 3.1, .14)
    for k in range(20):
        m.put(tick(m, 2500), k * .25, .04)
    m.put(whoosh(m, .45, 300, 1200), 1.55, .2, pan=.5)
    m.put(woodblock(500, .12), 2.02, .25)
    for k, n in enumerate([76, 79, 83, 86, 88, 91]):
        m.put(bell(hz(n), 1.4, ratio=2.5, index=1.2), 3.1 + k * .16, .06, pan=(-1) ** k * .5)
