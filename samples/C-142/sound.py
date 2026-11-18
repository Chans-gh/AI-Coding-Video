"""C-142 分析立体主义：咖啡馆里的拨弦琴一下一下弹着断开的分解和弦，平面浮出时是干脆的木块声，字母印上去是闷闷的一下，之后和弦错开半拍、像画面一样滑动。"""
from synth import string, woodblock, thud, pad, hz


def score(m):
    m.put(pad([hz(50), hz(57), hz(60), hz(65)], m.dur, 800, a=1.0), 0, .1)
    t = .1
    while t < 2.8:                                                       # 面浮出
        m.put(woodblock(1400 + 600 * m.rng.random()), t, .06, pan=m.rng.uniform(-.7, .7))
        t += .18
    notes = [57, 60, 64, 62, 65, 69, 67, 64]
    for i, n in enumerate(notes):                                        # 拨弦，后半段错半拍
        at = .3 + i * .55 + (.14 if i >= 4 else 0)
        m.put(string(m, hz(n), 1.6), at, .14, pan=(-1) ** i * .3)
    for i in range(3):                                                   # 漏字板印字
        m.put(thud(m, .3), 2.0 + i * .35, .3)
