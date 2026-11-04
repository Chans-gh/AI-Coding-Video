---
name: ai-coding-video
description: 用代码逐帧做视频（Coding Video）的风格库与方法：上百种纯代码可实现的视觉风格（C 类，标题材和技术：Canvas 2D、WebGL、SVG、Three.js、p5.js、Manim、Remotion 等），以及用真实素材（T 类：录像、录屏、照片、数据）和 AI 生成素材（G 类：生图、生视频、语音合成）由代码剪辑合成的做法，按内容类型分（科普、口播、带货、宣传片、短剧、MV、新闻、纪录片、教程、旅行、体育、儿童绘本）；每种一句可复制的风格提示词；选风格的索引；提示词写法、素材的来源和处理、配乐与旁白指南；以及从“选风格”到“出样片”再到“沉淀成风格包”的三级流程。给视频定风格、写风格提示词、让 AI 写渲染代码出片、用素材做视频、问“有哪些风格 / 哪种适合 X”、配声音时使用。
version: 0.4.0
display_name: AI Coding Video 风格库
display_name_en: AI Coding Video
description_en: "A style library for videos made frame by frame in code: a hundred-plus styles that pure code can render (class C, tagged by topic and tech: Canvas 2D, WebGL, SVG, Three.js, p5.js, Manim, Remotion and more), plus ways to cut real material (class T: footage, screen recordings, photos, data) and AI-generated material (class G: images, video clips, speech) into a film with code, sorted by content type (explainers, talking heads, product ads, brand films, short dramas, music videos, news, documentaries, tutorials, travel, sports, picture books); a copy-ready style prompt for each; lookup indexes; guides to prompts, sourcing and preparing material, music and narration; and a three-level flow from picking a style to a sample clip to a reusable style pack."
---

# AI Coding Video：用代码做视频的风格库

内容和维护方法见 [README.md](README.md)。这份文件只讲 AI 助手怎么查、怎么用。

## 什么时候用

- 用户要给一支视频定风格，或问“有哪些风格 / 哪种风格适合 X”。
- 需要一句风格描述，去写画面提示词或直接写渲染代码（Canvas、WebGL、SVG、Three.js、Manim、Remotion 等）。
- 用户想先看看某种风格在自己项目里的效果（出样片），或想把选中的风格固定下来（做风格包）。
- 用户手上有录像、录屏、照片、数据，或者要用 AI 生图、生视频、语音合成做素材，想由代码剪成片子。
- 要给视频挑配乐、音效或中文旁白音色。

## 三级用法：从选风格到风格包

| 级别 | 做什么 | 产出 | 什么时候 |
|---|---|---|---|
| 0 级：词典 | 在本库里选 2–3 个候选，给出提示词和理由 | 候选清单 + 每个的风格提示词、技术路径 | 用户还没定风格 |
| 1 级：样片 | 把候选套上用户的品牌色、字体和真实内容，在用户项目自己的技术栈里跑 3–5 秒 | 横屏 16:9 和竖屏 9:16 各一段样片 + 抽帧拼图，给用户看 | 项目要换风格、加风格时，一次对话做完 |
| 2 级：风格包 | 用户通过的风格，覆盖这个项目常用的呈现方式（片头、讲解、数据、转场、字幕等） | 可复用的代码模块 + 写进项目规范的风格说明（调色板、字体、运动、声音、禁止项） | 1 级通过以后 |

每一级都要用户点头再进下一级。1 级样片之前先确认这条技术路径在用户项目里跑得通（有没有浏览器、GPU、Python 环境等）。

## 怎么查（按顺序，不要一上来读全部）

1. **不知道用哪种** → 先分清三类：画面全部由代码算出（C 类）、用真实素材（T 类）、用 AI 生成素材（G 类）。用户说了要做哪种视频（口播、带货、MV、新闻……）就先查 `index.md` 的「按内容类型」表，T、G 两列对照着给；要纯代码的，在其余索引表（题材、业务用途、受众、情绪、平台与格式、素材与条件）里各找对应的一行，几张表里重复出现的是首选。给用户 2–3 个候选并说明理由。
2. **已知风格名或编号** → 在 `index.md` 的「风格目录」里找到编号（如 `C-013`、`T-007`），打开对应的 `styles/*.md`（C 类按技术分文件，T 类在 `styles/footage.md`，G 类在 `styles/generated.md`），按锚点 `#C-013` 定位条目。
3. **要写完整提示词或渲染代码** → 读 `prompting.md`：8 个控制要点、通用模板、制作路径、示例、常见翻车与对策。
4. **要按技术筛选**（例如“只用 SVG”“要 Three.js 的”）→ 读 `tags.md` 和 `data/styles.json`，每条有 `id / name / theme / content_type / materials / fit / prompt / layer / suggested / verified / render_code / pack / refs`（C 类有 theme，T、G 类有 content_type 和 materials）。
5. **要配声音** → 读 `sound.md`：先按题材定配乐和音效，再按用途挑旁白音色。
6. **要用素材（T 类、G 类）** → 读 `materials.md`：素材从哪来、许可怎么查、怎么生成、怎么统一处理再交给代码、声音怎么配。
7. **要出样片（1 级）或做风格包（2 级）** → 读 `making.md`：动手前的检查、样片写法和自检、风格包的五条做法和 STYLE.md 写什么。
8. **要写渲染代码** → 先看本 Skill 自带的代码：`samples/API.md`（样片骨架和函数速查）、`samples/<编号>/`（每个已验证风格的 `scene.js`、`sound.py`）、`packs/<名字>/`（风格包）。条目「样片代码」「风格包」链接文字里的路径就是它在本 Skill 目录里的位置，不用联网去 GitHub 取。

## 取用规则

- 条目里 `text` 代码块就是那句风格提示词，原样使用，再按 `prompting.md` 的模板补上主题、规格、声音和流程。
- 「技术（已验证）」表示本库仓库里有能跑出样片的代码；「技术（建议）」只是推荐写法，没验证过，向用户说明时要分清。
- 只写风格名会退化成通用扁平风：必须带 3–5 个标志元素、禁止项和参考作品。
- 参考作品只学构图、节奏、配色逻辑，不照搬角色、Logo、音乐。名字带作品或作者的「致敬风格」（如 C-187 吉卜力式）也一样：只学画法，角色、场景、标志、台词全部原创。
- 提示词只定方向，同一句话每次出来的画面不会一模一样。要复现同一个效果，用「技术（已验证）」条目的样片代码改，不要只靠提示词，也不要从零重新设计：先把 `samples/<编号>/` 拷到用户项目里跑通，再换内容（做法见 `making.md`「1 级：样片」）。有「风格包」的直接用包。
- 样片代码给的是**管线和画法**，不是内容：出片管线（`lib.js`、`synth.py`、`batch.py`）照用；镂空、光影、纹理这类画法可以借；样片里的角色、构图、配色、文字不能原样搬进用户的片子，换成用户自己的题材和品牌。
- 案例里的工具链、费用、用时是原作者自述，未经核实，不要当成保证向用户承诺。
- C 类画面全部由代码算出，不用任何素材。写实人脸、真人口播这类效果纯代码做不到，改走 T 类（用户自己的素材）或 G 类（AI 生成素材），并告诉用户要准备什么。
- T 类只用用户确认有权用的素材，或公共领域、开放许可的素材，出处和许可逐份记下；G 类可以用任何一家生图、生视频、语音合成服务，按 [materials.md「配置生成服务」](materials.md#配置生成服务) 配好；哪一类没配置，先告诉用户要配什么，不需要生成的部分照常做；不生成真实人物，不克隆真人声音。

## 改内容

新增或修改风格的步骤见 [README.md](README.md) 的「维护」。改完必须运行并通过：

```bash
python3 scripts/build_index.py          # 由 styles/*.md 生成 data/styles.json 和 index.md 的风格目录
python3 scripts/build_index.py --check  # 编号、标签、图片、链接、目录一致性
```

编号只增不改；`data/styles.json` 和风格目录是生成物，不要手改。
