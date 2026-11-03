# 介绍页

纯静态页面：相对路径，字体、样式、脚本都在本地，不用 CDN，整个文件夹拷到任意服务器都能打开。中英双语，右上角切换。

| 文件 | 是什么 | 怎么对待 |
|---|---|---|
| `src/index.html` | 页面模板，`{{…}}` 是占位符 | 改文案改这里 |
| `assets/site.css`、`assets/site.js` | 样式和交互 | 直接改 |
| `build.py` | 填模板、拷样片、裁字体 | 改完模板或加了样片就跑 |
| `index.html` | 生成物 | 不要手改 |
| `fonts/` | 按页面用到的字裁出来的字体（思源黑体、思源宋体、JetBrains Mono，均为 OFL） | 生成物 |
| `media/` | 样片视频和静帧，从 `samples/` 拷来 | 生成物，不进仓库 |

```bash
cd samples && npm install && cd ..   # 字体来源（@fontsource）
pip install fonttools brotli
python3 site/build.py
cd site && python3 -m http.server   # 本地预览 http://localhost:8000
```

版本号和日期写在 `build.py` 的 `VERSION`。推到 `main` 后由 `.github/workflows/pages.yml` 发布到 GitHub Pages（仓库设置里 Pages 的来源选 GitHub Actions），发布时把 `samples/` 里的视频和静帧拷进 `media/`。
