"""C-037 象形图运动图形：每拍一声底鼓配反拍踩镲，核心图形带每拍滑动时一声短拨音；
每 4 拍换卡时一记重击加上扬的方波，字滑上来时一声木鱼。"""
from synth import kick, hat, pluck, impact, square, woodblock, hz

BEAT = .375


def score(m):
    notes = [64, 67, 71, 67, 62, 66, 69, 66, 60, 64, 67, 72]
    for b in range(12):
        m.put(kick(m), b * BEAT, .4 if b % 4 == 0 else .25)
        m.put(hat(m), b * BEAT + BEAT / 2, .1, pan=.4)
        m.put(pluck(hz(notes[b]), .25, 3000), b * BEAT, .22, pan=-.3)
    for c in range(3):
        t0 = c * 4 * BEAT
        m.put(impact(m), t0, .35)
        for i, n in enumerate([72, 76, 79]):
            m.put(square(hz(n + c * 2), .09, dec=.05), t0 + .05 + i * .06, .14)
        m.put(woodblock(760, .12), t0 + .15, .3)
