"""T-007 新闻简报：旁白（青水公开音色）+ CC0 配乐；开场一声新闻台式的提示音"""
from pathlib import Path
from synth import assets, beep


def score(m):
    assets(m, Path(__file__).parent, music=.28)
    m.put(beep(1320, .12), 0.0, .12)
    m.put(beep(990, .16), .14, .12)
