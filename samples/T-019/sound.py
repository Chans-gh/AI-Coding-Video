"""T-019 营养成分对比：CC0 配乐；照片入场一声扫频，每行条形图长出时一声拨音（音高逐行升），结论弹出时一声钟"""
from pathlib import Path
from synth import assets, whoosh, pluck, bell, hz

T0, STEP, ROWS = 1.4, 1.2, 7          # 和 scene.js 一致


def score(m):
    assets(m, Path(__file__).parent, music=.4)
    m.put(whoosh(m, .7, 300, 3000), .05, .2)
    for i in range(ROWS):
        m.put(pluck(hz(67 + [0, 2, 4, 5, 7, 9, 11][i]), .3), T0 + i * STEP, .22)
    m.put(bell(hz(84), 1.8), T0 + ROWS * STEP + .4, .18)
