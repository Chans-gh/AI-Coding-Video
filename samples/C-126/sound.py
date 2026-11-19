"""C-126 虹彩玻璃泡：柔和的玻璃质感和弦铺底（带缓慢起伏）；金币一枚枚落进来，每枚是一下清脆的高音钟加细碎的叮当，越来越密；裂纹出现时一声尖细的玻璃“咔”和下滑的噪声；金线封合时一段温暖的上行琶音，结尾一声长钟。"""
from synth import pad, bell, tick, whoosh, beep, hz

TL = dict(coin0=.5, coinDt=.045, coins=46, crack=2.7, crackD=.5, seal=3.5, sealD=.8)


def score(m):
    m.put(pad([hz(62), hz(69), hz(74), hz(78)], 5.0, 2400, .8, 1.0), 0, .06)
    for i in range(TL['coins']):
        t = TL['coin0'] + i * TL['coinDt'] + .62
        n = [86, 88, 91, 93, 95, 98][(i * 5) % 6]
        m.put(bell(hz(n), .35, 3.7, 1.5), t, .03)
        m.put(tick(m, 6000 + (i * 397) % 3000), t, .02)
    c = TL['crack']
    for k in range(6):
        m.put(tick(m, 7000 + k * 400), c + k * TL['crackD'] / 6, .07)
    m.put(beep(5200, .06), c, .05)
    m.put(whoosh(m, .6, 4000, 600), c, .05)
    s = TL['seal']
    for k, n in enumerate([62, 66, 69, 74, 78, 81, 86]):
        m.put(bell(hz(n), 1.2, 2.0, 1.0), s + k * TL['sealD'] / 7, .06)
    m.put(bell(hz(74), 2.5, 3.5, 1.2), s + TL['sealD'] + .1, .1)
