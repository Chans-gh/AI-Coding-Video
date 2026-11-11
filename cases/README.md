# 真实应用案例

[← 返回说明](../README.md)

这是介绍页最底下「AI-Coding-Video 真实应用」模块里的 3 支完整视频，每支约 5 分钟。样片演示一种风格、一个技术；案例演示怎么把它们拼成一条能交付的视频，以及这样做比人工、比过去的 AI 工具省在哪里、亏在哪里。

每支都是「大综合」：C（代码画）、T（真实素材加工）、G（AI 生成）三类都要用到，另有一个主角类。三支各用一个主角类：资讯是 T，课件是 C，带货是 G。阶段 5 的两个风格包都要实际用上：[news-brief](../packs/news-brief/) 用在资讯，[style-swap](../packs/style-swap/) 用在课件和带货。

<!-- gen:index -->
| 目录 | 用途 | 主角 | 画幅 | 时长 | 青水算力（约，含试错） | 状态 |
|---|---|---|---|---|---|---|
| [course-first-video/](course-first-video/) | 课件教程：零基础用 AI 编程助手做第一条短片 | C 代码画 | 16:9 | 约 5.0 分钟 + 3 × 60 秒 | 27 | 完成 |
| [news-artemis/](news-artemis/) | 资讯解说：Artemis II 绕月任务回顾 | T 真实素材 | 9:16 | 约 5.1 分钟 + 3 × 60 秒 | 19 | 完成 |
| [shop-handbag/](shop-handbag/) | 电商带货：北山制包所《旷野》布丁包上新讲解 | G AI 生成 | 9:16 | 约 4.0 分钟 | 123–148 | 策划 |
| 合计 | | | | | 约 169–194 | |
<!-- /gen -->

上表、各案例 README 里的分镜表、用量、降级用法、对比口径，都由 `python3 cases/tools/build.py` 从各自的 `case.json` 生成，不要手改；`--check` 核对两边一致。

## 目录结构

```
cases/<名字>/
  README.md        场景、讲法、素材、待核（手写）；分镜、用量、降级、对比由 case.json 生成
  case.json        正本：介绍页和 README 读的数据，格式见下
  script.json      旁白稿：分段，每段对应 case.json 的一段，数字记出处
  assets.json      素材清单，字段和样片的一样（见 samples/tools/assets.py 开头）
  assets/          素材
  segments/        每段一个场景文件 NN.js，写法同 Skill 完整出片的段（segments/<段号>.js），直接用 samples/lib/lib.js
  sound.py         整支的配乐和音效，score(m, T) 照 Skill 的 samples/tools/film.py；旁白由 film.py 摆
  timing.json      每段的段长、每句的时间（Skill 的 voice.py 写，格式见 film.md「时间」）
  log.md           制作记录：每一步用时、生成用量、返工；末尾是汇总表（格式见下）
  storyboard.json、vo/、media/、out/、assets/dl/   生成的分镜、配音、成片、中间产物、能重新下载的素材（不进仓库）
cases/tools/
  build.py         生成和检查
  assets.py        照 assets.json 下载、截取、生成素材（长录像按时间段读取，不整个下载）
  render.py        配音、分段渲染、接片调 Skill 的 samples/tools/voice.py、film.py；另把每段起止写回 case.json，出原版、中版、封面、附带短片
  transcribe.py    长录像转逐词文字稿（faster-whisper），挑金句、切短片用
```

`render.py` 每次先从 `case.json`、`script.json` 写出 Skill 认的 `storyboard.json`：第 k 段的段号是 `0k`（对应 `segments/0k.js`），音色取 `script.json` 的 `voice`；正本仍是 `case.json`。

一支片的流程：策划交接（[ai-content-planner](https://github.com/Chans-gh/AI-content-planner) 的 `plans/<名字>/plan.md`，交接格式 2、状态「已交接」）→ 照 [storyboard.md](../skills/ai-coding-video/storyboard.md) 接策划、照 [film.md](../skills/ai-coding-video/film.md) 的格式写 `case.json`、`script.json` → `script.json` 定稿 → `assets.py` 拿素材 → `render.py <名字> --voice` 配音、算每段时长，`--check` 回听 → 写 `segments/NN.js`、`sound.py` →
`render.py <名字> all --quick` 抽帧看 → `render.py <名字> all` 出各段 → `render.py <名字> --join`、`--shorts` → `scripts/media.py upload`。
前两支的旁白是整稿一次合成的 `assets/vo.mp3`（字幕在 `assets.json` 那一项的 `lines`）：稿子没改时 `--voice` 把它导入 `voice.py`、按句切开，不重配。
原版要同时低于 100 MB，`media.py` 经 git 中转分支上传，GitHub 拒收更大的单个文件。

## log.md 的汇总表

`log.md` 末尾固定一张表，介绍页的「用量和用时」只取这张表。时间按墙上时钟、精确到分钟；同一段时间只算进一类。

| 项目 | 数 | 说明 |
|---|---|---|
| 总用时 | 分钟 | 从接到任务到推送 |
| 等人 | 分钟 | 等需求方确认、回复 |
| 人在改 | 分钟 | 需求方动手改稿、改素材 |
| 机器在跑 | 分钟 | 生成、下载截取素材、渲染、接片（助手同时在做别的也算这里） |
| 助手在做 | 分钟 | 其余：查资料、写稿、写代码、看片 |
| 青水算力 | 数 | 按类分：生图、生视频、语音合成 |
| 生成矢量 | 个 | 助手自己写的 SVG 个数，重写的次数记进返工 |
| 返工 | 次 | 重新生成、重渲整段、重配旁白的次数，各记原因 |

## case.json

| 字段 | 内容 |
|---|---|
| `title`、`summary` | 标题、一句话 |
| `ar` | 画幅，每支只出一种 |
| `lead` | 整支的主角类，C、T、G 之一；要等于各段主角类时长最长的那类（自检算） |
| `status` | 策划、制作中、完成 |
| `plan` | 接了策划的写：策划稿相对本案例目录的路径（`plans/<名字>/plan.md`），没接的不写 |
| `segments` | 每段：`seg` 对应策划框架的段号（接了策划才写），`title` 标题，`content` 讲什么，`sec` 预计秒数，`lead` 本段主角类，`uses` 用到的技术，`swap` 换掉会怎样（可选），`note` 编排说明，`start`、`end` 实际起止 |
| `extras` | 附带成片：`what`、`count` 条数、`sec` 每条秒数、`uses` |
| `usage` | 用量：`item`、`qty`、`cost`（青水算力，数字或 `[低, 高]`，不花算力的写 `null`） |
| `downgrade` | 整支的降级用法；只关一段的写在那段的 `swap` |
| `compare` | 对比口径：`side`（传统人工 / 过去的 AI 工具 / 本方法）、`text`，对方的数据带链接 |

- **`uses` 的每一条**：`what` 写做什么；有对应样片写 `ref`（样片编号，或 `pack:风格包名`），类别跟着样片走（风格包跟它沉淀自的样片），比如估深度图跟 T-018 走、转文字稿跟 T-016 走，都算 T；没有对应样片的写 `class`。`ref`、`class` 只写一个。
- **`start`、`end`**：接片时由程序写进来，不手填；写进来之前，分镜表按 `sec` 累加显示预计时间。
- **接策划**：`case.json` 当 `film.md` 里 `videos/<短名>/storyboard.json` 用，不另建：顶层 `plan` 对应它的 `plan`，`ar` 对应 `ar`，每段的 `seg`、`title`、`content`、`sec`、`lead`、`uses`、`note` 一一对应；风格写在各段 `uses` 的 `ref` 里，不另写 `style`。分镜后来加的 `unify`、`status`、`typical` 案例不写，`case.json` 不改格式。`script.json` 对应它的逐字稿：每段加 `seg`（和 `case.json` 同一段的照抄），`facts` 每条加 `ref`（`content.md` 的编号 `P1-1`，设定写 `null`）。一段策划可拆成几段，每个段号至少用一次。`build.py --check` 调 Skill 的 `scripts/check_plan.py` 查：策划稿是交接格式 2、状态「已交接」，`seg` 都在框架里且每个段号都用到，`ref` 都能在 `content.md` 找到、不是「不用」、状态「已核实」。
- **`note`**：每段做完后照实写，80–150 字：分几层、谁驱动时间、怎么接进整支。不提前写。

## 规矩

- **场景要真实存在**：选的是有人在做、有人在付钱的那类视频；品牌、商品、讲师是虚构的，要在片尾和说明里写明。例外：[shop-handbag](shop-handbag/) 是真实品牌、真实商品，见下一条。
- **素材**：同样只用公共领域、CC0 和 AI 生成的，G 类不生成真人；T 类的公共领域历史影片里有人物的，照原样用（需求方定）。
  - 例外，只限 [shop-handbag](shop-handbag/)（维护者定，2026-11-11）：人物和商品图由维护者提供，维护者是品牌方，声明拥有或已取得改编、公开展示的授权；`assets.json` 每份标「维护者自有」，片尾写「素材由品牌方提供」。模特的脸不送进生成模型：人物镜头只用原图做 T 类合成（推镜、视差、抠像）；新生成的画面里有人的，只出手、背影、远景。旁白仍用公开音色，生成的视频不带原声。
- **素材进不进仓库**：能从公开地址重新下载的不进仓库，`assets.json` 记下载地址和截取参数，`assets.py` 拉下来再处理；生成的素材和处理过、没法重新下载的进仓库，每支合计不超过 30 MB。不受样片 10 MB 的限制。
- **成片放 Release `media`**：每支一个原版（1080p，不超过 120 MB）、一个中版（长边 1280，不超过 25 MB）、一张封面（长边 1280 的 JPG）；投流短片之类的附带成片也放进去。用 `scripts/media.py` 上传，清单记在 `media.json`。
- **出片**：分段渲染再接起来。每段 10–60 秒，单独渲染、单独检查（画面不动、无声、体积），整支只接一次、混一次音；接片时把每段的起止写进 `case.json`。每帧只由时间 t 决定。
- **数字和事实**：旁白和画面上的每个数字，在 `script.json` 里记出处链接；虚构的规格写明「虚构」。
- **制作记录照实写**：`log.md` 记每一步的实际用时（人在等、人在改、机器在渲染分开记）、青水的用量、助手自己写的 SVG 个数、返工次数。介绍页里「我们」的用时和用量只取这里的数。
- **对比数据**：别人的用时、费用引用公开来源，标「作者自述」或「厂商报价」，附链接；找不到就写「没查到」，不估。
- **降级用法**：每支写清去掉哪些技术还能做出简化版，并说明缺了什么；能落到某一段的，写在那段的 `swap`。

## 介绍页模块

- **位置和加载**：放在页面最底下，3 张卡片（封面、标题、主角类、时长、一句话）。没点开之前只加载封面；点开先放中版，另给原版链接。
- **布局**：左边播放器，右边说明栏，说明栏跟着播放进度切到当前这一段；手机上播放器在上、说明栏在下。
- **每段说明固定四块**：
  1. 时间和标题；
  2. C、T、G 三色标：本段用到的亮，主角加粗；
  3. 技术清单：一条一行，有样片的点进对应样片；
  4. 编排说明（`note`），后面附「换掉会怎样」（`swap`）。
- **交互**：
  - 说明栏顶部是分段目录，点一段跳到那段开头；
  - 播放器进度条按段切开，每段用本段主角类的颜色；
  - 说明栏底部放整支汇总，播完时也显示：三类各占多少秒（按各段主角类累加）、用到的技术和样片、用量和用时（取自 `log.md` 末尾的汇总表，格式由第 1 支定）、对比表、降级用法。
- **数据**：`site/build.py` 读各案例的 `case.json` 生成页面，前端听播放器的 `timeupdate` 切段；只改 `site/` 和 `cases/`，不动 `skills/`、`samples/`。
