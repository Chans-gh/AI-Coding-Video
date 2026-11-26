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
// 风化层：透明底上叠污渍（大块暗斑）、剥落（按噪声阈值露出底色的斑块，边缘一圈暗线）、裂纹（随机折线），返回半尺寸离屏画布，在 init() 里做一次，铺在画面上就像旧墙、旧漆。o：{w, h, flake 剥落占比 0–1, flakeColor 露出的底色, stain 污渍深浅 0–1, stainColor, cracks 裂纹条数, crackColor, scale 斑块尺度, seed}
function weathering({ w = W / 2, h = H / 2, flake = .12, flakeColor = '#D8C4A0', stain = .3, stainColor = '#4A3220', cracks = 10, crackColor = 'rgba(50,34,20,.55)', scale = 1, seed = 1 } = {}) {
  const c = mk(w, h), g = c.getContext('2d'), id = g.createImageData(w, h), d = id.data;
  const [fr, fg, fb] = hex2rgb(flakeColor), [sr, sg, sb] = hex2rgb(stainColor), k = .012 / scale * (960 / Math.max(w, h)), th = 1 - flake * .5 - .25;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, n = fbm(x * k * 2.2 + seed * 7, y * k * 2.2 + seed, 5), sN = fbm(x * k * .6 + seed * 3, y * k * .6 - seed, 4);
    if (flake > 0 && n > th) { const e = n < th + .012; d[i] = e ? fr * .55 : fr; d[i + 1] = e ? fg * .55 : fg; d[i + 2] = e ? fb * .55 : fb; d[i + 3] = e ? 200 : 235; continue; }
    const a = clamp((sN - .45) * 2.4) * stain * 255;
    d[i] = sr; d[i + 1] = sg; d[i + 2] = sb; d[i + 3] = a;
  }
  g.putImageData(id, 0, 0);
  const R = mulberry32(seed * 13 + 5); g.strokeStyle = crackColor; g.lineCap = 'round';
  for (let j = 0; j < cracks; j++) {
    let x = R() * w, y = R() * h, a = R() * TAU; g.lineWidth = .6 + R() * .8; g.beginPath(); g.moveTo(x, y);
    const n = 12 + R() * 30;
    for (let q = 0; q < n; q++) { a += (R() - .5) * 1.1; const l = 3 + R() * 7; x += Math.cos(a) * l; y += Math.sin(a) * l; g.lineTo(x, y);
      if (R() < .12) { const b = a + (R() < .5 ? 1 : -1) * (.6 + R()); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * l * 2, y + Math.sin(b) * l * 2); g.moveTo(x, y); } }
    g.stroke();
  }
  return c;
}
// 纸齿遮罩：只有纸面凸起处挂得住颜料（蜡笔、炭笔、粉笔、岩面上的颜料）。返回 w×h 的透明度遮罩，在笔触层上用 destination-in 叠一次即可；cut 越大露白越多，scale 是齿的粗细（像素）
function toothMask(w, h, { cut = .45, soft = .1, scale = 3, seed = 1 } = {}) {
  const c = mk(w, h), g = c.getContext('2d'), id = g.createImageData(w, h), d = id.data, o = seed * 37.7;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = .5 * vnoise(x / scale + o, y / scale * 1.3) + .3 * vnoise(x / (scale * 5) - o, y / (scale * 5)) + .2 * hash2(x + seed * 131, y);
    const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = 255 * clamp((n - cut + soft) / (2 * soft));
  }
  g.putImageData(id, 0, 0); return c;
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

// ---------- 明暗图、排线、点 ----------
// 明暗图：fn(g) 用 W×H 的坐标画出主体的明暗（白亮黑暗，渐变、阴影都行），缩到 1/res 取灰度。o：{res 缩小倍数（默认 4）, blur 模糊半径（W×H 的像素）, bg 底色, pixel(x, y, v) → 逐点改写亮度}。返回 {w, h, res, d, canvas, at(x, y) → 0 暗–1 亮（双线性）}，init 里做一次
function toneMap(fn, o = {}) {
  const res = o.res || 4, w = Math.ceil(W / res), h = Math.ceil(H / res);
  let c = mk(w, h), g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = o.bg || '#fff'; g.fillRect(0, 0, w, h);
  g.save(); g.scale(w / W, h / H); if (fn) fn(g); g.restore();
  if (o.blur) {
    const c2 = mk(w, h), g2 = c2.getContext('2d', { willReadFrequently: true });
    g2.fillStyle = o.bg || '#fff'; g2.fillRect(0, 0, w, h); g2.filter = `blur(${o.blur / res}px)`; g2.drawImage(c, 0, 0); c = c2; g = g2;
  }
  const im = g.getImageData(0, 0, w, h).data, d = new Float32Array(w * h);
  for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
    let v = (im[i * 4] * .299 + im[i * 4 + 1] * .587 + im[i * 4 + 2] * .114) / 255;
    if (o.pixel) v = o.pixel((x + .5) * res, (y + .5) * res, v);
    d[i] = clamp(v);
  }
  if (o.pixel) { const out = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const b = d[i] * 255; out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = b; out.data[i * 4 + 3] = 255; } g.putImageData(out, 0, 0); }
  const at = (x, y) => {
    const fx = clamp(x / res - .5, 0, w - 1.001), fy = clamp(y / res - .5, 0, h - 1.001), x0 = fx | 0, y0 = fy | 0, ax = fx - x0, ay = fy - y0, i = y0 * w + x0;
    return (d[i] * (1 - ax) + d[i + 1] * ax) * (1 - ay) + (d[i + w] * (1 - ax) + d[i + w + 1] * ax) * ay;
  };
  return { w, h, res, d, canvas: c, at };
}
// 排线：按明暗图 T 在角度 angle 方向铺一层间距 gap 的平行线，只留亮度 < thr 的段（light: true 时留 > thr 的段，刮画、白线用）；交叉排线就换角度、降 thr 再叫一次。o：{angle, gap, thr, light, step 取样步长, minLen, maxLen 断成短笔, jitter 线距抖动 0–1, order(x, y, v) → 先后（默认先暗后亮）, seed, swell 存下沿线亮度给 drawHatch 变粗细, box [x0,y0,x1,y1] 只铺这块, mask(x, y) → false 的地方不铺}。返回按先后排好的笔画 [{x0,y0,x1,y1,v 平均亮度,k 0–1 出场顺序,vs}]
function hatchLines(T, o = {}) {
  const a = o.angle ?? -Math.PI / 4, gap = o.gap || 8, thr = o.thr ?? .5, step = o.step || Math.max(2, gap * .5), seed = o.seed || 1;
  const minLen = o.minLen ?? gap, maxLen = o.maxLen || 1e9, jit = o.jitter ?? .3, light = !!o.light;
  const [bx0, by0, bx1, by1] = o.box || [0, 0, W, H];
  const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, cs = [[bx0, by0], [bx1, by0], [bx0, by1], [bx1, by1]];
  const pn = cs.map(([x, y]) => x * nx + y * ny), pd = cs.map(([x, y]) => x * dx + y * dy);
  const n0 = Math.min(...pn), n1 = Math.max(...pn), d0 = Math.min(...pd), d1 = Math.max(...pd);
  const R = mulberry32(seed * 7919 + 13), out = [];
  const push = (run, vs) => {
    const [s0, s1] = run, L = s1 - s0; if (L < minLen) return;
    let s = s0;
    while (s1 - s > minLen * .5) {
      const len = Math.min(s1 - s, maxLen < 1e8 ? maxLen * (.6 + R() * .8) : 1e9);
      const i0 = Math.round((s - s0) / step), i1 = Math.round((s + len - s0) / step), sub = vs.slice(i0, Math.max(i0 + 1, i1 + 1));
      const v = sub.reduce((p, q) => p + q, 0) / sub.length;
      const sh = maxLen < 1e8 ? (R() - .5) * gap * .8 : 0, sx = nx * sh, sy = ny * sh, a0 = maxLen < 1e8 ? (R() - .5) * len * .3 : 0;   // 断成短笔时每笔错开一点，不连成长线
      out.push({ x0: run.ox + sx + dx * (s + a0), y0: run.oy + sy + dy * (s + a0), x1: run.ox + sx + dx * (s + a0 + len), y1: run.oy + sy + dy * (s + a0 + len), v, vs: o.swell ? sub : null });
      s += len + (maxLen < 1e8 ? gap * (.3 + R() * .9) : 0);
    }
  };
  for (let off = n0 + gap * R(); off < n1; off += gap) {
    const oo = off + (R() - .5) * gap * jit, ox = nx * oo, oy = ny * oo;
    let run = null, vs = [];
    for (let s = d0; s <= d1; s += step) {
      const x = ox + dx * s, y = oy + dy * s;
      const inside = x >= bx0 && x <= bx1 && y >= by0 && y <= by1 && (!o.mask || o.mask(x, y));
      const v = inside ? T.at(x, y) : 1, ok = inside && (light ? v > thr : v < thr);
      if (ok) { if (!run) { run = [s, s]; run.ox = ox; run.oy = oy; vs = []; } run[1] = s; vs.push(v); }
      else if (run) { push(run, vs); run = null; }
    }
    if (run) push(run, vs);
  }
  const ord = o.order || ((x, y, v) => light ? 1 - v : v);
  for (const q of out) q.k = ord((q.x0 + q.x1) / 2, (q.y0 + q.y1) / 2, q.v) + R() * 1e-3;
  out.sort((p, q) => p.k - q.k); out.forEach((q, i) => q.k = i / Math.max(1, out.length - 1));
  return out;
}
// 画排线：L 是 hatchLines 的结果，按 k 依次画出到进度 p（0–1，每笔用 dur 的进度画完）。o：{color, width, alpha（可传 v → 值的函数，按亮度分 9 档批量画）, bend 弯度（笔长的比例）, wob 手抖（像素）, taper 两头收尖（画成实心）, swell [亮处宽, 暗处宽] 沿线变粗细（hatchLines 要开 swell）, blob 笔停处的小墨点半径（约三成的笔有）, dur, cap, seed}
function drawHatch(ctx, L, p = 1, o = {}) {
  const dur = o.dur ?? .04, seed = o.seed || 1, bend = o.bend || 0, wob = o.wob || 0, fill = !!(o.taper || o.swell);
  const fw = typeof o.width === 'function' ? o.width : () => o.width || 1.5, fa = typeof o.alpha === 'function' ? o.alpha : () => o.alpha ?? 1;
  const B = Array.from({ length: 9 }, () => new Path2D()), used = new Array(9).fill(false), D = new Path2D();
  for (let i = 0; i < L.length; i++) {
    const q = L[i], qp = clamp((p - q.k * (1 - dur)) / dur); if (qp <= 0) break;
    const b = Math.round(clamp(q.v) * 8), P = B[b]; used[b] = true;
    const h = hash1(i * 31 + seed * 977), ex = q.x0 + (q.x1 - q.x0) * qp, ey = q.y0 + (q.y1 - q.y0) * qp;
    const len = Math.hypot(q.x1 - q.x0, q.y1 - q.y0) || 1, ux = (q.x1 - q.x0) / len, uy = (q.y1 - q.y0) / len;
    const bo = bend * len * (h - .35), w1 = wob * (hash1(i * 7 + 3) - .5), w2 = wob * (hash1(i * 13 + 5) - .5);
    if (!fill) {
      P.moveTo(q.x0 - uy * w1, q.y0 + ux * w1);
      if (bend) P.quadraticCurveTo((q.x0 + ex) / 2 - uy * bo * qp, (q.y0 + ey) / 2 + ux * bo * qp, ex - uy * w2, ey + ux * w2);
      else P.lineTo(ex - uy * w2, ey + ux * w2);
      if (o.blob && qp >= 1 && h < .3) { D.moveTo(ex - uy * w2 + o.blob, ey + ux * w2); D.arc(ex - uy * w2, ey + ux * w2, o.blob, 0, TAU); }
    } else {
      const m = Math.max(3, Math.min(24, Math.round(len * qp / 6))), top = [], bot = [], wv = fw(q.v);
      for (let j = 0; j <= m; j++) {
        const s = j / m, ss = s * qp, x = q.x0 + (q.x1 - q.x0) * ss - uy * (bo * 4 * ss * (1 - ss) + lerp(w1, w2, ss)), y = q.y0 + (q.y1 - q.y0) * ss + ux * (bo * 4 * ss * (1 - ss) + lerp(w1, w2, ss));
        let hw = wv / 2;
        if (o.swell && q.vs) { const vv = q.vs[Math.min(q.vs.length - 1, Math.round(ss * (q.vs.length - 1)))]; hw = lerp(o.swell[1], o.swell[0], vv) / 2; }
        if (o.taper) hw *= Math.pow(Math.sin(Math.PI * clamp(ss, .02, .98)), .6);
        top.push([x - uy * hw, y + ux * hw]); bot.push([x + uy * hw, y - ux * hw]);
      }
      P.moveTo(...top[0]); for (const pt of top) P.lineTo(...pt); for (let j = bot.length - 1; j >= 0; j--) P.lineTo(...bot[j]); P.closePath();
    }
  }
  ctx.save(); ctx.lineCap = o.cap || 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = ctx.fillStyle = o.color || '#1a1a1a';
  for (let b = 0; b < 9; b++) {
    if (!used[b]) continue; const v = b / 8;
    ctx.globalAlpha = clamp(fa(v));
    if (fill) ctx.fill(B[b]); else { ctx.lineWidth = fw(v); ctx.stroke(B[b]); }
  }
  if (o.blob) { ctx.globalAlpha = 1; ctx.fill(D); }
  ctx.restore();
}
// 点刻：按明暗图 T 在边长 cell 的抖动网格里取点，暗处密、亮处疏（取点概率 (1-v)^gamma，亮度 ≥ thr 的不取）。o：{cell, gamma, thr, seed, order(x, y, v) → 先后（默认先暗后亮）}。返回按先后排好的 Float32Array [x, y, v, …]
function stipple(T, o = {}) {
  const c = o.cell || 5, gm = o.gamma ?? 1, thr = o.thr ?? .97, seed = o.seed || 1, pts = [];
  const ord = o.order || ((x, y, v) => v);
  for (let gy = 0; gy * c < H; gy++) for (let gx = 0; gx * c < W; gx++) {
    const x = (gx + hash2(gx * 3 + seed, gy * 5 + 1)) * c, y = (gy + hash2(gx * 7 + 2, gy * 11 + seed)) * c, v = T.at(x, y);
    if (v >= thr || hash2(gx + seed * 131, gy * 3 + 7) > Math.pow(1 - v, gm)) continue;
    pts.push([x, y, v, ord(x, y, v) + hash2(gx, gy + seed) * .08]);
  }
  pts.sort((p, q) => p[3] - q[3]);
  const out = new Float32Array(pts.length * 3); pts.forEach((q, i) => { out[i * 3] = q[0]; out[i * 3 + 1] = q[1]; out[i * 3 + 2] = q[2]; });
  return out;
}
// 画点：D 是 stipple 的结果，画出前 p（0–1）部分，点半径 r，一次填完；点只出现、不渐入
function drawDots(ctx, D, p = 1, r = 1.5, color = '#111') {
  const n = Math.floor(clamp(p) * D.length / 3), P = new Path2D();
  for (let i = 0; i < n; i++) { const x = D[i * 3], y = D[i * 3 + 1]; P.moveTo(x + r, y); P.arc(x, y, r, 0, TAU); }
  ctx.save(); ctx.fillStyle = color; ctx.fill(P); ctx.restore();
}
// 随明暗变粗细的一根线：沿折线 pts（[[x,y],…]）画实心带，宽度在 w0（亮处）和 w1（暗处）之间按 T.at 取，只画前 p（0–1）；单线雕版、铜版轮廓线用
function toneRibbon(ctx, pts, T, w0, w1, p = 1, color = '#111') {
  const n = Math.max(1, Math.round(clamp(p) * (pts.length - 1))), top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const [x, y] = pts[i], hw = lerp(w1, w0, T.at(x, y)) / 2;
    top.push([x - dy / l * hw, y + dx / l * hw]); bot.push([x + dy / l * hw, y - dx / l * hw]);
  }
  ctx.save(); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(...top[0]);
  for (const q of top) ctx.lineTo(...q); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(...bot[i]);
  ctx.closePath(); ctx.fill(); ctx.restore();
}

// ---------- 底图、方向场、油画笔触 ----------
// 底图：fn(g) 用 W×H 的坐标画出要画的东西（色块、渐变就够，不用细节），缩到 1/res 存成颜色表。o：{res 缩小倍数（默认 4）, blur 模糊半径（W×H 的像素）}。返回 {w, h, res, canvas, at(x, y) → [r,g,b]（双线性）, lum(x, y) → 0 暗–1 亮}，init 里做一次
function paintMap(fn, o = {}) {
  const res = o.res || 4, w = Math.ceil(W / res), h = Math.ceil(H / res);
  let c = mk(w, h), g = c.getContext('2d', { willReadFrequently: true });
  g.save(); g.scale(w / W, h / H); fn(g); g.restore();
  if (o.blur) { const c2 = mk(w, h), g2 = c2.getContext('2d', { willReadFrequently: true }); g2.filter = `blur(${o.blur / res}px)`; g2.drawImage(c, 0, 0); c = c2; g = g2; }
  const d = g.getImageData(0, 0, w, h).data, L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = (d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114) / 255;
  const cell = (x, y) => { const fx = clamp(x / res - .5, 0, w - 1.001), fy = clamp(y / res - .5, 0, h - 1.001), x0 = fx | 0, y0 = fy | 0; return [y0 * w + x0, fx - x0, fy - y0]; };
  const at = (x, y) => {
    const [i, ax, ay] = cell(x, y), o4 = [i, i + 1, i + w, i + w + 1].map(j => j * 4), wt = [(1 - ax) * (1 - ay), ax * (1 - ay), (1 - ax) * ay, ax * ay];
    return [0, 1, 2].map(ch => wt[0] * d[o4[0] + ch] + wt[1] * d[o4[1] + ch] + wt[2] * d[o4[2] + ch] + wt[3] * d[o4[3] + ch]);
  };
  const lum = (x, y) => { const [i, ax, ay] = cell(x, y); return (L[i] * (1 - ax) + L[i + 1] * ax) * (1 - ay) + (L[i + w] * (1 - ax) + L[i + w + 1] * ax) * ay; };
  return { w, h, res, canvas: c, at, lum };
}
// 方向场：每一点笔触朝哪。o：{angle 基本方向（弧度）, map 底图 + contour 0–1（顺着明暗的边走，像沿形体转的笔）, noise 噪声扰动（弧度）, scale 噪声尺度, swirl [[x, y, 半径, 方向 ±1], …] 漩涡, fn(x, y, a) → 改写方向, res 网格（默认 12）}。返回 {at(x, y) → 弧度}，init 里做一次
function flowField(o = {}) {
  const res = o.res || 12, gw = Math.ceil(W / res) + 2, gh = Math.ceil(H / res) + 2, C = new Float32Array(gw * gh), S = new Float32Array(gw * gh), sc = o.scale || .002;
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const x = gx * res, y = gy * res; let a = o.angle ?? 0, vx = Math.cos(a), vy = Math.sin(a);
    if (o.map && o.contour) {
      const e = o.map.res * 2, dx = o.map.lum(x + e, y) - o.map.lum(x - e, y), dy = o.map.lum(x, y + e) - o.map.lum(x, y - e), m = Math.hypot(dx, dy);
      if (m > 1e-4) { let tx = -dy / m, ty = dx / m; if (tx * vx + ty * vy < 0) { tx = -tx; ty = -ty; } const wt = clamp(m * 8) * o.contour; vx = lerp(vx, tx, wt); vy = lerp(vy, ty, wt); }
    }
    for (const [sx, sy, r, dir] of o.swirl || []) {
      const d = Math.hypot(x - sx, y - sy), wt = Math.exp(-(d / r) * (d / r)), ta = Math.atan2(y - sy, x - sx) + Math.PI / 2 * (dir || 1);
      vx = lerp(vx, Math.cos(ta), wt); vy = lerp(vy, Math.sin(ta), wt);
    }
    a = Math.atan2(vy, vx);
    if (o.noise) a += (fbm(x * sc, y * sc, 3) - .5) * 2 * o.noise;
    if (o.fn) a = o.fn(x, y, a);
    C[gy * gw + gx] = Math.cos(a); S[gy * gw + gx] = Math.sin(a);
  }
  const at = (x, y) => {
    const fx = clamp(x / res, 0, gw - 1.001), fy = clamp(y / res, 0, gh - 1.001), x0 = fx | 0, y0 = fy | 0, ax = fx - x0, ay = fy - y0, i = y0 * gw + x0;
    const bl = A => (A[i] * (1 - ax) + A[i + 1] * ax) * (1 - ay) + (A[i + gw] * (1 - ax) + A[i + gw + 1] * ax) * ay;
    return Math.atan2(bl(S), bl(C));
  };
  return { at };
}
// 铺笔触：按底图 M 取色、方向场 F 定朝向，在抖动网格上排笔；layers 层从粗到细，第 2 层起只补在明暗变化大的地方。o：{gap 间距, len [短, 长], width [细, 粗], jitter 颜色抖动 0–1, spread 朝向抖动（弧度）, follow 沿方向场弯几段（0 是直笔）, layers, detail 细节阈值, mask(x, y), tint(x, y, rgb, R) → 改色（并置补色用）, order(x, y, layer) → 先后（默认按层、层内随机）, seed}。返回按先后排好的笔触 [{x, y, a, w, pts, c 颜色串, dark, light, rgb, k}]
function strokePlan(M, F, o = {}) {
  const gap0 = o.gap || 14, R = mulberry32((o.seed || 1) * 7717 + 3), out = [], jit = o.jitter ?? .1, spread = o.spread ?? .2, nf = o.follow || 0;
  const len = o.len || [gap0 * 1.4, gap0 * 2.6], wid = o.width || [gap0 * .55, gap0 * .9], css = c => `rgb(${c.map(v => clamp(Math.round(v), 0, 255)).join(',')})`;
  for (let L = 0; L < (o.layers || 1); L++) {
    const g = gap0 / Math.pow(1.8, L), s = g / gap0;
    for (let y = -g; y < H + g; y += g) for (let x = -g; x < W + g; x += g) {
      const px = x + R() * g, py = y + R() * g;
      if (o.mask && !o.mask(px, py)) { R(); R(); R(); continue; }
      if (L > 0) { const e = g * .6, dm = Math.abs(M.lum(px + e, py) - M.lum(px - e, py)) + Math.abs(M.lum(px, py + e) - M.lum(px, py - e)); if (dm < (o.detail ?? .08)) { R(); R(); R(); continue; } }
      const a = F.at(px, py) + (R() - .5) * spread, l = lerp(len[0], len[1], R()) * s, w = lerp(wid[0], wid[1], R()) * s;
      const b = 1 + (R() - .5) * 2 * jit, base = M.at(px, py); let rgb = base.map(v => v * b + (R() - .5) * jit * 70); if (o.tint) rgb = o.tint(px, py, rgb, R);
      let pts;
      if (!nf) pts = [[px - Math.cos(a) * l / 2, py - Math.sin(a) * l / 2], [px + Math.cos(a) * l / 2, py + Math.sin(a) * l / 2]];
      else {                                                                                  // 顺着方向场往两头各走 nf 步
        const st = l / 2 / nf, fw = [[px, py]], bw = [];
        let qx = px, qy = py, qa = a; for (let i = 0; i < nf; i++) { qx += Math.cos(qa) * st; qy += Math.sin(qa) * st; const na = F.at(qx, qy); qa = Math.cos(na - qa) < 0 ? na + Math.PI : na; fw.push([qx, qy]); }
        qx = px; qy = py; qa = a + Math.PI; for (let i = 0; i < nf; i++) { qx += Math.cos(qa) * st; qy += Math.sin(qa) * st; const na = F.at(qx, qy); qa = Math.cos(na - qa) < 0 ? na + Math.PI : na; bw.push([qx, qy]); }
        pts = [...bw.reverse(), ...fw];
      }
      const ord = o.order ? o.order(px, py, L) : L + R();
      out.push({ x: px, y: py, a, w, pts, rgb, c: css(rgb), dark: css(rgb.map(v => v * .62)), light: css(rgb.map(v => v * 1.3 + 30)), k: ord + R() * 1e-4 });
    }
  }
  out.sort((p, q) => p.k - q.k); out.forEach((q, i) => q.k = i / Math.max(1, out.length - 1));
  return out;
}
// 画笔触：S 是 strokePlan 的结果，画出前 p（0–1）。o：{style: 'dab' 圆头短笔 | 'impasto' 带暗边和高光的厚涂 | 'dot' 圆点, alpha, scale 笔宽倍数, light 高光朝向（弧度，默认左上）}
function drawStrokes(ctx, S, p = 1, o = {}) {
  const n = Math.floor(clamp(p) * S.length), st = o.style || 'dab', sc = o.scale || 1, la = o.light ?? -2.4, lx = Math.cos(la), ly = Math.sin(la);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = o.alpha ?? 1;
  const path = (q, dx = 0, dy = 0) => { ctx.beginPath(); q.pts.forEach(([x, y], i) => i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy)); };
  for (let i = 0; i < n; i++) {
    const q = S[i], w = q.w * sc;
    if (st === 'dot') { ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, w / 2, 0, TAU); ctx.fill(); continue; }
    if (st === 'impasto') { ctx.strokeStyle = q.dark; ctx.lineWidth = w; path(q, -lx * w * .16, -ly * w * .16); ctx.stroke(); }
    ctx.strokeStyle = q.c; ctx.lineWidth = w * (st === 'impasto' ? .86 : 1); path(q); ctx.stroke();
    if (st === 'impasto') { ctx.strokeStyle = q.light; ctx.lineWidth = w * .2; ctx.globalAlpha = (o.alpha ?? 1) * .7; path(q, lx * w * .22, ly * w * .22); ctx.stroke(); ctx.globalAlpha = o.alpha ?? 1; }
  }
  ctx.restore();
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
// GLSL 常用函数（字符串，拼在 glProgram 的 frag 最前面）：hash21 哈希、vnoise 值噪声（0–1）、fbm 五层分形噪声、rot 二维旋转、pal 余弦调色板、sdBox 方框距离
const GLSL_LIB = `
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vnoise(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return s/.97;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 pal(float t,vec3 a,vec3 b,vec3 c,vec3 d){return a+b*cos(6.28318*(c*t+d));}
float sdBox(vec2 p,vec2 b){vec2 d=abs(p)-b;return length(max(d,0.))+min(max(d.x,d.y),0.);}
`;
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

// ---------- 关键帧、骨骼、流体 ----------

// 关键帧插值：keys 是按时间排好的 [[秒, 值], …]，值可以是数字、数字数组或 {名字: 数字} 对象（同一组键里写法一致），返回 t 时刻的值；两帧之间按 ease（默认 eInOutCubic）过渡，第一帧之前、最后一帧之后停在两端
function keyAt(keys, t, ease = eInOutCubic) {
  if (t <= keys[0][0]) return keys[0][1];
  let i = 1; while (i < keys.length - 1 && keys[i][0] < t) i++;
  const [t0, a] = keys[i - 1], [t1, b] = keys[i];
  if (t >= t1) return b;
  const q = ease((t - t0) / (t1 - t0 || 1));
  if (typeof a === 'number') return lerp(a, b, q);
  if (Array.isArray(a)) return a.map((x, k) => lerp(x, b[k], q));
  const o = {}; for (const k in a) o[k] = lerp(a[k], b[k] ?? a[k], q); return o;
}

// 二维骨骼：bones 是 [{name, parent 父骨名（根骨不写）, len 长度, a 静止角（弧度，相对父骨）}]，pose 是 {骨名: 加的角度} 和 root {x, y, a}；按父子顺序算出每根骨头的起点、终点和世界角度，返回 {名字: {x0, y0, x1, y1, a}}；配 keyAt 做关键帧动画（姿势按关键帧插值，每帧只由 t 决定）
function skeleton2d(bones, pose = {}, root = { x: 0, y: 0, a: 0 }) {
  const out = {};
  for (const b of bones) {
    const p = b.parent ? out[b.parent] : null;
    const x0 = p ? p.x1 : root.x, y0 = p ? p.y1 : root.y;
    const a = (p ? p.a : root.a) + (b.a || 0) + (pose[b.name] || 0);
    out[b.name] = { x0, y0, x1: x0 + Math.cos(a) * b.len, y1: y0 + Math.sin(a) * b.len, a };
  }
  return out;
}

// 二维流体（Stam 的稳定流体：半拉格朗日平流 + 高斯-赛德尔投影 + 涡度增强），在 CPU 上算。o：{w, h 速度网格（默认 128×72）, dye 染料网格是速度网格的几倍（默认 3）, iters 投影迭代次数, vort 涡度增强, fade 染料每秒衰减, velFade 速度每秒衰减}。返回状态 F，用 fluidAt 推到 t
function fluid2d(o = {}) {
  const w = o.w || 128, h = o.h || 72, k = o.dye || 3, N = (w + 2) * (h + 2), dw = w * k, dh = h * k, DN = dw * dh;
  const A = n => new Float32Array(n);
  const F = { w, h, k, dw, dh, iters: o.iters || 20, vort: o.vort ?? 3, fade: o.fade ?? .35, velFade: o.velFade ?? .2,
    u: A(N), v: A(N), u0: A(N), v0: A(N), p: A(N), div: A(N), curl: A(N), dye: [A(DN), A(DN), A(DN)], dye0: [A(DN), A(DN), A(DN)], t: 0 };
  F.reset = () => { for (const a of [F.u, F.v, F.u0, F.v0, F.p, F.div, F.curl, ...F.dye, ...F.dye0]) a.fill(0); F.t = 0; };
  return F;
}

// 往流体里加一团推力和染料：x, y 是 0–1 的位置，fx, fy 是速度（每秒多少个速度网格），r 是半径（占速度网格宽的比例），rgb 是染料量 [r, g, b]（可大于 1，画的时候会压到 0–1）
function fluidSplat(F, x, y, fx, fy, r, rgb) {
  const { w, h, k, dw, dh } = F, W2 = w + 2, rc = r * w, cx = x * w + .5, cy = y * h + .5;
  const i0 = Math.max(1, Math.floor(cx - rc * 3)), i1 = Math.min(w, Math.ceil(cx + rc * 3)), j0 = Math.max(1, Math.floor(cy - rc * 3)), j1 = Math.min(h, Math.ceil(cy + rc * 3));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const g = Math.exp(-((i - cx) ** 2 + (j - cy) ** 2) / (rc * rc)); F.u[i + W2 * j] += fx * g; F.v[i + W2 * j] += fy * g; }
  if (!rgb) return;
  const dx = x * dw, dy = y * dh, rd = rc * k;
  const a0 = Math.max(0, Math.floor(dx - rd * 3)), a1 = Math.min(dw - 1, Math.ceil(dx + rd * 3)), b0 = Math.max(0, Math.floor(dy - rd * 3)), b1 = Math.min(dh - 1, Math.ceil(dy + rd * 3));
  for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) {
    const g = Math.exp(-((a + .5 - dx) ** 2 + (b + .5 - dy) ** 2) / (rd * rd)), q = a + dw * b;
    F.dye[0][q] += rgb[0] * g; F.dye[1][q] += rgb[1] * g; F.dye[2][q] += rgb[2] * g;
  }
}

// 流体走一步 dt 秒（一般不直接用，见 fluidAt）
function fluidStep(F, dt) {
  const { w, h, k, dw, dh, u, v, u0, v0, p, div, curl } = F, W2 = w + 2, I = (i, j) => i + W2 * j;
  const bnd = (b, x) => {
    for (let i = 1; i <= w; i++) { x[I(i, 0)] = b === 2 ? -x[I(i, 1)] : x[I(i, 1)]; x[I(i, h + 1)] = b === 2 ? -x[I(i, h)] : x[I(i, h)]; }
    for (let j = 1; j <= h; j++) { x[I(0, j)] = b === 1 ? -x[I(1, j)] : x[I(1, j)]; x[I(w + 1, j)] = b === 1 ? -x[I(w, j)] : x[I(w, j)]; }
    x[I(0, 0)] = .5 * (x[I(1, 0)] + x[I(0, 1)]); x[I(w + 1, 0)] = .5 * (x[I(w, 0)] + x[I(w + 1, 1)]);
    x[I(0, h + 1)] = .5 * (x[I(1, h + 1)] + x[I(0, h)]); x[I(w + 1, h + 1)] = .5 * (x[I(w, h + 1)] + x[I(w + 1, h)]);
  };
  const project = () => {
    for (let j = 1; j <= h; j++) for (let i = 1; i <= w; i++) div[I(i, j)] = -.5 * (u[I(i + 1, j)] - u[I(i - 1, j)] + v[I(i, j + 1)] - v[I(i, j - 1)]);
    bnd(0, div); bnd(0, p);
    for (let n = 0; n < F.iters; n++) {
      for (let j = 1; j <= h; j++) for (let i = 1; i <= w; i++) { const q = I(i, j); p[q] = (div[q] + p[q - 1] + p[q + 1] + p[q - W2] + p[q + W2]) / 4; }
      bnd(0, p);
    }
    for (let j = 1; j <= h; j++) for (let i = 1; i <= w; i++) { const q = I(i, j); u[q] -= .5 * (p[q + 1] - p[q - 1]); v[q] -= .5 * (p[q + W2] - p[q - W2]); }
    bnd(1, u); bnd(2, v);
  };
  const samp = (a, x, y) => {
    x = clamp(x, .5, w + .5); y = clamp(y, .5, h + .5);
    const i = Math.floor(x), j = Math.floor(y), s = x - i, t = y - j, q = I(i, j);
    return (1 - t) * ((1 - s) * a[q] + s * a[q + 1]) + t * ((1 - s) * a[q + W2] + s * a[q + W2 + 1]);
  };
  // 涡度增强：把被数值耗散掉的小涡旋补回来
  if (F.vort) {
    for (let j = 1; j <= h; j++) for (let i = 1; i <= w; i++) { const q = I(i, j); curl[q] = .5 * (v[q + 1] - v[q - 1] - u[q + W2] + u[q - W2]); }
    for (let j = 2; j < h; j++) for (let i = 2; i < w; i++) {
      const q = I(i, j), nx = .5 * (Math.abs(curl[q + 1]) - Math.abs(curl[q - 1])), ny = .5 * (Math.abs(curl[q + W2]) - Math.abs(curl[q - W2])), l = Math.hypot(nx, ny) + 1e-5;
      u[q] += dt * F.vort * (ny / l) * curl[q]; v[q] -= dt * F.vort * (nx / l) * curl[q];
    }
  }
  project();
  u0.set(u); v0.set(v);
  for (let j = 1; j <= h; j++) for (let i = 1; i <= w; i++) { const q = I(i, j), x = i - dt * u0[q], y = j - dt * v0[q]; u[q] = samp(u0, x, y); v[q] = samp(v0, x, y); }
  const vf = 1 / (1 + F.velFade * dt); for (let q = 0; q < u.length; q++) { u[q] *= vf; v[q] *= vf; }
  bnd(1, u); bnd(2, v); project();
  // 染料：在细网格上平流，速度按双线性取
  const df = 1 / (1 + F.fade * dt);
  for (let c = 0; c < 3; c++) F.dye0[c].set(F.dye[c]);
  for (let b = 0; b < dh; b++) for (let a = 0; a < dw; a++) {
    const x = .5 + (a + .5) / k, y = .5 + (b + .5) / k;
    const sx = clamp((x - dt * samp(u, x, y) - .5) * k - .5, 0, dw - 1.001), sy = clamp((y - dt * samp(v, x, y) - .5) * k - .5, 0, dh - 1.001);
    const i = Math.floor(sx), j = Math.floor(sy), s = sx - i, t = sy - j, q = i + dw * j, o = a + dw * b;
    for (let c = 0; c < 3; c++) { const d = F.dye0[c]; F.dye[c][o] = df * ((1 - t) * ((1 - s) * d[q] + s * d[q + 1]) + t * ((1 - s) * d[q + dw] + s * d[q + dw + 1])); }
  }
  F.t += dt;
}

// 流体推到 t 秒：每帧都从 0 重算（固定步长 dt，默认 1/60 秒），所以每帧只由 t 决定，结果可重复；forces(F, 时刻, dt) 每步调用一次，在里面用 fluidSplat 加推力和染料
function fluidAt(F, t, forces, dt = 1 / 60) {
  F.reset();
  const n = Math.round(t / dt);
  for (let s = 0; s < n; s++) { forces(F, s * dt, dt); fluidStep(F, dt); }
  return F;
}

// 把流体的染料画成一张 dw×dh 的画布：每个通道按 1 - e^(-gain·量) 压到 0–1，浓处饱和发亮、淡处透明（黑底上用 'lighter' 叠就是发光的染料）
function fluidImage(F, gain = 1.4) {
  const { dw, dh, dye } = F;
  if (!F.cv) { F.cv = mk(dw, dh); F.im = F.cv.getContext('2d').createImageData(dw, dh); }
  const d = F.im.data;
  for (let q = 0; q < dw * dh; q++) {
    d[q * 4] = 255 * (1 - Math.exp(-gain * dye[0][q])); d[q * 4 + 1] = 255 * (1 - Math.exp(-gain * dye[1][q])); d[q * 4 + 2] = 255 * (1 - Math.exp(-gain * dye[2][q])); d[q * 4 + 3] = 255;
  }
  F.cv.getContext('2d').putImageData(F.im, 0, 0);
  return F.cv;
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
// 确定性视频取帧：把局部时间 lt 按 o.mode（'clamp' 末帧定格 / 'loop' 循环 / 'pingpong' 往返，默认 'clamp'）、o.speed（默认 1）、o.offset（默认 0）映射到 [0, v.dur - 1/FPS]，await v.at(mt) 后返回 v.el
async function videoAt(v, lt, o = {}) {
  if (!v || !v.el || !v.at) return null;
  const dur = Math.max(1 / FPS, v.dur || 0), maxT = Math.max(0, dur - 1 / FPS);
  const raw = Math.max(0, lt) * (o.speed ?? 1) + (o.offset ?? 0), mode = o.mode || 'clamp';
  let mt = 0;
  if (mode === 'loop') mt = dur > 0 ? Math.min(maxT, ((raw % dur) + dur) % dur) : 0;
  else if (mode === 'pingpong') {
    if (maxT > 0) { const span = maxT * 2, r = ((raw % span) + span) % span; mt = r <= maxT ? r : span - r; }
  } else mt = clamp(raw, 0, maxT);
  await v.at(mt);
  return v.el;
}
// 安全载入图片或视频（kind 为 'image' 或 'video'，省略时按扩展名判断）：name 为空或文件不存在时返回 null（不抛异常阻断渲染，交由 drawPlaceholder 渲染占位框）
async function loadMediaSafe(name, kind) {
  if (!name || typeof name !== 'string') return null;
  if (typeof window.__aicvFileExists === 'function') {
    const url = new URL(asset(name), location.href).href;
    if (!(await window.__aicvFileExists(url))) return null;
  }
  const k = kind || (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(name) ? 'video' : 'image');
  try { return k === 'video' ? await loadVideo(name) : await loadImage(name); }
  catch (_) { return null; }
}
// 在 (x,y,w,h) 绘制符合当前主题 K 的媒体虚线占位框：标出 [T 真实素材] / [G AI 素材]（支持 mediaType: 'image' | 'video' 区分图片/视频图标）、目标尺寸与 o.label，缺素材时不黑屏不白屏
function drawPlaceholder(ctx, x, y, w, h, o = {}) {
  const K = o.K || {}, u = K.u || (SHORT / 1080), rad = o.radius ?? 18 * u;
  const isG = o.kind === 'G', mtype = o.mediaType;
  const defaultTag = mtype === 'video'
    ? (isG ? '[G AI 视频]' : '[T 实拍视频]')
    : mtype === 'image'
      ? (isG ? '[G AI 生图]' : '[T 真实图片]')
      : (isG ? '[G AI 素材]' : '[T 真实素材]');
  const tag = o.tag || defaultTag;
  const accent = K.a ? K.a(.65) : (isG ? 'rgba(176,132,255,.72)' : 'rgba(72,216,172,.72)');
  const accentSoft = K.a ? K.a(.14) : (isG ? 'rgba(176,132,255,.14)' : 'rgba(72,216,172,.14)');
  const ink = K.ink || '#F2F5FA', muted = K.muted || 'rgba(242,245,250,.66)';
  const mono = K.mono || "'JetBrains Mono', monospace", head = K.head || "'Noto Sans SC', sans-serif";
  ctx.save();
  rr(ctx, x, y, w, h, rad);
  ctx.fillStyle = o.bg || K.panel || 'rgba(255,255,255,.06)';
  ctx.fill();
  ctx.save();
  rr(ctx, x, y, w, h, rad);
  ctx.clip();
  // 轻量斜纹底纹 + 柔和扫描光带，保证构图辨识度且不死屏
  const step = Math.max(20, 32 * u);
  ctx.strokeStyle = K.a ? K.a(.09) : 'rgba(255,255,255,.06)';
  ctx.lineWidth = Math.max(1, 1.2 * u);
  ctx.beginPath();
  for (let d = -h; d < w + h; d += step) { ctx.moveTo(x + d, y); ctx.lineTo(x + d - h, y + h); }
  ctx.stroke();
  if (o.t != null) {
    const sx = x + ((o.t * 0.28) % 1.4 - 0.2) * w;
    const lg = ctx.createLinearGradient(sx - w * .18, y, sx + w * .18, y + h);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(.5, accentSoft);
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(x, y, w, h);
  }
  const cx = x + w / 2, cy = y + h / 2, compact = Math.min(w, h) < 220 * u;
  const tagPx = Math.round((compact ? 16 : 22) * u);
  ctx.font = `700 ${tagPx}px ${mono}`;
  const tw = Math.min(w - 24 * u, ctx.measureText(tag).width + 28 * u), th = tagPx * 1.75;
  const hasLabel = Boolean(o.label) && !compact;
  const hasIcon = !compact && (mtype === 'video' || mtype === 'image');
  const badgeY = cy - (hasLabel ? (hasIcon ? 24 : 42) * u : 16 * u) - th / 2;
  if (hasIcon) {
    const iw = (mtype === 'video' ? 48 : 44) * u, ih = 32 * u;
    const ix = cx - iw / 2, iy = badgeY - ih - 14 * u;
    ctx.save();
    rr(ctx, ix, iy, iw, ih, 7 * u);
    ctx.fillStyle = accentSoft; ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = Math.max(1.5, 2 * u); ctx.stroke();
    ctx.fillStyle = accent;
    if (mtype === 'video') {
      ctx.beginPath();
      ctx.moveTo(cx - 5 * u, iy + 8 * u);
      ctx.lineTo(cx + 8 * u, iy + ih / 2);
      ctx.lineTo(cx - 5 * u, iy + ih - 8 * u);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(ix + iw * .3, iy + ih * .34, 3.5 * u, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ix + 7 * u, iy + ih - 6 * u);
      ctx.lineTo(ix + iw * .46, iy + ih * .46);
      ctx.lineTo(ix + iw * .66, iy + ih * .68);
      ctx.lineTo(ix + iw * .8, iy + ih * .52);
      ctx.lineTo(ix + iw - 7 * u, iy + ih - 6 * u);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  rr(ctx, cx - tw / 2, badgeY, tw, th, th / 2);
  ctx.fillStyle = accentSoft; ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = Math.max(1, 1.4 * u); ctx.stroke();
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(tag, cx, badgeY + th / 2);
  if (hasLabel) {
    const lblPx = Math.round(clamp(Math.min(w, h) * .048, 20 * u, 32 * u));
    ctx.font = `700 ${lblPx}px ${head}`;
    ctx.fillStyle = ink;
    const lines = wrapCJK(ctx, String(o.label), w * .84).slice(0, 2);
    lines.forEach((ln, i) => ctx.fillText(ln, cx, cy + ((hasIcon ? 24 : 12) + i * (lblPx / u * 1.35)) * u));
  }
  const dimTxt = `${Math.round(w)} × ${Math.round(h)}`;
  ctx.font = `600 ${Math.round((compact ? 14 : 18) * u)}px ${mono}`;
  ctx.fillStyle = muted;
  ctx.fillText(dimTxt, cx, hasLabel ? cy + Math.min(h * .36, (hasIcon ? 104 : 92) * u) : cy + 24 * u);
  ctx.restore();
  rr(ctx, x, y, w, h, rad);
  ctx.setLineDash([10 * u, 8 * u]);
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1.5, 2 * u);
  ctx.stroke();
  ctx.restore();
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

// ---------- 完整出片的段（player.html?p=<项目>&seg=<段号>：段长和每句的时间从 timing.json 读进 SEG） ----------
let SEG = null;   // 本段的时间 {seg, dur, vo: [{file, at, t, text, show, chars}], shots: [{t0, t1, cut}]}（格式见 Skill 的 film.md「时间」）；样片里是 null
let TIMING = null;   // 整片的 timing.json（SEG 是其中一段）：跨段连续的东西（整片时钟、进度条）用它算本段在整片里的起点；样片里是 null
// 第 i 句的起止（秒，本段时间）：{t0, t1, text 念的, show 字幕写法}；没有这句返回 null
function say(i) { const v = SEG && SEG.vo[i]; return v ? { t0: v.at, t1: v.at + v.t, text: v.text, show: v.show } : null; }
// t 时刻正在说第几句（没在说返回 -1）；hold 秒内的句间空隙算上一句
function sayingAt(t, hold = 0) { if (!SEG) return -1; for (let i = SEG.vo.length - 1; i >= 0; i--) { const v = SEG.vo[i]; if (t >= v.at && t < v.at + v.t + hold) return i; } return -1; }
// 第 i 句到 t 时刻念到第几个字（按 chars 的逐字时间；没有逐字时间的按句长均分），返回 0–1 的进度
function sayP(i, t) {
  const v = SEG && SEG.vo[i]; if (!v) return 0;
  if (v.chars && v.chars.length) { let n = 0; for (const c of v.chars) if (t >= c.s) n++; return n / v.chars.length; }
  return clamp((t - v.at) / v.t);
}
// t 时刻的字幕（show 写法）：说完后留 hold 秒，下一句开始就换；没有返回 null
function subAt(t, hold = .35) { const i = sayingAt(t, hold); return i < 0 ? null : { i, text: SEG.vo[i].show, p: sayP(i, t) }; }
// t 时刻是本段第几个分镜（分镜脚本的 shots，起止由 voice.py 排进 timing.json）：{i 从 0 数, t0, t1, d 时长, lt 分镜内的时间, p 0–1, cut}；没分镜返回 null
function shotAt(t) {
  const L = SEG && SEG.shots; if (!L || !L.length) return null;
  let i = L.length - 1; while (i > 0 && t < L[i].t0) i--;
  const s = L[i], d = s.t1 - s.t0;
  return { i, t0: s.t0, t1: s.t1, d, lt: t - s.t0, p: clamp((t - s.t0) / d), cut: s.cut || '硬切' };
}
let _shotOff = null;
// 按分镜画：fns[i](ctx, lt, d, t) 画第 i 个分镜（分镜内的时间、分镜时长、本段时间），可以是 async；每个分镜前后 save、restore，平移、缩放、透明度不串到下一个；cut 是「溶解」的开头 mix 秒叠在上一个分镜上淡入。返回当前第几个分镜；没分镜时整段画 fns[0]
async function drawShots(ctx, t, fns, mix = .5) {
  const sh = shotAt(t);
  const run = async (k, c) => { const L = SEG.shots[k], f = fns[k] || (() => {}); c.save(); await f(c, t - L.t0, L.t1 - L.t0, t); c.restore(); };
  if (!sh) { ctx.save(); await fns[0](ctx, t, SEG ? SEG.dur : 0, t); ctx.restore(); return 0; }
  const m = Math.min(mix, sh.d / 2);
  if (sh.i > 0 && sh.cut === '溶解' && sh.lt < m) {
    await run(sh.i - 1, ctx);
    _shotOff = _shotOff && _shotOff.width === W && _shotOff.height === H ? _shotOff : mk(W, H);
    const o = _shotOff.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.clearRect(0, 0, W, H);
    await run(sh.i, o);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = eInOutCubic(sh.lt / m); ctx.drawImage(_shotOff, 0, 0); ctx.restore();
  } else await run(sh.i, ctx);
  return sh.i;
}

const S = [];   // 场景列表（播放器读 S[0]）
// 注册场景：{id, name, dur, still, fonts, text, libs, dom, init() → 状态 s, draw(ctx, t, s, f)}；init、draw 可以是 async
function scene(def) { S.push(def); }

// 段文件是独立作用域：能用的全局就是 lib.js 顶层声明的这些。改 lib.js 加了新的顶层名字，这张表要跟着补（`samples/API.md` 有段代码那一节）。
window.__FILM_GLOBALS__ = {mulberry32, hash1, hash2, vnoise, fbm, noise1, mk, rgba, hex2rgb, makePaper, weathering, toothMask, makeGrain, grain, vignette, samplePoints, shuffle, polyLen, drawPartial, resample, brushStroke, circlePts, linePts, rectPts, rr, wrapCJK, textReveal, toneMap, hatchLines, drawHatch, stipple, drawDots, toneRibbon, paintMap, flowField, strokePlan, drawStrokes, glInit, glProgram, glDraw, GLSL_LIB, el, svgRoot, timeline, three3d, studioEnv, physicsAt, p5Sketch, keyAt, skeleton2d, fluid2d, fluidSplat, fluidStep, fluidAt, fluidImage, asset, xhr, loadAssets, loadImage, loadText, parseCSV, loadVideo, srcSize, drawCover, drawContain, videoAt, loadMediaSafe, drawPlaceholder, cueAt, cueTime, caption, credits, say, sayingAt, sayP, subAt, shotAt, drawShots, scene, AR, W, H, FPS, LAND, SHORT, LONG, BPM, BEAT, clamp, lerp, inv, smooth, eOutCubic, eInOutCubic, eOutExpo, eInCubic, eOutBack, eOutElastic, TAU, stepT, GRAINS, GL, SVGNS, SEG, TIMING, S};
