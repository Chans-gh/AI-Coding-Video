"""C-013 皮影戏：梆子（木鱼）按 160 BPM 打拍，低音拨弦走五声音阶，
人偶挥刀时一声风响加锣（FM 钟，低音、泛音不整），收刀时梆子连击。"""
from synth import woodblock, string, whoosh, bell, thud, drone, hz


def score(m):
    beat = 60 / 160
    m.put(drone(hz(38), m.dur + .5, .2), 0, .06)
    for b in range(8):                                            # 梆子
        m.put(woodblock(1100 if b % 2 else 800, .12), b * beat, .5 if b % 2 == 0 else .3)
    for k, n in enumerate([50, 53, 55, 57, 55, 53, 50, 48]):      # 弦
        m.put(string(m, hz(n), 1.0, damp=.993, bright=.5), k * beat + beat / 2, .3, pan=-.2)
    m.put(whoosh(m, .35, 500, 4000), 1.15, .35, pan=.3)           # 挥刀
    m.put(bell(hz(43), 1.8, ratio=1.41, index=3), 1.5, .45)       # 锣
    m.put(thud(m, .4), 1.5, .35)
    for k in range(3):                                            # 收刀，梆子三连
        m.put(woodblock(1300, .1), 2.2 + k * .12, .45)
