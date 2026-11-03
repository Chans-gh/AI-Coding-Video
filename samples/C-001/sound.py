"""C-001 水墨：拨弦（Karplus-Strong，像古琴）弹五声音阶，题字每出一个字响一个音；
墨晕化开时是一阵低沉的风声，盖朱印时一声木质闷响。"""
from synth import string, whoosh, woodblock, thud, drone, hz


def score(m):
    m.put(drone(hz(38), m.dur + .5, wobble=.2), 0, .05)                 # 极低的持续音垫底
    m.put(whoosh(m, 1.6, 180, 900), 0, .22, pan=-.2)                   # 墨晕化开
    m.put(string(m, hz(43), 2.8, damp=.997, bright=.3), .02, .55)      # 开场低音
    for k, n in enumerate([62, 64, 67, 69]):                          # 题字：山 高 水 长
        m.put(string(m, hz(n), 2.0, damp=.995, bright=.45), .5 + k * .22, .42, pan=.15 + k * .08)
    m.put(woodblock(420, .25), 1.92, .5)                               # 朱印落下
    m.put(thud(m, .5), 1.92, .45)
    m.put(string(m, hz(74), 1.2, damp=.994, bright=.6), 2.15, .2, pan=.4)  # 余音
