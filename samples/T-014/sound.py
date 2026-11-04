"""T-014 讲义转片：CC0 配乐；荧光笔划过时一声细的擦纸声，翻到图示页一声纸页的沙沙声，三块依次圈出各一下木质轻敲，结尾一声提示音"""
from pathlib import Path
from synth import assets, whoosh, woodblock, beep, hz


def score(m):
    assets(m, Path(__file__).parent, music=.36)
    m.put(whoosh(m, 1.2, 4000, 9000), 1.6, .08)
    m.put(whoosh(m, .45, 2000, 7000), 6.0, .22)
    for i in range(3):
        m.put(woodblock(900 + i * 120), 6.9 + i * 1.1, .3)
    m.put(whoosh(m, .45, 2000, 7000), 10.2, .2)
    m.put(whoosh(m, .7, 4000, 9000), 10.5, .07)
    m.put(beep(hz(84), .25), 12.45, .12)
