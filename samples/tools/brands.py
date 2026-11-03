"""风格包换品牌色的对照图：同一个演示片在几个时刻、几种强调色下各截一帧，拼成 packs/<名字>/brands.jpg。

    python3 tools/brands.py dark-keynote                                  # 默认 3 种颜色、3 个时刻
    python3 tools/brands.py dark-keynote --accent '#8B7BFF' '#FF7A45' --at 2.2 10.6

每行一种颜色，每列一个时刻；演示片要从播放器参数 accent 读品牌色（见 packs/<名字>/demo/scene.js）。
"""
import argparse, io, sys
from pathlib import Path
from urllib.parse import quote
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import render as R


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pack")
    ap.add_argument("--accent", nargs="+", default=["#8B7BFF", "#FF7A45", "#2BD99F"])
    ap.add_argument("--at", nargs="+", type=float, default=[2.2, 6.2, 10.6])
    ap.add_argument("--ar", choices=["16x9", "9x16"], default="16x9")
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright
    cw, ch = (640, 360) if a.ar == "16x9" else (270, 480)
    sheet = Image.new("RGB", (cw * len(a.at) + 8 * (len(a.at) - 1), ch * len(a.accent) + 8 * (len(a.accent) - 1)), (0, 0, 0))
    with sync_playwright() as pw:
        for r, col in enumerate(a.accent):
            p = R.Page(pw, f"pack:{a.pack}", a.ar, scale=.5, query="&accent=" + quote(col))
            for c, t in enumerate(a.at):
                im = Image.open(io.BytesIO(p.frame(t, quality=90))).resize((cw, ch), Image.LANCZOS)
                sheet.paste(im, (c * (cw + 8), r * (ch + 8)))
            if p.errors:
                print(f"✗ {col} 报错：{p.errors[0][:80]}")
            p.close()
    out = R.PACKS / a.pack / "brands.jpg"
    sheet.save(out, quality=84, optimize=True)
    print(f"{len(a.accent)} 种颜色 × {len(a.at)} 个时刻 → {out.relative_to(R.HERE.parent)}  {out.stat().st_size / 1e3:.0f} KB")


if __name__ == "__main__":
    main()
