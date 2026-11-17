"""C-006 儿童涂鸦：玩具钢琴似的拨音弹一段简单的儿歌旋律（一秒 4 拍，跟画面换张同步），
木鱼打拍子，每换一张画面一声很轻的蜡笔沙沙，小狗摇尾巴时两声短促的方波“汪汪”。"""
from synth import pluck, woodblock, filt, square, hz


def score(m):
    mel = [72, 72, 79, 79, 81, 81, 79, 0, 77, 77, 76, 76, 74, 74, 72, 0]
    for i, n in enumerate(mel):
        if n:
            m.put(pluck(hz(n), .3, 3000), i * .25, .3)
        if i % 2 == 0:
            m.put(woodblock(900, .1), i * .25, .2, pan=-.3)
        m.put(filt(m.noise(.08), "band", [2500, 6000]), i * .25, .05, pan=.3)
    for t0 in (1.5, 3.0):
        for k in range(2):
            m.put(square(hz(67 - k * 3), .08, dec=.05), t0 + k * .14, .14)
