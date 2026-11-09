"""G-017 情景安全演练：旁白（公开音色）+ CC0 配乐，说话时配乐压低；圈出隐患时一声提示，选错一声低音，答对一声叮，整改图划入一声扫频"""
from pathlib import Path
from synth import assets, cue_time, beep, square, bell, whoosh, hz


def score(m):
    a = assets(m, Path(__file__).parent, music=.32)
    for kw in ("电线横穿", "纸箱"):
        m.put(beep(880, .12), cue_time(a, kw, 3) + .1, .25)
    m.put(square(hz(43), .35, .5), cue_time(a, "不对", 9.2), .16)
    m.put(bell(hz(84), 1.2), cue_time(a, "先报告", 10.4), .2)
    m.put(whoosh(m, 1.1, 400, 4000), 12.3, .25)
    m.put(bell(hz(79), 1.8), 13.2, .2)
