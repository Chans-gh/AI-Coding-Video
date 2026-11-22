"""G-021 伪监控录像：只用生成视频自带的环境声——实时段原样放，倒带时把原声倒着快放，回放时半速（音调跟着变低，像慢放的录像）"""
from pathlib import Path
import numpy as np
from synth import SR, assets, fade, load

HERE = Path(__file__).parent


def stretch(x, k):
    """按 k 倍拉长（变慢、变低），k < 1 变快"""
    n = int(len(x) * k)
    i = np.linspace(0, len(x) - 1, n)
    return np.stack([np.interp(i, np.arange(len(x)), x[:, c]) for c in range(2)], 1)


def score(m):
    assets(m, HERE)                                     # 原声 0–7.7 秒（assets.json 里 len 截到倒带前）
    raw = load(HERE / "assets/grill.mp3")
    rew = raw[int(1.6 * SR):int(7.6 * SR)][::-1]        # 倒带：6 秒倒着压进 0.4 秒
    m.put(fade(stretch(rew, .4 / 6), .02, .05), 7.6, .5)
    slow = raw[int(1.6 * SR):int(3.4 * SR)]             # 回放：半速
    m.put(fade(stretch(slow, 2.0), .05, .3), 8.0, .9)
