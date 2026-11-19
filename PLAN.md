# 批次规划与待办

[← 返回说明](README.md)

一个阶段一个分支：从最新的 `main` 开，做完合并回 `main`、跑完自检，向维护者汇报后再开下一阶段。做完的阶段从这里删掉，在 [CHANGELOG](skills/ai-coding-video/CHANGELOG.md) 记一行。凡是联网调研的，结论都附来源链接（维护者定）。

## 待办

| 阶段 | 内容 | 依赖 | 状态 |
|---|---|---|---|
| 4 | 每个技术类型补样片（分批） | 环境或服务 | 批 1、批 2、批 4 做完；挂起的 4 个条目（G-021、G-022、T-021、G-023）等 GPU、世界模型或对口型、动作迁移服务，见下面 |
| 6 | 介绍页模块「AI-Coding-Video 真实应用」改版 | — | 3 支案例都做完、都在介绍页上；等维护者看效果给改版意见，见下面 |
| 14 | C 类补样片（按难度分 14 批） | — | 批 1–11 做完（101 种）；批 12–14 未开工，见下面 |
| 15 | 接策划交接格式 4（ai-content-planner 0.7.0） | 策划 I2 | 0.19.0 已接上；等策划 I2 的短视频一起验收，见下面 |
| 16 | 接策划交接格式 5（ai-content-planner 0.8.0，SPEC-5-V） | 策划 SPEC-5-P、J2 | 已实现（0.20.0）；J2 回放后的下游修正在 0.20.1，等维护者看是否收尾，见下面 |

### 阶段 16：接策划交接格式 5

规格是策划仓库的 SPEC-5-V（下游）和 SPEC-5-P 第 3、5 节（契约）；策划的 `handoff.md` 格式 5 合进 `main` 后以它为准，夹具照它自己写，不拷文件。要点：`content.md` 是唯一交付物，`plan.md` 不读、不改；下游只写 `content.md` 的「下游回报」和状态行。来由是上一轮复盘（DeepSeek Harness + 快速档，0.19.1）的 7 个下游问题。出 Skill 0.20.0。

**定下来的写法**（维护者 2026-11-19 确认：用包里已有的 `part`/`o`/`over`，不另起名字、不写 `check_layout.py`；三个包都写查表）：

- **入口**：`check_plan.py <目录或 content.md>`。格式行 `/5` 读 `content.md`；`/4`、`/3`、`/2` 照旧读 `plan.md`。分镜脚本、逐字稿的 `plan` 字段格式 5 写 `content.md` 的路径（不另加字段）。
- **`say`**（逐字稿每段，和 `vo` 等长）：一项是 `"S8"`、`["S8", "S9"]`（一句 `vo` 念两句 S），或 `null`（不是「念什么」里的句子）。几项 `vo` 合念一句 S 的，连着写同一个 S，比原句时把它们接起来比。
- **版式**：本 Skill 的风格包没有「骨架、槽位」，只有整屏部件（`part`）、内容（`o`）、叠加（`over`），`segments.json` 已经这么叫。分镜也用这三个名字，另加 `note` 写表外怎么定的，不另起 `layout`、`slots`（一件事一个名字）。
- **查表**：每个风格包加一份 `lookup.json`（随包安装），三张表：
  - `lead`：15 个主角 → `part`（可带 `over`）和哪个 `o` 键放「最大的字」；包里没有的写 `instead`（用哪个代替，用了算偏离）。
  - `sizes`：顶档、中档、小字档各对应哪些 `o` 键（每个部件写一次）。
  - `motion`：张力 1/2/3 → 每格秒数下限、上限、能不能弹出；情绪紧/松/稳/扬 → 强调色、动效多少；节奏快/中/慢 → 每格秒数的倍数。
  - 三个包都写：`dark-keynote` 15 个主角大多能落；`news-brief`、`style-swap` 部件少，大多是 `instead`。规格见 `making.md`「样式查表」，`build_index.py` 查。
- **字号检查**：本 Skill 没有 `check_layout.py`（那是某个出片项目自己的）。改成在 `check_plan.py` 里静态查：认领 H 的分镜，H 的「最大的字」要出现在查表给的顶档 `o` 键里。不改 `pack.js` 的画法。
- **时间重叠**：`check_plan.py --timing videos/<短名>/timing.json`，配音后跑，查「配哪句」和认领它的分镜在时间上重叠，并打印每段实际字数、秒数和篇幅的差。
- **红线的词**：`tools/check_copy.py` 加 `--plan <content.md>`，读红线「词：」并进禁用词，和 `copy.json` 合并（`check_copy.py` 装进项目的 `tools/`，找不到 `check_plan.py`，所以自带一小段读红线表的代码；`vo` 和分镜 `o` 里的词由 `check_plan.py` 查）。「；」后面的例外说明只打印、不解析。
- **语速**：`sound.md` 加一行换算：慢、中、快 → 本地 Kokoro 实测的 `speed` 对照（别的引擎下游自己测）；写稿前上限 = 段篇幅 × 档的字/秒。

**改哪些文件**

| 文件 | 改什么 |
|---|---|
| `scripts/check_plan.py` | 认 `/5`；读总则、红线、约束、每段四块（段头、念什么、看什么、信息）、素材、资料清单、衍生、下游回报，表头逐字比；下面「检查规则」；`--table` 加覆盖表、版式列、每段字数上限和实际、红线「条件」「人工」、下游回报已有的行 |
| `samples/tools/check_copy.py` | `--plan` 并进红线的词 |
| `storyboard.md` | 开头、第 1 节认 `/5`；第 2 节只读 `content.md`，逐节写；第 3 节 `plan`、`say`、`view`、`rule`、`part`/`o`/`over`；第 4 节逐字稿从「念什么」改，六级规矩，先算每段字数上限；第 6 节回流改成写下游回报，含「偏离」怎么判；新加「定样式」一节：每段读段头和看什么，逐格查三张表，查不到的才自己定、写进 `note`；格式 4、3、2 的读法挪到文末 |
| `film.md` | 第 2 步定样式查表；第 4 步给用户看的加覆盖表、版式列、下游回报已有的行；`storyboard.json` 分镜加 `part`、`o`、`over`，`script.json` 加 `say` |
| `making.md` | 2 级风格包加 `lookup.json` 的规格 |
| `packs/*/lookup.json` | 新文件，三个包各一份 |
| `scripts/build_index.py` | 同步 `lookup.json`；`--check` 查：`part` 在 `meta.json` 的部件里、15 个主角都有一行、`sizes` 的键是部件真有的 |
| `scripts/check_storyboard.py` | 认分镜的 `part`、`o`、`over` 和逐字稿的 `say`（类型、长度） |
| `sound.md` | 语速三档换算 |
| `SKILL.md`、`README.md`、`CHANGELOG.md` | 描述和「接策划」写 `/5`（也认 `/4`、`/3`、`/2`）；0.20.0；提到 `/4` 的跟着改 |
| `scripts/tests/` | 格式 4、3、2 夹具留着；新加 `ok5`（红线三种写法、可删、主角、去向、一行下游回报）；每条新规则至少一个测试（在测试里改 `ok5` 的副本造错） |

**检查规则**（错 = 退出码非零；提醒 = 只打印）

| 查什么 | 级别 |
|---|---|
| `content.md` 格式行、状态行；节的顺序和每张表的表头逐字比；读不出的表 | 错 |
| 每句原句、必讲都有 `vo` 认领，且在同一段（`seg`） | 错 |
| 原句和认领它的 `vo` 去掉标点、空白后逐字相同（照格式 4 的比法） | 错 |
| 必讲：`--table` 把句和 `vo` 并排打出来给用户看 | 打印 |
| `say` 长度不等于 `vo`；指的 S 不存在或不是本段的 | 错 |
| `say` 为 `null` 的 `vo`（念什么之外的句子） | 提醒，`--table` 标出 |
| 可删没有 `vo` 认领，下游回报里没有对应的「删减」行 | 错 |
| 删了大圈号、留着小圈号（删了可删②、留着可删①） | 提醒 |
| 必讲压了措辞（和 `vo` 不同）却没有「压缩」行 | 提醒（压没压只能人看） |
| 每行 H 至少一个分镜认领，同一段 | 错 |
| H 没被认领，但下游回报有它的「偏离」或「缺素材」行 | 不报 |
| `facts.ref` 指的信息去向是「不讲」 | 错 |
| 去向是「念」「上屏」的信息，它指的 S 全删了、H 全没认领 | 错 |
| `vo` 里出现红线「词：」的词（`check_copy.py --plan`） | 错；原句撞上、下游回报有这句的「冲突」行的，改报提醒 |
| 红线「条件：」「人工：」 | `--table` 列出给用户确认 |
| 下游回报：编号 `X` 连续不重复；类型、归谁、状态的取值；对象的 S、H、B、K、信息编号存在 | 错 |
| 有归「策划」、状态「待补」的行，状态行不是「回流中」 | 错 |
| 认领 H 的分镜：`part` 不是查表给这个主角的，也不是 `instead`，又没有「偏离」行 | 错 |
| 用了 `instead` 却没有「偏离」行 | 错 |
| H 的「最大的字」不在查表给的顶档 `o` 键里（「无」不查） | 错 |
| 分镜没写 `part`（格式 5 用风格包时） | 错；不用风格包的项目（自己写的段代码）不查这三条 |
| 「配哪句」的 S 和认领 H 的分镜时间上不重叠（`--timing`） | 错 |
| 配音后每段时长和段篇幅差超过 15% | 提醒；全片超出总则区间的 15% 报错 |
| 每格秒数超出查表 `motion` 的张力区间 | 提醒 |
| `/2`、`/3`、`/4` 的规则 | 不变 |

**不做**：不改 `plan.md`；不改 `content.md` 下游回报和状态行以外的地方；不替策划补内容（缺内容、原句撞红线都回流）；不读、不拷策划的脚本，本 Skill 照旧不要求装策划。

**进度**：上面都做完了，`ok5` 夹具和每条规则的测试（`scripts/tests/test_check_plan5.py`）通过，格式 4、3、2 夹具结果不变。余下的只有下面 J2 的验收。

**J2 回放（2026-11-19）**：查出 10 条归下游的问题（超时没按删减顺序办、上屏的字丢了没回报、字幕写法对不上原文、配哪句读成一个编号、红线例外读不出、语速档没对齐、C4 的讲法、部件数值和原文不一致、极限词查到描述上、回听的尾音没标），0.20.1 都改了，每条有测试，见 CHANGELOG。是否算验收通过、要不要再回放一次，等维护者定。

**验收**：`ok5` 夹具通过，格式 4、3、2 夹具结果不变，自检和 CI 通过；之后等策划 J2 按 0.8.0 交一份，下游用快速档模型出片，一起看 SPEC-5-V「验收」的四条（覆盖表里原句、必讲全落、删的只有可删且都有回报；配音后每段和篇幅差 15% 以内；`plan.md` 没改过、偏离都在回报里；每格主角按查表落到部件、最大的字是顶档）。

### 阶段 15：接策划交接格式 4（余下的验收）

格式 4 已接上（Skill 0.19.0，见 [CHANGELOG](skills/ai-coding-video/CHANGELOG.md)）。策划 I2 交来的 [short-voyager](videos/short-voyager/)（2026-11-18）验收过了三条：开分镜没有要回问策划的；逐字稿对说法只改了断句和念法，用 `show` 换回后逐字相同，两句原句没动；配音后 61.7 秒，比 60 秒长 2.8%。

余下一件，等维护者定（「同一 `seg` 拆几段工具不认」已在 0.19.1 改成一段一个段号）：

- **[sound.md](skills/ai-coding-video/sound.md#tone) 基调表**：（0.20.1 已删基调表的语速列和张力 3 的加速，语速只照语速档）原来讲透型 0.95–1.0、张力 3 加 0.05、短视频节奏档 1.08，三条怎么叠没写（这支用 1.05，每秒约 3.9 字，和策划按每秒 4 字的估算对得上）；张力 3 把停顿都压到 0.15，讲透型「设问多的段 0.5」和热血燃的停顿就分不出来，局部档只剩配乐不同；「高潮前留半拍空」「揭开前那段 0.8」要的是句前停顿，`pace` 只能按段设。

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

### 阶段 6：介绍页模块「AI-Coding-Video 真实应用」改版

- 模块在页面最底下，设计（播放器 + 跟着进度切段的说明栏）见 [cases/README.md 的「介绍页模块」](cases/README.md#介绍页模块)；3 支案例按 `site/build.py` 的 `CASE_ORDER` 排。
- 等维护者看效果给改版意见；改版时验收：每段说明里的每项技术都能点到对应的样片或风格包；页面只加载封面，点开才加载中版；`python3 cases/tools/build.py --check` 通过。
- 以后再做案例照 [cases/README.md](cases/README.md) 的流程；带策划的做法、用量分开记、Skill 问题怎么反馈，照第 3 支的 [log.md](cases/shop-handbag/log.md)。

## 待办：下一轮大优化

- **升级 `news-brief`、`style-swap`** 到 [making.md](skills/ai-coding-video/making.md#2-级风格包) 2 级的新规格：完整演示片做成分镜合集，以 `dark-keynote` 的 45 种分镜为参照，按各自题材（新闻资讯、换画风）发散出同样量级的分镜（维护者定，先不做）。
- **反过来给 AI-Video-Project 的**（只记下来，同步回原仓库时再看）：本仓库的切点检查（切点首尾高于 −45 dB 就报错）可以补进它的 `chansclaude-voice/scripts/tts.py`；它的 `video-render/README.md` 准备合并两套渲染器时，可以参考 `samples/tools/film.py`（段缓存简单版、整片自检）。

## 待办：内容类型再补充（维护者自己研发）

- 备选，暂未单列：财经解读、房产、汽车、母婴、三农（做法和「知识科普讲解」「产品广告和带货」「新闻资讯解说」重合，先当这几类的适用场景）；社交节日祝福、婚礼和纪念视频（常用到真人照片，和素材规则不合）；直播切片（已有技术类型「高光切片」）。
- 再调研时优先看国内平台的官方报告（QuestMobile、艾媒、飞瓜）和实际用户需求。

## 暂缓

- 1 级其余的样片（批次 4 没点到的），以及整套视频框架和外部程序里除 Remotion 以外的（Manim、HyperFrames、Blender 等）：太重，等维护者再点（维护者定）。
- 风格包扩充：等 1 级样片覆盖完后，维护者再从中点几种，按 Skill 的 [making.md](skills/ai-coding-video/making.md) 做（维护者定）。

### 阶段 14：C 类补样片（按难度分批）

- 范围：`data/styles.json` 里 C 类还没有 `render_code` 的条目，每个补一支样片（规格同现有 C 类：横竖两版、自带电子音、不用外部素材）。
- 难度怎么定：**轻** = 排版、界面、扁平矢量，或已有同类样片可照着改；**中** = 要自己写笔触、材质、插画，或要写着色器、搭不带角色的简单 3D；**重** = 带角色动画的 3D 场景、要逐帧从 0 重算的流体模拟、一支片里多种画风，或要装 Blender 这类外部软件。
- 先轻后中再重；每批开工前把清单给维护者确认，重的几批先确认环境和用时。
- 验收：每批跑完 `build_index.py --check`、`media.py check`、`mark.py`。

| 批 | 难度 | 主题 | 条目 | 可参照的已有样片和共用做法 |
|---|---|---|---|---|
| 12 | 重 | 复杂 3D 场景 | C-026 纸片立体书、C-073 3D 战役 / 地图俯瞰、C-079 赛博朋克霓虹都市、C-081 三渲二 3D 动漫、C-109 刻线印刷长镜头、C-162 木雕彩绘微缩景 | 地形和楼群都由代码生成；C-079 参照 C-186 东方赛博；C-109 要给 3D 写排线着色器 |
| 13 | 重 | 角色动画、模拟、多画风 | C-059 分屏“跑酷 + 讲解”、C-074 风格化 3D 打斗、C-082 霓虹流体、C-087 多画风穿越、C-111 桌面穿梭 | C-082 的流体要每帧从 0 重推到 t（同 `physicsAt`），先试低分辨率能不能在可接受的时间里出完；C-074、C-111 要写骨骼或关键帧动画 |
| 14 | 重 | 外部软件 | C-071 Blender 程序化场景 | 当前环境没装 Blender，开工前先和维护者确认装不装、渲染要多久；不装就挂起 |

