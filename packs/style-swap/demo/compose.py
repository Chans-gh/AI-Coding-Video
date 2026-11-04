"""把 prompts.json 拼成 assets.json 里的生图项：每种画风 × 每个镜头一张，提示词 = 镜头段 + 风格段 + 约束段。

    python3 ../packs/style-swap/demo/compose.py        # 改了 prompts.json 之后跑一次（在 samples/ 下或任何目录都行）
    python3 tools/assets.py pack:style-swap            # 再补齐缺的图（已有的不动；提示词变了的用 --only … --force 重做）

assets.json 里除生图以外的项（旁白、配乐）原样保留；已有生图项的其他字段（如 prep）也保留，只更新 model、prompt、params。
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def prompt(P, shot, style):
    parts = {"shot": shot["prompt"], "style": P["styles"][style], "rules": P["rules"]}
    return "".join(s.format(**parts) for s in P["join"])


def main():
    P = json.loads((HERE / "prompts.json").read_text(encoding="utf-8"))
    af = HERE / "assets.json"
    A = json.loads(af.read_text(encoding="utf-8")) if af.exists() else {"items": []}
    old = {it["file"]: it for it in A["items"]}
    gen = []
    for style in P["styles"]:
        for shot in P["shots"]:
            f = f"assets/{style}-{shot['id']}.jpg"
            it = old.get(f, {"file": f, "kind": "生图"})
            it.update(model=P["model"], prompt=prompt(P, shot, style), params=P["params"],
                      license="AI 生成，随本仓库按 MIT 发布", credit="画面 AI 生成")
            it.setdefault("prep", P["prep"])
            gen.append(it)
    rest = [it for it in A["items"] if it.get("kind") != "生图"]
    A["items"] = gen + rest
    af.write_text(json.dumps(A, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"assets.json：{len(gen)} 张生图（{len(P['styles'])} 种画风 × {len(P['shots'])} 个镜头）+ {len(rest)} 项声音")


if __name__ == "__main__":
    main()
