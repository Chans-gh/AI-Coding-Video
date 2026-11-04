// 公共工具：确定性随机数、噪声、缓动、纸纹、取样、WebGL。每帧只由时间 t 决定。
// 画幅由网址参数 ar 决定：?ar=16x9 → 1920×1080；?ar=9x16（默认）→ 1080×1920。
const AR = new URLSearchParams(location.search).get('ar') === '16x9' ? '16x9' : '9x16';   // 画幅：'16x9' 或 '9x16'
const W = AR === '16x9' ? 1920 : 1080, H = AR === '16x9' ? 1080 : 1920, FPS = 30;   // 画布宽高、帧率
const LAND = W > H;                         // 横屏
const SHORT = Math.min(W, H), LONG = Math.max(W, H);   // 短边、长边（排版尺寸按 SHORT 缩放）
const BPM = 160, BEAT = 60 / BPM;          // 节拍：一拍 0.375 秒，3 秒正好 8 拍

// 确定性随机数发生器：R = mulberry32(seed)，每次 R() 返回 [0,1)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 整数 → [0,1) 的哈希，同一输入永远同一输出
function hash1(n) { n |= 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
// 二维整数格点 → [0,1) 的哈希
function hash2(x, y) { return hash1(Math.imul(x | 0, 73856093) ^ Math.imul((y | 0) + 7919, 19349663)); }

// 限制到 [a,b]，默认 [0,1]
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
// 线性插值
const lerp = (a, b, t) => a + (b - a) * t;
// 反插值：x 在 a→b 之间的进度，限制到 [0,1]
const inv = (a, b, x) => clamp((x - a) / (b - a));
// 平滑过渡：x 从 a 到 b 时 0→1，两头缓
const smooth = (a, b, x) => { const t = inv(a, b, x); return t * t * (3 - 2 * t); };
// 缓动：先快后慢（立方）
const eOutCubic = t => 1 - Math.pow(1 - clamp(t), 3);
// 缓动：两头慢中间快
const eInOutCubic = t => (t = clamp(t), t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// 缓动：猛冲后急停（指数）
const eOutExpo = t => (t = clamp(t), t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
// 缓动：先慢后快
const eInCubic = t => (t = clamp(t), t * t * t);
// 缓动：冲过头再回弹一点
const eOutBack = (t, s = 1.70158) => (t = clamp(t), 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2));
// 缓动：弹簧振荡后停住
const eOutElastic = t => {
  t = clamp(t); if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1;
};
// 2π
const TAU = Math.PI * 2;
// 把 t 量化到 fps 帧率，做“一拍二”、定格动画的顿挫
const stepT = (t, fps) => Math.floor(t * fps) / fps;   // "on twos" / stop-motion timing

// ---------- 噪声 ----------
// 二维值噪声，返回 [0,1)
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
// 分形噪声：oct 层值噪声叠加，返回约 [0,1)
function fbm(x, y, oct = 5) {
  let s = 0, a = .5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); n += a; a *= .5; f *= 2.03; }
  return s / n;
}
// 一维平滑噪声，返回 [0,1)
function noise1(x) { return vnoise(x, 7.31); }

// ---------- 画布、纹理、笔画、文字 ----------
// 新建离屏画布
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// [r,g,b] + 透明度 → CSS 颜色串
function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
// '#rrggbb' → [r,g,b]
function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }

// 纸纹：底色 + 纤维 + 颗粒，返回半尺寸离屏画布，在 init() 里做一次，draw 时铺满
function makePaper(base, { w = W / 2, h = H / 2, grain = 18, fiber = 0.5, blot = 12, seed = 1 } = {}) {
  const c = mk(w, h), g = c.getContext('2d'), id = g.createImageData(w, h), d = id.data;
  const [r0, g0, b0] = hex2rgb(base); const R = mulberry32(seed);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = fbm(x * .012 + seed, y * .012, 4) - .5;
    const f = (fbm(x * .15 + seed * 3, y * .015, 3) - .5) * fiber;
    const k = (R() - .5) * grain + n * blot + f * 30;
    const i = (y * w + x) * 4;
    d[i] = r0 + k; d[i + 1] = g0 + k; d[i + 2] = b0 + k * .9; d[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  return c;
}
// 透明颗粒层（明暗噪点），一般不直接用，见 grain()
function makeGrain(w, h, amt, seed) {
  const c = mk(w, h), g = c.getContext('2d'), id = g.createImageData(w, h), d = id.data, R = mulberry32(seed);
  for (let i = 0; i < d.length; i += 4) {
    const v = R(); const on = R() < amt;
    d[i] = d[i + 1] = d[i + 2] = v > .5 ? 255 : 0; d[i + 3] = on ? 40 + R() * 80 : 0;
  }
  g.putImageData(id, 0, 0); return c;
}
const GRAINS = [];
// 叠一层逐帧跳动的胶片颗粒，frame 传 draw 的第 4 个参数 f
function grain(ctx, frame, alpha = .5, scale = 2) {
  if (!GRAINS.length) for (let i = 0; i < 6; i++) GRAINS.push(makeGrain(W / 2, H / 2, .5, 99 + i));
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(GRAINS[frame % 6], 0, 0, W, H); ctx.restore();
}
// 暗角：从画面中心 inner 处到边缘渐暗到透明度 a
function vignette(ctx, a = .5, inner = .35, color = '0,0,0') {
  const g = ctx.createRadialGradient(W / 2, H / 2, LONG * inner, W / 2, H / 2, LONG * .75);
  g.addColorStop(0, `rgba(${color},0)`); g.addColorStop(1, `rgba(${color},${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// 在 fn(g) 画出的形状（文字、图形）内部按 step 间距取点，返回 [[x,y],…]，做粒子聚字
function samplePoints(fn, step = 8, seed = 3, w = W, h = H) {
  const c = mk(w, h), g = c.getContext('2d'); fn(g);
  const d = g.getImageData(0, 0, w, h).data, pts = [], R = mulberry32(seed);
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
    const jx = x + (R() - .5) * step, jy = y + (R() - .5) * step;
    const xi = clamp(Math.round(jx), 0, w - 1), yi = clamp(Math.round(jy), 0, h - 1);
    if (d[(yi * w + xi) * 4 + 3] > 128) pts.push([jx, jy]);
  }
  return pts;
}
// 按种子原地洗牌
function shuffle(a, seed = 1) { const R = mulberry32(seed); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// 折线总长
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
// 只描出折线的前 p（0–1）部分，返回笔尖位置；做笔画逐渐写出
function drawPartial(ctx, pts, p, close = false) {
  if (p <= 0 || pts.length < 2) return null;
  const L = polyLen(pts) * clamp(p); let acc = 0;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  let tip = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (acc + l >= L) { const k = (L - acc) / l; tip = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; ctx.lineTo(tip[0], tip[1]); break; }
    ctx.lineTo(b[0], b[1]); acc += l; tip = b;
  }
  if (close && p >= 1) ctx.closePath();
  ctx.stroke(); return tip;
}
// 折线按弧长均匀取 n+1 个点，每点带单位法线 {x, y, nx, ny}；做笔刷、沿线排东西
function resample(pts, n) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const out = [];
  for (let k = 0; k <= n; k++) {
    const d = L[L.length - 1] * k / n; let i = 1; while (i < L.length - 1 && L[i] < d) i++;
    const q = (d - L[i - 1]) / (L[i] - L[i - 1] || 1), a = pts[i - 1], b = pts[i];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    out.push({ x: a[0] + dx * q, y: a[1] + dy * q, nx: -dy / l, ny: dx / l });
  }
  return out;
}
// 干笔：沿折线 pts 画宽 w 的一笔，只画前 p（0–1）；由一束细“笔毛”组成，越到末端越干、笔毛断开成飞白。o：{dry 末端干的程度 0–1, seed, color, bristles 根数, taper 是否两头收尖}
function brushStroke(ctx, pts, w, p = 1, o = {}) {
  const P = resample(pts, Math.max(8, Math.round(polyLen(pts) / Math.max(2, w * .35))));
  const n = Math.round(clamp(p) * (P.length - 1)); if (n < 1) return;
  const NB = o.bristles || 14, seed = o.seed || 1, R = mulberry32(seed), hs = Array.from({ length: NB }, () => R()), dry0 = o.dry ?? .4;
  ctx.save(); ctx.strokeStyle = o.color || '#14110e'; ctx.lineWidth = w / NB * 1.9; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
  for (let j = 0; j < NB; j++) {
    const off = (j / (NB - 1) - .5) * w, edge = Math.abs(j / (NB - 1) - .5) * 2;
    ctx.beginPath(); let on = false;
    for (let i = 0; i <= n; i++) {
      const q = P[i], sp = i / (P.length - 1);
      const taper = o.taper === false ? 1 : Math.min(1, .3 + sp * 5, .15 + (1 - sp) * 2.5);
      const dry = dry0 * smooth(.3, 1, sp) * (1 + edge);
      const gap = hs[j] < dry || vnoise(j * 5.3 + seed * 17, sp * 7) < dry * .35;
      const x = q.x + q.nx * off * taper, y = q.y + q.ny * off * taper;
      if (!gap) { on ? ctx.lineTo(x, y) : ctx.moveTo(x, y); on = true; } else on = false;
    }
    ctx.stroke();
  }
  ctx.restore();
}
// 圆弧折线点，wob 加手绘抖动
function circlePts(cx, cy, r, n = 64, a0 = 0, a1 = TAU, wob = 0, seed = 0) {
  const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; const rr = r * (1 + wob * (noise1(i * .3 + seed) - .5)); p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p;
}
// 直线折线点，wob 加手绘抖动
function linePts(x0, y0, x1, y1, n = 12, wob = 0, seed = 0) {
  const p = []; for (let i = 0; i <= n; i++) { const k = i / n; p.push([lerp(x0, x1, k) + wob * (noise1(i * .7 + seed) - .5), lerp(y0, y1, k) + wob * (noise1(i * .7 + seed + 50) - .5)]); } return p;
}
// 矩形折线点（顺时针一圈），wob 加手绘抖动
function rectPts(x, y, w, h, wob = 0, seed = 0) {
  return [...linePts(x, y, x + w, y, 8, wob, seed), ...linePts(x + w, y, x + w, y + h, 8, wob, seed + 1).slice(1),
  ...linePts(x + w, y + h, x, y + h, 8, wob, seed + 2).slice(1), ...linePts(x, y + h, x, y, 8, wob, seed + 3).slice(1)];
}

// 圆角矩形路径（只建路径，自己 fill/stroke）
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// 中文折行：按 maxW 宽度断行，标点不放行首，返回行数组
function wrapCJK(ctx, text, maxW) {
  const noStart = '，。、；：！？）」』”’…,.;:!?)'; const lines = []; let cur = '';
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxW && cur) {
      if (noStart.includes(ch)) { const last = cur.slice(-1); lines.push(cur.slice(0, -1)); cur = last + ch; }
      else { lines.push(cur); cur = ch; }
    } else cur = test;
  }
  if (cur) lines.push(cur); return lines;
}

// 文字从左到右按 p 显出（裁剪），返回显出边缘的 x
function textReveal(ctx, txt, x, y, p, align = 'left') {
  const w = ctx.measureText(txt).width; const x0 = align === 'center' ? x - w / 2 : x;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 20, y - 400, (w + 40) * clamp(p), 800); ctx.clip();
  ctx.textAlign = align; ctx.fillText(txt, x, y); ctx.restore(); return x0 + w * clamp(p);
}

// ---------- WebGL 全屏着色器 ----------
const GL = { canvas: null, gl: null, progs: {} };
// 准备 WebGL2 离屏画布（init 里调一次）
function glInit(w, h) {
  if (GL.gl) return;
  GL.canvas = mk(w, h);
  GL.gl = GL.canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  const gl = GL.gl, b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
}
// 编译全屏片元着色器；frag 里可用 uniform T（秒）、R（分辨率），输出写 O
function glProgram(name, frag) {
  const gl = GL.gl;
  const vs = `#version 300 es
in vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`;
  const mkS = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(name + ': ' + gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, mkS(gl.VERTEX_SHADER, vs));
  gl.attachShader(pr, mkS(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float; uniform float T; uniform vec2 R; out vec4 O;
${frag}`));
  gl.linkProgram(pr); GL.progs[name] = pr;
}
// 用 w×h 分辨率跑着色器 name，再画到 ctx 的 (x,y,dw,dh)；分辨率可低于 W×H 省时。extra 传额外 uniform：数字 → float，2–4 个数 → vec，更长的数组 → float[]，画布 → sampler2D 贴图
function glDraw(ctx, name, t, w, h, x = 0, y = 0, dw = W, dh = H, extra = {}) {
  const gl = GL.gl, pr = GL.progs[name];
  if (GL.canvas.width !== w || GL.canvas.height !== h) { GL.canvas.width = w; GL.canvas.height = h; }
  gl.viewport(0, 0, w, h); gl.useProgram(pr);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform1f(gl.getUniformLocation(pr, 'T'), t); gl.uniform2f(gl.getUniformLocation(pr, 'R'), w, h);
  let unit = 0;
  for (const [k, v] of Object.entries(extra)) {
    const loc = gl.getUniformLocation(pr, k);
    if (typeof v === 'number') gl.uniform1f(loc, v);
    else if (v.getContext) {                                   // 画布 → 贴图（每次重新上传，画布每帧可变）
      GL.tex = GL.tex || {};
      if (!GL.tex[k]) GL.tex[k] = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, GL.tex[k]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(loc, unit++);
    } else if (v.length <= 4) gl['uniform' + v.length + 'f'](loc, ...v);
    else gl.uniform1fv(loc, v);
  }
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  ctx.drawImage(GL.canvas, x, y, dw, dh);
}

// ---------- SVG / HTML 画面（场景写 dom: true） ----------
const SVGNS = 'http://www.w3.org/2000/svg';
// 新建元素：tag 以 'svg:' 开头建 SVG 元素（'svg:rect'），否则建 HTML 元素；attrs 写属性（style 可传对象），text 写文字，parent 默认 STAGE
function el(tag, attrs = {}, parent = STAGE, text) {
  const isSvg = tag.startsWith('svg:'), e = isSvg ? document.createElementNS(SVGNS, tag.slice(4)) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v);
  }
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
// 铺满舞台的 <svg>，viewBox 就是 0 0 W H，坐标和画布一样
function svgRoot(parent = STAGE) {
  return el('svg:svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: { position: 'absolute', left: 0, top: 0 } }, parent);
}

// ---------- 库的接法（场景写 libs: [...]，播放器从 node_modules 载入） ----------
// GSAP：建一条暂停的时间轴，init 里把动画排好；draw 里 tl.seek(t) 跳到 t 秒，每帧只由 t 决定
function timeline(o = {}) {
  gsap.ticker.lagSmoothing(0);
  return gsap.timeline({ paused: true, ...o });
}
// Three.js：建好渲染器、场景、相机，返回 {THREE, renderer, scene, camera, canvas, render()}，渲染器的画布另开一张，draw 里 render() 之后把它画到 ctx 上。o：{w, h 渲染尺寸（默认 W×H）, fov, near, far, alpha 透明底, shadows 开阴影, tone 色调映射（默认 ACESFilmic）, exposure}
function three3d(o = {}) {
  const T = THREE, w = o.w || W, h = o.h || H;
  const canvas = mk(w, h);
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: !!o.alpha, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  renderer.toneMapping = o.tone === null ? T.NoToneMapping : (o.tone || T.ACESFilmicToneMapping);
  renderer.toneMappingExposure = o.exposure ?? 1;
  if (o.shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; }
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(o.fov || 40, w / h, o.near || .1, o.far || 200);
  return { THREE: T, renderer, scene, camera, canvas, render() { renderer.render(scene, camera); } };
}

// 影棚环境贴图：用代码画一张等距柱状图（上亮下暗 + 几条柔光灯带），过一遍 PMREM 当 scene.environment。
// 玻璃（transmission）和金属没有环境就是一团黑，这个函数补上，且不引用任何外部图片。
// o：{top, bottom 上下底色, bars [[u 横向位置 0~1, 宽, 亮度, 颜色]], tint 侧面冷色, bg 同时当背景}
function studioEnv(D, o = {}) {
  const T = D.THREE, cv = mk(1024, 512), g = cv.getContext('2d');
  const gd = g.createLinearGradient(0, 0, 0, 512);
  gd.addColorStop(0, o.top || '#2a3350'); gd.addColorStop(.46, o.mid || '#10131c');
  gd.addColorStop(.54, o.floor || '#0b0c10'); gd.addColorStop(1, o.bottom || '#050507');
  g.fillStyle = gd; g.fillRect(0, 0, 1024, 512);
  for (const [u, w, lum, col] of (o.bars || [[.18, .07, 1, '#ffffff'], [.62, .05, .8, '#bcd6ff'], [.86, .09, .55, '#ffe6c8']])) {
    const x = u * 1024, bw = w * 1024;
    const rg = g.createLinearGradient(x - bw, 0, x + bw, 0);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(.5, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = lum; g.globalCompositeOperation = 'lighter';
    g.fillStyle = rg; g.fillRect(x - bw, 40, bw * 2, 230);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  const tex = new T.Texture(cv);
  tex.mapping = T.EquirectangularReflectionMapping; tex.colorSpace = T.SRGBColorSpace; tex.needsUpdate = true;
  const pm = new T.PMREMGenerator(D.renderer); pm.compileEquirectangularShader();
  const env = pm.fromEquirectangular(tex).texture;
  pm.dispose(); tex.dispose();
  D.scene.environment = env;
  if (o.bg) D.scene.background = env;
  return env;
}

// cannon-es：固定步长把物理推到 t 秒（每帧都从 0 重推，所以每帧只由 t 决定，结果可重复）。world 是 CANNON.World，step 是步长（默认 1/120 秒），bodies 推完就是 t 时刻的位置
function physicsAt(world, t, step = 1 / 120) {
  const n = Math.round(t / step);
  for (let k = 0; k < n; k++) world.step(step);    // 固定 dt 的 step，不是 fixedStep（那个看真实时钟，结果不可重复）
  return world;
}

// p5（instance 模式 + noLoop）：在看不见的容器里建 W×H 画布，返回 Promise → {p, canvas, render(t, f)}，坐标原点都在左上角；render 设好 p.t、p.f，按 seed 重设 randomSeed / noiseSeed 后 redraw 一次；draw 里 await render(t) 后把 canvas 画到 ctx 上；draw 传 null 表示只在 setup 里画一次（静止的底图）。o：{w, h 画布尺寸（默认 W×H）, webgl 用 WEBGL 画布（p5.brush 要）, brush 接上 p5.brush, seed(t, f) → 每帧的种子（默认固定 1）}
function p5Sketch(setup, draw, o = {}) {
  return new Promise((ok, no) => {
    let box = document.getElementById('offscreen');
    if (!box) { box = document.createElement('div'); box.id = 'offscreen'; document.body.appendChild(box); }
    const k = o.scale || 1, cw = Math.round((o.w || W) * k), ch = Math.round((o.h || H) * k);   // scale: 画布按比例缩小、画的时候整体放大，内容坐标不变（重笔刷省时间）
    new p5(p => {
      if (o.brush) brush.instance(p);
      p.t = 0; p.f = 0;
      p.setup = async () => {
        try {
          p.pixelDensity(1);
          p.createCanvas(cw, ch, o.webgl ? p.WEBGL : p.P2D);
          p.noLoop();
          await setup?.(p);
          ok({ p, canvas: p.canvas, async render(t, f = Math.round(t * FPS)) {
            p.t = t; p.f = f; const sd = o.seed ? o.seed(t, f) : 1; p.randomSeed(sd); p.noiseSeed(sd);
            await p.redraw(); return p.canvas;
          } });
        } catch (e) { no(e); }
      };
      p.draw = () => { if (!draw) return; p.push(); if (o.webgl) p.translate(-cw / 2, -ch / 2); if (k !== 1) p.scale(k); draw(p, p.t, p.f); p.pop(); };   // WEBGL 原点在中心，挪回左上角
    }, box);
  });
}

// ---------- 素材（T 类、G 类样片：读 assets/ 里的照片、视频、数据，出处记在 assets.json） ----------
// 素材文件的网址：asset('earth.jpg') → <样片目录>/assets/earth.jpg
function asset(name) { return `${DIR}/assets/${name.replace(/^assets\//, '')}`; }
function xhr(url, type = 'text') {
  return new Promise((ok, no) => {
    const r = new XMLHttpRequest(); r.open('GET', url); r.responseType = type;
    r.onload = () => (r.status === 200 || r.status === 0) && r.response != null ? ok(r.response) : no(new Error('载入失败 ' + url));
    r.onerror = () => no(new Error('载入失败 ' + url)); r.send();
  });
}
// 读 assets.json（素材清单：出处、许可、旁白的时刻和字幕），init 里 await
async function loadAssets() { return JSON.parse(await xhr(`${DIR}/assets.json`)); }
// 载入图片素材 → HTMLImageElement，init 里 await
function loadImage(name) {
  return new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('载入失败 ' + name)); im.src = asset(name); });
}
// 读文本素材（CSV、JSON、GeoJSON）
function loadText(name) { return xhr(asset(name)); }
// CSV → 对象数组：第一行是表头，# 开头的行跳过，像数字的格自动转成数字
function parseCSV(txt) {
  const rows = txt.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#')).map(l => l.split(','));
  const head = rows.shift().map(h => h.trim());
  return rows.map(r => Object.fromEntries(head.map((h, i) => { const v = (r[i] ?? '').trim(); return [h, v !== '' && !isNaN(+v) ? +v : v]; })));
}
// 载入视频素材（出片前已统一成 30 帧/秒、无声），返回 {el, dur, w, h, at(秒)}；await v.at(秒) 跳到素材里那一帧，之后 el 可以直接 drawImage
async function loadVideo(name) {
  const el = document.createElement('video');
  el.muted = true; el.preload = 'auto'; el.playsInline = true; el.src = asset(name);
  await new Promise((ok, no) => { el.onloadeddata = ok; el.onerror = () => no(new Error('载入失败 ' + name)); });
  const dur = el.duration, last = Math.max(0, Math.floor(dur * FPS) - 1);
  let cur = -1;
  return {
    el, dur, w: el.videoWidth, h: el.videoHeight,
    async at(sec) {
      const k = Math.min(last, Math.max(0, Math.floor(sec * FPS + 1e-6)));   // 取到帧：每帧只由 t 决定
      if (k === cur) return el;
      cur = k; el.currentTime = Math.min(dur - 1e-3, (k + .5) / FPS);
      await new Promise(ok => { el.onseeked = ok; });
      return el;
    },
  };
}
// 素材的原始宽高（图片、视频、画布都行）
function srcSize(src) { return [src.videoWidth || src.naturalWidth || src.width, src.videoHeight || src.naturalHeight || src.height]; }
// 把图片或视频「铺满」裁切进 (x,y,w,h)：o.zoom 放大倍数（推镜用，默认 1），o.fx、o.fy 取景焦点 0–1（默认 .5），o.alpha
function drawCover(ctx, src, x, y, w, h, o = {}) {
  const [sw, sh] = srcSize(src), z = o.zoom || 1, fx = o.fx ?? .5, fy = o.fy ?? .5;
  const k = Math.max(w / sw, h / sh) * z, dw = sw * k, dh = sh * k;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.drawImage(src, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh);
  ctx.restore();
}
// 把图片或视频完整放进 (x,y,w,h)，按比例缩放、居中；返回实际画的 [x, y, w, h]
function drawContain(ctx, src, x, y, w, h, o = {}) {
  const [sw, sh] = srcSize(src), k = Math.min(w / sw, h / sh) * (o.zoom || 1), dw = sw * k, dh = sh * k;
  const r = [x + (w - dw) / 2, y + (h - dh) / 2, dw, dh];
  ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha; ctx.drawImage(src, ...r); ctx.restore();
  return r;
}
// t 时刻该显示的字幕：A 是 loadAssets() 的结果，旁白素材的 lines 是 [{t0, t1, text}]（相对这段旁白的起点 at），返回那一条 {text, p 进度 0–1, t0, t1}，没有就 null
function cueAt(A, t) {
  for (const it of A.items) {
    if (!it.lines) continue;
    const at = +it.at || 0;
    for (const l of it.lines) if (t >= at + l.t0 && t < at + l.t1) return { text: l.text, p: (t - at - l.t0) / (l.t1 - l.t0), t0: at + l.t0, t1: at + l.t1 };
  }
  return null;
}
// 旁白说到关键词 kw 的时刻（秒）：在字幕行里找，按字数在这一行的起止之间线性估计；找不到返回 fallback（默认 Infinity）
function cueTime(A, kw, fallback = Infinity) {
  for (const it of A.items) {
    if (!it.lines) continue;
    const at = +it.at || 0;
    for (const l of it.lines) { const i = l.text.indexOf(kw); if (i >= 0) return at + l.t0 + (l.t1 - l.t0) * i / l.text.length; }
  }
  return fallback;
}
// 字幕条：文字居中，按 maxW 折行，画在 y（底边）上方；o：{size, font, color, bg 底色（null 不画底）, stroke 描边色, maxW, y, align}；返回字幕块高度
function caption(ctx, text, o = {}) {
  const u = SHORT / 1080, size = (o.size || 40) * u, maxW = o.maxW || W * (LAND ? .62 : .84);
  ctx.save();
  ctx.font = `${o.weight || 700} ${size}px ${o.font || "'Noto Sans SC'"}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = wrapCJK(ctx, text, maxW), lh = size * 1.42, hh = lines.length * lh;
  const y0 = (o.y ?? H - (LAND ? 70 : 260) * u) - hh, cx = o.x ?? W / 2;
  if (o.bg !== null) {
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + size * 1.2;
    ctx.fillStyle = o.bg || 'rgba(0,0,0,.55)'; rr(ctx, cx - w / 2, y0 - size * .3, w, hh + size * .6, size * .3); ctx.fill();
  }
  lines.forEach((l, i) => {
    const y = y0 + lh * (i + .5);
    if (o.stroke) { ctx.lineWidth = size * .16; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(l, cx, y); }
    ctx.fillStyle = o.color || '#fff'; ctx.fillText(l, cx, y);
  });
  ctx.restore();
  return hh;
}
// 素材出处：assets.json 里每份素材的 credit 拼成一行（片尾、角落的小字署名用）
function credits(A) { return [...new Set(A.items.map(i => i.credit).filter(Boolean))].join(' · '); }

const S = [];   // 场景列表（播放器读 S[0]）
// 注册场景：{id, name, dur, still, fonts, text, libs, dom, init() → 状态 s, draw(ctx, t, s, f)}；init、draw 可以是 async
function scene(def) { S.push(def); }
