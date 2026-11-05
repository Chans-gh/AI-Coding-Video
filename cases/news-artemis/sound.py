"""整支的声音：旁白（语音合成的公开音色，按 segments/timing.json 摆）+ NASA 原声（发射现场、发布会原话）+ 两首 CC0 配乐。
render.py 调 score(m, T)：m 是整支的 synth.Mix，T.start(k) 第 k 段在整支里的起点，T.vo() 摆旁白、返回说话的区间。
配乐分两首：「Insistent」垫在冷开场到发射、返回；「ObservingTheStar」垫在航线、飞掠、和阿波罗比、接下来、结尾；段与段之间交叉淡化 2 秒。
旁白和原话响的时候配乐压低；发射原声在旁白下面也压低一些。
"""
import numpy as np
from synth import SR, fade, load

# 发布会原话（assets/dl/quote.mp3 从原录像第 855 秒起截 40 秒）：两截，[素材里的起点, 终点, 放在第 7 段的第几秒]
# 和 segments/07.js 的 QUOTE 一致；字词时间见 log.md 的核对记录
QUOTE = [(9.75, 22.6, 23.6), (29.8, 35.4, 37.05)]
LAUNCH_AT = .5          # 发射原声（塔架机位，素材第 8.5 秒是固体助推器点火）放在第 3 段第 0.5 秒：点火落在第 9 秒，和画面的任务时钟 T-0 对齐
PLAN = [("insistent", 1, 3), ("star", 4, 6), ("insistent", 7, 7), ("star", 8, 9)]
MUSIC, DUCK, XF = .30, .62, 2.0


def duck(x, at, talk, amount):
    env = np.ones(len(x))
    t = at + np.arange(len(x)) / SR
    for t0, t1 in talk:
        k = np.clip(np.minimum((t - (t0 - .3)) / .3, ((t1 + .4) - t) / .4), 0, 1)
        env = np.minimum(env, 1 - amount * k)
    return x * env[:, None]


def score(m, T):
    d = T.dir / "assets" / "dl"
    talk = T.vo(m, .95)
    s7 = T.start(7)
    q = load(d / "quote.mp3")
    for a, b, at in QUOTE:
        clip = fade(q[int(a * SR):int(b * SR)], .05, .15)
        m.put(clip, s7 + at, 1.0)
        talk.append((s7 + at, s7 + at + (b - a)))
    s3 = T.start(3)
    x = load(d / "launch.mp3")
    end = T.start(4) - s3 - LAUNCH_AT
    x = fade(x[: int(end * SR)], .3, 3.0)
    m.put(duck(x, s3 + LAUNCH_AT, talk, .55), s3 + LAUNCH_AT, .7)
    pos = {}
    for name, a, b in PLAN:
        t0 = max(0.0, T.start(a) - (XF if a > 1 else 0))
        t1 = min(T.dur, T.segs[b - 1]["end"] + (XF if b < len(T.segs) else 0))
        src = load(d / f"{name}.mp3")
        k = pos.get(name, 0)                                # 同一首第二次出现时接着上次的位置放
        n = int((t1 - t0) * SR)
        idx = (k + np.arange(n)) % len(src)                 # 不够长就循环
        pos[name] = k + n
        x = fade(src[idx], XF if a > 1 else 1.0, XF if b < len(T.segs) else 2.5)
        m.put(duck(x, t0, talk, DUCK), t0, MUSIC)
