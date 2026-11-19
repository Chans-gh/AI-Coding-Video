"""C-070 实时 WebGL 自然：一层柔和的流水声（低通过的长扫声叠在一起）和很轻的长音；每次指针点下水面是一声清脆的「叮」加一点水花般的高频扫声，涟漪散开时尾音慢慢消失。"""
from synth import whoosh, bell, pad, hz

TAPS = [.62, 1.45, 2.2, 2.95, 3.65, 4.3]


def score(m):
    m.put(pad([hz(57), hz(64), hz(69), hz(76)], 5.0, 1200, 1.0, 1.0), 0, .07)
    for k in range(6):
        m.put(whoosh(m, 1.2, 200, 600), k * .8, .05, pan=(-1) ** k * .4)
    for i, tt_ in enumerate(TAPS):
        m.put(bell(hz([84, 88, 91, 86, 93, 89][i]), 1.2, 2.5, 1.6), tt_, .1, pan=(-1) ** i * .3)
        m.put(whoosh(m, .35, 2500, 6000), tt_, .05)
