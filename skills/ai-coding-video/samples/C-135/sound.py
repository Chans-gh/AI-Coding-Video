"""C-135 巴洛克明暗对照：一片寂静里擦亮一根火柴、烛芯点着；之后只有很低的暖色长音随火苗起伏，偶尔一下纸页翻动和极轻的钟声。"""
from synth import impact, whoosh, drone, pad, bell, hz


def score(m):
    m.put(whoosh(m, .25, 1500, 5000), .05, .12)                            # 擦火柴
    m.put(impact(m), .25, .08)
    m.put(drone(hz(33), m.dur - .3, wobble=.3), .3, .16)
    m.put(pad([hz(45), hz(52), hz(57)], m.dur - .6, 700, a=1.4), .6, .12)
    m.put(whoosh(m, .4, 400, 1800), 2.4, .06, pan=.3)                      # 翻信纸
    m.put(bell(hz(64), 2.4, ratio=2.0, index=.6), 3.2, .05, pan=-.3)
