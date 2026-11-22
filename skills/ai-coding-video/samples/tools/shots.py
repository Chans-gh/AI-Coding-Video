"""风格包完整演示片的逐镜头总览：照 packs/<名字>/demo/segments.json，每个镜头在段内某处抽一帧，拼成一张带编号和部件名的总览图。

    python3 tools/shots.py style-swap                    # 默认切换、主画幅，每段取 70% 处 → out/shots-style-swap-<键>-<画幅>.jpg
    python3 tools/shots.py style-swap --v clay --ar 9x16 # 指定切换（variants 的键）和画幅
    python3 tools/shots.py news-brief --at .4            # 每段取 40% 处

看完整演示片里每种分镜排得对不对（出界、压字、空白）用它，比视频抽帧准：每格正好是一个镜头。
"""
import argparse, io, json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
import render as R  # noqa: E402


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("pack")
    ap.add_argument("--v", default="")
    ap.add_argument("--ar", default="")
    ap.add_argument("--at", type=float, default=.7)
    ap.add_argument("--cols", type=int, default=6)
    a = ap.parse_args()
    pk = HERE.parent / "packs" / a.pack
    meta = json.loads((pk / "meta.json").read_text(encoding="utf-8"))
    plan = json.loads((pk / "demo" / "segments.json").read_text(encoding="utf-8"))
    v = a.v or (meta.get("variants") or meta.get("accents"))[0][0]
    ar = a.ar or meta.get("full", "16x9")
    times, at, names = [], 0.0, []
    for i, g in enumerate(plan["segs"]):
        times.append(at + g["d"] * a.at); names.append(f"{i + 1} {g['part']}"); at += g["d"]
    tw = 320 if ar == "16x9" else 180
    th = tw * 9 // 16 if ar == "16x9" else tw * 16 // 9
    rows = (len(times) + a.cols - 1) // a.cols
    sheet = Image.new("RGB", (a.cols * tw, rows * (th + 22)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype(str(HERE / "node_modules" / "@fontsource" / "noto-sans-sc" / "files" / "noto-sans-sc-chinese-simplified-700-normal.woff"), 14)
    except Exception:
        font = ImageFont.load_default()
    with sync_playwright() as pw:
        p = R.page(pw, f"pack:{a.pack}@{v}", ar)   # 和 batch.py 一样用 @键 选切换
        for k, t in enumerate(times):
            im = Image.open(io.BytesIO(p.frame(t, quality=80))).convert("RGB"); im.thumbnail((tw, th))
            x, y = (k % a.cols) * tw, (k // a.cols) * (th + 22)
            sheet.paste(im, (x, y + 22)); d.text((x + 4, y + 3), names[k], fill=(255, 200, 80), font=font)
        if p.errors:
            print("报错：" + p.errors[0][:200])
        p.close()
    R.OUT.mkdir(exist_ok=True)
    out = R.OUT / f"shots-{a.pack}-{v}-{ar}.jpg"
    sheet.save(out, quality=85)
    print(f"{len(times)} 个镜头 → out/{out.name}")


if __name__ == "__main__":
    main()
