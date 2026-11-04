// C-040 数据叙事：方格纸上，铅笔沿折线把数据一段段画出来（每笔描三遍、带一点抖动），镜头贴着笔尖跟拍；
// 画到跳涨处用红笔圈出来、拉一条引线写结论，最后拉远看全图。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-040', name: '数据叙事', dur: 3, still: 2.4,
  fonts: ["40px 'JetBrains Mono'", "40px 'Ma Shan Zheng'"],
  text: '播放量（示意数据）换提示词后↑3.2×123456789101112月',
  init() { return { paper: makePaper('#F1E8D6', { seed: 361, blot: 8, grain: 14 }) }; },
  draw(ctx, t, s) {
    const data = [12, 14, 13, 17, 16, 19, 18, 22, 38, 50, 58, 64];
    const X = i => 170 + i * 72, Y = v => 1130 - v * 9.5;
    const p = eInOutCubic(inv(.1, 2.0, t)), n = p * (data.length - 1), i0 = Math.floor(n), fr = n - i0;
    const tipX = X(Math.min(n, 11)), tipY = Y(i0 >= 11 ? data[11] : lerp(data[i0], data[i0 + 1], fr));
    // 构图：竖屏沿用原版；横屏图表放在画面正中、最后停在 1.15 倍，网格铺满宽幅
    const S1 = LAND ? 1.15 : 1, zoomOut = eInOutCubic(inv(2.05, 2.7, t)), sc = lerp(1.7 * S1, S1, zoomOut);
    const fx = lerp(tipX, 560, zoomOut), fy = lerp(tipY, 790, zoomOut);
    ctx.drawImage(s.paper, 0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, LAND ? H / 2 : 940); ctx.scale(sc, sc); ctx.translate(-fx, -fy);
    ctx.strokeStyle = 'rgba(90,140,200,.18)'; ctx.lineWidth = 1; for (let x = -400; x < 1700; x += 36) { ctx.beginPath(); ctx.moveTo(x, -200); ctx.lineTo(x, 2200); ctx.stroke(); } for (let y = -200; y < 2200; y += 36) { ctx.beginPath(); ctx.moveTo(-400, y); ctx.lineTo(1700, y); ctx.stroke(); }
    const pencil = (pts, col, w, passes = 3) => { for (let k = 0; k < passes; k++) { ctx.strokeStyle = col; ctx.globalAlpha = .45; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => ctx.lineTo(x + (hash2(i, k) - .5) * 2.5, y + (hash2(k, i) - .5) * 2.5)); ctx.stroke(); } ctx.globalAlpha = 1; };
    pencil([[150, 450], [150, 1130], [990, 1130]], '#4A4A4A', 2.5);
    ctx.fillStyle = '#555'; ctx.font = "26px 'JetBrains Mono'"; ctx.textAlign = 'center'; data.forEach((_, i) => ctx.fillText(String(i + 1), X(i), 1170)); ctx.textAlign = 'left';
    ctx.font = "42px 'Ma Shan Zheng'"; ctx.fillStyle = '#444'; ctx.fillText('播放量（示意数据）', 170, 440);
    const pts = []; for (let i = 0; i <= i0 && i < data.length; i++) pts.push([X(i), Y(data[i])]); if (i0 < 11) pts.push([tipX, tipY]);
    pencil(pts, '#2456A6', 4.5);
    for (let i = 0; i <= i0 && i < data.length; i++) { ctx.fillStyle = '#2456A6'; ctx.beginPath(); ctx.arc(X(i), Y(data[i]), 7, 0, TAU); ctx.fill(); }
    // red annotation on the jump
    const a = inv(1.55, 2.0, t); if (a > 0) {
      ctx.lineWidth = 3.5; const c = circlePts(X(8), Y(38), 48, 40, -1.2, TAU - .9, .15, 5); pencil(c.slice(0, Math.ceil(c.length * a)), '#D23A30', 3.5, 2);
      if (a > .6) { pencil([[X(8) - 40, Y(38) - 50], [X(8) - 150, Y(38) - 190]], '#D23A30', 3.5, 2); ctx.fillStyle = '#D23A30'; ctx.font = "56px 'Ma Shan Zheng'"; textReveal(ctx, '换提示词后 ↑3.2×', X(8) - 460, Y(38) - 210, inv(1.8, 2.2, t)); }
    }
    // pencil
    if (t < 2.1) { ctx.save(); ctx.translate(tipX, tipY); ctx.rotate(-.9); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, -6); ctx.lineTo(12, 6); ctx.fill(); ctx.fillStyle = '#E9C99A'; ctx.beginPath(); ctx.moveTo(12, -6); ctx.lineTo(40, -14); ctx.lineTo(40, 14); ctx.lineTo(12, 6); ctx.fill(); ctx.fillStyle = '#2456A6'; ctx.fillRect(40, -14, 200, 28); ctx.fillStyle = '#E8A0A0'; ctx.fillRect(240, -14, 26, 28); ctx.restore(); }
    ctx.restore();
  }
});
