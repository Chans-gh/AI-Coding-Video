"""T-018 照片深景推镜：CC0 配乐铺底；标题从山后升起时一声低沉的长音和风声，深度图扫光两次各一声呼啸，落版一声钟"""
from pathlib import Path
from synth import assets, whoosh, drone, bell, fade, hz

HERE = Path(__file__).parent


def score(m):
    assets(m, HERE, music=.55, duck=0)
    m.put(fade(drone(hz(38), 3.0), .8, 1.2), 4.1, .22)
    m.put(whoosh(m, 2.0, 200, 1200), 4.0, .14)
    m.put(whoosh(m, .8, 300, 3000), 7.2, .2)
    m.put(whoosh(m, .6, 3000, 300), 8.6, .18)
    m.put(bell(hz(76), 2.5), 10.1, .14)
