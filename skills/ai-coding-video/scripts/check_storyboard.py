#!/usr/bin/env python3
"""完整出片的通用检查：分镜 storyboard.json 和逐字稿 script.json。只用标准库。

    python3 <本 Skill 目录>/scripts/check_storyboard.py videos/<短名>/storyboard.json
    python3 <本 Skill 目录>/scripts/check_storyboard.py videos/<短名>/storyboard.json \\
        --script videos/<短名>/script.json [--ready] [--table]

不写 --script 时用分镜同目录的 script.json（有的话）。--ready：给用户确认之后、做典型样片之前再跑，
另查 status 是「用户确认」、事实里没有「待用户确认」。--table：打印分镜表和全片统一，给用户看。
退出码：0 没有问题（可能有提醒）；1 有问题要改；2 读不了（文件不在、不是 JSON）。
接了策划的（分镜里有 "plan"）另跑 check_plan.py，它会调本脚本查通用的部分。格式和规矩见本 Skill 的 film.md。
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
UNIFY = ('palette', 'fonts', 'subs', 'trans', 'music', 'voice')
SEG_ID = re.compile(r'P\d+')
TOLERANCE = 0.15  # 秒数和目标差多少算偏离


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
    return errs, notes


def check_segments(sb, lib, has_plan):
    """每段：seg、lead、至少一条 uses、ref 在库里、materials 是 tags.json 的；typical 1–2 段；无策划时秒数贴近 brief.sec"""
    errs, notes = [], []
    styles, packs, materials = lib
    segs = sb.get('segments')
    if not isinstance(segs, list) or not segs:
        return ['"segments" 要是非空数组，按播放顺序'], notes
    seen, typical, total, unverified = [], 0, 0, set()
    for i, s in enumerate(segs, 1):
        where = f'分镜第 {i} 段'
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
            has_ref, has_class = 'ref' in x and x['ref'] is not None, 'class' in x and x['class'] is not None
            if has_ref == has_class:
                errs.append(f'{w}：ref、class 只写一个（库里有合适的风格写 ref，没有写 class）')
                continue
            if has_ref:
                r = x['ref']
                if isinstance(r, str) and r.startswith('pack:'):
                    if r[5:] not in packs:
                        errs.append(f'{w}：风格包 {r[5:]!r} 不在 packs/ 里')
                        continue
                    c = 'C'
                elif r in styles:
                    c = styles[r]['class']
                    if not styles[r].get('render_code'):
                        unverified.add(r)
                else:
                    errs.append(f'{w}：ref {r!r} 不在 data/styles.json 里（写风格编号 "C-036" 或 "pack:风格包名"）')
                    continue
            else:
                c = x['class']
                if c not in CLASSES:
                    errs.append(f'{w}：class 写 C、T、G 之一，现在是 {c!r}')
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
            errs.append(f'分镜合计 {total:g} 秒，brief.sec 是 {b["sec"]:g} 秒，差得多了（超过 {TOLERANCE:.0%}）')
    return errs, notes


def check_align(sb, sc):
    """逐字稿和分镜：段数一样、seg 按顺序一一对应"""
    errs = []
    a, b = sb.get('segments', []), sc.get('segments', [])
    if len(a) != len(b):
        errs.append(f'逐字稿有 {len(b)} 段，分镜有 {len(a)} 段，要一一对应')
    for i, (x, y) in enumerate(zip(a, b), 1):
        if x.get('seg') != y.get('seg'):
            errs.append(f'逐字稿第 {i} 段：seg {y.get("seg")} 和分镜的 {x.get("seg")} 不一致')
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
        errs.append(f'分镜的 status 是 {sb.get("status")!r}：给用户确认、用户点头后改成「用户确认」，再做典型样片')
    if sc is None:
        errs.append('--ready 要连逐字稿一起查（写 --script，或放在分镜同目录的 script.json）')
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
    if sc is not None:
        if sb.get('plan') != sc.get('plan'):
            errs.append(f'逐字稿的 "plan" 要和分镜一样（{sb.get("plan")!r}），现在是 {sc.get("plan")!r}')
        errs += check_align(sb, sc)
        e, n = check_facts(sc, has_plan)
        errs += e
        notes += n
    if ready:
        errs += check_ready(sb, sc)
    return errs, notes


def cell(x):
    return str(x).replace('|', '｜').replace('\n', ' ')


def table(sb, sc=None, lib=None):
    """分镜表（段、讲什么、秒数、样式、主角类）、全片统一、待确认的事实，Markdown"""
    styles = (lib or library())[0]
    out = ['| 段 | 讲什么 | 秒 | 样式 | 主角 |', '|---|---|---|---|---|']
    total = 0
    for s in sb.get('segments', []):
        uses = []
        for x in s.get('uses', []):
            r = x.get('ref')
            if r and r in styles:
                tag = f'{r} {styles[r]["name"]}'
            elif r:
                tag = r
            else:
                tag = f'{x.get("class")} 类，库里没有'
            ms = '、'.join(x.get('materials') or [])
            uses.append(f'{x.get("what", "")}（{tag}{"；" + ms if ms else ""}）')
        title = f'{s.get("title", "")}{"（典型样片）" if s.get("typical") else ""}：{s.get("content", "")}'
        out.append(f'| {cell(s.get("seg", ""))} | {cell(title)} | {cell(s.get("sec", ""))} | {cell("；".join(uses))} | {cell(s.get("lead", ""))} |')
        total += s.get('sec') or 0
    b = sb.get('brief') if isinstance(sb.get('brief'), dict) else {}
    out.append('')
    out.append(f'合计 {total:g} 秒' + (f'，目标 {b["sec"]:g} 秒' if isinstance(b.get('sec'), (int, float)) else '') +
               f'；画幅 {sb.get("ar")}；状态 {sb.get("status")}')
    u = sb.get('unify') or {}
    names = {'pack': '风格包', 'palette': '色板', 'fonts': '字体', 'subs': '字幕', 'trans': '转场', 'music': '配乐',
             'voice': '旁白音色'}
    out += ['', '全片统一：'] + [f'- {names[k]}：{u[k] if u[k] is not None else "无"}' for k in names if k in u]
    if sc is not None:
        pend = [(s.get('seg'), f.get('what')) for s in sc.get('segments', []) for f in s.get('facts', [])
                if f.get('confirm') == PENDING]
        if pend:
            out += ['', f'{PENDING}的事实：'] + [f'- {g}：{w}' for g, w in pend]
    return '\n'.join(out)


def main(argv=None):
    ap = argparse.ArgumentParser(description='查完整出片的分镜 storyboard.json 和逐字稿 script.json')
    ap.add_argument('storyboard', help='videos/<短名>/storyboard.json')
    ap.add_argument('--script', help='videos/<短名>/script.json（默认分镜同目录的 script.json）')
    ap.add_argument('--ready', action='store_true', help='再查用户确认过了：status 是「用户确认」、没有「待用户确认」')
    ap.add_argument('--table', action='store_true', help='打印分镜表和全片统一，给用户看')
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
        notes.append('分镜接了策划（有 "plan"）：还要跑 check_plan.py 查段号和事实的编号')
    if a.table:
        print(table(sb, sc, lib))
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
