"""C-161 蜡染：两个人相对而唱——左边一句拨弦旋律、右边用钟琴应一句，五声音阶来回对唱；底下是低沉的持续音；染液前沿扫过布面时一道湿润的长噪声，扫完以后两个声部换一个调再唱一遍。"""
from synth import pluck, bell, drone, whoosh, pad, hz

SW = [2.3, 3.5]


def score(m):
    m.put(drone(hz(38), 5.0, .25), 0, .1)
    a = [62, 64, 67, 69, 67, 64]
    b = [74, 72, 69, 67, 69, 72]
    for i, n in enumerate(a):
        m.put(pluck(hz(n), .5, 2200), .2 + i * .17, .09)
    for i, n in enumerate(b):
        m.put(bell(hz(n), .8, 2.0, 1.0), 1.25 + i * .17, .06)
    m.put(whoosh(m, SW[1] - SW[0], 500, 1500), SW[0], .06)
    for i, n in enumerate(b):
        m.put(pluck(hz(n - 12), .5, 2200), SW[1] + .05 + i * .14, .09)
    for i, n in enumerate(a):
        m.put(bell(hz(n + 12), .7, 2.0, 1.0), SW[1] + .1 + i * .14, .05)
    m.put(pad([hz(50), hz(57), hz(62), hz(69)], 1.0, 1400, .2, .8), 4.4, .08)
