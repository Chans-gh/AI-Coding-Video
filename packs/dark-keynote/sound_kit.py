"""暗色科技发布会风格包的声音：每种部件出现时放什么音。全部来自 samples/lib/synth.py 的合成器。

用法（在演示片或你自己项目的 sound.py 里）：
    from sound_kit import bed, title_in, step_in, bars_in, number_in, transition
    bed(m); title_in(m, 0); transition(m, 3.4) ...
完整演示片按 demo/segments.json 的分段表调用，见 demo/sound.py。
"""
from synth import impact, whoosh, riser, beep, pad, drone, bell, kick, hat, tick, thud, hz

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


# ———— 完整演示片用的：按章起伏的铺底，和新部件的入场音（上面几个照旧，15 秒切换片段只用它们）————
CHORDS = [[0, 7, 12, 16], [-3, 4, 9, 12], [-7, 0, 5, 9], [-5, 2, 7, 11]]   # 同一个调里的 I、vi、IV、V，一章换一个


def bed_chapters(m, marks, beat=.375):
    """按章起伏的铺底。marks = [(开始, 结束, 第几章 0 起 / None 是片头片尾, 是否章节卡)]：
    低音一直在；和弦长音一章换一个；正文段每 2 拍一记轻底鼓、每拍一下踩镲，章节卡上退下去，只留长音"""
    m.put(drone(hz(ROOT - 12), m.dur + .5, .2), 0, .11)
    for a, b, ch, card in marks:
        c = CHORDS[(ch or 0) % len(CHORDS)]
        m.put(pad([hz(ROOT + k) for k in c], b - a + 1.0, 900 if card else 1300, a=.5, rel=1.0), a, .2 if card else .17)
        if card or ch is None:
            continue
        k = 0
        while a + .2 + k * beat < b - .1:
            t = a + .2 + k * beat
            if k % 2 == 0:
                m.put(kick(m), t, .16)
            m.put(hat(m), t + beat / 2, .05, pan=.2 * (-1) ** k)
            k += 1


def chapter_in(m, t):
    """章节卡：前 1 秒上扬噪声，章号描边时一记重击，章名吸附时一声钟"""
    m.put(riser(m, 1.0), t - 1.0, .22)
    m.put(impact(m), t, .6)
    m.put(bell(hz(ROOT + 24), 1.8, ratio=2.0, index=1.0), t + .5, .1, pan=-.2)


def push(m, t):
    """推移转场：一阵从右到左、偏低的风声"""
    m.put(whoosh(m, .7, 250, 2500), t, .28, pan=.3)


def dissolve(m, t):
    """叠化转场：很轻的一缕高频风声"""
    m.put(whoosh(m, .6, 1500, 6000), t, .08)


def typing(m, t0, n, cps):
    """代码演示：逐字打出时一串轻敲击，每 2 个字一下"""
    for i in range(0, n, 2):
        m.put(tick(m, 2500 + 400 * (i % 3)), t0 + i / cps, .12, pan=-.3 + .6 * ((i * 7) % 10) / 10)


def callout_in(m, t):
    """标注：框描出时一声上行短音，标签出现时再一声"""
    m.put(beep(hz(ROOT + 36), .08), t + .1, .16)
    m.put(beep(hz(ROOT + 43), .1), t + .6, .16, pan=.2)


def progress(m, t0, d, n=10):
    """界面框的渲染进度：胶片格每亮一格一个很轻的提示音，走完一声钟"""
    for i in range(n):
        m.put(beep(hz(ROOT + 31 + [0, 2, 4, 7, 9][i % 5]), .05), t0 + d * (i + 1) / n, .09, pan=-.4 + .8 * i / n)
    m.put(bell(hz(ROOT + 31), 1.4, ratio=2.0, index=1.0), t0 + d, .1)


def line_in(m, t0, d, n):
    """折线：画线时按点一个个上行的短音，画完一声钟"""
    for i in range(n):
        m.put(beep(hz(ROOT + 24 + [0, 2, 4, 7, 9, 12, 14, 16][i % 8]), .06), t0 + d * i / (n - 1), .12, pan=-.4 + .8 * i / n)
    m.put(bell(hz(ROOT + 36), 1.4, ratio=2.0, index=1.0), t0 + d, .09)


def ring_in(m, t0, n, gap=.45):
    """占比环：每一段弧长出时一个短音"""
    for i in range(n):
        m.put(beep(hz(ROOT + 31 - 3 * i), .09), t0 + i * gap, .16, pan=-.3 + .3 * i)


def card_in(m, t, hot=False):
    """卡片落定（对比的两边）：一记闷响，突出的那边再加一声钟"""
    m.put(thud(m), t, .45)
    if hot:
        m.put(bell(hz(ROOT + 28), 1.6, ratio=2.0, index=1.2), t + .1, .12, pan=.3)


def quote_in(m, t):
    """引用：一声长钟，留出读字的空"""
    m.put(bell(hz(ROOT + 19), 2.8, ratio=2.0, index=.8), t, .14)


def lower_in(m, t):
    """信息条：一缕短风声加一个提示音"""
    m.put(whoosh(m, .4, 1200, 5000), t, .1, pan=-.5)
    m.put(beep(hz(ROOT + 31), .07), t + .35, .14, pan=-.3)


def outro_in(m, t, cta):
    """片尾：标志落定一记重击，按钮出现时一记重击加和弦钟声"""
    m.put(impact(m), t + .05, .6)
    m.put(impact(m), cta, .5)
    for k, n in enumerate((0, 4, 7)):
        m.put(bell(hz(ROOT + 24 + n), 2.4, ratio=2.0, index=1.0), cta + .05 + k * .03, .08, pan=-.3 + .3 * k)
