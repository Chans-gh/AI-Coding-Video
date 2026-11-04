// C-182 青花：纹样画在一张环绕瓶身一周的展开贴图上（颈部卷草、肩部如意云头、腹部正面缠枝莲背面鱼藻、底部莲瓣），正面的纹样每帧按进度一笔笔描出、再晕染淡青；瓶身用片元着色器画：每个像素按所在高度的轮廓半径算出圆柱上的角度 asin(x/r)，到贴图上取色，再按法线加明暗、釉面高光和边缘反光；最后瓶子转半圈露出背面
// 风格提示词：用青花风格：白釉瓷面上只有一种钴蓝，浓处发黑并带铁锈色斑点，淡处像水一样晕开，缠枝莲和卷草纹一笔一笔画出来，画面沿瓷瓶或瓷盘的弧面展开，釉面一道柔和的反光随镜头转动滑过，转场是瓷器旋转露出背面的新画，配古琴。
// 题材：东方传统 · 适合：文博与陶瓷科普、茶与器物品牌、古典诗词
const TW = 2048;
const PROF = [[0, .125], [.03, .13], [.05, .1], [.1, .108], [.18, .29], [.3, .43], [.45, .42], [.65, .34], [.85, .25], [.95, .232], [1, .25]];
function prof(v) {                                     // 瓶身轮廓：高度 v（0 顶 … 1 底）→ 半径（占瓶高的比例），分段三次插值
  let i = 0; while (i < PROF.length - 2 && PROF[i + 1][0] < v) i++;
  const p0 = PROF[Math.max(0, i - 1)], p1 = PROF[i], p2 = PROF[i + 1], p3 = PROF[Math.min(PROF.length - 1, i + 2)], t = clamp((v - p1[0]) / (p2[0] - p1[0]));
  const m1 = (p2[1] - p0[1]) / 2, m2 = (p3[1] - p1[1]) / 2, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
}
function bz(p0, p1, p2, p3, n = 16) {
  const o = []; for (let i = 0; i <= n; i++) { const t = i / n, a = 1 - t; o.push([0, 1].map(k => a * a * a * p0[k] + 3 * a * a * t * p1[k] + 3 * a * t * t * p2[k] + t * t * t * p3[k])); } return o;
}
// 瓶身着色器：每个像素按所在高度的半径算出圆柱角度 asin(x/r)，到展开贴图上取色，再按法线加明暗、釉面高光和边缘反光
const VASE_FS = `
uniform sampler2D TEX; uniform float ROT; uniform float P[22];
float prof(float v){
  int i = 0; for (int k = 0; k < 9; k++) if (P[2 * (k + 1)] < v) i = k + 1;
  int i0 = max(i - 1, 0), i3 = min(i + 2, 10);
  float x1 = P[2 * i], y1 = P[2 * i + 1], x2 = P[2 * i + 2], y2 = P[2 * i + 3], y0 = P[2 * i0 + 1], y3 = P[2 * i3 + 1];
  float t = clamp((v - x1) / (x2 - x1), 0., 1.), m1 = (y2 - y0) / 2., m2 = (y3 - y1) / 2., t2 = t * t, t3 = t2 * t;
  return (2. * t3 - 3. * t2 + 1.) * y1 + (t3 - 2. * t2 + t) * m1 + (-2. * t3 + 3. * t2) * y2 + (t3 - t2) * m2;
}
void main(){
  vec2 q = vec2(gl_FragCoord.x, R.y - gl_FragCoord.y);
  float v = q.y / R.y, r = prof(v) * R.y, x = q.x - R.x * .5;
  float a = clamp(r - abs(x) + .5, 0., 1.) * smoothstep(0., 1.5, q.y) * smoothstep(0., 1.5, R.y - q.y);
  if (a <= 0.) { O = vec4(0); return; }
  float s = clamp(x / r, -.999, .999), phi = asin(s);
  vec3 c = texture(TEX, vec2(fract(phi / 6.2831853 + ROT), v)).rgb;
  float dr = (prof(v + .004) - prof(v - .004)) / .008;
  vec3 n = normalize(vec3(s, -dr * sqrt(1. - s * s) * 1.2, sqrt(1. - s * s)));
  vec3 L = normalize(vec3(-.55 + .35 * sin((ROT - .5) * 6.2831853), -.45, .75));
  float dif = .5 + .55 * max(dot(n, L), 0.);
  float spec = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 60.) * .9 + pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 8.) * .12;
  float rim = pow(1. - n.z, 3.);
  vec3 col = c * dif * mix(.75, 1., n.z) + spec + rim * vec3(.25, .3, .4);
  O = vec4(col * a, a);
}`;
const BLUE = 'rgba(28,52,140,.92)', WASH = 'rgba(52,92,185,.36)';
scene({
  id: 'C-182', name: '青花', dur: 4.4, still: 2.75,
  fonts: ["700 40px 'Noto Serif SC'", "400 20px 'JetBrains Mono'"],
  text: '青花缠枝莲纹梅瓶鱼藻原创纹样',
  init() {
    const Hv = Math.round(LAND ? H * .82 : H * .56), TH = Hv, R = mulberry32(12);
    const tex = mk(TW, TH);
    const y = v => v * TH;
    // 纹样：每个 {x 中心, t0 开始画的时刻, kind}；正面（x 在 512–1536）按离中心的距离先后描出，背面一开始就画好
    const M = [];
    const when = (x, base, spread) => (x > 470 && x < 1580) ? base + Math.abs(x - 1024) / 512 * spread : -9;
    for (let x = 0; x < TW; x += 128) M.push({ k: 'grass', x, t0: when(x, .35, .4) });
    for (let x = 128; x < TW; x += 256) M.push({ k: 'ruyi', x, t0: when(x, .55, .5) });
    for (let x = 64; x < TW; x += 128) M.push({ k: 'panel', x, t0: when(x, .9, .5) });
    for (const x of [768, 1280]) M.push({ k: 'lotus', x, t0: 1.25 + Math.abs(x - 1024) / 2000 });
    for (const x of [1790, 2048, 256]) M.push({ k: 'fish', x, t0: -9 });
    // 铁锈斑：沿主要笔画随机撒的深色小点（固定）
    const spots = Array.from({ length: 900 }, () => [R() * TW, R() * TH, .8 + 2.4 * R(), R()]);
    const bw = Math.round(Hv * .9); glInit(bw, Hv); glProgram('vase', VASE_FS);
    return { Hv, TH, tex, dec: mk(TW, TH), y, M, spots, bw };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, { Hv, TH, tex, y } = s, g = s.dec.getContext('2d');
    // ---- 1. 重画贴图 ----
    g.clearRect(0, 0, TW, TH);                                    // 青料画在透明层上，最后再叠到白釉上
    g.lineCap = 'round'; g.lineJoin = 'round';
    const line = (pts, q, w = 3) => { if (q <= 0) return; g.strokeStyle = BLUE; g.lineWidth = w; drawPartial(g, pts, q); g.stroke(); };
    // 分隔的双线：背面一直在，正面从中间往两边画开
    const bandQ = inv(.25, .9, t);
    for (const v of [.045, .125, .14, .31, .325, .77, .785, .955]) {
      const yy = y(v);
      line([[0, yy], [470, yy]], 1, 2.4); line([[1580, yy], [TW, yy]], 1, 2.4);
      if (bandQ > 0) { line([[1024, yy], [470, yy]], bandQ, 2.4); line([[1024, yy], [1580, yy]], bandQ, 2.4); }
    }
    for (const m of s.M) for (const x of [m.x, m.x - TW, m.x + TW]) {     // 贴图首尾相接：靠边的纹样两头各画一次
      if (x < -350 || x > TW + 350) continue;
      const q = m.t0 < 0 ? 1 : inv(m.t0, m.t0 + .7, t), wq = m.t0 < 0 ? 1 : inv(m.t0 + .4, m.t0 + 1.2, t);
      if (q <= 0) continue;
      if (m.k === 'grass') {                                       // 颈部卷草：一段波浪加一个卷
        const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16; pts.push([x - 64 + a * 128, y(.085) + Math.sin(a * TAU) * y(.022)]); }
        line(pts, q, 2.6);
        const c = []; for (let i = 0; i < 18; i++) { const a = i * .45, r = 3 + i * .9; c.push([x - 32 + Math.cos(a) * r, y(.085) - y(.01) + Math.sin(a) * r]); }
        line(c, q, 2);
      } else if (m.k === 'ruyi') {                                 // 肩部如意云头：下垂的三瓣云头，外双线、内晕染
        const y0 = y(.14), h = y(.16), pts = [].concat(
          bz([x - 118, y0], [x - 118, y0 + h * .6], [x - 70, y0 + h * .55], [x - 52, y0 + h * .72]),
          bz([x - 52, y0 + h * .72], [x - 70, y0 + h * 1.05], [x - 8, y0 + h * 1.1], [x, y0 + h * .9]).slice(1),
          bz([x, y0 + h * .9], [x + 8, y0 + h * 1.1], [x + 70, y0 + h * 1.05], [x + 52, y0 + h * .72]).slice(1),
          bz([x + 52, y0 + h * .72], [x + 70, y0 + h * .55], [x + 118, y0 + h * .6], [x + 118, y0]).slice(1));
        if (wq > 0) { g.fillStyle = WASH.replace('.36', (.36 * wq).toFixed(2)); g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.fill(); }
        line(pts, q, 3);
        line(pts.map(([a, b]) => [x + (a - x) * .78, y0 + (b - y0) * .8]), q, 1.8);
        g.fillStyle = BLUE; if (q >= 1) { g.beginPath(); g.arc(x, y0 + h * .45, 9, 0, TAU); g.fill(); }
      } else if (m.k === 'panel') {                                // 底部莲瓣
        const y0 = y(.945), y1 = y(.8), pts = [].concat(bz([x - 50, y0], [x - 52, y1 + 30], [x - 20, y1], [x, y1 + 4]), bz([x, y1 + 4], [x + 20, y1], [x + 52, y1 + 30], [x + 50, y0]).slice(1));
        if (wq > 0) { g.fillStyle = `rgba(52,92,185,${.28 * wq})`; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.fill(); }
        line(pts, q, 2.6); line([[x, y0 - 6], [x, y1 + 40]], q, 1.6);
      } else if (m.k === 'lotus') {                                // 腹部缠枝莲：主藤是正弦波，花在波峰波谷
        const yc = y(.56), A = y(.12), K = 1.7;
        const vine = []; for (let i = 0; i <= 40; i++) { const a = i / 40; vine.push([x - 256 + a * 512, yc + Math.sin((a - .5) * TAU + (x === 768 ? 0 : Math.PI)) * A * .9]); }
        line(vine, q, 3.4);
        const fy = yc + (x === 768 ? 0 : 0);
        const pe = smooth(m.t0 + .3, m.t0 + 1.1, t);
        if (pe > 0) {
          for (const [a, L0, w0] of [[0, 95, 34], [-.6, 85, 30], [.6, 85, 30], [-1.2, 70, 26], [1.2, 70, 26]]) {
            const L = L0 * K, w = w0 * K, ox = x, oy = fy + 20 * K, pts = [].concat(bz([0, 0], [w, -L * .3], [w * .7, -L * .85], [0, -L]), bz([0, -L], [-w * .7, -L * .85], [-w, -L * .3], [0, 0]).slice(1))
              .map(([px, py]) => [ox + px * Math.cos(a) - py * Math.sin(a), oy + px * Math.sin(a) + py * Math.cos(a)]);
            if (wq > 0) { g.fillStyle = `rgba(52,92,185,${.4 * wq})`; g.beginPath(); pts.forEach(([a2, b], i) => i ? g.lineTo(a2, b) : g.moveTo(a2, b)); g.fill(); }
            line(pts, pe, 3);
          }
          g.fillStyle = `rgba(20,40,110,${.9 * pe})`; g.beginPath(); g.ellipse(x, fy + 26 * K, 30 * K, 16 * K, 0, 0, TAU); g.fill();
          for (const s2 of [-1, 1]) {                             // 叶子和卷须
            const lx = x + s2 * 170, ly = yc + Math.sin((s2 * .29) * TAU + (x === 768 ? 0 : Math.PI)) * A * .9;
            const lf = [].concat(bz([lx, ly], [lx - s2 * 30, ly - 75], [lx - s2 * 60, ly - 80], [lx - s2 * 50, ly - 130]), bz([lx - s2 * 50, ly - 130], [lx + s2 * 10, ly - 60], [lx + s2 * 15, ly - 20], [lx, ly]).slice(1));
            if (wq > 0) { g.fillStyle = `rgba(40,78,170,${.45 * wq})`; g.beginPath(); lf.forEach(([a2, b], i) => i ? g.lineTo(a2, b) : g.moveTo(a2, b)); g.fill(); }
            line(lf, pe, 2.6);
            const c = []; for (let i = 0; i < 22; i++) { const a = i * .4, r = 6 + i * 1.8; c.push([lx - s2 * 60 + Math.cos(a) * r * s2, ly + 70 + Math.sin(a) * r]); }
            line(c, pe, 2);
          }
        }
      } else if (m.k === 'fish') {                                 // 背面：鱼藻
        for (const [dx, dy, sc, dir] of [[0, -.05, 1, 1], [60, .1, .8, -1]]) {
          const fx = x + dx, fy = y(.55 + dy), body = [];
          for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; body.push([fx + Math.cos(a) * 70 * sc * dir, fy + Math.sin(a) * 26 * sc]); }
          g.fillStyle = 'rgba(52,92,185,.4)'; g.beginPath(); body.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.fill();
          line(body, 1, 3);
          line([[fx - 66 * sc * dir, fy], [fx - 110 * sc * dir, fy - 28 * sc], [fx - 104 * sc * dir, fy + 26 * sc], [fx - 66 * sc * dir, fy]], 1, 3);
          g.fillStyle = BLUE; g.beginPath(); g.arc(fx + 44 * sc * dir, fy - 6 * sc, 5, 0, TAU); g.fill();
          for (let k = -2; k <= 2; k++) line([[fx + k * 18 * sc, fy - 22 * sc], [fx + k * 18 * sc + 10 * dir, fy], [fx + k * 18 * sc, fy + 22 * sc]], 1, 1.4);
        }
        for (let k = -3; k <= 3; k++) { const wx = x + k * 38 + 20, pts = []; for (let i = 0; i <= 12; i++) pts.push([wx + Math.sin(i * .9 + k) * 10, y(.74) - i * y(.016)]); line(pts, 1, 2.2); }
      }
    }
    // 铁锈斑：只落在画了青料的地方
    g.globalCompositeOperation = 'source-atop';
    for (const [sx, sy, r, a] of s.spots) { g.fillStyle = `rgba(14,20,40,${.35 + .5 * a})`; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    const tg = tex.getContext('2d'); tg.fillStyle = '#f4f6f1'; tg.fillRect(0, 0, TW, TH); tg.drawImage(s.dec, 0, 0);
    // ---- 2. 画面：深色展台、瓶身贴图 ----
    const bg = ctx.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .5, LONG * .75);
    bg.addColorStop(0, '#2a3242'); bg.addColorStop(1, '#0c0f16');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const cx = LAND ? W * .56 : W / 2, top = LAND ? (H - Hv) / 2 - 10 * u : H * .14;
    // 台面上的影子
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(cx + 20 * u, top + Hv, Hv * .32, Hv * .045, 0, 0, TAU); ctx.fill();
    const rot = t < 2.9 ? .5 + .025 * Math.sin(t * .9) : .5 + .025 * Math.sin(2.9 * .9) + .5 * eInOutCubic(inv(2.9, 3.9, t));
    glDraw(ctx, 'vase', t, s.bw, Hv, cx - s.bw / 2, top, s.bw, Hv, { TEX: tex, ROT: rot, P: PROF.flat() });
    // 展签
    const a = smooth(.6, 1.2, t);
    ctx.textAlign = LAND ? 'left' : 'center'; const lx = LAND ? W * .08 : W / 2, ly = LAND ? H * .72 : H * .82;
    ctx.fillStyle = `rgba(230,225,210,${.9 * a})`; ctx.font = `700 ${Math.round(40 * u)}px 'Noto Serif SC'`;
    ctx.fillText(t < 3.3 ? '青花缠枝莲纹梅瓶' : '背面 · 鱼藻纹', lx, ly);
    ctx.fillStyle = `rgba(200,195,180,${.6 * a})`; ctx.font = `400 ${Math.round(16 * u)}px 'JetBrains Mono'`;
    ctx.fillText('BLUE AND WHITE · ORIGINAL PATTERN', lx, ly + 36 * u);
  }
});
