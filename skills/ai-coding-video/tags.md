# 技术标签

[← 返回说明](README.md) · [选风格索引](index.md)

每种风格都标了做它要用的技术。标签分 7 层，每层回答一个问题；合法取值登记在 [`data/tags.json`](data/tags.json)，自检脚本会拒绝没登记的标签。

| 层 | 回答什么 | 标签 |
|---|---|---|
| 画在哪 | 画面最终画在什么上，每种风格至少一个 | Canvas 2D、WebGL、WebGL2、WebGPU、SVG、HTML/CSS、终端字符 |
| 绘图库 | 帮你画的框架或库 | p5.js、p5.brush、Three.js、Babylon.js、PixiJS、Paper.js、Two.js、Rough.js、D3.js、Konva、Hydra |
| 着色语言 | 写在 GPU 上跑的代码 | GLSL、WGSL |
| 动效与物理 | 时间轴、缓动、物理模拟 | GSAP、anime.js、Motion、Lottie、Theatre.js、Matter.js、cannon-es、Rapier |
| 视频框架 | 一整套框架直接出片 | Remotion、HyperFrames、Motion Canvas、Revideo、Manim（Manim CE、ManimGL） |
| 外部程序 | 用代码驱动的专业软件 | Blender（Python 脚本）、POV-Ray、Processing、openFrameworks、TouchDesigner |
| 出片与声音 | 从代码变成视频文件、配声音 | Playwright、Puppeteer、ffmpeg、WebCodecs、Web Audio、Tone.js、Python 合成音频、Strudel |

## 怎么标

- **技术（建议）**：推荐的写法，一般 1–3 个标签，第一个写「画在哪」。同一种风格往往有多种写法，这里只写最顺手的一种。
- **技术（已验证）**：本仓库真的用这些技术渲染出了样片，代码在条目「样片代码」链接的目录里；做成风格包的还有一行「风格包」。只有做过样片的条目才有这一行。
- **声音标签**：Web Audio、Tone.js、Strudel 是在你自己的项目里配声音的写法；本仓库样片的声音只用 Python 合成，规矩见 [samples/README.md](https://github.com/Chans-gh/AI-Coding-Video/blob/main/samples/README.md#写新样片的规矩)，所以这几个标签不会出现在「技术（已验证）」里。
- **库的许可证**：本仓库样片用到的库和版本、许可证登记在 [samples/README.md 的「用到的库」](https://github.com/Chans-gh/AI-Coding-Video/blob/main/samples/README.md#用到的库)。你自己的项目要照用，先核对那边的许可证：p5.js 是 LGPL，GSAP 用它自己的免费许可证（不卖访问权的作品可免费用），Rough.js、p5.brush、Three.js、cannon-es 是 MIT，D3.js 是 ISC。**Remotion 要特别注意**：个人、3 人以内的公司和非营利组织免费，更大的公司要向 Remotion 买授权，见它的 [license](https://www.remotion.dev/docs/license)。
- **按哪层分文件**：`styles/` 按「画在哪」分文件；用整套视频框架或外部程序出片的，单独放在 `framework.md`、`external.md`。

## 常混的几组

- **Canvas 和 Canvas 2D**：Canvas 只是网页上的画布元素，上面可以跑 2D 绘图也可以跑 WebGL；标签一律写 Canvas 2D 或 WebGL。
- **WebGL 和 WebGL2**：用到只有 WebGL2 才有的功能（多渲染目标、3D 纹理、整数运算等）时才标 WebGL2。
- **Three.js 和 WebGL**：Three.js 是建在 WebGL 上的库，两个都标。
- **Manim**：泛指时写 Manim；要区分社区版和原作者版时写 Manim CE 或 ManimGL。

## T/G 技术类型

上面 7 层是 C 类的技术标签。T 类、G 类还有一层「技术类型」：回答「这条用的是哪种做法」。取值和难度登记在 [`data/tags.json`](data/tags.json) 的 `techniques`（T、G 各一组），每个条目在「素材」下面写 1–3 个：

```markdown
- 素材：照片 · 数据
- 技术类型：数据可视化 · 照片运镜
```

**难度**（`tags.json` 的 `difficulty`），用来排样片批次，也提醒用户本地要准备什么：

| 难度 | 含义 |
|---|---|
| 轻 | 本地 CPU、ffmpeg、浏览器就够；生成交给服务的也算 |
| 中 | 要跑模型、Python 视觉库，或多步编排 |
| 重 | 要 GPU、三维重建、世界模型 |

**怎么标**：

- 一个条目标它最主要的 1–3 个类型，不凑数。类型归 T 还是归 G，看它的输入是真实素材还是生成素材；「视频转视频与风格重绘」处在两者之间，T 类条目也可以用。
- 超分、补帧、去噪、重新打光、深度图是工序，不是类型，写在 [materials.md](materials.md) 的「统一处理」。
- 要加新类型，先在 `tags.json` 登记（名字、英文名、class、难度、一句说明），再给条目标上。

下表由 `scripts/build_index.py` 从条目算出，不手改：

<!-- techniques:start -->
| 类型 | 难度 | 条目 | 有样片 |
|---|---|---|---|
| **公共领域素材** | | | |
| 剪辑与字幕 | 轻 | [T-002](styles/footage.md#T-002) · [T-003](styles/footage.md#T-003) · [T-004](styles/footage.md#T-004) · [T-005](styles/footage.md#T-005) · [T-006](styles/footage.md#T-006) · [T-010](styles/footage.md#T-010) | 是（6） |
| 节拍对齐剪辑 | 轻 | [T-006](styles/footage.md#T-006) | 是（1） |
| 多机位同步 | 轻 | [T-013](styles/footage.md#T-013) | 是（1） |
| 文字稿剪辑 | 中 | — | 否 |
| 高光切片 | 中 | — | 否 |
| 自动改画幅 | 中 | — | 否 |
| 照片运镜 | 轻 | [T-001](styles/footage.md#T-001) · [T-003](styles/footage.md#T-003) · [T-008](styles/footage.md#T-008) · [T-012](styles/footage.md#T-012) | 是（4） |
| 分层视差与投影 | 中 | — | 否 |
| 抠像合成 | 中 | — | 否 |
| 追踪与姿态叠加 | 中 | — | 否 |
| 录屏增强 | 轻 | [T-009](styles/footage.md#T-009) | 是（1） |
| 数据可视化 | 轻 | [T-001](styles/footage.md#T-001) · [T-004](styles/footage.md#T-004) · [T-007](styles/footage.md#T-007) · [T-010](styles/footage.md#T-010) · [T-015](styles/footage.md#T-015) | 是（5） |
| 传感器与轨迹叠加 | 轻 | [T-013](styles/footage.md#T-013) | 是（1） |
| 批注与前后对比 | 轻 | [T-008](styles/footage.md#T-008) · [T-011](styles/footage.md#T-011) | 是（2） |
| 文稿转片 | 轻 | [T-014](styles/footage.md#T-014) | 是（1） |
| 实景三维重建 | 重 | — | 否 |
| 相机反求与 AR 叠加 | 重 | — | 否 |
| **AI 生成素材** | | | |
| 生图加代码动画 | 轻 | [G-001](styles/generated.md#G-001) · [G-007](styles/generated.md#G-007) · [G-009](styles/generated.md#G-009) · [G-012](styles/generated.md#G-012) | 是（4） |
| 图生视频与首尾帧 | 轻 | [G-002](styles/generated.md#G-002) · [G-003](styles/generated.md#G-003) · [G-004](styles/generated.md#G-004) · [G-005](styles/generated.md#G-005) · [G-008](styles/generated.md#G-008) · [G-010](styles/generated.md#G-010) · [G-011](styles/generated.md#G-011) | 是（7） |
| 角色一致性 | 中 | [G-005](styles/generated.md#G-005) · [G-012](styles/generated.md#G-012) | 是（2） |
| 语音合成驱动 | 轻 | [G-001](styles/generated.md#G-001) · [G-002](styles/generated.md#G-002) · [G-005](styles/generated.md#G-005) · [G-007](styles/generated.md#G-007) · [G-008](styles/generated.md#G-008) · [G-010](styles/generated.md#G-010) · [G-012](styles/generated.md#G-012) · [G-013](styles/generated.md#G-013) | 是（8） |
| 数字人口播 | 中 | [G-002](styles/generated.md#G-002) | 是（1） |
| 对口型与译制 | 中 | — | 否 |
| 视频转视频与风格重绘 | 中 | — | 否 |
| 动作迁移与角色替换 | 中 | — | 否 |
| 扩图与局部重绘 | 轻 | [G-006](styles/generated.md#G-006) | 是（1） |
| 生成三维资产加代码渲染 | 中 | — | 否 |
| 生成场景与自由运镜 | 重 | — | 否 |
| 生成矢量与动效素材 | 轻 | [G-013](styles/generated.md#G-013) | 是（1） |
| 生成音乐与音效 | 轻 | [G-014](styles/generated.md#G-014) | 是（1） |
| 音画同生视频 | 轻 | [G-014](styles/generated.md#G-014) | 是（1） |
| 分镜到成片编排 | 中 | — | 否 |
| 模板化批量生成 | 轻 | [T-015](styles/footage.md#T-015) | 是（1） |

33 个类型中，14 个还没有条目。
<!-- techniques:end -->

### 来源

类型和难度依据下列公开资料划定（2026-11 查阅；多数是厂商文档和第三方评测，规格以官方页面为准）：

- 视频生成的首尾帧、参考图、原生音频：[fal 对比 Seedance 2.0 与 Veo 3.1](https://fal.ai/learn/tools/seedance-2-0-vs-veo-3-1)、[WaveSpeed 四模型对比](https://wavespeed.ai/blog/posts/seedance-2-0-vs-kling-3-0-sora-2-veo-3-1-video-generation-comparison-2026)；开源的音画同生：[LTX-2](https://github.com/lightricks/ltx-2)
- 动作迁移与角色替换：[Wan 2.2 Animate 概述](https://www.imagine.art/blogs/wan-2-2-overview)、[ComfyUI 工作流](https://comfy.org/workflows/use-cases/ai-character-replacement/)
- 数字人口播与对口型：[InfiniteTalk（ComfyUI 文档）](https://docs.comfy.org/tutorials/video/wan/wan-infinitetalk)
- 生成场景与自由运镜：[World Labs Marble 与高斯点云导出](https://docs.worldlabs.ai/marble/export/gaussian-splat.md)、[Marble 与 Genie 3 的对比](https://bdtechtalks.substack.com/p/what-to-know-about-world-labs-marble)
- 生成三维资产：[开源图生三维模型对比](https://www.creativeainews.com/articles/best-open-source-ai-3d-models-2026/)（TRELLIS、Hunyuan3D；Hunyuan3D 的许可在部分地区不适用，用前核对）
- 分层视差：[Depth Anything V3（Roboflow）](https://inference-models.roboflow.com/models/depth-anything-v3/)、[DepthFlow](https://github.com/BrokenSource/DepthFlow)
- 实景三维重建：[Nerfstudio 的高斯点云实现（gsplat、COLMAP）](https://docs.nerf.studio/nerfology/methods/splat.html)；需要 CUDA GPU，见 [教程](https://www.markaicode.com/3d-gaussian-splatting-video-to-3d-environments/)
- 文字稿剪辑：[Rescript](https://www.everydev.ai/tools/rescript-video-editor/llms.txt)、[faster-whisper 逐字时间的做法（Whisper 讨论区）](https://github.com/openai/whisper/discussions/2814)
- 抠像与姿态：[SAM 2 论文](https://arxiv.org/abs/2408.00714)、[MediaPipe Pose Landmarker](https://goo.gle/3RzGH0p)
- 录屏增强：[Screen Studio 自动推近](https://screen.studio/guide/auto-zoom)、[OpenScreen（MIT）](https://wikidocs.net/blog/@jaehong/10689/)

案例的用时、费用都是作者自述、未经核实；本页没有引用具体数字。

