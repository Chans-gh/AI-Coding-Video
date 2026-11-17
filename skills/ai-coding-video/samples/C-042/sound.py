"""C-042 极简图解 / 时间轴：底下一层安静的钢琴式铺底；每条连线画出时一声轻扫，
每个节点亮红时一声拨弦（音高逐个升高），大年份滚动时一串细咔哒。"""
from synth import pad, pluck, whoosh, tick, hz


def score(m):
    m.put(pad([hz(57), hz(64), hz(69)], 5.0, cutoff=1200, a=.6), 0, .1)
    notes = [69, 72, 74, 76, 81]
    for i, n in enumerate(notes):
        t0 = .5 + i * .82
        if i:
            m.put(whoosh(m, .35, 600, 2400), t0 - .3, .08, pan=-.2 + i * .1)
        m.put(pluck(hz(n), .6, 2500), t0, .35, pan=-.4 + i * .2)
        for k in range(6):
            m.put(tick(m, 3500), t0 + k * .05, .07)
