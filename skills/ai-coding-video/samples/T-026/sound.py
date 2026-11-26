"""T-026 视觉调查：平陆运河 Kokoro 纪实旁白 + CC0 低沉调查配乐 + 定格快门/倒带/秒表/划线确认音"""
from pathlib import Path
from synth import assets, beep, tick, whoosh, woodblock


def score(m):
    assets(m, Path(__file__).parent, music=0.25, duck=0.55, voice=0.95)
    # 0.75s 实拍白闪定格（快门 + 提示蜂鸣）
    m.put(woodblock(1180, 0.08), 0.75, 0.28)
    m.put(beep(1320, 0.07), 0.77, 0.18)
    # 1.95s 倒带冷开场扫频
    m.put(whoosh(m, 0.45, 1600, 320), 1.95, 0.20)
    # 2.6–10.8s 调查事件秒表每 0.5s 轻滴答
    for k in range(17):
        t = 2.6 + k * 0.5
        m.put(tick(m, 2500 if k % 2 == 0 else 2050), t, 0.14 if k % 2 == 0 else 0.09)
    # 4.7s 照片硬切快门
    m.put(woodblock(980, 0.06), 4.70, 0.20)
    # 7.2s & 8.0s 纸面荧光红划线与交叉锁定双蜂鸣
    for t in [7.20, 8.05]:
        m.put(beep(1320, 0.08), t, 0.18)
        m.put(beep(1320, 0.08), t + 0.12, 0.14)
    # 11.0s / 11.18s / 11.36s 三条已核实 ✓ 徽章落地音
    for i, t in enumerate([11.0, 11.18, 11.36]):
        m.put(woodblock(1040 + i * 120, 0.09), t, 0.22)
