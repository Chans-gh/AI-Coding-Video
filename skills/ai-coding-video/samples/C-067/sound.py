"""C-067 Demoscene：芯片音乐：方波琶音飞快地轮转，方波低音和底鼓打底，
标志弹跳时一声短促的高音。"""
from synth import square, kick, hat, hz


def score(m):
    beat = 60 / 160
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
    for k in range(48):                                                   # 十六分音符琶音
        c = chords[(k // 12) % 4]
        m.put(square(hz(c[k % 3] + 12), beat / 4 - .01, duty=.25, dec=.05), k * beat / 4, .08)
    for b in range(8):
        m.put(square(hz(chords[b // 2][0] - 12), beat - .02, duty=.5), b * beat, .12)
        m.put(kick(m), b * beat, .4)
        m.put(hat(m), b * beat + beat / 2, .12)
