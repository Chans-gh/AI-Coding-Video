"""完整演示片的声音：读和画面同一张分镜表 segments.json。CC0 配乐从第一拍起铺满全片（segments.json 的 music_ss 已在截取时去掉，
第 0 秒落在拍上），每个转场一种转场音，每个整屏部件进场一个音、每个叠加部件出现一个音，都是 CC0 音效（assets/sfx/，出处见 assets.json）。
没有旁白，也不用 synth.py 的电子音。音效的时刻照 pack.js 里部件的节奏：多数在进场那一下，按拍出条目的部件跟着拍再轻点几下。"""
import json
from pathlib import Path
from synth import SR, load, fade

HERE = Path(__file__).resolve().parent
SFX = HERE / "assets" / "sfx"
# 整屏部件 → 进场音（文件名）；写成四项的是按条目出的部件：(音, 条目在 o 里的键, 第一条的时刻, 间隔；None 取 o.every 或一拍)，和 pack.js 的节奏一致
PART = {
    "coldOpen": "cold", "slam": ("slam", "words", .05, None), "points": ("flash", "items", 0, None), "crawl": "crawl", "chapter": "chapter",
    "story": "story", "compare": "compare", "satZoom": "zoom", "archive": "archive", "mapPin": ("pin", "pins", .5, None), "sourceFrame": "frame",
    "split": "split", "strip": ("strip", "photos", .1, .16), "bigNumber": "number", "bars": "bars", "line": "line", "ring": "ring", "rank": "rank",
    "heatMap": "heat", "flip": "flip", "table": "table", "delta": "delta", "versus": "versus", "thresholds": "threshold",
    "quote": "quote", "timeline": "timeline", "checklist": ("check", "items", .45, .22), "qa": "qa", "relation": "relation", "glossary": "glossary",
    "factCheck": "stamp", "proCon": "procon", "sources": "sources", "reading": "reading", "outro": "outro",
}
OVER = {"bracket": "bracket", "circle": "circle", "nameplate": "nameplate", "label": "tagin", "credit": "credit"}
_cache = {}


def sfx(name):
    if name not in _cache:
        _cache[name] = fade(load(SFX / f"{name}.mp3"), 0, .02)
    return _cache[name]


def score(m):
    plan = json.loads((HERE / "segments.json").read_text(encoding="utf-8"))
    beat, at = plan["beat"], 0.0
    music = load(HERE / "assets" / "music_full.mp3", 0, m.dur + .1)
    music = fade(music, .05, 2.5)[: int(m.dur * SR)]
    m.put(music, 0, .55)
    pan = lambda i: ((i * 7) % 5 - 2) * .15
    for i, g in enumerate(plan["segs"]):
        p, o, d = g["part"], g.get("o", {}), g["d"]
        if g.get("tr"):
            m.put(sfx(f"tr_{g['tr']}"), at, .5, pan(i))
        spec = PART[p]
        if isinstance(spec, str):
            m.put(sfx(spec), at + (o.get("at", .7) if p == "factCheck" else .05), .7, pan(i + 1))
        else:                                            # 每出一条响一次，第一条最响
            name, key, t0, step = spec
            step = step or o.get("every", beat)
            for k in range(len(o[key])):
                t = at + t0 + k * step
                if t < at + d - .1:
                    m.put(sfx(name), t, .7 if k == 0 else .4, pan(i + k))
        for v in g.get("over", []):
            m.put(sfx(OVER[v["part"]]), at + v["at"], .55, pan(i + 3))
        at += d
