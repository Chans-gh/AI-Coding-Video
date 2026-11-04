# 介绍页

纯静态页面：相对路径，字体、样式、脚本都在本地，不用 CDN，整个文件夹拷到任意服务器都能打开。中英双语，右上角切换。

| 文件 | 是什么 | 怎么对待 |
|---|---|---|
| `src/index.html` | 页面模板，`{{…}}` 是占位符 | 改文案改这里 |
| `assets/site.css`、`assets/site.js` | 样式和交互 | 直接改 |
| `build.py` | 填模板、拷样片、裁字体 | 改完模板或加了样片就跑 |
| `small.py` | 把 `media/` 里的原版视频、静帧缩小成卡片用的小版，放进 `media/s/`（卡片长边 768、风格包 1280，H.264 CRF 27）；首页轮播的几支（`HERO`，第一支是默认）另出 1280 宽的放进 `media/m/`；原版没变就不重出 | `build.py` 和发布时自动调用 |
| `index.html` | 生成物 | 不要手改 |
| `fonts/` | 按页面用到的字裁出来的字体（思源黑体、思源宋体、JetBrains Mono，均为 OFL） | 生成物 |
| `media/` | 样片视频和静帧，从 `samples/` 拷来；`media/s/` 是卡片用的小版。卡片的视频和静帧都是快滚到时才由 `site.js` 填上，放大播放和首页大视频用原版 | 生成物，不进仓库 |

```bash
cd samples && npm install && cd ..   # 字体来源（@fontsource）
pip install fonttools brotli
python3 site/build.py
cd site && python3 -m http.server   # 本地预览 http://localhost:8000
```

版本号和日期写在 `build.py` 的 `VERSION`。推到 `main` 后由 `.github/workflows/pages.yml` 发布到 GitHub Pages（仓库设置里 Pages 的来源选 GitHub Actions），发布时把静帧从 `samples/`、`packs/` 拷进 `media/`，视频从 Release「media」下载进 `media/`，再跑 `small.py` 出小版（原版和 `small.py` 都没变时用缓存）。需要 ffmpeg（本地没有时 `small.py` 用 imageio-ffmpeg 自带的）。
