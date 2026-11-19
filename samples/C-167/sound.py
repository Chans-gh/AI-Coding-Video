"""C-167 热成像：寒夜里低低的风声和仪器的电子嗡声，脚步踩雪的闷响按人和狗的步点落下，每次呼气一小声气音；起风时风声变大、一道扫声跟着调色板扫过，读数刷新时有细小的滴答。"""
from synth import whoosh, hum, thud, tick, beep, drone, hz


def score(m):
    m.put(hum(50, 5.0), 0, .04)
    m.put(drone(hz(31), 5.0, .2), 0, .07)
    for k in range(9):
        m.put(whoosh(m, 1.2, 200, 700), k * .55, .03 + .06 * (k >= 4))
    for j in range(12):
        m.put(thud(m, .12), j * .42, .12)
    for j in range(20):
        m.put(tick(m, 900), j * .25, .03)
    for j in range(5):
        m.put(whoosh(m, .5, 1200, 3500), j * 1.1 + .2, .04)
    m.put(whoosh(m, 1.0, 400, 5000), 2.4, .1)
    for j in range(10):
        m.put(beep(2400, .02), j * .5 + .1, .03)
