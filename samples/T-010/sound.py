"""T-010 延时城市交响：CC0 配乐；镜头之间光带扫过时一声风声，城市灯点亮起时一串轻的拨音"""
from pathlib import Path
from synth import assets, whoosh, pluck, hz


def score(m):
    assets(m, Path(__file__).parent, music=.6)
    for t in (5.15, 9.55):
        m.put(whoosh(m, .6, 400, 4000), t, .2)
    for i in range(16):
        m.put(pluck(hz([69, 72, 76, 79, 81][i % 5] + 12), .3), 9.8 + i * .2, .05, (i % 3 - 1) * .5)
