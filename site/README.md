# 介绍页

纯静态页面：相对路径，字体、样式、脚本都在本地，不用 CDN，整个文件夹拷到任意服务器都能打开。中英双语，右上角切换。

| 文件 | 是什么 | 怎么对待 |
|---|---|---|
| `src/index.html` | 页面模板，`{{…}}` 是占位符 | 改文案改这里 |
| `assets/site.css`、`assets/site.js` | 样式和交互 | 直接改 |
| `build.py` | 填模板、拷样片、裁字体；`--page` 只出页面和字体 | 本地预览时跑；发布时由 CI 跑 |
| `small.py` | 把 `media/` 里的原版视频、静帧缩小成卡片用的小版，放进 `media/s/`（卡片长边 768、风格包 1280，H.264 CRF 27）；首页轮播的几支（`HERO`，第一支是默认）另出 1280 宽的放进 `media/m/`；原版没变就不重出 | `build.py` 和发布时自动调用 |
| `index.html` | 生成物 | 不进仓库，发布时生成 |
| `fonts/` | 按页面用到的字裁出来的字体（思源黑体、思源宋体、JetBrains Mono，均为 OFL） | 生成物，不进仓库，发布时生成 |
| `media/` | 样片视频和静帧，从 `samples/` 拷来；`media/s/` 是卡片用的小版，`media/m/` 是首页大视频。卡片的视频和静帧都是快滚到时才由 `site.js` 填上；首页大视频用 `media/m/` 的 1280 宽版，放大播放用原版 | 生成物，不进仓库 |

```bash
cd samples && npm install && cd ..   # 字体来源（@fontsource）
pip install fonttools brotli
python3 site/build.py
cd site && python3 -m http.server   # 本地预览 http://localhost:8000
```

页面最底下的「真实应用」一节由 `build.py` 的 `cases_html()` 从 `cases/<名字>/case.json` 生成（设计见 [cases/README.md](../cases/README.md#介绍页模块)）：`status` 是「完成」、成片和封面登记在 `media.json`、每段有实际起止的案例放播放器，其余只出一张「制作中」的卡片。卡片只加载封面 `media/case-<名字>.jpg`，点开才加载中版 `case-<名字>-mid.mp4`；原版 `case-<名字>.mp4` 只给链接。案例的成片不出小版。整支汇总里的「用时和用量」读 `log.md` 末尾「## 汇总」下的表。

卡片上的「技术」一行：C 类取 `styles.json` 的 `verified`（技术标签，点了按技术筛），T、G 类取 `techniques`，中英文名来自 `tags.json` 的 `techniques`；T、G 类下面另有「素材」一行（`materials`）。C 类技术标签不是英文的，英文名登记在 `tags.json` 的 `tags_en`。T、G 类的顶部筛选另有一排「技术」（`site.js` 的 `qtech`，只露出当前类型的技术类型）。卡片描述只露两行，放不下的才显示「更多」，鼠标移上去（触屏上点一下）浮出全文。

版本号和日期写在 `build.py` 的 `VERSION`。推到 `main` 后由 `.github/workflows/pages.yml` 发布到 GitHub Pages（仓库设置里 Pages 的来源选 GitHub Actions）：先 `build.py --page` 按最新的 Skill 数据和样片生成页面和字体，再把静帧从 `samples/`、`packs/` 拷进 `media/`，视频从 Release「media」下载进 `media/`，再跑 `small.py` 出小版（原版和 `small.py` 都没变时用缓存）。需要 ffmpeg（本地没有时 `small.py` 用 imageio-ffmpeg 自带的）。
