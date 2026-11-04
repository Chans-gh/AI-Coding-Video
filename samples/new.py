"""给新样片起骨架：从风格条目读出名字、提示词、题材，生成 <编号>/scene.js、sound.py、meta.json。

    python3 new.py C-168 C-169
    python3 new.py T-013                # T 类、G 类另起 assets.json（素材清单），scene.js 和 sound.py 换成读素材的写法

已有的文件不覆盖。生成后：
  1. scene.js 第一行写一句「怎么画的」（介绍页会用），再写 init() 和 draw()；函数速查见 API.md
  2. sound.py 写 score(m)
  3. meta.json 填英文名、英文描述，按实际用到的技术改 tech（标签只能用 Skill 的 data/tags.json 里有的）
  T 类、G 类先填 assets.json，跑 python3 tools/assets.py <编号> 下载或生成素材
  4. python3 batch.py <编号> --quick 看效果，满意了去掉 --quick 出片
"""
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
# 风格数据：本仓库里在 ../skills/ai-coding-video/data/；随 Skill 安装时 samples/ 就在 Skill 目录里，在 ../data/；
# 拷进别的项目后找不到，用环境变量 AICV_SKILL 指向 Skill 目录
_CANDIDATES = ([Path(os.environ["AICV_SKILL"])] if os.environ.get("AICV_SKILL") else []) + [HERE.parent / "skills" / "ai-coding-video", HERE.parent]
STYLES = next((d / "data" / "styles.json" for d in _CANDIDATES if (d / "data" / "styles.json").exists()), None)

SCENE = """// {id} {name}：（一句话写清画面是怎么用代码做出来的，介绍页会用这一句）
// 风格提示词：{prompt}
// 题材：{theme} · 适合：{fit}
scene({{
  id: '{id}', name: '{name}', dur: 3, still: 2.1,
  fonts: ["700 40px 'Noto Sans SC'"],
  init() {{
    // 纹理、离屏画布、随机布局在这里做一次；返回值就是 draw 的 s
    return {{}};
  }},
  draw(ctx, t, s, f) {{
    const u = SHORT / 1080;                                  // 尺寸单位：按短边缩放
    // 构图：横屏（LAND）主体放右侧、文字在左；竖屏主体在上、文字在下
    const cx = LAND ? W * .62 : W / 2, cy = LAND ? H / 2 : H * .4;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#eee'; ctx.font = `700 ${{Math.round(64 * u)}}px 'Noto Sans SC'`;
    ctx.textAlign = 'center'; ctx.fillText('{name}', cx, cy + Math.sin(t * 2) * 20 * u);
  }}
}});
"""

SOUND = '''"""{id} {name}：（一句话写这段声音有什么、在哪些时刻）"""
from synth import kick, tick, bell, pad, whoosh, hz, tt


def score(m):
    beat = 60 / 160                       # 160 BPM，3 秒 8 拍
    m.put(whoosh(m, .8), 0, .3)           # 开场
    for b in range(8):
        m.put(tick(m), b * beat, .2)
'''


SCENE_TG = """// {id} {name}：（一句话写清素材怎么排、怎么剪、加了什么动效，介绍页会用这一句）
// 素材：（列出种类和出处，详见 assets.json）
// 内容类型：{ctype} · 素材：{mats}
scene({{
  id: '{id}', name: '{name}', dur: 12, still: 6,
  fonts: ["700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  async init() {{
    const A = await loadAssets();                           // assets.json：字幕 lines、署名
    // const img = await loadImage('photo.jpg'); const v = await loadVideo('clip.mp4');
    return {{ A }};
  }},
  async draw(ctx, t, s) {{
    const u = SHORT / 1080;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    // 视频按帧取：drawCover(ctx, await s.v.at(t), 0, 0, W, H)
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, {{ size: LAND ? 38 : 44 }});
    ctx.font = `400 ${{17 * u}}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 32 * u, H - 22 * u);
  }}
}});
"""

SOUND_TG = '''"""{id} {name}：照 assets.json 摆旁白、配乐，再加几个合成音效"""
from pathlib import Path
from synth import assets, whoosh


def score(m):
    assets(m, Path(__file__).parent)      # 旁白、原声按 at 放；配乐铺底，说话时压低
    m.put(whoosh(m, .8), 0, .2)
'''

ASSETS_TG = {"items": [
    {"file": "assets/example.jpg", "kind": "照片", "source": "", "download": "", "license": "", "author": "", "credit": "",
     "prep": {"max": 2400}},
    {"file": "assets/music.mp3", "kind": "配乐", "source": "", "download": "", "license": "CC0", "author": "", "credit": "",
     "prep": {"t": 15}, "at": 0},
]}


def load():
    if STYLES is None:
        sys.exit("找不到风格数据 data/styles.json：设环境变量 AICV_SKILL=<Skill 目录>（装好的 ai-coding-video 文件夹）")
    d = json.loads(STYLES.read_text(encoding="utf-8"))
    return {s["id"]: s for s in (d if isinstance(d, list) else d["styles"])}


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    styles = load()
    for sid in sys.argv[1:]:
        s = styles.get(sid)
        if not s:
            print(f"✗ {sid}：风格目录里没有这个编号"); continue
        d = HERE / sid
        d.mkdir(exist_ok=True)
        tech = [t for t in s.get("suggested", []) if t in ("Canvas 2D", "WebGL", "WebGL2", "GLSL", "终端字符", "SVG", "HTML/CSS", "GSAP", "p5.js", "p5.brush", "Rough.js", "D3.js", "Three.js", "cannon-es", "Remotion")] or ["Canvas 2D"]
        tg = sid[0] in "TG"
        files = {
            "scene.js": SCENE_TG.format(id=sid, name=s["name"], ctype=s.get("content_type", ""), mats=" · ".join(s.get("materials", [])))
            if tg else SCENE.format(id=sid, name=s["name"], prompt=s["prompt"], theme=s["theme"], fit=s.get("fit", "")),
            "sound.py": (SOUND_TG if tg else SOUND).format(id=sid, name=s["name"]),
            "meta.json": json.dumps({"en_name": "", "en_how": "", "tech": tech + ["Playwright", "ffmpeg"]},
                                    ensure_ascii=False, indent=2) + "\n",
        }
        if tg:
            files["assets.json"] = json.dumps(ASSETS_TG, ensure_ascii=False, indent=2) + "\n"
        made = []
        for name, txt in files.items():
            if not (d / name).exists():
                (d / name).write_text(txt, encoding="utf-8"); made.append(name)
        print(f"{sid} {s['name']}：" + ("新建 " + "、".join(made) if made else "文件都已存在，没动"))


if __name__ == "__main__":
    main()
