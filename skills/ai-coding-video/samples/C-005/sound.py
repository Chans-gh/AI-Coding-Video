"""C-005 蜡笔绘本：睡前故事般的音乐盒旋律，慢慢的钟琴音配一层柔和的长音；描边那几秒有轻轻的沙沙蜡笔声，水彩刷过天空时一声长长的扫过，星星露出来时几下高音铃。"""
from synth import bell, pad, whoosh, tick, hz


def score(m):
    tune = [72, 76, 79, 76, 74, 77, 81, 79, 76, 72, 74, 72]
    for i, n in enumerate(tune):
        m.put(bell(hz(n), 1.6, 3.0, 1.2), .2 + i * .4, .12, pan=(i % 3 - 1) * .3)
    m.put(pad([hz(48), hz(55), hz(64)], 5.0, 900, .8, 1.2), 0, .1)
    for k in range(22):
        m.put(tick(m, 5200 + 400 * (k % 3)), .1 + k * .1, .04, pan=-.3 + .6 * (k % 2))
    m.put(whoosh(m, 1.6, 200, 900), 2.5, .14, pan=-.4)
    for i, n in enumerate([88, 91, 93, 96]):
        m.put(bell(hz(n), 1.2, 3.5, .8), 3.0 + i * .25, .06, pan=-.5 + i * .3)
