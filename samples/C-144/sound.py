"""C-144 超现实主义：空旷荒原上的低频长音和远风，钟声一下一下越走越慢、音高往下滑，
像钟在融化；液滴落下时几声水滴似的高音，新画面流下来时一阵下行的风声，标题出现时一声低铃。"""
from synth import drone, whoosh, bell, beep, hz


def score(m):
    m.put(drone(hz(38), m.dur + .3, .3), 0, .14)
    m.put(whoosh(m, 2.5, 150, 500), 0, .05, pan=.3)
    for i in range(6):
        m.put(bell(hz(76 - i * 1.5), 1.2, 3.5, 1.0), .2 + i * .38 + i * i * .02, .11 - i * .01, pan=-.2)
    for i, tt in enumerate([1.1, 1.8, 2.3]):
        m.put(beep(hz(91 - i), .07), tt, .06, pan=.1)
    m.put(whoosh(m, .9, 2500, 300), 2.6, .12)
    m.put(bell(hz(50), 2.0, 2.0, 1.5), 3.2, .15)
