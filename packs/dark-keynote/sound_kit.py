"""暗色科技发布会风格包的声音：每种部件出现时放什么音。全部来自 samples/lib/synth.py 的合成器。

用法（在演示片或你自己项目的 sound.py 里）：
    from sound_kit import bed, title_in, step_in, bars_in, number_in, transition
    bed(m); title_in(m, 0); transition(m, 3.4) ...
"""
from synth import impact, whoosh, riser, beep, pad, drone, bell, kick, hz

ROOT = 45                       # 底音的 MIDI 音高（A2）；换调只改这里


def bed(m, t0=0.0, d=None, g=0.22):
    """全片铺底：一个很低的持续音加一层柔和的和弦长音"""
    d = d or m.dur - t0
    m.put(drone(hz(ROOT - 12), d + .5, .2), t0, .12)
    m.put(pad([hz(ROOT), hz(ROOT + 7), hz(ROOT + 12), hz(ROOT + 16)], d, 1100, a=1.0, rel=1.2), t0, g)


def title_in(m, t):
    """片头：标志落定一声重击，标题扫光时一缕高频风声，副标题出现时一声钟"""
    m.put(impact(m), t + .05, .7)
    m.put(whoosh(m, .8, 1500, 6000), t + 1.2, .14, pan=-.3)
    m.put(bell(hz(ROOT + 31), 1.6, ratio=2.0, index=1.2), t + 1.45, .12, pan=.2)


def step_in(m, t, i):
    """讲解：每亮起一步，一个按音阶往上走的短提示音"""
    m.put(beep(hz(ROOT + 27 + [0, 4, 7, 12, 16][i % 5]), .09), t, .2, pan=-.2 + .2 * i)


def bars_in(m, t0, n, gap):
    """数据：柱子一根根长起，每根一个上行短音"""
    for i in range(n):
        m.put(beep(hz(ROOT + 31 + 2 * i), .07), t0 + i * gap, .16, pan=-.3 + .3 * i)


def number_in(m, t):
    """大数字：前面 1 秒上扬的噪声铺垫，数字砸下时重击加底鼓"""
    m.put(riser(m, 1.0), t - 1.0, .3)
    m.put(impact(m), t, .8)
    m.put(kick(m), t, .5)


def transition(m, t):
    """转场：光边扫过时一阵带通风声，从左到右"""
    m.put(whoosh(m, .6, 400, 4000), t, .3, pan=-.4)
    m.put(whoosh(m, .5, 900, 7000), t + .1, .12, pan=.4)
