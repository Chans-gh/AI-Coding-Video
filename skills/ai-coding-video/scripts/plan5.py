"""交接格式 5（ai-content-planner/5）：读 content.md（唯一的交付物，不读 plan.md），查逐字稿的 say、分镜的 view 和版式、
下游回报、红线、字数和时长。check_plan.py 调，不单独跑。只用标准库。

格式以策划的 handoff.md（格式 5）为准；本 Skill 怎么接见 storyboard.md。冲突时谁让谁照 handoff.md 第 5 节的六级：
红线、约束不能违反；原句只改念法和断句；必讲可以压缩、不能删；可删按圈号从小到大删。
"""
import json
import re
from pathlib import Path

import check_plan as cp
import check_storyboard as cs

FORMAT = 'ai-content-planner/5'
GEN_HEAD = ['项', '内容', '依据']
GEN_ITEMS = ('输出形式和规格', '篇幅', '注意力预算', '结构', '声音', '语速', '证明方式', '制作条件', '基调', '张力', '钩子',
             '句式和节奏', '情绪曲线')
RED_HEAD = ['#', '不许', '怎么查', '依据']
SEG_HEAD = ['项', '内容']
SEG_ITEMS = ('作用', '从 → 到', '要讲的点', '篇幅', '情绪', '节奏')
SAY_HEAD = ['#', '点', '句', '级', '依据']
VIEW_HEAD = ['#', '要看到什么', '来源', '主角', '最大的字', '上屏的字', '配哪句', '用到']
DATA_HEAD = cp.DATA_HEAD + ['去向']
REPORT_HEAD = ['#', '段', '类型', '对象', '说明', '归谁', '状态', '怎么解决的']
BLOCKS = ('念什么', '看什么', '信息')
LEADS = ('一个数', '两数对比', '走势', '构成', '排名', '表格', '流程', '清单', '一句话', '问答', '地图', '实物', '人', '场景', '界面')
MOODS = ('紧', '松', '稳', '扬')
PACES = ('快', '中', '慢')
CPS = {'慢': 4.0, '中': 4.5, '快': 5.0}   # 语速档：每秒几个字（标点不算），策划按它估字数
ORIG, MUST, CUT = '原句', '必讲', '可删'
CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'
KINDS = ('删减', '压缩', '偏离', '缺内容', '缺素材', '冲突')
OWNERS = ('策划', '下游')
STATES = ('待补', '已补', '已知悉', '改内容关闭')
CHECKS = ('词', '条件', '人工')
S_ID = re.compile(r'S\d+')
B_ID = re.compile(r'B\d+')
X_ID = re.compile(r'X\d+')
IDS = re.compile(r'([SH])(\d+)(?:\s*[–\-~—]\s*\1?(\d+))?')
SLACK = 0.15  # 篇幅可以超出总则区间的 15%（第 5 级）
LOOKUP = 'lookup.json'


def is_v5(path):
    """文件标题下面一行是不是格式 5"""
    try:
        lines = [x for x in Path(path).read_text(encoding='utf-8').splitlines() if x.strip()]
    except OSError:
        return False
    return len(lines) > 1 and re.fullmatch(r'格式[：:]\s*' + re.escape(FORMAT), lines[1].strip()) is not None


def blocks(lines):
    """一段的节 → (段头的行, {念什么: 行, 看什么: 行, 信息: 行})"""
    head, out, cur = [], {}, None
    for line in lines:
        if line.startswith('### '):
            cur = line[4:].strip()
            out[cur] = []
        elif cur is None:
            head.append(line)
        else:
            out[cur].append(line)
    return head, out


def need_table(lines, head, errors, where):
    """表头要逐字对上；对不上记一条错，返回 []"""
    rows = cp.table(lines or [], head)
    if rows is None:
        h = cp.first_table_head(lines or [])
        errors.append(f'{where}的表头要是「{" | ".join(head)}」' + (f'，现在是「{" | ".join(h)}」' if h else '，没找到表'))
        return []
    return [r for r in rows if any(v.strip() for v in r.values())]


def expand(cell, kind):
    """「S8–S12」「H3、H4」→ ['S8', …]；kind 是 S 或 H"""
    out = []
    for m in IDS.finditer(cell):
        if m.group(1) != kind:
            continue
        a = int(m.group(2))
        b = int(m.group(3)) if m.group(3) else a
        out += [f'{kind}{n}' for n in range(a, b + 1)]
    return out


def read_dest(cell):
    """信息的「去向」→ {say: [S], show: [H], basis, skip, odd: [认不出的]}"""
    d = {'say': [], 'show': [], 'basis': False, 'skip': False, 'odd': []}
    for part in re.split(r'[；;]', cell):
        part = part.strip()
        if not part:
            continue
        if part.startswith('念'):
            d['say'] += expand(part, 'S')
        elif part.startswith('上屏'):
            d['show'] += expand(part, 'H')
        elif part.startswith('依据'):
            d['basis'] = True
        elif part.startswith('不讲'):
            d['skip'] = True
        else:
            d['odd'].append(part)
    return d


def read_level(cell):
    """级 →（级, 圈号的数）；认不出返回 (None, None)"""
    c = cell.strip()
    if c in (ORIG, MUST):
        return c, None
    m = re.fullmatch(CUT + r'\s*([' + CIRCLED + r'])', c)
    if m:
        return CUT, CIRCLED.index(m.group(1)) + 1
    return None, None


def quoted(cell):
    q = re.findall(r'「([^」]*)」', cell)
    return ''.join(q) if q else cell.strip()


def redline_words(cell):
    """「词：「收益」「回报」；除外：S1、题目」→ ['收益', '回报']"""
    return redline_rule(cell)['words']


def redline_rule(cell):
    """红线「词：」一格 → {words, except_s: [S], except_title, odd: [读不出的例外说明]}。
    例外只认「；除外：」后面的 S 编号（S5–S7 也行）和「题目」（策划 0.8.1）；别的写法读不出，放进 odd：按没有例外查，交人工看"""
    out = {'words': [], 'except_s': [], 'except_title': False, 'odd': []}
    m = re.match(r'\s*词[：:](.*)', cell)
    if not m:
        return out
    parts = re.split(r'[；;]', m.group(1))
    out['words'] = [w for w in re.findall(r'「([^」]+)」', parts[0]) if w.strip()]
    for part in parts[1:]:
        part = part.strip()
        if not part:
            continue
        e = re.fullmatch(r'除外[：:](.*)', part)
        if not e:
            out['odd'].append(part)
            continue
        for item in re.split(r'[、，,\s]+', e.group(1).strip().rstrip('。')):
            if not item:
                continue
            if item == '题目':
                out['except_title'] = True
            elif re.fullmatch(r'S\d+(?:\s*[–\-~—]\s*S?\d+)?', item):
                out['except_s'] += expand(item, 'S')
            else:
                out['odd'].append(f'除外：{item}')
    return out


def title_texts(title):
    """content.md 的标题 → 题目的几种写法（整行、「内容表：」后面的）"""
    t = title.strip().lstrip('#').strip()
    out = {t}
    if re.search(r'[：:]', t):
        out.add(re.split(r'[：:]', t, maxsplit=1)[1].strip())
    return sorted((x for x in out if x), key=len, reverse=True)


def screen_items(cell):
    """看什么「上屏的字」→ 要上屏的字的条目。有「」的只认「」里的（别的是说明）；没有的按 、；<br> 拆，
    「无」和写要求的（「不写比例数字」这类以不、无、别开头的）不算"""
    c = cell.strip()
    if not c or c == '无':
        return []
    q = [x.strip() for x in re.findall(r'「([^」]+)」', c) if x.strip()]
    if q:
        return q
    return [x.strip() for x in re.split(r'<br\s*/?>|[、；;]', c) if x.strip() and not re.match(r'[不无别]', x.strip())]


def read(cpath, text):
    """读格式 5 的 content.md。不能接时抛 cp.Stop；能接时返回和格式 4 同样的键（check_plan.py 的通用检查照用），另有：
    range（篇幅区间）、speed、cps（语速档和每秒字数，没有旁白是 None）、redlines（B → 行，另有 kind、words）、
    sents（S → 句，另有 seg、level、rank、text）、reports（下游回报，按顺序）、status"""
    title, secs = cp.sections(text)
    notes, errors = [], []
    st = re.search(r'^状态[：:]\s*([^（(。\s]+)', text, re.M)
    status = st.group(1) if st else ''

    names = list(secs)
    seg_names = [n for n in names if re.match(r'P\d+\s', n + ' ')]
    want = ['总则', '红线', '约束'] + seg_names + (['素材'] if '素材' in secs else []) + ['资料清单', '衍生', '下游回报']
    miss = [n for n in want if n not in secs]
    if miss:
        errors.append(f'content.md 缺这几节：{"、".join(miss)}（格式 5 的顺序：总则、红线、约束、每段一节、素材（可没有）、'
                      '资料清单、衍生、下游回报）')
    else:
        got = [n for n in names if n in want]
        if got != want:
            errors.append(f'content.md 节的顺序要是「{"、".join(want)}」，现在是「{"、".join(got)}」')
    extra = [n for n in names if n not in want]
    if extra:
        notes.append(f'content.md 有格式 5 之外的节，不读：{"、".join(extra)}')
    if not seg_names:
        errors.append('content.md 没有段（「## P1 段的作用」一段一节）')

    gen = {r['项']: r['内容'] for r in need_table(secs.get('总则'), GEN_HEAD, errors, 'content.md「总则」')}
    if '总则' in secs:
        lack = [k for k in GEN_ITEMS if not gen.get(k, '').strip()]
        if lack:
            errors.append(f'总则缺 {"、".join(lack)}（{len(GEN_ITEMS)} 项：{"、".join(GEN_ITEMS)}）')
    form = gen.get('输出形式和规格', '')
    if form and '视频' not in form:
        raise cp.Stop(f'总则的「输出形式和规格」是「{form}」，不是视频，交给对应的 Skill')
    am = cp.AR.search(form)
    extent = gen.get('篇幅', '')
    parts = re.split(r'[；;，,]', extent, maxsplit=1)
    sec = cp.seconds(parts[0]) if extent else None
    rng = None
    if len(parts) > 1:
        m = re.search(r'(\d+(?:\.\d+)?)\s*[–\-~—至到]\s*(\d+(?:\.\d+)?)', parts[1])
        if m:
            rng = (float(m.group(1)), float(m.group(2)))
    if extent and sec is None:
        errors.append(f'总则的篇幅「{extent}」读不出秒数（写「90 秒，80–105」）')
    voice = gen.get('声音', '')
    speed = gen.get('语速', '').strip()[:1]
    if gen.get('语速', '').strip().startswith('无'):
        speed = '无'
    elif gen.get('语速') and speed not in CPS:
        errors.append(f'总则的语速「{gen["语速"]}」要是 慢、中、快 之一，没有旁白写「无」')
        speed = '中'
    silent = voice if cp.SILENT.search(voice) else ('没有旁白（语速写「无」）' if speed == '无' else '')

    P = {'plan': Path(cpath), 'title': title, 'version': 5, 'segs': [], 'frame': {}, 'content': {}, 'sources': {},
         'say': [], 'materials': {}, 'rules': {}, 'ar': f'{am.group(1)}:{am.group(2)}' if am else None, 'sec': sec,
         'silent': silent, 'size_where': '总则的「输出形式和规格」', 'origs': [], 'expr': gen, 'tone': None,
         'tension': None, 'views': {}, 'can': set(), 'cannot': set(), 'notes': notes, 'errors': errors,
         'range': rng, 'speed': None if speed == '无' else (speed or '中'), 'redlines': {}, 'sents': {},
         'reports': [], 'status': status, 'where_views': 'content.md 的「看什么」'}
    P['cps'] = CPS.get(P['speed']) if P['speed'] else None
    cp.read_tone(P, gen, '总则')
    cp.read_make(P, gen.get('制作条件', ''), '总则')

    for r in need_table(secs.get('红线'), RED_HEAD, errors, 'content.md「红线」') if '红线' in secs else []:
        b = r['#']
        w = f'红线 {b or "（没编号）"}'
        if not B_ID.fullmatch(b):
            errors.append(f'{w}：编号写 B1、B2……')
            continue
        if b in P['redlines']:
            errors.append(f'{w}：编号重复了')
            continue
        m = re.match(r'\s*(词|条件|人工)[：:]', r['怎么查'])
        if not m:
            errors.append(f'{w}：「怎么查」要以「词：」「条件：」「人工：」之一开头，现在是「{r["怎么查"][:20]}」')
        r['kind'] = m.group(1) if m else None
        r.update(redline_rule(r['怎么查']))
        if r['kind'] == '词' and not r['words']:
            errors.append(f'{w}：「词：」后面要有「」引起来的词')
        P['redlines'][b] = r
    P['rules'] = {r['#']: r for r in cp.named_table(secs, '约束', cp.RULE_HEAD, errors, 'content.md')}
    for k, r in P['rules'].items():
        if r['状态'] not in ('已核实', '设定'):
            notes.append(f'约束 {k} 的状态是「{r["状态"]}」：拿不准的样子先别照着生成，问用户或回流')
    P['materials'] = {r['#']: r for r in cp.named_table(secs, '素材', cp.MAT_HEAD, errors, 'content.md')}
    P['sources'] = {r['资料']: r['位置'] for r in cp.table(secs.get('资料清单', []), cp.SRC_HEAD) or []}

    for name in seg_names:
        read_segment(P, name, secs[name])
    check_refs(P)
    read_reports(P, secs.get('下游回报'))
    return P


def read_segment(P, name, lines):
    errors, notes = P['errors'], P['notes']
    g = re.match(r'(P\d+)', name).group(1)
    if g in P['frame']:
        errors.append(f'段 {g} 有两节')
        return
    head, bl = blocks(lines)
    where = f'content.md「{g}」'
    hd = {r['项']: r['内容'] for r in need_table(head, SEG_HEAD, errors, f'{where}的段头')}
    lack = [k for k in SEG_ITEMS if k not in hd]
    if hd and lack:
        errors.append(f'{where}的段头缺 {"、".join(lack)}（六行：{"、".join(SEG_ITEMS)}）')
    pts = {}
    for part in re.split(r'<br\s*/?>', hd.get('要讲的点', '')):
        if part.strip():
            pm = cp.POINT.fullmatch(part.strip())
            if pm:
                pts[pm.group(1)] = pm.group(2).strip()
            else:
                errors.append(f'{g} 的「要讲的点」要按 a. ……<br>b. …… 写：{part.strip()[:20]}')
    mood, pace = hd.get('情绪', '').strip()[:1], hd.get('节奏', '').strip()[:1]
    if hd.get('情绪') and mood not in MOODS:
        errors.append(f'{g} 的情绪「{hd["情绪"]}」要以 紧、松、稳、扬 之一开头')
    if hd.get('节奏') and pace not in PACES:
        errors.append(f'{g} 的节奏「{hd["节奏"]}」要是 快、中、慢 之一')
    fsec = cp.seconds(hd.get('篇幅', '')) if hd.get('篇幅') else None
    if hd.get('篇幅') and fsec is None:
        errors.append(f'{g} 的篇幅「{hd["篇幅"]}」不是秒：视频的篇幅单位是秒')
    for b in BLOCKS:
        if b not in bl:
            errors.append(f'{where}缺「### {b}」')
    fr = {'段': g, 'title': name, '作用': hd.get('作用', ''), '篇幅': hd.get('篇幅', ''), 'points': pts, 'sec': fsec,
          'rules': [], 'mood': mood if mood in MOODS else None, 'pace': pace if pace in PACES else None,
          '情绪': hd.get('情绪', ''), '节奏': hd.get('节奏', '')}
    P['frame'][g] = fr
    P['segs'].append(g)

    for r in need_table(bl.get('念什么'), SAY_HEAD, errors, f'{where}「念什么」') if '念什么' in bl else []:
        s = r['#']
        w = f'念什么 {s or "（没编号）"}'
        if not S_ID.fullmatch(s):
            errors.append(f'{w}：编号写 S1、S2……')
            continue
        if s in P['sents']:
            errors.append(f'{w}：编号重复了（S 全片连续编号）')
            continue
        level, rank = read_level(r['级'])
        if level is None:
            errors.append(f'{w}：级「{r["级"]}」要是 原句、必讲、可删①②……之一')
        for x in re.findall(r'[a-z]', r['点']):
            if x not in pts:
                notes.append(f'{w}：点 {x} 不在 {g} 的要讲的点里')
        r.update(seg=g, level=level, rank=rank, text=quoted(r['句']))
        P['sents'][s] = r

    for r in need_table(bl.get('看什么'), VIEW_HEAD, errors, f'{where}「看什么」') if '看什么' in bl else []:
        h = r['#']
        w = f'看什么 {h or "（没编号）"}'
        if not cp.VIEW_ID.fullmatch(h):
            errors.append(f'{w}：编号写 H1、H2……')
            continue
        if h in P['views']:
            errors.append(f'{w}：编号重复了（H 全片连续编号）')
            continue
        if r['来源'] not in cp.SOURCES:
            errors.append(f'{w}：来源「{r["来源"]}」不是 {"、".join(cp.SOURCES)} 之一')
        elif r['来源'] in P['cannot']:
            errors.append(f'{w}：来源是{r["来源"]}，制作条件写着不能用：回报一行「冲突」、归策划、回流')
        lead = r['主角'].strip()
        if lead not in LEADS and not re.match(r'其他[：:]', lead):
            errors.append(f'{w}：主角「{lead}」要是 {"、".join(LEADS)} 之一，或「其他：……」')
        if not r['最大的字'].strip():
            errors.append(f'{w}：最大的字没写（画面本身是重点的写「无」）')
        r['段'] = g
        r['refs'] = [x.strip() for x in re.split(r'[、，,]', r['用到']) if x.strip()]
        r['big'] = '' if r['最大的字'].strip() == '无' else quoted(r['最大的字'])
        r['with_raw'] = r['配哪句'].strip()
        r['with'] = expand(r['with_raw'], 'S')  # 一格可以配几句：S3、S4 或 S5–S7（策划 0.8.1）
        if r['with_raw'] not in ('', '无') and not r['with']:
            errors.append(f'{w}：配哪句「{r["with_raw"]}」读不出：写 S 编号（几句写 S3、S4 或 S5–S7），没有写「无」')
        r['screen'] = screen_items(r['上屏的字'])
        P['views'][h] = r

    for r in need_table(bl.get('信息'), DATA_HEAD, errors, f'{where}「信息」') if '信息' in bl else []:
        which, shared = cp.parse_which(r['讲哪一点'])
        d = read_dest(r['去向'])
        r.update(seg=g, which=which or [], shared=shared, dest=d)
        if not r['去向'].strip():
            errors.append(f'信息 {r["#"]}：去向没写（念 S3、上屏 H3、依据：S7、不讲：理由）')
        for x in d['odd']:
            notes.append(f'信息 {r["#"]}：去向里的「{x[:20]}」认不出（念、上屏、依据、不讲），不读')
        P['content'][r['#']] = r


def check_refs(P):
    """念什么的依据、看什么的用到和配哪句、信息的去向，编号都要存在"""
    errors = P['errors']
    for b, r in P['redlines'].items():
        for s in r.get('except_s', []):
            if s not in P['sents']:
                errors.append(f'红线 {b}：除外的 {s} 在念什么里找不到')
    for h, v in P['views'].items():
        for x in v['with']:
            s = P['sents'].get(x)
            if s is None:
                errors.append(f'看什么 {h}：配哪句的 {x} 在念什么里找不到（写 S 编号或「无」）')
            elif s['seg'] != v['段']:
                errors.append(f'看什么 {h}：配哪句 {x} 是 {s["seg"]} 的句子，这格在 {v["段"]}')
        for x in v['refs']:
            if not known(P, x):
                errors.append(f'看什么 {h}：用到的「{x}」在 content.md 里找不到（写 P1-1、P1 a、M1、K1、B1）')
    for k, r in P['content'].items():
        for s in r['dest']['say']:
            if s not in P['sents']:
                errors.append(f'信息 {k}：去向的 {s} 在念什么里找不到')
        for h in r['dest']['show']:
            if h not in P['views']:
                errors.append(f'信息 {k}：去向的 {h} 在看什么里找不到')


def known(P, x):
    if cp.DATA_ID.fullmatch(x):
        return x in P['content']
    if re.fullmatch(r'P\d+\s+[a-z]', x):
        g, pt = x.split()
        return g in P['frame'] and pt in P['frame'][g]['points']
    if cp.MAT_ID.fullmatch(x):
        return x in P['materials']
    if cp.RULE_ID.fullmatch(x):
        return x in P['rules']
    if B_ID.fullmatch(x):
        return x in P['redlines']
    if S_ID.fullmatch(x):
        return x in P['sents']
    if cp.VIEW_ID.fullmatch(x):
        return x in P['views']
    return False


def read_reports(P, lines):
    errors = P['errors']
    if lines is None:
        return
    rows = need_table(lines, REPORT_HEAD, errors, 'content.md「下游回报」')
    for i, r in enumerate(rows, 1):
        x = r['#']
        w = f'下游回报 {x or "（没编号）"}'
        if x != f'X{i}':
            errors.append(f'{w}：编号从 X1 起连着编，不重复，这一行该是 X{i}')
        if r['段'] not in P['frame'] and r['段'] != '全部':
            errors.append(f'{w}：段「{r["段"]}」要是段号或「全部」')
        if r['类型'] not in KINDS:
            errors.append(f'{w}：类型「{r["类型"]}」要是 {"、".join(KINDS)} 之一')
        if r['归谁'] not in OWNERS:
            errors.append(f'{w}：归谁「{r["归谁"]}」要是 策划、下游 之一')
        if r['状态'] not in STATES:
            errors.append(f'{w}：状态「{r["状态"]}」要是 {"、".join(STATES)} 之一')
        objs = [o.strip() for o in re.split(r'[、，,]', r['对象']) if o.strip()]
        if not objs:
            errors.append(f'{w}：对象没写（S3、H5、P2-2、B3）')
        for o in objs:
            if not known(P, o):
                errors.append(f'{w}：对象 {o} 在 content.md 里找不到')
        if r['类型'] == '偏离' and any(not cp.VIEW_ID.fullmatch(o) for o in objs):
            errors.append(f'{w}：「偏离」只用于画面做法和策划写的不一样，对象写 H 编号；时长超了不算偏离：先按「可删①→②」删，'
                          '删完还超的回报「压缩」或「删减」、归「策划」、回流（storyboard.md 第 4 节）')
        r['objs'] = objs
        P['reports'].append(r)
    if any(r['归谁'] == '策划' and r['状态'] == '待补' for r in P['reports']) and P['status'] != '回流中':
        errors.append('下游回报有归「策划」、状态「待补」的行，状态行要改成「回流中」（照 storyboard.md 第 6 节回流）')


def reported(P, obj, kinds):
    """下游回报里有没有对象是 obj、类型在 kinds 里的行，返回行号"""
    return [r['#'] for r in P['reports'] if obj in r.get('objs', []) and r['类型'] in kinds]


# ---------- 逐字稿 ↔ 念什么 ----------

def say_list(item):
    """say 的一项 → S 编号列表；null 是 []；写错返回 None"""
    if item is None:
        return []
    xs = [item] if isinstance(item, str) else item
    if isinstance(xs, list) and xs and all(isinstance(s, str) and S_ID.fullmatch(s) for s in xs):
        return xs
    return None


def say_claims(P, sc):
    """S → 认领它的 [(逐字稿段序号, 第几句, vo)]；另返回 errs 和念什么之外的句子 [(段号, 第几句, vo)]"""
    errs, claims, loose = [], {s: [] for s in P['sents']}, []
    for i, s in enumerate(sc.get('segments') or [], 1):
        g = s.get('seg')
        vo = s.get('vo') if isinstance(s.get('vo'), list) else []
        if 'say' not in s:
            if any(isinstance(v, str) and v.strip() for v in vo):
                errs.append(f'逐字稿第 {i} 段（{g}）：缺 say：和 vo 一样长，一项写这句念的是哪句 S（"S3"），'
                            '念两句写 ["S3", "S4"]，不是念什么里的写 null')
            continue
        say = s['say']
        if not isinstance(say, list) or len(say) != len(vo):
            errs.append(f'逐字稿第 {i} 段（{g}）：say 要是和 vo 一样长的数组（vo {len(vo)} 句，say '
                        f'{len(say) if isinstance(say, list) else "不是数组"}）')
            continue
        for k, (v, item) in enumerate(zip(vo, say), 1):
            ids = say_list(item)
            if ids is None:
                errs.append(f'逐字稿 {g} 第 {k} 句：say 写 "S3"、["S3", "S4"] 或 null，现在是 {item!r}')
                continue
            if not ids:
                loose.append((g, k, v))
            for x in ids:
                r = P['sents'].get(x)
                if r is None:
                    errs.append(f'逐字稿 {g} 第 {k} 句：say {x} 在念什么里找不到')
                elif r['seg'] != g:
                    errs.append(f'逐字稿 {g} 第 {k} 句：say {x} 是 {r["seg"]} 的句子，要在同一段念')
                else:
                    claims[x].append((i, k, v))
    return errs, claims, loose


def shown(sc, text):
    """vo 照 show 换成字幕写法"""
    show = sc.get('show') if isinstance(sc.get('show'), dict) else {}
    for k in sorted((k for k in show if isinstance(k, str) and isinstance(show[k], str)), key=len, reverse=True):
        text = text.replace(k, show[k])
    return text


def compare(sc, text, vos):
    """句和认领它的 vo：照念、数字写法不同、字改了"""
    a, b = cp.norm(text), cp.norm(shown(sc, ''.join(vos)))
    if a and a in b:
        return '照念'
    if cp.NUM.sub('', a) and cp.NUM.sub('', a) in cp.NUM.sub('', b):
        return '数字写法不同'
    return '字改了'


def coverage(P, sc):
    """每句 S：(S, 行, 认领的 vo, 结果, 回报行号)。结果：照念、压缩、数字写法不同、字改了、删了、没有"""
    _, claims, _ = say_claims(P, sc)
    out = []
    for s, r in P['sents'].items():
        got = claims.get(s, [])
        vos = [v for _, _, v in got if isinstance(v, str)]
        if not got:
            res = '删了' if r['level'] == CUT else '没有'
            rep = reported(P, s, ('删减',) if r['level'] == CUT else KINDS)
        else:
            res = compare(sc, r['text'], vos)
            if r['level'] != ORIG and res == '字改了':
                res = '压缩'
            rep = reported(P, s, ('压缩', '冲突'))
        out.append((s, r, vos, res, rep))
    return out


def check_say(P, sc):
    """原句、必讲都有 vo 认领且在同一段；原句逐字照念；可删没人认领的有「删减」回报；删的顺序照圈号"""
    errs, notes = [], []
    if P.get('silent'):
        return errs, notes
    e, _, loose = say_claims(P, sc)
    errs += e
    if loose:
        notes.append('这几句 vo 不是念什么里的（say 写了 null），--table 标出来给用户看：' +
                     '、'.join(f'{g} 第 {k} 句' for g, k, _ in loose[:8]) + ('……' if len(loose) > 8 else ''))
    cut = {}
    for s, r, vos, res, rep in coverage(P, sc):
        lv = r['level']
        if res == '没有':
            errs.append(f'念什么 {s}（{r["seg"]}，{lv}）没有 vo 认领：{lv}不能删' +
                        ('，字不改' if lv == ORIG else '，措辞可以压') + '；要删先回流（下游回报加一行、归策划）')
        elif res == '删了':
            cut.setdefault(r['seg'], []).append((r['rank'], s, True))
            if not rep:
                errs.append(f'念什么 {s}（{r["seg"]}，可删{CIRCLED[r["rank"] - 1]}）删了，下游回报里没有它的「删减」行'
                            '（归下游、状态「已知悉」）')
        else:
            if lv == CUT:
                cut.setdefault(r['seg'], []).append((r['rank'], s, False))
            if lv == ORIG and res == '字改了':
                errs.append(f'念什么 {s} 是原句，逐字稿没照着念：「{r["text"][:30]}」只许改念法、断句，字不改'
                            '（字幕写法和念法不同的写进 show；撞了红线回报「冲突」、回流）')
            elif res == '数字写法不同':
                errs.append(f'念什么 {s} 的字幕对不上原文：vo 按 show 换回字幕写法是「{shown(sc, "".join(vos))[:30]}」，'
                            f'原文「{r["text"][:30]}」，只差数字写法：把念法和字幕写法写进 show（{{"第三年": "第 3 年"}}），'
                            '字幕要和原文一样')
            elif lv == MUST and res == '压缩' and not rep:
                notes.append(f'念什么 {s}（必讲）和 vo 不一样，压了措辞的话下游回报加一行「压缩」（归下游、已知悉）')
    show = sc.get('show') if isinstance(sc.get('show'), dict) else {}
    said = ''.join(v for s in sc.get('segments') or [] for v in (s.get('vo') if isinstance(s.get('vo'), list) else [])
                   if isinstance(v, str))
    for k in show:
        if isinstance(k, str) and k and k not in said:
            errs.append(f'show 的键「{k}」在哪句 vo 里都没有：键是 vo 里的念法（「一点四倍」），vo 要写成念法，'
                        f'字幕才换回「{show[k]}」')
    for g, xs in cut.items():
        gone = [rank for rank, _, d in xs if d]
        kept = [(rank, s) for rank, s, d in xs if not d]
        early = [s for rank, s in kept if gone and rank < max(gone)]
        if early:
            notes.append(f'{g} 删了可删{CIRCLED[max(gone) - 1]}，却留着 {"、".join(early)}（圈号更小）：按圈号从小到大删')
    return errs, notes


def chars(text):
    return len(cp.norm(text))


# ---------- 红线、信息、版式 ----------

def strings(x):
    """o 里所有的字符串和数字，按顺序"""
    if isinstance(x, bool) or x is None:
        return []
    if isinstance(x, (str, int, float)):
        return [str(x)]
    if isinstance(x, list):
        return [s for y in x for s in strings(y)]
    if isinstance(x, dict):
        return [s for y in x.values() for s in strings(y)]
    return []


def pick(o, key):
    """o 里按「a.value」「items.label」取值（经过数组时取每一项）"""
    cur = [o]
    for k in key.split('.'):
        nxt = []
        for c in cur:
            if isinstance(c, list):
                nxt += [y.get(k) for y in c if isinstance(y, dict)]
            elif isinstance(c, dict):
                nxt.append(c.get(k))
        cur = nxt
    return [s for c in cur for s in strings(c)]


def check_redlines(P, sb, sc):
    """红线「词：」的词不出现在 vo 和分镜的 o 里；原句撞上了、回报有「冲突」行的只提醒。
    「；除外：」写到的 S 和题目不查；例外读不出的照查，撞上了只提醒、交人工看，不判回流"""
    errs, notes = [], []
    words = [(b, w) for b, r in P['redlines'].items() for w in r['words']]
    titles = title_texts(P.get('title') or '')
    if not words:
        return errs, notes
    texts = []
    if sc is not None:
        for s in sc.get('segments') or []:
            say = s.get('say') if isinstance(s.get('say'), list) else []
            for k, v in enumerate(s.get('vo') if isinstance(s.get('vo'), list) else [], 1):
                ids = say_list(say[k - 1]) if k <= len(say) else []
                texts.append((f'逐字稿 {s.get("seg")} 第 {k} 句', v if isinstance(v, str) else '', ids or []))
    for i, w, _, x in cp.claimers(sb or {}):
        if isinstance(x.get('o'), dict):
            texts.append((f'{w} 的 o', ' '.join(strings(x['o'])), []))
    for where, text, ids in texts:
        for b, word in words:
            rl = P['redlines'][b]
            if any(s in rl['except_s'] for s in ids):
                continue
            if rl['except_title']:
                for x in titles:
                    text = text.replace(x, '')
            if word in text and rl['odd']:
                notes.append(f'{where}：出现红线 {b} 的词「{word}」；这条的例外读不出（「{"；".join(rl["odd"])[:30]}」，'
                             '能读的写法是「；除外：S1、题目」），按没有例外查，交人工看是不是例外，不直接回流')
                continue
            if word in text:
                conflict = [x for s in ids for x in reported(P, s, ('冲突',))] + reported(P, b, ('冲突',))
                origs = [s for s in ids if P['sents'].get(s, {}).get('level') == ORIG]
                if origs and conflict:
                    notes.append(f'{where}：原句 {"、".join(origs)} 撞红线 {b}「{word}」，下游回报 {conflict[0]} 记了冲突：'
                                 '等策划改内容，不照念')
                else:
                    errs.append(f'{where}：出现红线 {b} 的词「{word}」（{P["redlines"][b]["不许"][:24]}）；'
                                '是原句的，回报一行「冲突」、归策划、回流，不自己改写')
    return errs, notes


def check_info(P, sb, sc, view_claims):
    """facts 的 ref 不指「不讲」的信息；去向是念、上屏的信息至少有一处真的用到（删了、偏离的要有回报）"""
    errs, notes = [], []
    if sc is not None:
        for i, s in enumerate(sc.get('segments') or [], 1):
            for f in s.get('facts') or []:
                r = P['content'].get(f.get('ref')) if isinstance(f.get('ref'), str) else None
                if r and r['dest']['skip'] and not (r['dest']['say'] or r['dest']['show']):
                    errs.append(f'逐字稿第 {i} 段「{str(f.get("what", ""))[:24]}」：{f["ref"]} 的去向是「不讲」，不进成片')
    if sc is None and sb is None:
        return errs, notes
    _, claims, _ = say_claims(P, sc) if sc is not None else ([], {}, [])
    for k, r in P['content'].items():
        d = r['dest']
        if not (d['say'] or d['show']):
            continue
        said = any(claims.get(s) for s in d['say']) if sc is not None else True
        seen = any(view_claims.get(h) for h in d['show']) if sb is not None else True
        if said or seen:
            continue
        ok = all(reported(P, s, ('删减', '冲突')) for s in d['say']) and \
            all(reported(P, h, ('偏离', '缺素材', '冲突')) for h in d['show'])
        if not ok:
            errs.append(f'信息 {k}（{r["seg"]}）去向是「{r["去向"]}」，成片里一处都没用到：念的句子都没有 vo 认领、'
                        '上屏的格都没有分镜认领')
    return errs, notes


def screen_strings(x):
    """一个分镜实际上屏的字：o 和 over 里的参数"""
    out = strings(x.get('o')) if isinstance(x.get('o'), dict) else []
    for y in x.get('over') if isinstance(x.get('over'), list) else [x.get('over')]:
        if isinstance(y, dict):
            out += strings({k: v for k, v in y.items() if k != 'part'})
    return out


def check_onscreen(P, claims):
    """看什么「上屏的字」的每一条都要在认领它的分镜上屏（o、over）；对不上的列出来：补上，或下游回报「偏离」"""
    errs, notes = [], []
    for h, v in P['views'].items():
        if not v['screen']:
            continue
        shots = [(n, x) for n, is_shot, x in claims.get(h, []) if is_shot]
        if not shots:
            if claims.get(h):
                notes.append(f'{h} 只有段的 uses 认领，「上屏的字」没法逐项核：拆成分镜写 o，或自己核')
            continue
        have = cp.norm(''.join(s for _, x in shots for s in screen_strings(x)))
        miss = [s for s in v['screen'] if cp.norm(s) not in have]
        if miss and not reported(P, h, ('偏离', '冲突')):
            errs.append(f'{h}「上屏的字」的{"".join(f"「{s}」" for s in miss)}在认领它的{"、".join(n for n, _ in shots)}'
                        ' 里没上屏（o、over 里找不到）：补进部件，或下游回报加一行「偏离」（归下游、已知悉）')
    return errs, notes


NUMS = re.compile(r'\d+(?:\.\d+)?')


def numbers(x):
    """o 里的数值（不算字符串里的数）"""
    if isinstance(x, bool) or x is None:
        return []
    if isinstance(x, (int, float)):
        return [float(x)]
    if isinstance(x, list):
        return [n for y in x for n in numbers(y)]
    if isinstance(x, dict):
        return [n for y in x.values() for n in numbers(y)]
    return []


def check_values(P, claims):
    """上屏不写数（最大的字、上屏的字里没有数字）的格：部件的数值要取它用到的信息里的数（50% 也认 0.5、剩下的 0.5）。只提醒"""
    notes = []
    for h, v in P['views'].items():
        if re.search(r'\d', v['上屏的字'] + v['big']):
            continue
        ids = [x for x in v['refs'] if x in P['content']] + [k for k, r in P['content'].items() if h in r['dest']['show']]
        ids = list(dict.fromkeys(ids))
        base = [float(n) for k in ids for n in NUMS.findall(P['content'][k]['内容'])]
        if not base:
            continue
        ok = set()
        for n in base:
            ok |= {n, n / 100, 1 - n / 100}
        for name, is_shot, x in claims.get(h, []):
            vals = numbers(x.get('o')) if is_shot else []
            off = [n for n in dict.fromkeys(vals) if not any(abs(n - a) < 1e-6 for a in ok)]
            if off:
                notes.append(f'{name} 的 o 里 {"、".join(f"{n:g}" for n in off)} 在 {h} 用到的信息里找不到'
                             f'（{"、".join(ids)}：{P["content"][ids[0]]["内容"][:30]}）：上屏不写数时，部件的数值也取信息里的，'
                             '形状才和原文一致')
    return notes


def pack_of(x, sb):
    """分镜用哪个风格包：ref 写 "pack:名字" 的；没写 ref、class，又写了 part 的，算 unify.pack；别的不算"""
    r = x.get('ref')
    if isinstance(r, str) and r.startswith('pack:'):
        return r[5:]
    if r or x.get('class') or not x.get('part'):
        return None
    u = sb.get('unify') if isinstance(sb.get('unify'), dict) else {}
    p = u.get('pack')
    return p[5:] if isinstance(p, str) and p.startswith('pack:') else p


def lookups(pack_roots=()):
    """风格包名 → lookup.json 的内容（Skill 自带的 packs/ 和 --pack-root）"""
    out = {}
    for root in [cs.SKILL / 'packs'] + [Path(p) for p in pack_roots]:
        for f in sorted(Path(root).glob(f'*/{LOOKUP}')) if Path(root).is_dir() else []:
            try:
                out[f.parent.name] = json.loads(f.read_text(encoding='utf-8'))
            except (OSError, json.JSONDecodeError):
                out[f.parent.name] = None
    return out


def as_list(v):
    return [v] if isinstance(v, str) else [x for x in v if isinstance(x, str)] if isinstance(v, list) else []


def over_names(v):
    """over：部件名、{part: …}，或它们的数组 → 部件名列表"""
    xs = v if isinstance(v, list) else [v] if v else []
    return [x if isinstance(x, str) else x.get('part', '?') for x in xs if isinstance(x, (str, dict))]


def check_layout(P, sb, claims, looks):
    """认领 H 的分镜：part 是查表给这个主角的（用了 instead 或别的要有「偏离」回报）；H 的最大的字在顶档的 o 键里"""
    errs, notes = [], []
    missing = set()
    for h, v in P['views'].items():
        for name, is_shot, x in claims.get(h, []):
            if not is_shot:
                continue
            pack = pack_of(x, sb)
            if not pack:
                continue
            lk = looks.get(pack)
            if not isinstance(lk, dict):
                missing.add(pack)
                continue
            part = x.get('part')
            if not isinstance(part, str) or not part:
                errs.append(f'{name}：认领 {h}，用风格包 {pack}：写 part（用哪个部件，照 {pack}/{LOOKUP} 的 lead 查「{v["主角"]}」）')
                continue
            lead = v['主角'].strip()
            row = (lk.get('lead') or {}).get(lead) or {}
            want, inst = as_list(row.get('part')), as_list(row.get('instead'))
            dev = reported(P, h, ('偏离',))
            if lead in LEADS and part not in want:
                if not dev:
                    how = f'查表给的是 {"、".join(want)}' if want else f'包里没有，代替的是 {"、".join(inst) or "（没写）"}'
                    errs.append(f'{name}：{h} 的主角是「{lead}」，{how}，这里用 {part}：'
                                f'{"用了代替" if part in inst else "换了做法"}就是偏离，下游回报加一行「偏离」（归下游、已知悉）')
            sizes = (lk.get('sizes') or {}).get(part)
            if not isinstance(sizes, dict):
                errs.append(f'{name}：{pack}/{LOOKUP} 的 sizes 里没有部件 {part}')
                continue
            if v['big']:
                o = x.get('o') if isinstance(x.get('o'), dict) else {}
                top = as_list(sizes.get('top'))
                vals = [s for k in top for s in pick(o, k)]
                if cp.norm(v['big']) not in cp.norm(''.join(vals)):
                    errs.append(f'{name}：{h} 的最大的字「{v["big"]}」要放在 {part} 的顶档（o 的 {"、".join(top) or "（这个部件没有顶档的字）"}）'
                                + (f'，现在顶档是「{"".join(vals)[:20]}」' if vals else ''))
    for p in sorted(missing):
        notes.append(f'风格包 {p} 没有 {LOOKUP}：主角、字号不查表，版式自己定，写进分镜的 note')
    return errs, notes


# ---------- 时间 ----------

def vo_spans(tseg):
    """timing.json 一段的 vo → [(开始, 结束)]，按句的顺序"""
    return [(x.get('at', 0), x.get('at', 0) + x.get('t', 0)) for x in tseg.get('vo') or [] if isinstance(x, dict)]


def check_timing(P, sb, sc, timing, claims, looks):
    """配音后：配哪句的 S 和认领 H 的分镜在时间上重叠；每格秒数在查表 motion 的张力区间里（提醒）；报实测语速（提醒）。
    超时（全片超出总则区间上限的 115%，或一段超出段篇幅的 115%）照 handoff.md 第 5 节：还留着可删的，先按圈号从小到大删（错）；
    可删删完还超的，要有归「策划」的「压缩」或「删减」回报、回流（错）。「偏离」不算"""
    errs, notes = [], []
    if not isinstance(timing, dict):
        return errs, notes
    tsegs = {t.get('seg'): t for t in timing.get('segments') or [] if isinstance(t, dict)}
    segs = sb.get('segments') or []
    scs = sc.get('segments') or [] if sc is not None else []
    total, durs, spoken_chars, when_all = 0, {}, 0, {}
    for i, s in enumerate(segs, 1):
        g = s.get('seg')
        t = tsegs.get(g)
        if not t:
            continue
        dur = t.get('dur') or 0
        total += dur
        durs[g] = dur
        say = scs[i - 1].get('say') if i <= len(scs) and isinstance(scs[i - 1].get('say'), list) else []
        vo = scs[i - 1].get('vo') if i <= len(scs) and isinstance(scs[i - 1].get('vo'), list) else []
        spoken = [k for k, v in enumerate(vo) if isinstance(v, str) and v.strip()]
        spoken_chars += sum(chars(vo[k]) for k in spoken)
        spans = vo_spans(t)
        when = {}  # S → [(开始, 结束)]
        for n, k in enumerate(spoken):
            if n < len(spans) and k < len(say):
                for x in say_list(say[k]) or []:
                    when.setdefault(x, []).append(spans[n])
        when_all.update(when)
        tshots = t.get('shots') or []
        shots = s.get('shots') if isinstance(s.get('shots'), list) else []
        for j, x in enumerate(shots):
            if j >= len(tshots):
                break
            t0, t1 = tshots[j].get('t0', 0), tshots[j].get('t1', 0)
            for h in cp.view_list(x.get('view')) or []:
                v = P['views'].get(h)
                ws_ = [x2 for x2 in (v['with'] if v else []) if x2 in P['sents']]
                if not ws_:
                    continue
                ws = [w for x2 in ws_ for w in when.get(x2, [])]
                if not ws:
                    notes.append(f'分镜 {cs.shot_name(i, j + 1)}：{h} 配 {v["with_raw"]}，这几句都没有配音（删了的话 {h} 换一句配）')
                elif not any(a < t1 and b > t0 for a, b in ws):
                    errs.append(f'分镜 {cs.shot_name(i, j + 1)}（{t0:.1f}–{t1:.1f} 秒）认领 {h}，配的 {v["with_raw"]} 在 '
                                f'{ws[0][0]:.1f}–{ws[0][1]:.1f} 秒念，时间上不重叠：调分镜的 vo 或 sec')
            lk = looks.get(pack_of(x, sb) or '')
            band = ((lk or {}).get('motion') or {}).get('tension', {}).get(str(P.get('tension'))) if isinstance(lk, dict) else None
            if isinstance(band, dict) and t1 > t0:
                f = ((lk.get('motion') or {}).get('pace') or {}).get(P['frame'].get(g, {}).get('pace') or '中', 1)
                lo, hi = band.get('min', 0) * f, band.get('max', 1e9) * f
                if not lo - 0.05 <= t1 - t0 <= hi + 0.05:
                    notes.append(f'分镜 {cs.shot_name(i, j + 1)} {t1 - t0:.1f} 秒，查表（张力 {P["tension"]}、节奏 '
                                 f'{P["frame"].get(g, {}).get("pace") or "中"}）是 {lo:.1f}–{hi:.1f} 秒')
    claimed = say_claims(P, sc)[1] if sc is not None else {}
    for g, dur in durs.items():
        want = P['frame'].get(g, {}).get('sec')
        if not (want and dur):
            continue
        if dur > want * (1 + SLACK) + 0.05:
            over_steps(P, [g], f'{g} 配音后 {dur:.1f} 秒，篇幅 {want:g} 秒，超了 {(dur - want) / want:.0%}（段篇幅的 115% 是 '
                       f'{want * (1 + SLACK):.1f} 秒）', claimed, when_all, errs)
        elif dur < want * (1 - SLACK):
            notes.append(f'{g} 配音后 {dur:.1f} 秒，篇幅 {want:g} 秒，短了 {(want - dur) / want:.0%}（超过 15%）：回报给用户')
    lo, hi = P.get('range') or ((P['sec'], P['sec']) if P.get('sec') else (None, None))
    if total and lo:
        if total > hi * (1 + SLACK) + 0.05:
            over_steps(P, list(durs), f'配音后全片 {total:.1f} 秒，总则的篇幅是「{P["expr"].get("篇幅", "")}」，超出区间上限的 15%'
                       f'（{hi * (1 + SLACK):.1f} 秒）了', claimed, when_all, errs)
        elif total < lo * (1 - SLACK) - 0.05:
            errs.append(f'配音后全片 {total:.1f} 秒，总则的篇幅是「{P["expr"].get("篇幅", "")}」，比区间下限短了 15% 以上：回报给用户')
    if total and spoken_chars and P.get('cps'):
        rate = spoken_chars / total
        u = sb.get('unify') if isinstance(sb.get('unify'), dict) else {}
        sp = (u.get('voice') or {}).get('speed') if isinstance(u.get('voice'), dict) else None
        msg = (f'实测语速：每秒 {rate:.1f} 字（按念法数，含停顿；全片 {spoken_chars} 字 ÷ {total:.1f} 秒），语速档「{P["speed"]}」'
               f'是每秒 {P["cps"]:g} 字：这一句写进下游回报的说明或交付说明')
        if abs(rate - P['cps']) > P['cps'] * 0.1 and isinstance(sp, (int, float)) and not isinstance(sp, bool):
            want = sp * P['cps'] / rate
            msg += (f'；差了 {abs(rate - P["cps"]) / P["cps"]:.0%}，' +
                    (f'unify.voice.speed 可以从 {sp:g} 按比例调到约 {want:.2f}（本地合成音比真实配音约慢 13%，见 sound.md）'
                     if 0.5 <= want <= 2 else '倍速调不回来，先查逐字稿 pace 的停顿和段长'))
        notes.append(msg)
    return errs, notes


def over_steps(P, scope, what, claimed, when, errs):
    """超时的必经一步（handoff.md 第 5 节）：scope 这几段里还念着的可删，按圈号从小到大列出来要删；
    都删完了，要有归「策划」的「压缩」或「删减」回报（段是 scope 里的或「全部」）"""
    kept = sorted((r['rank'], int(s[1:]), s) for s, r in P['sents'].items()
                  if r['seg'] in scope and r['level'] == CUT and claimed.get(s))
    if kept:
        items = []
        for rank, _, s in kept:
            sec = sum(b - a for a, b in when.get(s, []))
            items.append(f'可删{CIRCLED[rank - 1]} {s}' + (f'（约 {sec:.1f} 秒）' if sec else ''))
        errs.append(f'{what}：先按圈号从小到大删可删：{"、".join(items)}；删一句在下游回报加一行「删减」（归下游、已知悉），'
                    '重配后再查。不能只在下游回报写一行「偏离」')
        return
    if any(r['类型'] in ('压缩', '删减') and r['归谁'] == '策划' and (r['段'] in scope or r['段'] == '全部')
           for r in P['reports']):
        return
    errs.append(f'{what}：可删已经删完，还超：下游回报加一行，类型写「压缩」或「删减」、归「策划」、状态「待补」，'
                '对象写要压的必讲（或要删的原句），说明写超了多少；状态行改成「回流中」，请用户转给策划。'
                '「偏离」只用于画面做法和策划写的不一样')


def check(P, sb, sc, lib, timing=None, pack_roots=()):
    """格式 5 另查的（check_plan.py 在格式 4 那套之后调）"""
    errs, notes = [], []
    looks = lookups(pack_roots)
    claims = cp.view_claims(P, sb)[1] if sb is not None else {}
    if sc is not None:
        e, n = check_say(P, sc)
        errs += e
        notes += n
    for e, n in (check_redlines(P, sb, sc), check_info(P, sb, sc, claims)):
        errs += e
        notes += n
    if sb is not None:
        e, n = check_layout(P, sb, claims, looks)
        errs += e
        notes += n
        e, n = check_onscreen(P, claims)
        errs += e
        notes += n
        notes += check_values(P, claims)
        e, n = check_timing(P, sb, sc, timing, claims, looks)
        errs += e
        notes += n
    for b, r in P['redlines'].items():
        if r.get('odd'):
            notes.append(f'红线 {b} 的例外读不出（「{"；".join(r["odd"])[:30]}」）：按没有例外查，撞上的交人工看；'
                         '能读的写法是「词：「收益」；除外：S1、题目」（策划 0.8.1）')
        if r.get('kind') in ('条件', '人工'):
            notes.append(f'红线 {b}（{r["kind"]}）机器查不了，--table 列出来给用户确认：{r["不许"][:30]}')
    return errs, notes


# ---------- 第 4 步给用户看的 ----------

def tables(P, sb, sc, timing=None, pack_roots=()):
    """覆盖表（S、H）、每段字数、红线的条件和人工、下游回报，Markdown"""
    out = []
    claims = cp.view_claims(P, sb)[1] if sb is not None else {}
    if sc is not None and P['sents']:
        out += ['念什么和逐字稿（原句、必讲都要落在 vo 里；删的只能是可删，删了、压了都记进下游回报）：', '',
                '| S | 段 | 级 | 句 | 逐字稿 | 结果 | 回报 |', '|---|---|---|---|---|---|---|']
        for s, r, vos, res, rep in coverage(P, sc):
            lv = r['level'] + (CIRCLED[r['rank'] - 1] if r['rank'] else '') if r['level'] else r['级']
            bad = res in ('没有', '字改了') or (res == '删了' and not rep)
            out.append(f'| {s} | {r["seg"]} | {lv} | {cs.cell(r["text"])} | {cs.cell("".join(vos)) or "—"} | '
                       f'{"**" + res + "**" if bad else res} | {"、".join(rep) or "—"} |')
        _, _, loose = say_claims(P, sc)
        if loose:
            out += ['', '念什么之外的 vo（say 写了 null）：'] + [f'- {g} 第 {k} 句：{v}' for g, k, v in loose]
    if sb is not None and P['views']:
        looks = lookups(pack_roots)
        out += ['', '看什么和分镜（每格都要有分镜认领；主角按风格包的 lookup.json 落到部件，最大的字放顶档）：', '',
                '| H | 段 | 主角 | 最大的字 | 配哪句 | 认领 | 版式 | 回报 |', '|---|---|---|---|---|---|---|---|']
        for h, v in P['views'].items():
            got = claims.get(h, [])
            who = '、'.join(n for n, _, _ in got) or '✗ 没有'
            lay = '；'.join(layout_cell(x, sb, looks) for _, is_shot, x in got if is_shot) or '—'
            rep = reported(P, h, KINDS)
            out.append(f'| {h} | {v["段"]} | {cs.cell(v["主角"])} | {cs.cell(v["最大的字"])} | {v["with_raw"] or "—"} | {who} | '
                       f'{cs.cell(lay)} | {"、".join(rep) or "—"} |')
    if sc is not None and P.get('cps'):
        tsegs = {t.get('seg'): t for t in (timing or {}).get('segments') or [] if isinstance(t, dict)} \
            if isinstance(timing, dict) else {}
        out += ['', f'每段字数（语速「{P["speed"]}」按每秒 {P["cps"]:g} 字估，标点不算；项目的配音档不同时照 sound.md 换算，'
                '以配音后实测为准）：', '', '| 段 | 情绪 · 节奏 | 篇幅 | 上限 | 原句 + 必讲 | 逐字稿 | 配音后 |',
                '|---|---|---|---|---|---|---|']
        for s in sc.get('segments') or []:
            g = s.get('seg')
            fr = P['frame'].get(g)
            if not fr:
                continue
            cap = (fr['sec'] or 0) * P['cps']
            keep = sum(chars(r['text']) for r in P['sents'].values() if r['seg'] == g and r['level'] in (ORIG, MUST))
            got = sum(chars(v) for v in s.get('vo') or [] if isinstance(v, str))
            t = tsegs.get(g)
            after = f'{t["dur"]:.1f} 秒' if t and t.get('dur') else '—'
            over = '**' if cap and got > cap * (1 + SLACK) else ''
            out.append(f'| {g} | {fr["情绪"] or "—"} · {fr["节奏"] or "—"} | {fr["篇幅"]} | {cap:.0f} | {keep} | '
                       f'{over}{got}{over} | {after} |')
    man = [(b, r) for b, r in P['redlines'].items() if r.get('kind') in ('条件', '人工')]
    if man:
        out += ['', '红线里机器查不了的（逐条和用户确认过）：'] + [f'- {b}：{r["不许"]}（{r["怎么查"]}）' for b, r in man]
    if P['reports']:
        out += ['', '下游回报（content.md 末尾，已有的行）：', '', '| # | 段 | 类型 | 对象 | 说明 | 归谁 | 状态 |',
                '|---|---|---|---|---|---|---|']
        for r in P['reports']:
            out.append(f'| {r["#"]} | {r["段"]} | {r["类型"]} | {r["对象"]} | {cs.cell(r["说明"])} | {r["归谁"]} | {r["状态"]} |')
    return '\n'.join(out)


def layout_cell(x, sb, looks):
    """分镜的版式：部件（顶档放什么）+ 叠加"""
    part = x.get('part')
    if not pack_of(x, sb):
        return part or '—'
    if not part:
        return '（没写 part）'
    o = x.get('o') if isinstance(x.get('o'), dict) else {}
    lk = looks.get(pack_of(x, sb) or '') or {}
    top = as_list(((lk.get('sizes') or {}).get(part) or {}).get('top')) if isinstance(lk, dict) else []
    vals = ''.join(s for k in top for s in pick(o, k))
    over = '、'.join(over_names(x.get('over')))
    return f'{part}' + (f'（顶档「{vals[:16]}」）' if vals else '') + (f' + {over}' if over else '')
