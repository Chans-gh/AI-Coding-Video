"""C-125 机密档案袋：每敲一个字一声打字机咔哒（字间带一点随机），每行末尾一声换行“叮”；
地图图钉按下一声短嗒，涂抹条和荧光笔各一段纸面摩擦声，红铅笔画圈一段细沙沙，最后旧橡皮章重重一记。"""
import random
from synth import tick, bell, woodblock, filt, thud, impact, drone, hz


def score(m):
    m.put(drone(hz(41), 5.0, wobble=.2), 0, .07)
    lines = ['行动代号：夜莺', '地点：东港码头 7 号仓库', '时间：凌晨 3 点', '接头人：穿灰大衣', '读后销毁。']
    rnd, tc = random.Random(125), .3
    for ln in lines:
        for ch in ln:
            if ch != ' ':
                m.put(tick(m, rnd.choice([1500, 1800, 2100])), tc + rnd.random() * .01, .35, pan=rnd.uniform(-.3, .3))
                m.put(woodblock(300, .05), tc, .08)
            tc += .02 if ch == ' ' else .05
        m.put(bell(hz(93), .4, ratio=3.0, index=.5), tc, .1)
        tc += .12
    m.put(woodblock(500, .08), 2.2, .3)
    for t0 in (2.6, 2.8, 3.0):
        m.put(filt(m.noise(.22), "band", [800, 3000]), t0, .15)
    m.put(filt(m.noise(.6), "band", [3000, 8000]), 3.25, .08)
    m.put(impact(m), 4.0, .6)
    m.put(thud(m, .4), 4.0, .5)
