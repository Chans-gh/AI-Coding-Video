"""C-081 三渲二 3D 动漫：明亮的流行编曲——拍手和底鼓的轻快节拍、拨音弹的大调琶音、长音铺底；标题弹出时（0.3 秒）一声上扬的扫频和铃声，任务框出现时两声提示音；主角的脚步是轻轻的滴答，结尾一声开阔的钟。"""
from synth import kick, clap, hat, pluck, pad, bell, beep, whoosh, tick, hz


def score(m):
    beat = 60 / 128
    m.put(pad([hz(60), hz(64), hz(67), hz(72)], m.dur, 2200, .3, 1.0), 0, .1)
    arp = [72, 76, 79, 84, 79, 76]
    for i in range(int(m.dur / (beat / 2))):
        t0 = i * beat / 2
        m.put(pluck(hz(arp[i % 6] - (5 if (i // 8) % 2 else 0)), .3, 4500), t0, .1, .3 if i % 2 else -.3)
        if i % 2 == 0:
            m.put(kick(m) if (i // 2) % 2 == 0 else clap(m), t0, .28)
        m.put(hat(m), t0 + beat / 4, .05)
    m.put(whoosh(m, .8, 500, 5000), .2, .2)
    m.put(bell(hz(88), 1.4), .6, .1)
    m.put(beep(1320, .07), .8, .1)
    m.put(beep(1760, .09), .9, .1)
    for k in range(14):
        m.put(tick(m, 2000), .15 + k * .449 / 1.25, .05, -.2 if k % 2 else .2)
    m.put(bell(hz(84), 2.0), 4.0, .14)
