// C-005 蜡笔绘本：靛蓝描边按顺序画出、每 1/8 秒抖一次，彩色排线是一条条在形状里来回折返、两端故意越出轮廓的折线，整层再用纸齿遮罩只留下纸纹凸起处的颜色；白蜡笔画的星星、月亮和字一开始几乎看不见，一层透明的靛蓝水彩从左往右刷过去，蜡的位置被挖空，藏着的东西才露出来。
// 风格提示词：用儿童蜡笔绘本风格：米白色粗纹纸，蜡笔只附着在纸纹凸起处、露出细小白点，靛蓝色抖动描边，排线会越出轮廓，全片只用一次透明水彩晕染来揭示蜡笔藏起来的东西，睡前故事般的温柔节奏。
// 题材：手绘与绘画 · 适合：儿童故事
function hatchPoly(poly, ang, gap, over, seed) {
  // 在多边形里按角度来回折返的排线，每段两端随机越出轮廓
  const R = mulberry32(seed), c = Math.cos(ang), s = Math.sin(ang);
  const q = poly.map(([x, y]) => [x * c + y * s, -x * s + y * c]);
  const ys = q.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys), out = [];
  let k = 0;
  for (let y = y0 + gap * .5; y < y1; y += gap * (.8 + R() * .4), k++) {
    const xs = [];
    for (let i = 0; i < q.length; i++) {
      const [ax, ay] = q[i], [bx, by] = q[(i + 1) % q.length];
      if ((ay <= y) !== (by <= y)) xs.push(ax + (y - ay) / (by - ay) * (bx - ax));
    }
    if (xs.length < 2) continue; xs.sort((a, b) => a - b);
    let a = xs[0] - over * R(), b = xs[xs.length - 1] + over * R();
    const seg = k % 2 ? [[b, y], [a, y + gap * .3]] : [[a, y], [b, y + gap * .3]];
    out.push(...seg);
  }
  return out.map(([x, y]) => [x * c - y * s, x * s + y * c]);
}
const ell = (cx, cy, rx, ry, n = 40, a0 = 0, a1 = TAU) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
scene({
  id: 'C-005', name: '蜡笔绘本', dur: 5, still: 4.3,
  fonts: ["150px 'Ma Shan Zheng'"],
  init() {
    const u = SHORT / 1080, gy = LAND ? H * .68 : H * .64;
    const hill = []; for (let x = -40; x <= W + 40; x += 30) hill.push([x, gy - 70 * u * Math.sin(Math.PI * clamp(x / W)) + 14 * u * Math.sin(x * .02)]);
    const hillPoly = [...hill, [W + 40, H + 40], [-40, H + 40]];
    const hx = LAND ? W * .2 : W * .2, hy = gy - 40 * u, hw = 170 * u, hh = 130 * u;
    const wall = [[hx - hw / 2, hy], [hx + hw / 2, hy], [hx + hw / 2, hy - hh], [hx - hw / 2, hy - hh]];
    const roof = [[hx - hw * .65, hy - hh], [hx, hy - hh - 110 * u], [hx + hw * .65, hy - hh]];
    const win = [[hx - 30 * u, hy - 50 * u], [hx + 30 * u, hy - 50 * u], [hx + 30 * u, hy - 100 * u], [hx - 30 * u, hy - 100 * u]];
    const tx = LAND ? W * .82 : W * .8, ty = gy - 50 * u;
    const trunk = [[tx - 18 * u, ty], [tx + 18 * u, ty], [tx + 12 * u, ty - 150 * u], [tx - 12 * u, ty - 150 * u]];
    const crown = ell(tx, ty - 230 * u, 120 * u, 115 * u, 48).map(([x, y], i) => [x + 12 * u * Math.sin(i * 1.7), y + 12 * u * Math.cos(i * 2.3)]);
    const fx = W * .52, fy = gy + (LAND ? 170 : 280) * u, fs = LAND ? 1 : 1.25;
    const body = ell(fx, fy, 150 * u * fs, 75 * u * fs, 40);
    const tail = [...ell(fx + 40 * u * fs, fy + 20 * u * fs, 170 * u * fs, 75 * u * fs, 24, -.2, Math.PI * .95), ...ell(fx - 20 * u * fs, fy + 50 * u * fs, 90 * u * fs, 30 * u * fs, 16, Math.PI * .95, -.1)];
    const hx2 = fx - 130 * u * fs, hy2 = fy - 25 * u * fs;
    const head = [[hx2 - 95 * u * fs, hy2 + 20 * u * fs], [hx2 - 20 * u * fs, hy2 - 50 * u * fs], [hx2 - 5 * u * fs, hy2 - 105 * u * fs], [hx2 + 30 * u * fs, hy2 - 55 * u * fs], [hx2 + 65 * u * fs, hy2 - 95 * u * fs], [hx2 + 70 * u * fs, hy2 - 20 * u * fs], [hx2 + 40 * u * fs, hy2 + 40 * u * fs], [hx2 - 40 * u * fs, hy2 + 45 * u * fs]];
    const eyes = [ell(hx2 - 5 * u * fs, hy2 - 5 * u * fs, 14 * u * fs, 8 * u * fs, 10, .2, Math.PI - .2), ell(hx2 + 35 * u * fs, hy2 - 8 * u * fs, 12 * u * fs, 7 * u * fs, 10, .2, Math.PI - .2)];
    // 描边（靛蓝）和排线（彩色）的出场顺序
    const lines = [[hill, 0], [roof, .2, 1], [wall, .35, 1], [win, .5, 1], [trunk, .6, 1], [crown, .7, 1], [body, .9, 1], [tail, 1.05], [head, 1.15, 1], ...eyes.map(e => [e, 1.35])];
    const fills = [[hillPoly, '#6FA64A', .35, .5, 14], [roof, '#D2463A', .9, .6, 11], [wall, '#EBA33C', 1, -.4, 11], [win, '#F6D35B', 1.3, .2, 8], [trunk, '#7A4B2A', 1.2, 1.2, 8], [crown, '#3F8C4E', 1.3, .8, 12],
      [tail, '#E37B2C', 1.6, -.6, 12], [body, '#E37B2C', 1.7, .7, 12], [head, '#E8862F', 1.85, -.3, 11]].map(([p, c, d, a, g], i) => ({ pts: hatchPoly(p, a, g * u, 26 * u, 40 + i), c, d, w: (g + 2) * .62 * u }));
    // 白蜡笔：月亮、星星、字（在米白纸上几乎看不见，水彩刷过才显出来）
    const wax = mk(W, H), wg = wax.getContext('2d'), R = mulberry32(9);
    wg.strokeStyle = wg.fillStyle = '#fff'; wg.lineCap = wg.lineJoin = 'round';
    const mx = LAND ? W * .68 : W * .7, my = LAND ? H * .2 : H * .17, mr = 75 * u;
    wg.beginPath(); wg.arc(mx, my, mr, 0, TAU); wg.arc(mx + mr * .6, my - mr * .3, mr * .82, 0, TAU, true); wg.fill('evenodd');
    for (let i = 0, n = 0; n < 34 && i < 400; i++) {
      const x = R() * W, y = R() * (gy - 140 * u);
      if (Math.hypot(x - mx, y - my) < mr * 1.6 || (x > W * .12 && x < W * .5 && y > H * (LAND ? .1 : .14) && y < H * (LAND ? .34 : .26)) || (Math.abs(x - tx) < 150 * u && y > ty - 360 * u) || (Math.abs(x - hx) < 140 * u && y > hy - 260 * u)) continue;
      const r = (8 + R() * 14) * u, a0 = R() * TAU; wg.lineWidth = 5 * u; wg.beginPath();
      for (let k = 0; k <= 5; k++) { const a = a0 + k * TAU * 2 / 5; wg.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } wg.stroke(); n++;
    }
    wg.font = `${Math.round(170 * u)}px 'Ma Shan Zheng'`; wg.textBaseline = 'middle'; wg.fillText('晚安', LAND ? W * .14 : W * .14, H * (LAND ? .22 : .2));
    wg.globalCompositeOperation = 'destination-in'; wg.drawImage(toothMask(W, H, { cut: .38, scale: 2.2, seed: 5 }), 0, 0);
    // 水彩：一层靛蓝，蜡的位置挖空
    const wash = mk(W, H), sg = wash.getContext('2d'), R2 = mulberry32(3);
    for (let l = 0; l < 30; l++) {
      sg.globalAlpha = .042; sg.fillStyle = l % 3 ? '#2C3E92' : '#40306E'; sg.beginPath();
      for (let x = -60; x <= W + 60; x += 40) sg.lineTo(x, gy + 30 * u - 70 * u * Math.sin(Math.PI * clamp(x / W)) + (R2() - .5) * 60 * u);
      sg.lineTo(W + 60, -60); sg.lineTo(-60, -60); sg.fill();
    }
    sg.globalAlpha = 1; for (let i = 0; i < 2500; i++) { sg.fillStyle = 'rgba(20,30,90,.25)'; sg.fillRect(R2() * W, R2() * gy, 2 * u, 2 * u); }
    sg.globalCompositeOperation = 'destination-out'; sg.drawImage(wax, 0, 0); sg.drawImage(wax, 0, 0);
    return { lines, fills, wax, wash, tooth: toothMask(W, H, { cut: .4, scale: 2.4, seed: 2 }), paper: makePaper('#F3EBDB', { seed: 21, grain: 30, fiber: .8, blot: 10 }), lay: mk(W, H), gy };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, z = 1 + .04 * smooth(0, 5, t), bt = stepT(t, 8);
    ctx.drawImage(s.paper, 0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    // 白蜡笔：纸上只有一点点亮光
    ctx.globalAlpha = .35 * smooth(.2, .8, t); ctx.drawImage(s.wax, 0, 0); ctx.globalAlpha = 1;
    // 水彩从左往右刷过，前沿有一道湿边
    const fr = lerp(-200 * u, W + 300 * u, eInOutCubic(inv(2.5, 4.1, t)));
    if (fr > -200 * u) {
      const edge = y => fr - 120 * u * Math.sin(y / H * 3 + 1) - 40 * u * noise1(y * .01);
      ctx.save(); ctx.beginPath(); ctx.moveTo(-10, -10); for (let y = -10; y <= H; y += 20) ctx.lineTo(edge(y), y); ctx.lineTo(-10, H); ctx.clip();
      ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(s.wash, 0, 0);
      ctx.restore();
      if (fr < W + 250 * u) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.strokeStyle = 'rgba(40,50,130,.25)'; ctx.lineWidth = 7 * u; ctx.beginPath(); for (let y = 0; y <= s.gy; y += 20) ctx.lineTo(edge(y), y); ctx.stroke(); ctx.restore(); }
    }
    // 蜡笔层：排线 + 抖动描边，整层只留纸纹凸起
    const g = s.lay.getContext('2d'); g.clearRect(0, 0, W, H); g.lineCap = g.lineJoin = 'round';
    for (const F of s.fills) { const p = eInOutCubic(inv(F.d, F.d + .7, t)); if (p <= 0) continue; g.strokeStyle = F.c; g.lineWidth = F.w; drawPartial(g, F.pts, p); }
    g.strokeStyle = '#2E3A8C'; g.lineWidth = 6 * u;
    s.lines.forEach(([pts, d, cl], i) => {
      const p = eOutCubic(inv(d, d + .55, t)); if (p <= 0) return;
      const j = pts.map(([x, y], k) => [x + (hash2(k, i * 31 + bt * 977) - .5) * 4 * u, y + (hash2(k + 50, i * 17 + bt * 613) - .5) * 4 * u]);
      drawPartial(g, cl ? [...j, j[0]] : j, p, false);
    });
    g.globalCompositeOperation = 'destination-in'; g.drawImage(s.tooth, 0, 0); g.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = .92; ctx.drawImage(s.lay, 0, 0); ctx.globalAlpha = 1;
    ctx.restore();
    vignette(ctx, .25, .5, '60,40,20');
  }
});