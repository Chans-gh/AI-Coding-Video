"""C-118 电视天气预报：轻快的电子钢琴和弦加平稳的鼓点，像天气节目的片头；开场风暴云配一阵风声，
两次斜向擦除各一声快速扫频，温度上升时一段上行琶音，五日预报卡每弹出一张一声短拨音。"""
from synth import pad, pluck, kick, hat, whoosh, bell, hz


def score(m):
    beat = .375
    for b in range(13):
        m.put(kick(m), b * beat, .25)
        m.put(hat(m), b * beat + beat / 2, .08, pan=.3)
    for i, ch in enumerate([[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 67]]):
        m.put(pad([hz(n) for n in ch], 1.3, cutoff=2200, a=.05), i * 1.25, .12)
    m.put(whoosh(m, 1.3, 200, 900), 0, .25)
    for t0 in (1.3, 2.9):
        m.put(whoosh(m, .36, 600, 5000), t0 - .18, .3)
    for k, n in enumerate([72, 76, 79, 84]):
        m.put(pluck(hz(n), .35, 4000), 1.4 + k * .15, .22)
    for i in range(5):
        m.put(pluck(hz(79 + i * 2), .3, 3500), 2.9 + i * .1, .2, pan=-.5 + i * .25)
    m.put(bell(hz(84), 1.2, ratio=2.0, index=.7), 4.0, .1)
