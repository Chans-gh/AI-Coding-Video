"""C-169 光标打字：每个按键一声清脆的键盘声，删字的退格键略闷，换行时“叮”一声；底下只有很轻的房间底噪。
按键时刻由和 scene.js 相同的操作表算出。"""
import math
import numpy as np
from synth import bell, filt, tt

OPS = [("wait", .3), ("type", "每一帧，都由"), ("wait", .4), ("del", 2), ("wait", .15), ("type", "只由时间决定。"),
       ("mark", .55), ("scroll", .4), ("type", "所以它永远可以重来。")]


def plan():
    def jit(i):
        x = math.sin(i * 12.9898) * 43758.5453
        return x - math.floor(x)
    t, k, ev = 0.0, 0, []
    for op, a in OPS:
        if op == "wait":
            t += a
        elif op == "type":
            for _ in a:
                t += .06 + .06 * jit(k); k += 1; ev.append((t, "key"))
        elif op == "del":
            for _ in range(a):
                t += .07; ev.append((t, "del"))
        elif op == "mark":
            ev.append((t + .1, "mark")); t += a
        elif op == "scroll":
            ev.append((t, "scroll")); t += a
    return ev


def key(m, low=False):
    t = tt(.05)
    f = (700 if low else 1800) * (1 + .3 * m.rng.random())
    click = filt(m.noise(.05), "band", [f, f * 2.5]) * np.exp(-t / .007)
    body = np.sin(2 * np.pi * (180 if low else 260) * t) * np.exp(-t / .012) * .5
    return click + body


def score(m):
    m.put(filt(m.noise(m.dur + .5), "low", 400), 0, .05)
    for t, kind in plan():
        if kind in ("key", "del"):
            m.put(key(m, kind == "del"), t, .55 + .2 * m.rng.random(), m.rng.uniform(-.15, .15))
        elif kind == "scroll":
            m.put(bell(1568, 1.4, 2.0, .6), t, .35)
        elif kind == "mark":
            m.put(filt(m.noise(.25), "band", [2500, 6000]) * np.sin(np.pi * tt(.25) / .25), t, .12)   # 荧光笔划过
