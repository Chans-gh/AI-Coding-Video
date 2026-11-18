"""C-095 国风纸片拼贴：拨弦（像古琴）弹五声音阶的散音，每张纸片落定一声轻木鱼和一点纸的摩擦声，
诗句出现时一段低音铺底，盖印章时一声闷响。"""
from synth import string, woodblock, drone, thud, filt, hz


def score(m):
    m.put(drone(hz(38), m.dur + .3, .3), 0, .25)
    for k, n in enumerate([62, 69, 67, 64, 62, 57, 62]):
        m.put(string(m, hz(n), 2.0, .996, .45), .05 + k * .52, .32, pan=-.3 + k * .1)
    for k, t0 in enumerate([.05, .3, .45, .7, .9, 1.1]):
        m.put(filt(m.noise(.2), "band", [1500, 5000]), t0 + .1, .06, pan=-.4 + k * .16)
        m.put(woodblock(700 + k * 40, .12), t0 + .55, .12, pan=-.4 + k * .16)
    m.put(thud(m, .5), 3.0, .6)
    m.put(woodblock(420, .2), 3.0, .3)
