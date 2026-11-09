"""T-020 对局复盘：CC0 配乐；每次击杀一声重击加高音提示，暂停批注时一声咔哒，滑块划过一声扫频，落版一声钟"""
from pathlib import Path
from synth import assets, impact, beep, tick, whoosh, bell, hz

KILLS = [40, 58, 63, 70, 78]          # 对局秒，和 match.py 一致


def vt(k):
    """对局秒 → 视频秒（和 scene.js 的 vt 一样）"""
    return 1 + k / 40 * 3.2 if k <= 40 else 8.4 + (k - 40) / 50 * 3.6


def score(m):
    assets(m, Path(__file__).parent, music=.36)
    m.put(whoosh(m, .9, 200, 2500), .1, .25)
    for k in KILLS:
        m.put(impact(m), vt(k), .3)
        m.put(beep(1400, .07), vt(k) + .02, .12)
    m.put(tick(m, 2600), 4.3, .3)
    m.put(whoosh(m, 1.2, 600, 5000), 5.6, .25)
    m.put(tick(m, 2600), 8.35, .25)
    m.put(bell(hz(79), 2.0), 12.1, .2)
