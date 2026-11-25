"""G-025 实拍产品 AI 换景重打光：高端商片氛围铺底、扫光切入提示与光影流转和弦"""
from synth import pad, kick, pluck, bell, hz


def score(m):
    m.put(pad([hz(43), hz(50), hz(55)], m.dur, cutoff=1000), 0.0, .22)
    m.put(kick(m), 1.60, .36)
    m.put(bell(hz(74), 1.1), 1.62, .20)
    m.put(pluck(hz(79), 0.35), 3.10, .20)
    m.put(bell(hz(81), 1.2), 5.60, .18)
