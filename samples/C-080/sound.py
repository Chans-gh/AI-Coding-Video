"""C-080 3D 动画电影式卡通：轻快的拨弦伴奏垫底；星星飘落是一串下行的钟琴，角色挑眉时一声俏皮的上滑，压身预备是一段上升的嗡声，起跳和接住星星各有一记亮音，落地是软软的“噗”加木鱼回弹，最后脸红时一个温暖的大三和弦。"""
from synth import pluck, bell, woodblock, whoosh, pad, riser, thud, beep, hz

# 与 scene.js 的 TB 时间表一致
TB = dict(star=1.0, brow=1.25, crouch=1.6, jump=2.1, catch=2.47, land=2.85, blush=3.2)


def score(m):
    for i in range(13):
        n = [60, 67, 64, 67][i % 4]
        m.put(pluck(hz(n), .3, 1800), i * .375, .07)
    for i, n in enumerate([91, 88, 86, 84, 81, 79]):
        m.put(bell(hz(n), .6, 3.0, .8), .2 + i * .28, .05)
    for i in range(5):
        m.put(beep(500 + i * 180, .04), TB['brow'] + i * .03, .05)
    m.put(riser(m, TB['jump'] - TB['crouch']), TB['crouch'], .06)
    m.put(whoosh(m, .4, 400, 2400), TB['jump'], .07)
    m.put(bell(hz(96), 1.2, 3.5, 1.2), TB['catch'], .1)
    m.put(bell(hz(91), 1.0, 3.5, 1.0), TB['catch'] + .06, .07)
    m.put(thud(m, .3), TB['land'], .16)
    for i, f in enumerate([700, 900, 1100]):
        m.put(woodblock(f, .1), TB['land'] + .08 + i * .1, .08)
    m.put(pad([hz(60), hz(64), hz(67), hz(72), hz(76)], 1.8, 1800, .2, .8), TB['blush'], .1)
    for i, n in enumerate([72, 76, 79, 84]):
        m.put(pluck(hz(n), .5, 3000), 3.6 + i * .19, .08)
