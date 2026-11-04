"""T-005 默片重剪：CC0 钢琴配乐，底下垫一层放映机的咔哒声；「轰」那张字幕卡上一声重击"""
from pathlib import Path
from synth import assets, tick, impact


def score(m):
    assets(m, Path(__file__).parent, music=.8)
    for i in range(int(15 * 12)):
        m.put(tick(m, 2500), i / 12, .025, (-1) ** i * .2)
    m.put(impact(m), 4.4, .45)
