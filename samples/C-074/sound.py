"""C-074 风格化 3D 打斗：快节奏的鼓（底鼓、拍手、踩镲）和锯齿波低音；追逐时脚步滴答，起跳一声扫频，两次击中（1.55、3.75 秒）各是一记重击加噪声爆裂，定格的一瞬音乐压低；2.5 秒切到神殿时一声锣一样的钟和低沉长音，旋踢前一阵上扬的扫频。"""
from synth import kick, clap, hat, saw, impact, whoosh, riser, bell, drone, tick, filt, hz


def score(m):
    beat = 60 / 150
    bass = [40, 40, 43, 40, 45, 43, 40, 38]
    for i in range(int(m.dur / beat)):
        t0 = i * beat
        if abs(t0 - 1.55) < .1 or abs(t0 - 3.75) < .1:
            continue
        m.put(kick(m), t0, .3)
        if i % 2:
            m.put(clap(m), t0, .16)
        m.put(hat(m), t0 + beat / 2, .06)
        m.put(saw(hz(bass[i % 8]), beat * .6, 700), t0, .22)
    for k in range(8):
        m.put(tick(m, 2200), .1 + k * .14, .06, -.3 if k % 2 else .3)
    m.put(whoosh(m, .4, 500, 4000), 1.15, .25)
    for t0 in (1.55, 3.75):
        m.put(impact(m), t0, .7)
        m.put(filt(m.noise(.3), "high", 1500), t0, .35)
    m.put(bell(hz(45), 2.5, 1.4, 3), 2.5, .2)
    m.put(drone(hz(33), 2.5, .3), 2.5, .2)
    m.put(riser(m, .8), 2.9, .2)
    m.put(whoosh(m, .5, 300, 3500), 3.4, .25, .3)
