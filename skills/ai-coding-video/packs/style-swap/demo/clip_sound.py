"""分镜换画风风格包 15 秒切换片段的声音：语音合成的旁白（公开音色）+ CC0 配乐，照 assets.json 摆好；三种画风共用同一条声音。"""
from pathlib import Path
from synth import assets


def score(m):
    assets(m, Path(__file__).parent, music=.3, use="clip")
