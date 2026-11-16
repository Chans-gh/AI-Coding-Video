#!/usr/bin/env python3
"""画面文案检查：部件容量表 + 禁用词 + 口播拆句。只用标准库。

为什么要有它：容量溢出（便签、片尾、大数字）和禁用词都是**渲染之后才看得出来**的，
渲染一次几分钟，改字还要重配音、重渲。所以在**配音之前**先扫一遍文案。

用法：
    python3 tools/check_copy.py videos/<短名>            # 查一期
    python3 tools/check_copy.py videos/<短名> --quiet    # 没问题时不输出
    python3 tools/check_copy.py videos/<短名> --config copy.json

表放在项目里：期目录下的 `copy.json`（也可以 `--config` 指定别处）。
**没有配置文件就只查通用的**（极限词、口播长句）——容量表和禁用词是这个项目的说法，每个项目不同。
配置格式（键是「部件.字段」，`forbidden` 是 [词, 为什么]）：

    {"limits":   {"openTape.sub": 22, "outro.title": 10},
     "row_sum":  {"receipt.rows": 13},
     "big_num":  {"bigNumber.to": 3.3},
     "shrink":   {"openTape.title": 12},
     "small_limit": 34, "hand_limit": 24,
     "forbidden": [["保证收益", "收益承诺"], ["返本", "收益承诺"]],
     "extreme": ["最", "顶级", "绝对", "全网"],
     "narration_max": 40}

数值＝部件可用宽度 ÷ 字号（竖版 1080）：中文、全角按 1 字宽，数字和半角符号按 0.5 字宽，
这样算出来和画面上看到的宽度对得上。

判定：✗（超容量、禁用词）→ 退出码 1；提醒（极限词、长句、自动缩字号）不影响退出码。
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

EXTREME_DEFAULT = ["最", "顶级", "绝对", "全网"]   # 通用极限词，只提醒（广告法第九条）
NARRATION_MAX_DEFAULT = 40                        # 口播单句上限，超了提醒拆句
NEG = ("不写", "不放", "不要", "不去", "避免", "删掉", "去掉", "别用", "不说", "不出现")
NARROW = re.compile(r"[0-9A-Za-z .·%–—/()+\-]")


def width(s: str) -> float:
    """字宽：中文/全角 1，数字与半角符号 0.5。"""
    return sum(0.5 if NARROW.fullmatch(ch) else 1.0 for ch in s)


def value_of(block: str, key: str) -> str | None:
    """取对象字面量里某个顶层 key 的原文（按括号深度找值的边界）。"""
    m = re.search(r"[{,\s]" + re.escape(key) + r"\s*:", block) or re.match(re.escape(key) + r"\s*:", block)
    if not m:
        return None
    i, depth, start = m.end(), 0, m.end()
    while i < len(block):
        ch = block[i]
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            if depth == 0:
                break
            depth -= 1
        elif ch == "," and depth == 0:
            break
        i += 1
    return block[start:i].strip()


def strings_in(text: str) -> list[str]:
    return [a or b for a, b in re.findall(r"'([^']*)'|\"([^\"]*)\"", text)]


def part_blocks(src: str):
    """扫段代码里的 `fn: JR.<部件>, o: { ... }`。"""
    for m in re.finditer(r"fn:\s*JR\.(\w+)", src):
        i = src.find("o:", m.end())
        if i < 0:
            continue
        b = src.find("{", i)
        if b < 0:
            continue
        depth = 0
        for j in range(b, len(src)):
            if src[j] == "{":
                depth += 1
            elif src[j] == "}":
                depth -= 1
                if depth == 0:
                    yield m.group(1), src[b:j + 1]
                    break


def load_config(path: Path | None) -> dict:
    """读项目的表；没有文件就只留通用项。键「部件.字段」拆成 (部件, 字段)。"""
    cfg = {"limits": {}, "row_sum": {}, "big_num": {}, "shrink": {},
           "small_limit": None, "hand_limit": None,
           "forbidden": [], "extreme": EXTREME_DEFAULT, "narration_max": NARRATION_MAX_DEFAULT}
    if not path or not path.is_file():
        return cfg
    raw = json.loads(path.read_text(encoding="utf-8"))
    for k in ("limits", "row_sum", "big_num", "shrink"):
        for key, v in (raw.get(k) or {}).items():
            if "." not in key:
                raise SystemExit(f"copy.json 的 {k} 里「{key}」要写成「部件.字段」")
            part, field = key.split(".", 1)
            cfg[k][(part, field)] = v
    for k in ("small_limit", "hand_limit", "narration_max"):
        if isinstance(raw.get(k), (int, float)) and not isinstance(raw.get(k), bool):
            cfg[k] = raw[k]
    if raw.get("extreme"):
        cfg["extreme"] = list(raw["extreme"])
    cfg["forbidden"] = [tuple(x) for x in (raw.get("forbidden") or [])]
    return cfg


def check_episode(ep: Path, quiet: bool) -> int:
    cfg = load_config(ep / "copy.json")
    seg_dir = ep / "segments"
    errs: list[str] = []
    warns: list[str] = []
    seen: list[str] = []

    # 1) 段代码里的部件文案
    for js in sorted(seg_dir.glob("*.js")) if seg_dir.is_dir() else []:
        if js.name.startswith("_"):
            continue
        src = js.read_text(encoding="utf-8")
        for part, block in part_blocks(src):
            for (p, key), limit in cfg["limits"].items():
                if p != part:
                    continue
                val = value_of(block, key)
                if val is None:
                    continue
                for s in strings_in(val):
                    if not s.strip():
                        continue
                    seen.append(s)
                    if width(s) > limit:
                        errs.append(f"{js.name}  {part}.{key} = 「{s}」 {width(s):.1f} 字 > 上限 {limit}")
            for (p, key), limit in cfg["big_num"].items():
                if p != part:
                    continue
                val = value_of(block, key)
                if val is None:
                    continue
                s = val.strip().strip("'\"")
                if width(s) > limit:
                    errs.append(f"{js.name}  {part}.{key} = 「{s}」 太宽（{width(s):.1f} > {limit}）——单位别用 suffix，用 FILM.unit 补在右边")
                if "suffix" in block:
                    warns.append(f"{js.name}  {part} 用了 suffix：单位会跟着大字号加宽，容易顶出画面，改用 FILM.unit()")
            for (p, key), limit in cfg["shrink"].items():
                if p != part:
                    continue
                val = value_of(block, key)
                if val:
                    for s in strings_in(val):
                        if width(s) > limit:
                            warns.append(f"{js.name}  {part}.{key}「{s}」{width(s):.1f} 字 → 部件会自动缩字号（画面上比别处小）")
            for (p, key), limit in cfg["row_sum"].items():
                if p != part:
                    continue
                val = value_of(block, key)
                if val is None:
                    continue
                for row in re.findall(r"\[([^\[\]]*)\]", val):
                    cells = strings_in(row)
                    if cells and sum(width(c) for c in cells) > limit:
                        errs.append(f"{js.name}  {part}.{key} 一行 = 「{' / '.join(cells)}」 合计 {sum(width(c) for c in cells):.1f} 字 > 上限 {limit}")
        # 页边小字 / 手写条：FILM.small(...) / JR.hand(...)
        if cfg["small_limit"] is not None:
            for s in strings_in(" ".join(re.findall(r"FILM\.small\([^;]*?\)", src, re.S))):
                if s.strip():
                    seen.append(s)
                    if width(s) > cfg["small_limit"]:
                        errs.append(f"{js.name}  页边小字「{s}」{width(s):.1f} 字 > 上限 {cfg['small_limit']}")
        if cfg["hand_limit"] is not None:
            for s in strings_in(" ".join(re.findall(r"JR\.hand\([^;]*?\)", src, re.S))):
                if s.strip():
                    seen.append(s)
                    if width(s) > cfg["hand_limit"] and not re.search(r"[\u4e00-\u9fff]", s[:1]):
                        warns.append(f"{js.name}  手写串「{s}」{width(s):.1f} 字，注意部件宽度")

    # 2) 分镜的 what（会被人照着写文案，也算文案面）
    sb_path = ep / "storyboard.json"
    if sb_path.is_file():
        for seg in json.loads(sb_path.read_text(encoding="utf-8"))["segments"]:
            for sh in seg.get("shots") or []:
                seen.append(sh.get("what", ""))

    # 3) 禁用词 + 极限词
    hay = "\n".join(seen)
    for word, why in cfg["forbidden"]:
        for m in re.finditer(re.escape(word), hay):
            if any(n in hay[max(0, m.start() - 12):m.start()] for n in NEG):
                continue                          # 「不写「不是收益承诺」」这种描述不算出现
            errs.append(f"禁用词「{word}」（{why}）")
            break
    for word in cfg["extreme"]:
        if word in hay:
            warns.append(f"极限词「{word}」出现：确认分镜 note 里有用户已知悉的留痕（广告法第九条）")

    # 4) 口播拆句
    sc_path = ep / "script.json"
    if sc_path.is_file():
        for seg in json.loads(sc_path.read_text(encoding="utf-8"))["segments"]:
            for i, v in enumerate(seg.get("vo") or [], 1):
                if len(v) > cfg["narration_max"]:
                    warns.append(f"{seg['seg']}-{i} 口播 {len(v)} 字：建议拆句（一句 ≤ {cfg['narration_max']} 字更好念）")

    # 输出
    if errs or not quiet:
        print(f"画面文案检查：{ep}（部件文案 {len(seen)} 条）")
    for e in errs:
        print(f"✗ {e}")
    for w in warns:
        print(f"提醒：{w}")
    if not errs:
        print(f"✓ 容量都在表内、没有禁用词（提醒 {len(warns)} 条）")
    return 1 if errs else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="画面文案检查：部件容量 + 禁用词 + 口播拆句")
    ap.add_argument("episode", help="期目录，例如 videos/ep02")
    ap.add_argument("--config", help="表放在哪（默认期目录下的 copy.json）")
    ap.add_argument("--quiet", action="store_true", help="没问题时不输出")
    a = ap.parse_args()
    ep = Path(a.episode)
    if not (ep / "storyboard.json").is_file() and not (ep / "script.json").is_file():
        print(f"停下：{ep} 里没有 storyboard.json，也没有 script.json")
        return 2
    if a.config:
        cfg_path = Path(a.config)
        (ep / "copy.json").write_text(cfg_path.read_text(encoding="utf-8"), encoding="utf-8")
    return check_episode(ep, a.quiet)


if __name__ == "__main__":
    sys.exit(main())
