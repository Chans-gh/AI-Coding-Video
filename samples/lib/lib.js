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

const S = [];   // 场景列表（播放器读 S[0]）
// 注册场景：{id, name, dur, still, fonts, text, init() → 状态 s, draw(ctx, t, s, f)}
function scene(def) { S.push(def); }
