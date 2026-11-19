"""C-128 史前洞穴岩画：低沉的鼓按慢拍子敲，偶尔两下连击，底下一层很低的嗡鸣像洞里的回声；火把一直噼啪作响（随机的细碎点声），动物换姿态时没有声音，全靠鼓。"""
from synth import thud, drone, tick, whoosh, hz
import random


def score(m):
    m.put(drone(hz(33), 5.0, .4), 0, .14)
    for k in range(13):
        tt_ = k * .375
        m.put(thud(m, .7), tt_, .5 if k % 4 == 0 else .3, pan=-.2 if k % 2 else .2)
        if k % 4 == 3:
            m.put(thud(m, .4), tt_ + .19, .22)
    rnd = random.Random(4)
    for _ in range(70):
        m.put(tick(m, rnd.choice([1800, 2600, 3400])), rnd.uniform(0, 4.9), rnd.uniform(.02, .07), pan=rnd.uniform(-.6, .2))
    m.put(whoosh(m, 2.0, 100, 500), .1, .08, pan=-.5)
