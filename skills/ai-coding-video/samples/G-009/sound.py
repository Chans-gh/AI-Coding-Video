"""G-009 步骤图解：没有旁白，CC0 配乐 + 换步骤的翻页声、秤读数滚动的细碎电子声、闷蒸倒计时的秒针声、完成一声铃"""
from pathlib import Path
from synth import assets, whoosh, tick, beep, bell, hz

STEPS = [.3, 4.3, 8.6, 11.6]


def score(m):
    assets(m, Path(__file__).parent, music=.4)
    for t in STEPS[1:]:
        m.put(whoosh(m, .5, 600, 4000), t - .2, .2)
    for t0, t1 in ((.8, 3.9), (4.7, 5.7), (9.1, 11.2)):
        n = int((t1 - t0) / .09)
        for i in range(n):
            m.put(beep(hz(96), .02), t0 + i * (t1 - t0) / n, .035)
    for i in range(8):
        m.put(tick(m, 2600), 5.5 + i * .37, .12)
    m.put(bell(hz(84), 2.0), 11.9, .22)
