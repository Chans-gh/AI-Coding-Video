"""C-121 电影预告片：一层低沉的弦乐式铺底和慢慢起伏的低频；每张字卡亮起时一声低音“咚”加远处的回响钟，
片名前一段上升的嘶声，片名落下时一记重击（底鼓 + 冲击 + 低频）后长长的余音。"""
from synth import pad, drone, thud, bell, riser, impact, kick, hz


def score(m):
    m.put(pad([hz(38), hz(45), hz(50)], 5.0, cutoff=600, a=1.2, rel=1.5), 0, .2)
    m.put(drone(hz(26), 5.0, wobble=.4), 0, .18)
    for t0 in (.1, 1.6):
        m.put(thud(m, 1.2), t0, .55)
        m.put(bell(hz(69), 2.5, ratio=1.41, index=.8), t0 + .05, .07)
    m.put(riser(m, .8), 2.45, .22)
    m.put(kick(m), 3.25, 1.0)
    m.put(impact(m), 3.25, .7)
    m.put(thud(m, 1.8), 3.25, .7)
    m.put(bell(hz(57), 3.0, ratio=1.41, index=1.0), 3.27, .12)
