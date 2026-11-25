"""T-023 实拍物体追踪呼出标注：雷达锁定提示音、参数展开轻响与低频空间铺底"""
from synth import pad, tick, beep, pluck, bell, hz


def score(m):
    m.put(pad([hz(43), hz(50), hz(55)], m.dur, cutoff=900), 0.0, .20)
    m.put(beep(1320, 0.06), 0.25, .20)
    m.put(beep(1760, 0.08), 0.58, .24)
    m.put(pluck(hz(76), 0.3), 0.65, .18)
    for k in range(16):
        m.put(tick(m, 2200), 0.9 + k * 0.45, .10)
    m.put(bell(hz(81), 1.0), 6.8, .16)
