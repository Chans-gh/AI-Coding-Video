"""C-022 彩色玻璃窗：几个音叠成的长音像教堂里的回响，光带扫过时一串钟声依次亮起，
空气里的浮尘是零星的高音小铃。"""
from synth import pad, bell, drone, hz


def score(m):
    m.put(drone(hz(38), m.dur, .2), 0, .2)
    m.put(pad([hz(50), hz(57), hz(62), hz(69)], m.dur, 1600, a=1.0), 0, .24)
    for k, n in enumerate([62, 66, 69, 74, 78, 81]):
        m.put(bell(hz(n), 2.0, ratio=2.0, index=1.4), .3 + k * .35, .2, pan=-.6 + k * .24)
    for k in range(8):
        m.put(bell(hz(93 + (k * 7) % 12), .4, ratio=3.0, index=.6), .5 + k * .3, .06, pan=m.rng.uniform(-.8, .8))
