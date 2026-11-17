"""C-117 侦探线索板：低沉的悬疑持续音和缓慢的低音拨弦；每张卡钉上一声短促的“哒”（图钉按进软木），
每拉一根红线一声细的弦音上滑，3.8 秒相机闪光一声咔嚓加白噪声，随后结案章重重落下。"""
from synth import drone, string, woodblock, tick, impact, thud, filt, hz


def score(m):
    m.put(drone(hz(38), 5.0, wobble=.3), 0, .2)
    for i, n in enumerate([45, 44, 45, 41, 40]):
        m.put(string(m, hz(n), .9, damp=.995, bright=.25), i * .8, .35)
    for t0 in (.1, .5, .9, 1.3, 1.7, 2.1, 2.5):
        m.put(woodblock(380, .1), t0 + .22, .4)
        m.put(tick(m, 1600), t0 + .22, .2)
    for k, t0 in enumerate([.8, 1.2, 1.6, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2]):
        m.put(string(m, hz(76 + k % 5), .4, damp=.99, bright=.7), t0, .08, pan=-.5 + k * .1)
    m.put(tick(m, 900), 3.8, .7)
    m.put(filt(m.noise(.25), "high", 3000), 3.8, .25)
    m.put(impact(m), 4.05, .55)
    m.put(thud(m, .4), 4.05, .4)
