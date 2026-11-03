# AI Coding Video

**Coding Video**：让 AI 写代码，由代码逐帧算出画面来做动画视频。不用 AI 生图生视频，也不剪辑现成素材，每一帧都由程序在时间 t 上确定地画出来。

这个仓库是一个给 AI 助手用的 Skill：上百种纯代码能做出来的视觉风格，每种一句可复制的风格提示词和技术标签，配上选风格索引、提示词方法、配乐与中文旁白音色指南。Claude Code、Codex、DeepSeek Harness、WorkBuddy 等支持 Agent Skills（`SKILL.md`）格式的助手都能直接装。

## 三级用法

| 级别 | 是什么 | 在哪 |
|---|---|---|
| 0 级：词典 | 全部风格的提示词、题材、技术标签、选风格索引 | [`skills/ai-coding-video/`](skills/ai-coding-video/) |
| 1 级：样片 | 选中的风格做成 3–5 秒样片，横屏 16:9 和竖屏 9:16 各一版，附可复现的代码 | [`samples/`](samples/) |
| 2 级：风格包 | 通过的风格做成可换品牌色的代码模块，覆盖片头、讲解、数据、转场等常用呈现 | [`packs/`](packs/)（第 1 个：暗色科技发布会） |

Skill 里写的是指引：AI 助手会按这三级，在你自己的项目里帮你选风格、出样片、沉淀成风格包。本仓库的样片和风格包是示范。进度见 [PLAN.md](PLAN.md)。

## 安装

**Claude Code**（插件市场）：

```bash
claude plugin marketplace add chans-gh/AI-Coding-Video
claude plugin install ai-coding-video@ai-coding-video
```

**其他助手**（拷贝 Skill 文件夹）：先 `git clone` 本仓库，再运行：

```bash
scripts/install.sh claude   # → ~/.claude/skills/ai-coding-video
scripts/install.sh codex    # → ~/.agents/skills/ai-coding-video（Codex，DeepSeek Harness 也读这里）
scripts/install.sh dsh      # → ~/.dsh/skills/ai-coding-video（DeepSeek Harness）
scripts/install.sh all      # 以上三处都装
scripts/install.sh codex ~/my-project   # 只装进某个项目
scripts/install.sh zip      # 打成 dist/ai-coding-video.zip，用于 WorkBuddy 等“上传技能包”的助手
```

装好以后直接问：“给一支讲水循环的 60 秒科普片选个风格”“用 C-013 皮影戏的风格写一段 Canvas 动画”。

## 仓库结构

```
skills/ai-coding-video/   Skill 本体（唯一正本）
samples/                  1 级样片：每种风格的渲染代码和出片脚本（陆续加入）
packs/                    2 级风格包：部件代码、风格说明、演示片
site/                     介绍页（纯静态，可整个拷到任意服务器）
scripts/install.sh        安装到各家助手
.claude-plugin/           Claude Code 插件与插件市场清单
candidates.md             待收录的 T 类、G 类候选（带原作者的截图和样片链接）
AGENTS.md                 给在本仓库里干活的 AI 助手看的约定
```

## 许可

[MIT](LICENSE)。文字、代码和本仓库渲染的样片都适用。风格提示词由整理者用自己的话写成，参考来源见 [sources.md](skills/ai-coding-video/sources.md)；本仓库不收录任何第三方图片。「致敬风格」里提到的作品名和作者名归各自权利人所有，本仓库与他们没有关联，样片里的角色和场景都是原创的。
