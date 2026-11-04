"""C-048 1930 年代橡皮管卡通：老放映机的咔嗒声，木鱼和摇摆踩镲打出爵士节奏，
低音拨弦走行走低音，方波吹一段单簧管味的小旋律。"""
from synth import tick, woodblock, hat, pluck, square, hum, hz


def score(m):
    beat = 60 / 160
    m.put(hum(60, m.dur), 0, .05)
    for k in range(36):
        m.put(tick(m, 1500), k / 12, .05)                                 # 放映机
    for b in range(8):
        m.put(pluck(hz([43, 47, 50, 52, 53, 52, 50, 47][b]), .34, bright=800), b * beat, .5)
        m.put(woodblock(900 if b % 2 else 650, .1), b * beat, .2)
        m.put(hat(m), b * beat + beat * .66, .12, pan=.3)
    for k, n in enumerate([67, 71, 74, 76, 74, 71, 72, 74]):
        m.put(square(hz(n), beat * .9, duty=.3, dec=.25), k * beat, .07, pan=-.2)
