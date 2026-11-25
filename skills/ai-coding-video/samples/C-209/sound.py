"""C-209 系统架构与工作流脉冲图：节点激活脉冲、故障超时告警双音与降级恢复和弦"""
from synth import pad, tick, beep, pluck, bell, hz


def score(m):
    m.put(pad([hz(43), hz(50), hz(55)], 4.5, cutoff=900), 0.0, .20)
    for t, note in [(0.25, 67), (0.85, 72), (1.55, 76)]:
        m.put(pluck(hz(note), 0.22), t, .20)
    # Timeout warning double beep
    m.put(beep(440, 0.10), 2.05, .24)
    m.put(beep(370, 0.12), 2.19, .22)
    # Recovery + stream complete
    m.put(pluck(hz(74), 0.30), 2.38, .20)
    for idx, note in enumerate([72, 76, 79]):
        m.put(bell(hz(note), 0.8), 3.15 + idx * 0.05, .18)
