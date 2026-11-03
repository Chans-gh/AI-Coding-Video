"""C-019 Risograph：印刷机滚筒的咔嗒声按每秒 8 次走，轻快的鼓点和拨音旋律，
太阳升起时一组明亮的钟声。"""
from synth import tick, kick, hat, pluck, bell, hz


def score(m):
    for k in range(24):
        m.put(tick(m, 2200), k / 8, .12, pan=-.3)                         # 滚筒
    for b in range(8):
        m.put(kick(m), b * .375, .4 if b % 2 == 0 else .2)
        m.put(hat(m), b * .375 + .1875, .15)
    for k, n in enumerate([72, 76, 79, 76, 81, 79, 84, 88]):
        m.put(pluck(hz(n), .3, bright=3500), k * .375, .2, pan=.3)
    for k, n in enumerate([84, 88, 91]):
        m.put(bell(hz(n), 1.4, ratio=2.0, index=1.0), 1.5 + k * .1, .12)
