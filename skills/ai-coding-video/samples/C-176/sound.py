"""C-176 老胶片：放映机每秒 18 下的嗒嗒声和马达嗡嗡声贯穿始终，一段走音的八音盒小旋律，结尾换卷时片尾哗啦啦甩过、最后一声“啪”。"""
import numpy as np
from synth import tick, hum, bell, thud, filt, hz, tt


def score(m):
    d = m.dur + .5
    m.put(filt(hum(48, d), "low", 600), 0, .12)
    m.put(filt(m.noise(d), "band", [300, 2500]), 0, .05)
    for k in range(int(m.dur * 18)):                                      # 放映机
        m.put(tick(m, 1500), k / 18 + .003 * m.rng.random(), .22 if k % 2 else .3)
    mel = [(0, 79), (.4, 76), (.8, 72), (1.2, 74), (1.6, 76), (2.0, 79), (2.4, 81), (2.75, 79)]
    for t, n in mel:                                                       # 八音盒，音高有点飘
        m.put(bell(hz(n) * (1 + .006 * np.sin(t * 5)), 1.0, 4.0, .7), t, .2)
    for k in range(18):                                                    # 换卷：片尾甩过
        m.put(tick(m, 900), 3.0 + k * .028, .4)
    m.put(thud(m, .4), 3.5, .35)
