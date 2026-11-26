#!/usr/bin/env python3
"""轻量风格包脚手架 & 个人风格库管理（~/aicv-my-styles/）。只用 Python 标准库。

    python3 new_pack.py my-green --from C-044 --accent '#2BD99F' --name '绿科技简报' --my-styles
    python3 new_pack.py my-news --from T-007 --switch 画面组织 --variant single --my-styles
    python3 new_pack.py --save ../packs/my-green              # 把项目里已有的风格包保存到 ~/aicv-my-styles/
    python3 new_pack.py --list                               # 列出 ~/aicv-my-styles/ 里已保存的个人风格包

生成轻量起步包（1 套选定配置、最小骨架 + 4 个核心部件、12 秒演示片；不覆盖已有文件）：
  1. 跑单帧对比：python3 batch.py pack:<slug> --vs <原样片编号> --ar 16x9
  2. 跑快速自检：python3 batch.py pack:<slug> --quick --ar 16x9
  3. 再按需逐个往 pack.js 加部件，每次加 1–2 个并跑一次 --quick
"""
import argparse
import json
import os
import re
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
_CANDIDATES = ([Path(os.environ["AICV_SKILL"])] if os.environ.get("AICV_SKILL") else []) + [
    HERE.parent / "skills" / "ai-coding-video",
    HERE.parent,
]
STYLES = next((d / "data" / "styles.json" for d in _CANDIDATES if (d / "data" / "styles.json").exists()), None)
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
SKIP_COPY_DIRS = {"out", "__pycache__", "node_modules", ".git"}


def my_styles_dir():
    """用户跨项目保存的个人风格包目录（AICV_MY_STYLES 优先，默认 ~/aicv-my-styles）"""
    v = os.environ.get("AICV_MY_STYLES")
    return Path(v).expanduser() if v else Path.home() / "aicv-my-styles"


def load_styles():
    if STYLES is None:
        sys.exit("找不到风格数据 data/styles.json：设环境变量 AICV_SKILL=<Skill 目录>")
    d = json.loads(STYLES.read_text(encoding="utf-8"))
    return {s["id"]: s for s in (d if isinstance(d, list) else d["styles"])}


def normalize_hex(h):
    h = (h or "#2BD99F").strip()
    if not h.startswith("#"):
        h = "#" + h
    if re.fullmatch(r"#[0-9a-fA-F]{3}", h):
        h = "#" + "".join(c * 2 for c in h[1:])
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", h):
        sys.exit(f"颜色格式不对：{h!r}（需要 #RRGGBB）")
    return h.upper()


def build_meta(slug, name, style, accent, switch_name, variant_key):
    sid = style["id"]
    cls = sid[:1]
    meta = {
        "from": sid,
        "name": name,
        "en_name": slug.replace("-", " ").title(),
        "how": f"由 {sid}（{style['name']}）沉淀的轻量起步包（1 套配置，4 个核心部件 + 4 个基础层，按需扩充）。",
        "en_how": f"Lightweight starter pack derived from {sid} (single configuration, 4 core parts + 4 base layers).",
        "parts": [
            ["开场", "Opener", "seg"],
            ["标题卡片", "Headline", "seg"],
            ["数据指标", "Metric", "seg"],
            ["片尾", "Outro", "seg"],
            ["背景", "Backdrop", "layer"],
            ["转场", "Transitions", "layer"],
            ["角标", "Corner bug", "layer"],
            ["字幕", "Captions", "layer"],
        ],
    }
    if switch_name or cls in "TG":
        sw = switch_name or ("画面组织" if cls == "T" else "画风")
        vk = variant_key or ("single" if cls == "T" else "primary")
        vl = "单图推拉" if (cls == "T" and vk == "single") else "选定画风" if (cls == "G" and vk == "primary") else vk
        meta["switch"] = [sw, sw]
        meta["variants"] = [[vk, vl, vk.title(), vk]]
    else:
        meta["accents"] = [["primary", "主色", "Primary", accent]]
    return meta


PACK_JS = """// 轻量风格包（由 {sid} {style_name} 起步）：4 个核心部件 + 4 个基础层；先验单帧再按需扩充。
// 依赖 samples/lib/lib.js 的 W H LAND SHORT clamp inv smooth lerp eOutCubic eOutBack rr wrapCJK mk。
const PACK = (() => {{
  const hex = h => {{
    const s = (h || '{accent}').replace('#', '');
    const f = s.length === 3 ? s.split('').map(c => c + c).join('') : s.padEnd(6, '0').slice(0, 6);
    return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16));
  }};
  const css = (c, a = 1) => `rgba(${{c[0] | 0}},${{c[1] | 0}},${{c[2] | 0}},${{a}})`;
  const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

  function theme(o = {{}}) {{
    const ac = hex(o.accent || '{accent}');
    return {{
      ac,
      a: (al = 1) => css(ac, al),
      hi: css(mix(ac, [255, 255, 255], .55)),
      bg0: '#07090F',
      bg1: css(mix([14, 18, 30], ac, .14)),
      panel: 'rgba(255,255,255,.06)',
      ink: '#F4F6FA',
      muted: 'rgba(244,246,250,.66)',
      grid: 'rgba(255,255,255,.045)',
      head: "'Noto Sans SC'",
      num: "'Bebas Neue'",
      mono: "'JetBrains Mono'",
      u: SHORT / 1080,
      variant: o.variant || 'primary',
    }};
  }}

  const F = (K, w, px, fam = K.head) => `${{w}} ${{Math.round(px * K.u)}}px ${{fam}}`;
  let OFF = null;
  const off = () => {{
    OFF = OFF || mk(W, H);
    const o = OFF.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, W, H);
    return o;
  }};

  function backdrop(ctx, K, t) {{
    const g = ctx.createRadialGradient(W * .5, H * .36, 0, W * .5, H * .48, Math.max(W, H) * .72);
    g.addColorStop(0, K.bg1);
    g.addColorStop(1, K.bg0);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const step = 64 * K.u;
    ctx.strokeStyle = K.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = (W / 2) % step; x <= W; x += step) {{ ctx.moveTo(x, 0); ctx.lineTo(x, H); }}
    for (let y = (H / 2) % step; y <= H; y += step) {{ ctx.moveTo(0, y); ctx.lineTo(W, y); }}
    ctx.stroke();
    const gx = W * (.5 + .22 * Math.sin(t * .65)), gy = H * (.42 + .12 * Math.cos(t * .5));
    const gl = ctx.createRadialGradient(gx, gy, 0, gx, gy, SHORT * .75);
    gl.addColorStop(0, K.a(.2));
    gl.addColorStop(1, K.a(0));
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, W, H);
  }}

  function card(ctx, K, x, y, w, h, r = 24) {{
    rr(ctx, x, y, w, h, r * K.u);
    ctx.fillStyle = K.panel;
    ctx.fill();
    ctx.strokeStyle = K.a(.28);
    ctx.lineWidth = 2 * K.u;
    ctx.stroke();
  }}

  function opener(ctx, K, t, o) {{
    const u = K.u, p = eOutCubic(clamp(t / .7)), drift = Math.sin(t * 2.1) * 10 * u;
    const cx = W / 2, cy = H * (LAND ? .46 : .43) + drift;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = K.a(.18);
    rr(ctx, cx - 150 * u, cy - 132 * u, 300 * u, 44 * u, 22 * u);
    ctx.fill();
    ctx.fillStyle = K.hi;
    ctx.font = F(K, 700, 22, K.mono);
    ctx.textAlign = 'center';
    ctx.fillText((o.tag || 'STYLE PACK').toUpperCase(), cx, cy - 103 * u);
    ctx.fillStyle = K.ink;
    ctx.font = F(K, 900, LAND ? 104 : 84);
    ctx.fillText(o.brand || '{brand}', cx, cy + (1 - p) * 24 * u);
    const bw = 380 * u * eOutCubic(clamp((t - .2) / .6));
    ctx.fillStyle = K.a(1);
    ctx.fillRect(cx - bw / 2, cy + 36 * u, bw, 6 * u);
    ctx.fillStyle = K.muted;
    ctx.font = F(K, 400, LAND ? 34 : 30);
    ctx.fillText(o.sub || '{style_name}', cx, cy + 92 * u);
    ctx.restore();
  }}

  function headline(ctx, K, t, o) {{
    const u = K.u, p = eOutCubic(clamp(t / .65));
    const padX = LAND ? 140 * u : 90 * u, pw = W - padX * 2, ph = LAND ? 460 * u : 580 * u;
    const x = padX, y = (H - ph) / 2 - (1 - p) * 28 * u;
    ctx.save();
    ctx.globalAlpha = p;
    card(ctx, K, x, y, pw, ph, 28);
    ctx.fillStyle = K.a(1);
    ctx.fillRect(x + 48 * u, y + 54 * u, 10 * u, 42 * u);
    ctx.fillStyle = K.hi;
    ctx.font = F(K, 700, 24, K.mono);
    ctx.fillText((o.kicker || 'KEY POINT').toUpperCase(), x + 76 * u, y + 84 * u);
    ctx.fillStyle = K.ink;
    ctx.font = F(K, 900, LAND ? 62 : 54);
    const lines = wrapCJK(ctx, o.title || '核心观点标题', pw - 110 * u);
    lines.forEach((ln, i) => ctx.fillText(ln, x + 54 * u, y + (168 + i * (LAND ? 82 : 74)) * u));
    const subY = y + (190 + lines.length * (LAND ? 82 : 74)) * u;
    ctx.fillStyle = K.muted;
    ctx.font = F(K, 400, LAND ? 32 : 28);
    wrapCJK(ctx, o.body || '', pw - 110 * u).forEach((ln, i) => ctx.fillText(ln, x + 54 * u, subY + i * 44 * u));
    const barP = clamp((t - .2) / 2.2);
    ctx.fillStyle = K.a(.85);
    ctx.fillRect(x + 54 * u, y + ph - 36 * u, (pw - 108 * u) * barP, 5 * u);
    ctx.restore();
  }}

  function metric(ctx, K, t, o) {{
    const u = K.u, p = eOutCubic(clamp(t / .9)), cx = W / 2, cy = H * (LAND ? .46 : .44);
    const val = (o.from || 0) + ((o.to ?? 100) - (o.from || 0)) * p;
    const numTxt = val.toFixed(o.digits || 0) + (o.suffix || '');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = K.hi;
    ctx.font = F(K, 700, 24, K.mono);
    ctx.fillText((o.kicker || 'METRIC').toUpperCase(), cx, cy - 170 * u);
    ctx.fillStyle = K.a(1);
    ctx.font = F(K, 400, LAND ? 240 : 196, K.num);
    ctx.fillText(numTxt, cx, cy + 36 * u);
    ctx.fillStyle = K.ink;
    ctx.font = F(K, 700, LAND ? 40 : 34);
    ctx.fillText(o.label || '', cx, cy + 112 * u);
    const bw = LAND ? 640 * u : 520 * u, bx = cx - bw / 2, by = cy + 156 * u;
    rr(ctx, bx, by, bw, 14 * u, 7 * u);
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.fill();
    const fillW = Math.max(16 * u, bw * clamp((t / 2.4) * .85 + .15));
    rr(ctx, bx, by, fillW, 14 * u, 7 * u);
    ctx.fillStyle = K.a(1);
    ctx.fill();
    ctx.restore();
  }}

  function outro(ctx, K, t, o) {{
    const u = K.u, p = eOutBack(clamp(t / .7)), cx = W / 2, cy = H * .47;
    ctx.save();
    ctx.globalAlpha = clamp(t / .4);
    ctx.textAlign = 'center';
    ctx.fillStyle = K.ink;
    ctx.font = F(K, 900, LAND ? 76 : 64);
    ctx.fillText(o.title || '{brand}', cx, cy - 16 * u * (1 - p));
    ctx.fillStyle = K.muted;
    ctx.font = F(K, 400, LAND ? 32 : 28);
    ctx.fillText(o.sub || '保持统一风格，按需扩充更多部件', cx, cy + 68 * u);
    const pulse = 1 + .06 * Math.sin(t * 4);
    ctx.strokeStyle = K.a(.7);
    ctx.lineWidth = 3 * u;
    rr(ctx, cx - 180 * u * pulse, cy + 118 * u, 360 * u * pulse, 56 * u, 28 * u);
    ctx.stroke();
    ctx.fillStyle = K.hi;
    ctx.font = F(K, 700, 24);
    ctx.fillText(o.cta || '确认这套方向', cx, cy + 154 * u);
    ctx.restore();
  }}

  function dissolve(ctx, K, p, drawA, drawB) {{
    const e = smooth(0, 1, clamp(p));
    drawA(ctx);
    drawB(off());
    ctx.save();
    ctx.globalAlpha = e;
    ctx.drawImage(OFF, 0, 0);
    ctx.restore();
  }}

  function push(ctx, K, p, drawA, drawB) {{
    const e = eOutCubic(clamp(p)), d = LAND ? W : H, o = d * e;
    ctx.save(); LAND ? ctx.translate(-o, 0) : ctx.translate(0, -o); drawA(ctx); ctx.restore();
    ctx.save(); LAND ? ctx.translate(d - o, 0) : ctx.translate(0, d - o); drawB(ctx); ctx.restore();
  }}

  function corner(ctx, K, t, o) {{
    const u = K.u, m = LAND ? 56 * u : 64 * u, y = LAND ? 52 * u : H * .055;
    ctx.save();
    ctx.fillStyle = K.a(1);
    ctx.beginPath();
    ctx.arc(m + 10 * u, y, 8 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = K.muted;
    ctx.font = F(K, 700, 22);
    ctx.fillText(o.brand || '{brand}', m + 28 * u, y + 8 * u);
    ctx.restore();
  }}

  function caption(ctx, K, t, cues) {{
    const c = cues.find(x => t >= x.a && t < x.b);
    if (!c) return;
    const u = K.u, al = smooth(c.a, c.a + .12, t) * (1 - smooth(c.b - .12, c.b, t));
    ctx.save();
    ctx.globalAlpha = al;
    ctx.font = F(K, 700, LAND ? 34 : 38);
    const tw = ctx.measureText(c.text).width + 64 * u, ph = 64 * u;
    const bx = W / 2 - tw / 2, by = LAND ? H - 104 * u : H * .82;
    rr(ctx, bx, by, tw, ph, 16 * u);
    ctx.fillStyle = 'rgba(6,8,14,.74)';
    ctx.fill();
    ctx.strokeStyle = K.a(.45);
    ctx.lineWidth = 1.5 * u;
    ctx.stroke();
    ctx.fillStyle = K.ink;
    ctx.textAlign = 'center';
    ctx.fillText(c.text, W / 2, by + 43 * u);
    ctx.restore();
  }}

  return {{ theme, backdrop, opener, headline, metric, outro, dissolve, push, corner, caption }};
}})();
"""

SOUND_KIT_PY = '''"""轻量风格包的声音（来自 samples/lib/synth.py，控制增益防止削波）"""
from synth import impact, whoosh, beep, pad, drone, tick, hz

ROOT = 45


def bed(m, d=None):
    d = d or m.dur
    m.put(drone(hz(ROOT - 12), d, .14), 0, .08)
    m.put(pad([hz(ROOT), hz(ROOT + 7), hz(ROOT + 12)], d, 1000, a=.6, rel=.8), 0, .14)


def part_in(m, part, t):
    if part == "opener":
        m.put(impact(m), t + .04, .35)
    elif part == "headline":
        m.put(beep(hz(ROOT + 24), .09), t + .08, .15)
    elif part == "metric":
        m.put(beep(hz(ROOT + 28), .10), t + .12, .16)
        m.put(beep(hz(ROOT + 35), .12), t + .55, .18)
    elif part == "outro":
        m.put(beep(hz(ROOT + 31), .14), t + .06, .16)


def transition(m, t):
    m.put(whoosh(m, .45, 500, 3200), t, .18)


def beats(m, beat=.375):
    t = 0.0
    while t < m.dur - .1:
        m.put(tick(m), t, .06)
        t += beat * 2
'''

DEMO_SCENE_JS = """// 轻量风格包验证演示片（12 秒，4 个核心部件）：先用 batch.py --vs 单帧对比，再 --quick 自检。
const FONTS = ["900 64px 'Noto Sans SC'", "700 36px 'Noto Sans SC'", "400 220px 'Bebas Neue'", "700 24px 'JetBrains Mono'"];
scene({{
  id: 'pack:{slug}', name: '{name}', dur: 12, still: 7.5,
  needs: ['../pack.js'], fonts: FONTS,
  async init() {{
    const plan = JSON.parse(await xhr(`${{DIR}}/segments.json`));
    const txt = [...new Set('0123456789,.%×¥' + JSON.stringify(plan))].join('');
    await Promise.all(FONTS.map(f => document.fonts.load(f, txt).catch(() => {{}})));
    const K = PACK.theme({{
      accent: (typeof Q !== 'undefined' && Q.get('accent')) || '{accent}',
      variant: (typeof Q !== 'undefined' && Q.get('v')) || 'primary',
    }});
    let at = 0;
    const segs = plan.segs.map((s, i) => {{
      if (!PACK[s.part]) throw new Error(`segments.json 第 ${{i + 1}} 段：没有部件 ${{s.part}}`);
      const r = {{ ...s, i, at }};
      at += s.d;
      return r;
    }});
    if (Math.abs(at - this.dur) > 1e-6) throw new Error(`dur ${{this.dur}} 和 segments.json 总长 ${{at}} 不一致`);
    const cues = [];
    segs.forEach(s => (s.cues || []).forEach(([a, b, text]) => cues.push({{ a: s.at + a, b: s.at + b, text }})));
    return {{ K, segs, cues, TR: plan.tr, brand: plan.brand }};
  }},
  draw(ctx, t, s) {{
    const {{ K, segs, TR }} = s;
    let i = segs.length - 1;
    while (i > 0 && t < segs[i].at) i--;
    const frame = k => c => {{
      const g = segs[k], lt = t - g.at;
      PACK.backdrop(c, K, t);
      PACK[g.part](c, K, lt, g.o || {{}});
    }};
    const g = segs[i], TF = {{ fade: PACK.dissolve, push: PACK.push }};
    const tr = TF[g.tr], d = (TR && TR[g.tr]) || 0;
    if (i > 0 && tr && d > 0 && t < g.at + d) tr(ctx, K, (t - g.at) / d, frame(i - 1), frame(i));
    else frame(i)(ctx);
    if (i > 0 && i < segs.length - 1) PACK.corner(ctx, K, t, {{ brand: s.brand }});
    PACK.caption(ctx, K, t, s.cues);
  }}
}});
"""

DEMO_SOUND_PY = '''"""轻量演示片声音：读同目录 segments.json 并调用 ../sound_kit.py"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import sound_kit as S


def score(m):
    plan = json.loads((HERE / "segments.json").read_text(encoding="utf-8"))
    S.bed(m)
    S.beats(m)
    at = 0.0
    for i, g in enumerate(plan["segs"]):
        if i > 0 and g.get("tr"):
            S.transition(m, at)
        S.part_in(m, g["part"], at)
        at += g["d"]
'''


def build_segments(brand, name, style):
    return {
        "brand": brand,
        "tr": {"fade": 0.375, "push": 0.375},
        "segs": [
            {"part": "opener", "d": 3.0, "o": {"tag": style["id"], "brand": brand, "sub": name}},
            {"part": "headline", "d": 3.0, "tr": "push",
             "o": {"kicker": "STYLE DIRECTION", "title": f"沿用 {style['name']} 的骨架",
                   "body": "先锁死 1 套主配置，边做片边按需补齐部件。"},
             "cues": [[0.25, 2.8, "先定一个分化方向，把核心镜头跑通。"]]},
            {"part": "metric", "d": 3.0, "tr": "fade",
             "o": {"kicker": "CORE PARTS", "from": 0, "to": 4, "digits": 0, "suffix": " 个",
                   "label": "起步核心部件，按需扩充"},
             "cues": [[0.25, 2.8, "先写 4 个核心部件，每次只加 1–2 个。"]]},
            {"part": "outro", "d": 3.0, "tr": "push",
             "o": {"title": brand, "sub": f"参考样式：{style['id']} · {style['name']}", "cta": "单帧与轻片验收"}},
        ],
    }


def write_new(path, content):
    if path.exists():
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return True


def update_my_styles_index(root):
    root.mkdir(parents=True, exist_ok=True)
    rows = []
    for mfile in sorted(root.glob("*/meta.json")):
        slug = mfile.parent.name
        try:
            m = json.loads(mfile.read_text(encoding="utf-8"))
        except Exception:
            continue
        rows.append((slug, m.get("name", slug), m.get("from", "-"), str(mfile.parent), m.get("how", "").replace("|", "\\|")))
    lines = [
        "# 我的风格包（~/aicv-my-styles/）",
        "",
        "跨项目复用的个人风格包目录（Skill 更新不覆盖；`check_storyboard.py`、`check_plan.py`、`batch.py` 自动识别）。",
        "",
        "| slug | 名称 | 来源样式 | 路径 | 说明 |",
        "|---|---|---|---|---|",
    ]
    for slug, name, frm, path, how in rows:
        lines.append(f"| `{slug}` | {name} | {frm} | `{path}` | {how} |")
    (root / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def cmd_create(args):
    slug = args.slug
    if not SLUG_RE.fullmatch(slug):
        sys.exit(f"包名不合法：{slug!r}（只用小写字母、数字和连字符，如 my-green）")
    styles = load_styles()
    style = styles.get(args.source)
    if not style:
        sys.exit(f"找不到样式编号：{args.source}")
    accent = normalize_hex(args.accent)
    name = args.name or f"{style['name']}（自用包）"
    brand = args.brand or name
    out_dir = Path(args.out).expanduser() if args.out else (my_styles_dir() / slug if args.my_styles else HERE.parent / "packs" / slug)

    meta = build_meta(slug, name, style, accent, args.switch, args.variant)
    segs = build_segments(brand, name, style)
    style_md = "\n".join([
        f"# {name}（`{slug}`）",
        "",
        f"- **来源样式**：`{style['id']}` {style['name']}",
        f"- **分化方向与当前配置**：主品牌色 `{accent}`（单套起步，代码留 `accent`/`v` 切换口子）",
        "- **调色板**：主色 `accent` 推出背景深色渐变与亮色高光，强调色占画面不超过 20%。",
        "- **字体**：标题 `'Noto Sans SC'` 900、正文 400、数字 `'Bebas Neue'`、标签 `'JetBrains Mono'`。",
        "- **版式**：横竖两版居中留白，字幕在底端安全区，片头片尾隐藏角标。",
        "- **运动**：立方缓出 `eOutCubic` 进场 + 背景柔光持续微动，避免静止帧。",
        "- **声音**：`sound_kit.py` 柔和铺底 + 节拍轻敲 + 部件入场短音。",
        "- **禁止项**：不要在未经对比确认前盲出多套配色，不要一次硬写几十个未验证部件。",
        "",
    ])
    changes_md = "\n".join([
        f"# {name} 改动记录（相对 `{style['id']}`）",
        "",
        "每轮调整不超过 5 项；先出单帧左右对比图（`batch.py --vs`），再出轻量演示片。",
        "",
        "| 维度 | 原样片 | 现在 | 原因 |",
        "|---|---|---|---|",
        f"| 品牌色 | `{style['id']}` 默认配色 | `{accent}` | 对齐项目品牌主色 |",
        "| 部件规模 | 单个 3 秒演示场景 | 4 个起步核心部件 + 4 基础层 | 轻量起步，边做片边按需扩充 |",
        "",
    ])
    readme_md = "\n".join([
        f"# {name}（`{slug}`）",
        "",
        f"基于 `{style['id']}` 的轻量风格包。常用命令（在 `samples/` 下运行）：",
        "",
        "```bash",
        f"python3 batch.py pack:{slug} --vs {style['id']} --ar 16x9   # 单帧左右对比",
        f"python3 batch.py pack:{slug} --quick --ar 16x9            # 抽帧与声音自检",
        f"python3 new_pack.py --save {out_dir}                      # 保存到 ~/aicv-my-styles/",
        "```",
        "",
        "| 部件 | 调用 | 说明 |",
        "|---|---|---|",
        "| 开场 | `PACK.opener` | `{ tag, brand, sub }` |",
        "| 标题卡片 | `PACK.headline` | `{ kicker, title, body }` |",
        "| 数据指标 | `PACK.metric` | `{ kicker, from, to, digits, suffix, label }` |",
        "| 片尾 | `PACK.outro` | `{ title, sub, cta }` |",
        "",
    ])

    files = {
        "meta.json": json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
        "pack.js": PACK_JS.format(sid=style["id"], style_name=style["name"], accent=accent, brand=brand),
        "sound_kit.py": SOUND_KIT_PY,
        "STYLE.md": style_md,
        "CHANGES.md": changes_md,
        "README.md": readme_md,
        "demo/segments.json": json.dumps(segs, ensure_ascii=False, indent=2) + "\n",
        "demo/scene.js": DEMO_SCENE_JS.format(slug=slug, name=name, accent=accent),
        "demo/sound.py": DEMO_SOUND_PY,
    }
    made = [rel for rel, txt in files.items() if write_new(out_dir / rel, txt)]
    if args.my_styles:
        update_my_styles_index(my_styles_dir())
    print(f"轻量风格包 `{slug}` → {out_dir}")
    print("  新建：" + ("、".join(made) if made else "全部文件已存在，未覆盖"))


def cmd_save(args):
    src = Path(args.save).expanduser().resolve()
    if not (src / "meta.json").is_file():
        sys.exit(f"找不到 {src / 'meta.json'}（不是合法风格包目录）")
    slug = args.as_slug or src.name
    if not SLUG_RE.fullmatch(slug):
        sys.exit(f"包名不合法：{slug!r}")
    root = my_styles_dir()
    dst = (root / slug).resolve()
    root.mkdir(parents=True, exist_ok=True)
    if src != dst:
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns(*SKIP_COPY_DIRS))
    update_my_styles_index(root)
    print(f"已保存到个人风格库：{dst}")
    print(f"已更新索引：{root / 'README.md'}")


def cmd_list():
    root = my_styles_dir()
    if not root.is_dir():
        print(f"暂无个人风格包（目录未创建：{root}）")
        return
    packs = sorted(p.parent for p in root.glob("*/meta.json"))
    if not packs:
        print(f"暂无个人风格包（{root}）")
        return
    print(f"个人风格包目录：{root}")
    for d in packs:
        m = json.loads((d / "meta.json").read_text(encoding="utf-8"))
        print(f"  - {d.name}（{m.get('name', d.name)}，来自 {m.get('from', '?')}） → {d}")


def main():
    ap = argparse.ArgumentParser(description="轻量风格包脚手架 & 个人风格库（~/aicv-my-styles/）管理")
    ap.add_argument("slug", nargs="?", help="新风格包 slug（小写字母、数字、连字符）")
    ap.add_argument("--from", dest="source", help="基于哪个风格编号起步，如 C-044、T-007、G-016")
    ap.add_argument("--name", help="风格包中文名")
    ap.add_argument("--brand", help="演示品牌/栏目名")
    ap.add_argument("--accent", default="#2BD99F", help="主品牌色（#RRGGBB，默认 #2BD99F）")
    ap.add_argument("--switch", help="T/G 类或自定义切换维度名（如 画面组织、画风）")
    ap.add_argument("--variant", help="选定切换键名（如 single、watercolor）")
    ap.add_argument("--my-styles", action="store_true", help="直接创建到 ~/aicv-my-styles/<slug>/ 并登记索引")
    ap.add_argument("--out", help="指定输出目录（默认 packs/<slug> 或配合 --my-styles）")
    ap.add_argument("--save", metavar="DIR", help="把已有风格包目录保存到 ~/aicv-my-styles/ 并更新索引")
    ap.add_argument("--as", dest="as_slug", help="配合 --save 指定保存后的 slug")
    ap.add_argument("--list", action="store_true", help="列出 ~/aicv-my-styles/ 下的个人风格包")
    a = ap.parse_args()

    if a.list:
        cmd_list()
    elif a.save:
        cmd_save(a)
    elif a.slug and a.source:
        cmd_create(a)
    else:
        ap.print_help()
        sys.exit(2)


if __name__ == "__main__":
    main()
