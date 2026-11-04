"""T-013 发射多机位同步：CC0 配乐；多机位段跟着切换用当时那一路的现场声音（按 sync.json 的时差取同一时刻），切换处一声短促的咔哒；轨迹段只剩配乐和一声上扬"""
import json
from pathlib import Path
from synth import assets, fade, load, tick, riser, whoosh

HERE = Path(__file__).parent
CUT = [(3.2, "closeup"), (6.4, "tower"), (8.8, "wide"), (10.6, None)]
M0 = 7.0


def score(m):
    assets(m, HERE, music=.34, duck=0)          # 原声在 assets.json 里 gain 为 0：这里按机位自己摆
    sy = json.loads((HERE / "assets" / "sync.json").read_text(encoding="utf-8"))
    for (a, key), (b, _) in zip(CUT, CUT[1:]):
        ss = (a - M0) + sy["t0"] + sy["views"][key]["offset"]   # 这一路素材里对应的秒数
        x = load(HERE / "assets" / f"{key}.mp3", ss, b - a + .15)
        m.put(fade(x, .03, .12), a, .85)
        m.put(tick(m, 2500), a, .25)
    m.put(whoosh(m, .7, 300, 2500), 2.7, .25)
    m.put(riser(m, 1.2), 10.3, .18)
