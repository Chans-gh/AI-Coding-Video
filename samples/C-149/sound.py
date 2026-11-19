"""C-149 早期光线追踪 CGI：老电脑的嗡声和硬盘般的细碎滴答垫底；线框阶段每出现一个球一声方波短音，扫描渲染时一串逐行上升的电子音和持续的扫声，渲染完成时一声明亮的合成和弦。"""
from synth import hum, tick, square, beep, pad, whoosh, bell, hz


def score(m):
    m.put(hum(60, 5.0), 0, .05)
    for k in range(40):
        m.put(tick(m, 2500 + (k * 37) % 900), k * .12 + .03, .04)
    for i in range(5):
        m.put(square(hz(60 + i * 3), .12, .4, .08), .25 + i * .18, .07)
    for k in range(16):
        m.put(beep(400 + k * 70, .05), 1.5 + k * .118, .05)
    m.put(whoosh(m, 1.9, 300, 4000), 1.5, .05)
    m.put(pad([hz(55), hz(62), hz(67), hz(71)], 1.6, 2200, .02, 1.0), 3.4, .16)
    m.put(bell(hz(79), 1.4, 3.0, .8), 3.4, .07)
