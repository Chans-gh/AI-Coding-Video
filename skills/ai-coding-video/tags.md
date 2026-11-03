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
- **技术（已验证）**：本仓库真的用这些技术渲染出了样帧，代码在条目写的「样帧代码」目录里。只有做过样帧的条目才有这一行。
- **按哪层分文件**：`styles/` 按「画在哪」分文件；用整套视频框架或外部程序出片的，单独放在 `framework.md`、`external.md`。

## 常混的几组

- **Canvas 和 Canvas 2D**：Canvas 只是网页上的画布元素，上面可以跑 2D 绘图也可以跑 WebGL；标签一律写 Canvas 2D 或 WebGL。
- **WebGL 和 WebGL2**：用到只有 WebGL2 才有的功能（多渲染目标、3D 纹理、整数运算等）时才标 WebGL2。
- **Three.js 和 WebGL**：Three.js 是建在 WebGL 上的库，两个都标。
- **Manim**：泛指时写 Manim；要区分社区版和原作者版时写 Manim CE 或 ManimGL。
