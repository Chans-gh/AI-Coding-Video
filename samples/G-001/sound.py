"""G-001 纸拼贴讲解：旁白（语音合成的公开音色）+ CC0 配乐；章鱼落下一声风声，每贴一张纸、圈一笔放一个短促的纸片声"""
from pathlib import Path
from synth import assets, cue_time, whoosh, tick, woodblock


def score(m):
    a = assets(m, Path(__file__).parent, music=.3)
    m.put(whoosh(m, .9, 400, 2400), .1, .35)
    for kw, g in (("三颗", .3), ("鳃", .3), ("全身", .3), ("蓝色", .25)):
        t = cue_time(a, kw)
        if t is not None:
            m.put(tick(m, 2200), t, g)
            m.put(woodblock(700, .12), t + .05, .12)
    t = cue_time(a, "血蓝蛋白")
    if t is not None:
        for i in range(4):
            m.put(woodblock(520 + i * 90, .14), t + i * .12, .22)
