"""从 lib/lib.js 和 lib/synth.py 的注释生成 samples/API.md（函数速查，写场景时读它，不读源码）。

    python3 tools/apidoc.py           # 重新生成
    python3 tools/apidoc.py --check   # 只检查 API.md 是否过期（过期则退出码 1）

lib.js：函数或常量上一行的 // 注释、或常量行尾的 // 注释，就是它的说明。
synth.py：函数文档字符串的第一行就是说明。没写说明的函数也会列出，只是没有说明。
"""
import ast
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
LIB, SYNTH, OUT = HERE / "lib" / "lib.js", HERE / "lib" / "synth.py", HERE / "API.md"

HEAD = """# 样片 API 速查

由 `tools/apidoc.py` 从 `lib/lib.js`、`lib/synth.py` 的注释生成，不要手改；改了源码注释后重新生成。

场景文件的写法：`scene({id, name, dur, still, fonts, init, draw})`，`draw(ctx, t, s, f)` 里 `t` 是秒、`s` 是 `init()` 的返回值、`f` 是帧号。
每帧只由 `t` 决定；随机数用 `mulberry32` / `hash2`。横竖构图看 `LAND`，尺寸按 `SHORT / 1080` 缩放。
声音文件的写法：`score(m)` 里用 `m.put(声音, 秒, 音量, 声像)`；`m.dur` 是时长，`m.rng` 是固定种子的随机数。
"""


def js_items():
    lines = LIB.read_text(encoding="utf-8").splitlines()
    out, sec = [], None
    for i, ln in enumerate(lines):
        m = re.match(r"// -{3,} (.+?) -{3,}", ln)
        if m:
            out.append(("##", m.group(1)))
            continue
        prev = lines[i - 1] if i else ""
        doc = prev[3:].strip() if prev.startswith("// ") and not prev.startswith("// ---") else ""
        m = re.match(r"function (\w+)\(([^)]*)\)", ln)
        if m:
            out.append((f"{m.group(1)}({m.group(2)})", doc))
            continue
        m = re.match(r"const (\w+) = (\([^)]*\)|\w+) =>", ln)
        if m:
            args = m.group(2) if m.group(2).startswith("(") else f"({m.group(2)})"
            out.append((m.group(1) + args, doc))
            continue
        m = re.match(r"const (.+?);\s*//\s*(.+)$", ln)
        if m:
            names = re.findall(r"(?:^|,\s*)([A-Z]\w*) =", m.group(1))
            out.append((" ".join(names), m.group(2)))
            continue
        m = re.match(r"const (\w+) = ", ln)
        if m and doc:
            out.append((m.group(1), doc))
    return out


def py_items():
    tree = ast.parse(SYNTH.read_text(encoding="utf-8"))
    src = SYNTH.read_text(encoding="utf-8").splitlines()
    out = []

    def sig(fn):
        a = ast.unparse(fn.args)
        return f"{fn.name}({a})"

    def first(fn):
        d = ast.get_docstring(fn)
        return d.splitlines()[0].strip() if d else ""

    sec_at, cur = {}, None
    for i, ln in enumerate(src, 1):
        m = re.match(r"# -{3,} (.+?) -{3,}", ln)
        if m:
            cur = m.group(1)
        sec_at[i] = cur
    last = None

    def head(lineno):
        nonlocal last
        if sec_at.get(lineno) and sec_at[lineno] != last:
            last = sec_at[lineno]
            out.append(("##", last))

    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            head(node.lineno)
            out.append((sig(node), first(node)))
        elif isinstance(node, ast.ClassDef):
            out.append(("##", f"混音台 {node.name}"))
            out.append((f"{node.name}(dur, seed=7)", (ast.get_docstring(node) or "").splitlines()[0]))
            for f in node.body:
                if isinstance(f, ast.FunctionDef) and not f.name.startswith("_"):
                    out.append((f"m.{sig(f).replace('self, ', '').replace('(self)', '()')}", first(f)))
        elif isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name) and node.targets[0].id.isupper():
            out.append((node.targets[0].id, f"= {ast.unparse(node.value)}"))
    return out


def table(items):
    rows = []
    for k, v in items:
        if k == "##":
            rows.append(f"\n**{v}**\n")
            continue
        rows.append(f"- `{k}`" + (f" — {v}" if v else ""))
    return "\n".join(rows)


def build():
    return (HEAD + "\n## lib.js（场景里直接用，全局可见）\n" + table(js_items()) +
            "\n\n## synth.py（`from synth import …`）\n" + table(py_items()) + "\n")


def main():
    txt = build()
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != txt:
            sys.exit("samples/API.md 过期：运行 python3 samples/tools/apidoc.py")
        print("API.md 是最新的")
        return
    OUT.write_text(txt, encoding="utf-8")
    print(f"写好 {OUT.relative_to(HERE.parent)}（{len(txt.encode())} 字节）")


if __name__ == "__main__":
    main()
