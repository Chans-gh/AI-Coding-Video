"""C-143 俄国构成主义：进行曲式的底鼓和军鼓踩着四拍，低音锯齿波走简单的进行曲低音，
楔形刺入一声重击，标语每砸下一个字一声短促的冲压声，镜头快推时一道上扬的噪声。"""
from synth import kick, clap, saw, impact, thud, riser, hz


def score(m):
    beat = .5
    for i in range(8):
        m.put(kick(m), i * beat, .5)
        if i % 2:
            m.put(clap(m), i * beat, .25, pan=.2)
    for i, n in enumerate([36, 43, 36, 43, 34, 41, 36, 43]):
        m.put(saw(hz(n), .4, 500), i * beat, .3)
    m.put(impact(m), .85, .6)
    for i, t0 in enumerate([1.1, 1.23, 1.45, 1.58, 1.71]):
        m.put(thud(m, .25), t0 + .1, .5, pan=-.3 + i * .15)
    m.put(riser(m, .5), 1.65, .15)
    m.put(riser(m, .4), 2.85, .12)
    m.put(impact(m), 3.4, .35)
