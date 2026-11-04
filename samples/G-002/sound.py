"""G-002 虚拟主播口播：旁白（青水公开音色）+ CC0 配乐；名牌滑入一声，问题卡、每张要点卡弹出各一声提示音"""
from pathlib import Path
from synth import assets, cue_time, beep, pluck, whoosh, hz


def score(m):
    a = assets(m, Path(__file__).parent, music=.26)
    m.put(whoosh(m, .5, 800, 3000), .1, .15)
    t = cue_time(a, "为什么")
    if t is not None:
        m.put(pluck(hz(76)), t, .25); m.put(pluck(hz(83)), t + .08, .2)
    for kw, n in (("一是", 79), ("二是", 84)):
        t = cue_time(a, kw)
        if t is not None:
            m.put(beep(hz(n), .1), t, .16)
