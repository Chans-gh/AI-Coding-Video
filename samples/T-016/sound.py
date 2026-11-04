"""T-016 访谈金句竖屏：照 edit.json 的剪辑表把原声一段段接起来（每段两头 15 毫秒淡入淡出，接缝不爆音），CC0 配乐压低铺底；片头划词时几声轻咔哒，成品开始一声呼啸"""
import json
from pathlib import Path
from synth import assets, fade, load, tick, whoosh

HERE = Path(__file__).parent
T0 = 2.8


def score(m):
    assets(m, HERE, music=.22, duck=0)          # 原声在 assets.json 里 gain 为 0：这里按剪辑表摆
    E = json.loads((HERE / "assets" / "edit.json").read_text(encoding="utf-8"))
    at = T0
    for a, b in E["cuts"]:
        x = load(HERE / "assets" / "talk.mp3", a, b - a)
        m.put(fade(x, .015, .015), at, 1.0)
        at += b - a
    for k in range(3):
        m.put(tick(m, 2200), .5 + k * .45, .18)
    m.put(whoosh(m, .5, 300, 3000), T0 - .3, .22)
