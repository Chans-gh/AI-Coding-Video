"""T-004 倒计时分屏：CC0 配乐打底；每秒一声倒计时提示音，归零一声重击"""
from pathlib import Path
from synth import assets, beep, impact, riser


def score(m):
    assets(m, Path(__file__).parent, music=.55)
    for i in range(5):
        m.put(beep(880, .09), i + .0, .18)
    m.put(riser(m, 1.0), 4.0, .15)
    m.put(impact(m), 5.0, .5)
    m.put(impact(m), 12.6, .25)
