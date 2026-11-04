"""T-009 活体录屏：旁白（青水公开音色）+ CC0 配乐；每次点击一声轻的咔哒"""
from pathlib import Path
from synth import assets, tick


def score(m):
    a = assets(m, Path(__file__).parent, music=.25)
    rec = next(i for i in a["items"] if i["kind"] == "录屏")
    for t, _, _, down in rec["cursor"]:
        if down:
            m.put(tick(m, 4000), t + .3, .35)
