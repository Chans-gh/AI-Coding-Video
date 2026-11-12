#!/usr/bin/env python3
"""完整出片的通用检查：分镜脚本 storyboard.json 和逐字稿 script.json。只用标准库。

    python3 <本 Skill 目录>/scripts/check_storyboard.py videos/<短名>/storyboard.json
    python3 <本 Skill 目录>/scripts/check_storyboard.py videos/<短名>/storyboard.json \\
        --script videos/<短名>/script.json [--ready] [--table]

不写 --script 时用分镜脚本同目录的 script.json（有的话）。--ready：给用户确认之后、做典型样片之前再跑，
另查 status 是「用户确认」、事实里没有「待用户确认」。--table：打印段落表、分镜表和全片统一，给用户看。
词：段是 segments 的一项（10–60 秒）；分镜（镜头）是段里的一个画面，每段 shots 的一项。
退出码：0 没有问题（可能有提醒）；1 有问题要改；2 读不了（文件不在、不是 JSON）。
接了策划的（分镜脚本里有 "plan"）另跑 check_plan.py，它会调本脚本查通用的部分。格式和规矩见本 Skill 的 film.md。
"""
import argparse
import json
import re
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
CLASSES = ('C', 'T', 'G')
STATUS = ('草稿', '用户确认')
CONFIRM = ('待用户确认', '用户确认')
PENDING = '待用户确认'
BRIEF = ('for', 'gain', 'line', 'sec', 'lang', 'voice', 'must', 'avoid')
BRIEF_EFFECT = {'from': '起点', 'block': '主要阻力', 'to': '终点'}  # 可选，照策划「效果」的起点、阻力、终点
UNIFY = ('palette', 'fonts', 'subs', 'trans', 'music', 'voice')
SEG_ID = re.compile(r'P\d+')
TOLERANCE = 0.15  # 秒数和目标差多少算偏离
CUTS = ('硬切', '溶解')  # 分镜的 cut：从上一个分镜怎么接过来
SHOT_KEYS = ('sec', 'what', 'ref', 'class', 'src', 'vo', 'cut', 'rule')  # rule：照策划 content.md 的哪几条约束，check_plan.py 查
SHOT_MIN = 0.5    # 一个分镜至少几秒
SEC_EPS = 0.05    # 分镜秒数之和和段的 sec 差这么多以内算相等


class Unreadable(Exception):
    """文件不在或不是 JSON"""


def load(path):
    p = Path(path)
    if not p.is_file():
        raise Unreadable(f'找不到 {p}')
    try:
        return json.loads(p.read_text(encoding='utf-8'))
    except json.JSONDecodeError as x:
        raise Unreadable(f'{p} 不是合法的 JSON：{x}')


def library():
    """库里能引用的：风格编号 → 条目（data/styles.json），风格包名（packs/ 下有 meta.json 的目录），素材类型"""
    styles = {s['id']: s for s in json.loads((SKILL / 'data' / 'styles.json').read_text(encoding='utf-8'))['styles']}
    packs = {p.parent.name for p in (SKILL / 'packs').glob('*/meta.json')}
    tags = json.loads((SKILL / 'data' / 'tags.json').read_text(encoding='utf-8'))
    materials = {c: {m['name'] for m in ms} for c, ms in tags['materials'].items()}
    return styles, packs, materials


def check_head(sb, lib):
    """顶层：plan 和 brief 只有一个、brief 齐、ar、status、unify 齐"""
    errs, notes = [], []
    styles, packs, _ = lib
    has_plan, has_brief = 'plan' in sb, 'brief' in sb
    if has_plan and has_brief:
        errs.append('"plan" 和 "brief" 只写一个：有策划写 plan（指向 plan.md），无策划写 brief')
    elif not has_plan and not has_brief:
        errs.append('缺 "plan" 或 "brief"：有策划写 plan（指向 plan.md），无策划写 brief')
    if has_brief:
        b = sb['brief']
        if not isinstance(b, dict):
            errs.append('"brief" 要是对象')
        else:
            miss = [k for k in BRIEF if k not in b]
            if miss:
                errs.append(f'brief 缺 {"、".join(miss)}')
            if 'sec' in b and not (isinstance(b['sec'], (int, float)) and not isinstance(b['sec'], bool) and b['sec'] > 0):
                errs.append(f'brief.sec 要是正的秒数，现在是 {b["sec"]!r}')
            if 'voice' in b and not isinstance(b['voice'], bool):
                errs.append(f'brief.voice 写 true 或 false，现在是 {b["voice"]!r}')
            for k in ('must', 'avoid'):
                if k in b and not isinstance(b[k], list):
                    errs.append(f'brief.{k} 要是数组（可空）')
            for k, name in BRIEF_EFFECT.items():
                if k in b and not (isinstance(b[k], str) and b[k].strip()):
                    errs.append(f'brief.{k}（{name}）要写一句话；不想写就整个去掉，现在是 {b[k]!r}')
    if 'style' in sb:
        errs.append('顶层 "style" 已去掉：每段的样式写在 uses，全片共用的写在 unify')
    ar = sb.get('ar')
    if ar not in ('16:9', '9:16'):
        errs.append(f'"ar" 写 "16:9" 或 "9:16"，现在是 {ar!r}')
    if sb.get('status') not in STATUS:
        errs.append(f'"status" 写「草稿」或「用户确认」，现在是 {sb.get("status")!r}')

    u = sb.get('unify')
    if not isinstance(u, dict):
        errs.append('缺 "unify"（全片统一：pack 或 palette、fonts、subs、trans、music、voice）')
        return errs, notes
    pack = u.get('pack')
    if pack is not None:
        name = pack[5:] if isinstance(pack, str) and pack.startswith('pack:') else pack
        if name not in packs:
            errs.append(f'unify.pack {pack!r} 不在 packs/ 里（现有 {"、".join(sorted(packs))}）')
    else:
        miss = [k for k in UNIFY if k not in u]
        miss += [k for k in UNIFY if k in u and k != 'voice' and not u[k]]
        if miss:
            errs.append(f'unify 缺 {"、".join(miss)}（用了风格包的写 pack，其余可以不写）')
    voice = sb.get('brief', {}).get('voice') if isinstance(sb.get('brief'), dict) else None
    if voice is True and pack is None and 'voice' in u and not u['voice']:
        errs.append('brief.voice 是 true，unify.voice 要写旁白音色')
    if voice is False and u.get('voice'):
        notes.append('brief.voice 是 false（无旁白），unify.voice 写 null')
    e, n = check_voice(u.get('voice'))
    return errs + e, notes + n


def check_voice(v):
    """unify.voice：对象 {model, voice, speed}，配音工具 voice.py 读它；旧的一句话写法只提醒"""
    if v is None:
        return [], []
    if isinstance(v, str):
        return [], [f'unify.voice 还是一句话（{v[:20]}）：改成 {{"model": …, "voice": …, "speed": …}}，配音工具读它']
    if not isinstance(v, dict):
        return [f'unify.voice 写对象 {{"model", "voice", "speed"}}，无旁白写 null，现在是 {v!r}'], []
    errs = [f'unify.voice 缺 {k}' for k in ('model', 'voice') if not isinstance(v.get(k), str) or not v.get(k)]
    sp = v.get('speed', 1)
    if isinstance(sp, bool) or not isinstance(sp, (int, float)) or not 0.5 <= sp <= 2:
        errs.append(f'unify.voice.speed 写 0.5–2 的数（默认 1），现在是 {sp!r}')
    extra = sorted(set(v) - {'model', 'voice', 'speed'})
    return errs, ([f'unify.voice 只认 model、voice、speed，{"、".join(extra)} 不读'] if extra else [])


def check_heard(sc):
    """script.json 顶层的 heard：{"稿子里的词": ["识别器听成的", …]}，只影响回听"""
    h = sc.get('heard')
    if h is None:
        return []
    if not isinstance(h, dict) or not all(isinstance(k, str) and k and isinstance(x, list) and x and
                                          all(isinstance(y, str) and y for y in x) for k, x in h.items()):
        return ['逐字稿的 heard 写 {"稿子里的词": ["听成的", …]}']
    return []


def style_class(x, w, lib, errs, unverified):
    """uses 一条或一个分镜的 ref / class：只写一个，ref 在库里；返回类别 C、T、G，不对返回 None（问题记进 errs）"""
    styles, packs, _ = lib
    has_ref, has_class = x.get('ref') is not None, x.get('class') is not None
    if has_ref == has_class:
        errs.append(f'{w}：ref、class 只写一个（库里有合适的风格写 ref，没有写 class）')
        return None
    if has_ref:
        r = x['ref']
        if isinstance(r, str) and r.startswith('pack:'):
            if r[5:] not in packs:
                errs.append(f'{w}：风格包 {r[5:]!r} 不在 packs/ 里')
                return None
            return 'C'
        if r in styles:
            if not styles[r].get('render_code'):
                unverified.add(r)
            return styles[r]['class']
        errs.append(f'{w}：ref {r!r} 不在 data/styles.json 里（写风格编号 "C-036" 或 "pack:风格包名"）')
        return None
    if x['class'] not in CLASSES:
        errs.append(f'{w}：class 写 C、T、G 之一，现在是 {x["class"]!r}')
        return None
    return x['class']


def shot_vo(x):
    """分镜的 vo（本段第几句旁白，从 1 数）→ 整数列表；没写是 []；写错返回 None"""
    v = x.get('vo')
    if v is None:
        return []
    if isinstance(v, int) and not isinstance(v, bool):
        v = [v]
    if isinstance(v, list) and v and all(isinstance(n, int) and not isinstance(n, bool) and n > 0 for n in v):
        return v
    return None


def shot_name(k, j):
    """分镜号：第 k 段（播放顺序，从 1 数）的第 j 个，写成 k-j；和 content.md 的事实编号 P1-1 不是一回事"""
    return f'{k}-{j}'


def check_shots(sb, sc, lib):
    """每段可选的 shots：每个分镜 what、ref 或 class 只写一个、sec 是正数、src 是路径、vo 是本段的句号且按顺序、cut 硬切或溶解；
    都写了 sec 的，加起来等于段的 sec；有的没写，写了的加起来要小于段的 sec，没写的随旁白定（voice.py 排）"""
    errs, notes, unverified = [], [], set()
    segs = sb.get('segments') if isinstance(sb.get('segments'), list) else []
    scs = sc.get('segments', []) if isinstance(sc, dict) else []
    for k, s in enumerate(segs, 1):
        if 'shots' not in s:
            continue
        where = f'第 {k} 段（{s.get("seg")}）'
        shots = s['shots']
        if not isinstance(shots, list) or not shots:
            errs.append(f'{where}：shots 要是非空数组，一项一个分镜；不分镜就不写 shots')
            continue
        nvo = None
        if k <= len(scs) and isinstance(scs[k - 1].get('vo'), list):
            nvo = len([x for x in scs[k - 1]['vo'] if isinstance(x, str) and x.strip()])
        fixed, unsized, last, covered = 0, 0, 0, set()
        for j, x in enumerate(shots, 1):
            w = f'分镜 {shot_name(k, j)}'
            if not isinstance(x, dict):
                errs.append(f'{w}：要是对象')
                continue
            extra = sorted(set(x) - set(SHOT_KEYS))
            if extra:
                notes.append(f'{w}：只认 {"、".join(SHOT_KEYS)}，{"、".join(extra)} 不读')
            if not x.get('what'):
                errs.append(f'{w}：缺 what（景别、主体、动作）')
            style_class(x, w, lib, errs, unverified)
            sec = x.get('sec')
            if sec is None:
                unsized += 1
            elif isinstance(sec, bool) or not isinstance(sec, (int, float)) or sec < SHOT_MIN:
                errs.append(f'{w}：sec 写不少于 {SHOT_MIN} 的秒数，或不写（随旁白定），现在是 {sec!r}')
            else:
                fixed += sec
            src = x.get('src')
            if src is not None and not (isinstance(src, str) and src or
                                        isinstance(src, list) and src and all(isinstance(y, str) and y for y in src)):
                errs.append(f'{w}：src 写素材或参考图的路径（一个字符串或数组），没有就不写')
            vo = shot_vo(x)
            if vo is None:
                errs.append(f'{w}：vo 写本段第几句旁白（从 1 数，如 2 或 [2, 3]），没有旁白就不写')
                vo = []
            if vo:
                if vo != sorted(vo) or vo[0] < last:
                    errs.append(f'{w}：vo {vo} 要按旁白的顺序，接在上一个分镜的句子后面（同一句可以跨两个分镜）')
                if nvo is not None and vo[-1] > nvo:
                    errs.append(f'{w}：vo 写到第 {vo[-1]} 句，逐字稿这段只有 {nvo} 句')
                last = max(last, vo[-1])
                covered |= set(vo)
            if x.get('cut') is not None and x['cut'] not in CUTS:
                errs.append(f'{w}：cut 写「硬切」或「溶解」（不写算硬切），现在是 {x["cut"]!r}')
        ssec = s.get('sec')
        if isinstance(ssec, (int, float)) and not isinstance(ssec, bool) and ssec > 0:
            if not unsized and abs(fixed - ssec) > SEC_EPS:
                errs.append(f'{where}：分镜秒数合计 {fixed:g}，段的 sec 是 {ssec:g}，要相等；'
                            '也可以有的分镜不写 sec，随旁白定')
            elif unsized and fixed >= ssec:
                errs.append(f'{where}：写了 sec 的分镜已经 {fixed:g} 秒，段的 sec 是 {ssec:g}，没写 sec 的分镜排不下')
        if nvo:
            miss = [n for n in range(1, nvo + 1) if n not in covered]
            if miss and covered:
                notes.append(f'{where}：第 {"、".join(map(str, miss))} 句旁白没落在哪个分镜上')
    for r in sorted(unverified):
        notes.append(f'{r} 没有样片（只有「技术（建议）」），向用户说明没验证过')
    return errs, notes


def layout(shots, dur, starts=None, fps=30):
    """排一段里分镜的起止，返回 ([(t0, t1)], 问题)。dur 是段长；starts 是本段每句旁白的开始时刻（timing.json 的 at）。
    第一个分镜从 0 起，最后一个到 dur 止；写了 sec 的照它排；没写的，切点落在它第一句旁白开始的时刻
    （这句和上一个分镜共用时不算）；还定不下的切点，在前后定下的切点之间均分。都写了 sec、加起来不等于段长的，最后一个分镜吃掉差额"""
    n = len(shots)
    b = [None] * (n + 1)
    b[0], b[n] = 0.0, float(dur)
    vos = [shot_vo(x) or [] for x in shots]
    secs = [x.get('sec') if isinstance(x.get('sec'), (int, float)) and not isinstance(x.get('sec'), bool) else None
            for x in shots]
    changed = True
    while changed:
        changed = False
        for k in range(1, n):
            if b[k] is not None:
                continue
            if secs[k - 1] and b[k - 1] is not None:
                b[k] = b[k - 1] + secs[k - 1]
            elif secs[k] and b[k + 1] is not None:
                b[k] = b[k + 1] - secs[k]
            elif starts and vos[k] and vos[k][0] <= len(starts) and vos[k][0] not in vos[k - 1]:
                b[k] = float(starts[vos[k][0] - 1])
            else:
                continue
            changed = True
    k = 0
    while k < n:                                   # 定不下的切点均分
        if b[k + 1] is None:
            m = k + 1
            while b[m] is None:
                m += 1
            for i in range(k + 1, m):
                b[i] = b[k] + (b[m] - b[k]) * (i - k) / (m - k)
            k = m
        else:
            k += 1
    b = [round(x * fps) / fps for x in b]
    errs = []
    for k in range(n):
        if b[k + 1] - b[k] < SHOT_MIN - 1e-6:
            errs.append(f'第 {k + 1} 个分镜只有 {b[k + 1] - b[k]:.2f} 秒（{b[k]:.2f}–{b[k + 1]:.2f}），排不开：改 sec 或 vo')
    return [(b[k], b[k + 1]) for k in range(n)], errs


def check_segments(sb, lib, has_plan):
    """每段：seg、lead、至少一条 uses、ref 在库里、materials 是 tags.json 的；typical 1–2 段；无策划时秒数贴近 brief.sec"""
    errs, notes = [], []
    styles, packs, materials = lib
    segs = sb.get('segments')
    if not isinstance(segs, list) or not segs:
        return ['"segments" 要是非空数组，按播放顺序'], notes
    seen, typical, total, unverified = [], 0, 0, set()
    for i, s in enumerate(segs, 1):
        where = f'第 {i} 段'
        g = s.get('seg')
        if not isinstance(g, str) or not SEG_ID.fullmatch(g):
            errs.append(f'{where}：seg {g!r} 要写 "P1" 这样的段号')
        elif not has_plan:
            if g in seen:
                errs.append(f'{where}：seg {g} 重复了；无策划时一段一个段号')
            elif seen and SEG_ID.fullmatch(seen[-1]) and int(g[1:]) <= int(seen[-1][1:]):
                errs.append(f'{where}：seg {g} 排在 {seen[-1]} 后面，按播放顺序编 P1、P2…')
            seen.append(g)
        for k in ('title', 'content'):
            if not s.get(k):
                errs.append(f'{where}：缺 {k}')
        sec = s.get('sec')
        if not (isinstance(sec, (int, float)) and not isinstance(sec, bool) and sec > 0):
            errs.append(f'{where}：sec 要是正的秒数，现在是 {sec!r}')
        else:
            total += sec
        if s.get('lead') not in CLASSES:
            errs.append(f'{where}：lead 写 C、T、G 之一，现在是 {s.get("lead")!r}')
        if s.get('typical') is True:
            typical += 1
        uses = s.get('uses')
        if not isinstance(uses, list) or not uses:
            errs.append(f'{where}：uses 至少一条（每段用什么样式）')
            continue
        for j, x in enumerate(uses, 1):
            w = f'{where} uses 第 {j} 条'
            if not x.get('what'):
                errs.append(f'{w}：缺 what（做什么）')
            c = style_class(x, w, lib, errs, unverified)
            if c is None:
                continue
            ms = x.get('materials')
            if ms is not None:
                ok = materials.get('T', set()) | materials.get('G', set())
                bad = [m for m in ms if m not in ok] if isinstance(ms, list) else [ms]
                if bad:
                    errs.append(f'{w}：materials {"、".join(map(str, bad))} 不是 tags.json 的素材类型'
                                f'（{"、".join(sorted(ok))}）')
            elif c in ('T', 'G'):
                notes.append(f'{w}：{c} 类建议写 materials（用到的素材类型）')
    if typical > 2:
        errs.append(f'typical 标了 {typical} 段，只标 1–2 段做典型样片')
    elif typical == 0:
        notes.append('还没有段标 typical：挑 1–2 段最难或最能代表全片的做典型样片')
    for r in sorted(unverified):
        notes.append(f'{r} 没有样片（只有「技术（建议）」），向用户说明没验证过')
    b = sb.get('brief')
    if not has_plan and isinstance(b, dict) and isinstance(b.get('sec'), (int, float)) and b['sec'] > 0 and total:
        if abs(total - b['sec']) > b['sec'] * TOLERANCE:
            errs.append(f'各段合计 {total:g} 秒，brief.sec 是 {b["sec"]:g} 秒，差得多了（超过 {TOLERANCE:.0%}）')
    return errs, notes


def check_align(sb, sc):
    """逐字稿和分镜脚本：段数一样、seg 按顺序一一对应"""
    errs = []
    a, b = sb.get('segments', []), sc.get('segments', [])
    if len(a) != len(b):
        errs.append(f'逐字稿有 {len(b)} 段，分镜脚本有 {len(a)} 段，要一一对应')
    for i, (x, y) in enumerate(zip(a, b), 1):
        if x.get('seg') != y.get('seg'):
            errs.append(f'逐字稿第 {i} 段：seg {y.get("seg")} 和分镜脚本的 {x.get("seg")} 不一致')
    return errs


def check_facts(sc, has_plan):
    """事实都有出处。有策划：ref 写 content.md 的编号（出处记在那边，编号由 check_plan.py 查）或 null（设定）。
    无策划：ref 写 null，src 写链接或「用户提供」「设定」，换算、推算的写 calc。confirm 只能是「待用户确认」「用户确认」"""
    errs, notes = [], []
    for i, s in enumerate(sc.get('segments', []), 1):
        if not isinstance(s.get('vo'), list):
            errs.append(f'逐字稿第 {i} 段：vo 要是数组，一句一项（没有旁白写空数组）')
        for f in s.get('facts', []):
            where = f'逐字稿第 {i} 段「{str(f.get("what", ""))[:24]}」'
            if not f.get('what'):
                errs.append(f'{where}：缺 what（事实本身）')
            if 'ref' not in f:
                errs.append(f'{where}：缺 ref' + ('（引用事实写 "P1-1"，设定写 null）' if has_plan else '（无策划写 null）'))
            elif not has_plan and f['ref'] is not None:
                errs.append(f'{where}：无策划时 ref 写 null，出处写在 src')
            if not has_plan and not (f.get('src') or f.get('calc')):
                errs.append(f'{where}：没有出处：src 写链接，或「用户提供」「设定」；换算、推算的写 calc')
            if 'confirm' in f and f['confirm'] not in CONFIRM:
                errs.append(f'{where}：confirm 写「待用户确认」或「用户确认」，现在是 {f["confirm"]!r}')
    return errs, notes


def check_ready(sb, sc):
    """--ready：用户确认过了才做典型样片"""
    errs = []
    if sb.get('status') != '用户确认':
        errs.append(f'分镜脚本的 status 是 {sb.get("status")!r}：给用户确认、用户点头后改成「用户确认」，再做典型样片')
    if sc is None:
        errs.append('--ready 要连逐字稿一起查（写 --script，或放在分镜脚本同目录的 script.json）')
        return errs
    for i, s in enumerate(sc.get('segments', []), 1):
        for f in s.get('facts', []):
            if f.get('confirm') == PENDING:
                errs.append(f'逐字稿第 {i} 段「{str(f.get("what", ""))[:24]}」还是「{PENDING}」：'
                            '用户确认了改成「用户确认」，不要的删掉、旁白跟着改')
    if not any(s.get('typical') is True for s in sb.get('segments', [])):
        errs.append('没有段标 typical：标 1–2 段做典型样片')
    return errs


def check(sb, sc=None, ready=False, lib=None):
    """全部通用检查，返回 (errs, notes)。check_plan.py 也调这个"""
    lib = lib or library()
    has_plan = 'plan' in sb
    errs, notes = check_head(sb, lib)
    e, n = check_segments(sb, lib, has_plan)
    errs += e
    notes += n
    e, n = check_shots(sb, sc, lib)
    errs += e
    notes += [x for x in n if x not in notes]
    if not has_plan:
        for k, s in enumerate(sb.get('segments') if isinstance(sb.get('segments'), list) else [], 1):
            items = (s.get('uses') or []) + (s.get('shots') if isinstance(s.get('shots'), list) else [])
            if isinstance(s, dict) and any(isinstance(x, dict) and 'rule' in x for x in items):
                notes.append(f'第 {k} 段：rule 引用策划 content.md 的约束（K1…），无策划时不读，画面要守的样子写进 what 或 note')
    if sc is not None:
        if sb.get('plan') != sc.get('plan'):
            errs.append(f'逐字稿的 "plan" 要和分镜脚本一样（{sb.get("plan")!r}），现在是 {sc.get("plan")!r}')
        errs += check_align(sb, sc)
        errs += check_heard(sc)
        e, n = check_facts(sc, has_plan)
        errs += e
        notes += n
    if ready:
        errs += check_ready(sb, sc)
    return errs, notes


def cell(x):
    return str(x).replace('|', '｜').replace('\n', ' ')


def style_tag(x, styles):
    r = x.get('ref')
    if r and r in styles:
        return f'{r} {styles[r]["name"]}'
    return r if r else f'{x.get("class")} 类，库里没有'


def shot_rows(k, s, vo, spans=None):
    """一段的分镜表：分镜号、秒、画面、类别、素材或参考图、旁白、接法"""
    out = [f'**第 {k} 段 {s.get("seg", "")} {s.get("title", "")}**（{s.get("sec", "")} 秒，{len(s["shots"])} 个分镜）', '',
           '| 分镜 | 秒 | 画面（景别、主体、动作） | 类别 | 素材或参考图 | 旁白 | 接法 |', '|---|---|---|---|---|---|---|']
    for j, x in enumerate(s['shots'], 1):
        if spans:
            t0, t1 = spans[j - 1]
            sec = f'{t1 - t0:.1f}（{t0:.1f}–{t1:.1f}）'
        else:
            sec = f'{x["sec"]:g}' if isinstance(x.get('sec'), (int, float)) else '随旁白'
        r = x.get('ref')
        cls = x.get('class') or (r if r and r.startswith('pack:') else (r or ''))
        src = x.get('src') or ''
        src = '、'.join(src) if isinstance(src, list) else src
        rule = x.get('rule')
        if rule:
            src = (src + ' · ' if src else '') + '照 ' + ('、'.join(map(str, rule)) if isinstance(rule, list) else str(rule))
        ns = shot_vo(x) or []
        said = '；'.join(f'{n}「{vo[n - 1][:16]}{"…" if len(vo[n - 1]) > 16 else ""}」' if n <= len(vo) else str(n) for n in ns)
        cut = '—' if j == 1 else (x.get('cut') or '硬切')
        out.append(f'| {shot_name(k, j)} | {sec} | {cell(x.get("what", ""))} | {cell(cls)} | {cell(src) or "—"} | '
                   f'{cell(said) or "—"} | {cut} |')
    return out


def table(sb, sc=None, lib=None, timing=None):
    """段落表（段、讲什么、秒数、分镜数、样式、主角类）、每段的分镜表、全片统一、待确认的事实，Markdown。
    timing 是 timing.json（配过音以后有），有了就按它排出每个分镜的实际起止"""
    styles = (lib or library())[0]
    segs = sb.get('segments', [])
    scs = sc.get('segments', []) if isinstance(sc, dict) else []
    tsegs = timing.get('segments', []) if isinstance(timing, dict) else []
    out = []
    b = sb.get('brief') if isinstance(sb.get('brief'), dict) else {}
    eff = [f'{name}「{b[k]}」' for k, name in BRIEF_EFFECT.items() if isinstance(b.get(k), str) and b[k].strip()]
    if eff:
        out += ['效果：' + '；'.join(eff), '']
    out += ['段落表：', '', '| # | 段 | 讲什么 | 秒 | 分镜 | 样式 | 主角 |', '|---|---|---|---|---|---|---|']
    total, nshot, gen = 0, 0, 0
    for k, s in enumerate(segs, 1):
        uses = []
        for x in s.get('uses', []):
            ms = '、'.join(x.get('materials') or [])
            uses.append(f'{x.get("what", "")}（{style_tag(x, styles)}{"；" + ms if ms else ""}）')
        shots = s.get('shots') if isinstance(s.get('shots'), list) else []
        nshot += len(shots)
        for x in shots:
            r = x.get('ref')
            if x.get('class') == 'G' or (r in styles and styles[r]['class'] == 'G'):
                gen += 1
        title = f'{s.get("title", "")}{"（典型样片）" if s.get("typical") else ""}：{s.get("content", "")}'
        out.append(f'| {k} | {cell(s.get("seg", ""))} | {cell(title)} | {cell(s.get("sec", ""))} | {len(shots) or "—"} | '
                   f'{cell("；".join(uses))} | {cell(s.get("lead", ""))} |')
        total += s.get('sec') or 0
    out.append('')
    out.append(f'合计 {total:g} 秒' + (f'，目标 {b["sec"]:g} 秒' if isinstance(b.get('sec'), (int, float)) else '') +
               (f'；{nshot} 个分镜，其中生成类（G）{gen} 个' if nshot else '') +
               f'；画幅 {sb.get("ar")}；状态 {sb.get("status")}')
    if nshot:
        out += ['', '分镜表（分镜号「段序号-分镜序号」；旁白是本段第几句，从 1 数；秒数' +
                ('照 timing.json 排出' if tsegs else '「随旁白」的配音后按句子定') + '）：']
        for k, s in enumerate(segs, 1):
            if not isinstance(s.get('shots'), list) or not s['shots']:
                continue
            vo = [x for x in (scs[k - 1].get('vo') or []) if isinstance(x, str) and x.strip()] if k <= len(scs) else []
            spans = None
            if k <= len(tsegs) and tsegs[k - 1].get('shots') and len(tsegs[k - 1]['shots']) == len(s['shots']):
                spans = [(x['t0'], x['t1']) for x in tsegs[k - 1]['shots']]
            out += [''] + shot_rows(k, s, vo, spans)
    u = sb.get('unify') or {}
    names = {'pack': '风格包', 'palette': '色板', 'fonts': '字体', 'subs': '字幕', 'trans': '转场', 'music': '配乐',
             'voice': '旁白音色'}
    def val(k):
        x = u[k]
        if k == 'voice' and isinstance(x, dict):
            return f'{x.get("voice")}（{x.get("model")}，语速 {x.get("speed", 1)}）'
        return x if x is not None else '无'
    out += ['', '全片统一：'] + [f'- {names[k]}：{val(k)}' for k in names if k in u]
    if sc is not None:
        pend = [(s.get('seg'), f.get('what')) for s in sc.get('segments', []) for f in s.get('facts', [])
                if f.get('confirm') == PENDING]
        if pend:
            out += ['', f'{PENDING}的事实：'] + [f'- {g}：{w}' for g, w in pend]
    return '\n'.join(out)


def timing_of(storyboard):
    """分镜脚本同目录的 timing.json（配过音才有），读不了返回 None"""
    p = Path(storyboard).parent / 'timing.json'
    try:
        return json.loads(p.read_text(encoding='utf-8')) if p.is_file() else None
    except (OSError, json.JSONDecodeError):
        return None


def main(argv=None):
    ap = argparse.ArgumentParser(description='查完整出片的分镜脚本 storyboard.json 和逐字稿 script.json')
    ap.add_argument('storyboard', help='videos/<短名>/storyboard.json')
    ap.add_argument('--script', help='videos/<短名>/script.json（默认分镜脚本同目录的 script.json）')
    ap.add_argument('--ready', action='store_true', help='再查用户确认过了：status 是「用户确认」、没有「待用户确认」')
    ap.add_argument('--table', action='store_true', help='打印段落表、分镜表和全片统一，给用户看')
    a = ap.parse_args(argv)
    sp = Path(a.script) if a.script else Path(a.storyboard).parent / 'script.json'
    try:
        sb = load(a.storyboard)
        sc = load(sp) if a.script or sp.is_file() else None
    except Unreadable as x:
        print(f'读不了：{x}')
        return 2
    lib = library()
    errs, notes = check(sb, sc, a.ready, lib)
    if 'plan' in sb:
        notes.append('分镜脚本接了策划（有 "plan"）：还要跑 check_plan.py 查段号和事实的编号')
    if a.table:
        print(table(sb, sc, lib, timing_of(a.storyboard)))
        print()
    for x in notes:
        print(f'提醒：{x}')
    for x in errs:
        print(f'✗ {x}')
    print(f'{a.storyboard}：{len(sb.get("segments") or [])} 段' + ('，带逐字稿' if sc is not None else '，没有逐字稿') +
          (f'；{len(errs)} 个问题' if errs else '；没有问题'))
    return 1 if errs else 0


if __name__ == '__main__':
    sys.exit(main())
