"""G-004 大字品牌片：CC0 钢琴铺底；两个切点各一声低沉的重击，结尾大字落定一声钟"""
from pathlib import Path
from synth import assets, impact, bell, whoosh, hz


def score(m):
    assets(m, Path(__file__).parent, music=.6)
    for c in (5.2, 9.4):
        m.put(whoosh(m, .6, 200, 1200), c - .5, .15)
        m.put(impact(m), c, .22)
    m.put(bell(hz(67), 3.0), 10.4, .12)
