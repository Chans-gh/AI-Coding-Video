"""C-111 桌面穿梭：马林巴般的短促木琴音（FM 钟声取低调制、短衰减）踩着 120 BPM，每拍小人起跳一个音、落地一声轻轻的木头「笃」；底下一层暖的长音和轻柔的拍手；最后拉远看全桌时一个上行的琶音收住。"""
from synth import bell, woodblock, pad, clap, whoosh, hz


def mar(f, d=.45):
    return bell(f, d, 4.0, .7)


def score(m):
    beat = .5
    m.put(pad([hz(60), hz(64), hz(67), hz(71)], m.dur, 1400, .5, 1.0), 0, .08)
    mel = [72, 76, 79, 76, 74, 77, 81, 79]
    for i in range(8):
        t0 = i * beat
        m.put(mar(hz(mel[i])), t0 + .06, .22, -.3 + i * .08)
        m.put(mar(hz(mel[i] - 12)), t0 + .06, .12)
        m.put(woodblock(900 + (i % 2) * 200, .07), t0 + .45, .14)
        if i % 2:
            m.put(clap(m), t0, .07)
        m.put(whoosh(m, .3, 800, 2500), t0 + .1, .03, .4)
    for k, n in enumerate((72, 76, 79, 84, 88)):
        m.put(mar(hz(n), .8), 4.1 + k * .1, .2, -.4 + k * .2)
