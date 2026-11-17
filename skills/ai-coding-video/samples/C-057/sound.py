"""C-057 综艺节奏扁平：150 BPM，每拍底鼓加反拍踩镲；老师出题的 4 拍各一声高音方波（问），
玩家照做的 4 拍用同样的音高低一个八度（答），最后 Perfect! 一串上行琶音加拍手。"""
from synth import kick, hat, square, clap, pluck, hz

BT = .4


def score(m):
    q = [76, 79, 76, 83]
    for b in range(12):
        m.put(kick(m), b * BT, .4)
        m.put(hat(m), b * BT + BT / 2, .1, pan=.3)
    for i, n in enumerate(q):
        m.put(square(hz(n), .18, dec=.1), i * BT, .22, pan=-.4)
        m.put(square(hz(n - 12), .18, dec=.1), (4 + i) * BT, .26, pan=.4)
    for i, n in enumerate([72, 76, 79, 84, 88]):
        m.put(pluck(hz(n), .4, 5000), 8 * BT + i * .06, .3)
    for k in range(3):
        m.put(clap(m), 8 * BT + k * .2, .3)
