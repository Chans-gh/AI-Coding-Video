"""生成介绍页：python3 site/build.py

读 Skill 的 data/styles.json 和 samples/ 里已渲染的样片，把 src/index.html 填好写成 site/index.html，
把样片视频和静帧拷进 site/media/，按页面实际用到的字把字体裁成小文件放进 site/fonts/。
页面里的数字（风格总数、样片数、各题材数量）都在这里算，不要手改 index.html。
需要：samples/ 下先 npm install（字体来自 @fontsource），Python 装 fontTools 和 brotli。
"""
import html
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_DIR = HERE.parent
SKILL = REPO_DIR / "skills" / "ai-coding-video"
SAMPLES = REPO_DIR / "samples"
FONTSRC = SAMPLES / "node_modules" / "@fontsource"

VERSION = "v1 · 2026-11-03"
REPO = "https://github.com/Chans-gh/AI-Coding-Video"
BRANCH = "main"

THEME_EN = {
    "手绘与绘画": "Hand-drawn & painting", "3D 与实时图形": "3D & real-time graphics",
    "信息讲解与产品发布": "Explainers & launches", "电影年代与屏幕科技": "Film eras & screen tech",
    "平面设计与动态排版": "Graphic design & motion type", "印刷、版画与装饰": "Print & ornament",
    "卡通与动漫": "Cartoon & anime", "纸艺、材质与定格": "Paper, material & stop-motion",
    "东方传统": "East Asian traditions", "游戏": "Games",
}
LAYER = {  # 画在哪：中文、英文
    "canvas-2d": ("Canvas 2D", "Canvas 2D"), "svg-html": ("SVG / HTML", "SVG / HTML"), "webgl": ("WebGL / 3D", "WebGL / 3D"),
    "framework": ("讲解框架", "explainer frameworks"), "terminal": ("终端字符", "terminal text"), "external": ("外部工具", "external tools"),
}
# 样片的英文名和一句“怎么画的”（中文取 scene.js 第一行注释）
SAMPLE_EN = {
    "C-001": ("Chinese ink wash", "Noise-built ridges in three ink tones on fibrous paper; an ink bloom reveals the scene, calligraphy appears stroke by stroke, then the red seal."),
    "C-009": ("Whiteboard explainer", "Handwriting and boxes are traced along their paths by a floating marker; the camera pulls back to the full board at the end."),
    "C-013": ("Shadow puppetry", "A translucent leather puppet built from jointed parts with cut-out lace patterns, multiplied onto a lamp-lit cloth screen."),
    "C-014": ("Ukiyo-e woodblock", "Flat color blocks with carved ink lines in Prussian blue, graded skies, and paper grain multiplied over everything as the scroll pans."),
    "C-015": ("Red paper-cut", "A red sheet is drawn whole, then cut away with destination-out into a symmetric pattern that unfolds and lets warm light through."),
    "C-036": ("Kinetic typography", "One word per beat at 160 BPM; size, weight, inversion and a punch-in scale carry the rhythm."),
    "C-038": ("Flat science explainer", "Saturated gradients, rounded flat shapes with rim light and long shadows, layered with parallax."),
    "C-044": ("Dark tech keynote", "Near-black gradient with a hairline grid; a UI card snaps in, a light sweep passes, bars grow, and one huge number lands."),
    "C-053": ("16-bit pixel platformer", "Drawn pixel by pixel on a tiny canvas, then scaled up with smoothing off, in a limited palette."),
    "C-064": ("Terminal / ASCII CRT", "Every shape is a real character on a monospace grid, with phosphor glow, scanlines and a curved tube."),
    "C-069": ("Ray-marched ocean", "A hand-written GPU ray marcher: a noise height field for the waves, Fresnel sky reflection, two samples per pixel."),
    "C-076": ("Black hole visualization", "A GLSL shader bends starlight around a black hole and lights a golden accretion disk."),
}


def load_styles():
    data = json.loads((SKILL / "data" / "styles.json").read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data["styles"]


def sample_ids(styles):
    ids = []
    for s in styles:
        d = SAMPLES / s["id"]
        if s.get("verified") and all((d / f"{s['id']}-{ar}.mp4").exists() for ar in ("16x9", "9x16")):
            ids.append(s["id"])
    return ids


def zh_how(sid):
    first = (SAMPLES / sid / "scene.js").read_text(encoding="utf-8").splitlines()[0]
    m = re.match(r"//\s*\S+\s*[^：]*：(.*)", first)
    return (m.group(1) if m else first.lstrip("/ ")).rstrip("，,。") + "。"


def esc(s):
    return html.escape(s, quote=True)


def both(zh, en, tag="span"):
    return f'<{tag} lang="zh">{esc(zh)}</{tag}><{tag} lang="en">{esc(en)}</{tag}>'


def gallery(styles, ids):
    """按题材排好的一张卡片网格，上面一排题材筛选"""
    by = {s["id"]: s for s in styles}
    order = []
    for s in styles:
        if s["id"] in ids and s["theme"] not in order:
            order.append(s["theme"])
    ths = {th: f"t{k}" for k, th in enumerate(order)}
    out = ['    <div class="filter" role="group" aria-label="题材 / Theme">',
           f'      <button type="button" data-f="" aria-pressed="true">{both("全部", "All")} <small>{len(ids)}</small></button>']
    for th in order:
        n = sum(by[i]["theme"] == th for i in ids)
        out.append(f'      <button type="button" data-f="{ths[th]}" aria-pressed="false">{both(th, THEME_EN.get(th, th))} <small>{n}</small></button>')
    out.append('    </div>\n    <div class="cards">')
    for th in order:
        for s in (by[i] for i in ids if by[i]["theme"] == th):
            sid = s["id"]
            en_name, en_how = SAMPLE_EN.get(sid, (s["name"], ""))
            chips = "".join(f"<li>{esc(t)}</li>" for t in s["verified"])
            out.append(f'''      <article class="card" id="{sid}" data-f="{ths[th]}">
        <div class="screen">
          <video data-id="{sid}" data-src="media/{sid}-16x9.mp4" poster="media/{sid}-16x9.jpg" muted loop playsinline autoplay preload="none" aria-label="{esc(s['name'])}"></video>
          <button type="button" class="snd" aria-pressed="false">{both("声音", "Sound")}</button>
        </div>
        <p class="card-theme">{both(th, THEME_EN.get(th, th))}</p>
        <div class="card-meta"><code>{sid}</code><h4>{both(s["name"], en_name)}</h4></div>
        <p class="how">{both(zh_how(sid), en_how)}</p>
        <ul class="chips">{chips}</ul>
        <details><summary>{both("风格提示词", "Style prompt (Chinese)")}</summary><p lang="zh-CN">{esc(s["prompt"])}</p></details>
        <div class="links"><a href="{REPO}/tree/{BRANCH}/samples/{sid}">{both("样片代码", "Sample code")}</a><a href="{REPO}/blob/{BRANCH}/skills/ai-coding-video/{s["file"]}#{sid}">{both("词典条目", "Dictionary entry")}</a></div>
      </article>''')
    out.append("    </div>")
    return "\n".join(out)


def theme_bars(styles, ids):
    counts, done = {}, {}
    for s in styles:
        counts[s["theme"]] = counts.get(s["theme"], 0) + 1
        done[s["theme"]] = done.get(s["theme"], 0) + (s["id"] in ids)
    top = max(counts.values())
    rows = []
    for th, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        rows.append(f'      <div class="bar-row"><span class="lab">{both(th, THEME_EN.get(th, th))}</span>'
                    f'<span class="bar-track" role="img" aria-label="{esc(th)} {n}">'
                    f'<span class="bar-all" style="width:{n / top * 100:.1f}%"></span>'
                    f'<span class="bar-done" style="width:{done[th] / top * 100:.1f}%"></span></span>'
                    f'<span class="n">{done[th]}/{n}</span></div>')
    return "\n".join(rows)


def layers(styles):
    c = {}
    for s in styles:
        c[s["layer"]] = c.get(s["layer"], 0) + 1
    items = sorted(c.items(), key=lambda kv: -kv[1])
    zh = "、".join(f"{LAYER.get(k, (k, k))[0]} {n} 种" for k, n in items)
    en = ", ".join(f"{LAYER.get(k, (k, k))[1]} {n}" for k, n in items)
    return zh, en


def template_text():
    s = (SKILL / "prompting.md").read_text(encoding="utf-8")
    i = s.index("通用模板")
    m = re.search(r"```text\n(.*?)\n```", s[i:], re.S)
    return m.group(1)


# ---------- 字体：只留页面用到的字 ----------
def font_files(pkg, weight, chars):
    """从 @fontsource 的 CSS 里挑出覆盖这些字的分片文件"""
    css = (FONTSRC / pkg / f"{weight}.css").read_text()
    picked = []
    for block in re.findall(r"@font-face\s*{(.*?)}", css, re.S):
        src = re.search(r"url\(\./files/([^)]+\.woff2)\)", block).group(1)
        rng = re.search(r"unicode-range:\s*([^;]+);", block)
        if not rng:
            picked.append(src); continue
        spans = []
        for part in rng.group(1).split(","):
            part = part.strip().upper().replace("U+", "")
            a, _, b = part.partition("-")
            spans.append((int(a, 16), int(b or a, 16)))
        if any(any(a <= ord(ch) <= b for a, b in spans) for ch in chars):
            picked.append(src)
    return [FONTSRC / pkg / "files" / f for f in picked]


def make_font(pkg, weight, chars, out):
    from fontTools import subset
    from fontTools.merge import Merger
    from fontTools.ttLib import TTFont
    files = font_files(pkg, weight, chars)
    text = "".join(sorted(chars))
    with tempfile.TemporaryDirectory() as tmp:
        parts = []
        for k, f in enumerate(files):
            font = TTFont(f)
            opts = subset.Options(); opts.layout_features = ["*"]; opts.notdef_outline = True
            sub = subset.Subsetter(opts); sub.populate(text=text); sub.subset(font)
            font.flavor = None
            p = Path(tmp) / f"{k}.ttf"; font.save(p); parts.append(str(p))
        merged = Merger().merge(parts) if len(parts) > 1 else TTFont(parts[0])
        merged.flavor = "woff2"
        merged.save(out)
    return len(files)


def page_chars(text):
    body = re.sub(r"<script.*?</script>|<style.*?</style>", "", text, flags=re.S)
    body = html.unescape(re.sub(r"<[^>]+>", "", body))
    chars = set(body) | set(chr(c) for c in range(0x20, 0x7F)) | set("“”‘’—–…·、，。：；！？（）《》「」【】×÷")
    return {c for c in chars if not c.isspace() or c == " "}


def main():
    styles = load_styles()
    ids = sample_ids(styles)
    if not ids:
        sys.exit("还没有渲染好的样片：先在 samples/ 下运行 render.py")
    zh_l, en_l = layers(styles)
    tpl = (HERE / "src" / "index.html").read_text(encoding="utf-8")
    fills = {
        "{{VERSION}}": VERSION, "{{REPO}}": REPO, "{{N_STYLES}}": str(len(styles)), "{{N_SAMPLES}}": str(len(ids)),
        "{{GALLERY}}": gallery(styles, ids), "{{THEMES}}": theme_bars(styles, ids),
        "{{LAYERS_ZH}}": zh_l, "{{LAYERS_EN}}": en_l, "{{TEMPLATE}}": esc(template_text()),
    }
    for k, v in fills.items():
        tpl = tpl.replace(k, v)
    left = re.findall(r"{{[A-Z_]+}}", tpl)
    if left:
        sys.exit(f"模板里还有没填的占位符：{left}")
    (HERE / "index.html").write_text(tpl, encoding="utf-8")

    media = HERE / "media"
    if media.exists():
        shutil.rmtree(media)
    media.mkdir()
    for sid in ids:
        for ar in ("16x9", "9x16"):
            for ext in ("mp4", "jpg"):
                shutil.copy2(SAMPLES / sid / f"{sid}-{ar}.{ext}", media / f"{sid}-{ar}.{ext}")

    if not FONTSRC.exists():
        sys.exit("缺字体：先在 samples/ 下运行 npm install")
    fonts = HERE / "fonts"
    fonts.mkdir(exist_ok=True)
    chars = page_chars(tpl)
    ascii_ = {c for c in chars if ord(c) < 0x250}
    for pkg, w, name, cs in [("noto-sans-sc", 400, "sans-400", chars), ("noto-sans-sc", 700, "sans-700", chars),
                             ("noto-serif-sc", 900, "serif-900", chars),
                             ("jetbrains-mono", 400, "mono-400", ascii_), ("jetbrains-mono", 700, "mono-700", ascii_)]:
        n = make_font(pkg, w, cs, fonts / f"{name}.woff2")
        print(f"字体 {name}：{n} 个分片 → {(fonts / f'{name}.woff2').stat().st_size / 1e3:.0f} KB")
    size = sum(p.stat().st_size for p in HERE.rglob("*") if p.is_file() and "src" not in p.parts)
    print(f"写好 site/index.html：{len(ids)} 个样片，{len(styles)} 种风格；整站 {size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
