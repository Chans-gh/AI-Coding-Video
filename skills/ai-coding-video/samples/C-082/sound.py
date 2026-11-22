"""C-082 霓虹流体：160 BPM 的电子节拍（底鼓每拍、拍手隔拍、踩镲反拍），每拍流体被猛推一下时一声低音锯齿波；底下一层缓缓开合的长音和水流般的带通噪声扫频，结尾一声长钟。"""
from synth import kick, clap, hat, saw, pad, whoosh, bell, hz


def score(m):
    beat = 60 / 160
    m.put(pad([hz(50), hz(57), hz(62), hz(65)], m.dur, 1600, .5, 1.0), 0, .12)
    bass = [38, 38, 41, 38, 43, 41, 38, 36]
    n = int(m.dur / beat)
    for i in range(n):
        t0 = i * beat
        m.put(kick(m), t0, .35)
        if i % 2:
            m.put(clap(m), t0, .2)
        m.put(hat(m), t0 + beat / 2, .07, .3)
        m.put(saw(hz(bass[i % 8]), beat * .7, 500 + 400 * (i % 3)), t0, .3)
    for k in range(4):
        m.put(whoosh(m, 1.2, 300 + k * 200, 2500), k * 1.2, .08, -.5 + k * .33)
    m.put(bell(hz(81), 1.6), 3.75, .1)
