"""C-056 微游戏快闪：每关开头一声指令音、倒计时滴答越来越密，各关的动作音各不一样
（咀嚼、落进桶里、8-bit 跳跃、激光嗡鸣），成功是上行两声、失败是下行方波，最后总分一声钟。"""
from synth import kick, tick, square, beep, thud, saw, bell, hum, filt, hz


def score(m):
    ST = [(0, 1.4), (1.4, 2.6), (2.6, 3.6), (3.6, 4.4)]
    for k, (a, b) in enumerate(ST):
        d = b - a
        m.put(kick(m), a, .5)
        m.put(square(hz(72 + k * 2), .1, dec=.08), a + .02, .2)
        n = 4 + k * 2
        for i in range(n):
            m.put(tick(m, 2500 + k * 300), a + .25 + i * (d * .55) / n, .12)
        ok = k < 3
        for j, f in enumerate([76, 83] if ok else [64, 58]):
            (m.put(beep(hz(f), .1), a + d * .84 + j * .08, .25) if ok else m.put(square(hz(f), .14, dec=.1), a + d * .84 + j * .1, .2))
    for i in range(5):
        m.put(filt(m.noise(.06), "band", [300, 1500]), .2 + i * .14, .3)    # 咀嚼
    m.put(thud(m, .3), 1.4 + 1.2 * .78, .5)                                  # 落进桶
    m.put(square(hz(60), .25, dec=.2), 2.6 + .3, .15)                       # 跳
    m.put(square(hz(72), .2, dec=.15), 2.6 + .4, .1)
    m.put(saw(hz(45), .8, 1200), 3.6, .2)                                   # 激光
    m.put(hum(120, .8), 3.6, .1)
    m.put(bell(hz(84), 1.2), 4.45, .3)
