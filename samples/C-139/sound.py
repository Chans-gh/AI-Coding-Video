"""C-139 新印象派点彩：安静明亮的长音；点一颗颗落下是细碎的高音拨点（五声音阶，越往后越密），点开始呼吸时铺底慢慢起伏。"""
from synth import pad, pluck, beep, hz


def score(m):
    m.put(pad([hz(60), hz(67), hz(72), hz(76)], m.dur, 1500, a=1.5), 0, .14)
    scale = [72, 74, 76, 79, 81, 84, 86, 88]
    t = .1
    while t < 3.2:
        m.put(pluck(hz(scale[int(m.rng.random() * len(scale))]), .2, 6000), t, .08, pan=m.rng.uniform(-.7, .7))
        t += .12 - .05 * t / 3.2
    for k in range(5):                                                   # 呼吸
        m.put(beep(hz([84, 88, 91, 88, 84][k]), .6), 2.8 + k * .42, .05, pan=(-1) ** k * .3)
