"""C-109 刻线印刷长镜头：底下是一层低沉的长音和轻轻的水声（低通噪声）；镜头从高处降下时一阵风声；每过一根前景枝条（0.9、2.3、3.7 秒前后）响一下刻刀划纸（短促的高频带通噪声）；中间拨弦弹几个五声音阶的音；结尾盖朱印时一记压印的闷响加木鱼。"""
from synth import drone, string, whoosh, thud, woodblock, filt, hz


def score(m):
    m.put(drone(hz(38), m.dur, .3), 0, .18)
    m.put(filt(m.noise(m.dur), "low", 700) * .5, 0, .25)
    m.put(whoosh(m, 2.6, 300, 1200), 0, .12)
    for t0 in (1.05, 2.45, 3.85):
        cut = filt(m.noise(.22), "band", [2500, 7000])
        m.put(cut, t0, .35, .3)
        m.put(filt(m.noise(.12), "band", [4000, 9000]), t0 + .2, .25, -.2)
    for t0, n in ((.4, 62), (1.0, 64), (1.6, 67), (2.4, 69), (3.0, 67), (3.6, 72)):
        m.put(string(m, hz(n), 1.6, .996, .5), t0, .4, -.15)
    m.put(thud(m, .5), 4.3, .55)
    m.put(woodblock(700, .2), 4.3, .3)
