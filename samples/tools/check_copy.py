#!/usr/bin/env python3
"""画面文案检查：部件容量表 + 禁用词 + 口播拆句。只用标准库。

为什么要有它：容量溢出（便签、片尾、大数字）和禁用词都是**渲染之后才看得出来**的，
渲染一次几分钟，改字还要重配音、重渲。所以在**配音之前**先扫一遍文案。

用法：
    python3 tools/check_copy.py videos/<短名>            # 查一期
    python3 tools/check_copy.py videos/<短名> --quiet    # 没问题时不输出
    python3 tools/check_copy.py videos/<短名> --config copy.json
    python3 tools/check_copy.py videos/<短名> --plan plans/<短名>/content.md   # 接策划格式 5：并进红线「词：」的词

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
禁用词、极限词只查**上屏的字**：段代码里部件的字（`o: {…}` 里的字符串）、页边小字和手写条、分镜脚本里分镜的 `o`、
字幕（逐字稿的 `vo` 按 `show` 换成字幕写法）。分镜的 `what` 是给人看的描述，不上屏，不查。
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


def redline_words(content: Path) -> list[tuple[str, str]]:
    """策划格式 5 的 content.md「## 红线」里「怎么查」写「词：「…」「…」」的词 → [(词, 为什么)]"""
    return [(w, why) for w, why, _ in redline_rules(content)]


def content_title(content: Path) -> list[str]:
    """content.md 的题目（标题行，和「内容表：」后面的部分）"""
    for line in content.read_text(encoding="utf-8").splitlines():
        if line.startswith("# "):
            t = line[2:].strip()
            out = {t} | ({re.split(r"[：:]", t, maxsplit=1)[1].strip()} if re.search(r"[：:]", t) else set())
            return sorted((x for x in out if x), key=len, reverse=True)
    return []


def redline_rules(content: Path) -> list[tuple[str, str, dict]]:
    """[(词, 为什么, 例外)]。例外只认「；除外：」后面的 S 编号和「题目」（策划 0.8.1）：
    {"s": {"S1"}, "title": True, "odd": [读不出的例外说明]}；读不出的按没有例外查，撞上了只提醒、交人工看"""
    out, sec = [], None
    for line in content.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            sec = line[3:].strip()
            continue
        if sec != "红线" or not line.lstrip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 3 or not re.fullmatch(r"B\d+", cells[0]):
            continue
        m = re.match(r"词[：:](.*)", cells[2])
        if not m:
            continue
        parts = re.split(r"[；;]", m.group(1))
        ex = {"s": set(), "title": False, "odd": []}
        for part in (p.strip() for p in parts[1:]):
            e = re.fullmatch(r"除外[：:](.*)", part)
            if not part:
                continue
            if not e:
                ex["odd"].append(part)
                continue
            for item in re.split(r"[、，,\s]+", e.group(1).strip().rstrip("。")):
                r = re.fullmatch(r"S(\d+)(?:\s*[–\-~—]\s*S?(\d+))?", item)
                if item == "题目":
                    ex["title"] = True
                elif r:
                    ex["s"] |= {f"S{n}" for n in range(int(r.group(1)), int(r.group(2) or r.group(1)) + 1)}
                elif item:
                    ex["odd"].append(f"除外：{item}")
        for w in re.findall(r"「([^」]+)」", parts[0]):
            out.append((w, f"红线 {cells[0]}：{cells[1]}", ex))
    return out


def say_ids(item) -> set[str]:
    """逐字稿 say 的一项 → S 编号"""
    if isinstance(item, str):
        return {item}
    return {x for x in item if isinstance(x, str)} if isinstance(item, list) else set()


def leaf_strings(x) -> list[str]:
    if isinstance(x, str):
        return [x]
    if isinstance(x, list):
        return [s for y in x for s in leaf_strings(y)]
    if isinstance(x, dict):
        return [s for k, y in x.items() if k != "part" for s in leaf_strings(y)]
    return []


def check_episode(ep: Path, quiet: bool, plan: Path | None = None) -> int:
    cfg = load_config(ep / "copy.json")
    rules = {}                                    # 词 → 例外（只有红线来的词有）
    titles = []
    if plan is not None:
        have = {w for w, _ in cfg["forbidden"]}
        for w, why, ex in redline_rules(plan):
            if w not in have:
                cfg["forbidden"].append((w, why))
                rules[w] = ex
                have.add(w)
        titles = content_title(plan)
    seg_dir = ep / "segments"
    errs: list[str] = []
    warns: list[str] = []
    seen: list[str] = []
    screen: list[tuple[str, set]] = []            # 上屏的字：(字, 这句字幕念的是哪几句 S)

    # 1) 段代码里的部件文案
    for js in sorted(seg_dir.glob("*.js")) if seg_dir.is_dir() else []:
        if js.name.startswith("_"):
            continue
        src = js.read_text(encoding="utf-8")
        for part, block in part_blocks(src):
            screen += [(s, set()) for s in strings_in(block) if s.strip()]
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

    for js in sorted(seg_dir.glob("*.js")) if seg_dir.is_dir() else []:   # 页边小字、手写条也上屏
        if not js.name.startswith("_"):
            src = js.read_text(encoding="utf-8")
            screen += [(s, set()) for s in strings_in(" ".join(re.findall(r"(?:FILM\.small|JR\.hand)\([^;]*?\)", src, re.S)))
                       if s.strip()]

    # 2) 分镜脚本里分镜的 o（上屏的字）；what 是给人看的描述，不上屏，不查
    sb_path = ep / "storyboard.json"
    if sb_path.is_file():
        for seg in json.loads(sb_path.read_text(encoding="utf-8"))["segments"]:
            for sh in seg.get("shots") or []:
                screen += [(s, set()) for s in leaf_strings(sh.get("o")) if s.strip()]
                for y in sh.get("over") if isinstance(sh.get("over"), list) else [sh.get("over")]:
                    if isinstance(y, dict):
                        screen += [(s, set()) for s in leaf_strings(y) if s.strip()]

    # 3) 字幕：逐字稿的 vo 按 show 换成字幕写法，记下念的是哪几句 S
    sc_path = ep / "script.json"
    sc = json.loads(sc_path.read_text(encoding="utf-8")) if sc_path.is_file() else {}
    show = sc.get("show") if isinstance(sc.get("show"), dict) else {}
    for seg in sc.get("segments") or []:
        say = seg.get("say") if isinstance(seg.get("say"), list) else []
        for k, v in enumerate(seg.get("vo") or []):
            if not isinstance(v, str):
                continue
            for a in sorted((a for a in show if isinstance(a, str) and isinstance(show[a], str)), key=len, reverse=True):
                v = v.replace(a, show[a])
            screen.append((v, say_ids(say[k]) if k < len(say) else set()))

    # 4) 禁用词 + 极限词（只查上屏的字）
    hit: dict[str, list[str]] = {}
    for word, why in cfg["forbidden"]:
        ex = rules.get(word) or {"s": set(), "title": False, "odd": []}
        for text, ids in screen:
            if ids & ex["s"]:
                continue                          # 红线「；除外：S…」写到的句子不查
            if ex["title"]:
                for t in titles:
                    text = text.replace(t, "")    # 「；除外：题目」：题目本身不查
            m = re.search(re.escape(word), text)
            if m is None or any(n in text[max(0, m.start() - 12):m.start()] for n in NEG):
                continue                          # 「不写「不是收益承诺」」这种说明不算出现
            hit.setdefault(word, []).append(text)
        if word in hit:
            if ex["odd"]:
                warns.append(f"禁用词「{word}」（{why}）出现在「{hit[word][0][:20]}」；这条红线的例外读不出"
                             f"（「{'；'.join(ex['odd'])[:24]}」），交人工看是不是例外")
            else:
                errs.append(f"禁用词「{word}」（{why}）")
    for word in cfg["extreme"]:
        if any(word in text for text, _ in screen):
            warns.append(f"极限词「{word}」出现：确认分镜 note 里有用户已知悉的留痕（广告法第九条）")

    # 5) 口播拆句
    if sc:
        for seg in sc["segments"]:
            for i, v in enumerate(seg.get("vo") or [], 1):
                if len(v) > cfg["narration_max"]:
                    warns.append(f"{seg['seg']}-{i} 口播 {len(v)} 字：建议拆句（一句 ≤ {cfg['narration_max']} 字更好念）")

    # 输出
    if errs or not quiet:
        print(f"画面文案检查：{ep}（上屏的字 {len(screen)} 条）")
    for e in errs:
        print(f"✗ {e}")
    for w in warns:
        print(f"提醒：{w}")
    if not errs:
        print(f"✓ 容量都在表内、没有禁用词（提醒 {len(warns)} 条）")
    return 1 if errs else 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="画面文案检查：部件容量 + 禁用词 + 口播拆句")
    ap.add_argument("episode", help="期目录，例如 videos/ep02")
    ap.add_argument("--config", help="表放在哪（默认期目录下的 copy.json）")
    ap.add_argument("--quiet", action="store_true", help="没问题时不输出")
    ap.add_argument("--plan", help="策划格式 5 的 content.md：红线「词：」里的词并进禁用词，和 copy.json 合并")
    a = ap.parse_args(argv)
    ep = Path(a.episode)
    if not (ep / "storyboard.json").is_file() and not (ep / "script.json").is_file():
        print(f"停下：{ep} 里没有 storyboard.json，也没有 script.json")
        return 2
    if a.config:
        cfg_path = Path(a.config)
        (ep / "copy.json").write_text(cfg_path.read_text(encoding="utf-8"), encoding="utf-8")
    plan = Path(a.plan) if a.plan else None
    if plan is not None and not plan.is_file():
        print(f"停下：找不到 {plan}")
        return 2
    return check_episode(ep, a.quiet, plan)


if __name__ == "__main__":
    sys.exit(main())
