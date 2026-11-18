"""C-146 野兽派彩纸剪贴：明快的拨音和方波跳着弹一段舞曲旋律，拍手和踩镲打切分节奏，
每钉一张纸一声短木鱼，蓝纸扫过时一阵大的纸张风声，换场后旋律升高一个调。"""
from synth import pluck, square, clap, hat, kick, woodblock, whoosh, filt, hz


def score(m):
    beat = .25
    mel = [72, 76, 79, 76, 81, 79, 76, 74, 72, 74, 76, 79, 77, 76, 74, 71]
    for i in range(16):
        n = mel[i] + (5 if i * beat >= 3 else 0)
        m.put(pluck(hz(n), .25, 3500), i * beat, .22, pan=.25)
        if i % 4 == 0:
            m.put(kick(m), i * beat, .35)
        if i % 4 == 2:
            m.put(clap(m), i * beat, .2, pan=-.2)
        m.put(hat(m), i * beat + beat / 2, .07, pan=.4)
    for i in range(7):
        m.put(woodblock(900 + i * 50, .1), .2 + i * .15, .15, pan=-.5 + i * .16)
    m.put(filt(whoosh(m, .8, 200, 2500), "low", 3000), 2.45, .5)
    for i in range(6):
        m.put(woodblock(1100, .1), 3.2 + i * .1, .12)
        m.put(square(hz(84 + i), .07, dec=.05), 3.2 + i * .1, .06)
