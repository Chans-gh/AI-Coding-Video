"""完整演示片的声音：读和画面同一张分段表 segments.json，每段按部件放 sound_kit 里对应的音；铺底按章起伏。
各个时刻（第几步、第几根柱子、数字砸下）照 pack.js 里部件的默认节奏算，改了 segments.json 的 start、every 这里自动跟着变。"""
import json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import sound_kit as S

BEAT = .375


def score(m):
    plan = json.loads((HERE / "segments.json").read_text(encoding="utf-8"))
    at, ch, marks = 0.0, None, []
    for g in plan["segs"]:
        p, o, d = g["part"], g.get("o", {}), g["d"]
        if p == "chapter":
            ch = o["n"] - 1
        marks.append((at, at + d, None if p in ("title", "outro") else ch, p == "chapter"))
        {"edge": S.transition, "push": S.push, "fade": S.dissolve}.get(g.get("tr"), lambda m, t: None)(m, at)
        st, every = o.get("start", .5), o.get("every", BEAT * 2)
        if p == "title":
            S.title_in(m, at)
        elif p == "chapter":
            S.chapter_in(m, at)
        elif p == "explain":
            for i in range(len(o["steps"])):
                S.step_in(m, at + st + i * every, i)
        elif p == "code":
            t0, cps = at + o.get("start", .5), o.get("cps", 26)
            for line in o["lines"]:
                S.typing(m, t0, len(line), cps)
                t0 += (len(line) + 4) / cps
        elif p == "device":
            S.progress(m, at + o.get("start", .6), o.get("secs", 3.6))
        elif p == "data":
            S.bars_in(m, at + .35, len(o["bars"]), BEAT)
            S.number_in(m, at + o["big"].get("start", 1.3))
        elif p == "line":
            S.line_in(m, at + o.get("start", .4), o.get("secs", 1.8), len(o["values"]))
        elif p == "compare":
            S.card_in(m, at + .15)
            S.card_in(m, at + 1.05, hot=True)
        elif p == "bigNumber":
            S.number_in(m, at + o.get("start", .3) + .15)
        elif p == "ring":
            S.ring_in(m, at + o.get("start", .3), len(o["items"]))
        elif p == "quote":
            S.quote_in(m, at + o.get("start", .4))
        elif p in ("list", "timeline"):
            for i in range(len(o.get("items") or o.get("steps"))):
                S.step_in(m, at + st + i * every, i)
        elif p == "outro":
            S.outro_in(m, at, at + .9 + len(o["recap"]) * BEAT * 2 + .2)
        for v in g.get("over", []):
            {"callout": S.callout_in, "lower": S.lower_in}[v["part"]](m, at + v["at"])
        at += d
    S.bed_chapters(m, marks, BEAT)
