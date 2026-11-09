"""水循环：明亮的长音和弦铺底；每一步一个上行拨弦；降水那一步一段雨声，汇流时水声变轻。"""
from synth import pad, pluck, bell, filt, hz


def score(m):
    m.put(pad([hz(48), hz(55), hz(64), hz(67)], m.dur + .5, 1600, a=1.0), 0, .2)
    for k in range(4):
        for j, n in enumerate([72, 76, 79][:1 + k % 3] + [84]):
            m.put(pluck(hz(n + 2 * k), .5, 3200), k * 3.4 + .1 + j * .16, .28, pan=-.3 + k * .2)
    rain = filt(m.noise(5.0), "band", [1500, 6000]) * .5
    m.put(rain, 6.8, .35)
    m.put(bell(hz(84), 2.5), 13.6, .25)
