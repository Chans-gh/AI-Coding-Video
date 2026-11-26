# SPEC：C 类主风格混入 T / G 素材工作流规格

- **状态**：已拍板基线（211 条 C 类初筛表见 [SPEC-c-media-screening.md](SPEC-c-media-screening.md)，可直接启动 Phase 1）
- **基准版本**：`v0.32.0`（270 种风格：C 211 / T 28 / G 31）
- **定位**：开发基线规格书。按本仓库约定，3 阶段全部合入 `main` 后一并删除 `SPEC.md` 与 `SPEC-c-media-screening.md`。

---

## 1. 背景与设计红线

样片库按 **C（纯代码）/ T（真实素材）/ G（AI 生成素材）** 三类划分，目的是展示以不同素材为核心来源时画面如何组织，这一分类本身正确且必须保留。但在实际做片时，**「视觉主风格（壳）」与「单镜素材来源（料）」是两个正交维度**：用户常选一个 C 类样式作为全片主风格（如暗色科技发布会、手绘水彩、复古档案、科普扁平），同时在部分镜头里穿插真实素材（产品实拍、软件录屏、照片、文献）或 AI 素材（图、视频）。

本规格旨在让上述混用场景在选样式、建风格包、写分镜、自动校验与分段出片全链路顺滑落地，必须守住以下 **4 条设计红线**：

1. **官方样片库纯净度不变**：`samples/C-001`–`C-211`（及后续 C 类样片）保持纯代码零外部素材，T/G 样片保持按内容类型组织；不打乱 270 种样式的 CTG 分类体系。
2. **筛选先行，不硬塞**：不是所有 C 类风格都适合内嵌外部素材。先完成 211 个 C 类风格的「素材兼容度」三档筛选，强封闭媒介（如像素、皮影、剪纸、流体着色器、ASCII）禁止开媒体插槽。
3. **布局严格解耦（三拓扑分治）**：纯 C 构图讲究居中饱满，而有素材的画面重心、栅格与字号完全不同。**严禁在原有纯 C 部件（`headline` / `metric` / `outro` 等）里写 `if (hasMedia)` 双布局**；所有媒体承载能力拆成独立拓扑部件，通过可选扩展文件 `media_slots.js` 按需挂载，确保「纯 C 版」和「混入素材版」各自保持最优构图且互不干扰。
4. **最小增量与 100% 向后兼容**：分镜 `storyboard.json` 不新增顶层或分镜字段名；现有 3 个官方风格包、现有项目及 `skills/ai-coding-video/scripts/tests/` 下全部现有测试无需修改即可继续通过。

---

## 2. 混用两级模型（L1 风格内嵌 vs L2 技法客串）

实际出片时，C 类主风格混入 T / G 素材分为两个层级，在 `film.md`（第 2 步）与 `making.md` 中明确区分：

| 层级 | 名称 | 适用场景（典型占比） | 分镜与代码做法 | 视觉统一归属 |
|---|---|---|---|---|
| **L1** | **风格内嵌（Media Slot）** | **~80%**：该镜只需展示一张图、一段实拍/录屏或一段 AI 视频，不改变全片视觉气质 | 留在 C 类主风格包内，调用主包外挂 `media_slots.js` 的标准媒体插槽部件（`mediaFrame` / `mediaSplit` / `mediaBg` / `mediaPip`）装入素材 | **100% 沿用主包外壳**（色板、字体、材质边框、角标、转场、融合滤镜） |
| **L2** | **技法客串（Technique Guest）** | **~20%**：该镜专门要某条 T/G 样片的专属剪辑或视觉技法（如 `T-022` 文字穿插前景、`T-023` 物体追踪标注、`T-024` 3D 荧光笔扫读、`G-025` AI 换景重打光）；或用于「闭环」类 C 风格必须放素材时的切镜 | 分镜 `ref` 直接写对应 `T-xxx` / `G-xxx` 客串，由该样片代码改写独立镜头（延续 `making.md`「1 个主包 + 局部样式客串」原则） | **局部换技法，但色板、字体、字幕、转场服从 `unify`** |

### 单镜选用决策指南

| 内容需求 | 优先路径 | 说明 |
|---|---|---|
| 概念拆解、数据图表、流程/架构、代码/UI、金句强调 | **纯 C 部件** | 零生成成本、参数修改最灵活、确定性最高 |
| 真实产品外观、软件操作录屏、权威文献/财报、实拍证据 | **L1-T**（`mediaSplit` / `mediaFrame`） | 用主风格画框与融合公式包装真实素材 |
| 写实情绪空镜、具象隐喻场景、纯代码画不自然的复杂角色/物件 | **L1-G**（`mediaBg` / `mediaFrame` / `mediaSplit`） | 用主风格「AI 伴生风格段」锁定画风后再装入插槽 |
| 强交互/特定视觉语法（如前景抠像夹心字、追踪靶框、首尾帧变装） | **L2 客串**（`ref: "T-xxx"` / `"G-xxx"`） | 单独按该样片代码实现，不硬塞进主包部件表 |

---

## 3. 211 个 C 类风格的「素材兼容度」三档筛选规格

### 3.1 三档定义与判定标准

| `media_fit` | 含义 | 判定标准与典型代表 | 流程与脚手架行为 |
|---|---|---|---|
| **`原生`** | 原生适配（T / G 皆可直接内嵌） | 风格本身即包含画框、版面、卡片、屏幕、展板、档案、胶片、拼贴、分格等容器结构（约 55–65 个，如 `C-044`、`C-033`、`C-036`、`C-040`、`C-020`、`C-100`、`C-123`、`C-112`、`C-065`、`C-060`、`C-027`、`C-052`、`C-206`–`C-211`） | **首选推荐**。`new_pack.py --media` 直接开启媒体插槽；T 类按族群穿衣，G 类套伴生风格段 |
| **`条件`** | 条件适配（受控内嵌） | 具有鲜明手绘笔触、纸面媒材、扁平矢量画法或 3D 展陈空间（约 65–80 个，如 `C-001`–`C-003`、`C-009`、`C-019`、`C-038`、`C-094`、`C-095`、`C-108`、`C-157`、`C-116`） | **受控开启**。补 G 类须强制锁定同画风伴生提示词；补 T 类须进相框/纸卡并统一色调纸纹，**忌全屏裸贴实拍** |
| **`闭环`** | 纯代码闭环（不适合内嵌素材） | 纯数学/流体/粒子/着色器抽象，或强封闭物理工艺媒介（约 70–85 个，如 `C-013` 皮影、`C-015` 剪纸、`C-022` 彩玻、`C-030` 剪影、`C-041`/`C-199` Manim、`C-053`/`C-054` 像素、`C-064` ASCII、`C-067` Demoscene、`C-078` 体素、`C-082` 霓虹流体、`C-130` 黑绘陶瓶、`C-168` 字雨、`C-182` 青花、`C-196` Hydra） | **禁止开媒体插槽**。0 级选样式时主动预警；若用户坚持使用且必须放实拍/AI，只走 **L2 全屏转场客串** |

### 3.2 五个融合族群（`media_family`）

凡是 `media_fit` 为 `原生` 或 `条件` 的 C 类条目，必须归入以下 5 个融合族群之一（具体视觉公式见第 5 节）：

1. `暗色科技`（暗底玻璃、HUD、发射台、现代 SaaS/数据面板）
2. `纸面档案`（水彩、手绘、牛皮纸、档案剪贴簿、手账、版画纸面）
3. `扁平栅格`（科普扁平、瑞士/包豪斯排版、粗描边贴纸、现代矢量卡片）
4. `胶片屏幕`（16mm 纪录片、老胶片、电视新闻/节目包装、CRT、故障风）
5. `3D展陈`（立体书、博物馆展陈、Three.js 展台/微缩景、等距空间）

### 3.3 数据源与校验集成

- **Markdown 源文件**（`skills/ai-coding-video/styles/*.md`）：
  C 类条目列表项新增单行字段（仅 C 类填写，T/G 类不写）：
  - `- 素材兼容：原生（暗色科技）`
  - `- 素材兼容：条件（纸面档案）`
  - `- 素材兼容：闭环`
- **合法枚举表**（`skills/ai-coding-video/data/tags.json`）：
  新增顶层键 `media_fit`（`["原生", "条件", "闭环"]`）与 `media_family`（`["暗色科技", "纸面档案", "扁平栅格", "胶片屏幕", "3D展陈"]`）。
- **索引生成与校验**（`skills/ai-coding-video/scripts/build_index.py`）：
  - `FIELDS` 映射新增 `'素材兼容': 'media_compat'`；
  - 解析并写入 `data/styles.json` 每条 C 类记录的 `media_fit`（字符串）与 `media_family`（字符串或 `null`）；
  - `--check` 校验规则：① C 类必须写「素材兼容」；② 取值只允许 `原生（族群）`、`条件（族群）`、`闭环`；③ 族群必须在 `tags.json` 的 `media_family` 中；④ `闭环` 不允许带族群；⑤ T/G 类不允许写该字段。
- **选风格索引**（`skills/ai-coding-video/index.md`）：
  在索引表中增加「**C 类为主 + 穿插真实/AI 素材**」速查引导（仅列出 `原生` 与 `条件` 分组，提示 `闭环` 风格仅走 L2 切镜客串）。
- **筛选纪律**：Phase 1 修改 `styles/*.md` 前，先导出 211 条初步筛选清单供维护者抽核确认后再写入正本。

---

## 4. 标准媒体插槽部件与「按需兼容」架构

### 4.1 三拓扑分治原则

为彻底消除「同一部件既要支持纯 C 又要兼容带图/带视频」带来的布局冲突与代码膨胀，约定 **4 个正交媒体插槽部件**（3 个整屏部件 + 1 个叠加部件），**零修改原有纯 C 部件**：

| 部件名 | 类型 | 布局拓扑 | 横竖版构图规范 | 对原有纯 C 部件的影响 |
|---|---|---|---|---|
| **`mediaFrame`** | 整屏 (`seg`) | **画框展示**：素材占 75%–85% 主舞台（居中/微偏移带主风格画框与缓推运镜），仅在安全区顶部留眉题/标题、底角留出处角标 | 横版 16:9 宽框 + 底右角标；竖版 9:16 居中主框（留出 `H * 0.80` 底部字幕安全区），自动按素材原比例 `drawCover` 或 `drawContain` 适配 | **零影响** |
| **`mediaSplit`** | 整屏 (`seg`) | **双栏分屏**：媒体槽 + 信息槽严格分区，信息槽支持 `kind: 'text' \| 'metric' \| 'list'` 三种半区紧凑形态，独立算字号与折行 | 横版左右 55:45（`mediaSide: 'left' \| 'right'`）；竖版上下 52:48（底部严守 `y <= H * 0.78`，绝不撞底部字幕） | **零影响**（纯文字仍用原 `headline` / `metric`，有素材改叫 `mediaSplit`） |
| **`mediaBg`** | 层 / 背景 (`layer`) | **氛围铺底**：将图片/视频铺满画布并按主包 `K` 主题的明暗极性与融合族群自动叠加压罩/色偏/纸纹，确保前景文字对比度 | 全画幅 `drawCover` + 缓慢推镜；前景**原封不动调用任何已有纯 C 部件**（`headline` / `metric` / `quote` 等） | **零改动，100% 复用所有纯 C 部件** |
| **`mediaPip`** | 叠加 (`over`) | **安全角标画中画**：圆形或主风格圆角浮卡，附可选小标签与入场缓动 | 固定落四角安全区（默认避开左上角标区与 `H * 0.76` 以下字幕区），可由 `o.pos` 指定方位 | **零影响**（不改变宿主部件主布局） |

### 4.2 部件参数对象 `o` 契约

- **`mediaFrame(ctx, K, t, o)`**：
  - `src`（媒体对象或已加载资源键，缺失时走占位态）、`kind`（`'T' | 'G'`）、`kicker`（眉题，小字档）、`title`（标题，顶档/中档）、`credit`（出处/AI 标）、`fit`（`'cover' | 'contain'`，默认 `'cover'`）、`zoom`（推镜幅度，默认 `0.06`）、`videoMode`（`'clamp' | 'loop' | 'pingpong'`）、`placeholder`（占位文案）。
- **`mediaSplit(ctx, K, t, o)`**：
  - 媒体侧：`src`、`kind`、`fit`、`mediaSide`（`'left' | 'right'`，竖版映射为 `'top' | 'bottom'`）、`credit`、`videoMode`、`placeholder`；
  - 信息侧：`infoKind`（`'text' | 'metric' | 'list'`，默认 `'text'`）、`kicker`、`title`（`text` 主标题，顶档）、`body`（正文）；`to` / `suffix` / `label`（`metric` 专用，`to` 为顶档）；`items`（`list` 条目数组，最多 4 条，防竖版溢出）。
- **`mediaBg(ctx, K, t, o)`**：
  - `src`、`kind`、`dim`（压暗/提亮系数 `0–0.85`，默认按明暗自动取 `0.55`）、`tint`（是否叠主色偏，默认 `true`）、`zoom`、`videoMode`。
- **`mediaPip(ctx, K, t, o)`**：
  - `src`、`kind`、`shape`（`'circle' | 'card'`）、`pos`（`'br' | 'tr' | 'bl'`，默认 `'br'`）、`label`（人名/物品名）、`videoMode`。

### 4.3 插件式独立文件 `media_slots.js` 与 `meta.json` 约定

1. **文件组织**：
   - 媒体插槽代码不写入 `pack.js`，而是独立存放在同目录的 **`packs/<slug>/media_slots.js`**。
   - `build_index.py` 的 `bundle_want()` 会自动将其同步到 `skills/ai-coding-video/packs/<slug>/media_slots.js`。
2. **挂载机制**：
   - `media_slots.js` 直接读取全局 `PACK` 并调用 `Object.assign(PACK, { mediaBg, mediaSplit, mediaFrame, mediaPip })`；
   - 只消费主包 `PACK.theme()` 返回的 `K` 主题字段（`ac`、`a`、`hi`、`bg0`、`bg1`、`panel`、`ink`、`muted`、`head`、`num`、`mono`、`u`）与 `lib.js` 全局工具函数，不修改 `pack.js` 任何一行。
   - 场景文件按需声明：`needs: ['../pack.js', '../media_slots.js']`（纯 C 场景保持 `needs: ['../pack.js']`，完全零开销）。
   - **完整出片多段隔离兼容**：当一段代码使用 `media_slots.js` 时，在 `segments/<段号>.js` 的 `needs` 中显式引入（`needs: ['../packs/<slug>/pack.js', '../packs/<slug>/media_slots.js']` 或通过共享工具文件引入）；`samples/tools/film.py` 的 `fingerprint()` 原生支持读取 `needs` 计算缓存指纹，增改 `media_slots.js` 仅重渲引用它的段。
3. **`meta.json` 扩展字段**：
   - 启用媒体插槽的风格包在 `meta.json` 新增：
     ```json
     "media": {
       "enabled": true,
       "family": "暗色科技",
       "slots": ["mediaBg", "mediaSplit", "mediaFrame", "mediaPip"]
     }
     ```
   - 同时将 `mediaFrame`、`mediaSplit`、`mediaPip`（`"seg"`）及 `mediaBg`（`"layer"`）登记进 `meta.json` 的 `parts`。

### 4.4 三阶段「按需兼容」运行机制

| 阶段 | 纯 C（不用外部素材） | 混入模式（按需开启 T / G 素材） | 兼容性保障 |
|---|---|---|---|
| **1 级：样片** | 官方 `samples/C-xxx/` 保持纯 C 不动；用户项目出 3–5 秒纯 C 样片 | 用户项目 1 级需看混入效果时，出 **5 秒 2 镜样片**：前 2.5s 纯 C 主构图 + 后 2.5s `mediaSplit` 或 `mediaFrame` 装真图/占位图 | 两镜各自独立拓扑，互不挤压，原 1 级 3–5 秒规则照常通过 |
| **2 级：风格包** | 默认仅生成 `pack.js`（4 核心部件 + 4 基础层）+ 12 秒 4 镜演示片 | ① 起包加 `--media`：多生成 `media_slots.js`，演示片在原 4 镜纯 C 后**追加 2 镜**（`mediaSplit` + `mediaFrame`，共 18 秒）；<br>② **中途补加**：对已有纯 C 包执行 `new_pack.py --add-media <目录>`，无损外挂 `media_slots.js` | **前 4 镜纯 C 布局一像素不动**；已有的纯 C `pack.js` 与旧视频零改动、不重渲 |
| **3 级：整片与变更** | 全部段用纯 C 部件渲染 | ① **临时缺素材**：媒体槽自动渲染主风格占位框（布局/时长/旁白/字幕零改动），素材到位后靠增量缓存只重渲该段；<br>② **彻底弃用素材**：分镜 `part` 直接切回纯 C 部件（`mediaSplit` → `headline` / `metric`） | 绝不留半屏空框；布局与旁白彻底解耦 |

---

## 5. 视觉融合规范与 AI 伴生提示词协议

为防止「真实素材裸贴破坏主风格」与「AI 生图和代码画面割裂」，按第 3.2 节的 **5 个融合族群** 在 `materials.md` 与 `STYLE.md` 中固化如下规范：

### 5.1 T 类真实素材「穿衣公式」

| 融合族群 | 框体与边饰 | 调色与质感滤镜 | 出处角标与禁止项 |
|---|---|---|---|
| **`暗色科技`** | 深色半透明玻璃框 + `1.5px` 强调色微光描边 + 圆角裁切 | 轻压暗角 `vignette`，`contrast(1.04)`；背景用 `dim: 0.6` 深色渐变压罩 | 右下等宽体小角标；**禁**纯白粗框、花哨拟物阴影 |
| **`纸面档案`** | 浅色卡纸框 / 锯齿撕边 / 角落胶带条 | 微暖或旧档案色偏 + 表面低透明 `makePaper` 纸纹（像印在纸上） | 打字机/衬线出处标；**禁**高饱和霓虹描边、全屏无边框高清硬切 |
| **`扁平栅格`** | 硬栅格裁切 + `2–3px` 主墨色描边或硬偏移色块阴影 | 保持画面干净利落，卡片底与主色板对齐 | 色块胶囊出处标签；**禁**柔光羽化、渐变模糊玻璃框 |
| **`胶片屏幕`** | 电影遮幅 / 胶片齿孔或 CRT 扫描线框 | `grain(ctx, f)` 逐帧胶片颗粒 + `stepT` 低帧率顿挫（可选） | 胶片时间码/角标；**禁**现代光滑圆角卡片 |
| **`3D展陈`** | 透视展板框 / 空间投影基座 | 匹配展陈环境光晕与底部软投影 | 展签风格小标；**禁**贴平无空间感的直角硬贴 |

### 5.2 G 类 AI 素材「伴生风格锁（Companion Style Prompt）」

当主风格选定并需要补 G 类图片/视频时，在风格包的 `STYLE.md`（可选小节「外部素材融入规范」）中固化一段 **3 行伴生提示词风格段**，沿用 `style-swap` 验证过的三段式结构：**`完整提示词 = 镜头主体描述（每镜变化） + 主风格伴生风格段（全片锁死） + 约束段（无文字/无Logo/不生成真人脸）`**：

- **`暗色科技` 示例**：`深炭黑极简暗棚底，边缘带 <accent> 轮廓光，高对比电影质感，主体居中四周留暗色呼吸空间，无文字、无 Logo、无水印`（`mediaBg` / `mediaFrame` 轻松压罩即可融进暗底）。
- **`纸面档案` 示例**：`米白粗纹水彩纸纯白底，手绘水彩/淡彩插画质感，笔触清晰，边缘自然留白晕染，无边框、无文字、无水印`（渲染时可叠 `multiply` 混合模式直接与主包纸底融合）。
- **`扁平栅格` 示例**：`干净现代矢量插画质感，简洁色块与明确边缘光影，配色呼应主色板 <hex列表>，构图利落可裁剪，无文字、无 Logo`（与主风格扁平图形无缝并排）。

---

## 6. 工具库与脚手架变更规格

### 6.1 `samples/lib/lib.js`（同步 `samples/API.md` 与 `window.__FILM_GLOBALS__`）

新增 3 个确定性全局辅助函数，供所有 `media_slots.js` 与 `segments/*.js` 直接调用：

1. **`videoAt(v, lt, o = {})`**（`async`）：
   - 将局部时间 `lt` 按 `o.mode`（`'clamp'` 末帧定格、`'loop'` 循环、`'pingpong'` 往返播放，默认 `'clamp'`）、`o.speed`（默认 `1`）、`o.offset`（默认 `0`）映射到 `[0, v.dur - 1/FPS]`，调用 `await v.at(mt)` 后返回 `v.el`。
   - **约束**：纯时间函数，保证跳帧检查与逐帧渲染 100% 确定性；解决短 AI 视频匹配长旁白问题。
2. **`drawPlaceholder(ctx, x, y, w, h, o = {})`**：
   - 在指定矩形区域绘制符合当前主题 `K` 的虚线占位框，居中标出素材类型（`[T 真实素材]` / `[G AI 素材]`）、目标尺寸与 `o.label`（如镜头描述或建议素材），确保缺失素材时仍不黑屏、不白屏、主构图清晰可读。
3. **`loadMediaSafe(name, kind)`**（`async`）：
   - 尝试通过 `loadImage` 或 `loadVideo` 载入 `name`；若 `name` 为空或文件不存在（常见于原型/典型样片先行阶段），捕获加载失败并返回 `null`（触发 `drawPlaceholder`），不抛未捕获异常阻断 `player.html`；
   - **正式整片护栏**：在 `samples/tools/film.py` 执行正式渲染（`all` 或 `--join`，非 `--quick` / `--typical`）时，若日志/检查检出使用了占位或分镜 `src` 指向缺失文件，报明确警告/错误提示用户补齐素材（可按规范开关控制）。

### 6.2 `samples/new_pack.py`

1. **新建模式新增 `--media`**：
   - 仅当传入 `--media`（且基础风格通过兼容性校验）时启用；
   - 生成 `media_slots.js`（按 `data/styles.json` 中该风格的 `media_family` 选择对应融合画法模板）；
   - 更新 `meta.json`（写入 `media` 配置对象，并将 4 个插槽加入 `parts`）；
   - 更新 `demo/segments.json`：保留前 4 镜纯 C 演示（共 12 秒，布局不动），在片尾前追加 `mediaSplit`（3 秒）与 `mediaFrame`（3 秒）共 **18 秒**轻量验证片；
   - 在 `STYLE.md` 追加「外部素材融入规范（融合族群 + T 类穿衣 + G 类伴生风格段）」，在 `README.md` 部件表补充 4 个媒体部件说明。
2. **增量挂载模式新增 `--add-media <DIR>`**：
   - 对已存在的纯 C 风格包目录无损外挂媒体能力：生成 `media_slots.js`、增量更新 `meta.json` / `STYLE.md` / `README.md`；
   - **严格保护**：绝不覆盖已有的 `pack.js`、`sound_kit.py`、`CHANGES.md` 及已调好的 `demo/segments.json` 原有镜头。
3. **三档兼容度护栏（建包时自动查 `data/styles.json`）**：
   - 若源样式 `media_fit == "闭环"` 且传了 `--media` / `--add-media`：默认报错退出，说明原因并建议改走 **L2 切镜客串**；仅当用户显式加 `--force-media` 时放行并打印警告。
   - 若源样式 `media_fit == "条件"`：放行并打印该族群的融合约束提示（如 G 类锁画风、T 类加框不裸贴）。

---

## 7. 分镜 Schema 与校验脚本变更规格

### 7.1 `storyboard.json` 约定（零新字段名，100% 向后兼容）

- 顶层 `unify.pack`、分镜 `ref`/`class`/`part`/`o`/`over`/`src`/`view`/`rule` 全部沿用现有字段，不引入新键名。
- **L1 风格内嵌标准写法**（顶层已配 `unify.pack`）：
  - **独立媒体镜**（`mediaFrame` / `mediaSplit`）：分镜写 `"class": "T"`（或 `"G"`）、`"part": "mediaSplit"`、`"src": "assets/demo.png"`（有策划时 `"src": "M3"`）及 `"o": {...}`，**不写 `ref`**；
  - **背景层混入**（`mediaBg`）：分镜写 `"class": "T"`（或 `"G"`）、`"part": "metric"`（任一纯 C 部件）、`"src": "assets/bg.mp4"`、`"o": {"bg": {"kind": "G", "dim": 0.6}, ...}`；
  - **叠加画中画**（`mediaPip`）：宿主分镜照常写纯 C（或其它）`part`，在 `"over"` 中写 `{"part": "mediaPip", "o": {...}}`，素材路径或 `M` 编号写入分镜 `"src"`。
- **L2 技法客串标准写法**：分镜直接写 `"ref": "T-022"`（或 `"G-025"`），不写 `part`（走该样片独立画法，色板/字体/字幕/转场服从 `unify`）。

### 7.2 `skills/ai-coding-video/scripts/check_storyboard.py`

1. **`library(extra_packs=())` 扩展**：扫描 `packs/`、`~/aicv-my-styles/` 及 `extra_packs` 时，顺便读入各包的 `meta.json`（存 `pack_meta`：`from` 样式编号、`media` 配置与 `parts`）。
2. **修正 `style_class()` 对 `pack:*` 的历史硬编码**：
   - 原本 `ref: "pack:<name>"` 一律返回 `'C'`（`L175–L179`）；改为查 `pack_meta[name]["from"]` 在 `styles` 中的类别（`news-brief` → `'T'`，`style-swap` → `'G'`，`dark-keynote` → `'C'`），找不到时回退 `'C'`。
3. **混用护栏检查（`check_shots()`）**：
   - 当分镜写了 `class: "T"|"G"` 且同时写了媒体槽 `part`（`mediaFrame` / `mediaSplit` / `mediaPip`）或 `o.bg` 时：检查 `unify.pack` 对应的包是否在 `meta.json` 中启用了 `media.enabled` 且包含该 `part`；未启用时输出清晰提醒（建议运行 `new_pack.py --add-media` 或改用 L2 客串）。
4. **`--table` 增补「外部素材汇总表」**：
   - 若全片存在 `T` 或 `G` 类 `uses` / `shots`（含 L1 内嵌与 L2 客串），在「全片统一」之后自动打印一张汇总表，按 **T 真实素材 / G 生图 / G 生视频** 归类列出：分镜号、来源类型（L1 内嵌 / L2 客串）、素材/参考图（`src`）、说明与可降级提醒（提示哪些镜头可退回纯 C），便于第 4 步用户一次性确认准备量与算力。

### 7.3 `skills/ai-coding-video/scripts/check_plan.py` 与 `plan5.py`

1. **`check_plan.py` 的 `item_class(x, styles, pack_meta=None)`**：
   - 同步修正 `ref: "pack:<name>"` 的类别判定，按 `meta.json` 的 `from` 推断默认类（未传 `pack_meta` 时保持回退 `'C'`）。
2. **`plan5.py` 的 `pack_of(x, sb)` 解耦**：
   - **现状阻塞**（`L759–L768`）：`if r or x.get('class') or not x.get('part'): return None`，导致同时写了 `class: "T"` 与 `part: "mediaFrame"` 的分镜跳过主包部件与顶档字号核对。
   - **修改后逻辑**：
     ```python
     r = x.get('ref')
     if isinstance(r, str) and r.startswith('pack:'):
         return r[5:]
     if r or not x.get('part'):
         return None
     u = sb.get('unify') if isinstance(sb.get('unify'), dict) else {}
     p = u.get('pack')
     return p[5:] if isinstance(p, str) and p.startswith('pack:') else p
     ```
   - **闭环效果**：格式 5 策划表中 `H5` 写「来源：照片，主角：实物」时，分镜写 `{"class": "T", "part": "mediaFrame", "src": "M3", "o": {"title": "…"}, "view": "H5"}`：
     - `check_views()` 读到 `class == 'T'`，通过来源与素材权限 `M3` 核对；
     - `check_layout()` 通过 `pack_of()` 拿到主包名，核对 `lookup.json` 中 `lead["实物"]`（如 `mediaFrame`）与 `sizes["mediaFrame"].top` 顶档字号，**两侧校验同时打通且互不冲突**。
3. **测试补充**（`skills/ai-coding-video/scripts/tests/`）：
   - 新增测试用例覆盖：① `C 主包 + class: "T"/"G" + part: "mediaSplit"/"mediaFrame"` 无策划与格式 5 双模式通过；② `pack:news-brief` / `pack:style-swap` 的 `item_class` 正确识别；③ 格式 5 `view` 认领与 `lookup.json` 顶档字号联检；④ `--table` 外部素材汇总表输出；⑤ 原有全部回归测试零破坏。

---

## 8. Skill 文档同步清单

遵循本仓库 `AGENTS.md`「一件事只记一处」原则，各文档分工更新如下：

| 文档 | 更新内容 |
|---|---|
| [SKILL.md](skills/ai-coding-video/SKILL.md) | 术语与「两条线」衔接处简述 L1 内嵌 / L2 客串原则；查风格步骤提示 C 类可按 `media_fit` 筛是否适合混入素材 |
| [index.md](skills/ai-coding-video/index.md) | 增加「C 类为主 + 穿插真实/AI 素材」速查索引引导（列出 `原生` 与 `条件` 风格，标明 `闭环` 禁止内嵌） |
| [making.md](skills/ai-coding-video/making.md) | 1 级样片补充「混入预览 5 秒 2 镜写法」；2 级风格包补充「插件式 `media_slots.js` 三拓扑规范」、「`--media` / `--add-media` 脚手架用法」与「三档兼容度护栏」；`STYLE.md` 规范新增可选小节「外部素材融入规范」 |
| [film.md](skills/ai-coding-video/film.md) | 第 2 步补充 L1 内嵌 vs L2 客串决策指南与分镜写法示例；第 4 步确认加入「外部素材汇总清单」；第 5 步补充「占位先行、增量替换」机制 |
| [materials.md](skills/ai-coding-video/materials.md) | 新增章节「C 类主风格混入 T / G 素材的融合做法」：5 个族群的 T 类穿衣公式 + G 类伴生提示词锁 |
| [storyboard.md](skills/ai-coding-video/storyboard.md) | 第 2 节「定样式」补一句：当 `content.md` 的「看什么」同时含代码画与照片/生图且主包为 C 类媒体包时，按 L1（`class` + 主包 `media*` `part`）或 L2（`ref: "T-xxx/G-xxx"`）填写 |
| [PLAN.md](PLAN.md) & [CHANGELOG.md](skills/ai-coding-video/CHANGELOG.md) | 开工时在 `PLAN.md` 登记阶段，完成后移入 `CHANGELOG.md` 并删掉本 `SPEC.md` |

---

## 9. 分阶段实施路线与验收标准

### Phase 1：三档筛选 + 元数据与校验解耦 + 文档规范（基线核心）

1. **导出并确认 211 条 C 类筛选表**：运行脚本按规则生成初版 `原生 / 条件 / 闭环 + 融合族群` 映射表，交维护者抽核拍板。
2. **元数据与 `build_index.py`**：更新 `tags.json`、`styles/*.md`、`build_index.py`、`index.md`，生成新 `data/styles.json`。
3. **校验脚本与测试**：更新 `check_storyboard.py`、`check_plan.py`、`plan5.py` 及离线测试集。
4. **文档同步**：按第 8 节更新 `SKILL.md`、`making.md`、`film.md`、`materials.md`、`storyboard.md`。
- **Phase 1 验收**：
  - `python3 skills/ai-coding-video/scripts/build_index.py --check` 退出码 `0`；
  - `python3 -m unittest discover -s skills/ai-coding-video/scripts/tests` 全部通过；
  - 模拟一份「C 主包 + T/G 分镜」无策划与格式 5 测试脚本，`check_storyboard.py --table` 与 `check_plan.py --table` 均退出码 `0` 且正确打印外部素材汇总表。

### Phase 2：公共辅助库 + 脚手架 `--media` / `--add-media`

1. **`samples/lib/lib.js` 与 `samples/API.md`**：实现并文档化 `videoAt`、`drawPlaceholder`、`loadMediaSafe`，更新 `window.__FILM_GLOBALS__`。
2. **`samples/new_pack.py`**：实现 `--media`、`--add-media`、`--force-media` 与三档护栏，内置按 5 个 `media_family` 差异化的 `media_slots.js` 模板生成。
3. **同步 Skill**：跑 `build_index.py` 同步 `samples/` 到 `skills/ai-coding-video/samples/`。
- **Phase 2 验收**：
  - 用 `new_pack.py` 基于 `原生` 风格（如 `C-044`）起带 `--media` 的临时包，跑 `python3 samples/batch.py pack:<slug> --quick`（16:9 与 9:16）检查抽帧拼图：前 4 镜纯 C 零变形，后 2 镜占位框/分屏布局不压底部字幕；
  - 基于纯 C 包测试 `--add-media` 确认 `pack.js` 字节级零改动；
  - 基于 `闭环` 风格（如 `C-013`）加 `--media` 确认默认被拦截报错；
  - `build_index.py --check` 通过。

### Phase 3：官方标杆范例落地（`packs/dark-keynote/`）

1. 为 `packs/dark-keynote/` 编写 `media_slots.js`（实现 `暗色科技` 族群的 `mediaBg` / `mediaSplit` / `mediaFrame` / `mediaPip`）并登记 `meta.json`。
2. 更新 `packs/dark-keynote/lookup.json`（`实物` / `场景` / `人` 增加优先 `part` 指引，或说明与 `instead` 关系）与 `STYLE.md`（补充「外部素材融入规范」及暗色科技 AI 伴生风格段）。
3. 跑 `build_index.py` 同步并执行全量自检。
- **Phase 3 验收**：
  - `python3 skills/ai-coding-video/scripts/build_index.py --check` 退出码 `0`；
  - `packs/dark-keynote` 现有 45 部件完整演示片与 15 秒切换片段回归正常，`media_slots.js` 在 16:9 与 9:16 实测渲染通过（无报错、无字幕遮挡、无素材占位也能正常出帧）。
  - 全部合入 `main` 后，记录 `CHANGELOG.md` 并删除本 `SPEC.md`。
