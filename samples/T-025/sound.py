"""T-025 曲线变速卡点混剪：太空氛围铺底、两段加速冲刺鼓点重击与急停高音铃"""
from synth import pad, kick, tick, bell, hz


def score(m):
    m.put(pad([hz(41), hz(48), hz(53)], m.dur, cutoff=950), 0.0, .22)
    for k in range(16):
        m.put(tick(m, 1800), 0.4 + k * 0.48, .13)
    for t_peak, note in [(2.0, 77), (4.6, 81), (7.0, 84)]:
        m.put(kick(m), t_peak, .48)
        m.put(bell(hz(note), 0.9), t_peak + 0.01, .22)
