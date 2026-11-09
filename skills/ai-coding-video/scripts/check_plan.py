#!/usr/bin/env python3
"""接策划前后的检查：认 ai-content-planner/2 交接的 plan.md、content.md，查分镜和逐字稿的引用。只用标准库。

    python3 <本 Skill 目录>/scripts/check_plan.py plans/<短名>/plan.md
    python3 <本 Skill 目录>/scripts/check_plan.py plans/<短名>/plan.md \\
        --storyboard videos/<短名>/storyboard.json --script videos/<短名>/script.json [--ready] [--table]

接策划的部分在这里查（段号在框架里、事实的编号在 content.md 里能进成片）；分镜、逐字稿通用的部分（uses、unify、
事实的出处、--ready、--table）调 check_storyboard.py。
退出码：0 能接（可能有提醒）；1 能接，但分镜、逐字稿或框架有问题要改；2 停下，不接（格式、状态、输出形式不对，
或缺 content.md），照提示请用户先回策划。分镜、逐字稿的 "plan" 相对于 --root（默认当前目录，即项目根目录）。
规矩见本 Skill 的 storyboard.md，分镜、逐字稿的格式见 film.md；交接格式以策划的 handoff.md 为准。
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_storyboard as cs  # noqa: E402  通用检查（uses、unify、事实的出处、--ready、--table）

FORMAT = 'ai-content-planner/2'
FRAME_HEAD = ['段', '作用', '受众收益', '要讲的点', '用到哪些输入', '篇幅']
DATA_HEAD = ['#', '讲哪一点', '内容', '种类', '来源', '必须写清的', '状态']
SRC_HEAD = ['资料', '位置', '读到哪', '用途', '能不能公开', '用到哪些编号']
AUTO = '自动，未问用户'
NOT_USED = '不用'
SHARED = re.compile(r'[（(]([^（）()]*?)\s*也用[）)]')
SHARED_REF = re.compile(r'P(\d+)\s*([a-z](?:\s*[、,，]\s*[a-z])*)?')
POINT = re.compile(r'([a-z])\.\s*(.*)', re.S)
SEG_ID = re.compile(r'P\d+')
DATA_ID = re.compile(r'P\d+-\d+')
OLD_ID = re.compile(r'U\d+(?:-\d+)?')
SECONDS = re.compile(r'(?:约|大约)?\s*(\d+(?:\.\d+)?)\s*(?:[–\-~—至到]\s*(\d+(?:\.\d+)?)\s*)?秒(?:左右)?'
                     r'|(?:约)?\s*(\d+)\s*分钟?\s*(?:(\d+)\s*秒)?(?:左右)?')


class Stop(Exception):
    """不接：照消息请用户先回策划"""


def split_row(line):
    s = line.strip()
    s = s[1:] if s.startswith('|') else s
    s = s[:-1] if s.endswith('|') else s
    return [c.strip() for c in s.split('|')]


def sections(text):
    """## 节名 → 行列表；标题（# 开头的第一行）单独返回"""
    title, out, cur = '', {}, None
    for line in text.splitlines():
        if line.startswith('# ') and not title:
            title = line[2:].strip()
        elif line.startswith('## '):
            cur = line[3:].strip()
            out[cur] = []
        elif cur is not None:
            out[cur].append(line)
    return title, out


def table(lines, head):
    """在行里找表头正好是 head 的表，返回每行的 dict；找不到返回 None"""
    for i, line in enumerate(lines):
        if line.lstrip().startswith('|') and split_row(line) == head:
            rows = []
            for row in lines[i + 2:]:
                if not row.lstrip().startswith('|'):
                    break
                cells = split_row(row)
                rows.append(dict(zip(head, cells + [''] * (len(head) - len(cells)))))
            return rows
    return None


def first_table_head(lines):
    for line in lines:
        if line.lstrip().startswith('|'):
            return split_row(line)
    return None


def parse_which(cell):
    """「a、b（P3 b 也用）」→ (['a','b'], [('P3', ['b'])])；「不用」→ (None, [])"""
    shared = []
    for m in SHARED.finditer(cell):
        for r in SHARED_REF.finditer(m.group(1)):
            shared.append((f'P{r.group(1)}', re.findall(r'[a-z]', r.group(2) or '')))
    rest = SHARED.sub('', cell).strip()
    if rest == NOT_USED:
        return None, shared
    return [x.strip() for x in re.split(r'[、,，]', rest) if x.strip()], shared


def seconds(cell):
    """篇幅 → 秒（区间取中间）；「不限」→ 0；不是秒、分钟的返回 None"""
    s = cell.strip()
    if s == '不限':
        return 0
    m = SECONDS.fullmatch(s)
    if not m:
        return None
    if m.group(1):
        lo = float(m.group(1))
        hi = float(m.group(2)) if m.group(2) else lo
        return (lo + hi) / 2
    return int(m.group(3)) * 60 + int(m.group(4) or 0)


def read_plan(plan_path):
    """读 plan.md 和同目录的 content.md。不能接时抛 Stop；能接时返回 dict：
    segs（框架里的段号，按顺序）、frame（段号 → 框架一行，另有 points、sec）、content（P1-1 → 一行，另有 seg、which、shared）、
    sources（资料名 → 位置）、notes（提醒）、errors（框架的问题）"""
    plan_path = Path(plan_path)
    if not plan_path.is_file():
        raise Stop(f'找不到 {plan_path}')
    text = plan_path.read_text(encoding='utf-8')
    lines = [x for x in text.splitlines() if x.strip()]
    fmt = lines[1].strip() if len(lines) > 1 else ''
    m = re.fullmatch(r'格式[：:]\s*(\S+)', fmt)
    if not m:
        raise Stop(f'{plan_path} 标题下面一行不是「格式：{FORMAT}」（现在是「{fmt}」）。'
                   '这不是 ai-content-planner 格式 2 的交接，不接；请用户先用 ai-content-planner（0.4.0 起）出交接，或更新策划')
    ver = m.group(1)
    if ver == 'ai-content-planner/1':
        raise Stop(f'{plan_path} 是交接格式 1（ai-content-planner/1），本 Skill 只接格式 2，不猜着读。'
                   '请用户先用策划转成格式 2（照策划 handoff.md 第 6 节，CHANGELOG 0.4.0 一行），或更新策划后重新交接')
    if ver != FORMAT:
        raise Stop(f'{plan_path} 的格式是「{ver}」，本 Skill 只认 {FORMAT}，不猜着读。请用户更新本 Skill 或策划')

    st = re.search(r'^状态[：:]\s*([^（(。\s]+)', text, re.M)
    status = st.group(1) if st else ''
    if status == '回流中':
        raise Stop('状态是「回流中」：策划还在处理下游提的缺口，等策划改回「已交接」再接')
    if status != '已交接':
        raise Stop(f'状态是「{status or "（没写）"}」，只接「已交接」；请用户先在策划里做完、交接')

    title, secs = sections(text)
    notes, errors = [], []
    need = table(secs.get('需求', []), ['项', '内容', '来源']) or []
    form = next((r['内容'] for r in need if r['项'] == '输出形式'), '')
    if '视频' not in form:
        raise Stop(f'需求的「输出形式」是「{form or "（没写）"}」，不是视频，交给对应的 Skill')

    for line in secs.get('确认记录', []):
        for kind in ('需求', '框架'):
            if re.search(rf'{kind}(?:[（(][^）)]*[）)])?[：:]', line) and AUTO in line:
                notes.append(f'确认记录的「{kind}」写着「{AUTO}」：开工前先请用户过一眼需求和框架')

    fl = secs.get('框架')
    if fl is None:
        errors.append('plan.md 没有「## 框架」一节')
        fl = []
    if fl and not any(re.match(r'\s*内容流程[：:]', x) for x in fl):
        errors.append('框架缺「内容流程：」一行')
    rows = table(fl, FRAME_HEAD)
    if rows is None:
        head = first_table_head(fl)
        errors.append('框架的段落表表头要是「' + ' | '.join(FRAME_HEAD) + '」' + (f'，现在是「{" | ".join(head)}」' if head else ''))
        rows = []
    frame, segs = {}, []
    for r in rows:
        p = r['段']
        pts = {}
        for part in re.split(r'<br\s*/?>', r['要讲的点']):
            if part.strip():
                pm = POINT.fullmatch(part.strip())
                if pm:
                    pts[pm.group(1)] = pm.group(2).strip()
                else:
                    errors.append(f'框架 {p} 的「要讲的点」要按 a. ……<br>b. …… 写：{part.strip()[:20]}')
        r['points'] = pts
        r['sec'] = seconds(r['篇幅'])
        if r['sec'] is None:
            errors.append(f'框架 {p} 的篇幅「{r["篇幅"]}」不是秒：视频的篇幅单位是秒')
        frame[p] = r
        segs.append(p)

    cpath = plan_path.parent / 'content.md'
    if not cpath.is_file():
        old = '；同目录有 research.md，是格式 1 的文件名，请用户先用策划转成格式 2' if (plan_path.parent / 'research.md').exists() else ''
        raise Stop(f'找不到 {cpath}{old}')
    _, csecs = sections(cpath.read_text(encoding='utf-8'))
    content = {}
    for name, cl in csecs.items():
        sm = re.match(r'(P\d+)\s', name + ' ')
        if not sm:
            continue
        for r in table(cl, DATA_HEAD) or []:
            which, shared = parse_which(r['讲哪一点'])
            r.update(seg=sm.group(1), which=which, shared=shared)
            content[r['#']] = r
    src = table(csecs.get('资料清单', []), SRC_HEAD) or []
    return {'plan': plan_path, 'title': title, 'segs': segs, 'frame': frame, 'content': content,
            'sources': {r['资料']: r['位置'] for r in src}, 'notes': notes, 'errors': errors}


def check_storyboard(P, sb, plan_rel=None):
    """分镜：plan、seg 在框架里且按框架顺序、每个段号都用到、同一段号的秒数贴近篇幅"""
    errs, notes = [], []
    if plan_rel is not None and sb.get('plan') != plan_rel:
        errs.append(f'分镜的 "plan" 要写 "{plan_rel}"（来自哪份 plan.md），现在是 {sb.get("plan")!r}')
    order, total = [], {}
    for i, s in enumerate(sb.get('segments', []), 1):
        g = s.get('seg')
        if g not in P['frame']:
            errs.append(f'分镜第 {i} 段：seg {g!r} 不在框架里（写 "P1" 这样的段号）')
            continue
        if order and P['segs'].index(g) < P['segs'].index(order[-1]):
            errs.append(f'分镜第 {i} 段：{g} 排在 {order[-1]} 后面，要按框架的顺序')
        order.append(g)
        total[g] = total.get(g, 0) + (s.get('sec') or 0)
    miss = [p for p in P['segs'] if p not in total]
    if miss:
        errs.append(f'框架的 {"、".join(miss)} 在分镜里一段都没用到')
    for p, t in total.items():
        want = P['frame'][p]['sec']
        if want and t and abs(t - want) > want * 0.15:
            notes.append(f'{p} 分镜合计 {t:g} 秒，框架篇幅是 {P["frame"][p]["篇幅"]}')
    return errs, notes


def check_script(P, sc, plan_rel=None, storyboard=None):
    """逐字稿：seg 和分镜一一对应；facts 的 ref 是 content.md 里能进成片的 P1-1（设定写 null）"""
    errs, notes = [], []
    if plan_rel is not None and sc.get('plan') != plan_rel:
        errs.append(f'逐字稿的 "plan" 要写 "{plan_rel}"，现在是 {sc.get("plan")!r}')
    segs = sc.get('segments', [])
    if storyboard is not None:
        errs += cs.check_align(storyboard, sc)
    for i, s in enumerate(segs, 1):
        g = s.get('seg')
        if g not in P['frame']:
            errs.append(f'逐字稿第 {i} 段：seg {g!r} 不在框架里')
        said = ''.join(s.get('vo', []))  # 有旁白看旁白，没有旁白看画面上写的 what
        for f in s.get('facts', []):
            where = f'逐字稿第 {i} 段「{f.get("what", "")[:24]}」'
            if 'ref' not in f:
                errs.append(f'{where}：缺 ref（引用事实写 "P1-1"，设定写 null）')
                continue
            r = f['ref']
            if r is None:
                continue
            if not isinstance(r, str) or not DATA_ID.fullmatch(r):
                hint = '：这是格式 1 的 U 编号，改写 content.md 的编号（如 "P1-1"）' if isinstance(r, str) and OLD_ID.fullmatch(r) else \
                       '：引用段写在 seg，引用事实写一条的编号（如 "P1-1"）'
                errs.append(f'{where}：ref {r!r} 不对{hint}')
                continue
            row = P['content'].get(r)
            if row is None:
                errs.append(f'{where}：ref {r} 在 content.md 里找不到')
                continue
            if row['which'] is None:
                errs.append(f'{where}：{r} 在 content.md 里标「不用」，不进成片')
                continue
            if row['种类'] == '设定' or row['状态'] == '设定':
                errs.append(f'{where}：{r} 是设定，ref 写 null')
                continue
            if row['状态'] != '已核实':
                errs.append(f'{where}：{r} 的状态是「{row["状态"]}」，只引用「已核实」的')
                continue
            if g in P['frame'] and row['seg'] != g and g not in {p for p, _ in row['shared']}:
                notes.append(f'{where}：{r} 记在 {row["seg"]}，没写「（{g} … 也用）」，核对是不是这段该讲的')
            kind = row['种类']
            if kind == 'C4' and not re.search(r'官方|按计划|计划', said or f.get('what', '')):
                notes.append(f'{where}：{r} 是 C4（某方自己说的），旁白要讲成「官方称」「按计划」')
            if re.fullmatch(r'F[1-3]', kind):
                notes.append(f'{where}：{r} 是素材 {kind}，用「来源」里的链接或 source/ 路径，按「必须写清的」处理授权：{row["必须写清的"]}')
    return errs, notes


def main(argv=None):
    ap = argparse.ArgumentParser(description='认 ai-content-planner/2 的交接，查分镜、逐字稿的引用')
    ap.add_argument('plan', help='plans/<短名>/plan.md')
    ap.add_argument('--storyboard', help='videos/<短名>/storyboard.json')
    ap.add_argument('--script', help='videos/<短名>/script.json')
    ap.add_argument('--root', default='.', help='分镜、逐字稿里 "plan" 相对的目录（默认当前目录）')
    ap.add_argument('--ready', action='store_true', help='再查用户确认过了（见 check_storyboard.py）')
    ap.add_argument('--table', action='store_true', help='打印分镜表和全片统一，给用户看')
    a = ap.parse_args(argv)
    try:
        P = read_plan(a.plan)
    except Stop as x:
        print(f'停下，不接：{x}')
        return 2
    root = Path(a.root).resolve()
    try:
        rel = Path(a.plan).resolve().relative_to(root).as_posix()
    except ValueError:
        rel = None
    errs, notes = list(P['errors']), list(P['notes'])
    try:
        sb = cs.load(a.storyboard) if a.storyboard else None
        sc = cs.load(a.script) if a.script else None
    except cs.Unreadable as x:
        print(f'读不了：{x}')
        return 2
    if sb is not None:
        e, n = check_storyboard(P, sb, rel)
        errs += e
        notes += n
    if sc is not None:
        e, n = check_script(P, sc, rel)  # 和分镜对不对得上由下面的通用检查查
        errs += e
        notes += n
    lib = cs.library()
    if sb is not None:
        e, n = cs.check(sb, sc, a.ready, lib)
        errs += e
        notes += n
        if a.table:
            print(cs.table(sb, sc, lib))
            print()
    elif sc is not None:
        e, n = cs.check_facts(sc, True)
        errs += e
        notes += n
    if a.ready and sb is None:
        errs.append('--ready 要连分镜一起查（写 --storyboard）')
    for x in notes:
        print(f'提醒：{x}')
    for x in errs:
        print(f'✗ {x}')
    print(f'{P["plan"]}：格式 2、已交接，{len(P["segs"])} 段，content.md {len(P["content"])} 条' +
          (f'；{len(errs)} 个问题' if errs else '；没有问题'))
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
