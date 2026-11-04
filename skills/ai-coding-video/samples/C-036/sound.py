"""C-036 动态排版：160 BPM 的电子鼓，每一拍换一个词就踩一下底鼓，
反白的几拍加拍手，反拍上是踩镲，下面一条锯齿低音。"""
from synth import kick, clap, hat, saw, hz


def score(m):
    beat = 60 / 160
    for b in range(8):
        m.put(kick(m), b * beat, .7)
        m.put(hat(m), b * beat + beat / 2, .15, pan=.3)
        if b % 3 == 2 or b == 6:                     # 画面反白的拍子
            m.put(clap(m), b * beat, .45)
        n = [36, 36, 39, 36, 41, 39, 36, 43][b]
        m.put(saw(hz(n), beat - .04, 700), b * beat, .32)
