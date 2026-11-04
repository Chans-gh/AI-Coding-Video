"""T-006 轨道 MV：整首用 CC0 配乐，不加别的声音"""
from pathlib import Path
from synth import assets


def score(m):
    assets(m, Path(__file__).parent, music=1.0)
