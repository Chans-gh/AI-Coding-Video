"""C-113 翻牌显示板：两次换屏各是一阵密集的咔哒（每格每翻一片一声，按列、行错开），
换屏前一声站台提示的双音钟；底下一层很轻的车站空间低鸣。"""
import random
from synth import tick, bell, drone, hz


def score(m):
    m.put(drone(hz(40), 4.8, wobble=.1), 0, .06)
    rnd = random.Random(113)
    for ph in (.25, 2.75):
        for r in range(6):
            for c in range(13):
                t0 = ph + c * .045 + r * .07
                n = 5 + rnd.randrange(7)
                for i in range(n):
                    if rnd.random() < .45:
                        m.put(tick(m, rnd.choice([1800, 2300, 2900, 3500])), t0 + i * .05 + rnd.random() * .004,
                              .05 + rnd.random() * .05, pan=-.7 + c / 13 * 1.4)
    for k, n in enumerate([76, 72]):
        m.put(bell(hz(n), 1.2, ratio=2.0, index=1.0), 2.15 + k * .28, .18)
