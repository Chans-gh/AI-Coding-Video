"""C-165 剧院彩绘布景：小剧场乐池的嘭–嚓伴奏（低音一下、和弦一下）托着一段拨弦小调；山被拉进来时两声长扫，树立起来各一记木鱼，2.3 秒鼓风机开动后一直有低低的风声和嗡嗡声，每翻一张歌词卡一声轻响。"""
from synth import thud, square, pluck, woodblock, whoosh, hum, tick, hz


def score(m):
    b = .375
    bass = [43, 50, 43, 50, 48, 55, 43, 50, 45, 52, 50, 57, 43, 50]
    for k in range(13):
        m.put(thud(m, .3), k * b, .25)
        m.put(square(hz(bass[k]), .25, duty=.4, dec=8), k * b, .09)
        for n in ([55, 59, 62] if (k // 2) % 2 == 0 else [54, 57, 60]):
            m.put(square(hz(n + 12), .15, duty=.25, dec=10), k * b + b / 2, .03)
    tune = [67, 69, 71, 74, 71, 69, 67, 64, 66, 67, 69, 71, 72]
    for i, n in enumerate(tune):
        m.put(pluck(hz(n), .32, 3500), .1 + i * b, .18, pan=.15)
    m.put(whoosh(m, 1.0, 300, 1200), .4, .12, pan=-.5)
    m.put(whoosh(m, 1.0, 300, 1200), .9, .12, pan=.5)
    m.put(woodblock(700), 1.75, .4, pan=-.5)
    m.put(woodblock(620), 2.1, .4, pan=.5)
    m.put(hum(110, 2.7), 2.3, .05, pan=.6)
    m.put(whoosh(m, 2.7, 400, 2500), 2.3, .1, pan=.4)
    for c in (1.25, 2.5, 3.75):
        m.put(tick(m, 2500), c, .18, pan=-.4)
