"""C-096 铜版雕刻：古钢琴似的拨音弹一段慢旋律；刻刀推线是一下下细碎的刮擦，上水彩时两道柔和的刷声，题字出现时一声低沉的压印闷响。"""
from synth import pluck, whoosh, thud, pad, hz, filt


def score(m):
    m.put(pad([hz(55), hz(62), hz(67)], m.dur, 900, a=1.0), 0, .1)
    mel = [67, 71, 74, 72, 71, 69, 67, 66, 67]
    for i, n in enumerate(mel):
        m.put(pluck(hz(n), .5, 5000), .1 + i * .5, .14, pan=-.2)
        m.put(pluck(hz(n - 12), .5, 2500), .1 + i * .5, .08, pan=.2)
    t = .1
    while t < 3.0:                                                       # 刻刀
        m.put(filt(m.noise(.06), 'band', [2500, 7000]), t, .07, pan=m.rng.uniform(-.5, .5))
        t += .07 + m.rng.random() * .08
    for k in range(2):                                                   # 水彩刷
        m.put(whoosh(m, .6, 400, 1500), 2.8 + k * .5, .12, pan=-.3 + k * .6)
    m.put(thud(m, .6), 3.3, .4)
