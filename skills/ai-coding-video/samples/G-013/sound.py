"""G-013 食谱动效卡：旁白（语音合成的公开音色）+ CC0 配乐，说话时配乐压低；每个步骤图标描出来时一声轻快的拨音，结尾一声钟"""
import json
from pathlib import Path
from synth import assets, pluck, bell, hz

STEPS = ["番茄切块", "鸡蛋打散", "番茄炒出汁", "加盐"]


def at(a, kw):
    """旁白说到 kw 的时刻：在字幕行里按字数线性估计（和 lib.js 的 cueTime 一样）"""
    vo = next(i for i in a["items"] if i.get("lines"))
    for l in vo["lines"]:
        k = l["text"].find(kw)
        if k >= 0:
            return vo["at"] + l["t0"] + (l["t1"] - l["t0"]) * k / len(l["text"])


def score(m):
    a = assets(m, Path(__file__).parent, music=.38)
    for i, kw in enumerate(STEPS):
        m.put(pluck(hz(72 + i * 2), .3), at(a, kw) + .5, .25)
    m.put(bell(hz(84), 1.8), 12.6, .18)
