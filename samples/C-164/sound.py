"""C-164 车厢珐琅彩绘：集市手风琴一样的方波和弦按 160 拍一下下推，拨弦奏一段民间小调；每亮一盏灯一声小铃，2 秒彩带打成结时一声轻扫，4 秒松开再扫一下。"""
from synth import square, pluck, bell, whoosh, hz


def score(m):
    b = .375
    chords = [[55, 59, 62], [55, 59, 62], [50, 54, 57], [55, 59, 62]]
    for k in range(13):
        for n in chords[(k // 4) % 4]:
            m.put(square(hz(n), .18, duty=.3, dec=6), k * b + (b / 2 if k % 2 else 0), .035)
    tune = [67, 71, 74, 72, 71, 69, 67, 69, 71, 67, 66, 67]
    for i, n in enumerate(tune):
        m.put(pluck(hz(n), .3, 3000), .2 + i * b, .2, pan=.2)
    for i in range(12):                                                  # 灯
        m.put(bell(hz(84 + (i % 6) * 2), .9, ratio=2.0, index=.7), .3 + i * b, .05, pan=-.6 + (i % 6) * .24)
    m.put(whoosh(m, .9, 600, 3000), 1.0, .14)
    m.put(whoosh(m, .9, 3000, 600), 3.5, .14)
