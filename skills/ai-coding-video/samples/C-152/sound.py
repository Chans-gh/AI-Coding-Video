"""C-152 波斯细密画：乌德琴一样的低沉拨弦走一段带增二度的音阶（中东味），手鼓轻轻打拍，镜头往上摇到金顶时一声铃。"""
from synth import string, drone, woodblock, thud, bell, hz


def score(m):
    m.put(drone(hz(38), m.dur, wobble=.2), 0, .15)
    hijaz = [50, 51, 54, 55, 57, 58, 60, 62]                              # 带增二度
    notes = [0, 1, 2, 3, 2, 1, 2, 4, 5, 4, 3, 2, 3, 1, 0]
    for i, n in enumerate(notes):
        t = .1 + i * .31
        m.put(string(m, hz(hijaz[n] + 12), 1.2, damp=.994, bright=.35), t, .3, pan=-.15)
        if i % 4 == 0:
            m.put(string(m, hz(hijaz[n]), 1.6, damp=.995, bright=.25), t, .2)
    for b in range(13):                                                   # 手鼓：咚、嗒
        t = b * .375
        m.put(thud(m, .25) if b % 4 == 0 else woodblock(700, .1), t, .22 if b % 4 == 0 else .07, pan=.3)
    m.put(bell(hz(86), 2.0, ratio=2.0, index=.8), 3.8, .08)
