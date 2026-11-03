"""C-064 终端 ASCII：开机闷响和 CRT 嗡嗡声，打字时一串按键声，
低音合成器按 160 BPM 的八分音符跳动，进度条走满时“哔”一声。"""
from synth import hum, thud, saw, beep, filt, hz, tt
import numpy as np


def key(m):
    """一次按键：中频带通噪声，很短"""
    t = tt(.03)
    f = 1200 + 900 * m.rng.random()
    return filt(m.noise(.03), "band", [f, f * 2.2]) * np.exp(-t / .006)


def score(m):
    m.put(thud(m, .6), 0, .5)                                          # 开机
    m.put(hum(60, m.dur + .5), 0, .08)                                 # CRT 电源声
    k = 0
    while k / 47 < 1.6:                                                # 打字声，约每秒 47 下
        m.put(key(m), k / 47 + .004 * m.rng.random(), .35 + .2 * m.rng.random(), pan=m.rng.uniform(-.3, .3))
        k += 1
    beat = 60 / 160
    for b in range(int(m.dur / (beat / 2))):                           # 低音八分音符
        n = [33, 33, 45, 33, 36, 33, 43, 31][b % 8]
        m.put(saw(hz(n), beat / 2 - .03, 500), b * beat / 2, .3)
    m.put(beep(1760, .12), 2.8, .25)                                   # 进度 100%
