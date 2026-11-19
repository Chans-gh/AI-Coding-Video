#!/usr/bin/env python3
"""接策划前后的检查：认 ai-content-planner/4（也认 /3、旧的 /2）交接的 plan.md、content.md，查分镜脚本和逐字稿的引用。只用标准库。

    python3 <本 Skill 目录>/scripts/check_plan.py plans/<短名>/plan.md
    python3 <本 Skill 目录>/scripts/check_plan.py plans/<短名>/plan.md \\
        --storyboard videos/<短名>/storyboard.json --script videos/<短名>/script.json [--ready] [--table]

接策划的部分在这里查（段号在框架里、事实的编号在 content.md 里能进成片；格式 3 起另查约束 rule、素材能不能送生成、
说法点到的段有旁白、形式的声音和画幅、时长；格式 4 再查表达、画面、制作条件：每行画面有分镜认领（view）、
类别和来源对得上、不能用的来源没用上、原句没改字）；分镜脚本、逐字稿通用的部分（uses、unify、事实的出处、--ready、--table）
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
if __name__ == '__main__':
    sys.modules.setdefault('check_plan', sys.modules['__main__'])  # plan5.py 回头 import 本文件时用同一份
import check_storyboard as cs  # noqa: E402  通用检查（uses、unify、事实的出处、--ready、--table）

FORMATS = {'ai-content-planner/2': 2, 'ai-content-planner/3': 3, 'ai-content-planner/4': 4, 'ai-content-planner/5': 5}
# 格式号 → 版本；2 是旧格式，没有效果、形式、说法、约束、素材；3 没有表达、画面；5 只读 content.md（见 plan5.py）
FORMAT = 'ai-content-planner/5'
FRAME_HEAD = {2: ['段', '作用', '受众收益', '要讲的点', '用到哪些输入', '篇幅'],
              3: ['段', '作用', '受众：从 → 到', '要讲的点', '怎么证明', '用到哪些输入', '篇幅']}
FRAME_HEAD[4] = FRAME_HEAD[3]
CONFIRM_KINDS = {2: ('需求', '框架'), 3: ('效果', '框架'), 4: ('效果', '框架')}
NEED_HEAD = ['项', '内容', '来源']                      # 格式 2 的需求
FORM_HEAD = ['项', '内容', '由哪条效果推出', '来源']      # 格式 3 起的形式；格式 4 的表达同一个表头
EXPR_ITEMS = ('基调', '张力', '钩子', '句式和节奏', '情绪曲线', '边界')
TONES = ('冷静播报', '讲透型', '老友唠嗑', '娓娓道来', '悬念反转', '走心共鸣', '热血燃', '犀利点评', '段子手',
         '直播间促单', '权威专家', '治愈陪伴', '童趣', '文艺诗意')
VIEW_HEAD = ['#', '段', '要看到什么', '来源', '用到']
SOURCES = {'代码画': 'C', '照片': 'T', '录像': 'T', '录屏': 'T', '数据': 'T', '三维模型': 'T', '生图': 'G', '生视频': 'G'}
GAP_HEAD = ['编号', '段', '缺什么', '归谁', '提出于', '状态', '怎么解决的']
VIEW_ID = re.compile(r'H\d+')
GAP_ID = re.compile(r'Q\d+')
MAKE = re.compile(r'能用[：:](.*?)[；;]\s*不能用[：:](.*)')
PAREN = re.compile(r'[（(][^（）()]*[）)]')
ORIG = '原句'
NUM = re.compile(r'百分之|[0-9０-９%％零〇一二两三四五六七八九十百千万亿点]')
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


def entry(path):
    """命令行给的路径 → 要读的文件：目录里先看 content.md 是不是格式 5，不是再读 plan.md；
    给了 plan.md、它第二行写「格式和状态见 content.md」的，改读同目录的 content.md"""
    p = Path(path)
    if p.is_dir():
        c = p / 'content.md'
        if c.is_file() and first_lines(c)[1:2] and re.match(r'格式[：:]\s*ai-content-planner/5\s*$', first_lines(c)[1]):
            return c
        p = p / 'plan.md'
    if not p.is_file():
        raise Stop(f'找不到 {p}')
    head = first_lines(p)
    if p.name == 'plan.md' and len(head) > 1 and '见 content.md' in head[1]:
        c = p.parent / 'content.md'
        if not c.is_file():
            raise Stop(f'{p} 说格式和状态见 content.md，找不到 {c}')
        return c
    return p


def first_lines(p):
    return [x.strip() for x in Path(p).read_text(encoding='utf-8').splitlines() if x.strip()][:3]


def read_plan(plan_path):
    """读 plan.md 和同目录的 content.md，认格式 4、3 和旧的格式 2（格式 2 的表头和取值位置不同；格式 4 另读 read_v4）。
    不能接时抛 Stop；能接时返回 dict：
    version（2、3 或 4）、segs（框架里的段号，按顺序）、frame（段号 → 框架一行，另有 points、sec、rules：「怎么证明」里的 K）、
    content（P1-1 → 一行，另有 seg、which、shared）、sources（资料名 → 位置）、
    say（说法点到的段号）、materials（M1 → 素材一行）、rules（K1 → 约束一行），格式 2 这三样是空的；
    ar、sec（策划定的画幅、目标秒数，读不出是 None）、silent（声音是不说话的，写原文，否则空）、size_where（从哪读的）、
    origs（格式 4 说法里写了「原句」的行）、expr、tone、tension、views、can、cannot（格式 4，见 read_v4）、
    notes（提醒）、errors（框架、表头的问题）"""
    plan_path = entry(plan_path)
    text = plan_path.read_text(encoding='utf-8')
    lines = [x for x in text.splitlines() if x.strip()]
    fmt = lines[1].strip() if len(lines) > 1 else ''
    m = re.fullmatch(r'格式[：:]\s*(\S+)', fmt)
    if not m:
        raise Stop(f'{plan_path} 标题下面一行不是「格式：{FORMAT}」（现在是「{fmt}」）。'
                   '这不是 ai-content-planner 格式 5（或格式 4、3、旧的格式 2）的交接，不接；'
                   '请用户先用 ai-content-planner（0.8.0 起）出交接，或更新策划')
    if m.group(1) == 'ai-content-planner/1':
        raise Stop(f'{plan_path} 是交接格式 1（ai-content-planner/1），本 Skill 接格式 5（也认格式 4、3、旧的格式 2），不猜着读。'
                   '请用户先用策划（0.8.0 起）转成格式 5（照策划 handoff.md 第 7 节；格式 1 先照 CHANGELOG 0.4.0 一行转成格式 2），'
                   '或更新策划后重新交接')
    ver = FORMATS.get(m.group(1))
    if m.group(1) == 'ai-content-planner/5' and plan_path.name != 'content.md':
        raise Stop(f'{plan_path} 写着格式 5：格式 5 只读 content.md，给目录或 content.md 的路径')
    if ver is None:
        raise Stop(f'{plan_path} 的格式是「{m.group(1)}」，本 Skill 只认 {"、".join(FORMATS)}，不猜着读。请用户更新本 Skill 或策划')

    st = re.search(r'^状态[：:]\s*([^（(。\s]+)', text, re.M)
    status = st.group(1) if st else ''
    if status == '回流中':
        raise Stop('状态是「回流中」：策划还在处理下游提的缺口，等策划改回「已交接」再接')
    if status != '已交接':
        raise Stop(f'状态是「{status or "（没写）"}」，只接「已交接」；请用户先在策划里做完、交接'
                   '（效果待确认、框架待确认、补齐中都还没交接）')

    if ver == 5:
        import plan5
        return plan5.read(plan_path, text)
    title, secs = sections(text)
    notes, errors = [], []
    if ver == 2:
        notes.append('这是交接格式 2（旧格式）：没有效果、形式、说法、约束、素材，照需求、立意、框架接；'
                     '要这些，请用户用策划（0.7.0 起）转成格式 4')
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

    say, origs = [], []  # 说法点到的段号，按出现顺序；写了「原句」的行（段号、点、原句）
    for r in named_table(secs, '说法', SAY_HEAD, errors, 'plan.md') if ver >= 3 else []:
        if ver >= 4 and ORIG in r['不能丢的']:
            quoted = re.findall(r'「([^」]*)」', r['参考说法'])
            gs = [g for g, _ in SAY_POINT.findall(r['点']) if g in frame]
            if gs:
                origs.append({'segs': list(dict.fromkeys(gs)), 'point': r['点'],
                              'text': ''.join(quoted) if quoted else r['参考说法']})
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
        old = '；同目录有 research.md，是格式 1 的文件名，请用户先用策划转成格式 4' if (plan_path.parent / 'research.md').exists() else ''
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
    P = {'plan': plan_path, 'title': title, 'version': ver, 'segs': segs, 'frame': frame, 'content': content,
         'sources': {r['资料']: r['位置'] for r in src}, 'say': say, 'materials': mats, 'rules': rules,
         'ar': ar, 'sec': sec, 'silent': silent, 'size_where': size_where, 'origs': origs,
         'expr': {}, 'tone': None, 'tension': None, 'views': {}, 'can': set(), 'cannot': set(),
         'notes': notes, 'errors': errors}
    if ver >= 4:
        read_v4(P, secs, spec)
    return P


def read_v4(P, secs, spec):
    """格式 4 的表达、画面、制作条件，写进 P：expr（项 → 内容）、tone（主档）、tension（1–3）、
    views（H1 → 画面一行，另有 refs：用到的编号）、can、cannot（制作条件能用、不能用的画面来源）"""
    errors, notes, frame = P['errors'], P['notes'], P['frame']
    lines = secs.get('表达')
    rows = table(lines or [], FORM_HEAD)
    if lines is None:
        errors.append('格式 4 的 plan.md 要有「## 表达」一节（在形式和立意之间）')
    elif rows is None:
        h = first_table_head(lines)
        errors.append(f'plan.md「表达」的表头要是「{" | ".join(FORM_HEAD)}」' + (f'，现在是「{" | ".join(h)}」' if h else ''))
    expr = {r['项']: r['内容'] for r in rows or []}
    if rows is not None:
        miss = [k for k in EXPR_ITEMS if not expr.get(k, '').strip()]
        if miss:
            errors.append(f'表达缺 {"、".join(miss)}（六项：{"、".join(EXPR_ITEMS)}）')
    read_tone(P, expr, '表达')
    read_make(P, spec.get('制作条件', ''), '形式')

    lines = secs.get('画面')
    rows = table(lines or [], VIEW_HEAD)
    if lines is None:
        errors.append('格式 4 的 plan.md 要有「## 画面」一节（在框架和效果自查之间）')
    elif rows is None:
        h = first_table_head(lines)
        errors.append(f'plan.md「画面」的表头要是「{" | ".join(VIEW_HEAD)}」' + (f'，现在是「{" | ".join(h)}」' if h else ''))
    gap_rows = table(secs.get('缺口', []), GAP_HEAD)
    gaps = {r['编号']: r for r in gap_rows or []} if gap_rows is not None else \
        {q: {} for q in GAP_ID.findall('\n'.join(secs.get('缺口', [])))}
    views = {}
    for r in rows or []:
        h = r['#']
        if not r['#'] and not r['段']:
            continue
        w = f'画面 {h or "（没编号）"}'
        if not VIEW_ID.fullmatch(h):
            errors.append(f'{w}：编号写 H1、H2……')
            continue
        if h in views:
            errors.append(f'{w}：编号重复了')
            continue
        if r['段'] not in frame:
            errors.append(f'{w}：段「{r["段"]}」不在框架里（一行写一个段号）')
        if r['来源'] not in SOURCES:
            errors.append(f'{w}：来源「{r["来源"]}」不是 {"、".join(SOURCES)} 之一')
        elif r['来源'] in P['cannot']:
            errors.append(f'{w}：来源是{r["来源"]}，制作条件写着不能用：请用户回策划改（缺口表加行、状态改「回流中」）')
        refs = [x.strip() for x in re.split(r'[、，,]', r['用到']) if x.strip()]
        for x in refs:
            if DATA_ID.fullmatch(x):
                ok = x in P['content']
            elif re.fullmatch(r'P\d+\s+[a-z]', x):
                g, pt = x.split()
                ok = g in frame and pt in frame[g]['points']
            elif MAT_ID.fullmatch(x):
                ok = x in P['materials']
            elif RULE_ID.fullmatch(x):
                ok = x in P['rules']
            elif GAP_ID.fullmatch(x):
                ok = x in gaps
                g = gaps.get(x) or {}
                if ok and g.get('归谁') == '下游' and g.get('状态') == '待补':
                    notes.append(f'{w}（{r["段"]}，{r["来源"]}）用到 {x}，归下游、待补：{g.get("缺什么", "")[:30]}')
            else:
                ok = None
            if ok is None:
                errors.append(f'{w}：用到的「{x}」认不出（写 P1-1、P1 a、M1、K1、Q1，几条用「、」）')
            elif not ok:
                errors.append(f'{w}：用到的 {x} 在 plan.md、content.md 里找不到')
        r['refs'] = refs
        views[h] = r
    P['views'] = views
    if rows is not None:
        for g in P['segs']:
            if not any(v['段'] == g for v in views.values()):
                notes.append(f'框架 {g} 没有画面行：这段的画面本 Skill 自己定')


def read_tone(P, expr, where):
    """基调（主档）、张力（1–3）写进 P；where 是这两项所在的节（格式 4 的表达、格式 5 的总则）"""
    errors, notes, frame = P['errors'], P['notes'], P['frame']
    tone = expr.get('基调', '').strip()
    if tone:
        P['tone'] = next((x for x in TONES if tone.startswith(x)), '自定' if re.match(r'自定[：:]', tone) else None)
        if P['tone'] is None:
            errors.append(f'{where}的基调「{tone[:20]}」要以一档开头（{"、".join(TONES)}），或写「自定：……」')
        for g in SEG_ID.findall(PAREN.sub('', tone)):
            if frame and g not in frame:
                notes.append(f'{where}的基调写了 {g} 的局部档，{g} 不在框架里')
    tension = expr.get('张力', '').strip()
    if tension:
        m = re.match(r'[123](?!\d)', tension)
        if m:
            P['tension'] = int(m.group())
        else:
            errors.append(f'{where}的张力「{tension[:20]}」要以 1、2、3 开头（1 克制、2 有起伏、3 强刺激）')
    P['expr'] = expr


def read_make(P, cell, where):
    """制作条件「能用：……；不能用：……」→ P 的 can、cannot（画面来源）"""
    mk = cell.strip()
    m = MAKE.fullmatch(mk)
    if not m:
        P['errors'].append(f'{where}的「制作条件」要写成「能用：……；不能用：……」，现在是「{mk or "（没写）"}」')
        return
    for key, c in (('can', m.group(1)), ('cannot', m.group(2))):
        for name in re.split(r'[、，,]', PAREN.sub('', c)):
            name = re.split(r'[：:]', name, maxsplit=1)[0].strip().rstrip('。')  # 「生视频：只拍手」：冒号后是限制
            if not name or name == '无':
                continue
            if name in SOURCES:
                P[key].add(name)
            else:
                P['notes'].append(f'制作条件里的「{name}」不是画面来源（{"、".join(SOURCES)}），不读')


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
    """分镜脚本：plan、seg 在框架里且按框架顺序、每个段号都用到、每段的秒数贴近篇幅、ar 和全片时长贴近策划、
    不说话的片子 unify.voice 是 null；格式 3 另查 rule 的 K 号在约束表里、框架「怎么证明」写了 K 的段里 G 类分镜写了 rule、
    分镜 src 用到的素材：不能送生成的不进 G 类分镜，只作参考的不进成片"""
    errs, notes = [], []
    if plan_rel is not None and sb.get('plan') != plan_rel:
        errs.append(f'分镜脚本的 "plan" 要写 "{plan_rel}"（来自哪份 {"content.md" if P["version"] >= 5 else "plan.md"}），'
                    f'现在是 {sb.get("plan")!r}')
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
            notes.append(f'{p} 写了 {t:g} 秒，框架篇幅是 {P["frame"][p]["篇幅"]}')
    whole = sum(total.values())
    if P.get('sec') and whole and abs(whole - P['sec']) > P['sec'] * cs.TOLERANCE:
        notes.append(f'各段合计 {whole:g} 秒，策划的目标时长是 {P["sec"]:g} 秒')
    if P.get('ar') and sb.get('ar', '16:9') != P['ar']:
        notes.append(f'分镜脚本的 ar 是 {sb.get("ar", "16:9")!r}，策划定的是 {P["ar"]}（{P["size_where"]}），按策划的出')
    u = sb.get('unify')
    if P.get('silent') and isinstance(u, dict) and u.get('voice'):
        errs.append(f'策划定的声音是「{P["silent"]}」：不说话，unify.voice 写 null（形式要改先回流）')
    e, n = check_rules(P, sb, lib)
    e2, n2 = check_views(P, sb, lib)
    return errs + e + e2, notes + n + n2


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


def view_list(v):
    """view：「H1」或 ["H1", "H2"] → 列表；写错返回 None"""
    hs = [v] if isinstance(v, str) else v
    if isinstance(hs, list) and hs and all(isinstance(h, str) and VIEW_ID.fullmatch(h) for h in hs):
        return hs
    return None


def claimers(sb):
    """分镜脚本里每个 uses 一条、分镜：(段序号, 名字, 是不是分镜, 对象)"""
    out = []
    for i, s in enumerate(sb.get('segments') or [], 1):
        if not isinstance(s, dict):
            continue
        for j, x in enumerate(s.get('uses') or [], 1):
            if isinstance(x, dict):
                out.append((i, f'第 {i} 段 uses 第 {j} 条', False, x))
        for j, x in enumerate(s.get('shots') if isinstance(s.get('shots'), list) else [], 1):
            if isinstance(x, dict):
                out.append((i, f'分镜 {cs.shot_name(i, j)}', True, x))
    return out


def view_claims(P, sb):
    """画面 H → 认领它的 [(名字, 是不是分镜, 对象)]；view 写错、指的 H 不在画面表或段不对的记进 errs"""
    errs, claims = [], {h: [] for h in P['views']}
    segs = sb.get('segments') or []
    for i, w, is_shot, x in claimers(sb):
        if 'view' not in x:
            continue
        hs = view_list(x['view'])
        if hs is None:
            errs.append(f'{w}：view 写画面编号 "H1"，几条写数组 ["H1", "H2"]，现在是 {x["view"]!r}')
            continue
        if P['version'] < 4:
            errs.append(f'{w}：交接格式 {P["version"]} 没有画面（H），不写 view')
            continue
        g = segs[i - 1].get('seg')
        for h in hs:
            if h not in P['views']:
                errs.append(f'{w}：view {h} 在 {P.get("where_views", "plan.md 的画面表")}里找不到')
            elif P['views'][h]['段'] != g:
                errs.append(f'{w}：view {h} 是 {P["views"][h]["段"]} 的画面，这段是 {g}')
            else:
                claims[h].append((w, is_shot, x))
    return errs, claims


def check_views(P, sb, lib=None):
    """格式 4：每行画面有 uses 或分镜认领（view），类别和来源对得上，H 用到的 M 在认领分镜的 src、K 在认领者的 rule；
    制作条件「不能用」的来源不出现在 materials 里，生图、生视频都不能用时没有 G 类"""
    errs, claims = view_claims(P, sb)
    notes = []
    if P['version'] < 4:
        return errs, notes
    styles = (lib or cs.library())[0]
    for h, v in P['views'].items():
        got = claims.get(h, [])
        w = f'画面 {h}（{v["段"]}，{v["来源"]}：{v["要看到什么"][:20]}）'
        if not got and P['version'] >= 5:
            import plan5
            if plan5.reported(P, h, ('偏离', '缺素材', '冲突')):
                continue
            errs.append(f'{w}：没有分镜认领：在用它的分镜写 "view": "{h}"；每格都要在成片里出现，做不出来的保住主角、'
                        '最大的字、配哪句换一种做法（回报「偏离」），连主角都保不住的回流')
            continue
        if not got:
            errs.append(f'{w}：没有分镜认领：在用它的 uses 一条或分镜写 "view": "{h}"；每行画面都要在成片里出现，'
                        '要换来源先回流')
            continue
        want = SOURCES.get(v['来源'])
        for name, _, x in got:
            c = item_class(x, styles)
            if want and c and c != want:
                errs.append(f'{name}：认领 {h}，{v["来源"]}要 {want} 类，这里是 {c} 类（要换来源先回流）')
        mids = [x for x in v.get('refs', []) if MAT_ID.fullmatch(x) and x in P['materials']]
        shots = [x for _, is_shot, x in got if is_shot]
        if mids and not shots:
            notes.append(f'{w}：只在 uses 认领，拆到分镜、src 写 {"、".join(mids)}，检查才对得上素材')
        elif mids:
            found = set()
            for x in shots:
                found |= set(materials_in(x.get('src'), P['materials'])[0])
            miss = [m for m in mids if m not in found]
            if miss:
                errs.append(f'{w}：用到 {"、".join(miss)}，认领它的分镜 src 里没有（照素材表的「文件」写路径或写 "M1"）')
        ks = [x for x in v.get('refs', []) if RULE_ID.fullmatch(x)]
        have = set()
        for _, _, x in got:
            have |= set(rule_list(x.get('rule')) or [])
        miss = [k for k in ks if k not in have]
        if miss:
            errs.append(f'{w}：要守 {"、".join(miss)}，认领它的 uses 或分镜要写 rule')
    no = P['cannot']
    no_g = {'生图', '生视频'} <= no
    no_t = {k for k, c in SOURCES.items() if c == 'T'} <= no
    for _, name, _, x in claimers(sb):
        ms = x.get('materials') if isinstance(x.get('materials'), list) else []
        bad = [m for m in ms if m in no]
        if bad:
            errs.append(f'{name}：用了 {"、".join(bad)}，制作条件写着不能用（形式要改先回流）')
        c = item_class(x, styles)
        if (c == 'G' and no_g) or (c == 'T' and no_t):
            errs.append(f'{name}：{c} 类，制作条件不能用{"生图、生视频" if c == "G" else "真实素材"}（形式要改先回流）')
    return errs, notes


def norm(s):
    """去掉标点和空格"""
    return re.sub(r'[\W_]', '', s)


def orig_rows(P, sc):
    """原句和逐字稿对照：每行 (点, 原句, 同段的 vo 连起来, 结果)；结果是「对上」「数字写法不同」「字改了」「没有旁白」。
    vo 先按 show 换成字幕写法，两边去掉标点、空格；还对不上的再把数字去掉比"""
    show = sc.get('show') if isinstance(sc.get('show'), dict) else {}
    out = []
    for o in P.get('origs', []):
        vo = ''.join(v for s in sc.get('segments', []) if s.get('seg') in o['segs']
                     for v in (s.get('vo') if isinstance(s.get('vo'), list) else []) if isinstance(v, str))
        shown = vo
        for k in sorted((k for k in show if isinstance(k, str) and isinstance(show[k], str)), key=len, reverse=True):
            shown = shown.replace(k, show[k])
        a, b = norm(o['text']), norm(shown)
        if not b:
            res = '没有旁白'
        elif a in b:
            res = '对上'
        elif NUM.sub('', a) in NUM.sub('', b):
            res = '数字写法不同'
        else:
            res = '字改了'
        out.append((o['point'], o['text'], vo, res))
    return out


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
    if P['version'] >= 4 and not P.get('silent'):
        for point, text, _, res in orig_rows(P, sc):
            if res == '字改了':
                errs.append(f'说法 {point} 是原句，逐字稿没照着念：「{text[:30]}」只许改念法、断句，字不改'
                            '（字幕写法和念法不同的写进 show）')
            elif res == '数字写法不同':
                notes.append(f'说法 {point} 是原句，去掉数字才对得上：核对数字的念法，或把字幕写法写进 show（--table 有对照）')
        if P.get('tension') == 1:
            bang = [f'{s.get("seg")} 第 {k} 句' for s in segs for k, v in enumerate(
                s.get('vo') if isinstance(s.get('vo'), list) else [], 1) if isinstance(v, str) and re.search('[！!]', v)]
            if bang:
                notes.append(f'表达的张力是 1（克制，不用感叹），逐字稿有感叹号：{"、".join(bang)}')
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
            if kind == 'C4':
                e, n = c4_say(row, said or f.get('what', ''), where, r)
                notes += n
            if re.fullmatch(r'F[1-3]', kind):
                notes.append(f'{where}：{r} 是素材 {kind}，用「来源」里的链接或 source/ 路径，按「必须写清的」处理授权：{row["必须写清的"]}')
    return errs, notes


def c4_say(row, said, where, r):
    """C4（某方自己说的）怎么讲照「必须写清的」（策划 0.8.1）：写了讲成观点的（用户、作者、品牌方自己的观点）不加「官方称」；
    写了「讲成「X」」的查 X；都没写的照旧要「官方称」「按计划」"""
    must = row.get('必须写清的', '')
    for m in re.finditer(r'(不要|不能|不该|别|不)?讲成[^，。；「」]{0,12}观点', must):
        if not m.group(1):
            return [], []
    want = re.findall(r'讲成「([^」]+)」', must)
    if want:
        if any(w in said for w in want):
            return [], []
        return [], [f'{where}：{r} 是 C4（某方自己说的），「必须写清的」写着讲成{"".join(f"「{w}」" for w in want)}，旁白里没有']
    if re.search(r'官方|按计划|计划', said):
        return [], []
    return [], [f'{where}：{r} 是 C4（某方自己说的），旁白要讲成「官方称」「按计划」（「必须写清的」写了讲成观点的除外）']


def plan_tables(P, sb, sc):
    """格式 4 给用户确认的两张对照：画面 H 和认领它的分镜；原句和逐字稿"""
    _, claims = view_claims(P, sb)
    out = ['画面和认领它的分镜（每行画面都要在成片里出现）：', '', '| 画面 | 段 | 要看到什么 | 来源 | 用到 | 认领 |',
           '|---|---|---|---|---|---|']
    for h, v in P['views'].items():
        who = '、'.join(name for name, _, _ in claims.get(h, [])) or '✗ 没有'
        out.append(f'| {h} | {v["段"]} | {cs.cell(v["要看到什么"])} | {v["来源"]} | {cs.cell(v["用到"]) or "—"} | {who} |')
    rows = orig_rows(P, sc) if sc is not None else []
    if rows:
        out += ['', '原句和逐字稿（原句只许改念法、断句）：', '', '| 点 | 原句 | 逐字稿（同段的 vo） | 结果 |', '|---|---|---|---|']
        for point, text, vo, res in rows:
            out.append(f'| {point} | {cs.cell(text)} | {cs.cell(vo) or "—"} | {res if res == "对上" else "**" + res + "**"} |')
    return '\n'.join(out)


def main(argv=None):
    ap = argparse.ArgumentParser(description='认 ai-content-planner/5（也认 /4、/3、/2）的交接，查分镜脚本、逐字稿的引用')
    ap.add_argument('plan', help='plans/<短名>（目录）、plans/<短名>/content.md（格式 5）或 plans/<短名>/plan.md（格式 4、3、2）')
    ap.add_argument('--storyboard', help='videos/<短名>/storyboard.json')
    ap.add_argument('--script', help='videos/<短名>/script.json')
    ap.add_argument('--root', default='.', help='分镜脚本、逐字稿里 "plan" 相对的目录（默认当前目录）')
    ap.add_argument('--ready', action='store_true', help='再查用户确认过了（见 check_storyboard.py）')
    ap.add_argument('--table', action='store_true', help='打印段落表、分镜表和全片统一，给用户看')
    ap.add_argument('--timing', help='配音后的 timing.json（默认分镜脚本同目录的；格式 5 拿它查配哪句和时长）')
    ap.add_argument('--pack-root', action='append', default=[], metavar='目录',
                    help='项目里沉淀的风格包目录（可多次），透传给通用检查，和 Skill 自带的 packs/ 一起认 ref')
    a = ap.parse_args(argv)
    try:
        P = read_plan(a.plan)
    except Stop as x:
        print(f'停下，不接：{x}')
        return 2
    root = Path(a.root).resolve()
    try:
        rel = Path(P['plan']).resolve().relative_to(root).as_posix()
    except ValueError:
        rel = None
    errs, notes = list(P['errors']), list(P['notes'])
    try:
        sb = cs.load(a.storyboard) if a.storyboard else None
        sc = cs.load(a.script) if a.script else None
    except cs.Unreadable as x:
        print(f'读不了：{x}')
        return 2
    lib = cs.library(a.pack_root)
    if sb is not None:
        e, n = check_storyboard(P, sb, rel, lib)
        errs += e
        notes += n
    if sc is not None:
        e, n = check_script(P, sc, rel)  # 和分镜脚本对不对得上由下面的通用检查查
        errs += e
        notes += n
    timing = None
    if a.timing:
        try:
            timing = cs.load(a.timing)
        except cs.Unreadable as x:
            print(f'读不了：{x}')
            return 2
    elif a.storyboard:
        timing = cs.timing_of(a.storyboard)
    if P['version'] >= 5:
        import plan5
        e, n = plan5.check(P, sb, sc, lib, timing, a.pack_root)
        errs += e
        notes += n
    if sb is not None:
        e, n = cs.check(sb, sc, a.ready, lib)
        errs += e
        notes += n
        if a.table:
            print(cs.table(sb, sc, lib, timing))
            print()
            if P['version'] >= 5:
                print(plan5.tables(P, sb, sc, timing, a.pack_root))
                print()
            elif P['version'] >= 4:
                print(plan_tables(P, sb, sc))
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
    if P['version'] >= 5:
        extra = (f'、念什么 {len(P["sents"])} 句、看什么 {len(P["views"])} 格、红线 {len(P["redlines"])} 条、'
                 f'约束 {len(P["rules"])} 条、下游回报 {len(P["reports"])} 行；基调 {P["tone"] or "？"}、张力 {P["tension"] or "？"}、'
                 f'语速 {P["speed"] or "无"}')
    elif P['version'] >= 4:
        extra += f'、画面 {len(P["views"])} 行；基调 {P["tone"] or "？"}、张力 {P["tension"] or "？"}'
    print(f'{P["plan"]}：格式 {P["version"]}、已交接，{len(P["segs"])} 段，{"信息" if P["version"] >= 5 else "content.md"} '
          f'{len(P["content"])} 条{extra}' +
          (f'；{len(errs)} 个问题' if errs else '；没有问题'))
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
