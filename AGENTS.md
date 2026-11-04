# AGENTS.md

给在本仓库里干活的 AI 助手（Claude Code、Codex、DeepSeek Harness 等）看的约定。想用这个风格库做视频，读 [`skills/ai-coding-video/SKILL.md`](skills/ai-coding-video/SKILL.md)。和维护者交流用中文。

## 目录

| 路径 | 是什么 | 怎么对待 |
|---|---|---|
| `skills/ai-coding-video/` | Skill 本体，唯一正本 | 改风格条目按它 README 的「维护」一节；改完跑 `python3 skills/ai-coding-video/scripts/build_index.py` 和 `--check` |
| `samples/<编号>/` | 1 级样片：一种风格的渲染代码 | 每帧只由时间 t 决定；出 16:9 和 9:16 两版；不引用任何外部图片、视频或生成模型 |
| `packs/<名字>/` | 2 级风格包 | 维护者通过的风格才做 |
| `site/` | 介绍页 | 纯静态、相对路径、所有资源放在本地（不用 CDN），中英双语；改模板 `site/src/index.html`，再跑 `python3 site/build.py`，见 [site/README.md](site/README.md) |
| `media.json` | 样片和风格包演示片视频的清单（视频本身在 GitHub Release） | 由 `scripts/media.py` 生成，不手改 |
| `candidates.md` | T 类、G 类候选及其截图、样片链接 | 正式收录时搬进 Skill 并删掉对应行 |
| `PLAN.md` | 批次规划和待办 | 做完的批次删掉，记进 Skill 的 CHANGELOG |

## 规矩

- **只收纯代码风格（C 类）**：画面全部由代码算出。需要照片、录屏、口播原片、真实数据的是 T 类，需要 AI 生图生视频的是 G 类，都暂不收。
- **不收第三方图片**：样片和缩略图必须由本仓库的代码渲染。
- **提示词用自己的话写**：参考来源只取做法，不复制原文；来源许可不是 MIT、Apache、CC BY 这类开放许可的，只能借风格名。以商业作品或在世艺术家命名的「致敬风格」可以收，名字写成「某某式」，提示词只描述画法；样片里的角色、场景、标志、台词全部原创。
- **样片的声音用自带的电子音**：全部由 `samples/lib/synth.py` 用代码合成，不调用第三方声音模型（TTS、AI 作曲），不用曲库、录音或采样（维护者定）。
- **视频不进仓库**：样片和风格包演示片的视频放在 GitHub Release，用 `scripts/media.py` 上传、下载，见 [samples/README.md](samples/README.md#视频放在哪)（维护者定）。
- **编号只增不改**；`data/styles.json` 和 `index.md` 的风格目录是生成物，不要手改。
- **一件事只记一处**：别处要用就放链接。数字（风格总数等）只出现在生成它的地方。
- 案例的工具链、费用、用时是原作者自述，写进文档时保留「未经核实」。
- 路径一律相对于脚本自身位置，不写死绝对路径。

## 开发时省 token

- 一批开一个新对话。开头只读本文件、[PLAN.md](PLAN.md) 里当批那一段和 [samples/API.md](samples/API.md)，其余按需用 `grep` 取片段，不整份读大文件（`styles/*.md`、`index.md`、`data/styles.json`）。
- 新样片用 `samples/new.py` 起骨架，`scene.js` 一次写全，之后用小范围替换修改，不把整份文件读回来。
- 出片用 `samples/batch.py`，在后台跑，跑完会通知，不写轮询循环；命令输出只看摘要和结尾几行，出错再看日志。
- 看图按顺序来：先看数字摘要，再看批量总览图，只有 ✗ 或可疑的才单独看。
- 不开子代理；临时脚本不放会话的临时目录，需要反复用的写进仓库。
- 预览页每批发一次；`main` 每批推一次（推到 `main` 会自动重新发布介绍页）。
- 分支：每次从最新的 `main` 开一个新分支干活，做完合并回 `main`，不留长期分支（维护者定）。
- 原仓库 `chans-gh/test` 平时用不到（opus40 的 40 种场景已全部移植），同步回原仓库时再临时加进来。
