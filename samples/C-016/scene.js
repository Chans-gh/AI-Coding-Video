// C-016 纸雕灯影：六层剪纸山、云、亭子、树叠在灯箱里，每层带投影、按深度做不同幅度的视差摇晃，
// 镂空的窗洞透出后面的暖光，灯笼轻轻摆动。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-016', name: '纸雕灯影', dur: 3, still: 2.4,
  fonts: [],
  draw(ctx, t) {
    ctx.fillStyle = '#140D08'; ctx.fillRect(0, 0, W, H);
    // 构图：竖屏沿用原版（方形灯箱）；横屏灯箱拉成宽幅，里面的山、亭子、树、灯笼按比例往两边排开
    const [bx, by, bw, bh] = LAND ? [210, 100, 1500, 860] : [90, 480, 900, 900], ix = bx + 40, iy = by + 40, iw = bw - 80, ih = bh - 80;
    const X = x => ix + (x - 130) * iw / 820, Y = y => y + iy - 370;
    // warm spill on the table
    const sp = ctx.createRadialGradient(W / 2, by + bh + 30, 50, W / 2, by + bh + 30, 700); sp.addColorStop(0, 'rgba(255,170,80,.35)'); sp.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = sp; ctx.fillRect(0, by + bh - 330, W, 1000);
    ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();
    const fl = 1 + .04 * Math.sin(t * 7) + .03 * noise1(t * 5);
    const g = ctx.createRadialGradient(X(700), Y(560), 30, X(600), Y(700), 700 * Math.max(1, iw / 820 * .8)); g.addColorStop(0, '#FFF3C9'); g.addColorStop(.4, '#FFC066'); g.addColorStop(1, '#C0561E');
    ctx.fillStyle = g; ctx.fillRect(ix, iy, iw, ih);
    ctx.save(); ctx.globalAlpha = .9 * fl; ctx.fillStyle = '#FFFBEA'; ctx.shadowColor = '#FFF1B8'; ctx.shadowBlur = 80; ctx.beginPath(); ctx.arc(X(700), Y(560), 95, 0, TAU); ctx.fill(); ctx.restore();
    const layer = (depth, color, fn) => { ctx.save(); ctx.translate(Math.sin(t * .9) * depth * 7 - depth * t * 3, Math.cos(t * .7) * depth * 2); ctx.shadowColor = 'rgba(40,10,0,.55)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10; ctx.fillStyle = color; ctx.beginPath(); fn(); ctx.fill('evenodd'); ctx.restore(); };
    const ridge = (y0, amp, fq, ph) => { ctx.moveTo(ix - 100, iy + ih + 50); for (let x = ix - 100; x <= ix + iw + 100; x += 20) ctx.lineTo(x, Y(y0) - amp * Math.abs(Math.sin(x * fq + ph)) - amp * .4 * Math.sin(x * fq * 2.3 + ph)); ctx.lineTo(ix + iw + 100, iy + ih + 50); ctx.closePath(); };
    layer(1, '#F6D29C', () => ridge(820, 150, .006, .5));
    layer(2, '#E8AE6C', () => { for (let k = 0; k < 3; k++) { const cx = X(260 + k * 190) - t * 12, cy = Y(520 + k * 30); ctx.moveTo(cx + 70, cy); ctx.ellipse(cx, cy, 70, 22, 0, 0, TAU); ctx.ellipse(cx + 50, cy - 16, 40, 18, 0, 0, TAU); } });
    layer(3, '#D48A48', () => ridge(930, 110, .009, 2));
    layer(4, '#A9612C', () => {
      ridge(1030, 50, .012, 1);
      // pavilion with lit windows (holes)
      const px = X(360), py = Y(900); ctx.moveTo(px - 110, py); ctx.lineTo(px + 110, py); ctx.lineTo(px + 110, py - 120); ctx.lineTo(px + 150, py - 120); ctx.lineTo(px, py - 220); ctx.lineTo(px - 150, py - 120); ctx.lineTo(px - 110, py - 120); ctx.closePath();
      ctx.moveTo(px - 80, py - 90); ctx.rect(px - 80, py - 90, 50, 60); ctx.rect(px + 30, py - 90, 50, 60); ctx.moveTo(px - 18, py - 170); ctx.arc(px, py - 160, 18, 0, TAU);
    });
    layer(5, '#6E3B1C', () => {
      ridge(1110, 30, .02, 3);
      for (let k = 0; k < 3; k++) { const x = X(760) + k * 70, yb = Y(1100); ctx.moveTo(x, yb); ctx.lineTo(x - 50, yb); ctx.lineTo(x, Y(900) - k * 20); ctx.lineTo(x + 50, yb); ctx.closePath(); }
    });
    layer(6, '#3A1E0E', () => {
      ctx.rect(ix - 100, Y(1150), iw + 200, 100);
      [[X(300), Y(1150)], [X(300) + 80, Y(1152)]].forEach(([x, y], k) => { ctx.moveTo(x + 40, y - 30); ctx.ellipse(x, y - 30, 40, 30, 0, 0, TAU); ctx.moveTo(x + 22, y - 90); ctx.ellipse(x + 10, y - 90, 12, 36, -.25 + k * .5, 0, TAU); ctx.moveTo(x - 2, y - 90); ctx.ellipse(x - 12, y - 88, 11, 32, -.5 + k * .4, 0, TAU); });
      ctx.rect(ix - 100, iy - 20, iw + 200, 30);
      for (let k = 0; k < 3; k++) { const x = X(250 + k * 280); ctx.rect(x - 2, iy, 4, 60 + k * 20); }
    });
    // lanterns
    for (let k = 0; k < 3; k++) {
      const x = X(250 + k * 280), y = iy + 60 + k * 20, sw = Math.sin(t * 2 + k) * .12; ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
      ctx.shadowColor = '#FF6A2A'; ctx.shadowBlur = 40; ctx.fillStyle = '#E8452C'; ctx.beginPath(); ctx.ellipse(0, 46, 34, 44, 0, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#FFD27A'; ctx.globalAlpha = .6; ctx.beginPath(); ctx.ellipse(0, 46, 16, 36, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#3A1E0E'; ctx.fillRect(-18, 0, 36, 8); ctx.fillRect(-18, 86, 36, 8); ctx.restore();
    }
    // inner shadow
    ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 60; ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 40; ctx.strokeRect(ix - 20, iy - 20, iw + 40, ih + 40); ctx.restore();
    // wooden box
    ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.rect(ix, iy, iw, ih); const wg = ctx.createLinearGradient(bx, 0, bx + bw, 0); wg.addColorStop(0, '#6B4221'); wg.addColorStop(.5, '#9A6534'); wg.addColorStop(1, '#6B4221'); ctx.fillStyle = wg; ctx.fill('evenodd');
    ctx.clip('evenodd'); ctx.strokeStyle = 'rgba(40,20,5,.35)'; ctx.lineWidth = 2; for (let y = by; y < by + bh; y += 9) { ctx.beginPath(); ctx.moveTo(bx, y); for (let x = bx; x < bx + bw; x += 30) ctx.lineTo(x, y + Math.sin(x * .02 + y) * 3); ctx.stroke(); }
    ctx.restore();
  }
});
