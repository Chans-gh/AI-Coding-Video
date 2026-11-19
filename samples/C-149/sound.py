"""C-149 早期光线追踪 CGI：（一句话写这段声音有什么、在哪些时刻）"""
from synth import kick, tick, bell, pad, whoosh, hz, tt


def score(m):
    beat = 60 / 160                       # 160 BPM，3 秒 8 拍
    m.put(whoosh(m, .8), 0, .3)           # 开场
    for b in range(8):
        m.put(tick(m), b * beat, .2)
