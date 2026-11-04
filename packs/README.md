# 风格包（2 级）

[← 返回说明](../README.md)

风格包是维护者通过的风格做成的一套可复用代码：只改一个参数就能用在自己的项目里（C 类换品牌色；T、G 类换画面组织、画风这类别的维度），覆盖片头、讲解、数据、转场、字幕这些常用呈现，并附一份可以直接写进项目规范的风格说明。

| 包 | 来自 | 切换 | 部件 | 演示片 |
|---|---|---|---|---|
| [dark-keynote 暗色科技发布会](dark-keynote/) | [C-044](../skills/ai-coding-video/styles/framework.md#C-044) | 品牌色 | 背景、片头、讲解、数据、转场、字幕，外加一组声音 | 15 秒，紫、橙、绿三种品牌色，各有横竖两版 |
| [news-brief 新闻资讯解说](news-brief/) | [T-007](../skills/ai-coding-video/styles/footage.md#T-007) | 画面组织 | 栏目条、标题、对比、数据卡、标注、滚动出处、字幕、转场 | 15 秒，单图推拉、2.5D 视差分层、多图拼贴分屏三种，各有横竖两版 |
| [style-swap 分镜换画风](style-swap/) | [G-016](../skills/ai-coding-video/styles/generated.md#G-016) | 画风 | 提示词公式、镜头、提示词条、画风并排、字幕、转场 | 15 秒，写实摄影、水彩插画、3D 黏土三种，各有横竖两版 |

## 一个风格包里有什么

| 文件 | 是什么 |
|---|---|
| `pack.js` | 主题和部件。每个部件都是 `(ctx, K, t, o)`：`K` 是主题，`t` 是部件自己的本地时间，`o` 是内容；每帧只由 `t` 决定 |
| `sound_kit.py` | 每种部件出现时放什么音，全部由 `samples/lib/synth.py` 合成 |
| `STYLE.md` | 风格说明：调色板、字体、版式、运动、声音、禁止项，可以整段抄进项目规范 |
| `meta.json` | 名字、部件清单、演示用的几种切换，出片工具和介绍页都从这里读。切品牌色写 `accents`：`[键, 中文名, 英文名, 色值]`，播放器参数 `accent`；切别的维度写 `switch`（维度名 `[中文, 英文]`）和 `variants`：`[键, 中文名, 英文名, 值]`，播放器参数 `v`。第一种是默认 |
| `demo/` | 演示片：`scene.js` 把部件按时间轴排起来，`sound.py` 配声音，T、G 类的包另有 `assets/` 和 `assets.json`（素材和出处，随 Skill 安装），以及每种切换渲染好的横竖两版视频和静帧（`<包名>-<键>-<画幅>.mp4`；视频不进仓库，放在 Release，见 [samples/README.md](../samples/README.md#视频放在哪)） |

## 出片

```bash
cd samples
python3 batch.py pack:dark-keynote --quick   # 改代码时用：抽帧检查、合成声音、出总览图
python3 batch.py pack:dark-keynote           # meta.json 里每种切换各出横竖两版视频和静帧，写进 packs/dark-keynote/demo/
python3 batch.py pack:dark-keynote@orange    # 只出一种（@ 后面是 accents / variants 的键）
python3 batch.py pack:news-brief@parallax    # T 包只出 2.5D 视差分层那一种
```

浏览器里看：在 `samples/` 下起本地服务，打开 `player.html?s=pack:dark-keynote&ar=16x9&accent=%23FF7A45`（`accent` 换成你的品牌色），或 `player.html?s=pack:style-swap&ar=9x16&v=clay`。
