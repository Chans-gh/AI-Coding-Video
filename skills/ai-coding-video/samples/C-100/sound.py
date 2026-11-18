"""C-100 旧档案剪贴簿：低沉的悬疑长音铺底，卡片贴上时纸的摩擦和胶带撕拉声，
打字机逐字的咔哒和换行铃，剪字拍上时几声闷响，红笔划过的沙沙声，最后橡皮章重重盖下。"""
from synth import drone, tick, bell, thud, impact, whoosh, filt, hz


def score(m):
    m.put(drone(hz(36), m.dur + .3, .3), 0, .3)
    for t0 in (.1, .6):
        m.put(filt(m.noise(.25), "band", [800, 4000]), t0, .12)
    for t0 in (.4, .5):
        m.put(filt(m.noise(.15), "band", [2000, 8000]), t0, .1, pan=.3)
    n = 34
    for i in range(n):
        m.put(tick(m, 2200 + m.rng.random() * 800), 1.0 + i * 1.5 / n, .22, pan=m.rng.uniform(-.2, .2))
    m.put(bell(hz(96), .6, 2.0, 1.0), 1.75, .08)
    for i in range(6):
        m.put(thud(m, .2), 1.5 + i * .12, .3)
    m.put(whoosh(m, .6, 1500, 5000), 2.3, .1)
    m.put(impact(m), 3.2, .7)
