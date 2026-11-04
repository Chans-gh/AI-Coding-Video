"""生成介绍页：python3 site/build.py

读 Skill 的 data/styles.json 和 samples/ 里已渲染的样片，把 src/index.html 填好写成 site/index.html，
把样片视频和静帧拷进 site/media/，再由 small.py 出卡片用的小版（site/media/s/），按页面实际用到的字把字体裁成小文件放进 site/fonts/。
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

import small

HERE = Path(__file__).resolve().parent
REPO_DIR = HERE.parent
SKILL = REPO_DIR / "skills" / "ai-coding-video"
SAMPLES = REPO_DIR / "samples"
PACKS = REPO_DIR / "packs"
_MEDIA = REPO_DIR / "media.json"
LISTED = json.loads(_MEDIA.read_text(encoding="utf-8"))["files"] if _MEDIA.exists() else {}
FONTSRC = SAMPLES / "node_modules" / "@fontsource"

VERSION = "v8 · 2026-11-04"
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
    "footage": ("公共领域素材", "public-domain material"), "generated": ("AI 生成素材", "AI-generated material"),
}
KIND = {  # 三类：卡片的 data-kind、名字（中、英）
    "C": ("c", "纯代码", "Pure code"), "T": ("t", "实拍素材", "Real footage"), "G": ("g", "AI 素材", "AI material"),
}


def tags_json():
    return json.loads((SKILL / "data" / "tags.json").read_text(encoding="utf-8"))


def ctype_en():
    return {c["name"]: c["en"] for c in tags_json()["content_types"]}


def mat_en():
    return {m["name"]: m["en"] for ms in tags_json()["materials"].values() for m in ms}


def meta(sid):
    """样片的英文名、英文描述、技术标签：samples/<编号>/meta.json（中文描述取 scene.js 第一行注释）"""
    p = SAMPLES / sid / "meta.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def has_video(path, name):
    """视频在本地，或已登记在 media.json（放在 Release 里，见 scripts/media.py）"""
    return path.exists() or name in LISTED


def load_styles():
    data = json.loads((SKILL / "data" / "styles.json").read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data["styles"]


def sample_ids(styles):
    ids = []
    for s in styles:
        d = SAMPLES / s["id"]
        if s.get("verified") and all(has_video(d / f"{s['id']}-{ar}.mp4", f"{s['id']}-{ar}.mp4") for ar in ("16x9", "9x16")):
            ids.append(s["id"])
    return ids


def zh_how(sid):
    src = next(f for f in (SAMPLES / sid / "scene.js", SAMPLES / sid / "scene.jsx") if f.exists())   # Remotion 样片是 scene.jsx
    first = src.read_text(encoding="utf-8").splitlines()[0]
    m = re.match(r"//\s*\S+\s*[^：]*：(.*)", first)
    return (m.group(1) if m else first.lstrip("/ ")).rstrip("，,。—") + "。"


def esc(s):
    return html.escape(s, quote=True)


def both(zh, en, tag="span"):
    return f'<{tag} lang="zh">{esc(zh)}</{tag}><{tag} lang="en">{esc(en)}</{tag}>'


def tech_bar(styles, ids, by):
    """技术条：风格条目推荐过、或样片验证过的技术各有几个样片；一个样片都没有的留在条上置灰，一眼看出还缺哪个。
    出片工具（Playwright、ffmpeg 等 pipeline 层）每支都一样，不进这条。返回 (按钮 HTML 列表, {技术: 代号}, 缺的个数)"""
    tags = json.loads((SKILL / "data" / "tags.json").read_text(encoding="utf-8"))
    layer_of, order = tags["tags"], [l["key"] for l in tags["layers"]]
    cand = {t for s in styles if s["id"][0] == "C" for t in s.get("suggested", [])} | {t for i in ids for t in by[i]["verified"]}
    cand = {t for t in cand if layer_of.get(t) != "pipeline"}
    count = {t: sum(t in by[i]["verified"] for i in ids) for t in cand}
    rank = lambda t: (order.index(layer_of.get(t, order[-1])), -count[t], t)
    techs = sorted(cand, key=rank)
    tid = {t: f"k{k}" for k, t in enumerate(techs)}
    btns = [f'        <button type="button" data-v="{tid[t]}" aria-pressed="false"'
            + (' disabled class="miss"' if not count[t] else "")
            + f'>{esc(t)} <small>{count[t]}</small></button>' for t in techs]
    return btns, tid, sum(1 for t in techs if not count[t])


def card(s, sid, label_zh, label_en, attrs, chips):
    mt = meta(sid)
    en_name, en_how = mt.get("en_name") or s["name"], mt.get("en_how", "")
    extra = (f'<a href="{REPO}/blob/{BRANCH}/samples/{sid}/assets.json">{both("素材清单", "Asset list")}</a>'
             if s["id"][0] in "TG" else "")
    return f'''      <article class="card" id="{sid}" {attrs}>
        <div class="screen">
          <video data-id="{sid}" data-src="media/s/{sid}-16x9.mp4" data-poster="media/s/{sid}-16x9.jpg" muted loop playsinline preload="none" aria-label="{esc(s['name'])}"></video>
          <button type="button" class="open" aria-label="放大播放 {sid} / Play {sid} large"><span class="open-hint">{both("点击放大", "Click to enlarge")}</span></button>
          <button type="button" class="snd" aria-pressed="false">{both("声音", "Sound")}</button>
        </div>
        <p class="card-theme">{both(label_zh, label_en)}</p>
        <div class="card-meta"><code>{sid}</code><h4>{both(s["name"], en_name)}</h4></div>
        <p class="how">{both(zh_how(sid), en_how)}</p>
        <ul class="chips">{chips}</ul>
        <details><summary>{both("风格提示词", "Style prompt (Chinese)")}</summary><p lang="zh-CN">{esc(s["prompt"])}</p></details>
        <div class="links"><a href="{REPO}/tree/{BRANCH}/samples/{sid}">{both("样片代码", "Sample code")}</a><a href="{REPO}/blob/{BRANCH}/skills/ai-coding-video/{s["file"]}#{sid}">{both("词典条目", "Dictionary entry")}</a>{extra}</div>
      </article>'''


def gallery(styles, ids):
    """样片网格：最上面一排分三类（纯代码 C、实拍素材 T、AI 素材 G）；C 类再按题材、技术筛，T 类、G 类按内容类型筛。
    卡片带 data-kind、data-theme、data-tech、data-ctype，由 site.js 统一筛选"""
    by = {s["id"]: s for s in styles}
    kid = {k: [i for i in ids if i[0] == k] for k in KIND}
    cids = kid["C"]
    order = []
    for s in styles:
        if s["id"] in cids and s["theme"] not in order:
            order.append(s["theme"])
    ths = {th: f"t{k}" for k, th in enumerate(order)}
    btns, tid, miss = tech_bar(styles, cids, by)
    cts = [c["name"] for c in tags_json()["content_types"]]
    cid = {c: f"y{k}" for k, c in enumerate(cts)}
    cen, men = ctype_en(), mat_en()
    out = ['    <div class="kinds" role="group" aria-label="类型 / Class">']
    for k, (code, zh, en) in KIND.items():
        out.append(f'      <button type="button" data-kind="{code}" aria-pressed="{str(k == "C").lower()}"><b>{k}</b> {both(zh, en)} <small>{len(kid[k])}</small></button>')
    out.append('    </div>')
    out += ['    <div class="filters" id="filters">',
           f'      <div class="filter" data-dim="theme" data-kinds="c" role="group" aria-label="题材 / Theme"><span class="flab">{both("题材", "Theme")}</span>',
           f'        <button type="button" data-v="" aria-pressed="true">{both("全部", "All")} <small>{len(cids)}</small></button>']
    for th in order:
        n = sum(by[i]["theme"] == th for i in cids)
        out.append(f'        <button type="button" data-v="{ths[th]}" aria-pressed="false">{both(th, THEME_EN.get(th, th))} <small>{n}</small></button>')
    out.append('      </div>')
    out.append(f'      <div class="filter" data-dim="tech" data-kinds="c" role="group" aria-label="技术 / Technique"><span class="flab">{both("技术", "Technique")}</span>')
    out.append(f'        <button type="button" data-v="" aria-pressed="true">{both("全部", "All")} <small>{len(cids)}</small></button>')
    out += btns
    out.append('      </div>')
    out.append(f'      <div class="filter" data-dim="ctype" data-kinds="t g" role="group" aria-label="内容类型 / Content type"><span class="flab">{both("内容类型", "Content type")}</span>')
    out.append(f'        <button type="button" data-v="" aria-pressed="true">{both("全部", "All")} <small>0</small></button>')
    for c in cts:
        out.append(f'        <button type="button" data-v="{cid[c]}" aria-pressed="false">{both(c, cen.get(c, c))} <small>0</small></button>')
    out.append('      </div>')
    out.append(f'      <p class="filter-note" data-kinds="c">{both(f"数字是用到这种技术的样片数；置灰的 {miss} 种风格条目推荐过，但还没有样片。出片工具（Playwright、ffmpeg 等）每支都一样，不列在这里。", f"The number is how many samples use that technique; the {miss} greyed-out ones are recommended by style entries but have no sample yet. Output tools (Playwright, ffmpeg and the like) are the same for every sample and are left out here.")}</p>')
    out.append(f'      <p class="filter-note" data-kinds="t g">{both("同一个内容类型，T 类用真实素材、G 类用 AI 生成的素材，切换上面的类型对照着看。卡片上的标签是这支样片用到的素材。", "Within one content type, class T uses real material and class G uses AI-generated material; switch the class above to compare. The tags on each card are the materials that sample uses.")}</p>')
    out.append('    </div>')
    out.append(f'    <p class="empty" id="empty-none" hidden>{both("没有同时符合这些条件的样片。", "No sample matches these filters.")} '
               f'<button type="button" class="linkish" id="clear-filters">{both("清除筛选", "Clear filters")}</button></p>')
    if not kid["G"]:
        out.append(f'    <p class="empty kind-empty" data-kind="g" hidden>{both("G 类（AI 生成素材）的样片还在做。", "Class G (AI-generated material) samples are on the way.")}</p>')
    out.append('    <div class="cards" id="cards">')
    for th in order:
        for s in (by[i] for i in cids if by[i]["theme"] == th):
            chips = "".join(f'<li><button type="button" data-tech="{tid[t]}">{esc(t)}</button></li>' if t in tid else f"<li>{esc(t)}</li>"
                            for t in s["verified"])
            out.append(card(s, s["id"], th, THEME_EN.get(th, th),
                            f'data-kind="c" data-theme="{ths[th]}" data-tech="{" ".join(tid[t] for t in s["verified"] if t in tid)}"', chips))
    for k in "TG":
        for c in cts:
            for s in (by[i] for i in kid[k] if by[i]["content_type"] == c):
                chips = "".join(f'<li class="mat">{both(m, men.get(m, m))}</li>' for m in s["materials"])
                out.append(card(s, s["id"], c, cen.get(c, c), f'data-kind="{KIND[k][0]}" data-ctype="{cid[c]}"', chips))
    out.append("    </div>")
    # 分页：每页张数和页码按钮由 site.js 按筛选结果算；这里只放文案，好让字体裁剪带上这些字
    out.append(f'''    <nav class="pager" id="pager" aria-label="分页 / Pages" hidden>
      <button type="button" class="pg-prev">{both("上一页", "Previous")}</button>
      <span class="pg-nums"></span>
      <button type="button" class="pg-next">{both("下一页", "Next")}</button>
      <span class="pg-info"><span lang="zh">共 <b class="pg-total"></b> 支</span><span lang="en"><b class="pg-total"></b> samples</span></span>
    </nav>
    <dialog class="lb" id="lightbox" aria-label="样片 / Sample">
      <div class="lb-in">
        <video controls playsinline loop></video>
        <div class="lb-bar">
          <div class="card-meta"><code class="lb-id"></code><h4 class="lb-name"></h4></div>
          <div class="lb-btns">
            <button type="button" class="lb-prev">{both("上一支", "Previous")}</button>
            <button type="button" class="lb-next">{both("下一支", "Next")}</button>
            <button type="button" class="lb-close">{both("关闭", "Close")}</button>
          </div>
        </div>
      </div>
    </dialog>''')
    return "\n".join(out)


def pack_accents(n):
    """风格包 meta.json 里的品牌色：[[键, 中文名, 英文名, 色值], …]，第一个是默认色"""
    return json.loads((PACKS / n / "meta.json").read_text(encoding="utf-8"))["accents"]


def pack_names():
    """每种品牌色的演示片都出好了的风格包（packs/<名字>/demo/<名字>-<颜色>-<画幅>.mp4）"""
    return sorted(d.name for d in PACKS.glob("*") if (d / "meta.json").exists() and all(
        has_video(d / "demo" / f"{d.name}-{a[0]}-{ar}.mp4", f"pack-{d.name}-{a[0]}-{ar}.mp4") for a in pack_accents(d.name) for ar in ("16x9", "9x16")))


def packs_html(names):
    """「风格包」一节：每个包一块，左边演示片（跟着样片区的画幅切换，下面一排品牌色标签切换视频），右边部件和链接"""
    out = []
    for n in names:
        m = json.loads((PACKS / n / "meta.json").read_text(encoding="utf-8"))
        parts = "".join(f"<li>{both(z, e)}</li>" for z, e in m["parts"])
        acc = m["accents"]
        tabs = "".join(f'<button type="button" data-acc="{k}" aria-pressed="{str(i == 0).lower()}" style="--acc:{hexv}">'
                       f'<i aria-hidden="true"></i>{both(z, e)}</button>' for i, (k, z, e, hexv) in enumerate(acc))
        out.append(f'''    <article class="pack">
      <div class="pack-left">
      <div class="pack-screen">
        <video class="pack-video" data-id="pack-{n}-{acc[0][0]}" data-pack="{n}" data-src="media/s/pack-{n}-{acc[0][0]}-16x9.mp4" data-poster="media/s/pack-{n}-{acc[0][0]}-16x9.jpg" muted loop playsinline controls preload="none" aria-label="{esc(m["name"])}"></video>
      </div>
      <div class="pack-tabs" role="group" aria-label="品牌色 Brand color"><span class="lab">{both("换品牌色", "Brand color")}</span>{tabs}</div>
      </div>
      <div class="pack-body">
        <div class="card-meta"><code>{n}</code><h4>{both(m["name"] + "风格包", m["en_name"] + " pack")}</h4></div>
        <p class="how">{both(m["how"], m["en_how"])} {both("由 " + m["from"] + " 沉淀。", "Built from " + m["from"] + ".")}</p>
        <ul class="pack-parts">{parts}</ul>
        <div class="links"><a href="{REPO}/tree/{BRANCH}/packs/{n}">{both("风格包代码", "Pack code")}</a><a href="{REPO}/blob/{BRANCH}/packs/{n}/STYLE.md">{both("风格说明", "Style guide")}</a></div>
      </div>
    </article>''')
    return "\n".join(out)


def theme_bars(styles, ids):
    counts, done = {}, {}
    for s in styles:
        if s["id"][0] != "C":
            continue
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


def ctype_rows(styles, ids):
    """T 类、G 类按内容类型：每个内容类型两类各有几种（几种已有样片）"""
    cen, rows = ctype_en(), []
    for c in tags_json()["content_types"]:
        cell = []
        for k in "TG":
            ss = [s for s in styles if s["id"][0] == k and s.get("content_type") == c["name"]]
            cell.append(f'<span class="n">{sum(s["id"] in ids for s in ss)}/{len(ss)}</span>')
        rows.append(f'      <tr><th>{both(c["name"], c["en"])}</th><td>{cell[0]}</td><td>{cell[1]}</td></tr>')
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
        sys.exit("还没有渲染好的样片：先在 samples/ 下运行 batch.py")
    zh_l, en_l = layers(styles)
    packs = pack_names()
    tpl = (HERE / "src" / "index.html").read_text(encoding="utf-8")
    fills = {
        "{{VERSION}}": VERSION, "{{REPO}}": REPO, "{{N_STYLES}}": str(len(styles)), "{{N_SAMPLES}}": str(len(ids)), "{{N_PACKS}}": str(len(packs)), "{{PACKS}}": packs_html(packs),
        "{{GALLERY}}": gallery(styles, ids), "{{THEMES}}": theme_bars(styles, ids), "{{CTYPES}}": ctype_rows(styles, ids),
        "{{N_C}}": str(sum(s["id"][0] == "C" for s in styles)), "{{N_T}}": str(sum(s["id"][0] == "T" for s in styles)),
        "{{N_G}}": str(sum(s["id"][0] == "G" for s in styles)),
        "{{LAYERS_ZH}}": zh_l, "{{LAYERS_EN}}": en_l, "{{TEMPLATE}}": esc(template_text()),
    }
    for k, v in fills.items():
        tpl = tpl.replace(k, v)
    left = re.findall(r"{{[A-Z_]+}}", tpl)
    if left:
        sys.exit(f"模板里还有没填的占位符：{left}")
    (HERE / "index.html").write_text(tpl, encoding="utf-8")

    media = HERE / "media"
    media.mkdir(exist_ok=True)
    for p in media.glob("*"):   # 原版每次重拷；小版 media/s/ 留着，原版没变的 small.py 不重出
        if p.is_file():
            p.unlink()
    missing = 0   # 本地没下载的视频不拷，本地预览就只有静帧；线上发布时从 Release 下载
    for src, dst in [(SAMPLES / sid / f"{sid}-{ar}.{ext}", f"{sid}-{ar}.{ext}") for sid in ids for ar in ("16x9", "9x16") for ext in ("mp4", "jpg")] + \
            [(PACKS / n / "demo" / f"{n}-{a[0]}-{ar}.{ext}", f"pack-{n}-{a[0]}-{ar}.{ext}")
             for n in packs for a in pack_accents(n) for ar in ("16x9", "9x16") for ext in ("mp4", "jpg")]:
        if src.exists():
            shutil.copy2(src, media / dst)
        else:
            missing += 1
    if missing:
        print(f"本地缺 {missing} 个视频，预览里只有静帧；要看视频先跑 python3 scripts/media.py pull")
    small.main()   # 卡片用的小视频、小静帧 → media/s/

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
    print(f"写好 site/index.html：{len(ids)} 个样片，{len(packs)} 个风格包，{len(styles)} 种风格；整站 {size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
