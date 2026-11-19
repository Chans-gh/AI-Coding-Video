"""C-106 孟菲斯微缩景：画框张开时一声轻快的上滑；之后是钢琴（拨弦合成的和弦）配马林巴（木鱼音色的短音）的一段小步舞曲，五声音阶一路走，最后一个大和弦收住。"""
from synth import string, woodblock, whoosh, pad, bell, hz


def score(m):
    m.put(whoosh(m, .8, 300, 2500), 0, .06)
    m.put(bell(hz(84), 1.2, 2.0, .6), .9, .05)
    chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
    for i, c in enumerate(chords):
        for j, n in enumerate(c):
            m.put(string(m, hz(n), 1.6, .995, .5), .9 + i * 1.0 + j * .02, .06)
        m.put(string(m, hz(c[0] - 12), 1.8, .996, .4), .9 + i * 1.0, .07)
    mel = [76, 79, 81, 79, 76, 74, 72, 74, 76, 79, 84, 81, 79, 76, 79, 84]
    for i, n in enumerate(mel):
        m.put(woodblock(hz(n), .16), .9 + i * .25, .08)
        m.put(woodblock(hz(n + 12), .08), .9 + i * .25 + .01, .03)
    m.put(pad([hz(60), hz(64), hz(67), hz(72)], 1.0, 1600, .1, .8), 4.6, .08)
