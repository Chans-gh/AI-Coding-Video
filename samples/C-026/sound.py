"""C-026 纸片立体书：温暖的长音铺底和一句八音盒式的钟声旋律；书翻开时一声纸张摩擦的扫频，每层布景竖起时一声清脆的纸片「啪」（短高通噪声加木鱼）；小人翻面时一声轻扫，起跳时上扬的拨音，落到桌面上一记木头闷响。"""
from synth import pad, bell, whoosh, woodblock, pluck, thud, filt, hz


def score(m):
    m.put(pad([hz(60), hz(64), hz(67), hz(71)], m.dur, 1500, .6, 1.0), 0, .08)
    for t0, n in ((.1, 84), (.5, 88), (.9, 91), (1.3, 88), (2.0, 86), (2.4, 84), (2.8, 88), (3.6, 91), (4.5, 96)):
        m.put(bell(hz(n), 1.4, 3.5, 1.2), t0, .07, .2)
    m.put(whoosh(m, 1.2, 600, 3500), .2, .22, -.3)
    for k, t0 in enumerate((1.05, 1.15, 1.2, 1.25, 1.3, 1.35)):
        m.put(filt(m.noise(.05), "high", 3000), t0 + .12, .3, (k - 2.5) * .2)
        m.put(woodblock(1200 + k * 120, .08), t0 + .12, .12)
    m.put(filt(m.noise(.06), "high", 3000), 1.7, .3)
    for k in range(4):
        m.put(woodblock(1500, .05), 2.0 + k * .23, .07)
    m.put(whoosh(m, .6, 800, 4000), 2.9, .15, .3)
    m.put(pluck(hz(72), .3, 3000), 3.5, .15)
    m.put(pluck(hz(79), .4, 3000), 3.7, .15)
    m.put(thud(m, .4), 4.3, .5)
    m.put(woodblock(500, .2), 4.3, .3)
