# dark-keynote 暗色科技发布会风格包

[← 全部风格包](https://github.com/Chans-gh/AI-Coding-Video/tree/main/packs/README.md)

由 [C-044 暗色科技发布会](../../styles/framework.md#C-044) 沉淀：近黑底、发丝网格、只有一个品牌强调色，元素按网格吸附、落在节拍上，扫光揭示，最后用一个巨大数字说出核心价值。适合软件发布、产品介绍、功能讲解、季度数据。

演示片（虚构产品「帧流 3」的发布短片）：同一份代码只换品牌色。介绍页的「风格包」一节可以点标签切换着看。风格说明见 [STYLE.md](STYLE.md)。

- **完整演示片**（紫，默认，横屏）：片头 → 四章（怎么用、有多快、谁在用、现已开放，每章一张章节卡加 2–3 个部件）→ 片尾，所有段部件都出现一次。不带旁白，字幕代替旁白。[![紫](https://raw.githubusercontent.com/Chans-gh/AI-Coding-Video/main/packs/dark-keynote/demo/dark-keynote-purple-16x9.jpg)](https://github.com/Chans-gh/AI-Coding-Video/releases/download/media/pack-dark-keynote-purple-16x9.mp4)
- **15 秒切换片段**：换品牌色对比用，横竖两版。

| 紫 `#8B7BFF`（默认） | 橙 `#FF7A45` | 绿 `#2BD99F` |
|---|---|---|
| [完整演示片](https://github.com/Chans-gh/AI-Coding-Video/releases/download/media/pack-dark-keynote-purple-16x9.mp4) · [竖屏 15 秒](https://github.com/Chans-gh/AI-Coding-Video/releases/download/media/pack-dark-keynote-purple-9x16.mp4) | [横屏](https://github.com/Chans-gh/AI-Coding-Video/releases/download/media/pack-dark-keynote-orange-16x9.mp4) · [竖屏](https://github.com/Chans-gh/AI-Coding-Video/releases/download/media/pack-dark-keynote-orange-9x16.mp4) | [横屏](https://github.com/Chans-gh/AI-Coding-Video/releases/download/media/pack-dark-keynote-green-16x9.mp4) · [竖屏](https://github.com/Chans-gh/AI-Coding-Video/releases/download/media/pack-dark-keynote-green-9x16.mp4) |

## 部件

所有部件在 [`pack.js`](pack.js) 的 `DK` 里，签名都是 `(ctx, K, t, o)`。`t` 是部件自己的本地时间（秒），可以为负（还没开始）。横竖构图由 `LAND` 自动切换。种类（段部件还是层）记在 [`meta.json`](meta.json) 的 `parts`。

| 部件 | 调用 | 内容 `o` | 时长 |
|---|---|---|---|
| 主题 | `K = DK.theme({ accent: '#FF7A45' })` | `accent` 品牌色；可选 `head`、`num`、`mono` 字体，`beat` 一拍几秒 | — |
| 片头 | `DK.title(ctx, K, t, o)` | `{ kicker, title, sub }` | 约 2 秒到位 |
| 章节卡 | `DK.chapter(ctx, K, t, o)` | `{ n, of, title, en }` | 约 1.2 秒到位 |
| 要点讲解 | `DK.explain(ctx, K, t, o)` | `{ kicker, title, steps: [...], label, start, every }` | `start + 步数 × every` |
| 代码演示 | `rows = DK.code(ctx, K, t, o)` | `{ kicker, title, sub, label, lines: [...], start, cps }`；返回每行的位置 | 打完所有字 |
| 标注 | `DK.callout(ctx, K, t, o)` | `{ x, y, w, h, label, side: 'right' / 'bottom' / 'top' }`，位置常取 `rows[i]` | 约 1.1 秒 |
| 界面框 | `DK.device(ctx, K, t, o)` | `{ kicker, title, label, total, start, secs }` | `start + secs` |
| 柱状图 + 大数字 | `DK.data(ctx, K, t, o)` | `{ kicker, title, bars: [{ label, v }], unit, digits, big: { from, to, digits, suffix, label, start } }` | 约 2.6 秒到位 |
| 折线图 | `DK.line(ctx, K, t, o)` | `{ kicker, title, labels, values, unit, digits, start, secs }` | `start + secs + 0.6` |
| 占比环 | `DK.ring(ctx, K, t, o)` | `{ kicker, title, items: [{ label, v }], start }` | `start + 项数 × 0.45 + 0.7` |
| 对比 | `DK.compare(ctx, K, t, o)` | `{ kicker, title, a, b, vs }`，`a`、`b` = `{ tag, name, value, unit, note, bar }`；`b` 是突出的一边 | 约 2.3 秒到位 |
| 大数字 | `DK.bigNumber(ctx, K, t, o)` | `{ kicker, from, to, digits, sep, prefix, suffix, label, sub, start }` | `start + 1.8` |
| 引用 | `DK.quote(ctx, K, t, o)` | `{ text, source, start, cps }` | `start + 字数 / cps` |
| 信息条 | `DK.lower(ctx, K, t, o)` | `{ name, role, tag }` | 约 1 秒到位 |
| 列表 | `DK.list(ctx, K, t, o)` | `{ kicker, title, items: [...], start, every }` | `start + 项数 × every` |
| 时间线 | `DK.timeline(ctx, K, t, o)` | `{ kicker, title, steps: [{ when, text }], now, nowLabel, start, every }` | `start + 步数 × every` |
| 片尾 | `DK.outro(ctx, K, t, o)` | `{ kicker, title, recap: [...], cta, foot }` | 约 `1.1 + 条数 × 0.75` 秒 |
| 背景（层） | `DK.backdrop(ctx, K, t)` | — | 全程 |
| 角标（层） | `DK.corner(ctx, K, t, o)` | `{ brand, ch: { n, of, title }, al }` | 全程，片头、章节卡、片尾 `al = 0` |
| 字幕（层） | `DK.caption(ctx, K, t, cues)` | `[{ a, b, text }]`，和画面同一条时间轴 | 全程 |
| 转场（层） | `DK.transition` 光边、`DK.push` 推移、`DK.dissolve` 叠化，都是 `(ctx, K, p, drawA, drawB)` | `p` 进度 0–1，`drawA`、`drawB` 各画一整帧（含背景） | 0.6–0.7 秒 |

还导出了几个零件，自己拼新部件时用：`DK.glass`（玻璃卡片）、`DK.sweep`（扫光）、`DK.kicker`（小标题）、`DK.head`（段标题）、`DK.logo`（标志）、`DK.pop`（吸附缓动）。

把部件排成一支片子，看 [`demo/segments.json`](demo/segments.json) 和 [`demo/scene.js`](demo/scene.js)：分段表每行一个段部件 `part`、时长 `d`、进场转场 `tr`（`edge` 光边 / `push` 推移 / `fade` 叠化）、内容 `o`、叠在这一段上的部件 `over`（标注、信息条）、字幕 `cues`；`scene.js` 照表画，背景、角标、字幕叠在上面。15 秒切换片段是 [`demo/clip.js`](demo/clip.js)。

## 声音

[`sound_kit.py`](sound_kit.py) 里每种部件一个函数，全部由 `synth.py` 合成：`bed_chapters` 按章起伏的铺底（一章换一个和弦、正文段有轻节拍、章节卡上退下），`title_in`、`chapter_in`、`step_in`、`typing`、`callout_in`、`progress`、`bars_in`、`number_in`、`line_in`、`ring_in`、`card_in`、`quote_in`、`lower_in`、`outro_in`，转场 `transition`、`push`、`dissolve`。[`demo/sound.py`](demo/sound.py) 读同一张分段表放音；15 秒切换片段用 `bed` 和 [`demo/clip_sound.py`](demo/clip_sound.py)。

## 用到自己的项目里

1. 拷 `pack.js`、`sound_kit.py`，以及它们依赖的 `samples/lib/lib.js`（缓动、`rr`、`wrapCJK` 等）和 `samples/lib/synth.py`。
2. `DK.theme({ accent: '你的品牌色' })`；字体换成项目自己的（`head`、`num`、`mono`）。
3. 照 `demo/segments.json` 写自己的分段表和字幕，`demo/scene.js`、`demo/sound.py` 照表出画面和声音，一般不用改。
4. 把 [STYLE.md](STYLE.md) 抄进项目规范，以后新做的画面按它来。

依赖 Canvas 2D；出片用本仓库的 `samples/batch.py`（Playwright + ffmpeg），或项目自己的逐帧渲染管线。
