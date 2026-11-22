"""C-079 赛博朋克霓虹都市：全程是雨声（高通噪声）、一层暗的长音铺底和招牌的电流嗡声；合成器低音每拍一下、底鼓和踩镲慢慢推着走；列车在 2–4 秒从右往左驶过高架，一段从右声道扫到左声道的扫频，最后一声明亮的拨音收住。"""
from synth import saw, pad, hum, kick, hat, whoosh, pluck, filt, hz


def score(m):
    m.put(filt(m.noise(m.dur), "high", 3000) * .3, 0, .55)
    m.put(pad([hz(45), hz(52), hz(57), hz(60)], m.dur, 900, .8, 1.0), 0, .14)
    m.put(hum(120, m.dur), 0, .025)
    beat = 60 / 100
    bass = [33, 33, 36, 33, 31, 33, 36, 38]
    for i, n in enumerate(bass):
        t0 = .1 + i * beat
        if t0 > m.dur - .4:
            break
        m.put(saw(hz(n), beat * .8, 260 + 260 * (i % 2)), t0, .4)
        m.put(kick(m), t0, .32)
        m.put(hat(m), t0 + beat / 2, .08, .3)
    m.put(whoosh(m, 2.2, 200, 1800), 1.8, .22, .7)
    m.put(whoosh(m, 1.6, 1800, 300), 3.0, .2, -.7)
    for t0, n in ((.6, 69), (1.8, 72), (3.0, 67), (4.2, 76)):
        m.put(pluck(hz(n), .6, 3000), t0, .12, .2)
