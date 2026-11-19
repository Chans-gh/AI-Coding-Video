"""C-150 敦煌壁画：琵琶拨弦走一段五声音阶，长音处用轮指（同一音快速连弹），低音长音托底；2.5 秒起壁画剥落，一串细碎的噼啪声和泥块落地的闷响，新画露出后琵琶再起。"""
from synth import string, drone, tick, thud, whoosh, hz


def score(m):
    m.put(drone(hz(40), m.dur, wobble=.2), 0, .13)
    pent = [62, 64, 67, 69, 71, 74, 76]
    seq = [(0.15, 3, 0), (.5, 4, 0), (.85, 5, 1), (1.6, 3, 0), (1.9, 2, 0), (2.2, 1, 1), (3.7, 4, 0), (4.0, 5, 0), (4.3, 6, 1)]
    for t, i, roll in seq:
        f = hz(pent[i])
        if roll:                                                         # 轮指
            for k in range(8):
                m.put(string(m, f, .5, bright=.7), t + k * .06, .15 - k * .008, pan=-.2)
        else:
            m.put(string(m, f, 1.2, bright=.7), t, .26, pan=-.2)
    for k in range(26):                                                  # 剥落
        t = 2.5 + m.rng.uniform(0, 1.6)
        m.put(tick(m, m.rng.uniform(1500, 4000)), t, .08, pan=m.rng.uniform(-.8, .8))
    m.put(whoosh(m, 1.2, 150, 700), 2.6, .15)
    for t in (3.2, 3.6, 3.9):
        m.put(thud(m, .4), t, .25, pan=m.rng.uniform(-.5, .5))
