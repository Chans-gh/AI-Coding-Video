"""T-017 体操骨骼示范：CC0 芯片音乐铺底；片头擦除一声呼啸，骨骼出现一声提示音，每数到一次一声短促的提示音（按 pose.json 的计数时刻），结尾小结一声重击"""
import json
from pathlib import Path
from synth import assets, whoosh, beep, impact, hz

HERE = Path(__file__).parent


def score(m):
    assets(m, HERE, music=.4, duck=0)
    P = json.loads((HERE / "assets" / "pose.json").read_text(encoding="utf-8"))
    m.put(whoosh(m, .9, 300, 4000), .6, .3)
    m.put(beep(hz(84), .1), 1.3, .15)
    for i, r in enumerate(P["reps"]):
        m.put(beep(hz(88 + (i % 2) * 3), .09), r, .2)
    m.put(impact(m), 10.9, .35)
