"""T-022 文字穿插主体景深：深沉电影感低音铺底、大字升起鼓点与切换重音"""
from synth import pad, kick, pluck, bell, hz


def score(m):
    m.put(pad([hz(40), hz(47), hz(52)], m.dur, cutoff=850), 0.0, .24)
    m.put(kick(m), 0.35, .42)
    m.put(bell(hz(64), 0.8), 0.38, .18)
    for t in [1.2, 2.2, 3.2, 4.3, 5.4, 6.5, 7.6]:
        m.put(kick(m), t, .32)
    m.put(pluck(hz(71), 0.35), 4.30, .22)
    m.put(bell(hz(76), 1.1), 4.32, .20)
