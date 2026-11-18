"""C-025 分层卡纸剪纸：八音盒似的钟声弹一段摇篮曲，柔和的长音铺底，
小女孩每走一步一声很轻的纸片摩擦，标题卡纸弹出时一声木鱼。"""
from synth import bell, pad, woodblock, filt, hz


def score(m):
    m.put(pad([hz(55), hz(62), hz(67), hz(71)], m.dur + .4, 1100, a=.8), 0, .16)
    for i, n in enumerate([79, 76, 74, 76, 79, 83, 81, 79, 76, 74, 72, 74]):
        m.put(bell(hz(n), 1.4, 5.0, .6), .1 + i * .32, .12, pan=-.3 + (i % 4) * .2)
    for i in range(12):
        m.put(filt(m.noise(.08), "band", [1500, 5000]), i * .314, .04, pan=-.2)
    m.put(woodblock(800, .14), 1.25, .2)
