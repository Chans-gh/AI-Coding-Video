"""C-030 剪影剧场：安静的弦乐式铺底从暖和的大调慢慢落到低沉的小调，Karplus-Strong 拨弦弹三个乐句（每行诗一句），
小人的脚步是很轻的闷响，窗户点灯时一声柔和的钟。"""
from synth import pad, string, thud, bell, hz


def score(m):
    m.put(pad([hz(60), hz(64), hz(67)], 2.6, cutoff=1500, a=.6, rel=1.0), 0, .14)
    m.put(pad([hz(57), hz(60), hz(64)], 2.6, cutoff=1000, a=1.0, rel=1.2), 2.4, .14)
    phrases = [(.3, [72, 74, 76, 79]), (1.8, [76, 74, 72]), (3.4, [69, 72, 76, 74])]
    for t0, notes in phrases:
        for k, n in enumerate(notes):
            m.put(string(m, hz(n), 1.2, damp=.997, bright=.4), t0 + k * .3, .3, pan=-.2 + k * .1)
    for k in range(14):
        m.put(thud(m, .12), .35 + k * .3, .05, pan=-.4 + k * .05)
    m.put(bell(hz(84), 2.0, ratio=2.0, index=.6), 3.45, .14)
