// C-022 彩色玻璃窗：窗格是一张随机扰动的网格，切成三角和四边形，每格一种宝石色，铅条是粗黑描边；
// 一道斜向光带扫过，每块玻璃按到光带的距离变亮，光束和浮尘只在亮处显出。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-022', name: '彩色玻璃窗', dur: 3, still: 2.4,
  fonts: [],
  init() {
    // 构图：竖屏沿用原版（细高的尖拱窗）；横屏窗子加宽、拱顶压到画面上缘，玫瑰窗跟着上移
    const [x0, x1, y0, y1, r, sy, cols, rows] = LAND ? [480, 1440, 40, 1120, 624, 680, 8, 9] : [150, 930, 300, 1760, 507, 840, 6, 12];
    const hw = (x1 - x0) / 2, R = mulberry32(77), win = new Path2D();
    win.moveTo(x0, y1); win.lineTo(x0, sy); win.arc(x0 + r, sy, r, Math.PI, Math.PI + Math.acos(hw / r), false);
    win.arc(x1 - r, sy, r, -Math.acos(hw / r), 0, false); win.lineTo(x1, y1); win.closePath();
    const pts = [];
    for (let j = 0; j <= rows; j++) { pts.push([]); for (let i = 0; i <= cols; i++) { const x = x0 + i * (x1 - x0) / cols, y = y0 + j * (y1 - y0) / rows; const e = (i > 0 && i < cols && j > 0 && j < rows); pts[j].push([x + (e ? (R() - .5) * 90 : 0), y + (e ? (R() - .5) * 80 : 0)]); } }
    const jewels = ['#B3122E', '#1E4FB8', '#138A5A', '#E8A317', '#6B2FA3', '#D2531C', '#1C8FB3'];
    const cells = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const q = [pts[j][i], pts[j][i + 1], pts[j + 1][i + 1], pts[j + 1][i]];
      if (R() < .5) { cells.push({ p: [q[0], q[1], q[2]], c: jewels[Math.floor(R() * 7)] }); cells.push({ p: [q[0], q[2], q[3]], c: jewels[Math.floor(R() * 7)] }); }
      else cells.push({ p: q, c: jewels[Math.floor(R() * 7)] });
    }
    cells.forEach(c => { c.cx = c.p.reduce((a, p) => a + p[0], 0) / c.p.length; c.cy = c.p.reduce((a, p) => a + p[1], 0) / c.p.length; c.rgb = hex2rgb(c.c); });
    const rose = [];
    for (let ring = 0; ring < 3; ring++) { const n = [8, 16, 16][ring], r0 = [60, 120, 190][ring], r1 = [120, 190, 250][ring]; for (let k = 0; k < n; k++) rose.push({ r0, r1, a0: k / n * TAU + ring * .2, a1: (k + 1) / n * TAU + ring * .2, rgb: hex2rgb(jewels[(k + ring * 3) % 7]) }); }
    const dust = []; for (let i = 0; i < 120; i++) dust.push([R() * W, R() * H, R() * 2 + 1, R()]);
    return { win, cells, rose, dust, rc: LAND ? [960, 400] : [540, 640], wall: makePaper('#2B2723', { seed: 7, grain: 14, blot: 16 }) };
  },
  draw(ctx, t, s) {
    ctx.drawImage(s.wall, 0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3;
    for (let y = 0; y < H; y += 120) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = (y / 120 % 2) * 110; x < W; x += 220) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 120); ctx.stroke(); } }
    const pos = lerp(-500, 2400, t / 3);
    const light = (x, y) => { const d = (x * .55 + y * .83) - pos; const beam = Math.exp(-d * d / (2 * 260 * 260)); const passed = smooth(0, 500, -d); return Math.max(beam, .55 * passed); };
    const col = (rgb, L) => `rgb(${rgb.map(v => Math.min(255, v * (.18 + 1.05 * L) + 190 * Math.pow(L, 4))).join(',')})`;
    ctx.save(); ctx.clip(s.win);
    for (const c of s.cells) { ctx.beginPath(); c.p.forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = col(c.rgb, light(c.cx, c.cy)); ctx.fill(); }
    const [cx, cy] = s.rc;
    ctx.beginPath(); ctx.arc(cx, cy, 262, 0, TAU); ctx.fillStyle = '#111'; ctx.fill();
    for (const r of s.rose) { const am = (r.a0 + r.a1) / 2, rm = (r.r0 + r.r1) / 2; ctx.beginPath(); ctx.arc(cx, cy, r.r1, r.a0, r.a1); ctx.arc(cx, cy, r.r0, r.a1, r.a0, true); ctx.closePath(); ctx.fillStyle = col(r.rgb, light(cx + Math.cos(am) * rm, cy + Math.sin(am) * rm)); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#141210'; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(cx, cy, 60, 0, TAU); ctx.fillStyle = col([240, 190, 60], light(cx, cy)); ctx.fill(); ctx.stroke();
    ctx.lineJoin = 'round';
    for (const c of s.cells) { if (Math.hypot(c.cx - cx, c.cy - cy) < 250) continue; ctx.beginPath(); c.p.forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath(); ctx.lineWidth = 9; ctx.strokeStyle = '#141210'; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(120,110,100,.5)'; ctx.stroke(); }
    ctx.restore();
    ctx.lineWidth = 22; ctx.strokeStyle = '#4A433C'; ctx.stroke(s.win); ctx.lineWidth = 4; ctx.strokeStyle = '#1A1714'; ctx.stroke(s.win);
    // god rays
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) {
      const x = pos * .6 - 300 + k * 120; const g = ctx.createLinearGradient(x, 0, x + 700, H);
      g.addColorStop(0, 'rgba(255,220,150,0)'); g.addColorStop(.5, 'rgba(255,220,150,.07)'); g.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 90, 0); ctx.lineTo(x + 900, H); ctx.lineTo(x + 700, H); ctx.fill();
    }
    for (const [x, y, r, p] of s.dust) { const yy = (y + t * 30 * (p + .3)) % H, xx = x + Math.sin(t + p * 9) * 20; const L = light(xx, yy); if (L > .3) { ctx.fillStyle = `rgba(255,235,190,${L * .7})`; ctx.beginPath(); ctx.arc(xx, yy, r, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }
});
