// C-099 手工刺绣：每一针是一条两端圆头的线段，按「投影 → 线色 → 虚线画的捻纹 → 左上方偏移的高光」四层画，光就像从左上来；茎用首尾交叠的轮廓绣沿曲线排，花瓣用顺着花瓣斜排的缎面绣，叶子用左右交替、越过中脉的鱼骨绣，花心是一圈圈带高光的小圆点（法式结粒绣）；所有针按绣的顺序排好，时间到哪一针就画到哪一针，针头和一段线跟着当前这一针走。
// 风格提示词：用手工刺绣风格：棉线穿过绷在木绣绷里的亚麻布，每个形状的边缘就是针脚的线头，茎用轮廓绣、花瓣用缎面绣顺着形状排、叶子用鱼骨绣、花心用法式结粒绣，光从左上来，针脚按绣的顺序一针一针缝出来。
// 题材：纸艺、材质与定格 · 适合：手工艺与家居、母婴、节日祝福、非遗
scene({
  id: 'C-099', name: '手工刺绣', dur: 5, still: 4.7,
  fonts: [],
  init() {
    const u = SHORT / 1080, R0 = SHORT * (LAND ? .4 : .45), cx = W / 2, cy = LAND ? H / 2 : H * .46, k = R0 / 480;
    // 亚麻布
    const lin = mk(W, H), g = lin.getContext('2d'), Rl = mulberry32(5);
    g.fillStyle = '#E4D9C3'; g.fillRect(0, 0, W, H);
    const sp = 3.2 * u;
    for (let y = 0; y < H; y += sp) { g.fillStyle = `rgba(${Rl() < .5 ? '120,100,70' : '255,250,235'},${.08 + Rl() * .12})`; g.fillRect(0, y, W, sp * .5); if (Rl() < .05) { g.fillStyle = 'rgba(150,125,90,.18)'; g.fillRect(Rl() * W, y, 40 + Rl() * 120, sp * .8); } }
    for (let x = 0; x < W; x += sp) { g.fillStyle = `rgba(${Rl() < .5 ? '120,100,70' : '255,250,235'},${.06 + Rl() * .1})`; g.fillRect(x, 0, sp * .5, H); }
    // 针脚表：[x0,y0,x1,y1,宽,颜色,类型]
    const S = [], P = (x, y) => [cx + x * k, cy + y * k];
    const bez = (a, b, c, d, q) => { const m = 1 - q; return [m * m * m * a[0] + 3 * m * m * q * b[0] + 3 * m * q * q * c[0] + q * q * q * d[0], m * m * m * a[1] + 3 * m * m * q * b[1] + 3 * m * q * q * c[1] + q * q * q * d[1]]; };
    const stem = (a, b, c, d, n, col) => { for (let i = 0; i < n; i++) { const p0 = bez(a, b, c, d, i / (n + 1)), p1 = bez(a, b, c, d, (i + 2) / (n + 1)); S.push([...P(...p0), ...P(p1[0] + 3, p1[1]), 6 * k, col]); } };
    stem([10, 400], [-30, 250], [40, 100], [0, -60], 34, '#4F7A3C');
    stem([5, 230], [-60, 200], [-140, 160], [-190, 110], 16, '#4F7A3C');
    const leaf = (bx, by, ang, len, wid, cols) => {
      const ca = Math.cos(ang), sa = Math.sin(ang), at = (s, o) => [bx + ca * s - sa * o, by + sa * s + ca * o];
      for (let i = 0, n = Math.round(len / 5); i < n; i++) {
        const q = 1 - i / n, s = q * len, w = wid * Math.sin(Math.PI * Math.pow(q, .8)) * .5, side = i % 2 ? 1 : -1;
        S.push([...P(...at(s, side * w)), ...P(...at(s - 12, -side * 2)), 6.5 * k, cols[i % 2]]);
      }
    };
    leaf(20, 300, -.55, 150, 80, ['#6E9B4E', '#5A8640']); leaf(-5, 180, -2.5, 140, 74, ['#6E9B4E', '#5A8640']); leaf(-20, 60, -.35, 110, 60, ['#7DA857', '#628F46']);
    const flower = (fx, fy, n, len, wid, base, tip, a0) => {
      for (let p = 0; p < n; p++) {
        const a = a0 + p / n * TAU, ca = Math.cos(a), sa = Math.sin(a), [r1, g1, b1] = hex2rgb(base), [r2, g2, b2] = hex2rgb(tip);
        for (let s = len * .12; s < len; s += 4.6) {
          const q = s / len, w = wid * Math.sin(Math.PI * Math.pow(q, .7)) * .5, sk = 10;
          const c = `rgb(${lerp(r1, r2, q) | 0},${lerp(g1, g2, q) | 0},${lerp(b1, b2, q) | 0})`;
          S.push([...P(fx + ca * (s - sk) + sa * w, fy + sa * (s - sk) - ca * w), ...P(fx + ca * (s + sk) - sa * w, fy + sa * (s + sk) + ca * w), 5 * k, c]);
        }
      }
    };
    flower(0, -150, 5, 150, 95, '#B23A55', '#F08A9C', -Math.PI / 2);
    const Rk = mulberry32(3);
    for (let i = 0; i < 46; i++) { const a = i * 2.4, r = Math.sqrt(i / 46) * 44; S.push([...P(Math.cos(a) * r, -150 + Math.sin(a) * r), 0, 0, (7 + Rk() * 2) * k, i % 3 ? '#F2C14E' : '#E08A2E', 'knot']); }
    flower(-205, 95, 5, 70, 50, '#3E5FA8', '#8FB0E6', -1.2);
    for (let i = 0; i < 9; i++) { const a = i * 2.4, r = Math.sqrt(i / 9) * 14; S.push([...P(-205 + Math.cos(a) * r, 95 + Math.sin(a) * r), 0, 0, 6 * k, '#F7E7A0', 'knot']); }
    // 每针的出现时间
    const t0 = .15, t1 = 4.4; S.forEach((s, i) => s.t = t0 + (t1 - t0) * Math.pow(i / S.length, .95));
    return { lin, S, cx, cy, R0, k };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, { cx, cy, R0, k } = s, z = 1 + .06 * eInOutCubic(inv(0, 5, t));
    ctx.fillStyle = '#3A2A1E'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy);
    ctx.globalAlpha = .75; ctx.drawImage(s.lin, 0, 0); ctx.globalAlpha = 1;
    const sh = ctx.createRadialGradient(cx, cy, R0 * .9, cx, cy, R0 * 2); sh.addColorStop(0, 'rgba(40,25,10,.25)'); sh.addColorStop(1, 'rgba(40,25,10,.6)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
    // 绷紧的那一圈布
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R0, 0, TAU); ctx.clip(); ctx.drawImage(s.lin, 0, 0);
    const lg = ctx.createLinearGradient(cx - R0, cy - R0, cx + R0, cy + R0); lg.addColorStop(0, 'rgba(255,250,235,.12)'); lg.addColorStop(1, 'rgba(60,40,20,.12)'); ctx.fillStyle = lg; ctx.fillRect(cx - R0, cy - R0, 2 * R0, 2 * R0);
    // 针脚
    ctx.lineCap = 'round'; let cur = null;
    for (const st of s.S) {
      if (t < st.t) break; cur = st;
      const [x0, y0, x1, y1, w, c, kind] = st;
      if (kind === 'knot') {
        ctx.fillStyle = 'rgba(40,25,10,.35)'; ctx.beginPath(); ctx.arc(x0 + w * .25, y0 + w * .35, w * .55, 0, TAU); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x0, y0, w * .5, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(90,50,10,.35)'; ctx.lineWidth = w * .12; ctx.beginPath(); ctx.arc(x0, y0, w * .28, 0, 4.5); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,240,.6)'; ctx.beginPath(); ctx.arc(x0 - w * .17, y0 - w * .17, w * .14, 0, TAU); ctx.fill();
        continue;
      }
      ctx.strokeStyle = 'rgba(40,25,10,.3)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0 + w * .3, y0 + w * .45); ctx.lineTo(x1 + w * .3, y1 + w * .45); ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = w * .45; ctx.setLineDash([w * .5, w * .7]); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255,255,245,.38)'; ctx.lineWidth = w * .28; ctx.beginPath(); ctx.moveTo(lerp(x0, x1, .15) - w * .18, lerp(y0, y1, .15) - w * .22); ctx.lineTo(lerp(x0, x1, .85) - w * .18, lerp(y0, y1, .85) - w * .22); ctx.stroke();
    }
    ctx.restore();
    // 针和线：跟着当前这一针
    if (cur && t < 4.5) {
      const x = cur[2] || cur[0], y = cur[3] || cur[1], ph = (t * 7) % 1, lift = Math.sin(ph * Math.PI) * 60 * u;
      const nx = x + 30 * u, ny = y - 40 * u - lift;
      ctx.strokeStyle = cur[5]; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 60 * u, y - 120 * u - lift, W * .9, cy - R0 * 1.2, W + 20, cy - R0 * 1.4); ctx.stroke();
      const ng = ctx.createLinearGradient(nx - 10 * u, ny, nx + 10 * u, ny); ng.addColorStop(0, '#8A8F96'); ng.addColorStop(.5, '#F2F4F7'); ng.addColorStop(1, '#6E737A');
      ctx.save(); ctx.translate(nx, ny); ctx.rotate(.6); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(4 * u, -60 * u + 6 * u, 5 * u, 120 * u);
      ctx.fillStyle = ng; ctx.beginPath(); ctx.moveTo(0, 60 * u); ctx.lineTo(-3 * u, -50 * u); ctx.arc(0, -55 * u, 3 * u, Math.PI, 0); ctx.lineTo(3 * u, -50 * u); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    // 绣绷：外圈木头、顶上螺丝
    const ring = (r, w) => { const wg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r); wg.addColorStop(0, '#E2B57A'); wg.addColorStop(.5, '#B98650'); wg.addColorStop(1, '#7A5230'); ctx.strokeStyle = wg; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); };
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30 * u; ctx.shadowOffsetX = 10 * u; ctx.shadowOffsetY = 16 * u; ring(R0 + 20 * u, 40 * u); ctx.restore();
    ring(R0 + 20 * u, 40 * u);
    ctx.strokeStyle = 'rgba(90,55,25,.25)'; ctx.lineWidth = 1.5 * u; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(cx, cy, R0 + (6 + i * 7) * u, i, i + 2.2); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,240,210,.35)'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(cx, cy, R0 + 2 * u, Math.PI * .9, Math.PI * 1.6); ctx.stroke();
    const by = cy - R0 - 30 * u; ctx.fillStyle = '#8A6A3A'; rr(ctx, cx - 26 * u, by - 34 * u, 52 * u, 44 * u, 6 * u); ctx.fill();
    const bg = ctx.createLinearGradient(cx - 60 * u, 0, cx + 60 * u, 0); bg.addColorStop(0, '#9C8A5A'); bg.addColorStop(.4, '#F0DCA0'); bg.addColorStop(1, '#8A7448');
    ctx.fillStyle = bg; rr(ctx, cx - 60 * u, by - 26 * u, 120 * u, 18 * u, 9 * u); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 66 * u, by - 17 * u, 14 * u, 0, TAU); ctx.fill();
    if (!LAND) {   // 竖屏：下面摆三卷线
      ['#D9506A', '#5E8C4A', '#5B7FC2'].forEach((c, i) => {
        const x = cx + (i - 1) * 230 * u, y = cy + R0 + 300 * u, w = 120 * u, h = 150 * u;
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x + 20 * u, y + h / 2 + 10 * u, w * .7, 20 * u, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#C9A06A'; rr(ctx, x - w * .6, y - h / 2 - 14 * u, w * 1.2, 20 * u, 6 * u); ctx.fill(); rr(ctx, x - w * .6, y + h / 2 - 6 * u, w * 1.2, 20 * u, 6 * u); ctx.fill();
        const tg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); tg.addColorStop(0, c); tg.addColorStop(.35, '#fff'); tg.addColorStop(.45, c); tg.addColorStop(1, '#222');
        ctx.fillStyle = c; ctx.fillRect(x - w / 2, y - h / 2 + 6 * u, w, h - 12 * u); ctx.globalAlpha = .4; ctx.fillStyle = tg; ctx.fillRect(x - w / 2, y - h / 2 + 6 * u, w, h - 12 * u); ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1.5 * u; for (let yy = y - h / 2 + 10 * u; yy < y + h / 2 - 8 * u; yy += 5 * u) { ctx.beginPath(); ctx.moveTo(x - w / 2, yy); ctx.lineTo(x + w / 2, yy + 3 * u); ctx.stroke(); }
      });
    }
    ctx.restore();
    vignette(ctx, .45, .45);
  }
});