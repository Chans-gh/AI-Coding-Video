"""C-044 暗色发布会：开场一声重击，卡片进场后一道扫光的风声，
柱子长起时一串上行的短音，数字跳到 10× 前用上升音铺垫，落定时再一声重击加长音。"""
from synth import impact, whoosh, riser, beep, pad, drone, hz


def score(m):
    m.put(impact(m), 0, .7)
    m.put(drone(hz(33), m.dur + .5, .2), 0, .1)
    m.put(whoosh(m, 1.0, 1200, 5000), .3, .2, pan=-.4)                 # 扫光
    for i, n in enumerate([60, 62, 64, 67, 69, 72, 74]):               # 柱子
        m.put(beep(hz(n + 12), .07), .45 + i * .06, .18, pan=-.3 + i * .1)
    m.put(riser(m, 1.0), .35, .35)
    m.put(impact(m), 1.35, .8)                                          # 数字出现
    m.put(pad([hz(45), hz(52), hz(57), hz(64)], m.dur - 1.3, 1200, a=.3), 1.35, .3)
