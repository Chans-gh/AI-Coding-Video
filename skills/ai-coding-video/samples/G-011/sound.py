"""G-011 体育集锦：CC0 配乐 + 一层观众声；慢放时声音往下沉，定格一声快门加重击，扣进时重击、蜂鸣器和观众欢呼涌上来，收尾一声镲"""
from pathlib import Path
from synth import assets, filt, fade, impact, whoosh, beep, riser, hz


def crowd(m, d, bright=2500):
    return fade(filt(m.noise(d), "band", (300, bright)), .3, .6)


def score(m):
    assets(m, Path(__file__).parent, music=.42)
    m.put(crowd(m, 2.4), 0, .18)
    m.put(whoosh(m, 1.2, 1500, 200), 2.1, .3)
    m.put(filt(crowd(m, 3.1), "low", 600), 2.2, .16)
    m.put(fade(filt(m.noise(.06), "high", 3000), .002, .05), 5.3, .4)
    m.put(impact(m), 5.3, .5)
    m.put(riser(m, .8), 6.25, .2)
    m.put(impact(m), 7.7, .8)
    m.put(beep(hz(72), .6), 7.75, .18)
    m.put(crowd(m, 3.0, 4000), 7.7, .45)
    m.put(whoosh(m, .6, 300, 5000), 8.55, .3)
    m.put(fade(filt(m.noise(1.6), "high", 5000), .005, 1.4), 8.7, .25)
