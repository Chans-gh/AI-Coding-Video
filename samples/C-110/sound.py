"""C-110 电路板：全程一层 50 Hz 电源嗡鸣加一点高频电感啸叫；输入脉冲每条一声短促的电子“啾”，
到达主控时继电器咔哒两下，芯片处理时一串快速的数据滴答；三路输出各点亮一声不同音高的提示音。"""
from synth import hum, beep, tick, woodblock, impact, filt, hz


def score(m):
    m.put(hum(50, 5.0), 0, .14)
    m.put(filt(m.noise(5.0), 'band', [7000, 8600]) * .2, 0, .05)
    for k in range(6):
        m.put(beep(2600 + k * 120, .04), .25 + k * .1, .06, pan=-.6 + k * .1)
    for x in (1.2, 1.28):
        m.put(woodblock(3200, .03), x, .5)
        m.put(tick(m, 900), x, .4)
    for k in range(26):
        m.put(tick(m, 5200 if k % 3 else 3400), 1.5 + k * .06, .1, pan=((k % 5) - 2) * .2)
    m.put(woodblock(3000, .03), 3.0, .45)
    for k, n in enumerate((76, 79, 84)):
        m.put(beep(hz(n), .18), 3.85 + k * .15, .14, pan=-.3 + k * .3)
    m.put(impact(m), 3.85, .08)
