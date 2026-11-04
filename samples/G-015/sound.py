"""G-015 三维产品展台：CC0 配乐铺底；花瓶升起一声呼啸，上釉线走的那三秒一段上升音，三条参数标注各一声轻响，落版一声钟"""
from pathlib import Path
from synth import assets, whoosh, riser, tick, bell, hz


def score(m):
    assets(m, Path(__file__).parent, music=.5)
    m.put(whoosh(m, .9, 300, 3000), .1, .18)
    m.put(riser(m, 3.0), 1.6, .1)
    for i in range(3):
        m.put(tick(m), 5.6 + i * .2, .16)
    m.put(bell(hz(76), 2.5), 9.0, .22)
