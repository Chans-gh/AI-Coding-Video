"""C-172 萤火光尘：一直在叫的虫鸣（高频短促的颤音一串串），轻柔的钢琴几个音慢慢落下，光点聚成字时多一个高音。"""
import numpy as np
from synth import filt, hz, tt


def chirp(m, f, n=4):
    """一声虫鸣：几下极短的高频脉冲"""
    out = np.zeros(int(.03 * n * 1.4 * 44100) + 2000)
    for k in range(n):
        t = tt(.018)
        x = np.sin(2 * np.pi * f * t) * np.sin(np.pi * t / .018)
        i = int(k * .03 * 44100)
        out[i:i + len(x)] += x
    return out


def piano(f, d=2.5):
    """柔和的钢琴音：几个泛音，高泛音衰减快"""
    t = tt(d)
    x = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (1.2 + k * 1.1)) / k for k in range(1, 6))
    return x * np.minimum(1, t / .004)


def score(m):
    m.put(filt(m.noise(m.dur + .5), "band", [2000, 6000]), 0, .02)          # 夜里的空气声
    for side, f0 in ((-.6, 4300), (.5, 5100), (.1, 3800)):
        t = m.rng.uniform(0, .3)
        while t < m.dur:
            m.put(chirp(m, f0 * (1 + .02 * m.rng.random()), 3 + int(m.rng.random() * 3)), t, .1, side)
            t += .32 + .25 * m.rng.random()
    for t, n in ((.1, 76), (.9, 72), (1.6, 69), (2.0, 79), (2.4, 84), (3.2, 72)):
        m.put(piano(hz(n), 2.8), t, .3, m.rng.uniform(-.3, .3))
    m.put(piano(hz(60), 3.5), .1, .25)
