"""T-020 对局复盘：写一份虚构的对局数据 assets/match.csv（3 对 3 的一个回合，90 秒）。

    python3 T-020/match.py

每名选手按几个路点（秒, x, z）走，每秒记一行位置；击杀另记一行 event=kill（player 是击杀者，target 是被击杀者）。
场地坐标：x 0–100（蓝方出生点在左，红方在右），z 0–60。数据全部是编的，不对应任何真实比赛和游戏。
"""
import math
from pathlib import Path

ROUTES = {  # 选手: (队伍, [(秒, x, z), …])，最后一个路点之后不再记（阵亡或回合结束）
    "B1": ("蓝", [(0, 6, 26), (10, 20, 14), (30, 40, 12), (50, 60, 12), (56, 66, 20), (63, 70, 28), (75, 78, 30), (90, 86, 30)]),
    "B2": ("蓝", [(0, 6, 30), (10, 20, 16), (30, 42, 14), (50, 58, 14), (56, 64, 22), (63, 68, 30), (70, 72, 34)]),
    "B3": ("蓝", [(0, 6, 34), (12, 22, 30), (30, 36, 30), (40, 46, 30)]),
    "R1": ("红", [(0, 94, 26), (15, 78, 26), (35, 64, 26), (50, 62, 22), (58, 64, 20)]),
    "R2": ("红", [(0, 94, 30), (15, 76, 30), (35, 56, 30), (40, 54, 30), (55, 62, 30), (63, 66, 32)]),
    "R3": ("红", [(0, 94, 34), (15, 80, 40), (40, 70, 42), (60, 70, 38), (70, 72, 36), (78, 76, 32)]),
}
KILLS = [(40, "R2", "B3"), (58, "B1", "R1"), (63, "B2", "R2"), (70, "R3", "B2"), (78, "B1", "R3")]


def at(route, t):
    for (t0, x0, z0), (t1, x1, z1) in zip(route, route[1:]):
        if t0 <= t <= t1:
            k = (t - t0) / (t1 - t0)
            return x0 + (x1 - x0) * k, z0 + (z1 - z0) * k
    return route[-1][1:]


def main():
    rows = ["t,player,team,x,z,event,target"]
    for p, (team, route) in ROUTES.items():
        for t in range(0, route[-1][0] + 1):
            x, z = at(route, t)
            w = math.sin(t * 1.7 + len(rows)) * .6          # 一点固定的晃动，像真实走位
            rows.append(f"{t},{p},{team},{x + w:.1f},{z - w:.1f},,")
    for t, k, v in KILLS:
        x, z = at(ROUTES[v][1], t)
        rows.append(f"{t},{k},{ROUTES[k][0]},{x:.1f},{z:.1f},kill,{v}")
    out = Path(__file__).resolve().parent / "assets" / "match.csv"
    out.write_text("\n".join(rows) + "\n", encoding="utf-8")
    print(out, len(rows) - 1, "行")


if __name__ == "__main__":
    main()
