"""C-151 南宋院体山水：一支洞箫般的气声长音吹一段五声音阶的慢句，每个音前带一点气息的扫声；底下一层极低的嗡鸣像远处的水，结尾一声远远的磬。"""
from synth import drone, whoosh, bell, hz


def score(m):
    m.put(drone(hz(38), 5.0, .2), 0, .08)
    phrase = [(62, 0.2, 1.1), (65, 1.3, .6), (67, 1.9, 1.0), (69, 2.9, .5), (67, 3.4, 1.3)]
    for n, t, d in phrase:
        m.put(whoosh(m, .3, 600, 1800), t - .05, .05, pan=-.1)
        m.put(drone(hz(n), d, .6), t, .1, pan=-.1)
        m.put(drone(hz(n + 12), d, .5), t, .025, pan=-.1)
    m.put(bell(hz(74), 2.5, 2.7, .6), 4.3, .07, pan=.4)
