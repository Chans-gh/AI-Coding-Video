"""完整演示片的声音：读和画面同一张分镜表 segments.json，每段按部件放 sound_kit 里对应的音；铺底按章换和弦，节拍贯穿全片，章节卡和片尾歇拍。
各个时刻（第几条、第几根柱子、数字砸下）照 pack.js 里部件的默认节奏算，改了 segments.json 的 start、every、secs 这里自动跟着变。"""
import json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import sound_kit as S

BEAT = .375


def term(m, T, o):
    """终端：和 pack.js 的 terminal() 用同一套时刻推算"""
    at, cps = o.get("start", .1), o.get("cps", 60)
    for l in o["lines"]:
        if "cmd" in l:
            S.typing(m, T(at), len(l["cmd"]), cps); at += len(l["cmd"]) / cps + .08
        elif "bar" in l:
            S.progress(m, T(at), l.get("secs", .4), 6); at += l.get("secs", .4)
        else:
            S.pop_in(m, T(at), 2); at += .12


def code(m, T, o):
    t0, cps = o.get("start", .5), o.get("cps", 26)
    for line in o["lines"]:
        S.typing(m, T(t0), len(line), cps); t0 += (len(line) + 4) / cps


def flip(m, T, o):
    st, fd, k = o.get("start", .15), o.get("flip", .05), 0
    for i, c in enumerate(o["value"]):
        if c.isdigit():
            for j in range(0, int(c) + 10, 2):
                S.clack(m, T(st + i * .06 + j * fd), j)
            k += 1
    S.stamp_in(m, T(st + (k - 1) * .06 + 19 * fd))          # 最后一格翻定


def each(fn, key, every=None, start=.1, dt=0.0):
    def f(m, T, o):
        for i in range(len(o[key])):
            fn(m, T(o.get("start", start) + i * o.get("every", every) + dt), i)
    return f


PARTS = {
    "coldOpen": lambda m, T, o: S.cold_open(m, T(0)),
    "slam": lambda m, T, o: [S.slam_hit(m, T(o.get("start", .05) + i * o.get("every", .12) + .16), i) for i, c in enumerate(o["text"]) if c != " "],
    "flash": lambda m, T, o: [S.flash_hit(m, T(i * o.get("every", BEAT)), i) for i in range(len(o["words"]))],
    "marquee": lambda m, T, o: S.swish(m, T(0), 1.2, .16),
    "chapter": lambda m, T, o: S.chapter_in(m, T(0)),
    "search": lambda m, T, o: (S.typing(m, T(o.get("start", .2)), len(o["query"]), o.get("cps", 18)),
                               [S.pop_in(m, T(o.get("start", .2) + len(o["query"]) / o.get("cps", 18) + i * .08), i) for i in range(len(o.get("chips", [])))]),
    "chat": each(S.pop_in, "msgs", .55, .15),
    "code": code,
    "terminal": term,
    "flow": each(S.step_in, "nodes", .3),
    "devices": lambda m, T, o: (S.card_in(m, T(0)), S.card_in(m, T(.1)), S.progress(m, T(o.get("start", .2)), o.get("secs", 1.3), 8)),
    "magnify": lambda m, T, o: (S.swish(m, T(o.get("start", .1) + .2), .5, .12), S.quote_in(m, T(o.get("start", .1) + .7))),
    "toast": each(S.pop_in, "items", .3, .15),
    "data": lambda m, T, o: S.bars_in(m, T(.35), len(o["bars"]), o.get("every", BEAT)),
    "bigNumber": lambda m, T, o: S.number_in(m, T(o.get("start", .3) + .15)),
    "flipboard": flip,
    "gauge": lambda m, T, o: (S.swish(m, T(o.get("start", .15)), .5, .12), S.card_in(m, T(o.get("start", .15) + o.get("secs", .8) * .6), hot=True)),
    "compare": lambda m, T, o: (S.card_in(m, T(o.get("start", .15))), S.card_in(m, T(o.get("start", .15) + o.get("lag", .9)), hot=True)),
    "race": lambda m, T, o: (S.swish(m, T(o.get("start", .1)), 1.0, .12), S.quote_in(m, T(o.get("start", .1) + o.get("secs", 1.4)))),
    "strike": lambda m, T, o: (S.swish(m, T(o.get("start", .25)), .3, .18), S.flash_tr(m, T(o.get("start", .25) + .5))),
    "line": lambda m, T, o: S.line_in(m, T(o.get("start", .4)), o.get("secs", 1.8), len(o["values"])),
    "dotmap": each(S.pop_in, "cities", .09, .1, .35),
    "heat": lambda m, T, o: [S.clack(m, T(o.get("start", .1) + c / o.get("weeks", 26) * o.get("secs", .9)), c) for c in range(0, o.get("weeks", 26), 2)],
    "ring": lambda m, T, o: S.ring_in(m, T(o.get("start", .3)), len(o["items"]), o.get("every", .45)),
    "scatter": lambda m, T, o: ([S.pop_in(m, T(o.get("start", .1) + i * .03), i, .08) for i in range(0, o.get("n", 18), 3)],
                                S.card_in(m, T(o.get("start", .1) + o.get("n", 18) * .03 + .1), hot=True)),
    "funnel": lambda m, T, o: [S.card_in(m, T(o.get("start", .1) + i * o.get("every", .18))) for i in range(len(o["steps"]))],
    "radar": lambda m, T, o: (S.swish(m, T(o.get("start", .15)), .4, .12), S.quote_in(m, T(o.get("start", .15) + .5))),
    "quote": lambda m, T, o: S.quote_in(m, T(o.get("start", .4))),
    "mindmap": each(S.step_in, "branches", .1, .15, .2),
    "grid": each(lambda m, t, i: S.clack(m, t + .2, i), "items", .08),
    "table": lambda m, T, o: [S.clack(m, T(o.get("start", .15) + k * o.get("every", .035)), k)
                              for k in range(0, len(o["rows"]) * len(o["cols"]), 2)],
    "venn": lambda m, T, o: (S.swish(m, T(o.get("start", .1)), .5, .14), S.card_in(m, T(o.get("start", .1) + .55), hot=True)),
    "stack": lambda m, T, o: [S.swish(m, T(o.get("start", .25) + i * o.get("every", .4)), .3, .16, (-1) ** i * .3) for i in range(len(o["cards"]) - 1)],
    "qa": lambda m, T, o: (S.flip_tr(m, T(o.get("flip", .55))), S.quote_in(m, T(o.get("flip", .55) + .35))),
    "bilingual": lambda m, T, o: (S.swish(m, T(.05), .4, .14, -.4), S.swish(m, T(.4), .4, .12, .4)),
    "reveal": lambda m, T, o: (S.zoom_tr(m, T(0)), S.quote_in(m, T(.5))),
    "timeline": each(S.step_in, "steps", .36, .5),
    "plans": lambda m, T, o: [S.card_in(m, T(o.get("start", .1) + i * o.get("every", .12)), hot=bool(p.get("hot"))) for i, p in enumerate(o["plans"])],
    "priceTag": lambda m, T, o: (S.swish(m, T(0), .3, .14), S.tag_in(m, T(.3))),
    "outro": lambda m, T, o: S.outro_in(m, T(0), T(.9 + len(o["recap"]) * o.get("every", BEAT * 2) + .2)),
}
OVER = {"callout": lambda m, t, o: S.callout_in(m, t), "lower": lambda m, t, o: S.lower_in(m, t),
        "scribble": lambda m, t, o: S.swish(m, t, .4, .12), "stamp": lambda m, t, o: S.stamp_in(m, t + .14),
        "cursor": lambda m, t, o: S.click(m, t + o.get("click", .45))}
TRANS = {"edge": S.transition, "push": S.push, "fade": S.dissolve, "zoom": S.zoom_tr, "wipe": S.wipe_tr, "flash": S.flash_tr, "flip": S.flip_tr}


def score(m):
    plan = json.loads((HERE / "segments.json").read_text(encoding="utf-8"))
    at, ch, marks = 0.0, None, []
    for g in plan["segs"]:
        p, o, d, sp = g["part"], g.get("o", {}), g["d"], g.get("speed", 1)
        if p == "chapter":
            ch = o["n"] - 1
        marks.append((at, at + d, ch, p in ("chapter", "outro")))
        if g.get("tr") in TRANS:
            TRANS[g["tr"]](m, at)
        T = lambda x, at=at, sp=sp: at + x / sp
        PARTS[p](m, T, o)
        for v in g.get("over", []):
            OVER[v["part"]](m, T(v["at"]), v.get("o", {}))
        at += d
    S.bed_chapters(m, marks, BEAT)
