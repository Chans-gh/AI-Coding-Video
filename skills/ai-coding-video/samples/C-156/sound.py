"""C-156 图形形变叙事：底下一层温暖的铺底，每次变形一段柔和的嗖声（先扬后落），
形状停住时一声轻拨音，换字幕时一声小钟；最后地图钉落定时一声轻的闷响。"""
from synth import pad, whoosh, pluck, bell, thud, hz


def score(m):
    m.put(pad([hz(60), hz(64), hz(67), hz(71)], 5.0, cutoff=1300, a=.4), 0, .12)
    morphs = [(.6, 1.0), (1.0, 1.45), (1.95, 2.35), (2.35, 2.8), (3.3, 3.7), (3.7, 4.15)]
    for k, (a, b) in enumerate(morphs):
        m.put(whoosh(m, b - a + .1, 400, 1600 if k % 2 == 0 else 1100), a, .14, pan=-.3 if k % 2 else .3)
    for k, (tt, n) in enumerate([(1.45, 72), (2.8, 76), (4.15, 79)]):
        m.put(pluck(hz(n), .5, 2400), tt, .3)
    for tt in (1.2, 2.55, 3.85):
        m.put(bell(hz(84), .8, ratio=2.0, index=.6), tt, .07)
    m.put(thud(m, .3), 4.15, .3)
