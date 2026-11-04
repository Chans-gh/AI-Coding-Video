"""T-012 绘本翻页：旁白（青水公开音色）+ CC0 配乐；每次翻页一声纸张的沙沙声"""
from pathlib import Path
from synth import assets, whoosh


def score(m):
    assets(m, Path(__file__).parent, music=.3)
    for t in (5.4, 7.6, 9.0, 10.4):
        m.put(whoosh(m, .35, 2000, 7000), t - .05, .1)
