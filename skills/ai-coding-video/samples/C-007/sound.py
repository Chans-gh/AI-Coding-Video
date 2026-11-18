"""C-007 铅笔素描：一层很轻的长音铺底；起稿时几道长长的划纸声，排线时一串串短促的沙沙声越来越密，最后橡皮擦两下、落款一声轻响。"""
from synth import pad, whoosh, beep, hz, filt


def score(m):
    m.put(pad([hz(57), hz(64), hz(69)], m.dur, 900, a=1.0), 0, .12)
    for k in range(5):                                                   # 辅助线、轮廓：长划
        m.put(whoosh(m, .45, 1800, 4200), .05 + k * .22, .1, pan=-.3 + k * .15)
    t = 1.2
    while t < 4.3:                                                       # 排线：越往后越密
        d = .06 + m.rng.random() * .05
        m.put(whoosh(m, d, 2600, 6500), t, .07 + .05 * (t - 1.2) / 3, pan=m.rng.uniform(-.5, .5))
        t += .16 - .07 * (t - 1.2) / 3.1
    for k in range(2):                                                   # 橡皮
        m.put(filt(m.noise(.22), 'band', [500, 1600]), 4.15 + k * .14, .22)
    m.put(beep(hz(81), .5), 4.45, .08)
