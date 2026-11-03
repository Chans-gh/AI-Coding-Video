// C-024 装饰艺术：阶梯形金边门框、放射线、扇形纹和中轴塔楼全是对称的直线和圆弧，金色用竖向多段渐变假装金属反光；
// 两扇雕花门从中轴打开，一圈灯泡沿门框追逐闪烁。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-024', name: '装饰艺术（Art Deco）', dur: 3, still: 2.4,
  fonts: ["40px 'Limelight'", "700 40px 'Noto Serif SC'"],
  text: 'THE GRAND盛大开幕',
  draw(ctx, t, s, f) {
    ctx.fillStyle = '#0B0A08'; ctx.fillRect(0, 0, W, H);
    const gold = (y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#8C6B1F'); g.addColorStop(.35, '#F7DD8A'); g.addColorStop(.6, '#C39A3A'); g.addColorStop(1, '#F2D27A'); return g; };
    const cx = 540;
    // 构图：竖屏沿用原版；横屏整座拱门上移居中，两边空处加两根阶梯顶的金色壁柱
    const dx = (W - 1080) / 2, dy = LAND ? -250 : 160;
    if (LAND) {
      ctx.strokeStyle = gold(0, H); ctx.lineWidth = 4;
      for (const x of [200, W - 200]) for (let j = 0; j < 3; j++) {
        const w = 120 - j * 40, top = 260 - j * 70; ctx.strokeRect(x - w / 2, top, w, H - top + 10);
        for (let y = top + 60; y < H; y += 90) { ctx.beginPath(); ctx.moveTo(x - w / 2 + 10, y); ctx.lineTo(x, y + 30); ctx.lineTo(x + w / 2 - 10, y); ctx.stroke(); }
      }
    }
    ctx.save(); ctx.translate(dx, dy);
    ctx.save(); ctx.beginPath(); ctx.rect(90, 520, 900, 740); ctx.clip();
    ctx.strokeStyle = 'rgba(230,195,106,.35)'; ctx.lineWidth = 3;
    for (let k = 0; k <= 36; k++) { const a = Math.PI + k / 36 * Math.PI; ctx.beginPath(); ctx.moveTo(cx, 1250); ctx.lineTo(cx + Math.cos(a) * 1200, 1250 + Math.sin(a) * 1200); ctx.stroke(); }
    ctx.restore();
    // stepped frame
    const steps = [[90, 520, 900], [150, 470, 780], [220, 420, 640], [300, 370, 480]];
    ctx.lineWidth = 5; ctx.strokeStyle = gold(360, 1260);
    const framePath = () => { ctx.beginPath(); ctx.moveTo(90, 1260); steps.forEach(([x, y, w], i) => { ctx.lineTo(x, y + 50); ctx.lineTo(x, y); if (i < 3) ctx.lineTo(steps[i + 1][0], y); }); ctx.lineTo(780, 370); [...steps].reverse().forEach(([x, y, w], i) => { ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + 50); if (i < 3) ctx.lineTo(x + w + ([60, 70, 80][i] ?? 0), y + 50); }); ctx.lineTo(990, 1260); };
    framePath(); ctx.stroke();
    // tower
    ctx.fillStyle = '#0B0A08'; ctx.strokeStyle = gold(420, 1260); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(420, 1260); ctx.lineTo(420, 820); ctx.lineTo(460, 820); ctx.lineTo(460, 720); ctx.lineTo(500, 720); ctx.lineTo(500, 620); ctx.lineTo(530, 620); ctx.lineTo(540, 470); ctx.lineTo(550, 620); ctx.lineTo(580, 620); ctx.lineTo(580, 720); ctx.lineTo(620, 720); ctx.lineTo(620, 820); ctx.lineTo(660, 820); ctx.lineTo(660, 1260); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2; for (let x = 440; x <= 640; x += 20) { ctx.beginPath(); ctx.moveTo(x, x < 470 || x > 610 ? 830 : x < 510 || x > 570 ? 730 : 630); ctx.lineTo(x, 1250); ctx.stroke(); }
    // fans
    [[90, 1260, 1], [990, 1260, -1]].forEach(([x, y, d]) => { for (let r = 60; r <= 240; r += 45) { ctx.beginPath(); ctx.arc(x, y, r, d > 0 ? -Math.PI / 2 : Math.PI, d > 0 ? 0 : -Math.PI / 2); ctx.stroke(); } });
    // bulbs chasing along frame
    const pts = []; steps.forEach(([x, y, w]) => { for (let k = 0; k <= 12; k++) pts.push([x + w * k / 12, y - 22]); });
    for (let y = 560; y < 1250; y += 58) { pts.push([62, y], [1018, y]); }
    pts.forEach(([x, y], i) => { const on = ((i + Math.floor(t * 16)) % 4) < 2 || t > 2.4; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fillStyle = on ? '#FFF1C2' : '#4A3A18'; if (on) { ctx.shadowColor = '#FFD66B'; ctx.shadowBlur = 26; } ctx.fill(); ctx.shadowBlur = 0; });
    // title
    ctx.textAlign = 'center'; ctx.fillStyle = '#0B0A08'; ctx.fillRect(170, 1105, 740, 130); ctx.strokeStyle = gold(1100, 1240); ctx.lineWidth = 3; ctx.strokeRect(170, 1105, 740, 130);
    ctx.fillStyle = gold(1120, 1220); ctx.font = "104px 'Limelight'"; ctx.fillText('THE GRAND', cx, 1208);
    ctx.font = "700 34px 'Noto Serif SC'"; ctx.fillStyle = '#E6C36A'; ctx.fillText('盛 大 开 幕  ·  1 9 2 9', cx, 338); ctx.textAlign = 'left';
    ctx.restore();
    // doors opening on the axis
    const o = eInOutCubic(inv(.1, .9, t)), dw = W / 2 * (1 - o);
    if (dw > 1) for (const side of [-1, 1]) {
      ctx.save(); const x0 = side < 0 ? 0 : W - dw; ctx.fillStyle = '#12100C'; ctx.fillRect(x0, 0, dw, H);
      ctx.beginPath(); ctx.rect(x0, 0, dw, H); ctx.clip(); ctx.strokeStyle = gold(0, H); ctx.lineWidth = 4;
      const ex = side < 0 ? dw : W - dw; for (let k = 0; k < 30; k++) { ctx.beginPath(); ctx.moveTo(ex - side * 20, k * 70); ctx.lineTo(ex - side * 140, k * 70 + 60); ctx.lineTo(ex - side * 20, k * 70 + 120); ctx.stroke(); }
      ctx.fillStyle = gold(0, H); ctx.fillRect(ex - (side < 0 ? 8 : 0), 0, 8, H); ctx.restore();
    }
  }
});
