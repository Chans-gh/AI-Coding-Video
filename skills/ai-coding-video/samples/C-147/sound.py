"""C-147 波普艺术：硬朗的底鼓和拍手按 120 拍每分钟走，思考泡弹出一声短促的“嘟”，
拟声字“叮！”配一声明亮的铃，闪电劈开时一记重击加白噪声，四宫格每次换色一声方波短音，“找到了！”时再一记重击。"""
from synth import kick, clap, hat, impact, bell, square, beep, hz


def score(m):
    for i in range(8):
        m.put(kick(m), i * .5, .5)
        if i % 2: m.put(clap(m), i * .5, .3)
        m.put(hat(m), i * .5 + .25, .12)
    m.put(beep(hz(72), .1), .15, .1)
    m.put(bell(hz(96), 1.0, 3.5, 1.5), .9, .2)
    m.put(impact(m), 1.5, .5)
    m.put(m.noise(.25), 1.5, .08)
    for i in range(8):
        m.put(square(hz([60, 64, 67, 72][i % 4]), .1), 2 + i * .25, .07, pan=-.4 + (i % 4) * .27)
    m.put(impact(m), 3.0, .4)
