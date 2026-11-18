"""C-104 1950 年代中世纪卡通：冷爵士小乐队——低音拨弦走低音线，刷子在军鼓上沙沙扫、踩镲摇摆节奏，
颤音琴（FM 钟声）弹几个七和弦的音；拔插头时一声“啵”，翻卡时一声木鱼。"""
from synth import pluck, bell, hat, woodblock, beep, filt, hz


def score(m):
    beat = .5                                                   # 120 BPM
    walk = [41, 45, 48, 50, 46, 50, 53, 51]
    for i, n in enumerate(walk):
        m.put(pluck(hz(n), .45, 700), i * beat, .55)
        m.put(filt(m.noise(.35), "band", [1500, 6000]), i * beat, .05, pan=-.3)   # 刷子
        if i % 2:
            m.put(hat(m), i * beat, .12, pan=.4)
            m.put(hat(m), i * beat + beat * .66, .08, pan=.4)
    for t0, ns in ((.25, [65, 69, 72, 76]), (2.25, [70, 74, 77, 81])):
        for j, n in enumerate(ns):
            m.put(bell(hz(n), 1.4, 4.0, .8), t0 + j * .09, .1, pan=.2)
    m.put(beep(900, .06), 1.2, .2)                              # 拔插头
    m.put(woodblock(800, .14), 2.05, .25)                       # 翻卡
