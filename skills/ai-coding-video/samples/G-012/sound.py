"""G-012 绘本翻页：旁白（青水公开音色）+ CC0 配乐；每次翻页一声纸页翻动，结尾「完」一声轻铃"""
from pathlib import Path
from synth import assets, cue_time, filt, fade, bell, hz


def flip(m):
    return fade(filt(m.noise(.45), "band", (700, 5000)), .08, .3)


def score(m):
    a = assets(m, Path(__file__).parent, music=.3)
    for kw in ("下雨啦", "雨停了"):
        t = cue_time(a, kw)
        if t is not None:
            m.put(flip(m), t - .55, .35)
    t = cue_time(a, "彩虹")
    if t is not None:
        m.put(bell(hz(88), 2.2), t + 1.0, .2)
