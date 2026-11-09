# AI Coding Video：让 AI 编程助手写代码做视频的风格库和 Agent Skill

> **Code-driven video style library and Agent Skill** for Claude Code, Codex, DeepSeek Harness and other AI coding agents: 100+ video styles with copy-ready style prompts, reproducible sample code (Canvas, WebGL, SVG, Three.js), and long-form case studies. [English ↓](#english)

**[在线介绍页：看样片、选风格](https://chans-gh.github.io/AI-Coding-Video/)** · [真实应用案例](https://chans-gh.github.io/AI-Coding-Video/#cases) · [安装](#安装) · [风格目录](skills/ai-coding-video/index.md) · [样片](samples/) · [风格包](packs/)

**Coding Video**：让 AI 写代码，由代码逐帧算出画面来做视频，每一帧都由程序在时间 t 上确定地画出来。画面可以全部由代码算出（C 类），也可以由代码排版、剪辑真实素材（T 类）或 AI 生成的素材（G 类），见 [materials.md](skills/ai-coding-video/materials.md)。

这个仓库是一个给 AI 助手用的 Skill：上百种纯代码能做出来的视觉风格，加上按内容类型（口播、带货、MV、新闻……）整理的素材做法，每种一句可复制的风格提示词和技术标签，配上选风格索引、提示词方法、配乐与中文旁白音色指南。Claude Code、Codex、DeepSeek Harness、WorkBuddy 等支持 Agent Skills（`SKILL.md`）格式的助手都能直接装。

## 能拿来做什么

- **短视频和动效**：知识科普、产品广告和带货、新闻资讯解说、课件和培训、数据可视化、片头片尾、音乐 MV、竖屏短视频（抖音、视频号、小红书、Reels、Shorts）。
- **选风格**：按题材、用途、受众、情绪、平台在[风格目录和索引](skills/ai-coding-video/index.md)里挑，每种附一句风格提示词和技术标签，可以直接贴给 AI。
- **出片**：有样片的风格带可复现的渲染代码（浏览器里逐帧渲染，Playwright 截帧，ffmpeg 合成，配乐和音效由代码合成），横屏 16:9、竖屏 9:16 各一版；也可以换成你项目里的 Remotion、Motion Canvas 等管线。
- **三类画面混用**：纯代码画（Canvas 2D、WebGL、SVG、HTML/CSS、Three.js），公共领域和 CC0 真实素材的加工（录像对齐、深度视差、逐词转写切金句、讲义转片），AI 生图、生视频、语音合成的素材再由代码排版。
- **完整案例**：[cases/](cases/README.md) 里是约 5 分钟的完整视频，从分镜、代码、素材清单到实际用时和生成用量都公开，在介绍页里边看边对照每一段用了什么技术。

## 两条线

| 线 | 步骤 | 示范在哪 |
|---|---|---|
| 风格演示：看看效果、挑风格、定一套风格 | 0 级 选样式（全部风格的提示词、题材、技术标签、选风格索引）→ 1 级 出样片（C 类 3–5 秒，T 类、G 类 8–15 秒并附素材，横竖各一版，附可复现的代码）→ 2 级 风格包（可换品牌色等的代码模块，覆盖片头、讲解、数据、转场等常用呈现） | [`skills/ai-coding-video/`](skills/ai-coding-video/)、[`samples/`](samples/)、[`packs/`](packs/)（现有的见 [packs/README.md](packs/README.md)） |
| 完整出片：做一支几分钟的片子 | 定内容 → 拆分镜与样式 → 逐字稿 → 你确认 → 典型样片（含配音）→ 渲染整片，做法见 [film.md](skills/ai-coding-video/film.md) | [`cases/`](cases/README.md) |

Skill 里写的是指引：AI 助手会按这两条线，在你自己的项目里帮你选风格、出样片、沉淀成风格包，或从内容一路做到整片。本仓库的样片、风格包和[真实应用案例](cases/README.md)是示范。进度见 [PLAN.md](PLAN.md)。

## 安装

内容还没想好的，可以先装 [AI-content-planner](https://github.com/Chans-gh/AI-content-planner) 做策划，再用本 Skill 出片。策划也在本仓库的市场里，加完市场多装一条即可（下面带「可选」的那行）。不装也行，本 Skill 单独就能选风格、出样片、做片子。

**Claude Code**（插件市场）：

```bash
claude plugin marketplace add chans-gh/AI-Coding-Video
claude plugin install ai-coding-video@ai-coding-video
claude plugin install ai-content-planner@ai-coding-video   # 可选：内容策划
```

**Codex**（插件市场）：

```bash
codex plugin marketplace add chans-gh/AI-Coding-Video
codex plugin add ai-coding-video@ai-coding-video
codex plugin add ai-content-planner@ai-coding-video   # 可选：内容策划
```

**其他助手**（拷贝 Skill 文件夹）：先 `git clone` 本仓库，再运行：

```bash
scripts/install.sh claude   # → ~/.claude/skills/ai-coding-video
scripts/install.sh codex    # → ~/.agents/skills/ai-coding-video（Codex 不走插件时用；DeepSeek Harness 也读这里）
scripts/install.sh dsh      # → ~/.dsh/skills/ai-coding-video（DeepSeek Harness）
scripts/install.sh all      # 以上三处都装
scripts/install.sh dsh ~/my-project     # 只装进某个项目（→ ~/my-project/.dsh/skills）
scripts/install.sh zip      # 打成 dist/ai-coding-video.zip，用于 WorkBuddy 等“上传技能包”的助手
```

装好以后直接问：“给一支讲水循环的 60 秒科普片选个风格”“用 C-013 皮影戏的风格写一段 Canvas 动画”。

## 在各家助手里用：实际情况和注意事项

### 装进去的是什么

不管走插件还是拷文件夹，装的都是 `skills/ai-coding-video/` 这一个文件夹：

- **词典**：全部风格条目、索引、缩略图，以及提示词、素材、声音、出样片的指南。只选风格、写提示词，用这些就够了，不用跑任何代码。
- **样片和风格包代码**：Skill 里的 `samples/`、`packs/`，即出片工具（`lib.js`、`synth.py`、`batch.py`）、每个已验证风格的 `scene.js` 和 `sound.py`，以及风格包。由仓库根目录的 `samples/`、`packs/` 同步而来。
- **不带的**：成片视频（在 GitHub Release）、样片截图（Skill 里只有每种风格一张缩略图）、T 类和 G 类的素材文件（只带素材清单 `assets.json`）。

### 要出片，本机还得有

Node.js 18 以上、Python 3（Playwright 并装好 Chromium、Pillow、numpy、scipy）和 ffmpeg。第一次 `npm install` 要联网下载字体和绘图库，之后出片不联网。具体步骤见 [making.md「自带的出片工具」](skills/ai-coding-video/making.md#自带的出片工具)。助手会先把样片拷进你的项目再改，不在 Skill 安装目录里动手。

### 约束和自由

| | 约束（Skill 要求助手照做） | 自由（你和助手自己定） |
|---|---|---|
| 风格 | 用条目里那句提示词；带上 3–5 个标志元素和禁止项 | 从全部风格里挑，可以混搭；只有「技术（建议）」的条目没有样片，画法完全自己写 |
| 代码 | 有样片的风格，先拷样片跑通再改；出片管线照用；每帧只由时间 t 决定；横竖两版分别构图 | 用你项目已有的管线（Remotion、Motion Canvas 等）也行，样片只当画法参考 |
| 内容 | 样片里的角色、构图、配色、文字不能原样搬 | 题材、主体、文案、品牌色、字体、时长、节奏都是你的 |
| 流程 | 风格演示：0 级选样式 → 1 级样片 → 2 级风格包；完整出片：定内容 → 分镜与样式 → 逐字稿 → 你确认 → 典型样片 → 整片。每一步你点头才往下 | 停在哪一步都行 |

提示词只定方向，同一句话每次出来的画面都不一样；模型越弱，越要靠样片代码兜底。本仓库的样片是在维护者的环境里反复调出来的，助手在你项目里第一次做出来的，通常要再改几轮才能到这个水平。

### Claude Code

- 安装：插件市场（见上），或 `scripts/install.sh claude`（→ `~/.claude/skills/`，或项目里的 `.claude/skills/`）。
- 出片要跑 `npm`、`python3`、`ffmpeg`，第一次会弹权限确认，按需允许。
- 云端会话（claude.ai/code）的容器里已有 Chromium 和 Playwright，`npm install` 走环境的网络策略；网络被限制时要在环境设置里放开 npm 源。

### Codex

- 安装：插件市场（见上），或 `scripts/install.sh codex`（→ `~/.agents/skills/`）。
- 维护者实测过 Codex CLI 能发现并加载本 Skill；用 Codex 实际出片还没有实测，下面是按它的工作方式提醒，不是验证过的结论。
- Codex 默认在沙箱里跑命令，一般只能写当前项目、不联网：`npm install` 可以先在自己的终端里跑好，或者在 Codex 里放开网络。样片要拷进项目里改（Skill 本来就这么要求），不在 `~/.agents/skills` 里改。

### DeepSeek Harness

- 实测版本 `@deepseek-ai/dsh` 0.2.1-rc.5（2026-11，npm 的 latest 标签当时还是候选版）：`npm install -g @deepseek-ai/dsh@latest`。
- 安装：`scripts/install.sh dsh`（→ `~/.dsh/skills/`）。它按 `<项目>/.dsh/skills`、`<项目>/.agents/skills`、`~/.dsh/skills`、`~/.agents/skills` 的顺序找 Skill，所以 `scripts/install.sh codex` 装的它也能用。
- Key 放在环境变量 `DEEPSEEK_API_KEY`，默认模型是 deepseek-flash。不开界面、跑一次就退出的用法：`dsh headless "提示词"`（加 `--json` 输出每一步）。
- 默认权限是只写当前目录（`DSH_PERMISSION_MODE`，默认 `workspace-write`），所以要在你的项目目录里启动它。
- 实测结果：
  - 「给一支讲水循环的 60 秒科普片选个风格」：会先加载 Skill，查索引和条目，给出带编号的候选和改好的提示词，约 2 分钟。
  - 「用 C-013 皮影戏的风格写一段 Canvas 动画」：样片代码随 Skill 安装之前，它要联网去 GitHub 取样片，自己从头设计，画面糊、`sound.py` 出错，十分钟没做完。带上样片代码以后（0.2.0），它照 `making.md` 把 `samples/` 拷进项目、`npm install`、先原样跑通 C-013，再写了一段原创的《逐月》，画面和声音都通过 `--quick`；但它会一直截图细调，二十分钟还没停下来。所以 `making.md` 规定细调最多 3 轮，之后先出完整片子交给用户（0.2.1）。

### WorkBuddy 等上传技能包的助手

- `scripts/install.sh zip` 打成 `dist/ai-coding-video.zip` 上传。zip 里也带样片代码。
- 能不能真的跑出片工具，取决于那个助手的运行环境（有没有 Node、Python、浏览器、ffmpeg），没有实测；跑不了时，它仍然可以选风格、写提示词和渲染代码，由你在本机出片。

## 仓库结构

```
skills/ai-coding-video/   Skill 本体（唯一正本；其中 samples/、packs/ 是从下面两处同步来的代码，随 Skill 安装）
samples/                  1 级样片：每种风格的渲染代码、出片脚本和截图；T 类、G 类另带素材 assets/ 和清单 assets.json
packs/                    2 级风格包：部件代码、风格说明、演示片
cases/                    真实应用案例：3 支约 5 分钟的完整视频的分镜、代码、素材清单和制作记录
site/                     介绍页（纯静态，可整个拷到任意服务器）
scripts/                  install.sh 安装到各家助手；media.py 管理放在 Release 里的视频；release.sh 发版；providers/ 维护者出样片用的生成服务配置（不随 Skill 安装）
media.json                视频清单（视频本身在 GitHub Release「media」）
.claude-plugin/           Claude Code 插件市场清单（插件本体是 skills/，插件清单在 skills/.claude-plugin/）
.agents/plugins/          Codex 插件市场清单（插件本体同样是 skills/，插件清单在 skills/.codex-plugin/）
candidates.md             待收录的 T 类、G 类候选（带原作者的截图和样片链接）
PLAN.md                   批次规划和待办
SPEC.md                   阶段 7–10 的设计稿（两条线：风格演示、完整出片）
AGENTS.md                 给在本仓库里干活的 AI 助手看的约定
```

## 许可

[MIT](LICENSE)。文字、代码和本仓库渲染的样片都适用；T 类、G 类样片的素材（`samples/<编号>/assets/`）按各自 `assets.json` 里逐份记的许可（公共领域、CC0，或随本仓库按 MIT 发布的 AI 生成素材）。风格提示词由整理者用自己的话写成，参考来源见 [sources.md](skills/ai-coding-video/sources.md)；缩略图和样片都由本仓库的代码渲染，不收录第三方的成片和截图；T 类用到的公共领域素材也经代码合成后才出片。「致敬风格」里提到的作品名和作者名归各自权利人所有，本仓库与他们没有关联，样片里的角色和场景都是原创的。

## English

**AI Coding Video** is a style library and [Agent Skill](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) (`SKILL.md`) for making videos by having an AI coding agent write code: every frame is rendered deterministically from time *t*. Frames can be drawn entirely by code (class C), or code can lay out and edit real public-domain / CC0 footage (class T) or AI-generated images, video and voice (class G).

- **What is inside**: 100+ visual styles, each with a copy-ready style prompt, topic and technique tags, and an index for choosing by topic, purpose, audience, mood and platform; guides for prompting, materials, music and Chinese voice-over. Styles with samples ship reproducible render code (`scene.js`, `sound.py`) in 16:9 and 9:16.
- **Two tracks**: a style demo (pick a look from the dictionary → a sample you can copy and run → a style pack: reusable, re-brandable code modules for intros, explainers, data cards, transitions and captions), or a full film (content → storyboard and looks → script → your sign-off → a typical segment with narration → the whole film).
- **Case studies**: [cases/](cases/README.md) holds complete ~5-minute videos (storyboard, code, asset list, time and generation cost) that mix all three classes; watch them with per-segment notes on the [project page](https://chans-gh.github.io/AI-Coding-Video/#cases).
- **Works with**: Claude Code and Codex (plugin marketplace, see [Install](#安装)), DeepSeek Harness, WorkBuddy and other agents that read `SKILL.md` (`scripts/install.sh`). Rendering needs Node.js 18+, Python 3 with Playwright, and ffmpeg.
- **Typical uses**: explainer and science videos, product ads, news briefs, courseware, data visualization, motion graphics, music videos, vertical short-form video.

The documentation is in Chinese; the [project page](https://chans-gh.github.io/AI-Coding-Video/) is bilingual. License: MIT.

