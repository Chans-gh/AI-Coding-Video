"""G-023 水果拟人小剧场：旁白（语音合成）按 at 放，CC0 配乐铺底、说话时压低"""
from pathlib import Path
from synth import assets


def score(m):
    assets(m, Path(__file__).parent, music=.28)
