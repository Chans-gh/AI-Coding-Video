"""G-005 动漫短剧：旁白（语音合成的公开音色）+ CC0 配乐 + 代码合成的雨声；放大那一格一声冲击加风声，对白气泡一声轻响，片名一声钟"""
from pathlib import Path
from synth import assets, filt, impact, whoosh, bell, beep, hz


def score(m):
    assets(m, Path(__file__).parent, music=.3)
    r = filt(m.noise(m.dur), "band", [1500, 7000]) * .08         # 雨声：带通噪声铺底，片尾稍弱
    m.put(r, 0, .5)
    m.put(whoosh(m, .6, 300, 2500), 3.2, .3)
    m.put(impact(m), 3.7, .25)
    m.put(beep(hz(84), .08), 5.65, .12)
    m.put(whoosh(m, .5, 600, 2000), 7.8, .15)
    m.put(bell(hz(64), 3.0), 10.7, .16)
