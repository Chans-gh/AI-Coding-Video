"""G-019 十二月插画回顾：旁白（公开音色）+ CC0 配乐；每翻一月一声翻页的扫频和一声拨音，总览墙拼好时一串咔哒、一声钟"""
from pathlib import Path
from synth import assets, cue_time, whoosh, pluck, tick, bell, hz


def score(m):
    a = assets(m, Path(__file__).parent, music=.34)
    step = (cue_time(a, "八月", 5.8) - 1.2) / 7          # 和 scene.js 一致：翻到八月卡在旁白说「八月」
    for i in range(12):
        t = 1.2 + i * step
        m.put(whoosh(m, .25, 800, 5000), t, .12)
        m.put(pluck(hz(72 + [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5][i]), .25), t + .08, .16)
    wall = 1.2 + 12 * step + .2
    for k in range(10):
        m.put(tick(m, 3000), wall + .8 + k * .09, .07)
    m.put(bell(hz(84), 2.0), wall + 1.0, .2)
