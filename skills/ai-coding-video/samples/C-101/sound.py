"""C-101 海报色块动态字：160 BPM 的四四拍舞曲，每拍色块砸进来就是一声底鼓加拍手，
字撞入时一声短扫频，锯齿贝斯跟着走；最后一拍一记重击收住。"""
from synth import kick, clap, hat, whoosh, saw, impact, hz

BEAT = .375


def score(m):
    bass = [36, 36, 43, 43, 41, 41, 39, 39, 36, 36]
    for b in range(10):
        t0 = b * BEAT
        m.put(kick(m), t0, .5)
        if b % 2:
            m.put(clap(m), t0, .3)
        m.put(hat(m), t0 + BEAT / 2, .14, pan=.3)
        m.put(whoosh(m, .16, 1500, 6000), max(0, t0 - .05), .12, pan=-.5 if b % 2 else .5)
        m.put(saw(hz(bass[b]), .3, 700), t0, .22)
    m.put(impact(m), 9 * BEAT, .5)
