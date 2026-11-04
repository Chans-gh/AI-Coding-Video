"""G-010 手账 vlog：旁白（青水公开音色）+ CC0 lofi 配乐；照片落下一声纸响，盖章各一声闷响"""
from pathlib import Path
from synth import assets, cue_time, thud, filt, fade


def paper(m):
    return fade(filt(m.noise(.25), "band", (900, 6000)), .005, .2)


def score(m):
    a = assets(m, Path(__file__).parent, music=.3)
    m.put(paper(m), .05, .3)
    t = cue_time(a, "晚上去")
    if t is not None:
        m.put(paper(m), t - .15, .3)
    for kw, d in (("早上", .3), ("整条街", 0)):
        t = cue_time(a, kw)
        if t is not None:
            m.put(thud(m, .3), t + d + .2, .5)
    t = cue_time(a, "整条街")
    if t is not None:
        m.put(thud(m, .45), t + 2, .7)
