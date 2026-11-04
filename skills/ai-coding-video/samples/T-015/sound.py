"""T-015 年度数据回顾：CC0 配乐；每条开头一声转场，数字滚动时一串轻快的咔哒，排名徽章弹出时一声重击，收尾三条排开时一声钟声"""
from pathlib import Path
from synth import assets, whoosh, tick, impact, bell, hz

LEN = 3.8


def score(m):
    assets(m, Path(__file__).parent, music=.4)
    for i in range(3):
        a = i * LEN
        if i:
            m.put(whoosh(m, .4, 400, 4000), a - .1, .3)
        for k in range(10):
            m.put(tick(m, 3200), a + .5 + k * .1, .08)
        m.put(impact(m), a + 1.35, .35)
    m.put(bell(hz(76), 2.0), 11.45, .2)
