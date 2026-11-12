#!/usr/bin/env python3
"""接策划前后的检查：认 ai-content-planner/3（也认旧的 /2）交接的 plan.md、content.md，查分镜脚本和逐字稿的引用。只用标准库。

    python3 <本 Skill 目录>/scripts/check_plan.py plans/<短名>/plan.md
    python3 <本 Skill 目录>/scripts/check_plan.py plans/<短名>/plan.md \\
        --storyboard videos/<短名>/storyboard.json --script videos/<短名>/script.json [--ready] [--table]

接策划的部分在这里查（段号在框架里、事实的编号在 content.md 里能进成片；格式 3 另查约束 rule、素材能不能送生成、
说法点到的段有旁白、形式的声音和画幅、时长）；分镜脚本、逐字稿通用的部分（uses、unify、事实的出处、--ready、--table）
调 check_storyboard.py。
退出码：0 能接（可能有提醒）；1 能接，但分镜脚本、逐字稿或框架有问题要改；2 停下，不接（格式、状态、输出形式不对，
或缺 content.md），照提示请用户先回策划。分镜脚本、逐字稿的 "plan" 相对于 --root（默认当前目录，即项目根目录）。
规矩见本 Skill 的 storyboard.md，分镜脚本、逐字稿的格式见 film.md；交接格式以策划的 handoff.md 为准。
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_storyboard as cs  # noqa: E402  通用检查（uses、unify、事实的出处、--ready、--table）

FORMATS = {'ai-content-planner/2': 2, 'ai-content-planner/3': 3}  # 格式号 → 版本；2 是旧格式，没有效果、形式、说法、约束、素材
FORMAT = 'ai-content-planner/3'
FRAME_HEAD = {2: ['段', '作用', '受众收益', '要讲的点', '用到哪些输入', '篇幅'],
              3: ['段', '作用', '受众：从 → 到', '要讲的点', '怎么证明', '用到哪些输入', '篇幅']}
CONFIRM_KINDS = {2: ('需求', '框架'), 3: ('效果', '框架')}
NEED_HEAD = ['项', '内容', '来源']                      # 格式 2 的需求
FORM_HEAD = ['项', '内容', '由哪条效果推出', '来源']      # 格式 3 的形式
SAY_HEAD = ['点', '要的效果', '参考说法', '不能丢的']
MAT_HEAD = ['#', '文件', '内容', '字、标志、水印、人脸', '能怎么用', '能不能送生成', '用到哪段']
RULE_HEAD = ['#', '必须守的样子', '依据', '状态']
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
RULE_ID = re.compile(r'K\d+')
MAT_ID = re.compile(r'(?<![A-Za-z0-9])M\d+(?!\d)')
SAY_POINT = re.compile(r'(P\d+)\s*([a-z](?:\s*[、,，]\s*[a-z])*)?')
AR = re.compile(r'(\d+)\s*[:：]\s*(\d+)')
SILENT = re.compile(r'不说话|只上字|无旁白|没有旁白|不配旁白')
RANGE = re.compile(r'(.*?)(\d+)\s*[–\-~—]\s*(\d+)')
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
    """读 plan.md 和同目录的 content.md，认格式 3 和旧的格式 2（两套表头和取值位置）。不能接时抛 Stop；能接时返回 dict：
    version（2 或 3）、segs（框架里的段号，按顺序）、frame（段号 → 框架一行，另有 points、sec、rules：「怎么证明」里的 K）、
    content（P1-1 → 一行，另有 seg、which、shared）、sources（资料名 → 位置）、
    say（说法点到的段号）、materials（M1 → 素材一行）、rules（K1 → 约束一行），格式 2 这三样是空的；
    ar、sec（策划定的画幅、目标秒数，读不出是 None）、silent（声音是不说话的，写原文，否则空）、size_where（从哪读的）、
    notes（提醒）、errors（框架、表头的问题）"""
    plan_path = Path(plan_path)
    if not plan_path.is_file():
        raise Stop(f'找不到 {plan_path}')
    text = plan_path.read_text(encoding='utf-8')
    lines = [x for x in text.splitlines() if x.strip()]
    fmt = lines[1].strip() if len(lines) > 1 else ''
    m = re.fullmatch(r'格式[：:]\s*(\S+)', fmt)
    if not m:
        raise Stop(f'{plan_path} 标题下面一行不是「格式：{FORMAT}」（现在是「{fmt}」）。'
                   '这不是 ai-content-planner 格式 3（或旧的格式 2）的交接，不接；'
                   '请用户先用 ai-content-planner（0.6.0 起）出交接，或更新策划')
    if m.group(1) == 'ai-content-planner/1':
        raise Stop(f'{plan_path} 是交接格式 1（ai-content-planner/1），本 Skill 只接格式 3（也认旧的格式 2），不猜着读。'
                   '请用户先用策划（0.6.0 起）转成格式 3（照策划 handoff.md 第 7 节；格式 1 先照 CHANGELOG 0.4.0 一行转成格式 2），'
                   '或更新策划后重新交接')
    ver = FORMATS.get(m.group(1))
    if ver is None:
        raise Stop(f'{plan_path} 的格式是「{m.group(1)}」，本 Skill 只认 {"、".join(FORMATS)}，不猜着读。请用户更新本 Skill 或策划')

    st = re.search(r'^状态[：:]\s*([^（(。\s]+)', text, re.M)
    status = st.group(1) if st else ''
    if status == '回流中':
        raise Stop('状态是「回流中」：策划还在处理下游提的缺口，等策划改回「已交接」再接')
    if status != '已交接':
        raise Stop(f'状态是「{status or "（没写）"}」，只接「已交接」；请用户先在策划里做完、交接'
                   '（效果待确认、框架待确认、补齐中都还没交接）')

    title, secs = sections(text)
    notes, errors = [], []
    if ver == 2:
        notes.append('这是交接格式 2（旧格式）：没有效果、形式、说法、约束、素材，照需求、立意、框架接；'
                     '要这些，请用户用策划（0.6.0 起）转成格式 3')
        spec = {r['项']: r['内容'] for r in table(secs.get('需求', []), NEED_HEAD) or []}
        form = spec.get('输出形式', '')
        size = extent = voice = spec.get('篇幅与规格', '')
        form_where, size_where = '需求的「输出形式」', '需求的「篇幅与规格」'
    else:
        spec = {r['项']: r['内容'] for r in table(secs.get('形式', []), FORM_HEAD) or []}
        size = form = spec.get('输出形式和规格', '')
        extent, voice = spec.get('篇幅和注意力', ''), spec.get('声音', '')
        form_where = size_where = '形式的「输出形式和规格」'
    if '视频' not in form:
        raise Stop(f'{form_where}是「{form or "（没写）"}」，不是视频，交给对应的 Skill')
    am = AR.search(size)
    ar = f'{am.group(1)}:{am.group(2)}' if am else None
    sec = seconds(re.split(r'[；;，,]', extent)[0]) if extent else None
    silent = voice if SILENT.search(voice) else ''

    kinds = CONFIRM_KINDS[ver]
    for line in secs.get('确认记录', []):
        for kind in kinds:
            if re.search(rf'{kind}(?:[（(][^）)]*[）)])?[：:]', line) and AUTO in line:
                notes.append(f'确认记录的「{kind}」写着「{AUTO}」：开工前先请用户过一眼{"和".join(kinds)}')

    fl = secs.get('框架')
    if fl is None:
        errors.append('plan.md 没有「## 框架」一节')
        fl = []
    if fl and not any(re.match(r'\s*内容流程[：:]', x) for x in fl):
        errors.append('框架缺「内容流程：」一行')
    rows = table(fl, FRAME_HEAD[ver])
    if rows is None:
        head = first_table_head(fl)
        errors.append(f'框架的段落表表头（格式 {ver}）要是「' + ' | '.join(FRAME_HEAD[ver]) + '」' +
                      (f'，现在是「{" | ".join(head)}」' if head else ''))
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
        r['rules'] = sorted(set(RULE_ID.findall(r.get('怎么证明', ''))), key=lambda k: int(k[1:]))
        if r['sec'] is None:
            errors.append(f'框架 {p} 的篇幅「{r["篇幅"]}」不是秒：视频的篇幅单位是秒')
        frame[p] = r
        segs.append(p)

    say = []  # 说法点到的段号，按出现顺序
    for r in named_table(secs, '说法', SAY_HEAD, errors, 'plan.md') if ver >= 3 else []:
        for g, letters in SAY_POINT.findall(r['点']):
            if g not in frame:
                notes.append(f'说法的「{r["点"]}」：{g} 不在框架里')
                continue
            miss = [x for x in re.findall(r'[a-z]', letters) if x not in frame[g]['points']]
            if miss:
                notes.append(f'说法的「{r["点"]}」：{g} 没有点 {"、".join(miss)}')
            if g not in say:
                say.append(g)

    cpath = plan_path.parent / 'content.md'
    if not cpath.is_file():
        old = '；同目录有 research.md，是格式 1 的文件名，请用户先用策划转成格式 3' if (plan_path.parent / 'research.md').exists() else ''
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
    mats = {r['#']: r for r in named_table(csecs, '素材', MAT_HEAD, errors, 'content.md')} if ver >= 3 else {}
    rules = {r['#']: r for r in named_table(csecs, '约束', RULE_HEAD, errors, 'content.md')} if ver >= 3 else {}
    for k, r in rules.items():
        if r['状态'] not in ('已核实', '设定'):
            notes.append(f'约束 {k} 的状态是「{r["状态"]}」：拿不准的样子先别照着生成，问用户或回流')
    return {'plan': plan_path, 'title': title, 'version': ver, 'segs': segs, 'frame': frame, 'content': content,
            'sources': {r['资料']: r['位置'] for r in src}, 'say': say, 'materials': mats, 'rules': rules,
            'ar': ar, 'sec': sec, 'silent': silent, 'size_where': size_where,
            'notes': notes, 'errors': errors}


def named_table(secs, name, head, errors, where):
    """可选的节：没有这一节、节里没有表（写「无」）返回 []；有表但表头不对记一条问题"""
    lines = secs.get(name)
    if lines is None:
        return []
    rows = table(lines, head)
    if rows is None:
        h = first_table_head(lines)
        if h:
            errors.append(f'{where}「{name}」的表头要是「{" | ".join(head)}」，现在是「{" | ".join(h)}」')
        return []
    return [r for r in rows if r[head[0]]]


def file_pieces(cell):
    """素材表的「文件」→ 路径片段：反引号里的（没有反引号就是整格去掉括号）；「目录/01–05」拆成 (目录/, 1, 5)"""
    parts = re.findall(r'`([^`]+)`', cell) or [re.sub(r'[（(][^）)]*[）)]', '', cell).strip()]
    out = []
    for p in parts:
        p = p.strip()
        m = RANGE.fullmatch(p)
        out.append((m.group(1), int(m.group(2)), int(m.group(3))) if m else (p, None, None))
    return [x for x in out if x[0] or x[1] is not None]


def materials_in(src, mats):
    """分镜的 src（字符串或数组）用到素材表里的哪几个：写了编号「M7」的，或路径对得上「文件」的"""
    srcs = [src] if isinstance(src, str) else [x for x in src if isinstance(x, str)] if isinstance(src, list) else []
    found, unknown = [], []
    for s in srcs:
        for mid in MAT_ID.findall(s):
            (found if mid in mats else unknown).append(mid)
        for mid, r in mats.items():
            for prefix, lo, hi in file_pieces(r['文件']):
                if lo is None:
                    hit = prefix in s
                else:
                    n = re.search(re.escape(prefix) + r'0*(\d+)', s) if prefix else None
                    hit = bool(n) and lo <= int(n.group(1)) <= hi
                if hit:
                    found.append(mid)
                    break
    return list(dict.fromkeys(found)), list(dict.fromkeys(unknown))


def can_generate(row):
    """素材「能不能送生成」：只有「能」（后面可跟「：说明」）才能送；「不能」「〔待核实〕」都按不能"""
    return re.split(r'[：:]', row['能不能送生成'].strip(), maxsplit=1)[0].strip() == '能'


def item_class(x, styles):
    """uses 一条或一个分镜的类别：class，或 ref 指的风格的类别；风格包算 C；认不出返回 None"""
    if x.get('class') in cs.CLASSES:
        return x['class']
    r = x.get('ref')
    if isinstance(r, str) and r.startswith('pack:'):
        return 'C'
    return styles.get(r, {}).get('class')


def rule_list(v):
    """rule：「K1」或 ["K1", "K2"] → 列表；写错返回 None"""
    ks = [v] if isinstance(v, str) else v
    if isinstance(ks, list) and ks and all(isinstance(k, str) and RULE_ID.fullmatch(k) for k in ks):
        return ks
    return None


def check_storyboard(P, sb, plan_rel=None, lib=None):
    """分镜脚本：plan、seg 在框架里且按框架顺序、每个段号都用到、同一段号的秒数贴近篇幅、ar 和全片时长贴近策划、
    不说话的片子 unify.voice 是 null；格式 3 另查 rule 的 K 号在约束表里、框架「怎么证明」写了 K 的段里 G 类分镜写了 rule、
    分镜 src 用到的素材：不能送生成的不进 G 类分镜，只作参考的不进成片"""
    errs, notes = [], []
    if plan_rel is not None and sb.get('plan') != plan_rel:
        errs.append(f'分镜脚本的 "plan" 要写 "{plan_rel}"（来自哪份 plan.md），现在是 {sb.get("plan")!r}')
    order, total = [], {}
    for i, s in enumerate(sb.get('segments', []), 1):
        g = s.get('seg')
        if g not in P['frame']:
            errs.append(f'第 {i} 段：seg {g!r} 不在框架里（写 "P1" 这样的段号）')
            continue
        if order and P['segs'].index(g) < P['segs'].index(order[-1]):
            errs.append(f'第 {i} 段：{g} 排在 {order[-1]} 后面，要按框架的顺序')
        order.append(g)
        total[g] = total.get(g, 0) + (s.get('sec') or 0)
    miss = [p for p in P['segs'] if p not in total]
    if miss:
        errs.append(f'框架的 {"、".join(miss)} 在分镜脚本里一段都没用到')
    for p, t in total.items():
        want = P['frame'][p]['sec']
        if want and t and abs(t - want) > want * 0.15:
            notes.append(f'{p} 各段合计 {t:g} 秒，框架篇幅是 {P["frame"][p]["篇幅"]}')
    whole = sum(total.values())
    if P.get('sec') and whole and abs(whole - P['sec']) > P['sec'] * cs.TOLERANCE:
        notes.append(f'各段合计 {whole:g} 秒，策划的目标时长是 {P["sec"]:g} 秒')
    if P.get('ar') and sb.get('ar', '16:9') != P['ar']:
        notes.append(f'分镜脚本的 ar 是 {sb.get("ar", "16:9")!r}，策划定的是 {P["ar"]}（{P["size_where"]}），按策划的出')
    u = sb.get('unify')
    if P.get('silent') and isinstance(u, dict) and u.get('voice'):
        errs.append(f'策划定的声音是「{P["silent"]}」：不说话，unify.voice 写 null（形式要改先回流）')
    e, n = check_rules(P, sb, lib)
    return errs + e, notes + n


def check_rules(P, sb, lib=None):
    """格式 3 的约束 rule 和素材 M（见 check_storyboard）"""
    errs, notes = [], []
    styles = (lib or cs.library())[0]
    for i, s in enumerate(sb.get('segments', []), 1):
        if not isinstance(s, dict):
            continue
        uses = [x for x in s.get('uses') or [] if isinstance(x, dict)]
        shots = [x for x in s.get('shots') or [] if isinstance(x, dict)] if isinstance(s.get('shots'), list) else []
        items = [(f'第 {i} 段 uses 第 {j} 条', x) for j, x in enumerate(uses, 1)] + \
                [(f'分镜 {cs.shot_name(i, j)}', x) for j, x in enumerate(shots, 1)]
        for w, x in items:
            if 'rule' not in x:
                continue
            ks = rule_list(x['rule'])
            if ks is None:
                errs.append(f'{w}：rule 写约束编号 "K1"，几条写数组 ["K1", "K2"]，现在是 {x["rule"]!r}')
            elif P['version'] < 3:
                errs.append(f'{w}：交接格式 2 没有约束（K），不写 rule')
            else:
                for k in ks:
                    if k not in P['rules']:
                        errs.append(f'{w}：rule {k} 在 content.md 的约束表里找不到')
        if P['version'] < 3:
            continue
        g = s.get('seg')
        need = P['frame'].get(g, {}).get('rules') or []
        for j, x in enumerate(shots, 1):
            w = f'分镜 {cs.shot_name(i, j)}'
            c = item_class(x, styles)
            if c == 'G' and need and not x.get('rule'):
                notes.append(f'{w}：G 类，框架 {g} 的「怎么证明」要照 {"、".join(need)}：写 rule，生成后逐条对照，违反算返工')
            found, unknown = materials_in(x.get('src'), P['materials'])
            for mid in unknown:
                notes.append(f'{w}：src 里的 {mid} 在 content.md 的素材表里找不到')
            for mid in found:
                r = P['materials'][mid]
                if c == 'G' and not can_generate(r):
                    errs.append(f'{w}：{mid}（{r["文件"]}）能不能送生成是「{r["能不能送生成"]}」，'
                                '不进生成模型：G 类分镜的 src 不能用它')
                if c != 'G' and r['能怎么用'].strip().startswith('只作参考'):
                    errs.append(f'{w}：{mid}（{r["文件"]}）只作参考，不进成片：重画，或只当 G 类分镜的参考图（能送生成的才行）')
                if r['用到哪段'].strip() == NOT_USED:
                    notes.append(f'{w}：{mid} 在素材表里标「不用」，核对是不是该用它')
    return errs, notes


def check_script(P, sc, plan_rel=None, storyboard=None):
    """逐字稿：seg 和分镜脚本一一对应；facts 的 ref 是 content.md 里能进成片的 P1-1（设定写 null）"""
    errs, notes = [], []
    if plan_rel is not None and sc.get('plan') != plan_rel:
        errs.append(f'逐字稿的 "plan" 要写 "{plan_rel}"，现在是 {sc.get("plan")!r}')
    segs = sc.get('segments', [])
    if storyboard is not None:
        errs += cs.check_align(storyboard, sc)
    spoken = {}  # 段号 → 这个段号的几段里有没有旁白
    for s in segs:
        spoken[s.get('seg')] = spoken.get(s.get('seg'), False) or any(
            isinstance(x, str) and x.strip() for x in (s.get('vo') if isinstance(s.get('vo'), list) else []))
    if P.get('silent'):
        talk = [g for g, v in spoken.items() if v]
        if talk:
            errs.append(f'策划定的声音是「{P["silent"]}」：不说话，逐字稿 {"、".join(talk)} 的 vo 写空数组，字放到画面上'
                        '（形式要改先回流）')
    else:
        for g in P.get('say', []):
            if g in spoken and not spoken[g]:
                notes.append(f'说法写了 {g} 的点，逐字稿 {g} 没有旁白：对着说法写 vo（字和节奏能改，要的效果、不能丢的不能少）')
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
    ap = argparse.ArgumentParser(description='认 ai-content-planner/3（也认 /2）的交接，查分镜脚本、逐字稿的引用')
    ap.add_argument('plan', help='plans/<短名>/plan.md')
    ap.add_argument('--storyboard', help='videos/<短名>/storyboard.json')
    ap.add_argument('--script', help='videos/<短名>/script.json')
    ap.add_argument('--root', default='.', help='分镜脚本、逐字稿里 "plan" 相对的目录（默认当前目录）')
    ap.add_argument('--ready', action='store_true', help='再查用户确认过了（见 check_storyboard.py）')
    ap.add_argument('--table', action='store_true', help='打印段落表、分镜表和全片统一，给用户看')
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
    lib = cs.library()
    if sb is not None:
        e, n = check_storyboard(P, sb, rel, lib)
        errs += e
        notes += n
    if sc is not None:
        e, n = check_script(P, sc, rel)  # 和分镜脚本对不对得上由下面的通用检查查
        errs += e
        notes += n
    if sb is not None:
        e, n = cs.check(sb, sc, a.ready, lib)
        errs += e
        notes += n
        if a.table:
            print(cs.table(sb, sc, lib, cs.timing_of(a.storyboard)))
            print()
    elif sc is not None:
        e, n = cs.check_facts(sc, True)
        errs += e
        notes += n
    if a.ready and sb is None:
        errs.append('--ready 要连分镜脚本一起查（写 --storyboard）')
    for x in notes:
        print(f'提醒：{x}')
    for x in errs:
        print(f'✗ {x}')
    extra = f'、素材 {len(P["materials"])} 个、约束 {len(P["rules"])} 条' if P['version'] >= 3 else ''
    print(f'{P["plan"]}：格式 {P["version"]}、已交接，{len(P["segs"])} 段，content.md {len(P["content"])} 条{extra}' +
          (f'；{len(errs)} 个问题' if errs else '；没有问题'))
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
