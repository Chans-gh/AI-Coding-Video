"""G-007 插画新闻：旁白（青水公开音色）+ CC0 配乐；开场新闻提示音，换要点时色块扫过一声风声，每条降温办法打勾一声"""
from pathlib import Path
from synth import assets, cue_time, beep, whoosh, hz


def score(m):
    a = assets(m, Path(__file__).parent, music=.26)
    m.put(beep(hz(84), .12), 0, .14); m.put(beep(hz(91), .18), .14, .14)
    for kw in ("这叫", "柏油", "多种树"):
        t = cue_time(a, kw)
        if t is not None:
            m.put(whoosh(m, .7, 400, 3500), t - .5, .22)
    for kw in ("多种树", "屋顶", "浅色"):
        t = cue_time(a, kw)
        if t is not None:
            m.put(beep(hz(88), .07), t + .1, .14)
