"""C-133 早期文艺复兴湿壁画：素歌式的吟唱——用几个长音叠成的人声般铺底（纯合成），
每到一幕换一个和弦，教堂钟在开头和结尾各一声，底下是空旷大厅的低频嗡鸣。"""
from synth import pad, bell, drone, hz, whoosh


def score(m):
    m.put(drone(hz(36), m.dur + .5, wobble=.12), 0, .07)                       # 大厅的空气
    m.put(bell(hz(55), 3.2, ratio=2.4, index=1.6), .05, .22)                   # 开场钟
    # 素歌：三个幕各一个和弦，平行五度，像单声部吟唱加泛音
    chords = [[52, 59, 64], [50, 57, 62], [55, 62, 67]]
    starts = [0, 1.7, 3.3]
    for (ch, t0) in zip(chords, starts):
        m.put(pad([hz(n) for n in ch], 2.2, cutoff=1100, a=.5, rel=1.0), t0, .17)
        m.put(pad([hz(ch[0] + 12), hz(ch[2] + 12)], 1.8, cutoff=1800, a=.7, rel=.9), t0 + .25, .07)
    m.put(whoosh(m, 1.0, 120, 500), 1.0, .07)                                  # 镜头平移的空气声
    m.put(whoosh(m, 1.0, 120, 500), 2.6, .07)
    m.put(bell(hz(62), 3.0, ratio=2.4, index=1.4), 3.6, .18, pan=.2)           # 结尾钟
