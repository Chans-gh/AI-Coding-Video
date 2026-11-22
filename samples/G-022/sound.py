"""G-022 玻璃水果 ASMR 切割：只用两段生成视频自带的切割声。按 scene.js 的同一张时间表摆：原速段原样放，慢放段按 1/0.35 拉长（音调跟着变低，像高速摄影的慢放），段与段之间短交叉淡化"""
from pathlib import Path
import numpy as np
from synth import SR, fade, load

HERE = Path(__file__).parent
SEGS = [
    (0, 1.4, "kiwi", .5, 1), (1.4, 4.26, "kiwi", 1.9, .35), (4.26, 6.0, "kiwi", 2.9, 1),
    (6.0, 8.0, "apple", .5, 1), (8.0, 10.29, "apple", 2.5, .35), (10.29, 12.0, "apple", 3.3, 1),
]


def stretch(x, k):
    n = int(len(x) * k)
    i = np.linspace(0, len(x) - 1, n)
    return np.stack([np.interp(i, np.arange(len(x)), x[:, c]) for c in range(2)], 1)


def score(m):
    raw = {k: load(HERE / f"assets/{k}.mp3") for k in ("kiwi", "apple")}
    for t0, t1, k, v0, r in SEGS:
        need = (t1 - t0) * r + .04                      # 素材里要用多长（多取一点做交叉淡化）
        x = raw[k][int(v0 * SR):int((v0 + need) * SR)]
        if r != 1:
            x = stretch(x, 1 / r)
        m.put(fade(x, .02, .04), t0, 1.0)
    m.put(fade(raw["kiwi"][int(.5 * SR):int(1.0 * SR)], .45, .05), 12.0, 1.0)   # 片尾接回片头的声音，循环时不断
