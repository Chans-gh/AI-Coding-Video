"""C-112 电视新闻包装：新闻片头式的定音鼓点和铜管和弦，台标缩成角标时一声扫频；
目录每行出现一个短促的提示音，翻牌价格板每翻一格一声咔哒，折线画完一声钟，结尾每打一个勾一声确认音。"""
from synth import kick, impact, tick, beep, bell, pad, saw, whoosh, hat, hz


def score(m):
    beat = 60 / 120
    m.put(impact(m), 0, .55)                                           # 片头重音
    m.put(saw(hz(43), 1.6, 900), 0, .2)
    m.put(pad([hz(55), hz(62), hz(67), hz(71)], 1.5, cutoff=2200, a=.02), 0, .14)
    m.put(whoosh(m, .5, 400, 4000), .75, .2)                           # 缩成角标
    for k in range(10):                                                # 新闻鼓点
        tt0 = .5 + k * beat
        m.put(kick(m), tt0, .45 if k % 2 == 0 else .3)
        m.put(hat(m), tt0 + beat / 2, .12, pan=.3)
    for i in range(3):                                                 # 目录逐行
        m.put(beep(1320, .05), 1.1 + i * .1, .15, pan=-.3)
    for i in range(4):                                                 # 翻牌
        m.put(tick(m, 2400), 2.15 + i * .09 + .2, .4, pan=-.4 + i * .25)
    m.put(bell(hz(79), 1.2, ratio=2.0, index=1.5), 2.85, .2)            # 折线到顶
    m.put(whoosh(m, .3, 800, 3000), 3.0, .12)                          # 字条翻转
    for i in range(3):                                                 # 打勾
        m.put(beep(880 * (1.26 ** i), .09), 3.95 + i * .25, .22)
    m.put(whoosh(m, .3, 800, 3000), 4.2, .12)
    m.put(pad([hz(55), hz(62), hz(67), hz(74)], .9, cutoff=2400, a=.01), 4.6, .14)
    m.put(impact(m), 4.6, .3)
