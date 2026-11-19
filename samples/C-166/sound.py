"""C-166 60 年代液体灯光秀：迷幻摇滚的味道——慢慢摇摆的风琴式长音、拨弦低音和带回声的拍手，每两拍的重拍一记底鼓和一圈「嗡」的涟漪声；灯熄灭的一瞬所有声音一起掉下去，亮起时一下咔哒和回来的和弦。"""
from synth import drone, pad, pluck, kick, clap, tick, whoosh, bell, hz


def score(m):
    b = .375
    m.put(drone(hz(43), 5.0, .5), 0, .1)
    for bar, ch in enumerate([[55, 59, 62, 66], [53, 57, 60, 64], [55, 59, 62, 66], [52, 55, 59, 62]]):
        if bar == 2:
            continue
        m.put(pad([hz(n) for n in ch], 1.45, 1100, .2, .5), bar * 1.5, .1)
    m.put(pad([hz(55), hz(59), hz(62), hz(66)], 1.4, 1100, .02, .6), 2.8, .12)
    bass = [43, 43, 50, 48, 41, 41, 48, 46, 43, 43, 50, 48, 40]
    for k in range(13):
        tt_ = k * b
        if 2.6 < tt_ < 2.78 or 4.2 < tt_ < 4.3:
            continue
        m.put(pluck(hz(bass[k]), .3, 900), tt_, .18)
        if k % 2 == 0:
            m.put(kick(m), tt_, .45)
            m.put(whoosh(m, .6, 600, 200), tt_, .05)
        else:
            m.put(clap(m), tt_, .16)
            m.put(clap(m), tt_ + .12, .06)
    m.put(tick(m, 1800), 2.78, .3)
    m.put(tick(m, 1800), 4.3, .3)
    m.put(bell(hz(74), 1.5, 3.5, 1.5), .75, .05)
    m.put(bell(hz(78), 1.5, 3.5, 1.5), 3.0, .05)
