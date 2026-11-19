"""C-105 科幻全息线框：低沉的嗡声和一道扫描上滑开场；每个部件被锁定时先是一串加速的电子嘀嗒（瞄准框收紧），弹出一声嗖，数字滚动是细碎的高频嘀，锁定那一刻一记明亮的钟音。"""
from synth import drone, whoosh, beep, tick, bell, riser, hum, hz

# 与 scene.js 的 LK 一致
LK = [1.35, 2.15, 2.95, 3.75]


def score(m):
    m.put(drone(hz(38), 5.0, .3), 0, .12)
    m.put(hum(55, 5.0), 0, .05)
    m.put(riser(m, 1.1), 0, .06)
    for i, lt in enumerate(LK):
        for j in range(6):
            m.put(beep(1400 + j * 120, .03), lt + j * .045 - j * j * .002, .05)
        m.put(whoosh(m, .35, 800, 3000), lt + .2, .05)
        for j in range(9):
            m.put(tick(m, 4000 + (j * 331) % 2000), lt + .55 + j * .05, .03)
        m.put(bell(hz(84 + [0, 3, 5, 7][i]), 1.0, 2.0, 1.4), lt + 1.0, .08)
