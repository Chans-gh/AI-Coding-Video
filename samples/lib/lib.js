// 公共工具：确定性随机数、噪声、缓动、纸纹、取样、WebGL。每帧只由时间 t 决定。
// 画幅由网址参数 ar 决定：?ar=16x9 → 1920×1080；?ar=9x16（默认）→ 1080×1920。
const AR = new URLSearchParams(location.search).get('ar') === '16x9' ? '16x9' : '9x16';
const W = AR === '16x9' ? 1920 : 1080, H = AR === '16x9' ? 1080 : 1920, FPS = 30;
const LAND = W > H;                         // 横屏
const SHORT = Math.min(W, H), LONG = Math.max(W, H);
const BPM = 160, BEAT = 60 / BPM;          // 0.375s; every scene is 8 beats = 3s

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash1(n) { n |= 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
function hash2(x, y) { return hash1(Math.imul(x | 0, 73856093) ^ Math.imul((y | 0) + 7919, 19349663)); }

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const smooth = (a, b, x) => { const t = inv(a, b, x); return t * t * (3 - 2 * t); };
const eOutCubic = t => 1 - Math.pow(1 - clamp(t), 3);
const eInOutCubic = t => (t = clamp(t), t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eOutExpo = t => (t = clamp(t), t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const eInCubic = t => (t = clamp(t), t * t * t);
const eOutBack = (t, s = 1.70158) => (t = clamp(t), 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2));
const eOutElastic = t => {
  t = clamp(t); if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1;
};
const TAU = Math.PI * 2;
const stepT = (t, fps) => Math.floor(t * fps) / fps;   // "on twos" / stop-motion timing

// ---------- value noise ----------
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, oct = 5) {
  let s = 0, a = .5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); n += a; a *= .5; f *= 2.03; }
  return s / n;
}
function noise1(x) { return vnoise(x, 7.31); }

// ---------- canvases ----------
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }

// Paper/texture: base colour + fibres + grain, rendered once at reduced size.
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
// Transparent grain overlay (light & dark specks)
function makeGrain(w, h, amt, seed) {
  const c = mk(w, h), g = c.getContext('2d'), id = g.createImageData(w, h), d = id.data, R = mulberry32(seed);
  for (let i = 0; i < d.length; i += 4) {
    const v = R(); const on = R() < amt;
    d[i] = d[i + 1] = d[i + 2] = v > .5 ? 255 : 0; d[i + 3] = on ? 40 + R() * 80 : 0;
  }
  g.putImageData(id, 0, 0); return c;
}
const GRAINS = [];
function grain(ctx, frame, alpha = .5, scale = 2) {
  if (!GRAINS.length) for (let i = 0; i < 6; i++) GRAINS.push(makeGrain(W / 2, H / 2, .5, 99 + i));
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(GRAINS[frame % 6], 0, 0, W, H); ctx.restore();
}
function vignette(ctx, a = .5, inner = .35, color = '0,0,0') {
  const g = ctx.createRadialGradient(W / 2, H / 2, LONG * inner, W / 2, H / 2, LONG * .75);
  g.addColorStop(0, `rgba(${color},0)`); g.addColorStop(1, `rgba(${color},${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// Sample points inside something drawn by fn(g) on a W×H offscreen.
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
function shuffle(a, seed = 1) { const R = mulberry32(seed); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Stroke reveal: draw fraction p of a polyline.
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
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
function circlePts(cx, cy, r, n = 64, a0 = 0, a1 = TAU, wob = 0, seed = 0) {
  const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; const rr = r * (1 + wob * (noise1(i * .3 + seed) - .5)); p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p;
}
function linePts(x0, y0, x1, y1, n = 12, wob = 0, seed = 0) {
  const p = []; for (let i = 0; i <= n; i++) { const k = i / n; p.push([lerp(x0, x1, k) + wob * (noise1(i * .7 + seed) - .5), lerp(y0, y1, k) + wob * (noise1(i * .7 + seed + 50) - .5)]); } return p;
}
function rectPts(x, y, w, h, wob = 0, seed = 0) {
  return [...linePts(x, y, x + w, y, 8, wob, seed), ...linePts(x + w, y, x + w, y + h, 8, wob, seed + 1).slice(1),
  ...linePts(x + w, y + h, x, y + h, 8, wob, seed + 2).slice(1), ...linePts(x, y + h, x, y, 8, wob, seed + 3).slice(1)];
}

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// Chinese-aware wrapping (no line may start with closing punctuation)
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

// Reveal a text left→right via clipping, returns the x of the reveal edge
function textReveal(ctx, txt, x, y, p, align = 'left') {
  const w = ctx.measureText(txt).width; const x0 = align === 'center' ? x - w / 2 : x;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 20, y - 400, (w + 40) * clamp(p), 800); ctx.clip();
  ctx.textAlign = align; ctx.fillText(txt, x, y); ctx.restore(); return x0 + w * clamp(p);
}

// ---------- WebGL fullscreen shader helper ----------
const GL = { canvas: null, gl: null, progs: {} };
function glInit(w, h) {
  if (GL.gl) return;
  GL.canvas = mk(w, h);
  GL.gl = GL.canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  const gl = GL.gl, b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
}
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
function glDraw(ctx, name, t, w, h, x = 0, y = 0, dw = W, dh = H) {
  const gl = GL.gl, pr = GL.progs[name];
  if (GL.canvas.width !== w || GL.canvas.height !== h) { GL.canvas.width = w; GL.canvas.height = h; }
  gl.viewport(0, 0, w, h); gl.useProgram(pr);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform1f(gl.getUniformLocation(pr, 'T'), t); gl.uniform2f(gl.getUniformLocation(pr, 'R'), w, h);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  ctx.drawImage(GL.canvas, x, y, dw, dh);
}

const S = [];   // scene registry
function scene(def) { S.push(def); }
