"""C-066 代码编辑器叙事：bug 一路窜时细碎的芯片音快速爬行，光标每扑一次一声点击和下扫的方波，
背景一层电脑风扇式的低嗡；结尾整屏暗下时一声长的下滑，最后 bug 叫一声。"""
from synth import square, tick, hum, whoosh, beep, hz


def score(m):
    m.put(hum(110, 5.0), 0, .05)
    for k in range(40):
        m.put(square(hz(84 + (k * 7) % 12), .03, dec=.02), .1 + k * .1, .06, pan=-.5 + (k % 10) / 10)
    for k in range(6):
        tc = .9 + k * .65
        m.put(tick(m, 1800), tc, .5)
        m.put(square(hz(60 - k), .12, dec=.08), tc + .02, .12)
    m.put(whoosh(m, .9, 1500, 120), 4.0, .25)
    m.put(beep(2400, .05), 4.7, .15)
    m.put(beep(3000, .05), 4.78, .15)
