// C-003 钢笔淡彩：Rough.js 在 Canvas 2D 上画速写线（手抖、出头、不闭合，seed 固定所以每帧一样），淡彩先于线条铺上、故意偏离轮廓并溢出到纸外，街景从左到右一栋栋画出来，最后点上人影和落款。
// 风格提示词：用钢笔淡彩城市速写风格：奶油色冷压纸，棕褐色针管笔线条轻微抖动、出头、不闭合，透明淡彩随手点上、略微偏离线条并溢出，颜色在纸边溶成空白，整个画面像速写本上的一页。
// 题材：手绘与绘画 · 适合：城市、公园、日常
scene({
  id: 'C-003', name: '钢笔淡彩', dur: 5, still: 4.3, libs: ['rough'],
  text: '老街写生十月',
  fonts: ["400 56px 'Ma Shan Zheng'"],
  init() {
    const u = SHORT / 1080;
    const paper = makePaper('#F3EBD8', { seed: 3, grain: 16, fiber: .7, blot: 10 });
    const INK = '#6B4A2F';
    // 街景：一排房子（横屏铺满，竖屏两层）
    const R = mulberry32(7);
    const base = LAND ? H * .78 : H * .62;
    const houses = [];
    const n = LAND ? 6 : 5, x0 = LAND ? W * .06 : W * .05, span = (LAND ? W * .88 : W * .9) / n;
    for (let i = 0; i < n; i++) {
      const w = span * (.82 + R() * .3), h = (LAND ? 300 : 330) * u * (.7 + R() * .75);
      houses.push({ x: x0 + i * span, y: base - h, w, h, roof: R() < .5 ? 'pitch' : 'flat',
        win: 2 + Math.floor(R() * 3), col: ['#C8766B', '#88A7B8', '#D4B483', '#9BAE8C', '#C59A6D'][i % 5], t0: .25 + i * .42 });
    }
    return { paper, u, INK, houses, base };
  },
  draw(ctx, t, s) {
    const { u, INK, houses, base } = s;
    ctx.drawImage(s.paper, 0, 0, W, H);
    const rc = rough.canvas(ctx.canvas);
    const pen = (seed, o = {}) => ({ stroke: INK, strokeWidth: 2.4 * u, roughness: 1.6, bowing: 1.4, seed, ...o });
    // ---- 淡彩：先上色，略微偏离线条 ----
    ctx.save();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'multiply';
    houses.forEach((h, i) => {
      const w0 = smooth(h.t0 + .34, h.t0 + .95, t);                  // 色块在线条之后一点点铺上
      if (w0 <= 0) return;
      wash(ctx, h.x + 14 * u, h.y + 20 * u, h.w * .95, h.h * .96, h.col, .3 * w0, i * 7 + 1, u);
      if (h.roof === 'pitch') wash(ctx, h.x - 6 * u, h.y - 54 * u, h.w + 12 * u, 70 * u, '#8A5A4A', .32 * w0, i * 7 + 4, u);
    });
    const sky = smooth(.05, .9, t);
    if (sky > 0) wash(ctx, -60 * u, (LAND ? 30 : 130) * u, W + 120 * u, (LAND ? 330 : 470) * u, '#9FC2D6', .2 * sky, 31, u);   // 天空一抹
    const road = smooth(2.6, 3.4, t);
    if (road > 0) wash(ctx, -40 * u, base + 10 * u, W + 80 * u, (LAND ? 200 : 380) * u, '#B6A68C', .2 * road, 44, u);
    ctx.restore();
    // ---- 钢笔线：Rough.js，按时间一栋栋画出来 ----
    houses.forEach((h, i) => {
      const p = eOutCubic(inv(h.t0, h.t0 + .5, t));
      if (p <= 0) return;
      const sd = 100 + i * 13;
      clipReveal(ctx, h.x - 30 * u, h.y - 80 * u, (h.w + 60 * u) * p, h.h + 120 * u, () => {
        // 故意不闭合：三条边 + 出头的竖线
        rc.line(h.x, h.y, h.x, base + 12 * u, pen(sd));
        rc.line(h.x + h.w, h.y + 6 * u, h.x + h.w, base + 8 * u, pen(sd + 1));
        rc.line(h.x - 8 * u, h.y, h.x + h.w + 10 * u, h.y - 4 * u, pen(sd + 2));
        if (h.roof === 'pitch') {
          rc.line(h.x - 14 * u, h.y, h.x + h.w / 2, h.y - 70 * u, pen(sd + 3));
          rc.line(h.x + h.w / 2, h.y - 70 * u, h.x + h.w + 16 * u, h.y + 2 * u, pen(sd + 4));
        } else {
          rc.rectangle(h.x + 6 * u, h.y - 26 * u, h.w - 12 * u, 26 * u, pen(sd + 3, { roughness: 2 }));
        }
        for (let k = 0; k < h.win; k++) {                            // 窗
          const ww = h.w / (h.win + 1), wx = h.x + ww * (k + .5) + 10 * u, wy = h.y + h.h * .3;
          rc.rectangle(wx, wy, ww * .62, h.h * .26, pen(sd + 10 + k, { roughness: 2.1 }));
          if ((i + k) % 3 === 0) rc.line(wx, wy + h.h * .13, wx + ww * .62, wy + h.h * .13, pen(sd + 20 + k));
        }
        const dw = h.w * .22, dx = h.x + h.w * .62;                  // 门
        rc.line(dx, base, dx, base - h.h * .32, pen(sd + 30));
        rc.line(dx, base - h.h * .32, dx + dw, base - h.h * .34, pen(sd + 31));
        rc.line(dx + dw, base - h.h * .33, dx + dw, base + 4 * u, pen(sd + 32));
      });
    });
    // 地面线、路缘
    const g = eOutCubic(inv(2.5, 3.3, t));
    if (g > 0) clipReveal(ctx, 0, base - 10 * u, W * g, H, () => {
      rc.line(-20 * u, base + 6 * u, W + 20 * u, base + 14 * u, pen(301, { strokeWidth: 3 * u }));
      rc.line(-20 * u, base + (LAND ? 120 : 210) * u, W + 20 * u, base + (LAND ? 108 : 200) * u, pen(302, { roughness: 2.2, strokeWidth: 1.8 * u }));
    });
    // 人影、路灯：几笔
    const pp = eOutCubic(inv(3.3, 4.0, t));
    if (pp > 0) {
      ctx.save(); ctx.globalAlpha = pp;
      const fig = (x, sc, sd, col) => {                            // 速写人影：头小、身子是一块深色
        const y = base + 16 * u, hh = 150 * u * sc;                 // hh：身高
        rc.circle(x, y - hh, hh * .15, pen(sd, { fill: '#4E3A2A', fillStyle: 'solid', fillWeight: 2 * u, strokeWidth: 1.8 * u }));
        rc.polygon([[x - hh * .11, y - hh * .9], [x + hh * .11, y - hh * .9], [x + hh * .14, y - hh * .42], [x - hh * .14, y - hh * .42]],
          pen(sd + 1, { fill: col, fillStyle: 'hachure', fillWeight: 2.2 * u, hachureGap: 7 * u, hachureAngle: 70, strokeWidth: 2 * u }));
        rc.line(x - hh * .06, y - hh * .44, x - hh * .09, y, pen(sd + 2, { strokeWidth: 3.2 * u }));
        rc.line(x + hh * .06, y - hh * .44, x + hh * .11, y - hh * .02, pen(sd + 3, { strokeWidth: 3.2 * u }));
        ctx.save(); ctx.globalAlpha = pp * .25; ctx.fillStyle = '#6B5A42';
        ctx.beginPath(); ctx.ellipse(x + hh * .05, y + 6 * u, hh * .22, hh * .035, 0, 0, TAU); ctx.fill(); ctx.restore();
      };
      fig(W * (LAND ? .30 : .26), 1.45, 400, '#6E4B52'); fig(W * (LAND ? .385 : .42), 1.2, 420, '#4C5C6B');
      const lx = W * (LAND ? .955 : .955);
      rc.line(lx, base + 10 * u, lx, base - 340 * u, pen(440, { strokeWidth: 3.4 * u }));
      rc.circle(lx, base - 362 * u, 46 * u, pen(441, { fill: '#E3B24C', fillStyle: 'zigzag', fillWeight: 1.6 * u, hachureGap: 7 * u }));
      ctx.restore();
    }
    // 落款：手写字 + 印章方框
    const sg = smooth(4.1, 4.6, t);
    if (sg > 0) {
      ctx.save(); ctx.globalAlpha = sg;
      ctx.fillStyle = INK; ctx.textAlign = 'left';
      ctx.font = `400 ${Math.round(52 * u)}px 'Ma Shan Zheng'`;
      const sx = LAND ? W * .07 : W * .08, sy = LAND ? H * .14 : H * .12;
      ctx.fillText('老街写生 · 十月', sx, sy);
      rc.rectangle(sx, sy + 20 * u, 56 * u, 56 * u, { stroke: '#B4342C', strokeWidth: 3 * u, roughness: 1.2, seed: 501, fill: '#C0392B', fillStyle: 'cross-hatch', fillWeight: 2 * u, hachureGap: 10 * u });
      ctx.restore();
    }
    grain(ctx, Math.floor(t * 10), .16);
  }
});

// 只画出某个矩形区域（从左往右显出）
function clipReveal(ctx, x, y, w, h, fn) {
  if (w <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); fn(); ctx.restore();
}

// 一块透明淡彩：边缘不规则、往外溢出，颜料在纸上不匀，边上留一圈深边
function wash(ctx, x, y, w, h, col, a, seed, u) {
  const R = mulberry32(seed * 977 + 11);
  ctx.save();
  ctx.beginPath();
  const n = 40;
  for (let k = 0; k <= n; k++) {                                   // 歪斜的边界：沿周长走一圈，加噪声
    const p = k / n, s2 = p * 4;
    let px, py;
    if (s2 < 1) { px = x + w * s2; py = y; }
    else if (s2 < 2) { px = x + w; py = y + h * (s2 - 1); }
    else if (s2 < 3) { px = x + w * (3 - s2); py = y + h; }
    else { px = x; py = y + h * (4 - s2); }
    const off = (fbm(p * 9 + seed, seed * .7, 4) - .5) * (28 * u + Math.min(w, h) * .14);
    k ? ctx.lineTo(px + off, py + off * .8) : ctx.moveTo(px + off, py + off * .8);
  }
  ctx.closePath(); ctx.clip();
  ctx.globalAlpha = a;
  ctx.fillStyle = col; ctx.fillRect(x - 60 * u, y - 60 * u, w + 120 * u, h + 120 * u);
  // 颜料不匀：斜着扫几笔，边缘羽化，不留横条
  const d = Math.max(w, h);
  for (let k = 0; k < 7; k++) {
    const cx = x + w * (.1 + R() * .85), cy = y + h * (.1 + R() * .85), r = d * (.18 + R() * .34);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a * (.18 + R() * .28);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * (.6 + R() * .7), R() * TAU, 0, TAU); ctx.fill();
  }
  // 干掉后边上的一圈深边
  ctx.globalAlpha = a * .5; ctx.strokeStyle = col; ctx.lineWidth = 10 * u; ctx.filter = `blur(${5 * u}px)`;
  ctx.beginPath(); ctx.rect(x + 4 * u, y + 4 * u, w - 8 * u, h - 8 * u); ctx.stroke();
  ctx.restore();
}
