"""C-108 等距绘本：柔和的钢琴似拨弦弹一段慢步调的分解和弦，颤音琴似的铃声跟着每个落地的大字，
车门滑开一声轻风，小人每走一步一声很轻的木鱼。"""
from synth import pluck, bell, pad, woodblock, whoosh, hz


def score(m):
    m.put(pad([hz(53), hz(60), hz(64), hz(69)], m.dur + .4, 900, a=.6), 0, .12)
    for i, n in enumerate([65, 69, 72, 76, 74, 72, 69, 72, 77, 76, 72, 69]):
        m.put(pluck(hz(n), .9), .1 + i * .32, .14, pan=-.3 + (i % 3) * .3)
    for i, n in enumerate([84, 81, 79, 77]):
        m.put(bell(hz(n), 1.2, 6.0, .5), 1.25 + i * .22, .12, pan=-.3 + i * .2)
    m.put(whoosh(m, .45, 500, 1800), .7, .07)
    for i in range(10):
        m.put(woodblock(1500, .05), 1.95 + i * .2, .05, pan=.2 if i % 2 else -.2)
