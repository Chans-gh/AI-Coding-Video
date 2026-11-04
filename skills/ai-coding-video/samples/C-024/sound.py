"""C-024 装饰艺术：两扇门打开时一阵低沉的风声和一记重响，
接着是爵士味的行走低音和摇摆踩镲，灯泡全亮时一组铜管味的钟声和弦。"""
from synth import whoosh, impact, pluck, hat, bell, hz


def score(m):
    m.put(whoosh(m, .8, 150, 900), .1, .35)                               # 开门
    m.put(impact(m), .9, .45)
    for k, n in enumerate([41, 45, 48, 50, 51, 50, 48, 45]):              # 行走低音
        m.put(pluck(hz(n), .34, bright=900), k * .375, .5)
    for b in range(8):
        m.put(hat(m), b * .375 + .25, .14, pan=.3)
    for k, n in enumerate([65, 69, 72, 76]):
        m.put(bell(hz(n), 1.2, ratio=2.0, index=1.6), 2.4 + k * .02, .18)
