"""G-014 虚构电竞集锦：两段画面自带的音效（随画面生成）按画面起点放，CC0 配乐铺底、原声响时压低；开场对阵卡一声冲击，转场一声呼啸，击杀提示各一声短提示音，定格前一段上升音、定格时一声重击"""
from pathlib import Path
from synth import assets, whoosh, riser, impact, beep, hz

FEED = [5.15, 9.05, 9.2, 9.35, 9.5]
FZ = 11.35


def score(m):
    assets(m, Path(__file__).parent, music=.42, duck=.35)
    m.put(whoosh(m, .5, 400, 5000), 0, .3)
    m.put(impact(m), .45, .4)
    m.put(whoosh(m, .6, 300, 6000), 5.95, .3)
    for i, k in enumerate(FEED):
        m.put(beep(hz(88 + min(i, 3) * 2), .07), k, .12)
    m.put(riser(m, 1.0), FZ - 1.0, .16)
    m.put(impact(m), FZ, .5)
    m.put(beep(hz(91), .12), FZ + .6, .14)
