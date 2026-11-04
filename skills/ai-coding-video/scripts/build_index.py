#!/usr/bin/env python3
"""风格库的生成与自检。只用 Python 标准库；路径一律相对于本脚本所在位置。

    python3 scripts/build_index.py           # 由 styles/*.md 生成 data/styles.json 和 index.md 的风格目录
    python3 scripts/build_index.py --check   # 只校验、不写文件；有问题时退出码为 1

数据源是 styles/*.md；data/styles.json 和 index.md 里 <!-- catalog --> 之间的目录都是生成物，不要手改。
技术标签、题材、内容类型和素材种类的合法取值在 data/tags.json。
C 类（纯代码）按题材分；T 类（公共领域素材）、G 类（AI 生成素材）按内容类型分，每条标出用到的素材种类。
T、G 类做过样片的，再核对 samples/<编号>/assets.json：素材种类和条目一致、每份素材有出处和许可（或模型和提示词）、合计不超过 10 MB。
在本仓库里运行时，还把仓库根目录 samples/、packs/ 的代码同步进 Skill 的 samples/、packs/（生成物，随 Skill 一起安装），--check 时核对是否同步。
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STYLES_DIR = os.path.join(ROOT, 'styles')
JSON_PATH = os.path.join(ROOT, 'data', 'styles.json')
TAGS_PATH = os.path.join(ROOT, 'data', 'tags.json')
INDEX_PATH = os.path.join(ROOT, 'index.md')
# 样片代码、风格包放在仓库里 Skill 文件夹之外；条目里写成指向 GitHub 的链接，Skill 单独装进别的项目也能点开。
# 仓库地址只记在这里，samples/tools/mark.py 从这里取。
CODE_BASE = 'https://github.com/Chans-gh/AI-Coding-Video/tree/main/'
RAW_BASE = 'https://raw.githubusercontent.com/Chans-gh/AI-Coding-Video/main/'
REPO_ROOT = os.path.dirname(os.path.dirname(ROOT))  # 在本仓库里时才有 samples/、packs/，单独安装时跳过存在性检查
# 随 Skill 安装的代码：仓库里 samples/、packs/ 被 git 跟踪的文件，去掉截图、T/G 类素材（assets/，只留 assets.json）和只给维护者用的文件。
# 同步到 Skill 里同名的 samples/、packs/，条目「样片代码」「风格包」链接文字里的路径（samples/C-044/）就是它在 Skill 里的位置。
BUNDLE = ('samples', 'packs')
BUNDLE_SKIP_DIRS = {'assets', 'node_modules', 'out', '__pycache__'}
BUNDLE_SKIP_FILES = {'samples/README.md', 'packs/README.md', 'samples/tools/mark.py', 'samples/tools/apidoc.py'}
BUNDLE_SKIP_EXT = ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mp3', '.wav')
SKILL_IN_REPO = 'skills/ai-coding-video/'
CAT_START, CAT_END = '<!-- catalog:start -->', '<!-- catalog:end -->'

ENTRY_RE = re.compile(r'<a id="([CTG]-\d{3})"></a>\s*\n\s*\n## ([CTG]-\d{3}) (.+?)\n(.*?)(?=\n<a id="[CTG]-\d{3}"></a>|\Z)', re.S)
IMG_RE = re.compile(r'^!\[[^\]]*\]\(\.\./images/([^)]+)\)', re.M)
CODE_RE = re.compile(r'```text\n(.*?)\n```', re.S)
FIELD_RE = re.compile(r'^- ([^：\n]+)：(.*)$', re.M)
MDLINK_RE = re.compile(r'\[([^\]]+)\]\(([^)\s]+)\)')
FENCE_RE = re.compile(r'^( *)(`{3,})[^\n]*\n.*?^\1\2[ \t]*$', re.S | re.M)
FIELDS = {'题材': 'theme', '内容类型': 'content_type', '素材': 'materials', '适合': 'fit', '技术（已验证）': 'verified', '技术（建议）': 'suggested',
          '样片代码': 'render_code', '风格包': 'pack', '参考': 'refs'}
REPO_LINKS = {'render_code': 'samples/', 'pack': 'packs/'}
CLASS_NAME = {'C': '纯代码', 'T': '公共领域素材', 'G': 'AI 生成素材'}
ASSET_LIMIT = 10_000_000          # 每个 T、G 样片的 assets/ 合计上限
AUDIO_KINDS = {'旁白', '配乐', '音效', '原声'}   # assets.json 里声音的种类（不算素材种类）


def split_tags(value):
    return [t.strip() for t in value.split('·') if t.strip()]


def repo_link(value, prefix, where, errors):
    """「样片代码」「风格包」写成 [samples/C-044/](CODE_BASE + samples/C-044)，返回 {path, url}。"""
    m = re.fullmatch(r'\[([^\]]+)\]\(([^)\s]+)\)', value.strip())
    if not m or not m.group(1).startswith(prefix) or not m.group(1).endswith('/'):
        errors.append(f'{where}: 要写成 [{prefix}…/]({CODE_BASE}{prefix}…)')
        return None
    path, url = m.groups()
    if url != CODE_BASE + path.rstrip('/'):
        errors.append(f'{where}: 链接应为 {CODE_BASE}{path.rstrip("/")}')
    if os.path.isdir(os.path.join(REPO_ROOT, prefix)) and not os.path.isdir(os.path.join(REPO_ROOT, path)):
        errors.append(f'{where}: 仓库里没有 {path}')
    return {'path': path, 'url': url}


def check_assets(rec, where, kinds, errors):
    """T、G 类样片的 assets.json：每份素材的种类、出处、许可或模型和提示词，文件存在，合计不超过 10 MB"""
    d = os.path.join(REPO_ROOT, rec['render_code']['path'])
    p = os.path.join(d, 'assets.json')
    if not os.path.isdir(os.path.join(REPO_ROOT, 'samples')):
        return                                   # Skill 单独安装时没有样片目录
    if not os.path.exists(p):
        errors.append(f'{where}: 缺 {rec["render_code"]["path"]}assets.json')
        return
    items = json.load(open(p, encoding='utf-8')).get('items', [])
    used, total, seen = set(), 0, set()
    for it in items:
        f, kind = it.get('file', ''), it.get('kind', '')
        if f in seen:                            # 同一个文件被几项引用（如一段原声分几处用）：出处、体积只查一次
            continue
        seen.add(f)
        w = f'{where} assets.json「{f}」'
        if kind not in kinds and kind not in AUDIO_KINDS:
            errors.append(f'{w}: 种类「{kind}」不认识（素材：{" / ".join(kinds)}；声音：{" / ".join(sorted(AUDIO_KINDS))}）')
        used.add(kind)
        if it.get('model'):
            if not it.get('prompt') and not it.get('text'):
                errors.append(f'{w}: 生成的素材要记提示词（语音记 text）')
        elif not (it.get('source', '').startswith('http') and it.get('license')):
            errors.append(f'{w}: 要记出处链接 source 和许可 license')
        fp = os.path.join(d, f)
        if not os.path.exists(fp):
            errors.append(f'{w}: 文件不存在')
        else:
            total += os.path.getsize(fp)
    if set(rec['materials']) != used & set(kinds):
        errors.append(f'{where}: 条目的素材（{" · ".join(rec["materials"])}）和 assets.json 里实际用到的（{" · ".join(sorted(used & set(kinds)))}）不一致')
    if total > ASSET_LIMIT:
        errors.append(f'{where}: assets/ 合计 {total / 1e6:.1f} MB，超过 10 MB')


def parse(errors):
    tags = json.load(open(TAGS_PATH, encoding='utf-8'))
    themes = [t['name'] for t in tags['themes']]
    ctypes = [t['name'] for t in tags['content_types']]
    mats = {c: [m['name'] for m in v] for c, v in tags['materials'].items()}
    styles = []
    for fname in sorted(os.listdir(STYLES_DIR)):
        if not fname.endswith('.md'):
            continue
        layer = fname[:-3]
        if layer not in tags['files']:
            errors.append(f'styles/{fname}: 文件名不在 tags.json 的 files 里')
            continue
        text = open(os.path.join(STYLES_DIR, fname), encoding='utf-8').read()
        found = ENTRY_RE.findall(text)
        m = re.match(r'# .+?（(\d+) 种）', text)
        if not m or int(m.group(1)) != len(found):
            errors.append(f'styles/{fname}: 标题里的种数和条目数（{len(found)}）不一致')
        for anchor, sid, name, body in found:
            where = f'styles/{fname} {sid}'
            if anchor != sid:
                errors.append(f'{where}: 锚点 {anchor} 和标题编号不一致')
            prompts = CODE_RE.findall(body)
            if len(prompts) != 1:
                errors.append(f'{where}: 应该正好有一个 text 代码块（风格提示词）')
            imgs = IMG_RE.findall(body)
            rec = {'id': sid, 'class': sid[0], 'name': name.strip(), 'file': f'styles/{fname}', 'layer': layer,
                   'image': f'images/{imgs[0]}' if imgs else None, 'prompt': prompts[0].strip() if prompts else '',
                   'theme': '', 'content_type': '', 'materials': [], 'fit': '', 'verified': [], 'suggested': [],
                   'render_code': None, 'pack': None, 'refs': []}
            for key, value in FIELD_RE.findall(FENCE_RE.sub('', body)):
                if key not in FIELDS:
                    errors.append(f'{where}: 不认识的字段「{key}」')
                    continue
                k = FIELDS[key]
                if k in ('verified', 'suggested', 'materials'):
                    rec[k] = split_tags(value)
                elif k == 'refs':
                    rec[k] = [{'label': a, 'url': b} for a, b in MDLINK_RE.findall(value)]
                elif k in REPO_LINKS:
                    rec[k] = repo_link(value, REPO_LINKS[k], f'{where}「{key}」', errors)
                else:
                    rec[k] = value.strip()
            fcls = tags['files'][layer].get('class', 'C')
            if rec['class'] != fcls:
                errors.append(f'{where}: {rec["class"]} 类条目放进了 {fcls} 类的文件 {fname}')
            if rec['class'] == 'C':
                if rec['theme'] not in themes:
                    errors.append(f'{where}: 题材「{rec["theme"]}」不在 tags.json 的 themes 里')
                if rec['content_type'] or rec['materials']:
                    errors.append(f'{where}: C 类按题材分，不写「内容类型」「素材」')
            else:
                if rec['theme']:
                    errors.append(f'{where}: {rec["class"]} 类按内容类型分，不写「题材」')
                if rec['content_type'] not in ctypes:
                    errors.append(f'{where}: 内容类型「{rec["content_type"]}」不在 tags.json 的 content_types 里')
                if not rec['materials']:
                    errors.append(f'{where}: 缺「素材」')
                for mname in rec['materials']:
                    if mname not in mats[rec['class']]:
                        errors.append(f'{where}: 素材「{mname}」不是 {rec["class"]} 类的素材种类（{" / ".join(mats[rec["class"]])}）')
                if rec['render_code']:
                    check_assets(rec, where, mats[rec['class']], errors)
            if not rec['fit']:
                errors.append(f'{where}: 缺「适合」')
            all_tags = rec['verified'] + rec['suggested']
            if not all_tags:
                errors.append(f'{where}: 至少要有一行技术标签')
            for t in all_tags:
                if t not in tags['tags']:
                    errors.append(f'{where}: 技术标签「{t}」不在 tags.json 里')
            if rec['class'] == 'C' and not set(all_tags) & set(tags['files'][layer]['needs']):
                errors.append(f'{where}: 放在 {fname} 里，但技术标签里没有 {" / ".join(tags["files"][layer]["needs"])}')
            if rec['image']:
                if not os.path.exists(os.path.join(ROOT, rec['image'])):
                    errors.append(f'{where}: 图片 {rec["image"]} 不存在')
                if not rec['verified'] or not rec['render_code']:
                    errors.append(f'{where}: 有缩略图（做过样片）就必须写「技术（已验证）」和「样片代码」')
            elif rec['verified']:
                errors.append(f'{where}: 写了「技术（已验证）」但没有样片缩略图')
            if rec['pack'] and not rec['render_code']:
                errors.append(f'{where}: 有「风格包」就必须先有样片')
            styles.append(rec)
    styles.sort(key=lambda r: (r['class'], r['id']))
    for cls in 'CTG':
        ids = [int(r['id'][2:]) for r in styles if r['class'] == cls]
        if ids != list(range(1, len(ids) + 1)):
            errors.append(f'{cls} 类编号不连续或重复：应为 1–{len(ids)}')
    used = {r['image'] for r in styles if r['image']}
    for f in sorted(os.listdir(os.path.join(ROOT, 'images'))):
        if f.startswith('.'):
            continue
        if f'images/{f}' not in used:
            errors.append(f'images/{f}: 没有条目引用这张图')
    return styles, tags


def catalog(styles, tags):
    out = []
    by_class = {c: [r for r in styles if r['class'] == c] for c in 'CTG'}
    n_img = sum(1 for r in styles if r['image'])
    out.append(f'共 {len(styles)} 种（' + '，'.join(f'{CLASS_NAME[c]} {len(v)} 种' for c, v in by_class.items() if v)
               + f'），其中 {n_img} 种已有样片。点名字跳到条目。')
    out.append('')
    link = lambda r: f'[{r["id"]} {r["name"]}]({r["file"]}#{r["id"]})'
    out.append('| 题材 | 风格 |')
    out.append('|---|---|')
    for th in tags['themes']:
        items = [r for r in by_class['C'] if r['theme'] == th['name']]
        if items:
            out.append(f'| {th["name"]}（{len(items)}） | {" · ".join(map(link, items))} |')
    if by_class['T'] or by_class['G']:
        out.append('')
        out.append('T 类（公共领域素材）、G 类（AI 生成素材）按内容类型分，括号里是用到的素材：')
        out.append('')
        out.append('| 内容类型 | T 类：公共领域素材 | G 类：AI 生成素材 |')
        out.append('|---|---|---|')
        for ct in tags['content_types']:
            cells = [' · '.join(f'{link(r)}（{"、".join(r["materials"])}）' for r in by_class[c] if r['content_type'] == ct['name']) or '—'
                     for c in 'TG']
            if cells != ['—', '—']:
                out.append(f'| {ct["name"]} | {cells[0]} | {cells[1]} |')
    out.append('')
    out.append('按技术分的文件：' + ' · '.join(
        f'[{v["name"]}](styles/{k}.md)（{sum(1 for r in styles if r["layer"] == k)}）'
        for k, v in tags['files'].items() if any(r['layer'] == k for r in styles)))
    return '\n'.join(out)


def bundle_want():
    """仓库里要随 Skill 安装的文件：{在 Skill 里的相对路径: 内容}。不在本仓库里（Skill 单独安装）时返回 None"""
    if not all(os.path.isdir(os.path.join(REPO_ROOT, b)) for b in BUNDLE):
        return None
    try:
        out = subprocess.run(['git', '-C', REPO_ROOT, 'ls-files', '-z', '--', *BUNDLE], capture_output=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return None
    files = [f for f in out.decode('utf-8').split('\0') if f]
    keep = [f for f in files if f not in BUNDLE_SKIP_FILES and not f.lower().endswith(BUNDLE_SKIP_EXT)
            and not BUNDLE_SKIP_DIRS & set(f.split('/')[:-1]) and os.path.isfile(os.path.join(REPO_ROOT, f))]
    kept = set(keep)
    want = {}
    for f in keep:
        data = open(os.path.join(REPO_ROOT, f), 'rb').read()
        if f.endswith('.md'):
            data = relink(data.decode('utf-8'), f, kept).encode('utf-8')
        want[f] = data
    return want


def relink(text, src, kept):
    """拷进 Skill 的 .md 里的相对链接：目标也随 Skill 安装的，改成 Skill 里的相对路径；指向 Skill 本体的，改成相对 Skill；其余改成 GitHub 链接"""
    base = os.path.dirname(src)

    def fix(m):
        label, target = m.groups()
        if re.match(r'[a-z]+:', target) or target.startswith('#'):
            return m.group(0)
        path, sep, frag = target.partition('#')
        dest = os.path.normpath(os.path.join(base, path))
        if dest in kept or any(k.startswith(dest + '/') for k in kept):
            new = dest
        elif (dest + '/').startswith(SKILL_IN_REPO):
            new = dest[len(SKILL_IN_REPO):] or '.'
        else:                                     # 图片要用原始文件地址才显示得出来
            img = label.startswith('![') or (m.start() > 0 and m.string[m.start() - 1] == '!')
            return f'[{label}]({RAW_BASE if img else CODE_BASE}{dest}{sep}{frag})'
        rel = os.path.relpath(new, base) + ('/' if path.endswith('/') else '')
        return f'[{label}]({rel}{sep}{frag})'
    return MDLINK_RE.sub(fix, text)


def bundle_have():
    have = {}
    for b in BUNDLE:
        for d, dirs, files in os.walk(os.path.join(ROOT, b)):
            dirs[:] = [x for x in dirs if x not in ('node_modules', 'out', '__pycache__')]
            for f in files:
                p = os.path.join(d, f)
                have[os.path.relpath(p, ROOT).replace(os.sep, '/')] = p
    return have


def sync_bundle(check, errors):
    """把仓库的 samples/、packs/ 代码同步进 Skill；--check 时只核对"""
    want = bundle_want()
    if want is None:
        return None
    have = bundle_have()
    extra = sorted(set(have) - set(want))
    stale = sorted(f for f in want if f not in have or open(have[f], 'rb').read() != want[f])
    if check:
        if extra or stale:
            errors.append(f'Skill 里的 samples/、packs/ 和仓库不同步（{len(stale)} 个要更新、{len(extra)} 个多余，如 {(stale + extra)[0]}）：'
                          '先运行 python3 scripts/build_index.py')
        return len(want)
    for f in extra:
        os.remove(have[f])
    for f in stale:
        p = os.path.join(ROOT, f)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, 'wb').write(want[f])
    for b in BUNDLE:                              # 删掉同步后变空的目录
        for d, _, _ in sorted(os.walk(os.path.join(ROOT, b)), key=lambda x: -len(x[0])):
            if not os.listdir(d):
                os.rmdir(d)
    return len(want)


def check_links(errors):
    anchors = {}
    md_files = []
    for d, dirs, files in os.walk(ROOT):
        dirs[:] = [x for x in dirs if x not in ('node_modules', 'out', '__pycache__')]
        for f in files:
            if f.endswith('.md'):
                p = os.path.join(d, f)
                md_files.append(p)
                anchors[p] = set(re.findall(r'<a id="([^"]+)"></a>', open(p, encoding='utf-8').read()))
    for p in md_files:
        text = FENCE_RE.sub('', open(p, encoding='utf-8').read())
        for _, target in MDLINK_RE.findall(text):
            if re.match(r'[a-z]+:', target):
                continue
            path, _, frag = target.partition('#')
            dest = os.path.normpath(os.path.join(os.path.dirname(p), path)) if path else p
            rel = os.path.relpath(p, ROOT)
            if not os.path.exists(dest):
                errors.append(f'{rel}: 链接目标不存在 {target}')
            elif frag and dest.endswith('.md') and frag not in anchors.get(dest, set()):
                heads = {h.strip().lower().replace(' ', '-') for h in re.findall(r'^#+ (.+)$', open(dest, encoding='utf-8').read(), re.M)}
                if frag.lower() not in heads:
                    errors.append(f'{rel}: 锚点不存在 {target}')


def check_versions(errors):
    """SKILL.md 的 version 是正本；skills/ 下各家插件清单（.claude-plugin、.codex-plugin）的 version 要和它一致"""
    m = re.search(r'^version:\s*(\S+)', open(os.path.join(ROOT, 'SKILL.md'), encoding='utf-8').read().split('\n---', 1)[0], re.M)
    if not m:
        errors.append('SKILL.md: frontmatter 缺 version（WorkBuddy 上传要求）')
        return
    for d in ('.claude-plugin', '.codex-plugin'):
        f = os.path.join(os.path.dirname(ROOT), d, 'plugin.json')
        if os.path.exists(f):
            v = json.load(open(f, encoding='utf-8')).get('version')
            if v != m.group(1):
                errors.append(f'skills/{d}/plugin.json: version {v} 和 SKILL.md 的 {m.group(1)} 不一致')


def main():
    check = '--check' in sys.argv
    errors = []
    styles, tags = parse(errors)
    data = json.dumps({'count': len(styles), 'styles': styles}, ensure_ascii=False, indent=1) + '\n'
    index = open(INDEX_PATH, encoding='utf-8').read()
    if CAT_START not in index or CAT_END not in index:
        errors.append('index.md: 缺少风格目录的起止标记')
        new_index = index
    else:
        head, rest = index.split(CAT_START, 1)
        _, tail = rest.split(CAT_END, 1)
        new_index = f'{head}{CAT_START}\n{catalog(styles, tags)}\n{CAT_END}{tail}'
    if check:
        if not os.path.exists(JSON_PATH) or open(JSON_PATH, encoding='utf-8').read() != data:
            errors.append('data/styles.json 不是最新的：先运行 python3 scripts/build_index.py')
        if new_index != index:
            errors.append('index.md 的风格目录不是最新的：先运行 python3 scripts/build_index.py')
    else:
        open(JSON_PATH, 'w', encoding='utf-8').write(data)
        open(INDEX_PATH, 'w', encoding='utf-8').write(new_index)
    bundled = sync_bundle(check, errors)
    check_links(errors)
    check_versions(errors)
    if errors:
        print(f'发现 {len(errors)} 个问题：')
        for e in errors:
            print(' -', e)
        sys.exit(1)
    print(f'通过：{len(styles)} 种风格，{sum(1 for r in styles if r["image"])} 种已有样片' + ('' if check else '，已写入 data/styles.json 和 index.md 目录')
          + ('' if bundled is None else f'；随 Skill 安装的样片和风格包代码 {bundled} 个文件' + ('' if check else '已同步')))


if __name__ == '__main__':
    main()
