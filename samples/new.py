"""给新样片起骨架：从风格条目读出名字、提示词、题材，生成 <编号>/scene.js、sound.py、meta.json。

    python3 new.py C-168 C-169

已有的文件不覆盖。生成后：
  1. scene.js 第一行写一句「怎么画的」（介绍页会用），再写 init() 和 draw()；函数速查见 API.md
  2. sound.py 写 score(m)
  3. meta.json 填英文名、英文描述，按实际用到的技术改 tech（标签只能用 Skill 的 data/tags.json 里有的）
  4. python3 batch.py <编号> --quick 看效果，满意了去掉 --quick 出片
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
STYLES = HERE.parent / "skills" / "ai-coding-video" / "data" / "styles.json"

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


def load():
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
        tech = [t for t in s.get("suggested", []) if t in ("Canvas 2D", "WebGL", "WebGL2", "GLSL", "终端字符")] or ["Canvas 2D"]
        files = {
            "scene.js": SCENE.format(id=sid, name=s["name"], prompt=s["prompt"], theme=s["theme"], fit=s.get("fit", "")),
            "sound.py": SOUND.format(id=sid, name=s["name"]),
            "meta.json": json.dumps({"en_name": "", "en_how": "", "tech": tech + ["Playwright", "ffmpeg"]},
                                    ensure_ascii=False, indent=2) + "\n",
        }
        made = []
        for name, txt in files.items():
            if not (d / name).exists():
                (d / name).write_text(txt, encoding="utf-8"); made.append(name)
        print(f"{sid} {s['name']}：" + ("新建 " + "、".join(made) if made else "文件都已存在，没动"))


if __name__ == "__main__":
    main()
