"""C-145 美国都市写实主义：只有远处的车声，两辆车先后从街上驶过（低频噪声由远及近再远去），
底下一层很轻的城市低鸣，字幕出现时一声极轻的钟。"""
from synth import whoosh, hum, bell, hz


def score(m):
    m.put(hum(55, m.dur + .3), 0, .05)
    m.put(whoosh(m, 2.2, 90, 400), .2, .12, pan=-.6)
    m.put(whoosh(m, 1.8, 110, 500), 1.9, .09, pan=.6)
    m.put(bell(hz(67), 2.0, 3.0, .6), 2.7, .05)
