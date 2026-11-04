"""C-191 柯比式 60 年代美漫：开头一段铜管式的锯齿和弦向上推（英雄飞来），0.72 秒拳头冲到眼前时一记重击、噪声爆裂和低频轰鸣；能量点跳动时一串噼啪的电火花（随机短噪声，按一拍二的节奏）；1.5 秒对白框弹出一声短促的「啵」，之后鼓点和铜管长音撑到结尾。"""
import numpy as np
from synth import saw, impact, kick, clap, whoosh, drone, filt, tt, hz


def score(m):
    for i, ch in enumerate([(48, 52, 55), (50, 53, 57), (52, 55, 59)]):
        for n in ch:
            m.put(saw(hz(n), .26, 900 + i * 500), .05 + i * .22, .14)
    m.put(whoosh(m, .7, 300, 4000), 0, .3)
    m.put(impact(m), .72, .8)
    m.put(kick(m), .72, .7)
    m.put(filt(m.noise(.5), "low", 3000) * np.exp(-tt(.5) * 8), .72, .5)
    m.put(drone(hz(31), 1.6, .1) * np.exp(-tt(1.6) * 1.5), .72, .45)
    rng = np.random.default_rng(191)
    t0 = .8
    while t0 < m.dur - .2:
        if rng.random() < .7:
            m.put(filt(m.noise(.03), "high", 3000) * np.exp(-tt(.03) * 120), t0, .25, rng.uniform(-.7, .7))
        t0 += 1 / 12
    tp = tt(.05); pop = np.sin(2 * np.pi * np.cumsum(np.linspace(900, 300, len(tp))) / 44100) * np.exp(-tp * 60)
    m.put(pop, 1.5, .4)
    beat = .375
    for i in range(int((m.dur - 1.6) / beat)):
        tb = 1.65 + i * beat
        m.put(kick(m) if i % 2 == 0 else clap(m), tb, .35)
    for n in (55, 59, 62, 67):
        m.put(saw(hz(n), 2.8, 1600, a=.08, rel=.6), 1.9, .1)
