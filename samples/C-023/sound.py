"""C-023 金色马赛克：金砖从四周飞来时洒下一片细碎的金属小铃，拼好后一组钟声和弦，
鱼摆尾时底下一层慢慢起伏的长音。"""
from synth import bell, pad, whoosh, hz


def score(m):
    m.put(whoosh(m, 1.4, 800, 5000), 0, .2)
    scale = [74, 76, 79, 81, 83, 86, 88, 91]
    for k in range(26):                                                   # 金砖落位
        d = .1 + k * .055 + m.rng.random() * .03
        m.put(bell(hz(scale[k % 8]), .35, ratio=3.5, index=1.0), d, .07, pan=m.rng.uniform(-.8, .8))
    for k, n in enumerate([62, 66, 69, 74]):
        m.put(bell(hz(n), 1.8, ratio=2.0, index=1.2), 1.7 + k * .06, .2)
    m.put(pad([hz(50), hz(57), hz(62)], 1.6, 1200, a=.5), 1.4, .2)
