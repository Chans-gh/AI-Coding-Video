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


MEDIA_SLOTS = ["mediaBg", "mediaSplit", "mediaFrame", "mediaPip"]
MEDIA_PARTS = [
    ["氛围铺底（媒体）", "Media backdrop", "layer"],
    ["双栏分屏（媒体）", "Media split", "seg"],
    ["画框展示（媒体）", "Media frame", "seg"],
    ["画中画（媒体叠加）", "Media PiP (overlay)", "seg"],
]

FAMILY_GUIDE = {
    "暗色科技": {
        "t_rule": "深色半透明玻璃框 + 1.5px 强调色微光描边 + 圆角裁切 + 轻暗角；右下等宽体小角标；禁纯白粗框与拟物阴影。",
        "g_prompt": "深炭黑极简暗棚底，边缘带 {accent} 轮廓光，高对比电影质感，主体居中四周留暗色呼吸空间，无文字、无 Logo、无水印",
    },
    "纸面档案": {
        "t_rule": "浅色卡纸框 / 角落胶带条 + 微暖档案色偏与轻纸纹；打字机/衬线出处标；禁霓虹描边与全屏无边框高清硬切。",
        "g_prompt": "米白粗纹水彩纸纯白底，手绘水彩/淡彩插画质感，笔触清晰，边缘自然留白晕染，无边框、无文字、无水印",
    },
    "扁平栅格": {
        "t_rule": "硬栅格裁切 + 2.5px 主墨色描边与硬偏移阴影；色块胶囊出处标签；禁柔光羽化与模糊玻璃框。",
        "g_prompt": "干净现代矢量插画质感，简洁色块与明确边缘光影，配色呼应主色 {accent}，构图利落可裁剪，无文字、无 Logo",
    },
    "胶片屏幕": {
        "t_rule": "电影遮幅 / 胶片齿孔与细扫描线 + 逐帧颗粒；角落时间码/出处标；禁现代光滑圆角卡片。",
        "g_prompt": "35mm 胶片实拍质感，柔和胶片颗粒与暗角，略褪色自然电影色调，无现代 UI、无文字、无水印",
    },
    "3D展陈": {
        "t_rule": "透视展板框 + 底部空间软投影与环境光晕；展签风格小标；禁贴平无空间感的直角硬贴。",
        "g_prompt": "微缩展台工作室布光，柔和环境漫反射与地面软投影，干净单色展陈底，主体轮廓清晰，无文字、无 Logo",
    },
}


def check_media_compat(style, force=False):
    """三档兼容度护栏：查 data/styles.json 的 media_fit / media_family，返回融合族群"""
    sid = style["id"]
    if sid[:1] != "C":
        return style.get("media_family") or "暗色科技"
    fit = style.get("media_fit")
    fam = style.get("media_family")
    if fit == "闭环":
        if not force:
            sys.exit(
                f"拒绝开启媒体插槽：{sid}（{style['name']}）的素材兼容度为「闭环」，不适合在主包内嵌外部素材。\n"
                "建议：主风格保持纯代码，确需穿插实拍或 AI 素材时改走 L2 技法客串（分镜直接写 ref: \"T-xxx\" / \"G-xxx\"）。\n"
                "若执意挂载，请显式加 --force-media。"
            )
        print(f"警告：{sid}（{style['name']}）属于「闭环」风格，已通过 --force-media 强制挂载媒体插槽（请严控画面融合违和风险）。")
        return "暗色科技"
    if fit == "条件":
        print(f"提示：{sid}（{style['name']}）为「条件（{fam}）」适配：补 G 类须锁死伴生风格段，补 T 类须套画框并统一色调，忌全屏裸贴现代实拍。")
    return fam or "暗色科技"


def build_meta(slug, name, style, accent, switch_name, variant_key, media_family=None):
    sid = style["id"]
    cls = sid[:1]
    meta = {
        "from": sid,
        "name": name,
        "en_name": slug.replace("-", " ").title(),
        "how": f"由 {sid}（{style['name']}）沉淀的轻量起步包（1 套配置，4 个核心部件 + 4 个基础层"
               + (f" + 4 个插件式媒体插槽（{media_family}）" if media_family else "") + "，按需扩充）。",
        "en_how": f"Lightweight starter pack derived from {sid} (single configuration, 4 core parts + 4 base layers"
                  + (", plus 4 plugin media slots" if media_family else "") + ").",
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
    if media_family:
        meta["media"] = {"enabled": True, "family": media_family, "slots": list(MEDIA_SLOTS)}
        meta["parts"].extend([list(p) for p in MEDIA_PARTS])
    if switch_name or cls in "TG":
        sw = switch_name or ("画面组织" if cls == "T" else "画风")
        vk = variant_key or ("single" if cls == "T" else "primary")
        vl = "单图推拉" if (cls == "T" and vk == "single") else "选定画风" if (cls == "G" and vk == "primary") else vk
        meta["switch"] = [sw, sw]
        meta["variants"] = [[vk, vl, vk.title(), vk]]
    else:
        meta["accents"] = [["primary", "主色", "Primary", accent]]
    return meta


MEDIA_SLOTS_JS = """// 插件式媒体插槽（融合族群：{family}，来源：{sid} {style_name}）
// 不修改 pack.js 任何一行；场景按需在 needs 里引入 '../media_slots.js' 后即可调用 PACK.mediaBg / mediaSplit / mediaFrame / mediaPip。
// 依赖 samples/lib/lib.js 的 W H LAND SHORT FPS clamp smooth eOutCubic rr wrapCJK drawCover drawContain drawPlaceholder vignette grain。
(() => {{
  const FAMILY = '{family}';
  const F = (K, w, px, fam) => `${{w}} ${{Math.round(px * (K.u || SHORT / 1080))}}px ${{fam || K.head || "'Noto Sans SC'"}}`;
  const resolveSrc = src => (src && src.el) ? src.el : (src && typeof src === 'object' ? src : null);

  function drawCredit(ctx, K, x, y, w, h, text) {{
    if (!text) return;
    const u = K.u || SHORT / 1080, pad = 12 * u;
    ctx.save();
    ctx.font = F(K, 600, 17, K.mono || "'JetBrains Mono'");
    const tw = Math.min(w - 24 * u, ctx.measureText(text).width + 24 * u), th = 30 * u;
    const bx = x + w - tw - pad, by = y + h - th - pad;
    if (FAMILY === '扁平栅格') {{
      ctx.fillStyle = K.a ? K.a(.92) : '#2BD99F';
      rr(ctx, bx, by, tw, th, 4 * u); ctx.fill();
      ctx.fillStyle = '#080B12';
    }} else if (FAMILY === '纸面档案') {{
      ctx.fillStyle = 'rgba(245,239,226,.92)';
      rr(ctx, bx, by, tw, th, 4 * u); ctx.fill();
      ctx.strokeStyle = 'rgba(60,48,36,.35)'; ctx.lineWidth = 1.2 * u; ctx.stroke();
      ctx.fillStyle = '#2B241D';
    }} else {{
      ctx.fillStyle = 'rgba(6,9,16,.76)';
      rr(ctx, bx, by, tw, th, 8 * u); ctx.fill();
      ctx.strokeStyle = K.a ? K.a(.4) : 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.2 * u; ctx.stroke();
      ctx.fillStyle = K.ink || '#F4F6FA';
    }}
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + tw / 2, by + th / 2 + 1 * u, tw - 10 * u);
    ctx.restore();
  }}

  function drawMediaBox(ctx, K, t, x, y, w, h, o = {{}}) {{
    const u = K.u || SHORT / 1080;
    const media = resolveSrc(o.src);
    const rad = (FAMILY === '扁平栅格' ? 6 : FAMILY === '纸面档案' ? 4 : FAMILY === '胶片屏幕' ? 4 : 20) * u;
    ctx.save();

    // 族群外框底影 / 托架
    if (FAMILY === '扁平栅格') {{
      rr(ctx, x + 9 * u, y + 9 * u, w, h, rad);
      ctx.fillStyle = K.a ? K.a(.85) : '#2BD99F';
      ctx.fill();
    }} else if (FAMILY === '3D展陈') {{
      const sg = ctx.createRadialGradient(x + w / 2, y + h + 16 * u, w * .08, x + w / 2, y + h + 16 * u, w * .52);
      sg.addColorStop(0, 'rgba(0,0,0,.48)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(x - 20 * u, y + h - 8 * u, w + 40 * u, 44 * u);
    }} else if (FAMILY === '纸面档案') {{
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      rr(ctx, x + 5 * u, y + 7 * u, w, h, rad); ctx.fill();
    }}

    if (!media) {{
      drawPlaceholder(ctx, x, y, w, h, {{
        K, kind: o.kind || 'T', label: o.placeholder || o.title || o.label || '待填入素材',
        radius: rad, t,
      }});
      drawCredit(ctx, K, x, y, w, h, o.credit);
      ctx.restore();
      return;
    }}

    const zoom = 1 + (o.zoom ?? 0.06) * clamp(t / 4);
    ctx.save();
    rr(ctx, x, y, w, h, rad);
    ctx.clip();
    ctx.fillStyle = K.bg0 || '#080B12';
    ctx.fillRect(x, y, w, h);
    if (o.fit === 'contain') drawContain(ctx, media, x, y, w, h, {{ zoom }});
    else drawCover(ctx, media, x, y, w, h, {{ zoom, fx: o.fx ?? .5, fy: o.fy ?? .5 }});

    // 族群融合叠层
    if (FAMILY === '暗色科技') {{
      const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * .25, x + w / 2, y + h / 2, Math.max(w, h) * .72);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,8,16,.38)');
      ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
    }} else if (FAMILY === '纸面档案') {{
      ctx.fillStyle = 'rgba(236,222,192,.14)'; ctx.fillRect(x, y, w, h);
    }} else if (FAMILY === '胶片屏幕') {{
      ctx.fillStyle = 'rgba(0,0,0,.14)';
      for (let sy = y; sy < y + h; sy += 6 * u) ctx.fillRect(x, sy, w, 1.5 * u);
      if (typeof grain === 'function') {{ ctx.save(); ctx.globalAlpha = .16; grain(ctx, Math.round(t * FPS)); ctx.restore(); }}
    }} else if (FAMILY === '3D展陈') {{
      const rim = ctx.createLinearGradient(x, y, x, y + h);
      rim.addColorStop(0, 'rgba(255,255,255,.12)'); rim.addColorStop(.16, 'rgba(255,255,255,0)');
      rim.addColorStop(.84, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,0,0,.32)');
      ctx.fillStyle = rim; ctx.fillRect(x, y, w, h);
    }}
    ctx.restore();

    // 族群边框与装饰
    rr(ctx, x, y, w, h, rad);
    if (FAMILY === '扁平栅格') {{
      ctx.strokeStyle = K.ink || '#F4F6FA'; ctx.lineWidth = 3 * u; ctx.stroke();
    }} else if (FAMILY === '纸面档案') {{
      ctx.strokeStyle = 'rgba(244,238,224,.88)'; ctx.lineWidth = 8 * u; ctx.stroke();
      ctx.fillStyle = 'rgba(224,205,164,.72)';
      ctx.fillRect(x + w * .08, y - 8 * u, 68 * u, 18 * u);
      ctx.fillRect(x + w * .92 - 68 * u, y - 8 * u, 68 * u, 18 * u);
    }} else if (FAMILY === '胶片屏幕') {{
      ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 2 * u; ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.72)';
      ctx.fillRect(x, y, w, 14 * u); ctx.fillRect(x, y + h - 14 * u, w, 14 * u);
    }} else {{
      ctx.strokeStyle = K.a ? K.a(.5) : 'rgba(255,255,255,.28)';
      ctx.lineWidth = 1.8 * u; ctx.stroke();
    }}

    drawCredit(ctx, K, x, y, w, h, o.credit);
    ctx.restore();
  }}

  // 1) mediaBg（层）：全画幅氛围铺底，自动压罩，前景 100% 复用原纯 C 部件
  function mediaBg(ctx, K, t, o = {{}}) {{
    const media = resolveSrc(o.src);
    const dim = clamp(o.dim ?? 0.58, 0, 0.88);
    const zoom = 1 + (o.zoom ?? 0.05) * clamp(t / 5);
    ctx.save();
    if (media) {{
      drawCover(ctx, media, 0, 0, W, H, {{ zoom, fx: o.fx ?? .5, fy: o.fy ?? .5 }});
    }} else {{
      ctx.fillStyle = K.bg0 || '#07090F';
      ctx.fillRect(0, 0, W, H);
    }}
    ctx.fillStyle = `rgba(6,8,16,${{dim}})`;
    ctx.fillRect(0, 0, W, H);
    if (o.tint !== false && K.a) {{
      const g = ctx.createRadialGradient(W * .5, H * .42, 0, W * .5, H * .5, Math.max(W, H) * .7);
      g.addColorStop(0, K.a(.16)); g.addColorStop(1, K.a(0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }}
    if (typeof vignette === 'function') vignette(ctx, .34);
    ctx.restore();
  }}

  function drawKicker(ctx, K, text, x, y) {{
    if (!text) return;
    const u = K.u || SHORT / 1080;
    ctx.save();
    ctx.fillStyle = K.a ? K.a(1) : '#2BD99F';
    ctx.fillRect(x, y - 9 * u, 28 * u, 3 * u);
    ctx.font = F(K, 700, 21, K.mono || "'JetBrains Mono'");
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${{3.5 * u}}px`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(text).toUpperCase(), x + 40 * u, y);
    ctx.restore();
  }}

  // 2) mediaFrame（整屏）：16:9 漂浮舞台画框，垂直居中
  function mediaFrame(ctx, K, t, o = {{}}) {{
    const u = K.u || SHORT / 1080, p = eOutCubic(clamp(t / .55));
    const hasHead = Boolean(o.kicker || o.title);
    ctx.save();
    ctx.globalAlpha = p;
    let fx, fy, fw, fh;
    if (LAND) {{
      const midY = H * .465;
      fw = 1320 * u; fh = 640 * u;
      const headH = hasHead ? ((o.kicker && o.title ? 92 : o.title ? 62 : 36) * u) : 0;
      let topY = midY - (headH + fh) / 2 + (1 - p) * 20 * u;
      fx = (W - fw) / 2;
      if (hasHead) {{
        if (o.kicker) {{ drawKicker(ctx, K, o.kicker, fx, topY + 20 * u); topY += 34 * u; }}
        if (o.title) {{
          ctx.fillStyle = K.ink; ctx.font = F(K, 900, 46);
          ctx.fillText(String(o.title), fx, topY + 38 * u, fw);
          topY += 58 * u;
        }}
      }}
      fy = topY;
    }} else {{
      const padX = 64 * u;
      let topY = H * .108;
      if (hasHead) {{
        if (o.kicker) {{ drawKicker(ctx, K, o.kicker, padX, topY + 22 * u); topY += 44 * u; }}
        if (o.title) {{
          ctx.fillStyle = K.ink; ctx.font = F(K, 900, 50);
          const lines = wrapCJK(ctx, String(o.title), W - padX * 2).slice(0, 2);
          lines.forEach((ln, i) => ctx.fillText(ln, padX, topY + (44 + i * 62) * u));
          topY += (lines.length * 62 + 24) * u;
        }}
      }}
      const maxBot = H * .775;
      fx = padX; fy = topY + (1 - p) * 18 * u;
      fw = W - padX * 2; fh = Math.max(360 * u, maxBot - topY);
    }}
    drawMediaBox(ctx, K, t, fx, fy, fw, fh, o);
    ctx.restore();
    return {{ media: [fx, fy, fw, fh] }};
  }}

  // 3) mediaSplit（整屏）：16:9 媒体窗 + 无死区垂直居中排版列（text / metric / 叠层列表，严守底部安全区）
  function mediaSplit(ctx, K, t, o = {{}}) {{
    const u = K.u || SHORT / 1080, p = eOutCubic(clamp(t / .55));
    const mediaSecond = o.mediaSide === 'right' || o.mediaSide === 'bottom';
    ctx.save();
    ctx.globalAlpha = p;
    let mx, my, mw, mh, ix, iy, iw, ih;
    if (LAND) {{
      const midY = H * .465, gap = 64 * u;
      mw = 950 * u; mh = 576 * u; iw = 720 * u; ih = mh;
      const padX = (W - mw - iw - gap) / 2;
      if (!mediaSecond) {{ mx = padX; ix = padX + mw + gap; }}
      else {{ ix = padX; mx = padX + iw + gap; }}
      my = midY - mh / 2 + (1 - p) * 18 * u;
      iy = midY - ih / 2 + (1 - p) * 18 * u;
    }} else {{
      const padX = 64 * u, topY = H * .108, botY = H * .772, gap = 34 * u;
      mx = padX; ix = padX;
      mw = W - padX * 2; mh = 536 * u; iw = mw; ih = Math.max(260 * u, botY - topY - mh - gap);
      if (!mediaSecond) {{ my = topY; iy = topY + mh + gap; }}
      else {{ iy = topY; my = topY + ih + gap; }}
      my += (1 - p) * 14 * u; iy += (1 - p) * 14 * u;
    }}

    drawMediaBox(ctx, K, t, mx, my, mw, mh, o);

    const cx0 = ix, cw = iw, kind = o.infoKind || 'text';
    const kickerH = o.kicker ? (LAND ? 40 : 34) * u : 0;

    if (kind === 'metric') {{
      const numPx = LAND ? 200 : 156, numH = (LAND ? 178 : 140) * u, ruleH = 26 * u;
      ctx.font = F(K, 700, LAND ? 36 : 30);
      const lblLines = o.label ? wrapCJK(ctx, String(o.label), cw).slice(0, 2) : [];
      const lblLH = (LAND ? 48 : 40) * u, lblH = lblLines.length * lblLH;
      let cy = iy + Math.max(0, (ih - (kickerH + numH + ruleH + lblH)) / 2);
      if (o.kicker) {{ drawKicker(ctx, K, o.kicker, cx0, cy + 20 * u); cy += kickerH; }}
      const val = (o.from || 0) + ((o.to ?? 100) - (o.from || 0)) * eOutCubic(clamp(t / .85));
      const numTxt = (o.prefix || '') + val.toFixed(o.digits || 0) + (o.suffix || '');
      ctx.fillStyle = K.hi || K.ink; ctx.font = F(K, 400, numPx, K.num || "'Bebas Neue'");
      ctx.fillText(numTxt, cx0, cy + numH - 16 * u, cw);
      cy += numH;
      ctx.fillStyle = K.a ? K.a(1) : '#2BD99F';
      ctx.fillRect(cx0, cy + 4 * u, 140 * u * eOutCubic(clamp(t / .5)), 4 * u);
      cy += ruleH + 10 * u;
      if (lblLines.length) {{
        ctx.fillStyle = K.ink; ctx.font = F(K, 700, LAND ? 36 : 30);
        lblLines.forEach((ln, i) => ctx.fillText(ln, cx0, cy + 30 * u + i * lblLH));
      }}
    }} else if (kind === 'list') {{
      const tPx = LAND ? 46 : 38, tLH = (LAND ? 58 : 48) * u;
      ctx.font = F(K, 900, tPx);
      const tLines = o.title ? wrapCJK(ctx, String(o.title), cw).slice(0, 2) : [];
      const titleH = tLines.length ? (tLines.length * tLH + 20 * u) : 0;
      const items = (o.items || []).slice(0, 4), rowH = (LAND ? 70 : 58) * u, rowGap = (LAND ? 14 : 10) * u;
      const listH = items.length ? (items.length * rowH + (items.length - 1) * rowGap) : 0;
      let cy = iy + Math.max(0, (ih - (kickerH + titleH + listH)) / 2);
      if (o.kicker) {{ drawKicker(ctx, K, o.kicker, cx0, cy + 20 * u); cy += kickerH; }}
      if (tLines.length) {{
        ctx.fillStyle = K.ink; ctx.font = F(K, 900, tPx);
        tLines.forEach((ln, i) => ctx.fillText(ln, cx0, cy + 38 * u + i * tLH));
        cy += titleH;
      }}
      items.forEach((it, idx) => {{
        const ip = eOutCubic(clamp((t - idx * .12) / .4));
        const ry = cy + (1 - ip) * 12 * u;
        ctx.save(); ctx.globalAlpha *= clamp(ip + .15);
        rr(ctx, cx0, ry, cw, rowH, 14 * u);
        ctx.fillStyle = K.panel || 'rgba(255,255,255,.06)'; ctx.fill();
        ctx.strokeStyle = K.a ? K.a(.28) : 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.4 * u; ctx.stroke();
        const bx = cx0 + 20 * u, by = ry + (rowH - 32 * u) / 2;
        rr(ctx, bx, by, 32 * u, 32 * u, 9 * u);
        ctx.fillStyle = K.a ? K.a(.24) : 'rgba(255,255,255,.15)'; ctx.fill();
        ctx.fillStyle = K.hi || K.ink; ctx.font = F(K, 700, 16, K.mono);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(idx + 1).padStart(2, '0'), bx + 16 * u, by + 17 * u);
        ctx.textAlign = 'left'; ctx.fillStyle = K.ink; ctx.font = F(K, 600, LAND ? 25 : 22);
        ctx.fillText(String(it), bx + 46 * u, ry + rowH / 2 + 1 * u, cw - 80 * u);
        ctx.restore();
        cy += rowH + rowGap;
      }});
    }} else {{
      const tPx = LAND ? 58 : 44, tLH = (LAND ? 74 : 56) * u;
      ctx.font = F(K, 900, tPx);
      const tLines = o.title ? wrapCJK(ctx, String(o.title), cw).slice(0, 3) : [];
      const titleH = tLines.length ? (tLines.length * tLH + 14 * u) : 0;
      const ruleH = 26 * u, bPx = LAND ? 29 : 24, bLH = (LAND ? 44 : 36) * u;
      ctx.font = F(K, 400, bPx);
      const bLines = o.body ? wrapCJK(ctx, String(o.body), cw).slice(0, LAND ? 3 : 2) : [];
      const bodyH = bLines.length ? (bLines.length * bLH) : 0;
      let cy = iy + Math.max(0, (ih - (kickerH + titleH + ruleH + bodyH)) / 2);
      if (o.kicker) {{ drawKicker(ctx, K, o.kicker, cx0, cy + 20 * u); cy += kickerH; }}
      if (tLines.length) {{
        ctx.fillStyle = K.ink; ctx.font = F(K, 900, tPx);
        tLines.forEach((ln, i) => ctx.fillText(ln, cx0, cy + 48 * u + i * tLH));
        cy += titleH;
      }}
      ctx.fillStyle = K.a ? K.a(1) : '#2BD99F';
      ctx.fillRect(cx0, cy + 4 * u, 92 * u * eOutCubic(clamp(t / .5)), 4 * u);
      cy += ruleH + 10 * u;
      if (bLines.length) {{
        ctx.fillStyle = K.muted || 'rgba(244,246,250,.72)'; ctx.font = F(K, 400, bPx);
        bLines.forEach((ln, i) => ctx.fillText(ln, cx0, cy + 22 * u + i * bLH));
      }}
    }}
    ctx.restore();
    return {{ media: [mx, my, mw, mh], info: [ix, iy, iw, ih] }};
  }}

  // 4) mediaPip（叠加）：安全角标画中画（圆形或圆角卡，避开左上角标与底部字幕安全区）
  function mediaPip(ctx, K, t, o = {{}}) {{
    const u = K.u || SHORT / 1080, p = eOutCubic(clamp(t / .45));
    const isCircle = o.shape === 'circle';
    const pw = (isCircle ? (LAND ? 210 : 190) : (LAND ? 320 : 280)) * u;
    const ph = isCircle ? pw : pw * 0.62;
    const pos = o.pos || 'br';
    const mX = (LAND ? 64 : 52) * u;
    const topY = LAND ? 64 * u : H * .095;
    const botY = LAND ? H - 134 * u : H * .755;
    const x = pos === 'bl' ? mX : W - mX - pw;
    const y = (pos === 'tr' ? topY : botY - ph) + (1 - p) * 18 * u;
    ctx.save();
    ctx.globalAlpha = p;
    if (isCircle) {{
      const cx = x + pw / 2, cy = y + ph / 2, r = pw / 2;
      const media = resolveSrc(o.src);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      if (media) drawCover(ctx, media, x, y, pw, ph, {{ zoom: 1.04 }});
      else drawPlaceholder(ctx, x, y, pw, ph, {{ K, kind: o.kind || 'T', label: '', radius: r, t }});
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = K.a ? K.a(.85) : '#2BD99F'; ctx.lineWidth = 3 * u; ctx.stroke();
    }} else {{
      drawMediaBox(ctx, K, t, x, y, pw, ph, {{ ...o, credit: '' }});
    }}
    if (o.label) {{
      ctx.font = F(K, 700, 18);
      const tw = Math.min(pw, ctx.measureText(o.label).width + 26 * u), th = 30 * u;
      const lx = x + (pw - tw) / 2, ly = y + ph - th * .55;
      rr(ctx, lx, ly, tw, th, 15 * u);
      ctx.fillStyle = 'rgba(6,9,16,.84)'; ctx.fill();
      ctx.strokeStyle = K.a ? K.a(.6) : '#2BD99F'; ctx.lineWidth = 1.4 * u; ctx.stroke();
      ctx.fillStyle = K.ink || '#F4F6FA'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(o.label), lx + tw / 2, ly + th / 2 + 1 * u, tw - 12 * u);
    }}
    ctx.restore();
    return {{ pip: [x, y, pw, ph] }};
  }}

  if (typeof PACK !== 'undefined') Object.assign(PACK, {{ mediaBg, mediaSplit, mediaFrame, mediaPip }});
}})();
"""


def build_media_slots_js(family, style):
    return MEDIA_SLOTS_JS.format(family=family, sid=style["id"], style_name=style["name"])


def media_style_section(family, accent):
    g = FAMILY_GUIDE.get(family, FAMILY_GUIDE["暗色科技"])
    return "\n".join([
        "## 外部素材融入规范",
        "",
        f"- **融合族群**：`{family}`（通过独立插件 `media_slots.js` 挂载 `mediaBg` / `mediaSplit` / `mediaFrame` / `mediaPip`，不改动原纯 C 部件）",
        f"- **T 类真实素材穿衣细则**：{g['t_rule']}",
        "- **G 类 AI 伴生风格段（全片锁死，拼在「镜头主体描述」后与「约束段」前）**：",
        "  ```text",
        f"  {g['g_prompt'].format(accent=accent)}",
        "  ```",
        "",
    ])


def media_readme_rows():
    return "\n".join([
        "| 氛围铺底（媒体） | `PACK.mediaBg` | `{ src, kind, dim, tint, zoom }`（层，前景直接复用纯 C 部件） |",
        "| 双栏分屏（媒体） | `PACK.mediaSplit` | `{ src, kind, mediaSide, infoKind, kicker, title, body, to, suffix, label, items, credit, placeholder }` |",
        "| 画框展示（媒体） | `PACK.mediaFrame` | `{ src, kind, kicker, title, credit, fit, zoom, placeholder }` |",
        "| 画中画（媒体叠加） | `PACK.mediaPip` | `{ src, kind, shape, pos, label }`（叠加在四角安全区） |",
        "",
    ])



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
    elif part in ("mediaSplit", "mediaFrame"):
        m.put(beep(hz(ROOT + 26), .09), t + .08, .15)
        m.put(beep(hz(ROOT + 33), .08), t + .28, .12)
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

DEMO_SCENE_JS = """// 轻量风格包验证演示片（{dur} 秒）：先用 batch.py --vs 单帧对比，再 --quick 自检。
const FONTS = ["900 64px 'Noto Sans SC'", "700 36px 'Noto Sans SC'", "400 220px 'Bebas Neue'", "700 24px 'JetBrains Mono'"];
scene({{
  id: 'pack:{slug}', name: '{name}', dur: {dur}, still: 7.5,
  needs: [{needs}], fonts: FONTS,
  async init() {{
    const plan = JSON.parse(await xhr(`${{DIR}}/segments.json`));
    const txt = [...new Set('0123456789,.%×¥[TG真实AI素材待填入]' + JSON.stringify(plan))].join('');
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
      const ovs = Array.isArray(g.over) ? g.over : (g.over ? [g.over] : []);
      ovs.forEach(ov => {{
        const pn = typeof ov === 'string' ? ov : ov.part, po = typeof ov === 'string' ? {{}} : (ov.o || {{}});
        if (PACK[pn]) PACK[pn](c, K, lt, po);
      }});
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


def build_segments(brand, name, style, media_family=None):
    segs = [
        {"part": "opener", "d": 3.0, "o": {"tag": style["id"], "brand": brand, "sub": name}},
        {"part": "headline", "d": 3.0, "tr": "push",
         "o": {"kicker": "STYLE DIRECTION", "title": f"沿用 {style['name']} 的骨架",
               "body": "先锁死 1 套主配置，边做片边按需补齐部件。"},
         "cues": [[0.25, 2.8, "先定一个分化方向，把核心镜头跑通。"]]},
        {"part": "metric", "d": 3.0, "tr": "fade",
         "o": {"kicker": "CORE PARTS", "from": 0, "to": 4, "digits": 0, "suffix": " 个",
               "label": "起步核心部件，按需扩充"},
         "cues": [[0.25, 2.8, "先写 4 个核心部件，每次只加 1–2 个。"]]},
    ]
    if media_family:
        segs += [
            {"part": "mediaSplit", "d": 3.0, "tr": "push",
             "o": {"kind": "T", "kicker": f"MEDIA SPLIT · {media_family}",
                   "title": "实拍与要点严格分栏",
                   "body": "横版左右 55:45、竖版上下 52:48，严守底部字幕安全区。",
                   "placeholder": "放入产品实拍 / 软件录屏", "credit": "T 真实素材"},
             "cues": [[0.25, 2.8, "外挂双栏媒体槽，纯代码部件零改动。"]]},
            {"part": "mediaFrame", "d": 3.0, "tr": "fade",
             "o": {"kind": "G", "kicker": "MEDIA FRAME",
                   "title": "画框承载 AI 伴生画面",
                   "placeholder": "按 STYLE.md 伴生风格段生成画面", "credit": "G AI 素材"},
             "cues": [[0.25, 2.8, "缺素材先走主题占位框，到位后增量重渲。"]]},
        ]
    segs.append(
        {"part": "outro", "d": 3.0, "tr": "push",
         "o": {"title": brand, "sub": f"参考样式：{style['id']} · {style['name']}", "cta": "单帧与轻片验收"}}
    )
    return {
        "brand": brand,
        "tr": {"fade": 0.375, "push": 0.375},
        "segs": segs,
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
    media_family = check_media_compat(style, force=args.force_media) if args.media else None
    accent = normalize_hex(args.accent)
    name = args.name or f"{style['name']}（自用包）"
    brand = args.brand or name
    out_dir = Path(args.out).expanduser() if args.out else (my_styles_dir() / slug if args.my_styles else HERE.parent / "packs" / slug)

    meta = build_meta(slug, name, style, accent, args.switch, args.variant, media_family=media_family)
    segs = build_segments(brand, name, style, media_family=media_family)
    dur = 18 if media_family else 12
    needs = "'../pack.js', '../media_slots.js'" if media_family else "'../pack.js'"

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
    if media_family:
        style_md += "\n" + media_style_section(media_family, accent)

    changes_md = "\n".join([
        f"# {name} 改动记录（相对 `{style['id']}`）",
        "",
        "每轮调整不超过 5 项；先出单帧左右对比图（`batch.py --vs`），再出轻量演示片。",
        "",
        "| 维度 | 原样片 | 现在 | 原因 |",
        "|---|---|---|---|",
        f"| 品牌色 | `{style['id']}` 默认配色 | `{accent}` | 对齐项目品牌主色 |",
        "| 部件规模 | 单个 3 秒演示场景 | 4 个起步核心部件 + 4 基础层" + (f" + 插件式媒体槽（{media_family}）" if media_family else "") + " | 轻量起步，边做片边按需扩充 |",
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
    if media_family:
        readme_md = readme_md.rstrip("\n") + "\n" + media_readme_rows()

    files = {
        "meta.json": json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
        "pack.js": PACK_JS.format(sid=style["id"], style_name=style["name"], accent=accent, brand=brand),
        "sound_kit.py": SOUND_KIT_PY,
        "STYLE.md": style_md,
        "CHANGES.md": changes_md,
        "README.md": readme_md,
        "demo/segments.json": json.dumps(segs, ensure_ascii=False, indent=2) + "\n",
        "demo/scene.js": DEMO_SCENE_JS.format(slug=slug, name=name, accent=accent, dur=dur, needs=needs),
        "demo/sound.py": DEMO_SOUND_PY,
    }
    if media_family:
        files["media_slots.js"] = build_media_slots_js(media_family, style)

    made = [rel for rel, txt in files.items() if write_new(out_dir / rel, txt)]
    if args.my_styles:
        update_my_styles_index(my_styles_dir())
    print(f"轻量风格包 `{slug}` → {out_dir}")
    print("  新建：" + ("、".join(made) if made else "全部文件已存在，未覆盖"))


def cmd_add_media(args):
    """对已有纯 C 风格包目录无损外挂 media_slots.js；严格保护 pack.js、sound_kit.py、CHANGES.md 与 demo/segments.json"""
    pack_dir = Path(args.add_media).expanduser().resolve()
    meta_path = pack_dir / "meta.json"
    if not meta_path.is_file():
        sys.exit(f"找不到 {meta_path}（不是合法风格包目录）")
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    sid = meta.get("from")
    styles = load_styles()
    style = styles.get(sid)
    if not style:
        sys.exit(f"meta.json 的 from={sid!r} 不在 data/styles.json 里，无法校验素材兼容度")
    family = check_media_compat(style, force=args.force_media)

    accent = "#2BD99F"
    if isinstance(meta.get("accents"), list) and meta["accents"]:
        first = meta["accents"][0]
        if isinstance(first, list) and len(first) >= 4:
            accent = first[3]

    touched = []
    ms_path = pack_dir / "media_slots.js"
    if write_new(ms_path, build_media_slots_js(family, style)):
        touched.append("media_slots.js（新建）")
    else:
        touched.append("media_slots.js（已存在，未覆盖）")

    # 增量更新 meta.json
    meta["media"] = {"enabled": True, "family": family, "slots": list(MEDIA_SLOTS)}
    parts = meta.setdefault("parts", [])
    have_names = {p[0] for p in parts if isinstance(p, list) and p}
    for row in MEDIA_PARTS:
        if row[0] not in have_names:
            parts.append(list(row))
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    touched.append("meta.json（已登记 media 与 4 个插槽）")

    # 增量更新 STYLE.md
    style_path = pack_dir / "STYLE.md"
    if style_path.is_file():
        stxt = style_path.read_text(encoding="utf-8")
        if "## 外部素材融入规范" not in stxt:
            style_path.write_text(stxt.rstrip("\n") + "\n\n" + media_style_section(family, accent), encoding="utf-8")
            touched.append("STYLE.md（追加外部素材融入规范）")

    # 增量更新 README.md
    readme_path = pack_dir / "README.md"
    if readme_path.is_file():
        rtxt = readme_path.read_text(encoding="utf-8")
        if "PACK.mediaFrame" not in rtxt:
            readme_path.write_text(rtxt.rstrip("\n") + "\n" + media_readme_rows(), encoding="utf-8")
            touched.append("README.md（追加媒体插槽部件说明）")

    print(f"已无损挂载媒体插槽（族群：{family}）→ {pack_dir}")
    print("  变更：" + "；".join(touched))
    print("  保护：pack.js、sound_kit.py、CHANGES.md 与 demo/segments.json 原样未改动。")


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
    ap.add_argument("--media", action="store_true", help="新建时挂载插件式 media_slots.js（受三档兼容度护栏校验，演示片 18 秒）")
    ap.add_argument("--add-media", metavar="DIR", help="对已有纯 C 风格包目录无损外挂 media_slots.js（不改 pack.js 与原有分镜）")
    ap.add_argument("--force-media", action="store_true", help="强制对「闭环」风格挂载媒体插槽（仅在明确接受风险时使用）")
    ap.add_argument("--my-styles", action="store_true", help="直接创建到 ~/aicv-my-styles/<slug>/ 并登记索引")
    ap.add_argument("--out", help="指定输出目录（默认 packs/<slug> 或配合 --my-styles）")
    ap.add_argument("--save", metavar="DIR", help="把已有风格包目录保存到 ~/aicv-my-styles/ 并更新索引")
    ap.add_argument("--as", dest="as_slug", help="配合 --save 指定保存后的 slug")
    ap.add_argument("--list", action="store_true", help="列出 ~/aicv-my-styles/ 下的个人风格包")
    a = ap.parse_args()

    if a.list:
        cmd_list()
    elif a.add_media:
        cmd_add_media(a)
    elif a.save:
        cmd_save(a)
    elif a.slug and a.source:
        cmd_create(a)
    else:
        ap.print_help()
        sys.exit(2)


if __name__ == "__main__":
    main()
