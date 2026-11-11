# 样片 API 速查

由 `tools/apidoc.py` 从 `lib/lib.js`、`lib/synth.py` 的注释生成，不要手改；改了源码注释后重新生成。

场景文件的写法：`scene({id, name, dur, still, fonts, init, draw})`，`draw(ctx, t, s, f)` 里 `t` 是秒、`s` 是 `init()` 的返回值、`f` 是帧号。
每帧只由 `t` 决定；随机数用 `mulberry32` / `hash2`。横竖构图看 `LAND`，尺寸按 `SHORT / 1080` 缩放。
要用库就写 `libs: ['gsap']`（可选 `gsap` `p5` `p5.brush` `rough` `d3`，见 `player.html` 的 `LIBS`），播放器从本地 `node_modules` 载入，不联网；
SVG / HTML 画面写 `dom: true`，画在全局 `STAGE`（盖在画布上的 W×H 的 div）里；`init`、`draw` 可以是 `async`，播放器等它画完再截图。
声音文件的写法：`score(m)` 里用 `m.put(声音, 秒, 音量, 声像)`；`m.dur` 是时长，`m.rng` 是固定种子的随机数。
完整出片的段（`videos/<短名>/segments/<段号>.js`）写法同场景，不写 `dur`：段长取 `SEG.dur`，每句的时刻用 `say`、`subAt` 读；整片的 `sound.py` 写 `score(m, T)`，`T` 见 `tools/film.py` 开头。

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

**SVG / HTML 画面（场景写 dom: true）**

- `el(tag, attrs = {}, parent = STAGE, text)` — 新建元素：tag 以 'svg:' 开头建 SVG 元素（'svg:rect'），否则建 HTML 元素；attrs 写属性（style 可传对象），text 写文字，parent 默认 STAGE
- `svgRoot(parent = STAGE)` — 铺满舞台的 <svg>，viewBox 就是 0 0 W H，坐标和画布一样

**库的接法（场景写 libs: [...]，播放器从 node_modules 载入）**

- `timeline(o = {})` — GSAP：建一条暂停的时间轴，init 里把动画排好；draw 里 tl.seek(t) 跳到 t 秒，每帧只由 t 决定
- `three3d(o = {})` — Three.js：建好渲染器、场景、相机，返回 {THREE, renderer, scene, camera, canvas, render()}，渲染器的画布另开一张，draw 里 render() 之后把它画到 ctx 上。o：{w, h 渲染尺寸（默认 W×H）, fov, near, far, alpha 透明底, shadows 开阴影, tone 色调映射（默认 ACESFilmic）, exposure}
- `studioEnv(D, o = {})` — o：{top, bottom 上下底色, bars [[u 横向位置 0~1, 宽, 亮度, 颜色]], tint 侧面冷色, bg 同时当背景}
- `physicsAt(world, t, step = 1 / 120)` — cannon-es：固定步长把物理推到 t 秒（每帧都从 0 重推，所以每帧只由 t 决定，结果可重复）。world 是 CANNON.World，step 是步长（默认 1/120 秒），bodies 推完就是 t 时刻的位置
- `p5Sketch(setup, draw, o = {})` — p5（instance 模式 + noLoop）：在看不见的容器里建 W×H 画布，返回 Promise → {p, canvas, render(t, f)}，坐标原点都在左上角；render 设好 p.t、p.f，按 seed 重设 randomSeed / noiseSeed 后 redraw 一次；draw 里 await render(t) 后把 canvas 画到 ctx 上；draw 传 null 表示只在 setup 里画一次（静止的底图）。o：{w, h 画布尺寸（默认 W×H）, webgl 用 WEBGL 画布（p5.brush 要）, brush 接上 p5.brush, seed(t, f) → 每帧的种子（默认固定 1）}

**素材（T 类、G 类样片：读 assets/ 里的照片、视频、数据，出处记在 assets.json）**

- `asset(name)` — 素材文件的网址：asset('earth.jpg') → <样片目录>/assets/earth.jpg
- `xhr(url, type = 'text')`
- `loadAssets()` — 读 assets.json（素材清单：出处、许可、旁白的时刻和字幕），init 里 await
- `loadImage(name)` — 载入图片素材 → HTMLImageElement，init 里 await
- `loadText(name)` — 读文本素材（CSV、JSON、GeoJSON）
- `parseCSV(txt)` — CSV → 对象数组：第一行是表头，# 开头的行跳过，像数字的格自动转成数字
- `loadVideo(name)` — 载入视频素材（出片前已统一成 30 帧/秒、无声），返回 {el, dur, w, h, at(秒)}；await v.at(秒) 跳到素材里那一帧，之后 el 可以直接 drawImage
- `srcSize(src)` — 素材的原始宽高（图片、视频、画布都行）
- `drawCover(ctx, src, x, y, w, h, o = {})` — 把图片或视频「铺满」裁切进 (x,y,w,h)：o.zoom 放大倍数（推镜用，默认 1），o.fx、o.fy 取景焦点 0–1（默认 .5），o.alpha
- `drawContain(ctx, src, x, y, w, h, o = {})` — 把图片或视频完整放进 (x,y,w,h)，按比例缩放、居中；返回实际画的 [x, y, w, h]
- `cueAt(A, t)` — t 时刻该显示的字幕：A 是 loadAssets() 的结果，旁白素材的 lines 是 [{t0, t1, text}]（相对这段旁白的起点 at），返回那一条 {text, p 进度 0–1, t0, t1}，没有就 null
- `cueTime(A, kw, fallback = Infinity)` — 旁白说到关键词 kw 的时刻（秒）：在字幕行里找，按字数在这一行的起止之间线性估计；找不到返回 fallback（默认 Infinity）
- `caption(ctx, text, o = {})` — 字幕条：文字居中，按 maxW 折行，画在 y（底边）上方；o：{size, font, color, bg 底色（null 不画底）, stroke 描边色, maxW, y, align}；返回字幕块高度
- `credits(A)` — 素材出处：assets.json 里每份素材的 credit 拼成一行（片尾、角落的小字署名用）

**完整出片的段（player.html?p=<项目>&seg=<段号>：段长和每句的时间从 timing.json 读进 SEG）**

- `SEG` — 本段的时间 {seg, dur, vo: [{file, at, t, text, show, chars}], shots: [{t0, t1, cut}]}（格式见 Skill 的 film.md「时间」）；样片里是 null
- `TIMING` — 整片的 timing.json（SEG 是其中一段）：跨段连续的东西（整片时钟、进度条）用它算本段在整片里的起点；样片里是 null
- `say(i)` — 第 i 句的起止（秒，本段时间）：{t0, t1, text 念的, show 字幕写法}；没有这句返回 null
- `sayingAt(t, hold = 0)` — t 时刻正在说第几句（没在说返回 -1）；hold 秒内的句间空隙算上一句
- `sayP(i, t)` — 第 i 句到 t 时刻念到第几个字（按 chars 的逐字时间；没有逐字时间的按句长均分），返回 0–1 的进度
- `subAt(t, hold = .35)` — t 时刻的字幕（show 写法）：说完后留 hold 秒，下一句开始就换；没有返回 null
- `shotAt(t)` — t 时刻是本段第几个分镜（分镜脚本的 shots，起止由 voice.py 排进 timing.json）：{i 从 0 数, t0, t1, d 时长, lt 分镜内的时间, p 0–1, cut}；没分镜返回 null
- `drawShots(ctx, t, fns, mix = .5)` — 按分镜画：fns[i](ctx, lt, d, t) 画第 i 个分镜（分镜内的时间、分镜时长、本段时间），可以是 async；每个分镜前后 save、restore，平移、缩放、透明度不串到下一个；cut 是「溶解」的开头 mix 秒叠在上一个分镜上淡入。返回当前第几个分镜；没分镜时整段画 fns[0]
- `S` — 场景列表（播放器读 S[0]）
- `scene(def)` — 注册场景：{id, name, dur, still, fonts, text, libs, dom, init() → 状态 s, draw(ctx, t, s, f)}；init、draw 可以是 async

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

**素材里的声音（T 类、G 类）**

- `load(path, ss=0.0, dur=None)` — 读音频文件（mp3、wav、ogg、mp4 的音轨…）→ (采样数, 2) 的立体声，44.1 kHz；ss 起点秒，dur 长度秒。用 ffmpeg 解码
- `fade(x, a=0.0, b=0.0)` — 淡入 a 秒、淡出 b 秒（单声道或立体声都行）
- `cue_time(a, kw, fallback=None)` — 旁白说到关键词 kw 的时刻（秒）：a 是 assets() 返回的 assets.json 内容，和 lib.js 的 cueTime 算法相同；找不到返回 fallback
- `assets(m, here, music=0.32, duck=0.45, voice=0.9)` — 照 <样片目录>/assets.json 把声音摆上混音台：旁白、原声（G 类的旁白记作 语音合成）按 at（秒）放；配乐从 at 起铺到片尾，旁白、原声响的时候压低 duck；音效按 at 放。返回 assets.json 的内容。
