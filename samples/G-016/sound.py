"""G-016 分镜表短片：CC0 配乐铺底、旁白响时压低；分镜表四格落下各一声轻响，放大进第一镜一声呼啸，之后每次切镜一声轻呼啸，落版一声钟"""
import json
from pathlib import Path
from synth import assets, whoosh, tick, bell, hz

HERE = Path(__file__).parent
SHEET, END = 2.6, 13.2
STARTS = ["落进", "顺着", "天亮"]      # 和 scene.js 的 SHOTS 一样：按旁白字幕找切镜的时刻


def score(m):
    assets(m, HERE, music=.45, duck=.4)
    for i in range(4):
        m.put(tick(m), .3 + i * .22, .14)
    m.put(whoosh(m, .8, 300, 4000), SHEET - .9, .16)
    vo = next(i for i in json.loads((HERE / "assets.json").read_text(encoding="utf-8"))["items"] if i["kind"] == "语音合成")
    for w in STARTS:
        t0 = vo["at"] + next(l["t0"] for l in vo["lines"] if l["text"].startswith(w)) - .15
        m.put(whoosh(m, .4, 500, 3000), t0 - .2, .08)
    m.put(bell(hz(74), 2.5), END, .2)
