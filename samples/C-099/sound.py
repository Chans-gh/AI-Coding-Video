"""C-099 手工刺绣：轻柔的拨弦小曲配一层暖暖的长音；每一针穿过布面都有一下很轻的「嗒」，针脚越来越密时连成一串细碎的声音，结粒绣那几下是更高更脆的点声，最后一声铃收尾。"""
from synth import pluck, pad, tick, bell, hz


def score(m):
    m.put(pad([hz(53), hz(60), hz(65), hz(69)], 5.0, 1000, .8, 1.0), 0, .09)
    tune = [65, 69, 72, 69, 70, 74, 72, 69, 67, 72, 77, 76, 72]
    for i, n in enumerate(tune):
        m.put(pluck(hz(n), .45, 3200), .15 + i * .375, .15, pan=(i % 2 - .5) * .4)
    for k in range(60):
        tt_ = .15 + k * .07
        if tt_ > 4.4:
            break
        m.put(tick(m, 2600 if tt_ < 3.4 else 5200), tt_, .05 if tt_ < 3.4 else .07, pan=(-1) ** k * .25)
    m.put(bell(hz(84), 2.0, 3.5, .9), 4.45, .08)
