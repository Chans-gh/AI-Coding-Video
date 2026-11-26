"""G-029 文字闪切：CC0 紧张电子配乐 + 节拍字卡高频金属敲击与钟表滴答 + 甩头瞬间硬静默"""
from pathlib import Path
from synth import assets, impact, tick


def score(m):
    assets(m, Path(__file__).parent, music=0.52)
    # 闪切字卡落地与时钟滴答
    for t in [0.36, 0.96, 1.54, 2.16, 7.60, 7.98, 8.30, 8.56]:
        m.put(impact(m), t, 0.28)
    for k in range(7):
        m.put(tick(m, 2800), 2.4 + k * 0.4, 0.35)
    # 甩头落地重击
    m.put(impact(m), 6.26, 0.45)
    m.put(tick(m, 3400), 6.26, 0.30)
