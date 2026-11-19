"""C-131 古罗马石子马赛克：低沉的鼓每拍一下，正好是石块波前往外推一圈的时刻；每一圈翻面带一串碎石般的短促点声，底下是一层庄重的低音长音，最后一拍用一记重击收住。"""
from synth import thud, tick, pad, impact, hz
import random


def score(m):
    b = .375
    m.put(pad([hz(43), hz(50), hz(55)], 5.0, 600, 1.0, 1.0), 0, .12)
    rnd = random.Random(3)
    for k in range(11):
        tt_ = .2 + k * b
        m.put(thud(m, .45), tt_, .4 if k % 2 == 0 else .28)
        for j in range(6 + k):
            m.put(tick(m, rnd.choice([2200, 3000, 3900, 4800])), tt_ + rnd.uniform(0, b * .9), .03, pan=rnd.uniform(-.7, .7))
    m.put(impact(m), .2 + 11 * b, .3)
