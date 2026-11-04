"""T-001 数据实体化：旁白（语音合成的公开音色）+ CC0 配乐，说话时配乐自动压低；方柱长完时一声轻钟"""
from pathlib import Path
from synth import assets, bell, hz


def score(m):
    assets(m, Path(__file__).parent, music=.3)
    m.put(bell(hz(76), 2.0), 12.0, .05)
