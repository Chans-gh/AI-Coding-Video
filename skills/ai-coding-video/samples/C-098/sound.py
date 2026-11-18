"""C-098 丝网印刷旅行海报：每印一版一声刮板刮过网版的沙沙声，落版时一声木质轻响，
底下是一组温暖的长音和弦随版数往上叠，最后一版数字印上时一声钟声。"""
from synth import pad, whoosh, woodblock, bell, filt, hz


def score(m):
    T0 = [.05, .5, .95, 1.4, 1.85, 2.45]
    chord = [hz(48), hz(55), hz(64), hz(67), hz(71), hz(74)]
    for i, t0 in enumerate(T0):
        m.put(filt(whoosh(m, .42, 600, 2400), "band", [500, 5000]), t0, .32, pan=-.6 + i * .24)
        m.put(woodblock(500 + i * 60, .12), t0 + .42, .18)
        m.put(pad(chord[:i + 2], m.dur - t0 + .3, 900 + i * 200, a=.3), t0, .05)
    m.put(bell(hz(79), 1.6, 3.5, 1.5), 2.85, .18)
