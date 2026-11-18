"""C-093 点刻：安静的长音铺底；针管笔一下下点在卡纸上，是极短的高频咔哒，先稀后密再变稀（跟着点的出现速度），标签出现时一声轻钟。"""
from synth import pad, tick, bell, hz


def score(m):
    m.put(pad([hz(62), hz(69), hz(74)], m.dur, 1100, a=1.2), 0, .12)
    t = .15
    while t < 4.3:                                                       # 点
        x = (t - .15) / 4.15
        rate = 6 + 26 * (1 - abs(x - .5) * 2)                            # 中段最密
        m.put(tick(m, 5200 + m.rng.random() * 2500), t, .06 + m.rng.random() * .04, pan=m.rng.uniform(-.6, .6))
        t += 1 / rate
    m.put(bell(hz(81), 2.0, ratio=2.0, index=.7), 3.7, .1, pan=-.2)
