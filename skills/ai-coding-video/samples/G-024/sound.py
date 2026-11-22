"""G-024 首尾帧变装卡点：只有 CC0 配乐，切点按 beats.py 从这首曲子算出的节拍排"""
from pathlib import Path
from synth import assets


def score(m):
    assets(m, Path(__file__).parent, music=.8)
