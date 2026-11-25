"""C-211 产品多维横评对比卡：雷达图展开提示、参数逐行打勾与结尾编辑推荐盖章重音"""
from synth import pad, tick, pluck, bell, kick, hz


def score(m):
    m.put(pad([hz(47), hz(54), hz(59)], 4.5, cutoff=1000), 0.0, .20)
    m.put(pluck(hz(69), 0.30), 0.30, .18)
    m.put(pluck(hz(73), 0.30), 0.65, .20)
    for i in range(5):
        m.put(tick(m, 2000 + i * 120), 1.15 + i * 0.28, .18)
    m.put(kick(m), 3.25, .42)
    m.put(bell(hz(81), 1.1), 3.26, .22)
