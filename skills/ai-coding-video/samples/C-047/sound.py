"""C-047 发布片式粒子隧道：开场一段向上的升调和持续的低频推进，底鼓四拍一下、军鼓式拍手在后拍；每张数字卡硬切时一记重击加高频闪声，最后品牌字标出现时一声长长的钟和低音，其余慢慢收掉。"""
from synth import kick, clap, hat, impact, riser, bell, saw, pad, whoosh, hz


def score(m):
    b = .375
    m.put(riser(m, 1.1), 0, .18)
    for k in range(9):
        m.put(kick(m), k * b, .55)
        if k % 2:
            m.put(clap(m), k * b, .25)
        m.put(hat(m), k * b + b / 2, .1)
        m.put(saw(hz(36), b * .9, 400), k * b, .12)
    for tt_ in (1.125, 1.875, 2.625):
        m.put(impact(m), tt_, .4)
        m.put(whoosh(m, .3, 3000, 8000), tt_, .08)
    m.put(impact(m), 3.375, .5)
    m.put(bell(hz(57), 3.0, 1.5, 1.5), 3.375, .2)
    m.put(pad([hz(45), hz(52), hz(57), hz(64)], 1.6, 800, .3, 1.0), 3.375, .14)
