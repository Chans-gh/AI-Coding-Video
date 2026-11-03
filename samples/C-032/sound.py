"""C-032 孟菲斯：几何块一个个弹出来是一串“啵”的高音拨音，之后跟着节拍的底鼓和拍手，
标题砸下时一记重响。"""
from synth import pluck, kick, clap, hat, impact, hz


def score(m):
    for k, d in enumerate([0, .12, .24, .36, .48, .6]):
        m.put(pluck(hz(79 + k * 2), .2, bright=6000), d + .05, .35, pan=-.6 + k * .24)
    for b in range(8):
        m.put(kick(m), b * .375, .45)
        if b % 2:
            m.put(clap(m), b * .375, .3)
        m.put(hat(m), b * .375 + .1875, .12)
    m.put(impact(m), 1.1, .45)
