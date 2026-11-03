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
