"""C-083 玻璃拟态极光：低而宽的铺底和缓慢起伏的持续音，像呼吸；面板浮起时一阵轻风，
吸气时一段上扬的轻风，屏住时一声柔和的钟，呼气时一段下沉的风声。"""
from synth import pad, drone, whoosh, bell, hz


def score(m):
    m.put(pad([hz(50), hz(57), hz(62), hz(69)], 5.0, cutoff=900, a=1.2, rel=1.2), 0, .22)
    m.put(drone(hz(38), 5.0, wobble=.2), 0, .12)
    m.put(whoosh(m, 1.0, 200, 1200), 0, .12)
    m.put(whoosh(m, 2.0, 300, 1800), .6, .1, pan=-.3)
    m.put(bell(hz(81), 2.0, ratio=2.0, index=.8), 2.6, .12)
    m.put(whoosh(m, 1.4, 1600, 300), 3.2, .1, pan=.3)
    m.put(bell(hz(76), 1.5, ratio=2.0, index=.6), 4.6, .07)
