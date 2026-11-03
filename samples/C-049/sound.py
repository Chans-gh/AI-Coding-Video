"""C-049 80 年代赛璐璐：合成器贝斯按八分音符跑，底鼓加拍手，几个音叠成的长音铺底，
外面一层录像带的嗡嗡声。"""
from synth import saw, kick, clap, pad, hum, hz


def score(m):
    beat = 60 / 160
    m.put(hum(60, m.dur), 0, .05)
    m.put(pad([hz(57), hz(60), hz(64), hz(67)], m.dur, 1800, a=.4), 0, .2)
    for k in range(16):
        n = [33, 33, 45, 33, 36, 36, 48, 36][k % 8]
        m.put(saw(hz(n), beat / 2 - .02, 700), k * beat / 2, .28)
    for b in range(8):
        m.put(kick(m), b * beat, .45)
        if b % 2:
            m.put(clap(m), b * beat, .28)
