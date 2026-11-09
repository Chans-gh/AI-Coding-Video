"""G-020 拉伸跟练：照 assets.json 摆旁白、配乐，再加几个合成音效"""
from pathlib import Path
from synth import assets, whoosh


def score(m):
    assets(m, Path(__file__).parent)      # 旁白、原声按 at 放；配乐铺底，说话时压低
    m.put(whoosh(m, .8), 0, .2)
