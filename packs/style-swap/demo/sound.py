"""完整演示片的声音：读和画面同一张分镜表 segments.json。CC0 配乐从第一拍起铺满全片（segments.json 的 music_ss 已在截取时去掉，
第 0 秒落在拍上），每个转场一种转场音，每个整屏部件进场一个音、每个叠加部件出现一个音，都是 CC0 音效（assets/sfx/，出处见 assets.json）。
没有旁白，也不用 synth.py 的电子音；三种画风共用同一条声音。音效的时刻照 pack.js 里部件的节奏：多数在进场那一下，按条目出的部件跟着再轻点几下。"""
import json
from pathlib import Path
from synth import SR, load, fade

HERE = Path(__file__).resolve().parent
SFX = HERE / "assets" / "sfx"
# 按条目出的部件：(条目在 o 里的键, 第一条的时刻, 间隔；None 取 o.every)，和 pack.js 的节奏一致；其余部件进场响一下
ITEMS = {"slam": ("words", 0, None), "flash": ("imgs", 0, None), "grid": ("imgs", .25, .09), "stack": ("imgs", 0, .28),
         "checklist": ("items", .4, .2), "lineup": ("img", .2, .24)}
AT = {"typing": .1, "qa": None, "reveal": 0, "flip": .2}       # 进场音不在 0.05 秒的：qa 在翻卡时刻 o.at
_cache = {}


def sfx(name):
    if name not in _cache:
        _cache[name] = fade(load(SFX / f"{name}.mp3"), 0, .02)
    return _cache[name]


def score(m):
    plan = json.loads((HERE / "segments.json").read_text(encoding="utf-8"))
    at = 0.0
    music = load(HERE / "assets" / "music_full.mp3", 0, m.dur + .1)
    music = fade(music, .05, 2.5)[: int(m.dur * SR)]
    m.put(music, 0, .6)
    pan = lambda i: ((i * 7) % 5 - 2) * .15
    for i, g in enumerate(plan["segs"]):
        p, o, d = g["part"], g.get("o", {}), g["d"]
        if g.get("tr"):
            m.put(sfx(f"tr_{g['tr']}"), at, .5, pan(i))
        if p in ITEMS:                                   # 每出一条响一次，第一条最响
            key, t0, step = ITEMS[p]
            n = 3 if key == "img" else len(o[key])
            step = step or o.get("every", plan["beat"])
            for k in range(n):
                t = at + t0 + k * step
                if t < at + d - .1:
                    m.put(sfx(p), t, .7 if k == 0 else .4, pan(i + k))
        else:
            t0 = o.get("at", .7) if p == "qa" else AT.get(p, .05)
            m.put(sfx(p), at + t0, .7, pan(i + 1))
        for v in g.get("over", []):
            m.put(sfx(v["part"]), at + v["at"], .55, pan(i + 3))
        at += d
