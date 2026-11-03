# 风格包（2 级）

[← 返回说明](../README.md)

风格包是维护者通过的风格做成的一套可复用代码：换一个品牌色就能用在自己的项目里，覆盖片头、讲解、数据、转场、字幕这些常用呈现，并附一份可以直接写进项目规范的风格说明。

| 包 | 来自 | 部件 | 演示片 |
|---|---|---|---|
| [dark-keynote 暗色科技发布会](dark-keynote/) | [C-044](../skills/ai-coding-video/styles/framework.md#C-044) | 背景、片头、讲解、数据、转场、字幕，外加一组声音 | 15 秒，横竖两版 |

## 一个风格包里有什么

| 文件 | 是什么 |
|---|---|
| `pack.js` | 主题和部件。每个部件都是 `(ctx, K, t, o)`：`K` 是主题，`t` 是部件自己的本地时间，`o` 是内容；每帧只由 `t` 决定 |
| `sound_kit.py` | 每种部件出现时放什么音，全部由 `samples/lib/synth.py` 合成 |
| `STYLE.md` | 风格说明：调色板、字体、版式、运动、声音、禁止项，可以整段抄进项目规范 |
| `demo/` | 演示片：`scene.js` 把部件按时间轴排起来，`sound.py` 配声音，以及渲染好的横竖两版视频和静帧 |
| `brands.jpg` | 换品牌色对照：同一演示片在几种强调色下的截帧 |

## 出片

```bash
cd samples
python3 batch.py pack:dark-keynote --quick   # 改代码时用：抽帧检查、合成声音、出总览图
python3 batch.py pack:dark-keynote           # 出横竖两版视频和静帧，写进 packs/dark-keynote/demo/
python3 tools/brands.py dark-keynote         # 换品牌色对照图 → packs/dark-keynote/brands.jpg
```

浏览器里看：在 `samples/` 下起本地服务，打开 `player.html?s=pack:dark-keynote&ar=16x9&accent=%23FF7A45`（`accent` 换成你的品牌色）。
