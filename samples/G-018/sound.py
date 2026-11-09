"""G-018 双人播客声波：照 assets.json 摆旁白、配乐，金句卡和片尾加两个合成音效"""
from pathlib import Path
from synth import assets, whoosh, bell, hz

HERE = Path(__file__).parent


def score(m):
    assets(m, HERE)                       # 旁白按 at 放；配乐铺底，说话时压低
    m.put(whoosh(m, .8), 0, .2)
    m.put(bell(hz(81), 2.0), 13.4, .2)              # 片尾落节目名
