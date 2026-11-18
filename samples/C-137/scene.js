// C-137 新艺术运动：Canvas 2D 把每条线画成“外粗内细”的填充带（沿折线按弧长改变宽度、两侧偏移后连成多边形），人物侧脸、S 形长发、圆形光环都用这种带来勾；长发每一缕是随 t 平移相位的正弦曲线，四角的花藤用 drawPartial 生长并逐片长出叶子，开场一条金色鞭线绕画框长一圈、画面在里面由圆形遮罩展开。
// 风格提示词：用新艺术运动风格：画面被一圈鞭子般弯曲的有机线框住，线条外粗内细，主角身后衬一个圆形光环，长发和衣褶卷成 S 形波浪，配色是橄榄绿、芥末黄、蜜桃粉和金，边框上的花藤从四角长出来，转场是金边曲线生长并包住整个新画面。
// 题材：印刷、版画与装饰 · 适合：海报式开场、美妆与香氛、文学与诗歌
scene({
  id: 'C-137', name: '新艺术运动', dur: 4, still: 3.2,
  text: '花之季',
  fonts: ["900 40px 'Noto Serif SC'", "italic 400 40px 'Playfair Display'"],
  init() { return {}; },
  draw(ctx, t, s) {
    const u = SHORT / 1080, OL = '#3A3B20', GOLD = '#C9A13B', MUS = '#D6A73A', PEACH = '#F0C3A2', GRN = '#6E7444', GRN2 = '#8E9358', CRM = '#EFE2C4';
    // 外粗内细的带：w(q) 给出弧长位置 q 处的宽度
    const band = (pts, wf, col, p = 1) => {
      const R = resample(pts, 80), n = Math.max(1, Math.round(80 * p)), L = [], Rt = [];
      for (let i = 0; i <= n; i++) { const a = R[i], w = wf(i / 80) / 2; L.push([a.x + a.nx * w, a.y + a.ny * w]); Rt.push([a.x - a.nx * w, a.y - a.ny * w]); }
      ctx.fillStyle = col; ctx.beginPath(); [...L, ...Rt.reverse()].forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.fill();
    };
    const swell = (a, b) => q => (a + (b - a) * Math.sin(q * Math.PI)) * u;
    const bez = (p0, p1, p2, p3, n = 30) => { const o = []; for (let i = 0; i <= n; i++) { const q = i / n, m = 1 - q; o.push([m * m * m * p0[0] + 3 * m * m * q * p1[0] + 3 * m * q * q * p2[0] + q * q * q * p3[0], m * m * m * p0[1] + 3 * m * m * q * p1[1] + 3 * m * q * q * p2[1] + q * q * q * p3[1]]); } return o; };
    ctx.fillStyle = '#4E5230'; ctx.fillRect(0, 0, W, H);
    // 画框：圆角拱形，四角卷成涡
    const m = 44 * u, fx0 = m, fy0 = m, fx1 = W - m, fy1 = H - m, r = 120 * u;
    const frame = [...bez([fx0 + r, fy0], [W * .35, fy0 - 30 * u], [W * .65, fy0 - 30 * u], [fx1 - r, fy0]), ...bez([fx1 - r, fy0], [fx1, fy0], [fx1, fy0], [fx1, fy0 + r]).slice(1),
      ...bez([fx1, fy0 + r], [fx1 + 20 * u, H * .4], [fx1 + 20 * u, H * .6], [fx1, fy1 - r]).slice(1), ...bez([fx1, fy1 - r], [fx1, fy1], [fx1, fy1], [fx1 - r, fy1]).slice(1),
      ...bez([fx1 - r, fy1], [W * .6, fy1 + 20 * u], [W * .4, fy1 + 20 * u], [fx0 + r, fy1]).slice(1), ...bez([fx0 + r, fy1], [fx0, fy1], [fx0, fy1], [fx0, fy1 - r]).slice(1),
      ...bez([fx0, fy1 - r], [fx0 - 20 * u, H * .6], [fx0 - 20 * u, H * .4], [fx0, fy0 + r]).slice(1), ...bez([fx0, fy0 + r], [fx0, fy0], [fx0, fy0], [fx0 + r, fy0]).slice(1)];
    const gp = eInOutCubic(inv(0, 1.3, t)), open = eOutCubic(inv(.5, 1.6, t));
    // 画面：圆形遮罩展开
    ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, open * LONG * .75, 0, TAU); ctx.clip();
    ctx.fillStyle = GRN; ctx.beginPath(); frame.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.fill();
    const k = (LAND ? 1.25 : 1.45) * u, hx = LAND ? W * .38 : W * .5, hy = LAND ? H * .5 : H * .37, P = (x, y) => [hx + x * k / u, hy + y * k / u];
    // 光环：金环 + 放射短格，缓慢转
    const [ox, oy] = P(-20, -40), hr = 330 * k / u;
    ctx.fillStyle = MUS; ctx.beginPath(); ctx.arc(ox, oy, hr, 0, TAU); ctx.fill();
    ctx.fillStyle = '#E3BE5C'; ctx.beginPath(); ctx.arc(ox, oy, hr * .86, 0, TAU); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 3 * u; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU + t * .05; ctx.beginPath(); ctx.moveTo(ox + Math.cos(a) * hr * .87, oy + Math.sin(a) * hr * .87); ctx.lineTo(ox + Math.cos(a) * hr * .99, oy + Math.sin(a) * hr * .99); ctx.stroke(); }
    band(circlePts(ox, oy, hr, 90), q => (3 + 7 * Math.abs(Math.sin(q * TAU))) * u, OL);
    // 头发：后面一层，S 形长缕
    const hair = (i, front) => {
      const a0 = -2.2 + i * .14, sx = ox + Math.cos(a0) * 150 * k / u * .9, sy = oy - 60 * k / u + Math.sin(a0) * 150 * k / u * .7, pts = [];
      const len = (520 + (i % 4) * 90) * k / u, ph = t * 1.4 + i * .5;
      for (let j = 0; j <= 30; j++) { const q = j / 30; pts.push([sx - q * len * .5 - Math.sin(q * 7 + ph) * 80 * k / u * q, sy + q * len * .9 + Math.cos(q * 5 + ph) * 30 * k / u * q]); }
      band(pts, q => (24 * (1 - q) + 4) * k / u, front ? '#B9822E' : (i % 2 ? '#A06B24' : '#C28C34'));
      band(pts, q => 3 * k / u * (1 - q * .6), OL);
    };
    for (let i = 0; i < 14; i++) hair(i, false);
    // 脖子和侧脸（朝右）
    const face = new Path2D(); const F = (x, y) => P(x, y);
    face.moveTo(...F(-100, -170)); face.bezierCurveTo(...F(-30, -270), ...F(60, -220), ...F(68, -110)); face.lineTo(...F(78, -52)); face.lineTo(...F(118, 6)); face.lineTo(...F(86, 26));
    face.quadraticCurveTo(...F(102, 44), ...F(90, 56)); face.quadraticCurveTo(...F(102, 70), ...F(86, 84)); face.quadraticCurveTo(...F(94, 124), ...F(58, 142)); face.quadraticCurveTo(...F(20, 160), ...F(14, 168));
    face.lineTo(...F(36, 360)); face.lineTo(...F(-120, 360)); face.lineTo(...F(-110, 120)); face.closePath();
    ctx.fillStyle = PEACH; ctx.fill(face); ctx.strokeStyle = OL; ctx.lineWidth = 5 * u; ctx.stroke(face);
    ctx.fillStyle = 'rgba(214,120,100,.35)'; ctx.beginPath(); ctx.ellipse(...F(46, 30), 30 * k / u, 18 * k / u, 0, 0, TAU); ctx.fill();
    band(bez(F(10, -70), F(25, -84), F(48, -86), F(66, -72)), swell(2, 6), OL);   // 眉
    band(bez(F(18, -46), F(30, -36), F(46, -36), F(58, -46)), swell(2, 5), OL);   // 闭眼
    for (let i = 0; i < 4; i++) band([F(24 + i * 9, -40), F(20 + i * 10, -28)], () => 2 * u, OL);
    ctx.fillStyle = '#B5554A'; ctx.beginPath(); ctx.moveTo(...F(88, 52)); ctx.quadraticCurveTo(...F(80, 60), ...F(88, 66)); ctx.quadraticCurveTo(...F(96, 60), ...F(88, 52)); ctx.fill();
    // 衣领：S 形褶
    for (let i = 0; i < 5; i++) band(bez(F(-130 + i * 40, 300), F(-100 + i * 40, 330), F(-150 + i * 40, 360), F(-110 + i * 45, 420)), swell(3, 9), OL);
    ctx.fillStyle = GRN2; ctx.beginPath(); ctx.moveTo(...F(-200, 330)); ctx.bezierCurveTo(...F(-60, 280), ...F(20, 300), ...F(90, 340)); ctx.lineTo(...F(140, 520)); ctx.lineTo(...F(-260, 520)); ctx.fill();
    for (let i = 0; i < 6; i++) band(bez(F(-180 + i * 50, 340 - i * 3), F(-150 + i * 50, 390), F(-200 + i * 52, 440), F(-170 + i * 55, 520)), swell(2, 8), OL);
    // 后脑的发团：盖住头的后半边，边缘一缕缕卷
    ctx.fillStyle = '#B9822E'; ctx.beginPath(); ctx.moveTo(...F(-60, -235)); ctx.bezierCurveTo(...F(-230, -200), ...F(-250, 40), ...F(-170, 240)); ctx.bezierCurveTo(...F(-140, 300), ...F(-90, 280), ...F(-100, 200)); ctx.bezierCurveTo(...F(-60, 60), ...F(-40, -60), ...F(-20, -150)); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 4 * u; ctx.stroke();
    for (let i = 0; i < 5; i++) band(bez(F(-50 - i * 30, -220 + i * 10), F(-200 - i * 6, -120 + i * 20), F(-110 - i * 10, 60 + i * 20), F(-150 - i * 6, 220 + i * 6)), swell(2, 6), OL);
    // 前额的发和花
    for (let i = 0; i < 5; i++) hair(i + 1, true);
    band(bez(F(-110, -170), F(-40, -270), F(40, -250), F(64, -150)), swell(16, 40), '#C28C34');
    for (const [x, y, c] of [[-40, -210, '#E59A7E'], [10, -230, '#F2B48E'], [-90, -150, '#E59A7E']]) {
      const [px, py] = F(x, y), pr = 36 * k / u, b = 1 + .04 * Math.sin(t * 2 + x);
      for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + t * .2; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(px + Math.cos(a) * pr * .6 * b, py + Math.sin(a) * pr * .6 * b, pr * .6, pr * .38, a, 0, TAU); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 2.5 * u; ctx.stroke(); }
      ctx.fillStyle = MUS; ctx.beginPath(); ctx.arc(px, py, pr * .3, 0, TAU); ctx.fill(); ctx.stroke();
    }
    // 标题：横屏在右、竖屏在下，金色衬板
    const tx = LAND ? W * .76 : W / 2, ty = LAND ? H * .5 : H * .82, tp = smooth(1.6, 2.4, t);
    ctx.globalAlpha = tp;
    ctx.fillStyle = CRM; ctx.beginPath(); ctx.ellipse(tx, ty, (LAND ? 250 : 330) * u, (LAND ? 190 : 150) * u, 0, 0, TAU); ctx.fill();
    band(circlePts(tx, ty, 1, 90).map(([x, y]) => [tx + (x - tx) * (LAND ? 250 : 330) * u, ty + (y - ty) * (LAND ? 190 : 150) * u]), q => (2 + 8 * Math.abs(Math.cos(q * TAU))) * u, GOLD);
    ctx.fillStyle = OL; ctx.textAlign = 'center'; ctx.font = `900 ${118 * u}px 'Noto Serif SC'`; ctx.fillText('花之季', tx, ty + 30 * u);
    ctx.fillStyle = '#7A5A20'; ctx.font = `italic 400 ${36 * u}px 'Playfair Display'`; ctx.fillText('La Saison des Fleurs', tx, ty + 90 * u);
    ctx.globalAlpha = 1;
    ctx.restore();
    // 四角花藤：从角落长出，叶片沿藤逐片出现
    const vine = (cx, cy, sx, sy, d) => {
      const pts = bez([cx, cy], [cx + sx * 260 * u, cy + sy * 20 * u], [cx + sx * 80 * u, cy + sy * 300 * u], [cx + sx * 330 * u, cy + sy * 260 * u]), p = eOutCubic(inv(.8 + d, 2.4 + d, t));
      if (p <= 0) return; band(pts, q => (12 * (1 - q) + 2) * u, OL, p);
      const R = resample(pts, 10);
      for (let i = 1; i < 10; i++) { const q = i / 10; if (q > p) break; const a = R[i], g = eOutBack(clamp((p - q) * 5)), side = i % 2 ? 1 : -1;
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.atan2(a.ny, a.nx) * side); ctx.scale(g, g);
        ctx.fillStyle = i % 3 ? GRN2 : '#E59A7E'; ctx.beginPath(); ctx.ellipse(side * 26 * u, 0, 28 * u, 12 * u, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 2 * u; ctx.stroke(); ctx.restore(); }
    };
    vine(fx0 + 10 * u, fy0 + 10 * u, 1, 1, 0); vine(fx1 - 10 * u, fy0 + 10 * u, -1, 1, .1); vine(fx0 + 10 * u, fy1 - 10 * u, 1, -1, .2); vine(fx1 - 10 * u, fy1 - 10 * u, -1, -1, .3);
    // 金色鞭线画框：开场绕一圈长出（外粗内细两道）
    band(frame, q => (6 + 12 * Math.abs(Math.sin(q * Math.PI * 4))) * u, GOLD, gp);
    if (gp > .99) { const fr2 = resample(frame, 300).map(a => [a.x + a.nx * 22 * u, a.y + a.ny * 22 * u]); band(fr2, () => 3 * u, OL, 1); }
  }
});
