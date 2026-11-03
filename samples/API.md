# 样片 API 速查

由 `tools/apidoc.py` 从 `lib/lib.js`、`lib/synth.py` 的注释生成，不要手改；改了源码注释后重新生成。

场景文件的写法：`scene({id, name, dur, still, fonts, init, draw})`，`draw(ctx, t, s, f)` 里 `t` 是秒、`s` 是 `init()` 的返回值、`f` 是帧号。
每帧只由 `t` 决定；随机数用 `mulberry32` / `hash2`。横竖构图看 `LAND`，尺寸按 `SHORT / 1080` 缩放。
声音文件的写法：`score(m)` 里用 `m.put(声音, 秒, 音量, 声像)`；`m.dur` 是时长，`m.rng` 是固定种子的随机数。

## lib.js（场景里直接用，全局可见）
- `AR` — 画幅：'16x9' 或 '9x16'
- `W H FPS` — 画布宽高、帧率
- `LAND` — 横屏
- `SHORT LONG` — 短边、长边（排版尺寸按 SHORT 缩放）
- `BPM BEAT` — 节拍：一拍 0.375 秒，3 秒正好 8 拍
- `mulberry32(a)` — 确定性随机数发生器：R = mulberry32(seed)，每次 R() 返回 [0,1)
- `hash1(n)` — 整数 → [0,1) 的哈希，同一输入永远同一输出
- `hash2(x, y)` — 二维整数格点 → [0,1) 的哈希
- `clamp(x, a = 0, b = 1)` — 限制到 [a,b]，默认 [0,1]
- `lerp(a, b, t)` — 线性插值
- `inv(a, b, x)` — 反插值：x 在 a→b 之间的进度，限制到 [0,1]
- `smooth(a, b, x)` — 平滑过渡：x 从 a 到 b 时 0→1，两头缓
- `eOutCubic(t)` — 缓动：先快后慢（立方）
- `eInOutCubic(t)` — 缓动：两头慢中间快
- `eOutExpo(t)` — 缓动：猛冲后急停（指数）
- `eInCubic(t)` — 缓动：先慢后快
- `eOutBack(t, s = 1.70158)` — 缓动：冲过头再回弹一点
- `eOutElastic(t)` — 缓动：弹簧振荡后停住
- `TAU` — 2π
- `stepT(t, fps)` — 把 t 量化到 fps 帧率，做“一拍二”、定格动画的顿挫

**噪声**

- `vnoise(x, y)` — 二维值噪声，返回 [0,1)
- `fbm(x, y, oct = 5)` — 分形噪声：oct 层值噪声叠加，返回约 [0,1)
- `noise1(x)` — 一维平滑噪声，返回 [0,1)

**画布、纹理、笔画、文字**

- `mk(w, h)` — 新建离屏画布
- `rgba(c, a)` — [r,g,b] + 透明度 → CSS 颜色串
- `hex2rgb(h)` — '#rrggbb' → [r,g,b]
- `makePaper(base, { w = W / 2, h = H / 2, grain = 18, fiber = 0.5, blot = 12, seed = 1 } = {})` — 纸纹：底色 + 纤维 + 颗粒，返回半尺寸离屏画布，在 init() 里做一次，draw 时铺满
- `makeGrain(w, h, amt, seed)` — 透明颗粒层（明暗噪点），一般不直接用，见 grain()
- `grain(ctx, frame, alpha = .5, scale = 2)` — 叠一层逐帧跳动的胶片颗粒，frame 传 draw 的第 4 个参数 f
- `vignette(ctx, a = .5, inner = .35, color = '0,0,0')` — 暗角：从画面中心 inner 处到边缘渐暗到透明度 a
- `samplePoints(fn, step = 8, seed = 3, w = W, h = H)` — 在 fn(g) 画出的形状（文字、图形）内部按 step 间距取点，返回 [[x,y],…]，做粒子聚字
- `shuffle(a, seed = 1)` — 按种子原地洗牌
- `polyLen(pts)` — 折线总长
- `drawPartial(ctx, pts, p, close = false)` — 只描出折线的前 p（0–1）部分，返回笔尖位置；做笔画逐渐写出
- `resample(pts, n)` — 折线按弧长均匀取 n+1 个点，每点带单位法线 {x, y, nx, ny}；做笔刷、沿线排东西
- `brushStroke(ctx, pts, w, p = 1, o = {})` — 干笔：沿折线 pts 画宽 w 的一笔，只画前 p（0–1）；由一束细“笔毛”组成，越到末端越干、笔毛断开成飞白。o：{dry 末端干的程度 0–1, seed, color, bristles 根数, taper 是否两头收尖}
- `circlePts(cx, cy, r, n = 64, a0 = 0, a1 = TAU, wob = 0, seed = 0)` — 圆弧折线点，wob 加手绘抖动
- `linePts(x0, y0, x1, y1, n = 12, wob = 0, seed = 0)` — 直线折线点，wob 加手绘抖动
- `rectPts(x, y, w, h, wob = 0, seed = 0)` — 矩形折线点（顺时针一圈），wob 加手绘抖动
- `rr(ctx, x, y, w, h, r)` — 圆角矩形路径（只建路径，自己 fill/stroke）
- `wrapCJK(ctx, text, maxW)` — 中文折行：按 maxW 宽度断行，标点不放行首，返回行数组
- `textReveal(ctx, txt, x, y, p, align = 'left')` — 文字从左到右按 p 显出（裁剪），返回显出边缘的 x

**WebGL 全屏着色器**

- `glInit(w, h)` — 准备 WebGL2 离屏画布（init 里调一次）
- `glProgram(name, frag)` — 编译全屏片元着色器；frag 里可用 uniform T（秒）、R（分辨率），输出写 O
- `glDraw(ctx, name, t, w, h, x = 0, y = 0, dw = W, dh = H, extra = {})` — 用 w×h 分辨率跑着色器 name，再画到 ctx 的 (x,y,dw,dh)；分辨率可低于 W×H 省时。extra 传额外 uniform：数字 → float，2–4 个数 → vec，更长的数组 → float[]，画布 → sampler2D 贴图
- `S` — 场景列表（播放器读 S[0]）
- `scene(def)` — 注册场景：{id, name, dur, still, fonts, text, init() → 状态 s, draw(ctx, t, s, f)}

## synth.py（`from synth import …`）
- `SR` — = 44100
- `hz(n)` — MIDI 音高 → 频率（69 = A4 = 440 Hz）
- `tt(d)` — d 秒的时间轴数组（采样点对应的秒数）
- `filt(x, kind, f, order=2)` — 巴特沃斯滤波：kind 为 "low"、"high"、"band"（f 传 [低, 高]）

**混音台 Mix**

- `Mix(dur, seed=7)` — 混音台：put(声音, 时刻, 音量, 声像)；最后 master() 得到归一化的立体声。
- `m.noise(d)` — d 秒白噪声（用混音台自己的种子，结果固定）
- `m.put(x, t, g=1.0, pan=0.0)` — 在 t 秒处放入声音 x，音量 g，声像 pan（-1 左 … 1 右）
- `m.master(fade_in=0.02, fade_out=0.35, level=0.89)` — 淡入淡出、软限幅、归一化，返回 (采样数, 2) 的立体声

**打击乐**

- `kick(m)` — 底鼓
- `clap(m)` — 拍手
- `hat(m, open_=False)` — 踩镲，open_=True 为开镲
- `impact(m)` — 重击：低频下坠加噪声，标题落地、大数字砸下
- `tick(m, f=3000)` — 很短的高频咔哒：钟表、放映机、按键
- `woodblock(f=900, d=0.18)` — 木鱼、盖章一类短促的木质敲击
- `thud(m, d=0.5)` — 闷响：低频正弦加一点低通噪声

**音调乐器**

- `saw(f, d, cutoff, a=0.005, rel=0.08)` — 双锯齿波合成器音，低通 cutoff：贝斯、主旋律
- `pluck(f, d=0.35, bright=4000)` — 短促的电子拨音
- `string(m, f, d=2.0, damp=0.996, bright=0.5)` — Karplus-Strong 拨弦：一段噪声在延迟线里反复低通，像古琴、吉他的弦
- `bell(f, d=2.5, ratio=3.5, index=2.0)` — FM 钟声：调制器频率是载波的非整数倍，泛音像金属
- `square(f, d, duty=0.5, dec=None)` — 芯片方波（8-bit 游戏音）
- `beep(f=1000, d=0.08)` — 正弦提示音：完成、确认
- `pad(fs, d, cutoff=1400, a=0.4, rel=0.8)` — 几个音叠成的长音铺底
- `drone(f, d, wobble=0.3)` — 低频持续音，带缓慢起伏

**氛围**

- `whoosh(m, d, f0=300, f1=3000)` — 带通噪声扫频：转场、风、墨晕
- `riser(m, d)` — 渐强上扬的噪声，接在高潮前
- `hum(f=60, d=1.0)` — 电源嗡嗡声（CRT、荧光灯）
