# AGENTS.md

给在本仓库里干活的 AI 助手（Claude Code、Codex、DeepSeek Harness 等）看的约定。想用这个风格库做视频，读 [`skills/ai-coding-video/SKILL.md`](skills/ai-coding-video/SKILL.md)。和维护者交流用中文。

## 目录

| 路径 | 是什么 | 怎么对待 |
|---|---|---|
| `skills/ai-coding-video/` | Skill 本体，唯一正本 | 改风格条目按它 README 的「维护」一节；改完跑 `python3 skills/ai-coding-video/scripts/build_index.py` 和 `--check` |
| `skills/ai-coding-video/samples/`、`packs/` | 随 Skill 安装的样片和风格包代码（不含截图、T/G 类样片的素材和只给维护者用的工具；风格包演示片的素材 `packs/<名字>/demo/assets/` 随包安装，拷出去就能跑） | 生成物，不手改：改仓库根目录的 `samples/`、`packs/` 后跑 `build_index.py` 同步，`--check` 会查 |
| `samples/<编号>/` | 样片：C 类是一种风格的渲染代码；T 类、G 类另带 `assets/` 素材和 `assets.json` | 每帧只由时间 t 决定；出 16:9 和 9:16 两版；C 类不引用任何外部图片、视频或生成模型 |
| `packs/<名字>/` | 2 级风格包 | 维护者通过的风格才做；C 类切换品牌色（`accents`），T、G 类切换别的维度（`switch` + `variants`），素材规矩同 T、G 类样片，每个包合计不超过 10 MB |
| `cases/<名字>/` | 介绍页「真实应用」模块的 3 支完整视频：分镜、代码、素材清单、制作记录 | 规矩见 [cases/README.md](cases/README.md)；不受样片素材 10 MB 的限制 |
| `site/` | 介绍页 | 纯静态、相对路径、所有资源放在本地（不用 CDN），中英双语；改模板 `site/src/index.html`，本地预览跑 `python3 site/build.py`。生成的页面、字体、媒体不进仓库，发布时在 CI 里生成，见 [site/README.md](site/README.md) |
| `media.json` | 样片和风格包演示片视频的清单（视频本身在 GitHub Release） | 由 `scripts/media.py` 生成，不手改 |
| `candidates.md` | T 类、G 类候选及其截图、样片链接 | 正式收录时搬进 Skill 并删掉对应行 |
| `PLAN.md` | 批次规划和待办 | 做完的批次删掉，记进 Skill 的 CHANGELOG |

## 规矩

- **1 级（C 类）只收纯代码风格**：画面全部由代码算出。需要照片、录屏、口播原片、真实数据的是 T 类，需要 AI 生图生视频的是 G 类，规矩见下面「T 类、G 类」。
- **不收第三方图片**：样片和缩略图必须由本仓库的代码渲染；T 类样片里的公共领域素材也要经本仓库的代码合成后出片，不直接拿别人的成片当样片。
- **提示词用自己的话写**：参考来源只取做法，不复制原文；来源许可不是 MIT、Apache、CC BY 这类开放许可的，只能借风格名。以商业作品或在世艺术家命名的「致敬风格」可以收，名字写成「某某式」，提示词只描述画法；样片里的角色、场景、标志、台词全部原创。
- **1 级样片的声音用自带的电子音**：全部由 `samples/lib/synth.py` 用代码合成，不调用第三方声音模型（TTS、AI 作曲），不用曲库、录音或采样（维护者定）。T 类、G 类的声音见下。
- **视频不进仓库**：样片和风格包演示片的视频放在 GitHub Release，用 `scripts/media.py` 上传、下载，见 [samples/README.md](samples/README.md#视频放在哪)（维护者定）。
- **按目录分工**：介绍页的优化只改 `site/`，不碰 `skills/`、`samples/`、`packs/`；改 Skill、样片也不用动 `site/`，推到 `main` 后页面按最新的数据重新生成。页面要用的新数据，先进 Skill 的 `data/styles.json` 或样片的 `meta.json`，再由 `site/build.py` 读（维护者定）。
- **编号只增不改**；`data/styles.json`、`index.md` 的风格目录和 Skill 里的 `samples/`、`packs/` 是生成物，不要手改。
- **一件事只记一处**：别处要用就放链接。数字（风格总数等）只出现在生成它的地方。
- 案例的工具链、费用、用时是原作者自述，写进文档时保留「未经核实」。
- 路径一律相对于脚本自身位置，不写死绝对路径。

## T 类、G 类（维护者定）

- **按内容类型分**，站在用户的角度：他看到或想做的那种视频属于哪一类，就去哪一类找做法。内容类型两类共用，取值在 `skills/ai-coding-video/data/tags.json` 的 `content_types`；1 级仍按风格和题材分。
- **每个样片标出用到的素材**，3 种、2 种、1 种的组合都要有。T 类：录像（含口播）、录屏、照片、数据（表格、地图、卫星图、点云）、三维模型（CC0 网格和贴图）；G 类：生图（含语言模型写的 SVG）、生视频、语音合成，也可以搭配 T 类的公开素材（如 CC0 三维模型），出处、许可照 T 类记。
- **T 类只用公共领域素材**（NASA、美国国会图书馆、Wikimedia Commons 上标为公共领域或 CC0 的等），每份记下出处链接和许可。素材里有人物的，照出处原样使用，不另加个人信息。
- **G 类经服务商接口生成**：样片代码和 Skill 只认 `samples/tools/gen.py` 的四个环境变量（`AICV_IMAGE_CMD`、`AICV_VIDEO_CMD`、`AICV_TTS_CMD`、`AICV_SVG_CMD`），不写死哪一家服务；Skill 里提到青水只在 `sources.md` 的来源说明。维护者出样片用青水：把 `chans-gh/test` 加进会话、克隆到本仓库旁边，再 `source scripts/providers/qingshui.env`，生图、生视频、语音合成交给 `scripts/providers/qingshui.py`，它调青水 Skill 的 `scripts/run.js`、`scripts/api.js`，不把青水的文件复制进本仓库。Key 只用环境变量 `QINGSHUI_API_KEY`，绝不写进代码、日志、提交。生成矢量用 DeepSeek：`source scripts/providers/deepseek.env`，交给 `scripts/providers/deepseek.py`，Key 只用环境变量 `DEEPSEEK_API_KEY`。先用最便宜的模型试，满意再用好的；每个样片几张图、一两段视频即可。不生成真实人物的脸和声音，提示词里不写真实人名和私人信息。
- **素材进仓库**：放在 `samples/<编号>/assets/`，每个样片合计不超过 10 MB；同目录的 `assets.json` 记每份素材的出处链接、许可（G 类记模型名、参数和提示词）。进仓库前脱敏：不留 Key、账号、任务编号、带签名的下载链接和青水返回的原始响应；图片、视频去掉元数据（ffmpeg 加 `-map_metadata -1`，图片用 Pillow 重存）。
- **声音**：不用 1 级的电子音。旁白用语音合成的公开音色，不用克隆音色；配乐和音效用公开曲库里允许再分发的（公共领域、CC0，或 CC BY 并在片尾和样片说明里署名），不用只许在作品里使用、不许单独再分发音频文件的那类许可。每个音频也记进 `assets.json`。
- **样片规格**：8–15 秒，横竖两版，每个视频不超过 4 MB；仍用 `samples/batch.py` 出片。

## 开发时省 token

- 一批开一个新对话。开头只读本文件、[PLAN.md](PLAN.md) 里当批那一段和 [samples/API.md](samples/API.md)，其余按需用 `grep` 取片段，不整份读大文件（`styles/*.md`、`index.md`、`data/styles.json`）。
- 新样片用 `samples/new.py` 起骨架，`scene.js` 一次写全，之后用小范围替换修改，不把整份文件读回来。
- 出片用 `samples/batch.py`，在后台跑，跑完会通知，不写轮询循环；命令输出只看摘要和结尾几行，出错再看日志。
- 看图按顺序来：先看数字摘要，再看批量总览图，只有 ✗ 或可疑的才单独看。
- 不开子代理；临时脚本不放会话的临时目录，需要反复用的写进仓库。
- 预览页每批发一次；`main` 每批推一次（改了 `site/`、`skills/`、`samples/`、`packs/`、`media.json` 的推送会自动重新发布介绍页）。
- 分支：每次从最新的 `main` 开一个新分支干活，做完合并回 `main`，不留长期分支（维护者定）。Skill 的 `CHANGELOG.md` 在 `.gitattributes` 里设了 `merge=union`，并行的分支各在表头下加一行，合并时两行都保留；合并后看一眼顺序。
- 原仓库 `chans-gh/test` 平时用不到（opus40 的 40 种场景已全部移植），同步回原仓库时再临时加进来。
