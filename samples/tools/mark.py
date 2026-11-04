"""把已出片的样片登记进风格条目：缩略图、「技术（已验证）」「样片代码」，有风格包的再加「风格包」，再跑 build_index.py 和 --check。

    python3 tools/mark.py C-168 C-169
    python3 tools/mark.py all          # 所有横竖两版都已出片、有 meta.json 的样片

技术标签取 samples/<编号>/meta.json 的 tech；风格包取 packs/<名字>/meta.json 的 from。
「样片代码」「风格包」写成指向 GitHub 的链接，仓库地址取 build_index.py 的 CODE_BASE。条目里已有这几行就按 meta.json 更新，没有就补上；
重复运行结果不变。缩略图 images/<编号>.jpg 由 batch.py 出片时写好。
"""
import json
import re
import subprocess
import sys
from pathlib import Path

SAMPLES = Path(__file__).resolve().parent.parent
SKILL = SAMPLES.parent / "skills" / "ai-coding-video"
BUILD = SKILL / "scripts" / "build_index.py"
PACKS = SAMPLES.parent / "packs"
MEDIA = SAMPLES.parent / "media.json"
sys.path.insert(0, str(BUILD.parent))
from build_index import CODE_BASE  # noqa: E402


def link(path):
    return f"[{path}]({CODE_BASE}{path.rstrip('/')})"


def packs_of(sid):
    return sorted(p.parent.name for p in PACKS.glob("*/meta.json")
                  if json.loads(p.read_text(encoding="utf-8")).get("from") == sid)


def ready(sid):
    d = SAMPLES / sid
    listed = json.loads(MEDIA.read_text(encoding="utf-8"))["files"] if MEDIA.exists() else {}
    return (d / "meta.json").exists() and all((d / f"{sid}-{ar}.mp4").exists() or f"{sid}-{ar}.mp4" in listed
                                              for ar in ("16x9", "9x16"))


def mark(sid, styles):
    s = styles.get(sid)
    if not s:
        return f"✗ {sid}：风格目录里没有"
    if not ready(sid):
        return f"✗ {sid}：还没出齐横竖两版视频或缺 meta.json"
    if not (SKILL / "images" / f"{sid}.jpg").exists():
        return f"✗ {sid}：缺缩略图 images/{sid}.jpg"
    tech = json.loads((SAMPLES / sid / "meta.json").read_text(encoding="utf-8"))["tech"]
    path = SKILL / s["file"]
    txt = path.read_text(encoding="utf-8")
    m = re.search(rf'<a id="{sid}"></a>\s*\n\s*\n## {sid} [^\n]*\n(.*?)(?=\n<a id="[CTG]-\d{{3}}"></a>|\Z)', txt, re.S)
    if not m:
        return f"✗ {sid}：在 {s['file']} 里找不到条目"
    body = m.group(1)
    new = body
    img = f"![{s['name']}](../images/{sid}.jpg)"
    if re.search(r"^!\[[^\]]*\]\(\.\./images/[^)]+\)", new, re.M):
        new = re.sub(r"^!\[[^\]]*\]\(\.\./images/[^)]+\)", img, new, count=1, flags=re.M)
    else:
        new = "\n" + img + "\n" + new
    lines = [f"- 技术（已验证）：{' · '.join(tech)}", f"- 样片代码：{link(f'samples/{sid}/')}"]
    lines += [f"- 风格包：{link(f'packs/{n}/')}" for n in packs_of(sid)]
    new = re.sub(r"^- (技术（已验证）|样片代码|风格包)：.*\n", "", new, flags=re.M)
    # 放在「技术（建议）」前面；没有就放在字段列表最后
    if re.search(r"^- 技术（建议）：", new, re.M):
        new = re.sub(r"^(- 技术（建议）：)", "\n".join(lines) + r"\n\1", new, count=1, flags=re.M)
    else:
        last = list(re.finditer(r"^- [^：\n]+：.*$", new, re.M))[-1]
        new = new[:last.end()] + "\n" + "\n".join(lines) + new[last.end():]
    if new == body:
        return f"= {sid}：条目已是最新"
    path.write_text(txt[:m.start(1)] + new + txt[m.end(1):], encoding="utf-8")
    return f"✓ {sid}：已更新 {s['file']}"


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    data = json.loads((SKILL / "data" / "styles.json").read_text(encoding="utf-8"))
    styles = {s["id"]: s for s in (data if isinstance(data, list) else data["styles"])}
    ids = sorted(p.name for c in "CTG" for p in SAMPLES.glob(f"{c}-*") if ready(p.name)) if args == ["all"] else args
    out = [mark(sid, styles) for sid in ids]
    print("\n".join(out))
    for extra in ([], ["--check"]):
        r = subprocess.run([sys.executable, str(BUILD), *extra], capture_output=True, text=True)
        print((r.stdout + r.stderr).strip().splitlines()[-1])
        if r.returncode:
            print(r.stdout + r.stderr); sys.exit(1)
    if any(o.startswith("✗") for o in out):
        sys.exit(1)


if __name__ == "__main__":
    main()
