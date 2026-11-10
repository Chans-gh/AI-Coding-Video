"""整片的配乐和音效：synth.py 的轻电子铺底跨段连续，每段开头一声提示，P3 打勾时一声钟。旁白由整片工具照 timing.json 摆。"""
import synth


def score(m, T):
    seg = {s["seg"]: s for s in T["segments"]}
    end = T["dur"]
    t = 0.0
    while t < end:                                   # 两个和弦轮流，每 4 秒一换
        ch = [48, 55, 60, 64] if int(t / 4) % 2 == 0 else [45, 52, 57, 60]
        m.put(synth.pad([synth.hz(n) for n in ch], 4.6, cutoff=1100), t, .22)
        t += 4
    for s in T["segments"]:
        m.put(synth.beep(1320, .07), s["start"] + .15, .12)
    p3 = seg["P3"]["vo"][-1]
    m.put(synth.bell(synth.hz(84), 2.0), p3["at"] + p3["t"] - .3, .18)
