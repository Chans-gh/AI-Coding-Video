# AI Coding Video 风格库

用代码逐帧做视频时，选风格、写风格提示词、配声音用的资料库。画面可以全部由代码算出（C 类），也可以由代码剪辑真实素材（T 类）或 AI 生成的素材（G 类）。每种风格有一句可直接复制的风格提示词和适合的场景；C 类标题材和技术，T、G 类标内容类型和用到的素材。已经做过样片的，还配有样片和能复现它的代码。

给 AI 助手用时见 [SKILL.md](SKILL.md)。

## 里面有什么

| 路径 | 内容 |
|---|---|
| [`index.md`](index.md) | 风格目录（C 类按题材，T、G 类按内容类型）+ 选风格索引表（题材、业务用途、受众、情绪、平台与格式、素材与条件） |
| [`styles/`](styles/) | 风格条目。C 类按「画在哪」分文件：Canvas 2D、WebGL、SVG 与 HTML/CSS、终端字符、外部程序、视频框架；T 类在 `footage.md`，G 类在 `generated.md` |
| [`tags.md`](tags.md) | 技术标签体系：7 层标签各是什么、怎么标 |
| [`prompting.md`](prompting.md) | 提示词怎么写（8 个要点 + 通用模板）、制作路径、示例、常见翻车与对策 |
| [`materials.md`](materials.md) | 用素材做视频（T 类、G 类）：素材从哪来、许可、生成、统一处理、声音 |
| [`sound.md`](sound.md) | 配乐与音效按题材匹配；Kokoro-82M v1.1-zh 的 100 个中文音色和选音色建议、调用代码 |
| [`making.md`](making.md) | 出样片（1 级）和做风格包（2 级）：动手前的检查、样片写法和自检、风格包的做法和风格说明写什么 |
| [`film.md`](film.md) | 完整出片的六步（定内容 → 拆分镜与样式 → 逐字稿 → 用户确认 → 典型样片 → 渲染整片），分镜 `storyboard.json` 和逐字稿 `script.json` 的格式、事实的规矩 |
| [`storyboard.md`](storyboard.md) | 接内容策划（[ai-content-planner](https://github.com/Chans-gh/AI-content-planner)，交接格式 2）：认格式和状态、读什么、`seg` 和 `ref` 怎么填、缺内容怎么回流 |
| [`samples/`](samples/)、[`packs/`](packs/) | 已验证风格的样片代码和出片工具、风格包代码（从本仓库根目录的 `samples/`、`packs/` 同步来，生成物，不要手改） |
| [`sources.md`](sources.md) | 风格条目的来源，以及可以直接安装的其他风格库 |
| [`legacy-ids.md`](legacy-ids.md) | 旧编号对照 |
| [`CHANGELOG.md`](CHANGELOG.md) | 更新记录 |
| [`images/`](images/) | 样片缩略图，文件名 = 风格编号（只有做过样片的风格才有） |
| [`data/styles.json`](data/styles.json) | 所有风格的机器可读索引（生成物，不要手改） |
| [`data/tags.json`](data/tags.json) | 技术标签、题材、内容类型、素材种类的合法取值 |
| [`scripts/build_index.py`](scripts/build_index.py) | 生成 `styles.json` 和风格目录，并做完整性自检 |
| [`scripts/check_storyboard.py`](scripts/check_storyboard.py) | 完整出片的通用检查：分镜和逐字稿对得上、样式、全片统一、事实的出处；`--ready` 查用户确认过了，`--table` 打印分镜表，见 [film.md「检查」](film.md#检查) |
| [`scripts/check_plan.py`](scripts/check_plan.py) | 接策划时的检查：认交接格式和状态，查分镜、逐字稿的段号和事实编号，通用的部分调 `check_storyboard.py`；离线测试在 `scripts/tests/`（`python3 -m unittest discover -s scripts/tests`），`build_index.py --check` 一并跑 |

## 分类与编号

- **C 类：纯代码。** 画面全部由代码算出，不用任何素材，编号 `C-001` 起，按题材分。
- **T 类：真实素材。** 录像（含口播）、录屏、照片、数据（表格、地图、卫星图、点云）、三维模型，由代码剪辑合成，编号 `T-001` 起。本库样片只用公共领域素材。
- **G 类：AI 生成素材。** 生图、生视频、语音合成，也可以搭配 T 类的公开素材（如 CC0 三维模型），由代码剪辑合成，编号 `G-001` 起。

T 类、G 类按内容类型分（用户要做哪种视频），两类共用 `data/tags.json` 的 `content_types`；每个条目标出用到的素材种类。

编号只增不改，和放在哪个文件无关。

## 怎么用

分两条线，每一步都要用户点头才往下：

| 线 | 步骤 | 读哪份 |
|---|---|---|
| 风格演示 | 0 级 选样式 → 1 级 出样片（3–5 秒） → 2 级 风格包 | 下面 1–6、[`making.md`](making.md) |
| 完整出片 | 定内容 → 拆分镜与样式 → 逐字稿 → 用户确认 → 典型样片（含配音） → 渲染整片 | [`film.md`](film.md)；有策划时另读 [`storyboard.md`](storyboard.md) |

1. **不知道用哪种**：知道要做哪种视频（口播、带货、MV……）就看 [`index.md`](index.md) 的「按内容类型」表；要纯代码的，在其余索引表里各找对应的一行，几张表里重复出现的风格就是首选。
2. **已经知道风格名**：在 [`index.md`](index.md) 的「风格目录」里点名字，跳到条目。
3. **取提示词**：复制条目里的那句风格提示词，填进 [`prompting.md`](prompting.md) 的通用模板；按条目的技术标签选制作路径。
4. **配声音**：先在 [`sound.md`](sound.md) 按题材定配乐，再按用途挑旁白音色。
5. **用素材**：按 [`materials.md`](materials.md) 找素材、查许可、生成和处理。
6. **出样片、做风格包**：按 [`making.md`](making.md)；有「样片代码」「风格包」的条目，先把本 Skill 里的 `samples/<编号>/` 或 `packs/<名字>/` 拷进项目跑通，再改。

## 使用须知

- 风格提示词是起点，不是保证。只写风格名常常退化成通用扁平风，写法见 [`prompting.md`](prompting.md)。
- 「技术（已验证）」才有样片和代码；「技术（建议）」是推荐写法，没有验证过。
- 参考链接里案例的制作方式（工具链、费用、用时）多为作者自述，未经独立核实。
- 风格提示词是整理者用自己的话写的，来源见 [`sources.md`](sources.md)；本库不收录任何来源的图片，缩略图都由本仓库的代码渲染（T 类样片里的公共领域素材也经本仓库的代码合成）。

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

   题材和技术标签只能用 [`data/tags.json`](data/tags.json) 里有的；要加新标签，先在 `tags.json` 登记（标签不是英文的，在 `tags_en` 里配上英文名）。

   T 类、G 类的条目不写「题材」，改写「内容类型」和「素材」（素材之间用 ` · ` 隔开），取值同样在 `tags.json`：

   ```markdown
   - 内容类型：新闻资讯解说
   - 素材：照片 · 数据
   ```

   有样片的 T、G 类条目，`--check` 还会核对 `samples/<编号>/assets.json`：每份素材有出处和许可（生成的有模型和提示词），文件都在，合计不超过 10 MB，「素材」和实际用到的一致。

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

## 维护：版本号

版本号以 `SKILL.md` 开头的 `version` 为准（WorkBuddy 上传时要求有这一项）。改版本时，同步改 `skills/.claude-plugin/plugin.json` 和 `skills/.codex-plugin/plugin.json` 里的 `version`，`--check` 会核对三处是否一致。
