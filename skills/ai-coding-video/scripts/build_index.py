#!/usr/bin/env python3
"""风格库的生成与自检。只用 Python 标准库；路径一律相对于本脚本所在位置。

    python3 scripts/build_index.py           # 由 styles/*.md 生成 data/styles.json 和 index.md 的风格目录
    python3 scripts/build_index.py --check   # 只校验、不写文件；有问题时退出码为 1

数据源是 styles/*.md；data/styles.json 和 index.md 里 <!-- catalog --> 之间的目录都是生成物，不要手改。
技术标签和题材的合法取值在 data/tags.json。
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STYLES_DIR = os.path.join(ROOT, 'styles')
JSON_PATH = os.path.join(ROOT, 'data', 'styles.json')
TAGS_PATH = os.path.join(ROOT, 'data', 'tags.json')
INDEX_PATH = os.path.join(ROOT, 'index.md')
# 样片代码、风格包放在仓库里 Skill 文件夹之外；条目里写成指向 GitHub 的链接，Skill 单独装进别的项目也能点开。
# 仓库地址只记在这里，samples/tools/mark.py 从这里取。
CODE_BASE = 'https://github.com/Chans-gh/AI-Coding-Video/tree/main/'
REPO_ROOT = os.path.dirname(os.path.dirname(ROOT))  # 在本仓库里时才有 samples/、packs/，单独安装时跳过存在性检查
CAT_START, CAT_END = '<!-- catalog:start -->', '<!-- catalog:end -->'

ENTRY_RE = re.compile(r'<a id="([CTG]-\d{3})"></a>\s*\n\s*\n## ([CTG]-\d{3}) (.+?)\n(.*?)(?=\n<a id="[CTG]-\d{3}"></a>|\Z)', re.S)
IMG_RE = re.compile(r'^!\[[^\]]*\]\(\.\./images/([^)]+)\)', re.M)
CODE_RE = re.compile(r'```text\n(.*?)\n```', re.S)
FIELD_RE = re.compile(r'^- ([^：\n]+)：(.*)$', re.M)
MDLINK_RE = re.compile(r'\[([^\]]+)\]\(([^)\s]+)\)')
FENCE_RE = re.compile(r'^( *)(`{3,})[^\n]*\n.*?^\1\2[ \t]*$', re.S | re.M)
FIELDS = {'题材': 'theme', '适合': 'fit', '技术（已验证）': 'verified', '技术（建议）': 'suggested',
          '样片代码': 'render_code', '风格包': 'pack', '参考': 'refs'}
REPO_LINKS = {'render_code': 'samples/', 'pack': 'packs/'}
CLASS_NAME = {'C': '纯代码', 'T': '第三方素材', 'G': 'AI 生成素材'}


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


def parse(errors):
    tags = json.load(open(TAGS_PATH, encoding='utf-8'))
    themes = [t['name'] for t in tags['themes']]
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
                   'theme': '', 'fit': '', 'verified': [], 'suggested': [], 'render_code': None, 'pack': None, 'refs': []}
            for key, value in FIELD_RE.findall(FENCE_RE.sub('', body)):
                if key not in FIELDS:
                    errors.append(f'{where}: 不认识的字段「{key}」')
                    continue
                k = FIELDS[key]
                if k in ('verified', 'suggested'):
                    rec[k] = split_tags(value)
                elif k == 'refs':
                    rec[k] = [{'label': a, 'url': b} for a, b in MDLINK_RE.findall(value)]
                elif k in REPO_LINKS:
                    rec[k] = repo_link(value, REPO_LINKS[k], f'{where}「{key}」', errors)
                else:
                    rec[k] = value.strip()
            if rec['theme'] not in themes:
                errors.append(f'{where}: 题材「{rec["theme"]}」不在 tags.json 的 themes 里')
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
    out.append('| 题材 | 风格 |')
    out.append('|---|---|')
    for th in tags['themes']:
        items = [r for r in styles if r['theme'] == th['name']]
        if items:
            cells = ' · '.join(f'[{r["id"]} {r["name"]}]({r["file"]}#{r["id"]})' for r in items)
            out.append(f'| {th["name"]}（{len(items)}） | {cells} |')
    out.append('')
    out.append('按技术分的文件：' + ' · '.join(
        f'[{v["name"]}](styles/{k}.md)（{sum(1 for r in styles if r["layer"] == k)}）'
        for k, v in tags['files'].items() if any(r['layer'] == k for r in styles)))
    return '\n'.join(out)


def check_links(errors):
    anchors = {}
    md_files = []
    for d, _, files in os.walk(ROOT):
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
    check_links(errors)
    check_versions(errors)
    if errors:
        print(f'发现 {len(errors)} 个问题：')
        for e in errors:
            print(' -', e)
        sys.exit(1)
    print(f'通过：{len(styles)} 种风格，{sum(1 for r in styles if r["image"])} 种已有样片' + ('' if check else '，已写入 data/styles.json 和 index.md 目录'))


if __name__ == '__main__':
    main()
