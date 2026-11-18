"""C-134 盛期文艺复兴晕涂：底稿时只有炭笔似的轻刷声，素描和罩染一层层叠上来时，柔和的和弦也一层层加进来，最后光油泛黄时一声低沉的钟。"""
from synth import pad, whoosh, bell, hz


def score(m):
    for i in range(7):                                                   # 底稿线
        m.put(whoosh(m, .3, 600, 2200), .15 + i * .15, .05, pan=m.rng.uniform(-.5, .5))
    m.put(pad([hz(50), hz(57)], m.dur - .9, 900, a=1.0), .9, .13)               # 单色
    m.put(pad([hz(62), hz(66), hz(69)], m.dur - 2.0, 1400, a=1.2), 2.0, .1)     # 色彩罩染
    m.put(bell(hz(45), 3.0, ratio=2.0, index=.8), 3.3, .12)                     # 旧光油
    m.put(bell(hz(69), 2.0, ratio=3.0, index=.5), 3.5, .04, pan=.4)
