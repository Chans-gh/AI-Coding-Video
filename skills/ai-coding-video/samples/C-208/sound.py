"""C-208 SaaS 功能发布与光标聚焦演示：现代科技铺底、点击反馈、指标刷新与发布成功和弦"""
from synth import pad, tick, beep, pluck, bell, hz


def score(m):
    m.put(pad([hz(45), hz(52), hz(57)], 4.5, cutoff=1100), 0.0, .22)
    m.put(tick(m, 2600), 1.48, .28)
    m.put(beep(1240, 0.08), 1.50, .18)
    for t, note in [(2.25, 72), (2.47, 76), (2.69, 79)]:
        m.put(pluck(hz(note), 0.22), t, .18)
    for idx, note in enumerate([72, 76, 79, 84]):
        m.put(bell(hz(note), 0.85), 3.15 + idx * 0.05, .18)
