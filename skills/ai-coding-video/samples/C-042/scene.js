// C-042 极简图解 / 时间轴：Canvas 2D 在米白底上用细黑线画关系图，每个节点的方框和连向它的箭头都用 drawPartial 按进度描出；当前节点填红，其余退成黑框；左上角大号年份随节点滚动，底部年份刻度尺上的游标同步推进。
// 风格提示词：用极简图解时间轴风格：米白底、细黑线方框和箭头组成关系图，只用一个红色强调当前节点，底部是带年份刻度的时间轴并随讲解推进，左上角大号年份标题，边讲边画线连接。
// 题材：信息讲解与产品发布 · 适合：历史、行业史、技术科普
scene({
  id: 'C-042', name: '极简图解 / 时间轴', dur: 5, still: 3.9,
  fonts: ["900 80px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'JetBrains Mono'"],
  text: '通信简史活字印刷电报电话互联网智能手机文字可以复制信号走电线声音走电线人人相连人手一台从纸到屏幕',
  init() { return { paper: makePaper('#F1ECE1', { seed: 42, blot: 4, grain: 8, fiber: .25 }) }; },
  draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#1A1A1A', RED = '#D7262B';
    ctx.drawImage(s.paper, 0, 0, W, H);
    const N = [
      { y: 1450, a: '活字印刷', b: '文字可以复制' }, { y: 1837, a: '电报', b: '信号走电线' }, { y: 1876, a: '电话', b: '声音走电线' },
      { y: 1969, a: '互联网', b: '人人相连' }, { y: 2007, a: '智能手机', b: '人手一台' }];
    const T0 = .5, DT = .82, at = i => T0 + i * DT;
    const cur = clamp(Math.floor((t - T0) / DT), -1, N.length - 1);
    // 节点位置：横屏是一条之字形，竖屏是上下交错的两列
    const pos = i => LAND
      ? [W * (.13 + i * .185), H * (i % 2 ? .62 : .40)]
      : [W * (i % 2 ? .68 : .32), H * (.28 + i * .12)];
    const bw = (LAND ? 300 : 330) * u, bh = (LAND ? 140 : 150) * u;
    // 整张图缓慢平移，让画面一直有一点动
    ctx.save(); ctx.translate(Math.sin(t * .7) * 10 * u, (LAND ? 0 : 1) * Math.cos(t * .6) * 8 * u);
    // 连线：先画箭头，再画方框
    ctx.lineWidth = 2.2 * u; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    for (let i = 1; i < N.length; i++) {
      const p = inv(at(i) - .3, at(i) + .05, t); if (p <= 0) continue;
      const [x0, y0] = pos(i - 1), [x1, y1] = pos(i);
      const pts = LAND
        ? [[x0 + bw / 2, y0], [(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1], [x1 - bw / 2 - 10 * u, y1]]
        : [[x0, y0 + bh / 2], [x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2], [x1, y1 - bh / 2 - 10 * u]];
      ctx.beginPath(); const tip = drawPartial(ctx, pts, eInOutCubic(p)); ctx.stroke();
      if (p >= 1) {
        const [ax, ay] = pts[3], [bx, by] = pts[2], a = Math.atan2(ay - by, ax - bx), h = 16 * u;
        ctx.beginPath(); ctx.moveTo(ax - Math.cos(a - .45) * h, ay - Math.sin(a - .45) * h); ctx.lineTo(ax, ay);
        ctx.lineTo(ax - Math.cos(a + .45) * h, ay - Math.sin(a + .45) * h); ctx.stroke();
      }
    }
    N.forEach((n, i) => {
      const p = inv(at(i), at(i) + .35, t); if (p <= 0) return;
      const [x, y] = pos(i), on = i === cur;
      const box = [[x - bw / 2, y - bh / 2], [x + bw / 2, y - bh / 2], [x + bw / 2, y + bh / 2], [x - bw / 2, y + bh / 2], [x - bw / 2, y - bh / 2]];
      const fillA = on ? smooth(0, .5, p) : 0;
      if (fillA > 0) { ctx.fillStyle = rgba([215, 38, 43], fillA); ctx.fillRect(x - bw / 2, y - bh / 2, bw, bh); }
      ctx.strokeStyle = on ? RED : INK; ctx.lineWidth = (on ? 3 : 2.2) * u;
      ctx.beginPath(); drawPartial(ctx, box, eOutCubic(p)); ctx.stroke();
      const ta = smooth(.5, 1, p);
      ctx.globalAlpha = ta; ctx.textAlign = 'center';
      ctx.fillStyle = on ? '#fff' : INK; ctx.font = `700 ${Math.round(50 * u)}px 'Noto Sans SC'`;
      ctx.fillText(n.a, x, y + 4 * u);
      ctx.font = `400 ${Math.round(30 * u)}px 'Noto Sans SC'`; ctx.fillStyle = on ? '#FBE3E3' : '#555';
      ctx.fillText(n.b, x, y + 46 * u);
      ctx.font = `400 ${Math.round(28 * u)}px 'JetBrains Mono'`; ctx.fillStyle = on ? RED : '#777';
      ctx.fillText(n.y, x, y - bh / 2 - 14 * u);
      ctx.globalAlpha = 1;
      if (on && p >= 1) {   // 当前节点外面一圈呼吸的红框
        const q = ((t - at(i)) % 1.1) / 1.1, g = 6 * u + q * 26 * u;
        ctx.strokeStyle = rgba([215, 38, 43], .6 * (1 - q)); ctx.lineWidth = 2 * u;
        ctx.strokeRect(x - bw / 2 - g, y - bh / 2 - g, bw + 2 * g, bh + 2 * g);
      }
    });
    ctx.restore();
    // 左上角大年份：在两个年份间滚动
    const yi = Math.max(0, cur), yp = cur < 0 ? 0 : eOutExpo(inv(at(yi), at(yi) + .4, t));
    const yPrev = yi > 0 ? N[yi - 1].y : N[0].y, yr = Math.round(lerp(yPrev, N[yi].y, yp));
    const tx = 80 * u, ty = (LAND ? 170 : 230) * u;
    ctx.textAlign = 'left'; ctx.fillStyle = INK;
    ctx.font = `900 ${Math.round((LAND ? 150 : 190) * u)}px 'Noto Serif SC'`;
    ctx.globalAlpha = smooth(0, .4, t); ctx.fillText(yr, tx, ty);
    ctx.font = `400 ${Math.round(32 * u)}px 'Noto Sans SC'`; ctx.fillStyle = '#555';
    ctx.fillText('通信简史 · 从纸到屏幕', tx + 6 * u, ty + 56 * u); ctx.globalAlpha = 1;
    ctx.fillStyle = RED; ctx.fillRect(tx + 6 * u, ty + 76 * u, 60 * u, 5 * u);
    // 底部时间轴：1400–2030，刻度每 50 年，游标跟着当前年份
    const ax0 = 80 * u, ax1 = W - 80 * u, ay = H - (LAND ? 110 : 190) * u;
    const X = y => lerp(ax0, ax1, (y - 1400) / 630);
    ctx.strokeStyle = INK; ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(lerp(ax0, ax1, eOutCubic(inv(0, .6, t))), ay); ctx.stroke();
    ctx.font = `400 ${Math.round(22 * u)}px 'JetBrains Mono'`; ctx.textAlign = 'center';
    for (let y = 1400; y <= 2030; y += 50) {
      const x = X(y), big = y % 100 === 0;
      if (x > lerp(ax0, ax1, eOutCubic(inv(0, .6, t)))) break;
      ctx.beginPath(); ctx.moveTo(x, ay); ctx.lineTo(x, ay + (big ? 18 : 10) * u); ctx.stroke();
      if (big && (LAND || y % 200 === 0)) { ctx.fillStyle = '#666'; ctx.fillText(y, x, ay + 46 * u); }
    }
    // 走过的部分加粗；当前年份红点
    if (cur >= 0) {
      ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(X(yr), ay); ctx.stroke();
      N.forEach((n, i) => { if (i < cur || (i === cur && yp > .95)) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(X(n.y), ay, 6 * u, 0, TAU); ctx.fill(); } });
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(X(yr), ay, 13 * u, 0, TAU); ctx.fill();
      ctx.strokeStyle = RED; ctx.lineWidth = 1.5 * u; ctx.setLineDash([6 * u, 6 * u]);
      ctx.beginPath(); ctx.moveTo(X(yr), ay - 16 * u); ctx.lineTo(X(yr), ay - 60 * u); ctx.stroke(); ctx.setLineDash([]);
    }
  }
});
