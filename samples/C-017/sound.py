"""C-017 麻胶版画：开头揭版时一阵滚筒的摩擦声和一记闷响，
之后每拍一下木鱼，配一段低音拨弦，节奏和每秒 8 格的顿挫对齐。"""
from synth import thud, woodblock, string, whoosh, hz


def score(m):
    m.put(whoosh(m, .55, 200, 1200), 0, .3)                               # 揭版
    m.put(thud(m, .5), .55, .6)
    for b in range(8):
        m.put(woodblock(700 if b % 2 else 520, .12), b * .375, .3, pan=(-1) ** b * .2)
    for k, n in enumerate([45, 48, 50, 52, 50, 48]):
        m.put(string(m, hz(n), .8, bright=.4), .75 + k * .375, .35)
