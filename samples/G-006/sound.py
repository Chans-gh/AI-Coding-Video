"""G-006 无限放大：CC0 配乐为主；每钻进一层一声上扬的风声接一声钟，歌词每个字亮起时一声很轻的拨音"""
from pathlib import Path
from synth import assets, riser, bell, pluck, hz

T0, SEG = .8, 3.5
LYRICS = ['推开那扇圆窗', '落进海的漩涡', '穿过一颗气泡', '原来你在这里']


def score(m):
    assets(m, Path(__file__).parent, music=.55)
    for k in range(1, 4):
        t = T0 + k * SEG
        m.put(riser(m, 1.2), t - 1.2, .12)
        m.put(bell(hz(79 - k * 2), 2.5), t, .14)
    scale = [72, 74, 76, 79, 81, 84, 86]
    for li, line in enumerate(LYRICS):
        for i in range(len(line)):
            t = T0 - .3 + li * SEG + SEG * .7 * (i + .5) / len(line)
            m.put(pluck(hz(scale[(i + li) % 7]), .3, 2500), t, .05)
