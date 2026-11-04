"""T-008 档案灯箱：旁白（语音合成的公开音色）+ CC0 配乐；换底片时一声轻的木质敲击，像把底片放到灯箱上"""
from pathlib import Path
from synth import assets, woodblock


def score(m):
    assets(m, Path(__file__).parent, music=.32)
    for t in (6.0, 9.9):
        m.put(woodblock(600, .12), t, .1)
