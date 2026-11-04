"""G-008 伪纪录片：旁白（语音合成的公开音色）+ CC0 配乐；底下一层低频的风声，鹤群起飞时一串纸翅膀扑扇声"""
from pathlib import Path
from synth import assets, cue_time, filt, whoosh, fade


def score(m):
    a = assets(m, Path(__file__).parent, music=.24)
    wind = filt(m.noise(13.5), "low", 500) * .5
    m.put(fade(wind, 1.0, 1.5), 0, .12)
    t = cue_time(a, "然后一起")
    if t is not None:
        for i in range(14):
            d = .08 + .04 * (i % 3)
            m.put(fade(filt(m.noise(d), "band", (1800, 5200)), .005, d * .7), t - .3 + i * .17 + .03 * (i % 2), .16 - i * .007)
        m.put(whoosh(m, 1.4, 300, 2500), t - .4, .2)
