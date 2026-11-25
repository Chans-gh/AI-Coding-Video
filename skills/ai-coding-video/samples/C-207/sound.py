"""C-207 聊天气泡与 AI 对话剧场：柔和氛围铺底、消息弹出清脆提示音与结尾打字声"""
from synth import pad, tick, beep, pluck, bell, hz


def score(m):
    m.put(pad([hz(48), hz(55), hz(60)], 4.5, cutoff=950), 0.0, .20)
    for t, note in [(0.35, 72), (1.05, 67), (1.85, 76), (2.75, 72), (3.35, 79)]:
        m.put(pluck(hz(note), 0.25), t, .22)
        m.put(bell(hz(note + 7), 0.4), t + 0.04, .12)
    for k in range(8):
        m.put(tick(m, 2200 + k * 60), 3.78 + k * 0.07, .12)
