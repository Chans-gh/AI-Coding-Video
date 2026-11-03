"""C-173 星空连线：低沉的环境长音，每连一条线响一声细碎的铃（五声音阶往上走），轮廓浮现时一组和弦铃声，推近时一阵很轻的风声。"""
from synth import pad, bell, drone, whoosh, filt, hz

E0, ED, N = .35, .19, 9


def score(m):
    d = m.dur + .5
    m.put(filt(drone(hz(38), d, .3), "low", 400), 0, .5)
    m.put(pad([hz(n) for n in (50, 57, 64)], d, 700, a=1.0, rel=1.5), 0, .3)
    scale = [74, 76, 79, 81, 83, 86, 88, 91, 93]
    for k in range(N):
        m.put(bell(hz(scale[k]), 1.2, 3.0, 1.0), E0 + k * ED, .22, -.5 + k / N)
    for n, pan in ((81, -.4), (86, 0), (91, .4)):
        m.put(bell(hz(n), 2.2, 2.0, .8), 2.15, .16, pan)
    m.put(whoosh(m, 1.6, 200, 900), 2.8, .15)
