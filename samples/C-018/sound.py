"""C-018 木刻：低沉的长音；刻刀一下下推进木头（短促的中频噪声加木头的闷响，按每秒 12 格的节奏忽密忽疏），灯窗刻开时一声钟，最后题字刻完一记重击。"""
from synth import drone, whoosh, woodblock, bell, impact, hz


def score(m):
    m.put(drone(hz(33), m.dur, .3), 0, .3)
    t = .15
    while t < 4.0:                                                       # 刻刀
        m.put(whoosh(m, .07, 900, 2600), t, .13, pan=m.rng.uniform(-.5, .5))
        if m.rng.random() < .35:
            m.put(woodblock(380 + m.rng.random() * 120, .08), t + .05, .12)
        t += [1, 2, 1, 3][int(m.rng.random() * 4)] / 12
    m.put(bell(hz(69), 2.8, ratio=2.0, index=1.0), .45, .16, pan=.3)       # 灯亮
    m.put(impact(m), 3.75, .45)
    m.put(bell(hz(57), 1.2, ratio=2.0, index=.8), 3.8, .12)
