"""T-002 口播剪辑：两段原声照 assets.json 摆放，CC0 配乐垫在下面，说话时压低"""
from pathlib import Path
from synth import assets


def score(m):
    assets(m, Path(__file__).parent, music=.22, duck=.6, voice=1.0)
