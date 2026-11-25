"""G-027 穿物一镜到底微距穿越：深邃科幻铺底、穿入液面俯冲重击与微观世界揭晓和弦"""
from synth import pad, kick, bell, hz


def score(m):
    m.put(pad([hz(38), hz(45), hz(50)], m.dur, cutoff=900), 0.0, .24)
    m.put(kick(m), 3.60, .48)
    m.put(bell(hz(74), 1.4), 3.65, .22)
    for idx, note in enumerate([69, 74, 78, 81]):
        m.put(bell(hz(note), 1.3), 5.20 + idx * 0.14, .18)
