// C-009 白板讲解：字和框按笔顺逐笔写出（按长度裁出折线的一部分），悬浮的马克笔跟着笔尖走，最后镜头拉远看整块板
// 由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-009', name: '白板讲解', dur: 3, still: 2.9,
  fonts: ["84px 'Ma Shan Zheng'"],
  text: '视频是怎么做出来的？一句提示词AI写代码逐帧渲染成片',
  draw(ctx, t) {
    ctx.fillStyle = '#CFC8BE'; ctx.fillRect(0, 0, W, H);
    const pull = eInOutCubic(inv(2.4, 2.95, t)), kL = LAND ? .8 : 1, sc = lerp(1.15, .8, pull) * kL, cx = 540, cy = lerp(760, 790, pull), AX = W / 2, AY = LAND ? H / 2 : 790;
    ctx.save(); ctx.translate(AX, AY); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    // frame + board
    ctx.fillStyle = '#A9ADB3'; rr(ctx, 20, 280, 1040, 1020, 16); ctx.fill(); ctx.fillStyle = '#FAFAF8'; ctx.fillRect(44, 304, 992, 972);
    const sh = ctx.createLinearGradient(44, 304, 1036, 1276); sh.addColorStop(.3, 'rgba(255,255,255,0)'); sh.addColorStop(.42, 'rgba(210,220,230,.35)'); sh.addColorStop(.5, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; ctx.fillRect(44, 304, 992, 972);
    ctx.fillStyle = '#8E9298'; ctx.fillRect(20, 1296, 1040, 30);
    [['#E74C3C', 120], ['#3B82F6', 200], ['#111', 280]].forEach(([c, x]) => { ctx.fillStyle = c; rr(ctx, x, 1300, 70, 18, 8); ctx.fill(); });
    ctx.fillStyle = '#444'; rr(ctx, 860, 1296, 130, 26, 6); ctx.fill();
    [[80, 330, '#E74C3C'], [1000, 330, '#F5B400']].forEach(([x, y, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.fill(); });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    let tip = null, tipC = '#111';
    const txt = (s, x, y, a, b, c, font) => { const p = inv(a, b, t); if (p <= 0) return; ctx.fillStyle = c; ctx.font = font; const e = textReveal(ctx, s, x, y, p); if (p < 1) { tip = [e, y - 16]; tipC = c; } };
    const line = (pts, a, b, c, w = 7) => { const p = inv(a, b, t); ctx.strokeStyle = c; ctx.lineWidth = w; const e = drawPartial(ctx, pts, p); if (p > 0 && p < 1) { tip = e; tipC = c; } };
    txt('视频是怎么做出来的？', 90, 420, 0, .55, '#111', "84px 'Ma Shan Zheng'");
    line(linePts(90, 450, 780, 456, 30, 6, 2), .52, .62, '#E74C3C', 6);
    const box = (x, y, w, h, label, a, c) => { line(rectPts(x, y, w, h, 5, a * 10), a, a + .3, c, 6); txt(label, x + 24, y + h / 2 + 18, a + .25, a + .45, c, "58px 'Ma Shan Zheng'"); };
    box(90, 540, 380, 140, '一句提示词', .62, '#3B82F6');
    line([[480, 610], [600, 610]], 1.0, 1.08, '#111'); line([[580, 592], [604, 610], [580, 628]], 1.08, 1.12, '#111');
    box(610, 540, 380, 140, 'AI 写代码', 1.08, '#E74C3C');
    line([[800, 690], [800, 800]], 1.45, 1.53, '#111'); line([[782, 780], [800, 804], [818, 780]], 1.53, 1.57, '#111');
    box(610, 810, 380, 140, '逐帧渲染', 1.52, '#111');
    line([[600, 880], [480, 880]], 1.9, 1.98, '#111'); line([[500, 862], [476, 880], [500, 898]], 1.98, 2.02, '#111');
    box(90, 810, 380, 140, '  成片 ▶', 1.98, '#2EAA5C');
    // star doodles
    line(circlePts(350, 1080, 60, 30, 0, TAU, .3, 4), 2.25, 2.4, '#F5B400', 6);
    ctx.restore();
    if (tip && t < 2.9) {
      const X = (tip[0] - cx) * sc + AX, Y = (tip[1] - cy) * sc + AY;
      ctx.save(); ctx.translate(X, Y); ctx.rotate(-.65); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 12;
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14, -10); ctx.lineTo(14, 10); ctx.fill();
      ctx.fillStyle = '#EEE'; rr(ctx, 14, -16, 44, 32, 4); ctx.fill(); ctx.fillStyle = tipC; rr(ctx, 56, -18, 150, 36, 10); ctx.fill(); ctx.restore();
    }
  }
});
