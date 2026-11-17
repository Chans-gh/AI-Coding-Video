"""C-103 白色目录册：轻快的钢琴式拨音和弦铺底；产品落下一声软闷响，每条批注画圈时一段铅笔沙沙声，
写字时一串细咔哒，灯点亮一声“叮”，荧光笔一声短刷，价签弹出一声确认音。"""
from synth import pluck, thud, filt, tick, bell, beep, hz


def score(m):
    chords = [[60, 64, 67], [57, 60, 64], [65, 69, 72], [67, 71, 74]]
    for i, ch in enumerate(chords):
        for k, n in enumerate(ch):
            m.put(pluck(hz(n), .9, 2000), i * 1.2 + k * .04, .14)
    m.put(thud(m, .3), .55, .3)
    for t0 in (1.0, 1.8, 2.6):
        m.put(filt(m.noise(.45), "band", [2500, 6500]), t0, .07)
        for k in range(6):
            m.put(tick(m, 5000), t0 + .5 + k * .06, .05)
    m.put(bell(hz(88), 1.2, ratio=2.0, index=.8), 2.95, .18)
    m.put(filt(m.noise(.3), "band", [1200, 3500]), 3.3, .1)
    m.put(beep(1320, .1), 3.7, .2)
