"""C-034 60 年代间谍片头：每拍换画面时一记重拍，低音拨弦弹一段冲浪吉他味的小调连复段，
踩镲打摇摆，最后片名冲进来时铜管味的和弦。"""
from synth import string, hat, kick, saw, impact, hz


def score(m):
    beat = 60 / 160
    riff = [40, 43, 45, 46, 45, 43, 40, 38]
    for b in range(8):
        m.put(string(m, hz(riff[b]), .5, bright=.7), b * beat, .5)
        m.put(string(m, hz(riff[b] + 12), .3, bright=.6), b * beat + beat / 2, .25)
        m.put(hat(m), b * beat + beat * .66, .14)
        m.put(kick(m), b * beat, .3)
    for n in [52, 55, 59, 62]:
        m.put(saw(hz(n), .8, 1800), 6 * beat, .14)
    m.put(impact(m), 6 * beat, .4)
