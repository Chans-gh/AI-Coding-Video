"""T-027 立体地图解说：Kokoro 清晰解说旁白 + CC0 渐进纪录配乐 + 数据标柱点亮清脆提示音"""
from pathlib import Path
from synth import assets, beep, tick


def score(m):
    assets(m, Path(__file__).parent, music=0.26, duck=0.50, voice=0.95)
    # 航线点亮与船闸标柱逐级抬升提示音
    for t, f in [(3.6, 880), (4.4, 1046), (5.2, 1175), (7.6, 784), (8.3, 988), (9.0, 1175)]:
        m.put(beep(f, 0.08), t, 0.14)
    for t in [6.8, 10.2]:
        m.put(tick(m, 2400), t, 0.16)
