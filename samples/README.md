# 样片（1 级）

[← 返回说明](../README.md)

每种风格一个文件夹，文件夹名就是风格编号。里面的 `scene.js` 是这种风格的全部渲染代码。同一份代码按画幅出横屏 16:9（1920×1080）和竖屏 9:16（1080×1920）两版，每版 3–5 秒，带声音。

| 文件 | 是什么 |
|---|---|
| `<编号>/scene.js` | 场景代码：`init()` 准备纹理，`draw(ctx, t)` 画出 t 秒那一帧；第一行注释是一句「怎么画的」，介绍页直接用 |
| `<编号>/sound.py` | 这段样片的配乐和音效：在哪个时刻放什么音 |
| `<编号>/meta.json` | 英文名、英文描述、技术标签（介绍页和风格条目的「技术（已验证）」从这里取） |
| `<编号>/<编号>-16x9.mp4`、`-9x16.mp4` | 渲染好的样片 |
| `<编号>/<编号>-16x9.jpg`、`-9x16.jpg` | 静帧 |
| `API.md` | `lib.js` 和 `synth.py` 的函数速查，写场景时读它，不用读源码；由 `tools/apidoc.py` 生成 |
| `lib/synth.py` | 合成器：鼓、拨弦、钟、方波、锯齿波、风声等，全部用代码算出波形 |
| `lib/lib.js` | 公共工具：确定性随机数、噪声、缓动、纸纹、WebGL 全屏着色器 |
| `player.html` | 在浏览器里播放某个样片，出片时也靠它逐帧截图 |
| `new.py` | 给新样片起骨架 |
| `batch.py` | 批量出片和自动检查，出总览图 |
| `render.py` | 出片核心（截图、合成声音、编码、缩略图），由 `batch.py` 调用 |
| `tools/mark.py` | 把出好的样片登记进风格条目 |
| `tools/apidoc.py` | 生成 `API.md` |
| `tools/brands.py` | 风格包换品牌色对照图，见 [packs/](../packs/README.md) |

## 怎么出片

需要 Node.js（装字体用）、Python 3、Playwright（`pip install playwright`，再 `playwright install chromium`）、Pillow、numpy、scipy 和 ffmpeg。

```bash
cd samples
npm install                          # 下载字体到 node_modules/（全部是 SIL OFL 开源字体）
python3 new.py C-168                 # 从风格条目起骨架：scene.js、sound.py、meta.json
python3 batch.py C-168 --quick       # 改代码时用：每个画幅只抽 8 帧低分辨率截图，合成声音，检查，出总览图
python3 batch.py C-168 C-169         # 出横竖两版视频、静帧，并更新 Skill 里的缩略图（4 路并行）
python3 batch.py all --quick         # 所有样片
python3 batch.py C-168 --sound       # 只合成声音到 out/C-168.wav，改配乐时试听
python3 tools/mark.py C-168          # 在风格条目里写上缩略图、「技术（已验证）」「样片代码」，并跑词典自检
python3 batch.py pack:dark-keynote   # 风格包的演示片（packs/dark-keynote/demo/），见 packs/README.md
```

`batch.py` 每个样片每个画幅只打一行摘要（✓，或 ✗ 加原因），详细日志在 `out/<编号>-<画幅>.log`。自动检查：脚本报错、黑屏或白屏、画面不动（比较相隔 0.2 秒的两帧）、声音静音或削波、时长（3–5 秒）、视频体积（超过 2.5 MB 自动加大压缩，仍超就报 ✗）。总览图 `out/sheet.jpg` 每行一个样片，横竖各 4 帧，最多 6 个样片一张，多的写 `sheet-2.jpg`。先看摘要，再看总览图，只有 ✗ 或看着可疑的才单独打开。

改了 `lib.js` 或 `synth.py` 的注释后跑 `python3 tools/apidoc.py` 更新 `API.md`（`--check` 检查是否过期）。

想在浏览器里看，要先在 `samples/` 下起一个本地服务，例如 `python3 -m http.server`，再打开 `http://localhost:8000/player.html?s=C-001&ar=16x9`。

发版用仓库根目录的 `scripts/release.sh "<提交说明>"`：登记样片 → 词典检查 → `API.md` 检查 → 生成介绍页 → 提交并推送当前分支；加 `--live` 再用无头浏览器打开线上介绍页，打一行结果（卡片数、报错、加载失败的文件）。

## 写新样片的规矩

- 每帧只由时间 t 决定：随机数用 `mulberry32` 或 `hash2`，不用 `Math.random()`，也不读系统时间。这样同一份代码每次渲染的结果都一样。
- 画面全部由代码算出，不引用任何外部图片、视频或生成模型。字体只用开源字体，写进 `package.json`。
- 声音只用 `lib/synth.py` 的合成器（自带电子音），不调用第三方声音模型，不用曲库、录音或采样。动作发生的时刻放一个对应材质的音，写法见 Skill 的[声音篇](../skills/ai-coding-video/sound.md)。
- 横竖两版用同一份代码：读 `W`、`H`、`LAND`（是否横屏）来定构图。不要只把竖屏画面拉伸或裁切成横屏。
- 做完后跑 `tools/mark.py` 登记进风格条目（缩略图、「技术（已验证）」「样片代码」），条目格式见 Skill 的 [README](../skills/ai-coding-video/README.md)。

前 40 种场景改写自维护者早先的作品 opus40，原片只有竖屏，横屏版是逐个场景重新构图的。
