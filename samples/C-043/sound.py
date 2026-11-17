"""C-043 说明书 / 步骤图：每个零件弹出时一声木鱼，腿插进座板时一声闷响加短促的嗒，
拧螺丝时一串咔哒，警告框弹出时两声方波提示，每步完成一声确认音。"""
from synth import woodblock, thud, tick, square, beep, pad, hz


def score(m):
    m.put(pad([hz(60), hz(67), hz(72)], 5.0, cutoff=900, a=.5), 0, .07)
    for i in range(3):                                  # 第 1 步：零件
        m.put(woodblock(700 + i * 150, .15), .1 + i * .25, .4, pan=-.4 + i * .4)
    m.put(beep(1320, .1), 1.2, .2)
    m.put(thud(m, .4), 1.6 + .95, .5)                   # 第 2 步：插腿到位
    m.put(woodblock(420, .2), 1.6 + .95, .3)
    m.put(beep(1320, .1), 1.6 + 1.2, .2)
    for k in range(14):                                 # 第 3 步：拧螺丝
        m.put(tick(m, 2200 + (k % 3) * 300), 3.3 + k * .045, .22, pan=(k % 2) * .4 - .2)
    for k in range(2):
        m.put(square(hz(76 - k * 5), .12, dec=.06), 3.75 + k * .14, .2)
    m.put(beep(1320, .1), 4.7, .2)
    m.put(beep(1760, .14), 4.8, .2)
