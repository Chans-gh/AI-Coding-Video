"""C-119 电视购物：热闹的铜管式锯齿和弦加快速鼓点，第一屏低落的下行“哇哇”方波，
每次硬切一声拍手加重击，大字砸下一声扫频，价格爆炸贴一声收银机式的双钟，最后一屏一串上行琶音。"""
from synth import kick, hat, clap, impact, saw, square, whoosh, bell, pad, hz


def score(m):
    beat = .3
    for b in range(16):
        m.put(kick(m), b * beat, .35 if b >= 4 else .15)
        m.put(hat(m), b * beat + beat / 2, .1, pan=.3)
    for k, n in enumerate([62, 61, 60, 58]):           # 第一屏：垂头丧气
        m.put(square(hz(n), .26, dec=.2), .25 + k * .22, .14)
    for i in range(1, 4):                               # 硬切
        t0 = i * 1.2
        m.put(impact(m), t0, .4)
        m.put(clap(m), t0, .3)
        m.put(pad([hz(n) for n in [60 + i * 2, 64 + i * 2, 67 + i * 2]], 1.1, cutoff=3000, a=.01), t0, .13)
        m.put(saw(hz(48 + i * 2), .5, 1200), t0, .18)
    for i in range(4):
        m.put(whoosh(m, .14, 3000, 600), i * 1.2 + .05, .2)
    m.put(bell(hz(88), .6, ratio=1.5, index=1.2), 2.85, .25)
    m.put(bell(hz(93), .6, ratio=1.5, index=1.2), 2.95, .25)
    for k, n in enumerate([72, 76, 79, 84, 88]):
        m.put(square(hz(n), .1, dec=.06), 3.7 + k * .07, .12)
