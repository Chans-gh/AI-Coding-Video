"""T-011 体育战术板：CC0 配乐；切到慢动作和定格时一声重击，白板笔画线时一阵轻的风声"""
from pathlib import Path
from synth import assets, impact, whoosh


def score(m):
    assets(m, Path(__file__).parent, music=.55)
    m.put(impact(m), 5.6, .25)
    m.put(impact(m), 7.8, .35)
    for t in (7.9, 8.4, 8.9):
        m.put(whoosh(m, .4, 1500, 6000), t, .08)
