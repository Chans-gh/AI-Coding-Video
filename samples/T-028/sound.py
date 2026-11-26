"""T-028 字幕新闻：Kokoro 利落资讯旁白 + CC0 新闻律动配乐 + 第4帧重击与计数器清脆节拍"""
from pathlib import Path
from synth import assets, beep, impact, tick


def score(m):
    assets(m, Path(__file__).parent, music=0.28, duck=0.48, voice=0.95)
    # 第4帧（0.13s）巨型数字 23 砸下
    m.put(impact(m), 0.13, 0.34)
    # 大字块砸入 / 账本对比 / 赛跑计数器滴答
    for t in [2.4, 5.6, 9.2]:
        m.put(beep(1180, 0.08), t, 0.16)
    for k in range(10):
        m.put(tick(m, 3000), 6.0 + k * 0.18, 0.15)
