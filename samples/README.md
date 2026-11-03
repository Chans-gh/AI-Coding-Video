# 样片（1 级）

[← 返回说明](../README.md)

每种风格一个文件夹，文件夹名就是风格编号。里面的 `scene.js` 是这种风格的全部渲染代码。同一份代码按画幅出横屏 16:9（1920×1080）和竖屏 9:16（1080×1920）两版，每版 3–5 秒，带声音。

| 文件 | 是什么 |
|---|---|
| `<编号>/scene.js` | 场景代码：`init()` 准备纹理，`draw(ctx, t)` 画出 t 秒那一帧 |
| `<编号>/<编号>-16x9.mp4`、`-9x16.mp4` | 渲染好的样片 |
| `<编号>/<编号>-16x9.jpg`、`-9x16.jpg` | 静帧 |
| `<编号>/sound.py` | 这段样片的配乐和音效：在哪个时刻放什么音 |
| `lib/synth.py` | 合成器：鼓、拨弦、钟、方波、锯齿波、风声等，全部用代码算出波形 |
| `lib/lib.js` | 公共工具：确定性随机数、噪声、缓动、纸纹、WebGL 全屏着色器 |
| `player.html` | 在浏览器里播放某个样片，出片脚本也靠它逐帧截图 |
| `render.py` | 出片脚本 |

## 怎么出片

需要 Node.js（装字体用）、Python 3、Playwright（`pip install playwright`，再 `playwright install chromium`）、Pillow、numpy、scipy 和 ffmpeg。

```bash
cd samples
npm install                      # 下载字体到 node_modules/（全部是 SIL OFL 开源字体）
python3 render.py C-001          # 出横竖两版视频、静帧，并更新 Skill 里的缩略图
python3 render.py C-001 --sheet  # 只出联系表到 out/，改代码时快速看效果
python3 render.py C-001 --sound  # 只合成声音到 out/C-001.wav，改配乐时试听
```

想在浏览器里看，要先在 `samples/` 下起一个本地服务，例如 `python3 -m http.server`，再打开 `http://localhost:8000/player.html?s=C-001&ar=16x9`。

## 写新样片的规矩

- 每帧只由时间 t 决定：随机数用 `mulberry32` 或 `hash2`，不用 `Math.random()`，也不读系统时间。这样同一份代码每次渲染的结果都一样。
- 画面全部由代码算出，不引用任何外部图片、视频或生成模型。字体只用开源字体，写进 `package.json`。
- 声音只用 `lib/synth.py` 的合成器（自带电子音），不调用第三方声音模型，不用曲库、录音或采样。动作发生的时刻放一个对应材质的音，写法见 Skill 的[声音篇](../skills/ai-coding-video/sound.md)。
- 横竖两版用同一份代码：读 `W`、`H`、`LAND`（是否横屏）来定构图。不要只把竖屏画面拉伸或裁切成横屏。
- 做完后，在风格条目里加缩略图，并写上「技术（已验证）」和「样片代码」，方法见 Skill 的 [README](../skills/ai-coding-video/README.md)。

前 40 种场景改写自维护者早先的作品 opus40，原片只有竖屏，横屏版是逐个场景重新构图的。
