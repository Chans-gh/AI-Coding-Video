"""C-031 包豪斯：每个形状急停到位时一声干脆的敲击，音高各不相同（木鱼、底鼓、方波），
标题升起时一记重响，红线拉出时一声上扬的提示音。"""
from synth import woodblock, kick, impact, square, beep, hz


def score(m):
    hits = [(.35, woodblock(520, .15)), (.5, kick(m)), (.6, woodblock(780, .12)), (.75, woodblock(400, .18)), (.85, square(hz(76), .12, dec=.05)), (.95, square(hz(83), .12, dec=.05))]
    for k, (d, x) in enumerate(hits):
        m.put(x, d, .45, pan=-.5 + k * .2)
    m.put(beep(1320, .1), 1.0, .2)
    m.put(impact(m), 1.25, .5)
    for b in range(4, 8):
        m.put(kick(m), b * .375, .3)
