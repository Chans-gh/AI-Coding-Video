# 来源与可安装的风格库

[← 返回说明](README.md)

## 可直接安装的风格库与 skill

想省掉写长提示词，最直接的是装 Lemo-Opuscar：39 种风格各有一份完整说明，只要说风格名和主题即可。作者称一支片子约需 30–60 分钟，token 用量不小。

| 名称 | 内容 | 安装或使用 |
|---|---|---|
| [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) | 39 种风格的 STYLE.md、导演指南、技术指南、样片；纯代码，不用视频生成 | `claude plugin marketplace add lemomo-ai/lemo-opuscar`，再 `claude plugin install lemo-opuscar@lemolab` |
| [animasyon-stil-katalogu](https://github.com/yasinozmeen/animasyon-stil-katalogu) | 20 种风格的 anim.html 源码 + 生成它们的 BRIEF.md | clone 后把 BRIEF.md 当提示词范本 |
| [opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills) | painted-animation（水彩手绘动画、卡拉 OK 歌词 MV）、kinetic-reel（动态排版 + three.js 图层） | `/plugin marketplace add tuzhechen2005/opus-video-skills` |
| [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | p5.js + p5.brush 手绘卡通底板、31 种表演情绪 | clone |
| [Papermotion](https://github.com/francozanardi/papermotion) | 剪纸动画引擎：物理、角色绑定、离线渲染 | clone |
| [claude-animation-skill](https://github.com/buildwithhanif/claude-animation-skill) | 代码动画管线、角色 rig、确定性检查（蚁蚁短片源码） | clone |
| [opus-js-animations](https://github.com/klsoen/opus-js-animations) | 导演式流程：brief → 声音 → 导演阐述 → 帧精确 MP4 | `npx skills add klsoen/opus-js-animations` |
| [claude-horizon-animation](https://github.com/misbahsy/claude-horizon-animation) | 复刻 Opus 5.5 发布片风格 | `npx skills add misbahsy/claude-horizon-animation` |
| [visual-skills](https://github.com/smixs/visual-skills) | 外部视频模型路径：剪辑理论 + Seedance/Kling/Veo 提示词语法 | `npx skills add smixs/visual-skills` |

更多 skill 见 [awesome-opus-video-skills](https://github.com/ismoshushi/awesome-opus-video-skills)（17 个）和 [awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills)（168 个仓库，按类型分组）。

## 风格条目的来源

本库的风格条目和方法整理自下面这些公开资料。风格提示词是整理者改写的一句话版本，不是原文复制；本库不收录任何来源里的图片，样帧都由本仓库的代码渲染。

第一批（2026-09-27）：

- [yasinozmeen/animasyon-stil-katalogu](https://github.com/yasinozmeen/animasyon-stil-katalogu)：20 种风格、BRIEF.md
- [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar)：39 种风格的 STYLE.md、[DIRECTOR.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/DIRECTOR.md)
- [athemeroy/awesome-opus-5-5-videos](https://github.com/athemeroy/awesome-opus-5-5-videos)：[168 案例目录](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/docs/cases-index.zh-CN.md)、[案例数据表](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/data/cases.csv)、[提示词模板](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/docs/prompt-playbook.zh-CN.md)、[制作路径指南](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/docs/visual-effects-fit.zh-CN.md)
- [opusvideo/awesome-claude-video](https://github.com/opusvideo/awesome-claude-video)：[实现清单](https://github.com/opusvideo/awesome-claude-video/blob/main/IMPLEMENTATION_GUIDES.md)
- [tuzhechen2005/opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills)
- [ismoshushi/awesome-opus-video-skills](https://github.com/ismoshushi/awesome-opus-video-skills)
- [zhuyansen/awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills)
- [howtouselinux：为什么有人用 Opus 5.5 做视频效果好、有人一般](https://www.howtouselinux.com/post/everyones-making-videos-with-opus-5-5-so-why-do-some-people-get-magic-and-others-get-meh)

第二批（2026-09-28）：

- [jinhanbuilds/opus-5-5-motion-gallery](https://github.com/jinhanbuilds/opus-5-5-motion-gallery)：22 条动效提示词与演示
- [huahua99599-commits/awesome-opus-gallery](https://github.com/huahua99599-commits/awesome-opus-gallery)：32 个案例与作者公开提示词
- [TripoGrowthLab/awesome-opus-5-5-prompts](https://github.com/TripoGrowthLab/awesome-opus-5-5-prompts)：3D 与动画提示词库
- [awesome-opus-5-5-videos 分类数据](https://github.com/athemeroy/awesome-opus-5-5-videos/blob/main/data/domain-style.csv)：1,401 个视频的主题与风格标签
- [iArt.ai：AI JavaScript animation](https://www.iart.ai/blog/ai-javascript-animation)
- [Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills)

声音篇的来源：

- [hexgrad/Kokoro-82M-v1.1-zh 模型说明](https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh) · [官方示例 make_zh.py](https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh/blob/main/samples/make_zh.py)
- [sherpa-onnx：kokoro-multi-lang-v1_1 试听页](https://k2-fsa.github.io/sherpa/onnx/tts/all/Chinese-English/kokoro-multi-lang-v1_1.html)（音色实测用的也是这里发布的模型文件）
- [Lemo-Opuscar 各风格 STYLE.md](https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles) 的 Sound 章节与 [DIRECTOR.md](https://github.com/lemomo-ai/lemo-opuscar/blob/main/DIRECTOR.md)

案例里的工具链、费用、用时都是作者自述，未经独立核实。

第三批（2026-10-06），提示词据下列仓库的风格说明改写：

| 仓库 | 许可 | 用到的内容 | 本库编号 |
|---|---|---|---|
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | MIT | `styles/` 里原文档没有收录的 4 种：engraving、hologram-hud、midcentury-toon、silkscreen-poster（该仓库现有 43 种风格，原文档收录了其中 39 种） | C-096、C-098、C-104、C-105 |
| [alexgreensh/anidoodle](https://github.com/alexgreensh/anidoodle) | Apache-2.0 | 31 种代码绘制风格里原文档没有的 10 种，配方见 `skills/anidoodle/references/styles/` | C-088、C-089、C-090、C-091、C-092、C-093、C-094、C-097、C-099、C-100 |
| [AllenAI2014/remotion-guofeng-starter](https://github.com/AllenAI2014/remotion-guofeng-starter) | 代码 MIT；演示素材仅供学习（本库只借用风格做法，不用其素材） | 国风纸片拼贴动画的视觉 DNA 与色卡 | C-095 |
| [bangtutorial/bang-motion](https://github.com/bangtutorial/bang-motion) | MIT | README「Style gallery」里的 4 种动效风格 | C-101、C-102、C-103 |

第四批（2026-11-03），提示词据下列仓库的风格说明改写（许可都核对过 LICENSE 文件）：

| 仓库 | 许可 | 用到的内容 | 本库编号 |
|---|---|---|---|
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | MIT | 10 月以后新增的纯代码风格 7 种（孟菲斯微缩景、地铁线路图、等距绘本、刻线印刷长镜头、电路板、桌面穿梭、电视新闻包装） | C-106–C-112 |
| [Changroro/code-video](https://github.com/Changroro/code-video) | MIT | `references/styles/` 里的 11 种（翻牌显示板、霓虹灯牌、热敏小票等） | C-113–C-123 |
| [madhavsomani/animation-skills](https://github.com/madhavsomani/animation-skills) | MIT | 4 种，只取代码绘制的部分（原作画面中心的真人抠像不收）；C-118 也参考了它的 pixel-arcade | C-124–C-127 |
| [alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) | MIT | `references/风格配方/` 的艺术史风格卡，按流派合并改写，不用画家名命名；商业 IP 和在世艺术家的画风不收 | C-128–C-152 |
| [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | MIT | 5 种（合成波、逐帧沸腾线、液态融合、图形形变、粗描边贴纸科普） | C-153–C-157 |
| [cyborggirl963/opus-5.5-music-video-art-styles](https://github.com/cyborggirl963/opus-5.5-music-video-art-styles) | MIT | 10 种手作媒材风格（大理石纹染纸、魔灯幻灯片、蜡染等） | C-158–C-167 |

C-168–C-186（字雨、光标打字、雨窗、工笔、年画、青花、京剧脸谱、书法等 19 种）只借了一份没有开源许可的汇编里的风格名，提示词由整理者凭公共常识原创，没有参考其文本，所以条目里没有参考链接。
