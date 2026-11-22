"""C-059 分屏“跑酷 + 讲解”：140 BPM 的轻快跑酷节拍（底鼓、反拍踩镲、方波琶音），每吃一枚金币一声高音铃，两次起跳各一声上扬的呼啸、落地一声闷响；讲解每亮出一项（标题、公式、曲线、结论）一声柔和的提示音。"""
from synth import kick, hat, thud, whoosh, bell, beep, square, pad, hz


def score(m):
    beat = 60 / 140
    m.put(pad([hz(60), hz(64), hz(67)], m.dur, 1800, .6, 1.0), 0, .08)
    arp = [72, 76, 79, 84, 79, 76, 74, 77]
    n = int(m.dur / beat * 2)
    for i in range(n):
        t0 = i * beat / 2
        if i % 2 == 0:
            m.put(kick(m), t0, .3)
        else:
            m.put(hat(m), t0, .06, .25)
        m.put(square(hz(arp[i % 8]), beat * .4), t0, .05, -.3)
    for k in range(40):                     # 金币：和 scene.js 的 .4 + k*.12 对齐，跳跃时段没吃到的也算吃到
        t0 = .4 + k * .12 + .02
        if t0 < m.dur:
            m.put(bell(hz(96 + (k % 3) * 2), .25), t0, .04, .4)
    for j in (1.2, 3.1):
        m.put(whoosh(m, .4, 600, 3000), j, .12)
        m.put(thud(m), j + .8, .3)
    for t0 in (.2, .7, 1.1, 3.9):
        m.put(beep(hz(88), .15), t0, .08, -.4)
