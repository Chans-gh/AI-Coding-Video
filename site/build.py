"""生成介绍页：python3 site/build.py [--page | --font-packages]

--page 只出 index.html 和字体，不拷媒体、不出小版（发布时媒体由 .github/workflows/pages.yml 准备）。
--font-packages 打出要用的字体包和版本（版本取 samples/package.json），发布时只装这几个。
index.html、fonts/、media/ 都是生成物，不进仓库，发布时在 CI 里生成。

读 Skill 的 data/styles.json 和 samples/ 里已渲染的样片，把 src/index.html 填好写成 site/index.html，
把样片视频和静帧拷进 site/media/，再由 small.py 出卡片用的小版（site/media/s/），按页面实际用到的字把字体裁成小文件放进 site/fonts/。
页面里的数字（风格总数、样片数、各题材数量）都在这里算，不要手改 index.html。
需要：samples/ 下先 npm install（字体来自 @fontsource；环境变量 FONTSRC 可指向别处的 @fontsource 目录），Python 装 fontTools 和 brotli。
"""
import hashlib
import html
import json
import os
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
FONTSRC = Path(os.environ.get("FONTSRC") or SAMPLES / "node_modules" / "@fontsource")

VERSION = "v20 · 2026-11-09"
CASE_ORDER = ["news-artemis", "course-first-video", "shop-handbag"]  # 「真实应用」卡片的先后：第 1、2、3 支
REPO = "https://github.com/Chans-gh/AI-Coding-Video"
BRANCH = "main"

THEME_EN = {
    "手绘与绘画": "Hand-drawn & painting", "3D 与实时图形": "3D & real-time graphics",
    "信息讲解与产品发布": "Explainers & launches", "电影年代与屏幕科技": "Film eras & screen tech",
    "平面设计与动态排版": "Graphic design & motion type", "印刷、版画与装饰": "Print & ornament",
    "卡通与动漫": "Cartoon & anime", "纸艺、材质与定格": "Paper, material & stop-motion",
    "东方传统": "East Asian traditions", "游戏": "Games",
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


def tag_en():
    """C 类技术标签的英文名：大多本身就是英文，不是的登记在 tags.json 的 tags_en"""
    return tags_json().get("tags_en", {})


def tag_label(t, en):
    return both(t, en[t]) if t in en else esc(t)


def tq_en():
    """T、G 类技术类型的英文名：tags.json 的 techniques"""
    return {t["name"]: t["en"] for t in tags_json()["techniques"]}


def row(zh, en, chips, cls):
    """卡片上带标签的一行（技术、素材），三类格式一样"""
    return f'<div class="card-row {cls}"><span class="row-lab">{both(zh, en)}</span><ul class="chips">{chips}</ul></div>'


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
    ten = tag_en()
    tid = {t: f"k{k}" for k, t in enumerate(techs)}
    btns = [f'        <button type="button" data-v="{tid[t]}" aria-pressed="false"'
            + (' disabled class="miss"' if not count[t] else "")
            + f'>{tag_label(t, ten)} <small>{count[t]}</small></button>' for t in techs]
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
        <div class="how-box"><p class="how">{both(zh_how(sid), en_how)}</p><button type="button" class="more" aria-expanded="false" hidden>{both("更多", "More")}</button></div>
        {chips}
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
    cen, men, ten, gen = ctype_en(), mat_en(), tq_en(), tag_en()
    tqs = tags_json()["techniques"]
    qid = {t["name"]: f"q{k}" for k, t in enumerate(tqs)}
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
    # T、G 类的技术类型：两类各自的取值都列上，site.js 只露出当前类型的；数字和置灰也由 site.js 按筛选结果算
    out.append(f'      <div class="filter" data-dim="qtech" data-kinds="t g" role="group" aria-label="技术 / Technique"><span class="flab">{both("技术", "Technique")}</span>')
    out.append(f'        <button type="button" data-v="" aria-pressed="true">{both("全部", "All")} <small>0</small></button>')
    for t in tqs:
        out.append(f'        <button type="button" data-v="{qid[t["name"]]}" data-k="{t["class"].lower()}" aria-pressed="false">{both(t["name"], t["en"])} <small>0</small></button>')
    out.append('      </div>')
    out.append(f'      <p class="filter-note" data-kinds="c">{both(f"数字是用到这种技术的样片数；置灰的 {miss} 种风格条目推荐过，但还没有样片。出片工具（Playwright、ffmpeg 等）每支都一样，不列在这里。", f"The number is how many samples use that technique; the {miss} greyed-out ones are recommended by style entries but have no sample yet. Output tools (Playwright, ffmpeg and the like) are the same for every sample and are left out here.")}</p>')
    out.append(f'      <p class="filter-note" data-kinds="t g">{both("同一个内容类型，T 类用真实素材、G 类用 AI 生成的素材，切换上面的类型对照着看。技术的数字是用到这种做法的样片数，置灰的还没有样片；卡片上点技术标签也能筛。", "Within one content type, class T uses real material and class G uses AI-generated material; switch the class above to compare. The number next to a technique is how many samples use it, greyed-out ones have none yet; tapping a technique tag on a card filters too.")}</p>')
    out.append('    </div>')
    out.append(f'    <p class="empty" id="empty-none" hidden>{both("没有同时符合这些条件的样片。", "No sample matches these filters.")} '
               f'<button type="button" class="linkish" id="clear-filters">{both("清除筛选", "Clear filters")}</button></p>')
    if not kid["G"]:
        out.append(f'    <p class="empty kind-empty" data-kind="g" hidden>{both("G 类（AI 生成素材）的样片还在做。", "Class G (AI-generated material) samples are on the way.")}</p>')
    out.append('    <div class="cards" id="cards">')
    for th in order:
        for s in (by[i] for i in cids if by[i]["theme"] == th):
            chips = row("技术", "Technique", "".join(f'<li><button type="button" data-tech="{tid[t]}">{tag_label(t, gen)}</button></li>' if t in tid else f"<li>{tag_label(t, gen)}</li>"
                                                for t in s["verified"]), "row-tech")
            out.append(card(s, s["id"], th, THEME_EN.get(th, th),
                            f'data-kind="c" data-theme="{ths[th]}" data-tech="{" ".join(tid[t] for t in s["verified"] if t in tid)}"', chips))
    for k in "TG":
        for c in cts:
            for s in (by[i] for i in kid[k] if by[i]["content_type"] == c):
                chips = (row("技术", "Technique", "".join(f'<li class="tq"><button type="button" data-qtech="{qid[t]}">{both(t, ten.get(t, t))}</button></li>' for t in s.get("techniques", [])), "row-tech")
                         + row("素材", "Material", "".join(f'<li class="mat">{both(m, men.get(m, m))}</li>' for m in s["materials"]), "row-mat"))
                out.append(card(s, s["id"], c, cen.get(c, c), f'data-kind="{KIND[k][0]}" data-ctype="{cid[c]}" data-qtech="{" ".join(qid[t] for t in s.get("techniques", []))}"', chips))
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
    """风格包 meta.json 里的几种切换：[[键, 中文名, 英文名, 值], …]，第一个是默认。切品牌色的写 accents（值是色值），
    切别的维度（画面组织、画风…）的写 variants，维度名在 switch"""
    m = json.loads((PACKS / n / "meta.json").read_text(encoding="utf-8"))
    return m.get("variants") or m["accents"]


def pack_names():
    """每种切换的演示片都出好了的风格包（packs/<名字>/demo/<名字>-<键>-<画幅>.mp4）"""
    return sorted(d.name for d in PACKS.glob("*") if (d / "meta.json").exists() and all(
        has_video(d / "demo" / f"{d.name}-{a[0]}-{ar}.mp4", f"pack-{d.name}-{a[0]}-{ar}.mp4") for a in pack_accents(d.name) for ar in ("16x9", "9x16")))


def packs_html(names):
    """「风格包」一节：每个包一块，左边演示片（跟着样片区的画幅切换，下面一排标签切换视频：品牌色，或 meta.json 的 switch 写的维度），右边部件和链接"""
    out = []
    for n in names:
        m = json.loads((PACKS / n / "meta.json").read_text(encoding="utf-8"))
        parts = "".join(f"<li>{both(z, e)}</li>" for z, e in m["parts"])
        acc = pack_accents(n)
        sw = m.get("switch")
        lab_z, lab_e = ("换" + sw[0], sw[1]) if sw else ("换品牌色", "Brand color")
        tabs = "".join(f'<button type="button" data-acc="{k}" aria-pressed="{str(i == 0).lower()}"'
                       + (f' style="--acc:{v}"><i aria-hidden="true"></i>' if not sw else '>')
                       + f'{both(z, e)}</button>' for i, (k, z, e, v) in enumerate(acc))
        out.append(f'''    <article class="pack">
      <div class="pack-left">
      <div class="pack-screen">
        <video class="pack-video" data-id="pack-{n}-{acc[0][0]}" data-pack="{n}" data-src="media/s/pack-{n}-{acc[0][0]}-16x9.mp4" data-poster="media/s/pack-{n}-{acc[0][0]}-16x9.jpg" muted loop playsinline controls preload="none" aria-label="{esc(m["name"])}"></video>
      </div>
      <div class="pack-tabs" role="group" aria-label="{esc(lab_z[1:] + " " + lab_e)}"><span class="lab">{both(lab_z, lab_e)}</span>{tabs}</div>
      </div>
      <div class="pack-body">
        <div class="card-meta"><code>{n}</code><h4>{both(m["name"] + "风格包", m["en_name"] + " pack")}</h4></div>
        <p class="how">{both(m["how"], m["en_how"])} {both("由 " + m["from"] + " 沉淀。", "Built from " + m["from"] + ".")}</p>
        <ul class="pack-parts">{parts}</ul>
        <div class="links"><a href="{REPO}/tree/{BRANCH}/packs/{n}">{both("风格包代码", "Pack code")}</a><a href="{REPO}/blob/{BRANCH}/packs/{n}/STYLE.md">{both("风格说明", "Style guide")}</a></div>
      </div>
    </article>''')
    return "\n".join(out)


HERO_NOTE = {  # 首页轮播每类一句：素材怎么来、代码做什么
    "C": ("画面全部由代码算出，没有一张现成图片", "Every pixel is computed by code; no ready-made image"),
    "T": ("真实素材（{m}）交给代码，代码排版、加动效", "Real material ({m}) handed to code for layout and motion"),
    "G": ("AI 生成的素材（{m}）交给代码，代码剪辑、加动效", "AI-generated material ({m}) handed to code for editing and motion"),
}


def hero_html(styles):
    """首页轮播：small.HERO 里每类一支，下面一排圆点切换；视频用 media/m/ 的 1280 宽版。时长和帧数由 site.js 读视频得到"""
    by, men = {s["id"]: s for s in styles}, mat_en()
    slides, dots = [], []
    for k, sid in enumerate(small.HERO):
        s, mt = by[sid], meta(sid)
        cls = sid[0]
        zh, en = HERO_NOTE[cls]
        mats = s.get("materials", [])
        zh, en = zh.format(m="、".join(mats)), en.format(m=", ".join(men.get(x, x).lower() for x in mats))
        name_en = mt.get("en_name") or s["name"]
        slides.append(f'        <figcaption data-i="{k}"{"" if k == 0 else " hidden"}>'
                      f'<span lang="zh">{sid} {esc(s["name"])} · {KIND[cls][1]} · {zh}。拖动下面的时间轴，画面只跟着 t 变。</span>'
                      f'<span lang="en">{sid} {esc(name_en)} · {KIND[cls][2]} · {en}. Drag the timeline: the picture depends on t alone.</span></figcaption>')
        dots.append(f'<button type="button" data-i="{k}" data-id="{sid}" aria-pressed="{str(k == 0).lower()}" '
                    f'aria-label="{sid} {esc(s["name"])} / {esc(name_en)}"></button>')
    first = small.HERO[0]
    return f'''    <figure class="scrub" id="scrub">
      <div class="scrub-screen">
        <video id="hero-video" src="media/m/{first}-16x9.mp4" poster="media/m/{first}-16x9.jpg" muted playsinline autoplay preload="auto"></video>
      </div>
      <div class="hero-dots" role="group" aria-label="换一支 / Switch sample">{"".join(dots)}</div>
      <div class="scrub-read" aria-live="off">
        <code class="tc">t = <b id="tc-t">0.000</b> s</code>
        <code class="tc"><span lang="zh">帧</span><span lang="en">frame</span> <b id="tc-f">0</b> / <span id="tc-n">0</span></code>
        <code class="tc fn">draw(ctx, t)</code>
      </div>
      <label class="ruler" for="scrub-range">
        <span class="sr"><span lang="zh">拖动时间轴</span><span lang="en">Drag the timeline</span></span>
        <input type="range" id="scrub-range" min="0" max="89" step="1" value="0">
        <span class="ticks" aria-hidden="true"></span>
      </label>
{chr(10).join(slides)}
    </figure>'''


def templates():
    """prompting.md 「通用模板」里三类各一份：[(类, 模板文字)]，按 C、T、G 的顺序"""
    s = (SKILL / "prompting.md").read_text(encoding="utf-8")
    s = s[s.index("通用模板"):]
    out = re.findall(r"\*\*[^*\n]*（([CTG]) 类）\*\*\n\n```text\n(.*?)\n```", s, re.S)
    if [k for k, _ in out] != list("CTG"):
        sys.exit("prompting.md 的通用模板要有纯代码（C 类）、真实素材（T 类）、AI 生成素材（G 类）三份")
    return out


def template_html():
    """提示词一节的模板：三类各一块，上面一排按钮切换，复制的是当前那块"""
    btns, pres = [], []
    for k, (cls, text) in enumerate(templates()):
        _, zh, en = KIND[cls]
        btns.append(f'<button type="button" data-tpl="{cls}" aria-pressed="{str(k == 0).lower()}"><b>{cls}</b> {both(zh, en)}</button>')
        pres.append(f'      <pre class="code" tabindex="0" data-tpl="{cls}"{"" if k == 0 else " hidden"}><code id="tpl-{cls}">{esc(text)}</code></pre>')
    return (f'      <div class="tpl-tabs" role="group" aria-label="模板 / Template">{"".join(btns)}</div>\n' + "\n".join(pres))


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
        # 创建、修改时间都用原字体的，同样的字重新生成出来逐字节相同，不会每次构建都多出一份字体改动
        head = TTFont(files[0])["head"]
        merged.recalcTimestamp = False
        merged["head"].created, merged["head"].modified = head.created, head.modified
        merged.save(out)
    return len(files)


def page_chars(text):
    body = re.sub(r"<script.*?</script>|<style.*?</style>", "", text, flags=re.S)
    body = html.unescape(re.sub(r"<[^>]+>", "", body))
    chars = set(body) | set(chr(c) for c in range(0x20, 0x7F)) | set("“”‘’—–…·、，。：；！？（）《》「」【】×÷")
    return {c for c in chars if not c.isspace() or c == " "}


CASES = REPO_DIR / "cases"
CASE_KIND = {"C": ("c", "C 代码画", "C · code"), "T": ("t", "T 真实素材", "T · real material"), "G": ("g", "G AI 生成", "G · AI-generated")}


def md_inline(s):
    """case.json、log.md 里的行内 Markdown：链接、代码；样片编号 [C-038] 链到页面里那张卡片"""
    out, pos = [], 0
    for m in re.finditer(r"\[([^\]]+)\]\((https?://[^)\s]+)\)|`([^`]+)`|\[([CTG]-\d{3})\]", s):
        out.append(esc(s[pos:m.start()]))
        if m.group(2):
            out.append(f'<a href="{esc(m.group(2))}">{esc(m.group(1))}</a>')
        elif m.group(3):
            out.append(f"<code>{esc(m.group(3))}</code>")
        else:
            out.append(f'<a href="#{m.group(4)}">{m.group(4)}</a>')
        pos = m.end()
    return "".join(out) + esc(s[pos:])


def mmss(t):
    t = int(round(t))
    return f"{t // 60}:{t % 60:02d}"


def case_dirs():
    """有 case.json 的案例，做完的排前面，同样做完的按做完的先后（CASE_ORDER，没列的排最后）"""
    cs = [(d.name, json.loads((d / "case.json").read_text(encoding="utf-8"))) for d in sorted(CASES.glob("*")) if (d / "case.json").exists()]
    rank = {n: i for i, n in enumerate(CASE_ORDER)}
    return sorted(cs, key=lambda x: (x[1]["status"] != "完成", rank.get(x[0], len(rank))))


def case_ready(n, c):
    """做完、成片和封面登记在 media.json、每段有实际起止的才放播放器；其余只出一张「制作中」的卡片"""
    return c["status"] == "完成" and all(f"case-{n}{x}" in LISTED for x in ("-mid.mp4", ".mp4", ".jpg")) \
        and all("start" in s for s in c["segments"])


def log_summary(n):
    """log.md 末尾「## 汇总」下面的表：[(项目, 数, 说明)]"""
    p = CASES / n / "log.md"
    text = p.read_text(encoding="utf-8") if p.exists() else ""
    if "## 汇总" not in text:
        return []
    rows = []
    for ln in text.split("## 汇总", 1)[1].splitlines():
        if ln.startswith("## "):
            break
        cells = [x.strip() for x in ln.strip().strip("|").split("|")]
        if ln.startswith("|") and len(cells) >= 2 and not set(cells[0]) <= set("-: ") and cells[0] != "项目":
            rows.append((cells + ["", ""])[:3])
    return rows


def use_kind(u):
    """一条技术的类别：跟样片走，风格包跟它沉淀自的样片走，没样片的看 class（和 cases/tools/build.py 一致）"""
    r = u.get("ref")
    if not r:
        return u["class"]
    if r.startswith("pack:"):
        return json.loads((PACKS / r[5:] / "meta.json").read_text(encoding="utf-8"))["from"][0]
    return r[0]


def ref_link(r, by):
    if r.startswith("pack:"):
        return f'<a href="#packs">{both("风格包 " + r[5:], "pack " + r[5:])}</a>'
    return f'<a href="#{r}">{r} {esc(by.get(r, {}).get("name", ""))}</a>'


def case_html(n, c, by):
    segs, end = c["segments"], c["segments"][-1]["end"]
    lead_sec = dict.fromkeys("CTG", 0.0)
    for s in segs:
        lead_sec[s["lead"]] += s["end"] - s["start"]
    bar = "".join(f'<button type="button" class="cb k-{CASE_KIND[s["lead"]][0]}" style="flex-grow:{s["end"] - s["start"]:.2f}" data-i="{i}" '
                  f'aria-label="{i + 1} {esc(s["title"])}" title="{i + 1} {esc(s["title"])}"></button>' for i, s in enumerate(segs))
    toc = "".join(f'<li><button type="button" data-i="{i}" aria-pressed="{str(i == 0).lower()}"><i class="kd k-{CASE_KIND[s["lead"]][0]}"></i>'
                  f'<code>{mmss(s["start"])}</code>{esc(s["title"])}</button></li>' for i, s in enumerate(segs))
    cards = []
    for i, s in enumerate(segs):
        used = {use_kind(u) for u in s["uses"]}
        chips = "".join(f'<span class="kc k-{CASE_KIND[k][0]}{" on" if k in used else ""}{" lead" if k == s["lead"] else ""}">{both(CASE_KIND[k][1], CASE_KIND[k][2])}</span>' for k in "CTG")
        uses = "".join(f'<li><i class="kd k-{CASE_KIND[use_kind(u)][0]}" title="{use_kind(u)}"></i><span>{esc(u["what"])}</span>'
                       f'{ref_link(u["ref"], by) if u.get("ref") else ""}</li>' for u in sorted(s["uses"], key=lambda u: "CTG".index(use_kind(u))))
        note = f'<p class="cs-note"><b>{both("编排", "How it is built")}</b>{esc(s["note"])}</p>' if s.get("note") else ""
        swap = f'<p class="cs-swap"><b>{both("换掉会怎样", "Without it")}</b>{esc(s["swap"])}</p>' if s.get("swap") else ""
        cards.append(f'''          <section class="cs" data-i="{i}" data-s="{s["start"]:.2f}" data-e="{s["end"]:.2f}"{"" if i == 0 else " hidden"}>
            <p class="cs-time"><code>{mmss(s["start"])}–{mmss(s["end"])}</code>{both(f"第 {i + 1} 段", f"Part {i + 1}")}</p>
            <h4>{esc(s["title"])}<small>{esc(s["content"])}</small></h4>
            <div class="cs-kinds">{chips}</div>
            <ul class="cs-uses">{uses}</ul>
            {note}{swap}
          </section>''')
    split = "".join(f'<span class="k-{CASE_KIND[k][0]}" style="flex-grow:{lead_sec[k]:.2f}">{k} {mmss(lead_sec[k])}</span>' for k in "CTG" if lead_sec[k])
    refs = sorted({u["ref"] for s in segs for u in s["uses"] if u.get("ref")} | {u["ref"] for x in c.get("extras", []) for u in x.get("uses", []) if u.get("ref")})
    usage = "".join(f'<tr><td>{esc(u["item"])}</td><td>{esc(u["qty"])}</td><td>{"—" if u.get("cost") is None else u["cost"]}</td></tr>' for u in c["usage"])
    logrows = "".join(f"<tr><td>{esc(a)}</td><td>{esc(b)}</td><td>{md_inline(x)}</td></tr>" for a, b, x in log_summary(n))
    logtab = f'<h5>{both("用时和用量（制作记录）", "Time and usage (production log)")}</h5><table class="cs-tab log">{logrows}</table>' if logrows else ""
    compare = "".join(f'<li><b>{esc(x["side"])}</b>{md_inline(x["text"])}</li>' for x in c["compare"])
    down = "".join(f"<li>{md_inline(d)}</li>" for d in c["downgrade"]) + "".join(
        f'<li><b>{both(f"第 {i + 1} 段", f"Part {i + 1}")} {esc(s["title"])}</b>{esc(s["swap"])}</li>' for i, s in enumerate(segs) if s.get("swap"))
    extras = "".join(f'<li>{x["count"]} × {x["sec"]}s · {esc(x["what"])}</li>' for x in c.get("extras", []))
    extras = f'<h5>{both("附带成片", "Extra cuts")}</h5><ul class="sum-list">{extras}</ul>' if extras else ""
    return f'''    <article class="case" data-case="{n}" data-ar="{c["ar"].replace(":", "x")}" hidden>
      <div class="case-main">
        <div class="case-screen"><video data-src="media/case-{n}-mid.mp4" data-poster="media/case-{n}.jpg" controls playsinline preload="none" aria-label="{esc(c["title"])}"></video></div>
        <div class="case-bar" data-dur="{end:.2f}">{bar}<i class="cb-head" aria-hidden="true"></i></div>
        <p class="case-links"><a href="media/case-{n}.mp4">{both("原版 1080p", "Full 1080p")}</a><a href="{REPO}/tree/{BRANCH}/cases/{n}">{both("分镜和代码", "Storyboard & code")}</a><a href="{REPO}/blob/{BRANCH}/cases/{n}/log.md">{both("制作记录", "Production log")}</a></p>
      </div>
      <div class="case-side">
        <ol class="case-toc">{toc}</ol>
        <div class="case-segs">
{chr(10).join(cards)}
        </div>
        <details class="case-sum">
          <summary>{both("整支汇总", "Whole-video summary")}</summary>
          <h5>{both("三类各占多少（按每段的主角类）", "Share of each kind (by each part's lead)")}</h5>
          <div class="sum-split">{split}</div>
          <h5>{both("用到的样片和风格包", "Samples and packs used")}</h5>
          <p class="sum-refs">{" ".join(ref_link(r, by) for r in refs)}</p>
          {extras}
          <h5>{both("生成用量（青水算力）", "Generation usage (credits)")}</h5>
          <table class="cs-tab">{usage}</table>
          {logtab}
          <h5>{both("和人工、过去的 AI 工具比", "Versus manual work and earlier AI tools")}</h5>
          <ul class="sum-list">{compare}</ul>
          <h5>{both("降级用法", "Simpler versions")}</h5>
          <ul class="sum-list">{down}</ul>
        </details>
      </div>
    </article>'''


def cases_html(styles):
    """「真实应用」一节：每个案例一张卡片，只加载封面；点开后下面出播放器（中版）和跟着进度切段的说明栏。数据读 cases/<名字>/case.json"""
    by = {s["id"]: s for s in styles}
    cards, arts = [], []
    for n, c in case_dirs():
        ready, k, segs = case_ready(n, c), CASE_KIND[c["lead"]], c["segments"]
        dur = segs[-1]["end"] if ready else sum(s["sec"] for s in segs)
        meta_line = f'<span class="kc k-{k[0]} on lead">{both(k[1], k[2])}</span><span>{c["ar"]} · {mmss(dur)}</span>'
        body = f'<span class="cc-body"><span class="cc-meta">{meta_line}</span><b>{esc(c["title"])}</b><span class="cc-sum">{esc(c["summary"])}</span></span>'
        if ready:
            cards.append(f'''      <button type="button" class="case-card" data-case="{n}" aria-pressed="false">
        <span class="cc-cover"><span class="cc-blur" style="background-image:url(media/case-{n}.jpg)"></span><img src="media/case-{n}.jpg" alt="" loading="lazy"><span class="cc-play" aria-hidden="true">▶</span></span>
        {body}
      </button>''')
            arts.append(case_html(n, c, by))
        else:
            cards.append(f'''      <div class="case-card soon">
        <span class="cc-cover"><span class="cc-soon">{both("制作中", "In production")}</span></span>
        {body}
      </div>''')
    return f'''    <div class="case-cards">
{chr(10).join(cards)}
    </div>
    <div class="case-stage" hidden>
{chr(10).join(arts)}
    </div>'''


def main():
    if "--font-packages" in sys.argv:
        print(" ".join(font_packages()))
        return
    styles = load_styles()
    ids = sample_ids(styles)
    if not ids:
        sys.exit("还没有渲染好的样片：先在 samples/ 下运行 batch.py")
    packs = pack_names()
    tpl = (HERE / "src" / "index.html").read_text(encoding="utf-8")
    fills = {
        "{{VERSION}}": VERSION, "{{REPO}}": REPO, "{{N_STYLES}}": str(len(styles)), "{{N_SAMPLES}}": str(len(ids)), "{{N_PACKS}}": str(len(packs)), "{{PACKS}}": packs_html(packs),
        "{{GALLERY}}": gallery(styles, ids),
        "{{N_C}}": str(sum(s["id"][0] == "C" for s in styles)), "{{N_T}}": str(sum(s["id"][0] == "T" for s in styles)),
        "{{N_G}}": str(sum(s["id"][0] == "G" for s in styles)),
        "{{HERO}}": hero_html(styles), "{{TEMPLATE}}": template_html(), "{{CASES}}": cases_html(styles),
    }
    for k, v in fills.items():
        tpl = tpl.replace(k, v)
    # 样式和脚本带上内容指纹，改了以后浏览器不会继续用缓存里的旧文件
    for name in ("site.css", "site.js"):
        tag = hashlib.sha256((HERE / "assets" / name).read_bytes()).hexdigest()[:10]
        tpl = tpl.replace(f'"assets/{name}"', f'"assets/{name}?v={tag}"')
    left = re.findall(r"{{[A-Z_]+}}", tpl)
    if left:
        sys.exit(f"模板里还有没填的占位符：{left}")
    (HERE / "index.html").write_text(tpl, encoding="utf-8")
    if "--page" not in sys.argv:
        copy_media(ids, packs)
    make_fonts(tpl)
    size = sum(p.stat().st_size for p in HERE.rglob("*") if p.is_file() and "src" not in p.parts)
    print(f"写好 site/index.html：{len(ids)} 个样片，{len(packs)} 个风格包，{len(styles)} 种风格；整站 {size / 1e6:.1f} MB")


def copy_media(ids, packs):
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
    for name, rec in LISTED.items():   # 案例的成片和封面：cases/<名字>/media/ → media/case-…（已下载的才拷）
        if name.startswith("case-") and (REPO_DIR / rec["path"]).exists():
            shutil.copy2(REPO_DIR / rec["path"], media / name)
    if missing:
        print(f"本地缺 {missing} 个视频，预览里只有静帧；要看视频先跑 python3 scripts/media.py pull")
    small.main()   # 卡片用的小视频、小静帧 → media/s/


# 页面用的字体：(@fontsource 包, 字重, 输出名, 是否只要拉丁字符)
FONTS = [("noto-sans-sc", 400, "sans-400", False), ("noto-sans-sc", 700, "sans-700", False),
         ("noto-serif-sc", 900, "serif-900", False),
         ("jetbrains-mono", 400, "mono-400", True), ("jetbrains-mono", 700, "mono-700", True)]


def font_packages():
    deps = json.loads((SAMPLES / "package.json").read_text(encoding="utf-8"))["dependencies"]
    return [f"@fontsource/{pkg}@{deps['@fontsource/' + pkg]}" for pkg in dict.fromkeys(f[0] for f in FONTS)]


def make_fonts(tpl):
    if not FONTSRC.exists():
        sys.exit("缺字体：先在 samples/ 下运行 npm install")
    fonts = HERE / "fonts"
    fonts.mkdir(exist_ok=True)
    chars = page_chars(tpl)
    ascii_ = {c for c in chars if ord(c) < 0x250}
    for pkg, w, name, latin in FONTS:
        n = make_font(pkg, w, ascii_ if latin else chars, fonts / f"{name}.woff2")
        print(f"字体 {name}：{n} 个分片 → {(fonts / f'{name}.woff2').stat().st_size / 1e3:.0f} KB")


if __name__ == "__main__":
    main()
