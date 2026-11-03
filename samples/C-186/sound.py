"""C-186 东方赛博：全程是雨声（高通白噪声）和一条锯齿波电子低音（每拍一下，带低通开合）；古筝式的拨弦弹一句五声音阶，升到屋顶、全息字亮起时（2.4 秒）加一声钟和上扬的扫频。"""
import numpy as np
from synth import saw, string, bell, whoosh, riser, kick, filt, hz


def score(m):
    rain = filt(m.noise(m.dur), "high", 2500) * .25
    m.put(rain, 0, .5)
    beat = 60 / 120
    bass = [38, 38, 41, 43, 38, 38, 45, 43, 38]
    for i, n in enumerate(bass):
        t0 = .2 + i * beat
        if t0 > m.dur - .3:
            break
        m.put(saw(hz(n), beat * .9, 300 + 500 * (i % 2)), t0, .45)
        m.put(kick(m), t0, .35)
    for t0, n in ((.3, 62), (.55, 64), (.8, 67), (1.3, 69), (1.55, 67), (1.8, 64), (2.4, 74), (2.65, 72), (2.9, 69), (3.4, 67), (3.65, 69)):
        m.put(string(m, hz(n), 1.8, .997, .6), t0, .5, .25)
    m.put(riser(m, 1.4), 1.0, .25)
    m.put(whoosh(m, 1.2, 400, 4000), 2.0, .3, -.2)
    m.put(bell(hz(86), 2.0), 2.4, .2, .2)
