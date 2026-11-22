"""C-073 3D 战役 / 地图俯瞰：纪录片式的低沉长音和定音鼓般的重击（每个机位切换时一下）；海浪是低通噪声缓缓起伏；1.6–3.4 秒箭雨，一连串短促的嗖嗖声左右交错；2.6 秒潮水反转，一段由低到高的上扬声和一声钟；最后一记闷响收住。"""
import numpy as np
from synth import drone, pad, impact, thud, whoosh, riser, bell, filt, hz


def score(m):
    m.put(drone(hz(36), m.dur, .3), 0, .3)
    m.put(pad([hz(48), hz(55), hz(60), hz(63)], m.dur, 900, .8, 1.0), 0, .12)
    sea = filt(m.noise(m.dur), "low", 500)
    sea *= .6 + .4 * np.sin(np.linspace(0, 6 * np.pi, len(sea)))
    m.put(sea, 0, .35)
    for t0 in (0.0, 1.7, 3.3):
        m.put(impact(m), t0, .5)
    for k in range(18):
        t0 = 1.6 + k * .1 + m.rng.random() * .05
        m.put(whoosh(m, .25, 1500, 5000), t0, .12, -.6 if k % 2 else .6)
    m.put(riser(m, 1.0), 1.8, .25)
    m.put(bell(hz(69), 2.0), 2.7, .14)
    m.put(thud(m, .6), 4.5, .4)
