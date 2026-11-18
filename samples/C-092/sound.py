"""C-092 刮画板：夜里低低的长音；刀尖刮墨是一下下短促尖细的摩擦声，刮羽毛时更密；猫头鹰睁眼时两声低沉的“咕咕”，题字落下一记闷响。"""
from synth import drone, whoosh, beep, thud, hz, filt


def score(m):
    m.put(drone(hz(36), m.dur, .3), 0, .28)
    t = .1
    while t < 4.4:                                                       # 刮痕
        dens = 1.6 if 1.4 < t < 3.8 else 1.0
        m.put(filt(m.noise(.05), 'band', [3500, 9000]), t, .1, pan=m.rng.uniform(-.6, .6))
        t += (.09 + m.rng.random() * .1) / dens
    for k in range(2):                                                   # 咕咕
        m.put(filt(beep(hz(57 - k * 2), .38), 'low', 900), 3.8 + k * .45, .3)
    m.put(thud(m, .5), 3.9, .35)
