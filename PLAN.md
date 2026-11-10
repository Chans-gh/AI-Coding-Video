# 批次规划与待办

[← 返回说明](README.md)

一个阶段一个分支：从最新的 `main` 开，做完合并回 `main`、跑完自检，向维护者汇报后再开下一阶段。做完的阶段从这里删掉，在 [CHANGELOG](skills/ai-coding-video/CHANGELOG.md) 记一行。凡是联网调研的，结论都附来源链接（维护者定）。

## 待办

| 阶段 | 内容 | 依赖 | 状态 |
|---|---|---|---|
| 4 | 每个技术类型补样片（分批） | 环境或服务 | 批 1、批 2、批 4 做完；挂起的 4 个条目（G-021、G-022、T-021、G-023）等 GPU、世界模型或对口型、动作迁移服务，见下面 |
| 6 | 介绍页新模块「AI-Coding-Video 真实应用」 | — | 暂停（维护者定）：第 1 支（资讯）、第 2 支（课件）做完，已在介绍页上；第 3 支（护肤）等策划仓库的抓原文脚本做完，拿来验收「有策划 + 完整出片」；开工和模块改版等维护者说，见下面 |
| 10 | 风格包新规格（不少于 60 秒、不带旁白、部件扩充）写进 `making.md` | — | 下一轮大优化 |
| 13 | `cases/tools/` 改成调 Skill 的工具 | — | 下一轮大优化，设计和验收见 [SPEC 第 9 节](SPEC.md#9-配音和整片工具阶段-1113)；配音、整片工具（阶段 11、12）已做完 |

### 阶段 4：每个技术类型补样片（分批）

- 规矩：每个技术类型至少有一个带样片的风格条目；类型表见 [tags.md](skills/ai-coding-video/tags.md#tg-技术类型)（生成的）。
- 先做「轻」的，再做「中」的；「重」的单列一批，做之前先跟维护者确认环境和费用。
- 素材只用公共领域、CC0 或 AI 生成的；G 类走 `samples/tools/gen.py` 的服务商接口，不生成真人。T 类用的公共领域历史影片里有人物的，照出处原样使用（需求方定）。
- 每批开工前把清单和预计的生成用量给维护者确认。
- 验收：每批跑完 `build_index.py --check`、`media.py check`、`mark.py`；页面的技术行能对上。

**现状**：批 1、批 2、批 4 已做完（T-013–T-020、G-013–G-020，见[更新记录](skills/ai-coding-video/CHANGELOG.md)）；另有 4 个条目挂起（需求方定：补上的意义不大，先跳过）：批 2 留下的 2 个、批 3 的 2 个，编号排在 G-020、T-020 后面。编号要连续，按做完的先后排，下面的编号是暂定；一个条目写 1–3 个技术类型，样片 8–15 秒、横竖两版。

#### 批 2 留下的（挂起）

| 条目 | 名字（暂定） | 内容类型 | 素材 | 技术类型 | 生成用量 |
|---|---|---|---|---|---|
| G-021 | 多语种培训讲解 | 企业培训和课件 | 生图 · 生视频 · 语音合成 | 对口型与译制 · 数字人口播 | 图 1、视频 1 段（约 5 秒）、语音 2–3 种语言各约 10 秒 |
| G-022 | 舞蹈动作迁移 | 音乐 MV | 生图 · 生视频 | 动作迁移与角色替换 · 视频转视频与风格重绘 | 图 1、视频 1–2 段（约 5–8 秒）；动作参考用 T-017 同类的政府体能训练片 |

可选的服务（查阅于 2026-11，价格是各家页面所写，用前核对）：

- 对口型：[fal LatentSync](https://fal.ai/models/fal-ai/latentsync)（40 秒以内每段 0.20 美元，之后每秒 0.005 美元）· [sync.so lipsync-2](https://sync.so/docs/product/billing)（每秒约 0.04–0.05 美元，pro 版约 0.067–0.083 美元）· [fal Sync Lipsync 2.0](https://fal.ai/models/fal-ai/sync-lipsync)（每秒约 0.05 美元）· fal 上的 MiniMax、VEED 对口型（每秒约 0.07–0.08 美元，[对比](https://fal.ai/learn/tools/how-to-lip-sync-ai-videos-with-audio-using-an-api)）。
- 动作迁移：[fal Wan 2.2 Animate](https://fal.ai/models/fal-ai/wan/v2.2-14b/animate/move)（480/580/720p 每「秒」0.04/0.06/0.08 美元，按 16 帧算一秒，页面标可商用）· [MuAPI](https://muapi.ai/comparison/wan2.2-animate)（估算每次 0.35–0.50 美元）。
- 不开新服务的退路：青水的 Grok 参考图生视频或 Seedance 让角色「说话」、再配语音合成——不是真对口型，技术类型就只能算「数字人口播」。

挂起的原因：青水没有对口型、动作迁移模型，需求方不接新服务，用青水替代又做不出这两个技术类型，补上的意义不大。要重启时的做法：G-021 用 Grok 参考图生视频让生成的讲师「说话」，各语种配语音合成，技术类型只写「数字人口播」，不写「对口型与译制」；G-022 用青水图生视频生成角色起舞，动作参考片只在代码里叠骨骼做对照，技术类型改成青水做得到的（例如「图生视频与首尾帧」），不写「动作迁移与角色替换」。两个条目的名字和技术类型开工时按实际定。以后要接新服务，照 `gen.py` 再加一类环境变量（如 `AICV_LIPSYNC_CMD`、`AICV_MOTION_CMD`），适配命令放 `scripts/providers/`。

#### 批 3：重（2 个条目，挂起）

| 条目 | 名字（暂定） | 内容类型 | 素材 | 技术类型 | 素材来源 | 生成用量 | 要什么环境 |
|---|---|---|---|---|---|---|---|
| T-021 | 环绕实景重建 | 旅行和城市 | 照片 · 录像 | 实景三维重建 · 相机反求与 AR 叠加 | CC0 三维模型渲染出的环绕镜头（需求方定）；同一份相机位姿既做 AR 叠加，又训练高斯点云 | — | CUDA GPU（显存 8 GB 起，16 GB 更稳）、COLMAP、gsplat 或 Nerfstudio |
| G-023 | 生成场景漫游 | 游戏和电竞 | 生图 | 生成场景与自由运镜 | — | 世界 1 个（文字或 1 张图生成，导出高斯点云） | 世界模型服务（导出功能要看套餐）；浏览器里用 Spark.js 之类的渲染器规划镜头 |

挂起的原因：现在的云端环境没有 GPU（4 核 CPU、15 GB 内存），环境变量里也没有世界模型服务的 Key，需求方不接新服务。T-021 只有 CPU 一条路（OpenSplat 有 CPU 模式，慢约百倍）：要下载编译外部代码，自动权限没放行，没试成，能不能在可接受的时间里训出来没验证。有了 GPU 环境或决定接世界模型服务时再开工。

#### 覆盖核对

- T 类剩 2 个类型：T-021（2）。
- G 类剩 4 个类型：G-021（对口型与译制，另含数字人口播）、G-022（2）、G-023（1）。
- 企业培训和课件、游戏和电竞另有 G-021、G-023。

#### 素材和工具的核对结论

查阅于 2026-11；多数是厂商和第三方文章，用前回到官方页面核对。

- **公共领域素材**：NASA 的素材一般不受版权保护，但有第三方版权的要另查，含可辨认人物的商用要小心，用时注明出处（[NASA Earth Observatory 使用政策](https://earthobservatory.nasa.gov/ImageUse)、[Wikilegal：NASA 图片](https://meta.wikimedia.org/wiki/Wikilegal/NASA_images)）。美国国家档案馆不为单件确认公共领域状态，部分影片带版权或捐赠限制，每份回到条目页核对（[NARA 说明](https://www.archives.gov/research/motion-pictures/permissions)）；FedFlix 是已数字化的政府影片集（[报道](https://nextgov.com/modernization/2011/01/fedflix-federal-video-archive-grows-in-popularity/231810)）。国会图书馆 [Free to Use and Reuse](https://www.loc.gov/free-to-use/) 和 [Smithsonian Open Access](https://www.si.edu/openaccess) 的许可条款本轮没查到，开工前逐页核对。
- **传感器遥测**：GoPro 的遥测用 [gopro-telemetry](https://github.com/JuanIrache/gopro-telemetry) 提取，[gopro2gpx](https://awesome.ecosyste.ms/projects/github.com%2Fjuanmcasillas%2Fgopro2gpx) 转成 GPX，[gopro-overlay](https://pypi.org/project/gopro-overlay/0.54.0) 做仪表叠加（对齐不精确）。FIT 文件的支持没查实。本库样片用 NASA 公开数据，不用运动相机遥测，所以不依赖这些工具；「传感器与轨迹叠加」维持轻。
- **音乐生成**：[ACE-Step 1.5](https://huggingface.co/ACE-Step/Ace-Step1.5/blob/refs%2Fpr%2F1/README.md) 的模型卡写 MIT，并说明生成的音乐可商用（[论文](https://arxiv.org/abs/2602.00744)）；经第三方服务调用时，条款看服务商。Stable Audio Open 的许可只有一篇对比文章提到，没核实。「生成音乐与音效」维持轻。
- **对口型和译制**：[MuseTalk 是 MIT](https://sync.so/blog/what-is-musetalk)；LatentSync 的许可各家说法不一（Apache 2.0 或 OpenRAIL++），Wav2Lip 没有许可文件，商用有风险（[许可对比](https://www.creativeainews.com/articles/open-source-lip-sync-licenses-commercial-use-2026/)）。样片优先用服务或 MuseTalk。「对口型与译制」维持中。
- **相机反求**：[MegaSaM](https://mega-sam.github.io) 从动态视频估相机和深度，输出尺度不定；[ViPE](https://arxiv.org/pdf/2508.10934) 更快；COLMAP、GLOMAP 要已知内参。导入 Blender 或 Three.js 前要处理尺度。维持重。
- **动作迁移的运行方式**：[Wan 2.2 Animate](https://www.imagine.art/blogs/wan-2-2-overview) 是开放权重，有第三方按次计费的托管接口（[MuAPI](https://muapi.ai/comparison/wan2.2-animate)，价格是聚合站估算）。本地跑要 GPU（属「重」）；经服务调用按「中」算，批 2 走服务。
- **三维模型生成**（G-015 以后换成生成的模型时用）：经服务用一张产品图生成带贴图的 GLB，再用 Three.js 打光、转台、出片。服务有 [Tripo](https://docs.tripo3d.ai)（图生三维按积分计，第三方转引的价目是 20–30 积分一次，1 积分 0.01 美元，没核实；也可经 [fal.ai](https://fal.ai/models/tripo3d/tripo/v2.5/image-to-3d) 调，输出 GLB，PBR 材质）和 [Meshy](https://docs.meshy.ai/api/quick-start)（REST 接口，提交后按任务编号轮询）。开放权重的 [Hunyuan3D 2.1](https://gitserver.onethingai.com/ai-models/Hunyuan3D-2.1/raw/branch/main/LICENSE) 是腾讯的社区许可，不适用于欧盟、英国、韩国，商用条款另议，且要 GPU，不选。青水没有三维模型生成。做法：`gen.py` 加一类「生成三维」（环境变量 `AICV_3D_CMD`），维护者那边写 Tripo 或 Meshy 的适配命令；开工前核对生成结果的使用条款。没有服务时退回 CC0 模型（例如 Poly Haven、Smithsonian Open Access 的 CC0 三维模型），只演示代码渲染这一半。
- **世界模型的导出**：[World Labs Marble](https://docs.worldlabs.ai/marble/export/gaussian-splat.md) 可导出高斯点云和网格，免费套餐不能导出；价格和接口本轮没查到。
- **Remotion 批量渲染**：数据表加一个模板，`bundle()` 一次后循环调用 `renderMedia()` 渲染每一行；大批量可用 Lambda 并行（[Remotion 3.0 说明](https://v4.remotion.dev/blog/3-0)，细节以官方文档为准）。T-015 的批量版本没用 Lambda，在浏览器里按数据表逐行套模板。

已定（需求方定）：

- 配乐：G 类配乐先用 CC0 曲库；有 MiniMax 音乐生成的 Key 以后，再加「生成音乐」这一类素材。
- G-021、G-022：不接新服务，用青水替代。
- T-021：用 CC0 三维模型渲染出的环绕镜头。
- 批 3：环境不支持就挂起。
- 剩下 4 个条目（G-021、G-022、T-021、G-023）都挂起，跳过。

### 阶段 6：介绍页新模块「AI-Coding-Video 真实应用」（页面最底下）

- 3 支约 5 分钟的完整视频，每支 C、T、G 三类都用、各有一个主角类；场景、分镜、技术清单、用量和案例目录的规矩都在 [cases/](cases/README.md)，用量的总表也在那里（由 `case.json` 生成）。
- 介绍页模块的设计（播放器 + 跟着进度切段的说明栏）见 [cases/README.md 的「介绍页模块」](cases/README.md#介绍页模块)。
- 验收：线上模块正常；每段说明里的每项技术都能点到对应的样片或风格包；页面只加载封面，点开才加载中版；`python3 cases/tools/build.py --check` 通过。
- 第 2 支已做完，第 3 支同时是 [ai-content-planner](https://github.com/Chans-gh/AI-content-planner) 和本 Skill 连起来的验收：先策划、交接，再照 [storyboard.md](skills/ai-coding-video/storyboard.md) 出片。

| 顺序 | 内容 | 说明 |
|---|---|---|
| 3 | [电商带货：虚构品牌精华液上新讲解](cases/shop-skincare/README.md) | 等策划仓库的抓原文脚本做完再开工；生成最多，另出 6 条 15 秒投流短片 |
| 4 | 介绍页模块 | 已上线，做完的案例按 `site/build.py` 的 `CASE_ORDER` 排；第 3 支做完自动出现；等维护者看效果给改版意见 |

一个对话，先策划、交接，再出片；出片时只照 `plans/` 里的文件写 `case.json`、`script.json`，不靠对话里的记忆补内容（对应关系见 [cases/README.md](cases/README.md) 的「接策划」）。等维护者说开工，开工时再细算用量；做完合并回 `main`、汇报。做法照第 2 支：[cases/course-first-video/](cases/course-first-video/) 的 `plans/`、`log.md`。

**策划怎么做**

- 策划 Skill 在本仓库旁边只读克隆，照它的 `SKILL.md` 做，`check.py` 从克隆里跑；版本和提交号记进 `log.md`。不改策划仓库。
- 把案例目录当用户项目的根目录：产物放 `cases/<名字>/plans/<名字>/`（`plan.md`、`content.md`，需要时 `source/`），`storyboard.md` 里的相对路径 `plans/<短名>/plan.md` 原样成立。
- 交给策划的输入：案例 README 的「场景」「讲法」「规矩」和下面「已定」的几条当详细要求；README 里原有的分镜当用户给的结构（策划会先沿用）。交接后照 `plan.md` 重写 `case.json` 和 README 的手写部分。
- 交接条件照策划 Skill：`check.py plans/<名字> --handoff` 通过，状态「已交接」。

**用量分开记**

- `log.md` 汇总表三列不变（介绍页按这个读）：原有各行记整支合计，下面加「其中策划：总用时」「其中策划：等人」「其中策划：助手在做」，另加「token：策划」「token：出片」两行。
- 分界是 `plan.md` 状态改成「已交接」那一刻。那时用 claude-code-remote 的 `get_session` 读本会话的累计 `usage`（不是 `context_usage`，那只是当前上下文大小）；返回里没有累计字段，就停下请维护者从后台读一次。做完再读一次，差值记出片。第 2 支交接时没读到累计数，策划、出片没分开，见它的 `log.md`。

**策划 Skill 的问题怎么反馈**

- 每支的 `log.md` 加一节「策划 Skill 的问题」：出了什么情况、在策划仓库哪个文件哪一节、怎么绕过的、建议。只记事实。
- 和 `plan.md` 的回流分开：这支片的内容缺东西照 `storyboard.md` 第 6 节回流；Skill 本身的毛病记在这一节。
- 每支做完时整理成一段能直接复制的文字给维护者，由维护者转给策划仓库的对话。

**核实放哪一步**

- Poly Haven 滴管瓶：已查，没有（2026-11-09 查 [Poly Haven 模型接口](https://api.polyhaven.com/assets?type=models)，521 个模型，带 bottle、dropper 标签的只有清洁剂瓶、喷漆罐、小油壶、酒瓶）。第 3 支开工时照降级用法改：瓶子由代码车削成型，第 2、9 段改归 C，主角仍是 G；README「待核」删掉这一项。
- 化妆品功效宣称评价规范的原文：第 3 支的策划阶段，归「策划」的缺口（它决定卖点能怎么写），原文、条款、链接记进 `content.md`。国家药监局网站对脚本直接访问返回 412，中国政府网、市场监管总局网站能打开，先从转载入口找。
- 成分科普页：讲的内容依据在第 3 支的策划阶段核；页面当画面素材用的许可在出片时核，记进 `assets.json`。

已定（需求方定）：三个选题照 [cases/](cases/README.md) 的总表；资讯以 T 为主、课件以 C 为主、带货以 G 为主；`news-brief` 用在资讯，`style-swap` 用在课件和带货；课件保留虚构讲师；画幅资讯、带货竖屏，课件横屏，每支一种（需求方没另说，按这个做）。

### 阶段 10：风格包新规格（下一轮大优化）

阶段 7–9（两条线：风格演示、完整出片）已做完，记在 [CHANGELOG](skills/ai-coding-video/CHANGELOG.md) 0.10.0–0.12.0，介绍页的「两种用法」也已改好。阶段 10–13 和下面的待办放到下一轮大优化，设计和验收在 [SPEC.md](SPEC.md)。

## 待办：下一轮大优化

- **升级现有三个风格包**到 SPEC 第 5 节的新规格。

## 待办：内容类型再补充（维护者自己研发）

- 备选，暂未单列：财经解读、房产、汽车、母婴、三农（做法和「知识科普讲解」「产品广告和带货」「新闻资讯解说」重合，先当这几类的适用场景）；社交节日祝福、婚礼和纪念视频（常用到真人照片，和素材规则不合）；直播切片（已有技术类型「高光切片」）。
- 再调研时优先看国内平台的官方报告（QuestMobile、艾媒、飞瓜）和实际用户需求。

## 暂缓

- 1 级其余的样片（批次 4 没点到的），以及整套视频框架和外部程序里除 Remotion 以外的（Manim、HyperFrames、Blender 等）：太重，等维护者再点（维护者定）。
- 风格包扩充：等 1 级样片覆盖完后，维护者再从中点几种，按 Skill 的 [making.md](skills/ai-coding-video/making.md) 做（维护者定）。
- 同步回原仓库（`Chans-gh/AI-Video-Project` 的 `.claude/skills/video-styles` 换成本仓库版本，并更新那边的 3 处引用），等本仓库完全建好再做。
