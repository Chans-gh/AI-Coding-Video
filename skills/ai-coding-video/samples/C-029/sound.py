"""C-029 积木玩具：每块积木卡上去一声「哒」（木鱼加很短的高频咔哒），
最后两块掉下来是闷响加弹跳，底下是安静的房间噪声和轻快的拨音。"""
from synth import woodblock, tick, thud, pluck, pad, filt, hz


def score(m):
    m.put(filt(m.noise(m.dur), "low", 400), 0, .035)                  # 安静的房间
    m.put(pad([hz(62), hz(66), hz(69)], m.dur, cutoff=1100, a=.6), .1, .07)
    for k, t0 in enumerate([.35, .62, .9, 1.18, 1.46, 1.74, 2.02, 2.3, 2.58]):
        m.put(woodblock(620 + (k % 3) * 90, .1), t0, .45, pan=-.35 + (k % 5) * .18)   # 卡入
        m.put(tick(m, 4200), t0, .22)
        m.put(pluck(hz([72, 76, 79, 81, 84, 79, 76, 72, 84][k]), .3, 2400), t0, .12, pan=.2)
    for t0, g in ((3.05, .5), (3.3, .34), (3.52, .2)):                # 第一块掉下来后弹两下
        m.put(thud(m, .42), t0, g)
        m.put(woodblock(420, .12), t0, g * .7)
    for t0, g in ((3.45, .46), (3.72, .3)):                           # 第二块
        m.put(thud(m, .4), t0, g, pan=.3)
        m.put(woodblock(520, .12), t0, g * .7, pan=.3)
