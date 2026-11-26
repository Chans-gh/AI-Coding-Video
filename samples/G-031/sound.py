"""G-031 搞笑历史卡通：Kokoro 诙谐男声旁白 + CC0 轻快拨弦配乐 + 剪纸咔嚓、拍贴啪响、铜钉弹跳音效"""
from pathlib import Path
from synth import assets, clap, tick, woodblock


def score(m):
    assets(m, Path(__file__).parent, music=0.28, duck=0.52, voice=0.95)
    # 角色跳步木鱼声（12fps 纸偶跳入）
    for t in [0.15, 0.35, 0.55, 2.25, 2.45]:
        m.put(woodblock(1120, 0.09), t, 0.25)
    # 三张乱码纸贴拍入（2.6 / 3.1 / 3.6s）
    for t in [2.6, 3.1, 3.6]:
        m.put(clap(m), t, 0.30)
    # 剪刀双响剪地图（5.2s / 5.7s / 6.2s）
    for t in [5.2, 5.7, 6.2]:
        m.put(tick(m, 3800), t, 0.32)
        m.put(tick(m, 4400), t + 0.08, 0.28)
    # 拍下统一 1.00m 大红边纸贴重响
    m.put(clap(m), 7.65, 0.42)
    m.put(woodblock(680, 0.16), 7.66, 0.32)
