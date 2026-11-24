# 参考片拆解与换题出片

## 入口

| 用户的请求 | 做法 |
|---|---|
| 上传视频并说「用这条参考片建模板」 | 抽帧、听音、读字，建八维模板。试做同题回放，再请用户看同题和换题结果 |
| 指定模板换题，或在已启用模板的项目说「主题：做条关于占有欲的视频」 | 读对应版本，补齐新题的主张、道具动作、屏幕字和对白，渲染并交付带声 MP4 |
| 「把这份设为项目默认模板」 | 校验该版本已写入同题、换题和人工对照记录，再执行 `activate` |

以用户指定的项目目录为准，默认从当前目录向上找最近的 `reference-templates/active.json`。显式指定模板时用 `--template`。项目没有启用模板时走原有出片流程。初次建档和验收可以显式使用草稿。用户启用模板后，收到换题出片请求直接产出成片和检查结果。

## 拆解与建档

设 `REF` 为本 Skill 的 `samples/tools/reference.py`，`PROJECT` 为用户的项目目录。下面的路径可按项目取名。

```bash
python3 "$REF" inspect input.mp4 evidence
python3 "$REF" save "$PROJECT" analysis.json --evidence evidence/evidence.json
```

`inspect` 读规格，最多分析前 45 秒，输出 `evidence.json`、带时间戳的 `frames.jpg` 和可听的 `audio.wav`（有音轨时）。闪白和硬切候选需要看片确认。打开总览图，必要时对关键节点抽取全分辨率帧读字。回听语句、停顿与重音。转写可用环境中能听音的工具或 [sound.md](sound.md) 的回听配置。每条证据标明 `observed`（观察）、`inferred`（推断）或 `uncertain`（待确认），并存毫秒位置。缺少可用的听音条件时保留 `speech.mode: "uncertain"`。

写 `analysis.json` 时按下表填字段。`save` 追加 `source`，生成 `reference-templates/<template_id>-v<version>.md`，写好人读的表和唯一的 JSON 结构块。保存时以 `evidence.json` 记录的参考片哈希和规格为准。新版本递增 `version`。

| 字段 | 结构 |
|---|---|
| `schema_version`、`template_id`、`version` | `1`、小写连字符 ID、正整数 |
| `defaults` | `width`、`height`、`fps`、`duration_ms`。取接近参考片的成片规格 |
| `topic` | `theme` 主题、`thesis` 一句话主张、`prop` 核心道具 |
| `dimensions` | 下方八个键。每项含 `fixed`、`rewrite`、`evidence`。证据是 `{at_ms, end_ms?, kind, note}` 数组 |
| `beats` | `[{id, start_ms, end_ms, purpose, expression}]`，按顺序覆盖整片。每段记下叙事目的和这段要表达什么 |
| `cues` | `action`、`screen`、`sound`、`transition` 四个数组。每项都要 `id`、`beat_id`、`at_ms`。动作和屏幕另有 `end_ms`。屏幕另有 `role`、`text` 和可选的强调词 `accent`。其余用 `type` |
| `speech` | `{mode, speakers, lines}`，见下节 |
| `topic_slots` | `theme`、`thesis`、`prop`、`actions`、`screen`、`speech`、`ending` 各写一条改写约束 |
| `render` | `{style, refs, layout?}`。暗红木偶首版填 `"dark-puppet"` 与 `["C-013","C-121"]`。画幅比例用 `layout` 的 `left`、`right`、`floor`、`character_scale` 表示。尚无可用实现的风格填 `style: null` 并保留待验证状态 |

八个键分别为 `content` 内容方向、`storyboard` 叙事分镜、`visual` 视觉风格、`screen_copy` 屏幕文案与字幕、`editing` 时间剪辑、`sound` 声音音效、`composition` 构图道具、`dialogue` 文案对白。把构图、色板、道具连接点和声画时刻写到可回查的证据里。动作目的或寓意可写推断。

### 文案对白

- `visual_only` 代表纯字幕。说话人和台词各用空数组，`beats[].expression` 仍说明每段表达作用。
- `voiceover` 供一位旁白使用。填写一个说话人和其台词。
- `character_dialogue` 供角色轮流说话。说话人用 `{id, name, voice?}`，其中 `voice` 取现有 `{model, voice, speed}` 音色配置。
- 每句台词填写 `{id, beat_id, speaker_id, to, source_text, purpose, delivery, start_ms, end_ms, rewrite_rule, screen_copy_id?}`。按开始时间排列，留够必要的停顿。屏幕上有对应文字时写它的 ID。

出片按说话人逐句调用现有 `AICV_TTS_CMD` 接口。使用多音色时由说话人表分配音色，避免设置全局 `AICV_TTS_VOICE`。已有可使用的录音时，通过 `--audio-dir` 提供 `<台词 id>.wav`。合成后以实长进时间轴。超出时窗先缩句，仍排不进则调整节拍后重新验收。

## 渲染与启用

首版支持 8–20 秒单场景二维动画的暗红木偶舞台。舞台和收尾取 C-013、C-121 的画法，角色和声音由代码重建。用本地 Python、NumPy、Pillow、SciPy、FFmpeg、FFprobe 和 Node.js。木偶绘制使用 `@napi-rs/canvas`，环境缺少时在项目目录安装这个依赖。中文画面使用 Noto Serif CJK SC 或系统宋体。

- 动作类型 `connect` 连线、`tug` 收线、`split` 分线、`suspend` 吊起、`wrap` 加围线（两次完成）、`close` 闭合、`step` 前迈、`release` 松开、`hold` 停顿。
- 屏幕位置 `headline` 上方主字幕、`label` 主体间小字、`title` 片名、`translation` 小标题、`tag` 两侧吊牌、`epilogue` 点题语、`caption` 底部字幕。
- 声音类型 `plink` 轻叮、`tension` 拨弦、`swish` 过风、`impact` 重音、`tag` 木响。使用一个 `flash` 转场与片名同帧，片名重音放在两帧内。

同题用 `--replay`。参考片用于对照。为同题回放保留八维观察值和模板中的原创重建组件。

换题时根据用户的一句主题，读取模板结构块与 `topic_slots`，写 `episode.json`。顶层填写新 `theme`、`thesis` 和 `prop`。`actions` 用原动作 ID 对应新动作类型，`screen` 用每个屏幕 ID 对应 `{text, accent?}`，`lines` 用每句 ID 对应改写后的台词，`sounds` 可以按 ID 只替换需要调整的声音。纯字幕的 `lines` 用空对象。可把小字、吊牌和小标题设为空，保留主字幕、片名和片尾句。让道具变化承载新的关系判断，再让字幕和对白各自完成自己的含义。题目超出当前动作能表达的范围时，照模板的风格规则定新组件或走完整出片。

```bash
python3 "$REF" render "$PROJECT" replay --template template.md --replay
python3 "$REF" render "$PROJECT" rethemed --template template.md --episode episode.json
python3 "$REF" record template.md --replay replay --episode rethemed --review '写入实际关键帧、道具、屏幕字和对白的对照结论'
python3 "$REF" activate "$PROJECT" template.md
python3 "$REF" active "$PROJECT"
python3 "$REF" render "$PROJECT" next-episode --episode next-episode.json
```

输出目录包含 `storyboard.json`、`script.json`、`timing.json`、`film.mp4`、`review.jpg` 和 `report.json`。画面、台词和音效读同一份时间轴，复用整片工具的混音、响度和帧间隔检查。同题闪白相对参考片的候选时间允许 200 毫秒误差。换题验收要看道具动作、片名和文案是否讲得通，确认该风格在无参考视频输入的情况下仍能辨认。展示同题与换题样片供用户选定模板版本。项目文件中保存一份启用的 ID 和版本，并校验该版本的内容指纹。

用户指定画幅或时长时传 `--ar 16:9` 或 `--ar 9:16`、`--duration-ms <整数>`。锚点随时长按比例挪动并吸附到帧边界。生成后检查主体、屏幕字和台词能否在新规格中排开。关键字需要更长停留或台词过长时，先减字或改写。
