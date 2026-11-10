"""整支的配乐和音效：第 1 段课上成片自带的电子音 + 一首 CC0 配乐。旁白不在这里：samples/tools/film.py 照 timing.json 摆，说话时把这里的声音整体压低约 9 dB。
film.py 调 score(m, T)：m 是整支的 synth.Mix，T = {"dur", "segments": [{"seg", "start", "dur", "vo"}]}（见 film.py 开头）。
第 1 段放成片原声（由本仓库的 synth.py 合成，见 lesson/sound.py）；配乐先垫在空间站录像底下，短片进来时淡出，短片收尾时再接上、垫到结尾，结尾淡出。
"""
from pathlib import Path

import numpy as np
from synth import SR, fade, load

MUSIC = .26


def score(m, T):
    S = T["segments"]
    a = Path(__file__).resolve().parent / "assets"
    tS = S[0]["start"] + S[0]["vo"][2]["at"] - .3                      # 第 1 段：短片的起点，和 segments/01.js 同一个算法
    short = fade(load(a / "C-038-16x9.mp4"), .02, 1.0)                 # 课上成片的原声
    m.put(short, tS, .8)
    src = load(a / "dl" / "lofi.mp3")

    def music(t0, t1, fin, fout):
        n = int((t1 - t0) * SR)
        x = fade(src[np.arange(n) % len(src)], fin, fout)              # 不够长就循环
        m.put(x, t0, MUSIC)
    music(S[0]["start"], tS + .6, 1.0, 1.0)                            # 空间站录像底下垫着，短片进来时淡出
    music(tS + 14.0, T["dur"], 2.0, 3.0)                               # 短片收尾时接上，垫到结尾
