// C-103 白色目录册：Canvas 2D 在白底浅格线上用渐变和高光画一盏台灯当“产品抠图”，背后压一个巨大的浅灰编号；虚线圈用 drawPartial 绕着灯头、底座画出来，手写体批注和带抖动的手绘箭头指过去，黄色荧光笔从左往右刷在关键词下面，产品名用粗黑体和手写体混排。
// 风格提示词：用白色目录册风格：白底浅格线，产品抠图居中，手写体和粗黑无衬线混排，一个大号浅灰数字当背景，虚线圈和手写批注指向产品细节，黄色荧光笔划出关键词。
// 题材：信息讲解与产品发布 · 适合：产品介绍、开箱、好物推荐
scene({
  id: 'C-103', name: '白色目录册', dur: 5, still: 4.2,
  fonts: ["900 80px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 60px 'ZCOOL KuaiLe'", "80px 'Bebas Neue'"],
  text: '台灯三档色温可调铝合金底座稳不晃轻只有克一键触控第号LAMPNo.07¥299',
  draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#151515', HAND = '#2B5BD7', HI = 'rgba(255,226,40,.75)';
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#EEF0F3'; ctx.lineWidth = 1.5 * u;
    for (let x = 0; x < W; x += 60 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // 背景大编号
    const cx = W / 2 + (LAND ? 40 * u : 0), cy = LAND ? H * .56 : H * .5;
    ctx.fillStyle = '#ECECEC'; ctx.font = `${Math.round((LAND ? 900 : 1000) * u)}px 'Bebas Neue'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('07', cx + (1 - eOutCubic(clamp(t / .8))) * 120 * u, cy);
    ctx.textBaseline = 'alphabetic';
    // —— 产品：台灯（底座、两节臂、灯罩），轻轻落下
    const drop = eOutBack(clamp((t - .15) / .5), 1.4), S = (LAND ? 1 : 1.45) * u;
    ctx.save(); ctx.translate(cx, cy + (1 - drop) * -60 * u); ctx.globalAlpha = clamp((t - .15) / .2);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(0, 300 * S, 230 * S, 28 * S, 0, 0, TAU); ctx.fill();
    // 底座
    let g = ctx.createLinearGradient(-200 * S, 0, 200 * S, 0);
    g.addColorStop(0, '#9AA0A8'); g.addColorStop(.35, '#E9ECEF'); g.addColorStop(.6, '#C2C7CD'); g.addColorStop(1, '#7E848C');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 270 * S, 200 * S, 40 * S, 0, 0, Math.PI); ctx.lineTo(-200 * S, 250 * S); ctx.ellipse(0, 250 * S, 200 * S, 40 * S, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#F4F6F8'; ctx.beginPath(); ctx.ellipse(0, 250 * S, 200 * S, 40 * S, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2D2F33'; ctx.beginPath(); ctx.arc(90 * S, 252 * S, 14 * S, 0, TAU); ctx.fill();
    ctx.fillStyle = (t > 3.0 && t < 3.15) ? '#7CF' : '#4CD964'; ctx.beginPath(); ctx.arc(90 * S, 250 * S, 5 * S, 0, TAU); ctx.fill();
    // 臂：两节，关节处圆盘
    const J0 = [-40 * S, 240 * S], J1 = [-150 * S, -20 * S], J2 = [70 * S, -200 * S];
    const arm = (a, b) => { ctx.strokeStyle = '#2D2F33'; ctx.lineWidth = 22 * S; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 5 * S; ctx.beginPath(); ctx.moveTo(a[0] + 5 * S, a[1] - 3 * S); ctx.lineTo(b[0] + 5 * S, b[1] - 3 * S); ctx.stroke(); };
    arm(J0, J1); arm(J1, J2);
    [J0, J1, J2].forEach(j => { ctx.fillStyle = '#3B3E44'; ctx.beginPath(); ctx.arc(j[0], j[1], 22 * S, 0, TAU); ctx.fill(); ctx.fillStyle = '#9AA0A8'; ctx.beginPath(); ctx.arc(j[0], j[1], 8 * S, 0, TAU); ctx.fill(); });
    // 灯罩：斜着朝下的截锥
    ctx.save(); ctx.translate(J2[0], J2[1]); ctx.rotate(.5);
    g = ctx.createLinearGradient(-60 * S, 0, 200 * S, 0);
    g.addColorStop(0, '#E2523E'); g.addColorStop(.45, '#FF8A6E'); g.addColorStop(1, '#B83322');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-10 * S, -40 * S); ctx.lineTo(60 * S, -50 * S); ctx.lineTo(170 * S, 120 * S); ctx.lineTo(-60 * S, 150 * S); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FFF5D6'; ctx.beginPath(); ctx.ellipse(55 * S, 135 * S, 116 * S, 22 * S, -.13, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
    // 灯光：灯亮之后从灯罩口往下一束暖光
    const lit = smooth(2.9, 3.2, t);
    if (lit > 0) {
      ctx.save(); ctx.globalAlpha = lit * .35; ctx.globalCompositeOperation = 'multiply';
      const lg = ctx.createRadialGradient(cx + 30 * S, cy + 200 * S, 0, cx + 30 * S, cy + 200 * S, 380 * S);
      lg.addColorStop(0, '#FFE08A'); lg.addColorStop(1, 'rgba(255,224,138,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    // —— 批注：虚线圈 + 手绘箭头 + 手写字
    const note = (t0, ox, oy, rx, ry, tx, ty, txt, sub, seed) => {
      const p = clamp((t - t0) / .45); if (p <= 0) return;
      ctx.save(); ctx.strokeStyle = HAND; ctx.lineWidth = 3.5 * u; ctx.setLineDash([12 * u, 9 * u]); ctx.lineCap = 'round';
      const ring = circlePts(ox, oy, rx, 60, -1.2, -1.2 + TAU * 1.04, 0, seed).map(([x, y]) => [x, oy + (y - oy) * ry / rx]);
      ctx.beginPath(); drawPartial(ctx, ring, eOutCubic(p)); ctx.stroke(); ctx.setLineDash([]);
      const q = clamp((t - t0 - .3) / .35);
      if (q > 0) {
        const ang = Math.atan2(ty - oy, tx - ox), sx = ox + Math.cos(ang) * rx * 1.08, sy = oy + Math.sin(ang) * ry * 1.08;
        const ex = tx - Math.cos(ang) * 30 * u, ey = ty - Math.sin(ang) * 30 * u;
        const mid = [(sx + ex) / 2 + Math.sin(ang) * 40 * u, (sy + ey) / 2 - Math.cos(ang) * 40 * u];
        const pts = []; for (let i = 0; i <= 20; i++) { const k = i / 20; pts.push([(1 - k) ** 2 * sx + 2 * k * (1 - k) * mid[0] + k * k * ex, (1 - k) ** 2 * sy + 2 * k * (1 - k) * mid[1] + k * k * ey]); }
        ctx.beginPath(); const tip = drawPartial(ctx, pts, eOutCubic(q)); ctx.stroke();
        if (q >= 1) { const a2 = Math.atan2(sy - mid[1], sx - mid[0]); ctx.beginPath(); ctx.moveTo(sx + Math.cos(a2 + .5) * 22 * u, sy + Math.sin(a2 + .5) * 22 * u); ctx.lineTo(sx, sy); ctx.lineTo(sx + Math.cos(a2 - .5) * 22 * u, sy + Math.sin(a2 - .5) * 22 * u); ctx.stroke(); }
        const r = clamp((t - t0 - .5) / .4);
        ctx.fillStyle = HAND; ctx.font = `400 ${Math.round(54 * u)}px 'ZCOOL KuaiLe'`; ctx.textAlign = tx > ox ? 'left' : 'right';
        ctx.save(); ctx.beginPath(); ctx.save(); ctx.font = `400 ${Math.round(34 * u)}px 'ZCOOL KuaiLe'`; const w2 = ctx.measureText(sub).width; ctx.restore(); const w = Math.max(w2, ctx.measureText(txt).width); ctx.rect(tx > ox ? tx : tx - w, ty - 70 * u, w * r, 140 * u); ctx.clip();
        ctx.fillText(txt, tx, ty); ctx.font = `400 ${Math.round(34 * u)}px 'ZCOOL KuaiLe'`; ctx.fillText(sub, tx, ty + 46 * u); ctx.restore();
      }
      ctx.restore();
    };
    note(1.0, cx + 120 * S, cy - 130 * S, 170 * S, 140 * S, LAND ? cx + 380 * u : cx + 110 * u, LAND ? cy - 300 * u : cy - 560 * u, '三档色温', '暖白 / 中性 / 冷白', 3);
    note(1.8, cx, cy + 250 * S, 250 * S, 75 * S, LAND ? cx + 380 * u : cx - 40 * u, LAND ? cy + 330 * u : cy + 580 * u, '铝合金底座', '稳，不晃', 7);
    note(2.6, cx - 150 * S, cy - 20 * S, 60 * S, 60 * S, LAND ? cx - 380 * u : cx - 300 * u, LAND ? cy - 220 * u : cy - 300 * u, '一键触控', '轻点即亮', 11);
    // —— 标题：粗黑体 + 手写体混排，“轻”字下面刷荧光笔
    const hx = LAND ? 90 * u : 80 * u, hy = LAND ? 170 * u : 200 * u;
    ctx.textAlign = 'left'; ctx.fillStyle = INK;
    ctx.font = `${Math.round(44 * u)}px 'Bebas Neue'`; ctx.fillText('No.07 / DESK LAMP', hx, hy - 90 * u);
    const hp = clamp((t - 3.3) / .35);
    ctx.font = `900 ${Math.round(96 * u)}px 'Noto Sans SC'`;
    const w1 = ctx.measureText('台灯，').width, wq = ctx.measureText('轻').width;
    if (hp > 0) { ctx.fillStyle = HI; ctx.save(); ctx.translate(hx + w1 - 8 * u, hy - 30 * u); ctx.rotate(-.03); ctx.fillRect(0, 0, (wq + 16 * u) * eOutCubic(hp), 40 * u); ctx.restore(); }
    ctx.fillStyle = INK; ctx.fillText('台灯，轻', hx, hy);
    ctx.fillStyle = HAND; ctx.font = `400 ${Math.round(56 * u)}px 'ZCOOL KuaiLe'`; ctx.fillText('只有 680 克', hx + w1 + wq + 24 * u, hy - 6 * u);
    // 价签
    const pp = eOutBack(clamp((t - 3.7) / .3), 2);
    if (pp > 0) {
      const px = LAND ? W - 300 * u : W - 260 * u, py = LAND ? 150 * u : H - 220 * u;
      ctx.save(); ctx.translate(px, py); ctx.scale(pp, pp); ctx.rotate(.06);
      ctx.fillStyle = INK; rr(ctx, -120 * u, -60 * u, 240 * u, 120 * u, 14 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `${Math.round(92 * u)}px 'Bebas Neue'`; ctx.textAlign = 'center'; ctx.fillText('¥299', 0, 32 * u);
      ctx.restore();
    }
  }
});
