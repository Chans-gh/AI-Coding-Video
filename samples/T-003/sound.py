"""T-003 复古产品广告：CC0 配乐；贴纸弹出时一声木鱼、产品卡落下一声重击"""
from pathlib import Path
from synth import assets, woodblock, impact


def score(m):
    assets(m, Path(__file__).parent, music=.5)
    for t in (2.2, 6.6):
        m.put(woodblock(1100), t, .25)
    m.put(impact(m), 11.6, .3)
