"""T-021 环绕实景重建：CC0 科技氛围配乐；AR 锚点弹出提示音、扫光切入 3DGS 低频扫频、自由运镜升起与落版钟声"""
from pathlib import Path
from synth import assets, beep, tick, whoosh, bell, hz


def score(m):
    assets(m, Path(__file__).parent, music=.38)
    # 开场相机锁定位姿提示
    m.put(tick(m, 2200), .35, .24)
    for t_pin in (.65, 1.05, 1.45, 1.85):
        m.put(beep(1320, .06), t_pin, .11)
    # 扫光切入 3D 高斯点云
    m.put(whoosh(m, 1.6, 260, 3200), 3.85, .28)
    m.put(beep(1760, .08), 4.0, .12)
    # 脱离原轨道进入自由运镜
    m.put(whoosh(m, 1.3, 420, 2400), 7.55, .24)
    m.put(tick(m, 2600), 7.65, .22)
    # 结尾落版
    m.put(bell(hz(76), 2.2), 10.2, .18)
