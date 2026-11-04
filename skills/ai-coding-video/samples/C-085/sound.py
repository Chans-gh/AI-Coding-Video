"""C-085 地图路线动画：轻快的拨音节拍，线头出发时一阵扫频，里程计数时一串细碎的咔哒，
到达中途站和终点各一声钟，最后拉远时铺一个明亮的和弦。"""
from synth import pluck, tick, bell, pad, whoosh, kick, hz


def score(m):
    beat = 60 / 120
    m.put(pad([hz(62), hz(66), hz(69), hz(73)], m.dur, cutoff=1500), 0, .07)
    for k in range(10):
        m.put(kick(m), k * beat, .22)
        m.put(pluck(hz([74, 78, 81, 78][k % 4]), .25, 2600), k * beat + beat / 2, .12, pan=.3 if k % 2 else -.3)
    m.put(whoosh(m, .9, 300, 2500), .45, .2)                   # 出发
    for k in range(24):                                        # 里程跳字
        tt0 = .6 + k * .07 + (.4 if k >= 12 else 0) + (.0 if k < 12 else .35)
        m.put(tick(m, 3200 + 200 * (k % 3)), tt0, .07, pan=-.5)
    m.put(bell(hz(81), 1.4, ratio=2.0, index=1.2), 2.3, .22)   # 中途站
    m.put(whoosh(m, .9, 300, 2500), 2.55, .18)
    m.put(bell(hz(86), 1.6, ratio=2.0, index=1.2), 4.2, .25)   # 终点
    m.put(pad([hz(74), hz(78), hz(81), hz(85)], 1.0, cutoff=2600, a=.05), 4.0, .12)
