"""G-030 黑白漫画分格：CC0 热血快节奏配乐 + 分格切入木鱼敲击 + 8.2-10.5s 静默「間」呼吸段落"""
from pathlib import Path
import numpy as np
from synth import SR, assets, impact, tick, woodblock


def score(m):
    assets(m, Path(__file__).parent, music=0.50)
    # 8.2–10.35s 静默「間」格：压低配乐至近乎静默（留轻柔底息）
    i0, i1 = int(8.2 * SR), int(10.35 * SR)
    ramp = np.ones(len(m.buf))
    fade_s = int(0.12 * SR)
    ramp[i0:i1] = 0.08
    ramp[max(0, i0 - fade_s):i0] = np.linspace(1.0, 0.08, fade_s)
    ramp[i1:min(len(m.buf), i1 + fade_s)] = np.linspace(0.08, 1.0, min(fade_s, len(m.buf) - i1))
    m.buf *= ramp[:, None]
    for t in [0.0, 0.8, 1.4, 2.6, 3.05, 6.2, 6.6, 7.0, 7.4, 7.8]:
        m.put(woodblock(960, 0.14), t, 0.26)
    for t in [1.55, 3.25, 7.40]:
        m.put(impact(m), t, 0.28)
    # 落针一声极清脆的高频微响
    m.put(tick(m, 4200), 8.65, 0.18)
