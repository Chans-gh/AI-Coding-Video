"""C-123 手账剪贴本：轻快的拨音小旋律和木鱼打拍子，拍立得放下时一声纸响，胶带撕拉两下，
马克笔划过的沙沙声，贴纸弹出一声“啵”，盖章一声闷响，结尾新页滑过一道风声。"""
from synth import pluck, woodblock, beep, thud, whoosh, filt, hz


def score(m):
    mel = [76, 79, 81, 79, 76, 74, 76, 0, 72, 74, 76, 79, 77, 76, 74, 72]
    for i, n in enumerate(mel):
        if n:
            m.put(pluck(hz(n), .3, 3200), i * .25, .22, pan=.2)
        if i % 2 == 0:
            m.put(woodblock(1000, .08), i * .25, .1, pan=-.3)
    m.put(filt(m.noise(.2), "band", [700, 3000]), .15, .15)
    for t0 in (.45, .55):
        m.put(filt(m.noise(.12), "band", [2500, 9000]), t0, .12, pan=.3)
    for t0, d in ((.9, .3), (1.8, .5), (2.2, .4), (2.5, .3)):
        m.put(filt(m.noise(d), "band", [1800, 5000]), t0, .07, pan=-.2)
    m.put(beep(1300, .07), 1.45, .2)
    m.put(thud(m, .35), 2.85, .5)
    m.put(whoosh(m, .7, 400, 2000), 3.3, .3)
