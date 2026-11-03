"""C-039 等距信息图：传送带一直轻轻咔嗒作响，四个工位的标注弹出时各一声提示音，
底部小人图标出现时一串短促的点击，底下一层干净的铺底。"""
from synth import tick, beep, pad, hz


def score(m):
    m.put(pad([hz(60), hz(67), hz(72)], m.dur, 1500, a=.4), 0, .16)
    for k in range(18):
        m.put(tick(m, 1800), k / 6, .08, pan=-.2)
    for d, f in [(.1, 880), (.6, 988), (1.1, 1175), (1.6, 1319)]:
        m.put(beep(f, .12), d + .1, .25)
    for k in range(8):
        m.put(tick(m, 4000), 1.95 + k * .08, .2, pan=-.5 + k * .14)
