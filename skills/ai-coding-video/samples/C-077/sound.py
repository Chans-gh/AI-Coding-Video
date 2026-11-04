"""C-077 音乐可视化：画面上每一颗球击中圆环，声音里就有一个音：半拍一个钟声沿五声音阶跳，
每拍一下底鼓，底下一层长音。"""
from synth import bell, kick, pad, hz


def score(m):
    beat = 60 / 160
    m.put(pad([hz(57), hz(64), hz(69), hz(72)], m.dur, 1600, a=.5), 0, .18)
    scale = [69, 72, 74, 76, 79, 81, 84, 86]
    for k in range(15):                                                   # 和画面的 VIZ_HITS 一致
        m.put(bell(hz(scale[(k * 3) % 8]), .8, ratio=2.0, index=1.2), (k + 1) * beat / 2, .2, pan=((k * 2.39996) % 2) - 1)
    for b in range(8):
        m.put(kick(m), b * beat, .4)
