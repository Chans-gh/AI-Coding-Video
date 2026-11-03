# AI Coding Video 风格库

用代码逐帧做动画视频时，选风格、写风格提示词、配声音用的资料库。每种风格有一句可直接复制的风格提示词、题材、适合的场景和技术标签；已经做过样片的，还配有样片和能复现它的代码。

给 AI 助手用时见 [SKILL.md](SKILL.md)。

## 里面有什么

| 路径 | 内容 |
|---|---|
| [`index.md`](index.md) | 风格目录（按题材）+ 六张选风格索引表（题材、业务用途、受众、情绪、平台与格式、素材与条件） |
| [`styles/`](styles/) | 风格条目，按「画在哪」分文件：Canvas 2D、WebGL、SVG 与 HTML/CSS、终端字符、外部程序、视频框架 |
| [`tags.md`](tags.md) | 技术标签体系：7 层标签各是什么、怎么标 |
| [`prompting.md`](prompting.md) | 提示词怎么写（8 个要点 + 通用模板）、制作路径、示例、常见翻车与对策 |
| [`sound.md`](sound.md) | 配乐与音效按题材匹配；Kokoro-82M v1.1-zh 的 100 个中文音色和选音色建议、调用代码 |
| [`making.md`](making.md) | 出样片（1 级）和做风格包（2 级）：动手前的检查、样片写法和自检、风格包的做法和风格说明写什么 |
| [`sources.md`](sources.md) | 风格条目的来源，以及可以直接安装的其他风格库 |
| [`legacy-ids.md`](legacy-ids.md) | 旧编号对照 |
| [`CHANGELOG.md`](CHANGELOG.md) | 更新记录 |
| [`images/`](images/) | 样片缩略图，文件名 = 风格编号（只有做过样片的风格才有） |
| [`data/styles.json`](data/styles.json) | 所有风格的机器可读索引（生成物，不要手改） |
| [`data/tags.json`](data/tags.json) | 技术标签、题材的合法取值 |
| [`scripts/build_index.py`](scripts/build_index.py) | 生成 `styles.json` 和风格目录，并做完整性自检 |

## 分类与编号

- **C 类：纯代码。** 画面全部由代码算出，不用 AI 生图生视频，不用第三方图片素材。本库目前只收这一类，编号 `C-001` 起。
- **T 类：要第三方或自备素材**（照片、录屏、口播原片、真实数据），以后收录。
- **G 类：要 AI 生图或生视频的素材**，以后收录。

编号只增不改，和放在哪个文件无关。

## 怎么用

1. **不知道用哪种**：在 [`index.md`](index.md) 的六张索引表里各找对应的一行，几张表里重复出现的风格就是首选。
2. **已经知道风格名**：在 [`index.md`](index.md) 的「风格目录」里点名字，跳到条目。
3. **取提示词**：复制条目里的那句风格提示词，填进 [`prompting.md`](prompting.md) 的通用模板；按条目的技术标签选制作路径。
4. **配声音**：先在 [`sound.md`](sound.md) 按题材定配乐，再按用途挑旁白音色。
5. **出样片、做风格包**：按 [`making.md`](making.md)；有「样片代码」「风格包」链接的条目，从那份代码改。

## 使用须知

- 风格提示词是起点，不是保证。只写风格名常常退化成通用扁平风，写法见 [`prompting.md`](prompting.md)。
- 「技术（已验证）」才有样片和代码；「技术（建议）」是推荐写法，没有验证过。
- 参考链接里案例的制作方式（工具链、费用、用时）多为作者自述，未经独立核实。
- 风格提示词是整理者用自己的话写的，来源见 [`sources.md`](sources.md)；本库不收录任何来源的图片。

## 维护：新增一种风格

1. 按「画在哪」选好 `styles/` 里的文件，在末尾追加一个条目，编号接着本类现有最大编号往后排（不要改旧编号）：

   ````markdown
   <a id="C-106"></a>

   ## C-106 风格名

   ```text
   用【风格名】风格：……一句可直接复制的风格提示词……
   ```

   - 题材：手绘与绘画
   - 适合：场景 A、场景 B、场景 C
   - 技术（建议）：Canvas 2D · p5.js
   - 参考：[链接文字](https://…) · [链接文字](https://…)
   ````

   题材和技术标签只能用 [`data/tags.json`](data/tags.json) 里有的；要加新标签，先在 `tags.json` 登记。

2. 做了样片的条目，在标题下面加缩略图，并补两行；做了风格包的再补一行「风格包」。这几行由 `samples/tools/mark.py` 写，不用手写：

   ```markdown
   ![风格名](../images/C-106.jpg)

   - 技术（已验证）：Canvas 2D · Playwright · ffmpeg
   - 样片代码：[samples/C-106/](https://github.com/Chans-gh/AI-Coding-Video/tree/main/samples/C-106)
   - 风格包：[packs/名字/](https://github.com/Chans-gh/AI-Coding-Video/tree/main/packs/名字)
   ```

   样片和风格包的代码在仓库里 Skill 文件夹之外，所以写成 GitHub 链接，Skill 单独装进别的项目也能点开；仓库地址只在 `scripts/build_index.py` 的 `CODE_BASE` 里改。

   缩略图存成 `images/C-106.jpg`（JPEG，宽 640 以内，100 KB 以内），必须由本仓库的代码渲染。

3. 需要的话，把它补进 [`index.md`](index.md) 的索引表。
4. 改文件标题里的「（N 种）」，在 [`CHANGELOG.md`](CHANGELOG.md) 记一行。
5. 运行自检，通过后再提交：

   ```bash
   python3 scripts/build_index.py
   python3 scripts/build_index.py --check
   ```
