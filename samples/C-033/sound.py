"""C-033 瑞士国际主义排版：网格画出时一串极轻的咔哒，之后每个元素在节拍上落位都是一声干脆的木鱼或底鼓，
红块换位时一声方波，最后白字压上时一声确认音；整段像印刷机一样准。"""
from synth import woodblock, kick, tick, square, beep, hz

BEAT = .375


def score(m):
    for i in range(12):
        m.put(tick(m, 4200), i * .03, .12, pan=-.6 + i * .1)
    hits = {1: woodblock(620, .14), 2: kick(m), 3: woodblock(820, .12), 4: woodblock(500, .16),
            5: square(hz(81), .1, dec=.04), 6: kick(m), 7: woodblock(900, .1), 8: tick(m, 2600), 9: kick(m)}
    for b, x in hits.items():
        m.put(x, b * BEAT, .45, pan=(-.3 if b % 2 else .3))
    for b in range(10):
        m.put(tick(m, 3000), b * BEAT, .1)
    m.put(square(hz(69), .25, dec=.12), 6 * BEAT, .25)
    m.put(beep(1320, .12), 9 * BEAT + .05, .22)
