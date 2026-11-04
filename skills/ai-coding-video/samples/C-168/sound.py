"""C-168 字雨：低频电子嗡鸣铺底，细碎的数据咔哒声随机落下，隐藏的词亮起前一段上扬噪声，亮起时一声低沉的钟。"""
from synth import drone, tick, riser, bell, filt, hz, tt
import numpy as np


def score(m):
    d = m.dur + .5
    m.put(filt(drone(hz(33), d, .25), "low", 300), 0, .55)               # 低频嗡鸣
    m.put(filt(drone(hz(45), d, .4), "low", 500), 0, .25, -.3)
    hiss = filt(m.noise(d), "band", [3000, 9000]) * (.5 + .5 * np.sin(2 * np.pi * 3 * tt(d)) ** 2)
    m.put(hiss, 0, .04)
    for k in range(70):                                                    # 数据咔哒声
        m.put(tick(m, 4000 + 3000 * m.rng.random()), m.rng.uniform(0, m.dur), .08 + .1 * m.rng.random(), m.rng.uniform(-.8, .8))
    m.put(riser(m, 1.0), .85, .25)
    m.put(bell(hz(45), 2.0, 1.41, 1.2), 1.8, .45)                        # 词亮起
    m.put(bell(hz(57), 1.6, 2.0, .8), 1.8, .2, .3)
