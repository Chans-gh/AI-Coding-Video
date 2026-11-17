// C-066 代码编辑器叙事：Canvas 2D 画深色编辑器外框、行号和小地图，每行代码由按哈希定长定色的圆角色块拼成；发光的小 bug 沿一条写死的折线在行间空隙里逃，大鼠标光标沿同一条路线晚 0.45 秒追，每次扑空点一下留涟漪；bug 经过的行亮红色波浪线，结尾整屏暗下只剩 bug 的光。
// 风格提示词：用代码编辑器叙事风格：深色编辑器界面就是舞台，代码行用彩色圆角色块抽象表示，一个发光的小 bug 是主角，巨大的鼠标光标是对手，追逐在行与行之间发生，结尾整屏暗下。
// 题材：平面设计与动态排版 · 适合：程序员、调试、技术故事
scene({
  id: 'C-066', name: '代码编辑器叙事', dur: 5, still: 2.3,
  fonts: ["400 40px 'JetBrains Mono'", "700 40px 'JetBrains Mono'"],
  text: 'main.jsbug.jsutil.js',
  init() {
    const rows = LAND ? 22 : 34, lines = [];
    const COLS = ['#C678DD', '#61AFEF', '#98C379', '#E5C07B', '#56B6C2', '#ABB2BF', '#E06C75'];
    for (let r = 0; r < rows; r++) {
      const ind = Math.floor(hash2(r, 1) * 4) * (r % 7 === 0 ? 0 : 1), n = r % 6 === 5 ? 0 : 2 + Math.floor(hash2(r, 2) * 5), blocks = [];
      let x = ind * 2;
      for (let k = 0; k < n; k++) { const w = 2 + Math.floor(hash2(r, k + 9) * (LAND ? 10 : 8)); blocks.push([x, w, COLS[Math.floor(hash2(r * 3, k) * COLS.length)]]); x += w + 1; }
      lines.push(blocks);
    }
    return { lines, rows };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.fillStyle = '#16181D'; ctx.fillRect(0, 0, W, H);
    // 窗口
    const wx = 40 * u, wy = 40 * u, ww = W - 80 * u, wh = H - 80 * u;
    ctx.fillStyle = '#1E2127'; rr(ctx, wx, wy, ww, wh, 18 * u); ctx.fill();
    ctx.fillStyle = '#21252B'; ctx.fillRect(wx, wy + 18 * u, ww, 52 * u); rr(ctx, wx, wy, ww, 60 * u, 18 * u); ctx.fill();
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(wx + 36 * u + i * 32 * u, wy + 35 * u, 10 * u, 0, TAU); ctx.fill(); });
    ctx.font = `400 ${Math.round(24 * u)}px 'JetBrains Mono'`; ctx.textAlign = 'left';
    ['main.js', 'bug.js', 'util.js'].forEach((n, i) => { const tx = wx + 160 * u + i * 170 * u; ctx.fillStyle = i === 1 ? '#282C34' : 'transparent'; ctx.fillRect(tx - 18 * u, wy + 10 * u, 160 * u, 60 * u); ctx.fillStyle = i === 1 ? '#E6E6E6' : '#7F848E'; ctx.fillText(n, tx, wy + 46 * u); });
    // 代码区
    const mmw = LAND ? 120 * u : 0, gx = wx + 100 * u, top = wy + 100 * u, lh = (wh - 140 * u) / s.rows, cw = (ww - 160 * u - mmw) / 90;
    const LX = c => gx + 20 * u + c * cw, LY = r => top + r * lh;
    // bug 的路线：在行间空隙里走（y 落在两行之间），格点是 [列, 行间]
    const path = LAND
      ? [[-2, 3.5], [30, 3.5], [30, 8.5], [8, 8.5], [8, 13.5], [52, 13.5], [52, 6.5], [80, 6.5], [80, 17.5], [40, 17.5], [40, 20.5], [96, 20.5]]
      : [[-2, 4.5], [40, 4.5], [40, 10.5], [10, 10.5], [10, 16.5], [55, 16.5], [55, 23.5], [20, 23.5], [20, 29.5], [62, 29.5], [62, 32.5], [80, 32.5]];
    const pts = path.map(([c, r]) => [LX(c), LY(r)]);
    const total = polyLen(pts);
    const at = d => { d = clamp(d, 0, total); for (let i = 1; i < pts.length; i++) { const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (d <= L) { const q = d / L; return [lerp(pts[i - 1][0], pts[i][0], q), lerp(pts[i - 1][1], pts[i][1], q), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; } d -= L; } const n = pts.length; return [pts[n - 1][0], pts[n - 1][1], 0]; };
    // 速度：一阵一阵地窜
    const run = tt => { const k = clamp(tt / 4.1); return total * (k + .025 * Math.sin(k * TAU * 6)); };
    const bug = at(run(t)), cur = at(run(t - .45));
    // 行号 + 代码块；bug 碰过的行亮红波浪线
    const hitRow = r => { for (let k = 0; k < 40; k++) { const p = at(run(t - k * .05)); if (Math.abs(p[1] - LY(r) - lh * .5) < lh * .7 && t - k * .05 > 0) return 1 - k / 40; } return 0; };
    s.lines.forEach((blocks, r) => {
      const y = LY(r), cy = y + lh * .5;
      ctx.fillStyle = '#495162'; ctx.font = `400 ${Math.round(lh * .5)}px 'JetBrains Mono'`; ctx.textAlign = 'right';
      ctx.fillText(r + 1, gx - 10 * u, cy + lh * .18);
      const h = hitRow(r);
      blocks.forEach(([c, w, col]) => {
        ctx.fillStyle = col; ctx.globalAlpha = .85; rr(ctx, LX(c), cy - lh * .22, w * cw - 3 * u, lh * .44, lh * .2); ctx.fill(); ctx.globalAlpha = 1;
      });
      if (h > 0 && blocks.length) {
        const x0 = LX(blocks[0][0]), x1 = LX(blocks[blocks.length - 1][0] + blocks[blocks.length - 1][1]);
        ctx.strokeStyle = rgba([255, 80, 80], h); ctx.lineWidth = 2.5 * u; ctx.beginPath();
        for (let x = x0; x < x1; x += 4 * u) ctx.lineTo(x, cy + lh * .34 + Math.sin(x / (5 * u) + t * 10) * 3 * u);
        ctx.stroke();
      }
    });
    // 小地图
    if (mmw) {
      const mx = wx + ww - mmw - 10 * u; ctx.fillStyle = '#1A1D22'; ctx.fillRect(mx, top, mmw, wh - 140 * u);
      s.lines.forEach((blocks, r) => blocks.forEach(([c, w, col]) => { ctx.fillStyle = col; ctx.globalAlpha = .5; ctx.fillRect(mx + 8 * u + c * 1.3 * u, top + r * lh * .4 + 10 * u, w * 1.3 * u, 3 * u); }));
      ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(mx, top + (bug[1] - top) * .4, mmw, 80 * u);
    }
    // 点击涟漪：光标每 0.8 秒扑一次
    for (let k = 0; k < 6; k++) {
      const tc = .9 + k * .65; if (t < tc || t > tc + .5) continue;
      const p = at(run(tc - .45)), q = (t - tc) / .5;
      ctx.strokeStyle = rgba([97, 175, 239], 1 - q); ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.arc(p[0], p[1], 20 * u + q * 80 * u, 0, TAU); ctx.stroke();
    }
    // 结尾变暗
    const dark = smooth(4.0, 4.6, t);
    if (dark > 0) { ctx.fillStyle = `rgba(5,6,8,${dark * .92})`; ctx.fillRect(0, 0, W, H); }
    // bug：发光的小甲虫
    const [bx, by, ba] = bug, bs = 30 * u;
    const glow = ctx.createRadialGradient(bx, by, 0, bx, by, bs * 5);
    glow.addColorStop(0, 'rgba(120,255,140,.55)'); glow.addColorStop(1, 'rgba(120,255,140,0)');
    ctx.fillStyle = glow; ctx.fillRect(bx - bs * 5, by - bs * 5, bs * 10, bs * 10);
    ctx.save(); ctx.translate(bx, by); ctx.rotate(ba);
    ctx.strokeStyle = '#7CFF8E'; ctx.lineWidth = 3 * u; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) for (const sd of [-1, 1]) { const w = Math.sin(t * 40 + k * 2 + (sd > 0 ? 1 : 0)) * .4; ctx.beginPath(); ctx.moveTo((k - 1) * bs * .5, 0); ctx.lineTo((k - 1) * bs * .5 + Math.sin(w) * bs * .4, sd * bs * 1.0); ctx.stroke(); }
    ctx.fillStyle = '#3BE06A'; ctx.beginPath(); ctx.ellipse(0, 0, bs * .9, bs * .62, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#B9FFC5'; ctx.beginPath(); ctx.arc(bs * .8, 0, bs * .35, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1E7A3A'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(-bs * .9, 0); ctx.lineTo(bs * .5, 0); ctx.stroke();
    ctx.restore();
    // 大鼠标光标（变暗后退场）
    ctx.globalAlpha = 1 - dark;
    const [px, py] = cur, ps = (LAND ? 110 : 130) * u;
    ctx.save(); ctx.translate(px - ps * .05, py - ps * .05);
    const arrow = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, ps); ctx.lineTo(ps * .26, ps * .76); ctx.lineTo(ps * .44, ps * 1.12); ctx.lineTo(ps * .58, ps * 1.05); ctx.lineTo(ps * .4, ps * .7); ctx.lineTo(ps * .72, ps * .7); ctx.closePath(); };
    ctx.translate(8 * u, 10 * u); arrow(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill(); ctx.translate(-8 * u, -10 * u);
    arrow(); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 5 * u; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore(); ctx.globalAlpha = 1;
    // 状态栏
    ctx.fillStyle = dark > .5 ? '#000' : '#007ACC'; ctx.fillRect(wx, wy + wh - 40 * u, ww, 40 * u);
    ctx.fillStyle = '#fff'; ctx.font = `400 ${Math.round(22 * u)}px 'JetBrains Mono'`; ctx.textAlign = 'left'; ctx.globalAlpha = 1 - dark;
    ctx.fillText(`⚠ ${Math.min(9, Math.floor(t * 2))} problems   Ln ${Math.round((by - top) / lh)}, Col ${Math.round((bx - gx) / cw)}`, wx + 20 * u, wy + wh - 13 * u);
    ctx.globalAlpha = 1;
  }
});
