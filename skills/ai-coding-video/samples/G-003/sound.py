"""G-003 产品广告：CC0 配乐铺底；切到主图一声低频重击，每条卖点一声细响，价格牌和按钮各一声提示音"""
from pathlib import Path
from synth import assets, impact, tick, beep, whoosh


def score(m):
    assets(m, Path(__file__).parent, music=.42)
    m.put(whoosh(m, .7, 300, 1800), 4.7, .25)
    m.put(impact(m), 5.2, .35)
    for i in range(3):
        m.put(tick(m, 5000), 5.6 + i * .9, .25)
    m.put(whoosh(m, .8, 500, 3000), 9.3, .2)
    m.put(beep(1320, .1), 10.25, .18)
    m.put(beep(1760, .12), 10.65, .18)
