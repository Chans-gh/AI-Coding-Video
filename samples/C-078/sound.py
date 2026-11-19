"""C-078 体素世界：三个镜头三种声音。清晨是轻快的木琴五声音阶和几声鸟鸣似的钟琴；蓝调时刻换成低沉的和弦铺底、窗灯亮起一声钟；雨天是持续的沙沙噪声加零碎的雨点，最后一个暖和弦收住。"""
from synth import woodblock, bell, pluck, whoosh, pad, tick, hz

# 与 scene.js 的镜头切点一致
CUT = [0.0, 1.7, 3.4]


def score(m):
    # 清晨：上行五声音阶 + 鸟鸣
    for i, n in enumerate([72, 74, 76, 79, 81, 84, 81, 79]):
        m.put(woodblock(hz(n), .14), .1 + i * .19, .1)
    for t in (.45, .55, 1.1, 1.18):
        m.put(bell(hz(96), .25, 2.0, .6), t, .04)
    m.put(pad([hz(60), hz(67), hz(76)], 1.7, 2200, .2, .5), 0, .07)
    # 蓝调时刻：低和弦 + 窗灯
    m.put(whoosh(m, .6, 2000, 300), CUT[1] - .2, .05)
    m.put(pad([hz(45), hz(52), hz(57), hz(64)], 1.8, 900, .3, .6), CUT[1], .12)
    m.put(bell(hz(79), 1.6, 3.5, 1.2), CUT[1] + .5, .08)
    for i, n in enumerate([57, 64, 69]):
        m.put(pluck(hz(n), .5, 1400), CUT[1] + .9 + i * .25, .07)
    # 雨天：沙沙声 + 雨点
    for k in range(4):
        m.put(whoosh(m, .7, 3000, 5000), CUT[2] + k * .4, .05)
    for i in range(40):
        t = CUT[2] + (i * .61803) % 1.6
        m.put(tick(m, 2500 + (i * 977) % 3000), t, .03)
    m.put(pad([hz(53), hz(60), hz(65), hz(69)], 1.2, 1300, .15, .7), 4.0, .1)
