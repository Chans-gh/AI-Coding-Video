"""C-027 拼贴：每拍一张纸“拍”上去，就是一记闷响加一声拍手，
落下前带一点纸张的沙沙声，最后画箭头时一阵马克笔声。"""
from synth import thud, clap, kick, filt
import numpy as np


def score(m):
    beat = 60 / 160
    for k in range(8):
        t0 = k * beat
        m.put(filt(m.noise(.06), "band", [3000, 8000]) * np.linspace(0, 1, int(.06 * 44100)), t0 - .06 if k else 0, .2)
        m.put(thud(m, .3), t0, .5)
        m.put(clap(m), t0, .3, pan=(-1) ** k * .3)
        if k % 2 == 0:
            m.put(kick(m), t0, .35)
    m.put(filt(m.noise(.3), "band", [1500, 4000]), 6 * beat, .15)         # 马克笔
