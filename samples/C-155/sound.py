"""C-155 液态融合：两团液体靠拢时低沉的「咕」一声，粘在一起时一个软软的低音；拉开断裂时一声清脆的「啵」，小液滴甩出去是几下高高的水滴声；波浪泼过整屏是一道湿润的扫声，最后液滴汇成标志时一串上行的水滴和一个明亮的和弦。"""
from synth import pluck, bell, whoosh, thud, pad, hz


def drip(f):
    return bell(f, .25, 1.4, 2.5)


def score(m):
    m.put(thud(m, .4), .9, .35)
    m.put(pluck(hz(40), .5, 600), .95, .3)
    m.put(drip(hz(64)), 1.85, .25)
    m.put(thud(m, .2), 1.85, .15)
    for k, tt_ in enumerate((1.95, 2.02, 2.1, 2.2)):
        m.put(drip(hz(80 + k * 3)), tt_, .1)
    m.put(whoosh(m, .8, 250, 1500), 2.2, .16)
    for k, tt_ in enumerate((3.0, 3.15, 3.3, 3.45, 3.6, 3.75)):
        m.put(drip(hz(70 + k * 2)), tt_, .09)
    m.put(thud(m, .3), 3.95, .25)
    m.put(pad([hz(55), hz(62), hz(67), hz(71)], 1.1, 1800, .05, .8), 3.95, .14)
    m.put(bell(hz(79), 1.2, 2.0, 1.0), 4.0, .07)
