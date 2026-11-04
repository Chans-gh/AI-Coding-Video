# 样片

[← 返回说明](../README.md)

每种风格一个文件夹，文件夹名就是风格编号。里面的 `scene.js` 是这种风格的全部渲染代码。同一份代码按画幅出横屏 16:9（1920×1080）和竖屏 9:16（1080×1920）两版，带声音。C 类每版 3–5 秒；T 类、G 类每版 8–15 秒，另带素材，见下面「T 类、G 类样片」。

| 文件 | 是什么 |
|---|---|
| `<编号>/scene.js` | 场景代码：`init()` 准备纹理，`draw(ctx, t)` 画出 t 秒那一帧；第一行注释是一句「怎么画的」，介绍页直接用 |
| `<编号>/sound.py` | 这段样片的配乐和音效：在哪个时刻放什么音 |
| `<编号>/meta.json` | 英文名、英文描述、技术标签（介绍页和风格条目的「技术（已验证）」从这里取） |
| `<编号>/<编号>-16x9.mp4`、`-9x16.mp4` | 渲染好的样片。不进仓库，放在 [Release「media」](https://github.com/Chans-gh/AI-Coding-Video/releases/tag/media)，见下面「视频放在哪」 |
| `<编号>/<编号>-16x9.jpg`、`-9x16.jpg` | 静帧 |
| `API.md` | `lib.js` 和 `synth.py` 的函数速查，写场景时读它，不用读源码；由 `tools/apidoc.py` 生成 |
| `lib/synth.py` | 合成器：鼓、拨弦、钟、方波、锯齿波、风声等，全部用代码算出波形 |
| `lib/lib.js` | 公共工具：确定性随机数、噪声、缓动、纸纹、WebGL 全屏着色器、SVG/HTML 舞台、GSAP 时间轴和 p5 画布的接法 |
| `player.html` | 在浏览器里播放某个样片，出片时也靠它逐帧截图 |
| `new.py` | 给新样片起骨架 |
| `batch.py` | 批量出片和自动检查，出总览图 |
| `render.py` | 出片核心（截图、合成声音、编码、缩略图），由 `batch.py` 调用 |
| `tools/mark.py` | 把出好的样片登记进风格条目 |
| `tools/apidoc.py` | 生成 `API.md` |
| `tools/assets.py` | T 类、G 类的素材：下载、录屏、调青水生成、统一处理、去元数据 |

## 怎么出片

需要的环境见 Skill 的 [making.md「自带的出片工具」](../skills/ai-coding-video/making.md#自带的出片工具)（Node.js 实测 v22；Playwright 用 `pip install playwright`，再 `playwright install chromium`）。

本目录的代码（不含截图、T/G 类素材、`tools/mark.py`、`tools/apidoc.py` 和本文件）由 `skills/ai-coding-video/scripts/build_index.py` 同步进 Skill 的 `samples/`，随 Skill 一起安装；改了这里的代码要重新跑它，`--check` 会查是否同步。

维护者本地和云端会话跑的是同一套命令：`cd samples && npm install` 之后就能 `python3 batch.py <编号>`。云端容器里已经有 Chromium（`/opt/pw-browsers/chromium`），`render.py` 和 Remotion 都直接用它；本地没有这个路径时，Playwright 用自己装的那个，Remotion 也会自己找浏览器（都不额外下载到仓库里）。想指定浏览器就设环境变量 `CHROME=/路径/到/chrome`。

```bash
cd samples
npm install                          # 下载字体和绘图库到 node_modules/（见下面「用到的库」）
python3 new.py C-168                 # 从风格条目起骨架：scene.js、sound.py、meta.json
python3 batch.py C-168 --quick       # 改代码时用：每个画幅只抽 8 帧低分辨率截图，合成声音，检查，出总览图
python3 batch.py C-168 C-169         # 出横竖两版视频、静帧，并更新 Skill 里的缩略图（4 路并行）
python3 batch.py all --quick         # 所有样片
python3 batch.py C-168 --sound       # 只合成声音到 out/C-168.wav，改配乐时试听
python3 tools/mark.py C-168          # 在风格条目里写上缩略图、「技术（已验证）」「样片代码」，并跑词典自检
python3 batch.py pack:dark-keynote   # 风格包的演示片（packs/dark-keynote/demo/），见 packs/README.md
```

`batch.py` 每个样片每个画幅只打一行摘要（✓，或 ✗ 加原因），详细日志在 `out/<编号>-<画幅>.log`。自动检查：脚本报错、黑屏或白屏、画面不动（比较相隔 0.2 秒的两帧）、声音静音或削波、时长（C 类 3–5 秒，T 类、G 类 8–15 秒）、视频体积（C 类超过 2.5 MB、T 类和 G 类超过 4 MB 自动加大压缩，仍超就报 ✗）。总览图 `out/sheet.jpg` 每行一个样片，横竖各 4 帧，最多 6 个样片一张，多的写 `sheet-2.jpg`。先看摘要，再看总览图，只有 ✗ 或看着可疑的才单独打开。

改了 `lib.js` 或 `synth.py` 的注释后跑 `python3 tools/apidoc.py` 更新 `API.md`（`--check` 检查是否过期）。

想在浏览器里看，要先在 `samples/` 下起一个本地服务，例如 `python3 -m http.server`，再打开 `http://localhost:8000/player.html?s=C-001&ar=16x9`。

发版用仓库根目录的 `scripts/release.sh "<提交说明>"`：登记样片 → 词典检查 → `API.md` 检查 → 生成介绍页 → 新出的视频传到 Release → 提交并推送当前分支；加 `--live` 再用无头浏览器打开线上介绍页，打一行结果（卡片数、报错、加载失败的文件）。

## 视频放在哪

样片和风格包演示片的视频不进 Git 仓库（`.gitignore` 已排除），放在 GitHub 的 [Release「media」](https://github.com/Chans-gh/AI-Coding-Video/releases/tag/media) 里；仓库根目录的 `media.json` 记每个视频的位置、大小和 sha256，由 `scripts/media.py` 维护，不手改。静帧、代码和 T 类、G 类的素材（`assets/`）照旧进仓库。

```bash
python3 scripts/media.py pull C-001 C-002   # 要看已有样片的视频时，下载到原来的位置；不写编号就全部下载
python3 scripts/media.py upload             # 出片后把新出或改过的视频传上去，并更新 media.json（release.sh 会自动跑）
python3 scripts/media.py check              # 核对清单和 Release 一致
```

`upload` 不需要 GitHub 令牌：它把要传的视频放进一个只含它们的中转分支 `media-upload/<时间>` 推上去，由 `.github/workflows/media.yml` 传到 Release、删掉中转分支、重新发布介绍页，一两分钟后 `check` 就能对上。本机 `gh` 已登录的，可以加 `--gh` 直接上传。介绍页发布时从 Release 下载视频，和静帧一起放进 `site/media/`。在别的分支上传也会覆盖 Release 里同名的视频，所以改已有样片的视频，等合并时再传。

## 用到的库

全部用 npm 装进 `samples/node_modules/`，出片时从本地载入，不联网、不用 CDN。版本写死在 `package.json` 里（`--save-exact`），维护者本地和云端会话跑同一条 `npm install` 就能出片。

| 库 | 版本 | 许可证 | 在哪用 |
|---|---|---|---|
| `@fontsource/*`（10 种字体） | 5.2.5 | SIL OFL 1.1（字体本身） | 所有样片的文字 |
| [GSAP](https://gsap.com) | 3.15.0 | GSAP 标准「无偿」许可证（免费用于不卖访问权的作品，不可再分发为开发工具的一部分） | 场景写 `libs: ['gsap']`，用 `timeline()` 建暂停的时间轴，`draw` 里 `tl.seek(t)` |
| [p5.js](https://p5js.org) | 2.3.4 | LGPL-2.1 | `libs: ['p5']`，用 `p5Sketch()` 起 instance 模式 + `noLoop` 的画布，逐帧 `redraw` |
| [p5.brush](https://github.com/acamposuribe/p5.brush) | 3.0.0 | MIT | `libs: ['p5.brush']`（会连 p5.js 一起载入），水彩填色和铅笔笔刷，要 WEBGL 画布 |
| [Rough.js](https://roughjs.com) | 4.6.6 | MIT | `libs: ['rough']`，在 Canvas 2D 上画手绘感的线和形状；`seed` 固定，每帧一样 |
| [D3.js](https://d3js.org) | 7.9.1 | ISC | `libs: ['d3']`，地理投影、路径、插值、数字格式 |
| [Three.js](https://threejs.org) | 0.187.0 | MIT | `libs: ['three']`，3D 场景；用 `three3d()` 起离屏 WebGL 画布，`studioEnv()` 用代码画影棚环境贴图 |
| [cannon-es](https://github.com/pmndrs/cannon-es) | 0.20.0 | MIT | `libs: ['cannon-es']`，刚体物理；用 `physicsAt(world, t)` 每帧从 0 按固定步长重推 |
| [Remotion](https://www.remotion.dev) | 4.0.540 | Remotion 自己的许可证：个人、3 人以内的公司和非营利组织免费，更大的公司要买授权（见 [license](https://www.remotion.dev/docs/license)） | 写 `scene.jsx`（React 组件 + `useCurrentFrame`）代替 `scene.js`，`render.py` 走 `remotion/serve.mjs` 出帧 |
| [React](https://react.dev) / React DOM | 19.3.1 | MIT | Remotion 样片的组件 |

每帧仍然只由时间 `t` 决定：GSAP 用暂停的时间轴 `seek(t)`，p5 用 `noLoop` 加逐帧 `redraw`（每帧前按固定种子重设 `randomSeed`/`noiseSeed`），Rough.js 每个图形写死 `seed`，cannon-es 每帧把世界从 0 按 1/120 秒的固定步长重推到 t（用 `world.step(dt)`，不用看真实时钟的 `fixedStep`），Remotion 的帧号就是 `useCurrentFrame()`。
新加库要改三处：`package.json`（装）、`player.html` 的 `LIBS`（从哪个文件载入）、这张表（版本和许可证）。

Remotion 样片不走 `player.html`：`render.py` 认出目录里的 `scene.jsx` 后，起一个常驻的 node 进程 `remotion/serve.mjs`，它 bundle 一次、开一个浏览器，然后按 `t` 出帧。浏览器用容器里已有的 Chromium（环境变量 `CHROME`，默认 `/opt/pw-browsers/chromium`），不额外下载。

## T 类、G 类样片

目录里比 C 类多两样：`assets/`（素材，合计不超过 10 MB）和 `assets.json`（素材清单：每份的文件、种类、出处链接、许可，G 类另记模型名、参数和提示词；字段见 `tools/assets.py` 开头）。

```bash
python3 tools/assets.py T-007        # 照 assets.json 下载或生成素材，统一成 30 帧/秒、去掉元数据，写进 assets/；旁白的逐字时间换成字幕写回 assets.json
python3 tools/assets.py --usage      # 本机调青水的次数
python3 batch.py T-007 --quick       # 之后和 C 类一样出片、检查、登记
```

- 场景里用 `loadAssets()`、`loadImage()`、`loadVideo()`（按帧取，第 k 帧只取素材的第 k 帧）、`parseCSV()` 读素材，`cueAt()` 取当前字幕，`credits()` 生成署名行；`sound.py` 一般只写 `assets(m, 样片目录)`，再加几个合成音效。
- 声音不用 C 类的电子音做主体：旁白用青水的公开音色，配乐、音效用公共领域、CC0 的（CC BY 要署名）。
- 规矩见仓库根目录 [AGENTS.md](../AGENTS.md) 的「T 类、G 类」，做法见 Skill 的 [materials.md](../skills/ai-coding-video/materials.md)。

## 写新样片的规矩

- 每帧只由时间 t 决定：随机数用 `mulberry32` 或 `hash2`，不用 `Math.random()`，也不读系统时间。这样同一份代码每次渲染的结果都一样。用库时同理：GSAP 的时间轴建成暂停的、每帧 `seek(t)`，p5 用 `noLoop` 逐帧 `redraw`，Rough.js 每个图形写死 `seed`。
- 画面可以画在 Canvas 2D 上，也可以写 `dom: true` 用 SVG 或 HTML 网页画面（画在盖住画布的 `STAGE` 里）；库在场景的 `libs` 里声明，见上面「用到的库」。
- C 类画面全部由代码算出，不引用任何外部图片、视频或生成模型。字体只用开源字体，写进 `package.json`。
- C 类声音只用 `lib/synth.py` 的合成器（自带电子音），不调用第三方声音模型，不用曲库、录音或采样。动作发生的时刻放一个对应材质的音，写法见 Skill 的[声音篇](../skills/ai-coding-video/sound.md)。
- 横竖两版用同一份代码：读 `W`、`H`、`LAND`（是否横屏）来定构图。不要只把竖屏画面拉伸或裁切成横屏。
- 做完后跑 `tools/mark.py` 登记进风格条目（缩略图、「技术（已验证）」「样片代码」），条目格式见 Skill 的 [README](../skills/ai-coding-video/README.md)。

C-001–C-077 里的 40 种改写自维护者早先的作品 opus40（每个 `scene.js` 开头注明了），原片只有竖屏，横屏版是逐个场景重新构图的，竖屏版也按整幅画面重新排过；C-041 公式推导原本就是用 Canvas 模仿 Manim 的画法。C-106–C-195 是新写的。
