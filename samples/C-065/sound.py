"""C-065 科幻 HUD：开机时一阵上扬的噪声，雷达扫过亮点时一声短促的“滴”，
锁定框收紧时提示音越来越快，锁定后两声交替的警示音。"""
from synth import riser, beep, drone, hz


def score(m):
    m.put(riser(m, .6), 0, .3)
    m.put(drone(hz(33), m.dur, .3), 0, .2)
    t, gap = .4, .28
    while t < 1.8:                                                        # 锁定中
        m.put(beep(1760, .05), t, .2); t += gap; gap = max(.07, gap * .78)
    for k in range(4):                                                    # 锁定
        m.put(beep(988 if k % 2 == 0 else 1319, .12), 1.85 + k * .16, .28)
    for d in (.9, 2.6):
        m.put(beep(2637, .04), d, .12, pan=.4)
