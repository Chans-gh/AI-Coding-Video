---
name: ai-coding-video
description: 用代码逐帧做动画视频（Coding Video）的风格库与方法：上百种纯代码可实现的视觉风格，每种一句可复制的风格提示词、题材和技术标签（Canvas 2D、WebGL、SVG、Three.js、p5.js、Manim、Remotion 等）；按题材、用途、受众、情绪、平台、素材选风格的索引；提示词写法、制作路径、配乐与中文旁白音色指南；以及从“选风格”到“出样片”再到“沉淀成风格包”的三级流程。给视频定风格、写风格提示词、让 AI 写渲染代码出片、问“有哪些风格 / 哪种适合 X”、配声音时使用。
version: 0.1.0
display_name: AI Coding Video 风格库
display_name_en: AI Coding Video
description_en: "A style library for videos animated frame by frame in code: a hundred-plus visual styles that pure code can render, each with a copy-ready style prompt plus topic and tech tags (Canvas 2D, WebGL, SVG, Three.js, p5.js, Manim, Remotion and more); indexes for choosing a style by topic, purpose, audience, mood, platform and assets; guides to writing prompts, production paths, music and Chinese voice-over; and a three-level flow from picking a style to a sample clip to a reusable style pack."
---

# AI Coding Video：纯代码动画视频风格库

内容和维护方法见 [README.md](README.md)。这份文件只讲 AI 助手怎么查、怎么用。

## 什么时候用

- 用户要给一支视频定风格，或问“有哪些风格 / 哪种风格适合 X”。
- 需要一句风格描述，去写画面提示词或直接写渲染代码（Canvas、WebGL、SVG、Three.js、Manim、Remotion 等）。
- 用户想先看看某种风格在自己项目里的效果（出样片），或想把选中的风格固定下来（做风格包）。
- 要给视频挑配乐、音效或中文旁白音色。

## 三级用法：从选风格到风格包

| 级别 | 做什么 | 产出 | 什么时候 |
|---|---|---|---|
| 0 级：词典 | 在本库里选 2–3 个候选，给出提示词和理由 | 候选清单 + 每个的风格提示词、技术路径 | 用户还没定风格 |
| 1 级：样片 | 把候选套上用户的品牌色、字体和真实内容，在用户项目自己的技术栈里跑 3–5 秒 | 横屏 16:9 和竖屏 9:16 各一段样片 + 抽帧拼图，给用户看 | 项目要换风格、加风格时，一次对话做完 |
| 2 级：风格包 | 用户通过的风格，覆盖这个项目常用的呈现方式（片头、讲解、数据、转场、字幕等） | 可复用的代码模块 + 写进项目规范的风格说明（调色板、字体、运动、声音、禁止项） | 1 级通过以后 |

每一级都要用户点头再进下一级。1 级样片之前先确认这条技术路径在用户项目里跑得通（有没有浏览器、GPU、Python 环境等）。

## 怎么查（按顺序，不要一上来读全部）

1. **不知道用哪种** → 读 `index.md`，在六张索引表（题材、业务用途、受众、情绪、平台与格式、素材与条件）里各找对应的一行，几张表里重复出现的是首选。给用户 2–3 个候选并说明理由。
2. **已知风格名或编号** → 在 `index.md` 的「风格目录」里找到编号（如 `C-013`），打开对应的 `styles/<技术>.md`，按锚点 `#C-013` 定位条目。
3. **要写完整提示词或渲染代码** → 读 `prompting.md`：8 个控制要点、通用模板、制作路径、示例、常见翻车与对策。
4. **要按技术筛选**（例如“只用 SVG”“要 Three.js 的”）→ 读 `tags.md` 和 `data/styles.json`，每条有 `id / name / theme / fit / prompt / layer / suggested / verified / render_code / pack / refs`。
5. **要配声音** → 读 `sound.md`：先按题材定配乐和音效，再按用途挑旁白音色。
6. **要出样片（1 级）或做风格包（2 级）** → 读 `making.md`：动手前的检查、样片写法和自检、风格包的五条做法和 STYLE.md 写什么。

## 取用规则

- 条目里 `text` 代码块就是那句风格提示词，原样使用，再按 `prompting.md` 的模板补上主题、规格、声音和流程。
- 「技术（已验证）」表示本库仓库里有能跑出样片的代码；「技术（建议）」只是推荐写法，没验证过，向用户说明时要分清。
- 只写风格名会退化成通用扁平风：必须带 3–5 个标志元素、禁止项和参考作品。
- 参考作品只学构图、节奏、配色逻辑，不照搬角色、Logo、音乐。名字带作品或作者的「致敬风格」（如 C-187 吉卜力式）也一样：只学画法，角色、场景、标志、台词全部原创。
- 提示词只定方向，同一句话每次出来的画面不会一模一样。要复现同一个效果，用「技术（已验证）」条目的样片代码改（条目里「样片代码」是指向本库 GitHub 的链接；有「风格包」链接的直接用包），不要只靠提示词。
- 案例里的工具链、费用、用时是原作者自述，未经核实，不要当成保证向用户承诺。
- 本库只收纯代码风格（C 类）：画面全部由代码算出，不用 AI 生图生视频，不用第三方图片素材。用户要写实人脸、真人口播改编这类效果时，如实说明纯代码做不到，需要别的路径。

## 改内容

新增或修改风格的步骤见 [README.md](README.md) 的「维护」。改完必须运行并通过：

```bash
python3 scripts/build_index.py          # 由 styles/*.md 生成 data/styles.json 和 index.md 的风格目录
python3 scripts/build_index.py --check  # 编号、标签、图片、链接、目录一致性
```

编号只增不改；`data/styles.json` 和风格目录是生成物，不要手改。
