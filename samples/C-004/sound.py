"""C-004 油画厚涂：低沉的长音和缓慢起伏的铺底，一阵阵中频噪声像刷子刮过画布，
太阳的笔触绕圈时加一组明亮的钟声。"""
from synth import pad, drone, whoosh, bell, hz


def score(m):
    m.put(drone(hz(38), m.dur, .2), 0, .25)
    m.put(pad([hz(50), hz(57), hz(62), hz(66)], m.dur, 1200, a=.8), 0, .22)
    for k in range(8):                                                   # 刷子
        m.put(whoosh(m, .32, 600, 1800), k * .375 + .05, .18, pan=(-1) ** k * .4)
    for k, f in enumerate([74, 78, 81, 86]):
        m.put(bell(hz(f), 1.6, ratio=2.0, index=1.2), .9 + k * .3, .14, pan=.3)
