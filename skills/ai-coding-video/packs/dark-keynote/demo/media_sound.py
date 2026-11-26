"""完整 71.25 秒有素材版演示片的声音：复用 demo/sound.py 的纯 C 音轨表并扩展媒体插槽音效"""
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import sound_kit as S

_spec = importlib.util.spec_from_file_location("_dk_sound", HERE / "sound.py")
_base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_base)

BEAT = _base.BEAT
TRANS = _base.TRANS
PARTS = dict(_base.PARTS)
OVER = dict(_base.OVER)


def _media_split(m, T, o):
    S.card_in(m, T(0.05), hot=(o.get("infoKind") == "metric"))
    for i in range(len(o.get("items") or [])):
        S.pop_in(m, T(0.15 + i * 0.12), i, g=0.10)


PARTS["mediaSplit"] = _media_split
PARTS["mediaFrame"] = lambda m, T, o: (S.swish(m, T(0.04), 0.35, 0.14), S.card_in(m, T(0.12), hot=True))
OVER["mediaPip"] = lambda m, t, o: S.pop_in(m, t + 0.06, 2, g=0.12)


def score(m):
    plan = json.loads((HERE / "media_segments.json").read_text(encoding="utf-8"))
    at, ch, marks = 0.0, None, []
    for g in plan["segs"]:
        p, o, d, sp = g["part"], g.get("o", {}), g["d"], g.get("speed", 1)
        if p == "chapter":
            ch = o["n"] - 1
        marks.append((at, at + d, ch, p in ("chapter", "outro")))
        if g.get("tr") in TRANS:
            TRANS[g["tr"]](m, at)
        T = lambda x, at=at, sp=sp: at + x / sp
        PARTS[p](m, T, o)
        for v in g.get("over", []):
            OVER[v["part"]](m, T(v["at"]), v.get("o", {}))
        at += d
    S.bed_chapters(m, marks, BEAT)
