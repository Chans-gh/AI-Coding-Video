# 批次规划与待办

[← 返回说明](README.md)

一个阶段一个分支：从最新的 `main` 开，做完合并回 `main`、跑完自检，向维护者汇报后再开下一阶段。做完的阶段从这里删掉，在 [CHANGELOG](skills/ai-coding-video/CHANGELOG.md) 记一行。凡是联网调研的，结论都附来源链接（维护者定）。

## 待办

| 阶段 | 内容 | 依赖 | 状态 |
|---|---|---|---|
| 4 | 每个技术类型补样片（分批） | — | 待做；每批开工前给维护者清单和青水用量 |
| 5 | 风格包：T 类、G 类各补一个 | — | 待做 |
| 6 | 介绍页新模块「AI-Coding-Video 真实应用」 | 4、5 | 待做；开工前给维护者场景、分镜、技术清单和青水用量 |

### 阶段 4：每个技术类型补样片（分批）

- 规矩：每个技术类型至少有一个带样片的风格条目；类型表见 [tags.md](skills/ai-coding-video/tags.md#tg-技术类型)（生成的）。
- 先做「轻」的，再做「中」的；「重」的单列一批，做之前先跟维护者确认环境和费用。
- 素材只用公共领域、CC0 或 AI 生成的；G 类走 `samples/tools/gen.py` 的服务商接口；不用真人。
- 每批开工前把清单和预计的生成用量给维护者确认。
- 验收：每批跑完 `build_index.py --check`、`media.py check`、`mark.py`；页面的技术行能对上。

**现状**：批 1 已做完（T-013–T-015、G-013、G-014，见[更新记录](skills/ai-coding-video/CHANGELOG.md)）；剩下的 9 个条目在批 2、批 3。编号要连续，按做完的先后排，下面的编号是暂定；一个条目写 1–3 个技术类型，样片 8–15 秒、横竖两版。

#### 批 2：中（7 个条目，T 类 3 个、G 类 4 个）

环境：Python 加视觉库（faster-whisper、MediaPipe 或 RTMPose、SAM 2、Depth Anything V3，单张图或短片段 CPU 能跑，慢；有 GPU 更快）；G 类的模型经服务调用。

| 条目 | 名字（暂定） | 内容类型 | 素材 | 技术类型 | 素材来源 | 生成用量 |
|---|---|---|---|---|---|---|
| T-016 | 访谈金句竖屏 | 播客和访谈可视化 | 录像 | 文字稿剪辑 · 高光切片 · 自动改画幅 | NASA 影像库的任务讲解、新闻发布会长视频；备选：美国国会听证视频 | — |
| T-017 | 体操骨骼示范 | 健康和运动指导 | 录像 | 追踪与姿态叠加 · 抠像合成 | 美国国家档案馆（NARA）和 Internet Archive 的 FedFlix 里的政府体能训练片 | — |
| T-018 | 照片深景推镜 | 品牌宣传片 | 照片 | 分层视差与投影 | 美国国会图书馆 Free to Use and Reuse 的照片、Wikimedia Commons 公共领域照片；深度图作为第二份素材记入清单 | — |
| G-015 | 多语种培训讲解 | 企业培训和课件 | 生图 · 生视频 · 语音合成 | 对口型与译制 · 数字人口播 | — | 图 1、视频 1 段（约 5 秒）、语音 2–3 种语言各约 10 秒 |
| G-016 | 舞蹈动作迁移 | 音乐 MV | 生图 · 生视频 | 动作迁移与角色替换 · 视频转视频与风格重绘 | 动作参考用 T-017 同类的政府体能训练片；角色由生成图提供 | 图 1、视频 1–2 段（约 5–8 秒） |
| G-017 | 三维产品展台 | 产品广告和带货 | 生图 | 生成三维资产加代码渲染 | — | 图 2、三维模型 1 个 |
| G-018 | 分镜表短片 | 品牌宣传片 | 生图 · 生视频 · 语音合成 | 分镜到成片编排 | — | 图 4、视频 2 段、语音约 12 秒 |

批 2 合计：图约 8，视频 4–5 段，三维模型 1 个，语音约 32 秒。

#### 批 3：重（2 个条目，单列）

| 条目 | 名字（暂定） | 内容类型 | 素材 | 技术类型 | 素材来源 | 生成用量 | 要什么环境 |
|---|---|---|---|---|---|---|---|
| T-019 | 环绕实景重建 | 旅行和城市 | 照片 · 录像 | 实景三维重建 · 相机反求与 AR 叠加 | Smithsonian Open Access 的 CC0 三维模型渲染出的环绕镜头，或 Wikimedia Commons 的公共领域多角度照片；同一份相机位姿既做 AR 叠加，又训练高斯点云 | — | CUDA GPU（显存 8 GB 起，16 GB 更稳）、COLMAP、gsplat 或 Nerfstudio |
| G-019 | 生成场景漫游 | 游戏和电竞 | 生图 | 生成场景与自由运镜 | — | 世界 1 个（文字或 1 张图生成，导出高斯点云） | 世界模型服务（导出功能要看套餐）；浏览器里用 Spark.js 之类的渲染器规划镜头 |

做之前跟维护者确认：GPU 从哪来、世界模型服务的费用。

#### 覆盖核对

- T 类剩 6 个类型：T-016（3）、T-017（2）、T-018（1）、T-019（2）。
- G 类剩 6 个类型：G-015（1，另含数字人口播）、G-016（2）、G-017（1）、G-018（1）、G-019（1）。
- 新内容类型里还没条目的：播客和访谈可视化（T-016）、健康和运动指导（T-017）；企业培训和课件、游戏和电竞另有 G-015、G-019。

#### 素材和工具的核对结论

查阅于 2026-11；多数是厂商和第三方文章，用前回到官方页面核对。

- **公共领域素材**：NASA 的素材一般不受版权保护，但有第三方版权的要另查，含可辨认人物的商用要小心，用时注明出处（[NASA Earth Observatory 使用政策](https://earthobservatory.nasa.gov/ImageUse)、[Wikilegal：NASA 图片](https://meta.wikimedia.org/wiki/Wikilegal/NASA_images)）。美国国家档案馆不为单件确认公共领域状态，部分影片带版权或捐赠限制，每份回到条目页核对（[NARA 说明](https://www.archives.gov/research/motion-pictures/permissions)）；FedFlix 是已数字化的政府影片集（[报道](https://nextgov.com/modernization/2011/01/fedflix-federal-video-archive-grows-in-popularity/231810)）。国会图书馆 [Free to Use and Reuse](https://www.loc.gov/free-to-use/) 和 [Smithsonian Open Access](https://www.si.edu/openaccess) 的许可条款本轮没查到，开工前逐页核对。
- **传感器遥测**：GoPro 的遥测用 [gopro-telemetry](https://github.com/JuanIrache/gopro-telemetry) 提取，[gopro2gpx](https://awesome.ecosyste.ms/projects/github.com%2Fjuanmcasillas%2Fgopro2gpx) 转成 GPX，[gopro-overlay](https://pypi.org/project/gopro-overlay/0.54.0) 做仪表叠加（对齐不精确）。FIT 文件的支持没查实。本库样片用 NASA 公开数据，不用运动相机遥测，所以不依赖这些工具；「传感器与轨迹叠加」维持轻。
- **音乐生成**：[ACE-Step 1.5](https://huggingface.co/ACE-Step/Ace-Step1.5/blob/refs%2Fpr%2F1/README.md) 的模型卡写 MIT，并说明生成的音乐可商用（[论文](https://arxiv.org/abs/2602.00744)）；经第三方服务调用时，条款看服务商。Stable Audio Open 的许可只有一篇对比文章提到，没核实。「生成音乐与音效」维持轻。
- **对口型和译制**：[MuseTalk 是 MIT](https://sync.so/blog/what-is-musetalk)；LatentSync 的许可各家说法不一（Apache 2.0 或 OpenRAIL++），Wav2Lip 没有许可文件，商用有风险（[许可对比](https://www.creativeainews.com/articles/open-source-lip-sync-licenses-commercial-use-2026/)）。样片优先用服务或 MuseTalk。「对口型与译制」维持中。
- **相机反求**：[MegaSaM](https://mega-sam.github.io) 从动态视频估相机和深度，输出尺度不定；[ViPE](https://arxiv.org/pdf/2508.10934) 更快；COLMAP、GLOMAP 要已知内参。导入 Blender 或 Three.js 前要处理尺度。维持重。
- **动作迁移的运行方式**：[Wan 2.2 Animate](https://www.imagine.art/blogs/wan-2-2-overview) 是开放权重，有第三方按次计费的托管接口（[MuAPI](https://muapi.ai/comparison/wan2.2-animate)，价格是聚合站估算）。本地跑要 GPU（属「重」）；经服务调用按「中」算，批 2 走服务。
- **三维模型生成**（G-017）：经服务用一张产品图生成带贴图的 GLB，再用 Three.js 打光、转台、出片。服务有 [Tripo](https://docs.tripo3d.ai)（图生三维按积分计，第三方转引的价目是 20–30 积分一次，1 积分 0.01 美元，没核实；也可经 [fal.ai](https://fal.ai/models/tripo3d/tripo/v2.5/image-to-3d) 调，输出 GLB，PBR 材质）和 [Meshy](https://docs.meshy.ai/api/quick-start)（REST 接口，提交后按任务编号轮询）。开放权重的 [Hunyuan3D 2.1](https://gitserver.onethingai.com/ai-models/Hunyuan3D-2.1/raw/branch/main/LICENSE) 是腾讯的社区许可，不适用于欧盟、英国、韩国，商用条款另议，且要 GPU，不选。青水没有三维模型生成。做法：`gen.py` 加一类「生成三维」（环境变量 `AICV_3D_CMD`），维护者那边写 Tripo 或 Meshy 的适配命令；开工前核对生成结果的使用条款。没有服务时退回 CC0 模型（例如 Poly Haven、Smithsonian Open Access 的 CC0 三维模型），只演示代码渲染这一半。
- **世界模型的导出**：[World Labs Marble](https://docs.worldlabs.ai/marble/export/gaussian-splat.md) 可导出高斯点云和网格，免费套餐不能导出；价格和接口本轮没查到。
- **Remotion 批量渲染**：数据表加一个模板，`bundle()` 一次后循环调用 `renderMedia()` 渲染每一行；大批量可用 Lambda 并行（[Remotion 3.0 说明](https://v4.remotion.dev/blog/3-0)，细节以官方文档为准）。T-015 的批量版本没用 Lambda，在浏览器里按数据表逐行套模板。

#### 请维护者决定

1. **历史影像里的真人**：T-016、T-017 的政府影片里有真实人物。规矩写「素材里有人物的，照出处原样使用」，但这一阶段写了「不用真人」。是只用无人物的素材，还是允许公共领域历史影片里的人物？不允许的话，T-016 改用 AI 合成的两人对话加文字稿剪辑，T-017 改用生成角色视频。
2. **G-017 的三维模型**：用 Tripo 还是 Meshy（要开账号、Key 设成环境变量），还是先用 CC0 模型（见上面「三维模型生成」）。
3. **T-019 的素材**：用 CC0 三维模型渲染出的环绕镜头，还是找公共领域的多角度实拍照片？前者稳，后者更像「实景」。
4. **批 3 的环境**：GPU 从哪来，世界模型服务用哪家、预算多少。

配乐（需求方定）：G 类配乐先用 CC0 曲库；有 MiniMax 音乐生成的 Key 以后，再加「生成音乐」这一类素材。

### 阶段 5：风格包，T 类、G 类各补一个

- 每个包同样有 3 种切换，但不切换颜色，切换别的维度。
- T 包（建议做「新闻资讯解说」，用公共领域照片加数据）切换「画面组织」：单图推拉（Ken Burns）/ 2.5D 视差分层 / 多图拼贴分屏。
- G 包切换「画风」：同一段分镜、同一套提示词结构，只换风格段，例如写实摄影 / 水彩插画 / 3D 黏土；同时做成「提示词 = 固定段 + 可换段」的范例。
- 验收：两个包都能从 Skill 里拷出来直接跑通；风格说明写清楚切换的是哪个维度、怎么再加第 4 种。

### 阶段 6：介绍页新模块「AI-Coding-Video 真实应用」（页面最底下）

- 3 个典型用途，各做一支约 5 分钟的完整视频。场景必须是真实存在的需求，候选：资讯解说、电商带货、课件教程；每支都混合用到多种 T、G、C 技术。
- 视频自己做，不放第三方成片；代码和素材清单放进新目录 `cases/<名字>/`，不受样片素材 10 MB 的限制，另立规则；成片放进 Release `media`。
- 每支视频配一段说明：
  1. 用到的技术方案和类型（对应到风格编号、技术标签、样片）；
  2. 和传统人工制作、过去 AI 制作的对比：用时、费用、可修改性、可批量性。对方的数据引用公开来源并标「作者自述」，我们的数据按实际制作记录；
  3. 降级用法：去掉哪些技术还能做出简化版（例如只用 C 类加 TTS、不用生视频）。
- 页面性能：只放封面和 1280 宽的中版，点开才加载原版。
- 验收：线上模块正常；3 支视频的说明里，每项技术都能点到对应的样片。

## 待办：内容类型再补充（维护者自己研发）

- 备选，暂未单列：财经解读、房产、汽车、母婴、三农（做法和「知识科普讲解」「产品广告和带货」「新闻资讯解说」重合，先当这几类的适用场景）；社交节日祝福、婚礼和纪念视频（常用到真人照片，和素材规则不合）；直播切片（已有技术类型「高光切片」）。
- 再调研时优先看国内平台的官方报告（QuestMobile、艾媒、飞瓜）和实际用户需求。
- 新增的 6 个内容类型（企业培训和课件、游戏和电竞、播客和访谈可视化、年度回顾和数据总结、美食、健康和运动指导）还没有 T、G 条目，随阶段 4 补。

## 暂缓

- 1 级其余的样片（批次 4 没点到的），以及整套视频框架和外部程序里除 Remotion 以外的（Manim、HyperFrames、Blender 等）：太重，等维护者再点（维护者定）。
- 风格包扩充：等 1 级样片覆盖完后，维护者再从中点几种，按 Skill 的 [making.md](skills/ai-coding-video/making.md) 做（维护者定）。
- 同步回原仓库（`chans-gh/test` 的 `.claude/skills/video-styles` 换成本仓库版本，并更新那边的 3 处引用），等本仓库完全建好再做。
