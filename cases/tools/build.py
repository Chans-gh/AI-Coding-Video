"""从各案例的 case.json 生成 README 里的段落表、附带成片、用量、降级用法、对比口径和链接，以及 cases/README.md 的总表。

    python3 cases/tools/build.py           # 重新生成
    python3 cases/tools/build.py --check   # 只检查：case.json 合规、README 没过期（有问题时退出码 1）

case.json 是正本，README 里 <!-- gen:名字 --> 和 <!-- /gen --> 之间的内容由本脚本写，不要手改。
字段说明见 cases/README.md 的「case.json」一节。
"""
import json
import re
import sys
from pathlib import Path

CASES = Path(__file__).resolve().parent.parent
ROOT = CASES.parent
CLASSES = "CTG"
CLASS_NAME = {"C": "C 代码画", "T": "T 真实素材", "G": "G AI 生成"}
STATUS = ("策划", "制作中", "完成")
REF = re.compile(r"^[CTG]-\d{3}$")
BLOCK = re.compile(r"(<!-- gen:(\w+) -->\n)(.*?)(<!-- /gen -->)", re.S)

STYLES = {s["id"]: s for s in json.loads((ROOT / "skills/ai-coding-video/data/styles.json").read_text(encoding="utf-8"))["styles"]}


def pack(name):
    p = ROOT / "packs" / name / "meta.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def ref_class(ref):
    """一条技术的类别跟它对应的样片走；风格包跟它沉淀自的样片走。"""
    if ref.startswith("pack:"):
        m = pack(ref[5:])
        return m and m.get("from", "")[:1]
    return ref[:1] if REF.match(ref) and ref in STYLES and (ROOT / "samples" / ref).is_dir() else None


def item_class(u):
    return ref_class(u["ref"]) if "ref" in u else u.get("class")


def fmt_t(s):
    s = round(s)
    return f"{s // 60}:{s % 60:02d}"


def fmt_cost(c):
    if c is None:
        return "—"
    return f"{c[0]}–{c[1]}" if isinstance(c, list) else str(c)


def cost_range(rows):
    lo = hi = 0
    for r in rows:
        c = r.get("cost")
        if c is None:
            continue
        a, b = c if isinstance(c, list) else (c, c)
        lo, hi = lo + a, hi + b
    return lo, hi


def fmt_range(lo, hi):
    return str(lo) if lo == hi else f"{lo}–{hi}"


def total_sec(case):
    return sum(s["sec"] for s in case["segments"])


def fmt_len(case):
    m = total_sec(case) / 60
    out = f"约 {m:g} 分钟" if m == int(m) or m * 2 == int(m * 2) else f"约 {m:.1f} 分钟"
    for e in case.get("extras", []):
        out += f" + {e['count']} × {e['sec']} 秒"
    return out


def check(name, case):
    errs = []
    e = errs.append
    for k in ("title", "summary", "ar", "lead", "status", "segments", "usage", "downgrade", "compare"):
        if k not in case:
            e(f"缺字段 {k}")
    if errs:
        return errs
    if case["lead"] not in CLASSES:
        e(f"lead 只能是 C、T、G：{case['lead']}")
    if case["status"] not in STATUS:
        e(f"status 只能是 {'、'.join(STATUS)}：{case['status']}")
    used, lead_sec = set(), dict.fromkeys(CLASSES, 0)

    def uses(where, lst):
        got = set()
        for u in lst:
            if ("ref" in u) == ("class" in u):
                e(f"{where}「{u.get('what')}」：ref 和 class 只写一个（有样片写 ref，类别跟样片走）")
                continue
            c = item_class(u)
            if not c or c not in CLASSES:
                e(f"{where}「{u.get('what')}」：{u.get('ref') or u.get('class')} 不是已有的样片、风格包或类别")
                continue
            got.add(c)
        return got

    titles = [s.get("title") for s in case["segments"]]
    if len(set(titles)) != len(titles):
        e("段的标题有重复")
    for i, s in enumerate(case["segments"], 1):
        where = f"第 {i} 段"
        got = uses(where, s.get("uses", []))
        used |= got
        if not s.get("lead") or s.get("lead") not in got:
            e(f"{where}：lead {s.get('lead')} 不在本段用到的类别 {sorted(got)} 里")
        else:
            lead_sec[s["lead"]] += s["sec"]
        if ("start" in s) != ("end" in s):
            e(f"{where}：start、end 要一起写（接片时由程序写）")
    for x in case.get("extras", []):
        used |= uses("附带", x.get("uses", []))
    if used != set(CLASSES):
        e(f"C、T、G 三类都要用到，现在只有 {''.join(sorted(used))}")
    top = max(lead_sec, key=lead_sec.get)
    if case["lead"] != top:
        e(f"lead 是 {case['lead']}，但按各段 lead 的时长算，最长的是 {top}（{lead_sec}）")
    if "plan" in case:
        errs += check_plan(CASES / name, case)
    return errs


def check_plan(d, case):
    """接了策划（case.json 有 plan）：交给 Skill 的 scripts/check_plan.py——认交接格式（3，也认旧的 2）和状态；case.json 当分镜脚本、
    script.json 当逐字稿，查 seg 都在框架里且每个段号都用到、facts 的 ref 都是 content.md 里能进成片的编号（设定写 null）"""
    sys.path.insert(0, str(ROOT / "skills" / "ai-coding-video" / "scripts"))
    import check_plan as cp
    plan = d / case["plan"]
    try:
        P = cp.read_plan(plan)
    except cp.Stop as x:
        return [f"策划稿不能接：{x}"]
    errs = list(P["errors"])
    e, _ = cp.check_storyboard(P, case)
    errs += e
    sp = d / "script.json"
    if sp.exists():
        S = json.loads(sp.read_text(encoding="utf-8"))
        e, _ = cp.check_script(P, S, case["plan"], case)
        errs += e
    return errs


def cell(case, seg, c):
    out = []
    for u in seg.get("uses", []):
        if item_class(u) != c:
            continue
        r = u.get("ref")
        if not r:
            out.append(u["what"])
        elif r.startswith("pack:"):
            out.append(f"{u['what']}（风格包 [{pack(r[5:])['name']}](../../packs/{r[5:]}/)）")
        else:
            out.append(f"{u['what']}（[{STYLES[r]['name']}][{r}]）")
    out = "；".join(out) or "—"
    return f"**{out}**" if seg["lead"] == c and out != "—" else out


def gen_segments(case):
    head = "| 段 | 时间 | 内容 | " + " | ".join(("**" + CLASS_NAME[c] + "**（主角）") if c == case["lead"] else CLASS_NAME[c] for c in CLASSES) + " |"
    rows = [head, "|---|---|---|---|---|---|"]
    t = 0
    real = all("start" in s for s in case["segments"])
    for i, s in enumerate(case["segments"], 1):
        span = f"{fmt_t(s['start'])}–{fmt_t(s['end'])}" if real else f"{fmt_t(t)}–{fmt_t(t + s['sec'])}"
        t += s["sec"]
        rows.append(f"| {i} {s['title']} | {span} | {s['content']} | " + " | ".join(cell(case, s, c) for c in CLASSES) + " |")
    lead = dict.fromkeys(CLASSES, 0)
    for s in case["segments"]:
        lead[s["lead"]] += s["sec"]
    when = "接片后的实际起止，由程序写" if real else "预计，接片后换成实际起止（由程序写）"
    tail = [
        "",
        f"时间是{when}。每段的主角类加粗；按主角类算时长：" + "、".join(f"{c} {fmt_t(lead[c])}" for c in CLASSES) + "。",
    ]
    notes = [(i, s) for i, s in enumerate(case["segments"], 1) if s.get("note")]
    if notes:
        tail += ["", "### 编排说明", ""] + [f"- **{i} {s['title']}**：{s['note']}" for i, s in notes]
    if case.get("extras"):
        tail += ["", "### 附带成片", ""]
        for x in case["extras"]:
            refs = "、".join(cell(case, {"uses": [u], "lead": ""}, item_class(u)) for u in x.get("uses", []))
            tail.append(f"- {x['count']} 条 × {x['sec']} 秒：{x['what']}。用到：{refs}")
    return "\n".join(rows + tail)


def gen_usage(case):
    rows = ["| 项 | 数量 | 青水算力（约） |", "|---|---|---|"]
    rows += [f"| {r['item']} | {r['qty']} | {fmt_cost(r.get('cost'))} |" for r in case["usage"]]
    rows.append(f"| 合计 | | 约 {fmt_range(*cost_range(case['usage']))} |")
    return "\n".join(rows)


def gen_downgrade(case):
    out = [f"- {d}" for d in case["downgrade"]]
    out += [f"- 第 {i} 段（{s['title']}）：{s['swap']}" for i, s in enumerate(case["segments"], 1) if s.get("swap")]
    return "\n".join(out)


def gen_compare(case):
    return "\n".join(f"- {c['side']}：{c['text']}" for c in case["compare"])


def gen_links(text):
    ids = sorted(set(re.findall(r"\[([CTG]-\d{3})\](?![(:])", text)))
    return "\n".join(f"[{i}]: ../../samples/{i}/" for i in ids)


def gen_index(cases):
    rows = ["| 目录 | 用途 | 主角 | 画幅 | 时长 | 青水算力（约，含试错） | 状态 |", "|---|---|---|---|---|---|---|"]
    lo = hi = 0
    for name, c in cases:
        a, b = cost_range(c["usage"])
        lo, hi = lo + a, hi + b
        rows.append(f"| [{name}/]({name}/) | {c['title']} | {CLASS_NAME[c['lead']]} | {c['ar']} | {fmt_len(c)} | {fmt_range(a, b)} | {c['status']} |")
    rows.append(f"| 合计 | | | | | 约 {fmt_range(lo, hi)} | |")
    return "\n".join(rows)


def fill(text, gens, where):
    found = set()

    def sub(m):
        k = m.group(2)
        found.add(k)
        if k not in gens:
            raise SystemExit(f"{where}：不认识的生成块 {k}")
        return m.group(1) + gens[k](text) + "\n" + m.group(4)

    out = BLOCK.sub(sub, text)
    if "links" in gens:  # 链接要按填完的全文再收一遍
        out = BLOCK.sub(lambda m: m.group(1) + gen_links(out) + "\n" + m.group(4) if m.group(2) == "links" else m.group(0), out)
    missing = set(gens) - found
    if missing:
        raise SystemExit(f"{where}：缺生成块 {', '.join(sorted(missing))}")
    return out


def main():
    only_check = "--check" in sys.argv
    errs, cases, outs = [], [], []
    for d in sorted(p for p in CASES.iterdir() if (p / "case.json").exists()):
        case = json.loads((d / "case.json").read_text(encoding="utf-8"))
        errs += [f"{d.name}: {x}" for x in check(d.name, case)]
        cases.append((d.name, case))
    if errs:
        print("\n".join(errs))
        sys.exit(1)
    for name, case in cases:
        gens = {
            "segments": lambda _t, c=case: gen_segments(c),
            "usage": lambda _t, c=case: gen_usage(c),
            "downgrade": lambda _t, c=case: gen_downgrade(c),
            "compare": lambda _t, c=case: gen_compare(c),
            "links": lambda _t: "",
        }
        outs.append((CASES / name / "README.md", gens))
    outs.append((CASES / "README.md", {"index": lambda _t: gen_index(cases)}))
    stale = []
    for path, gens in outs:
        old = path.read_text(encoding="utf-8")
        new = fill(old, gens, path.relative_to(ROOT))
        if new != old:
            stale.append(str(path.relative_to(ROOT)))
            if not only_check:
                path.write_text(new, encoding="utf-8")
    if only_check and stale:
        print("过期，要重新生成：" + "、".join(stale) + "（python3 cases/tools/build.py）")
        sys.exit(1)
    print(f"{'通过' if only_check else '已生成'}：{len(cases)} 个案例" + ("" if only_check or not stale else "，更新了 " + "、".join(stale)))


if __name__ == "__main__":
    main()
