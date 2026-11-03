// C-048 1930 年代橡皮管卡通：角色的四肢是没有关节的二次曲线，跟着节拍整体摆动；全画面黑白，
// 按每秒 12 格抖动，叠胶片颗粒、竖向划痕、尘点、闪烁和重暗角。角色为原创。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-048', name: '1930 年代橡皮管卡通', dur: 3, still: 2.4,
  fonts: [],
  draw(ctx, t, s, f) {
    const tt = stepT(t, 12), fr = Math.floor(t * 12);
    const b = Math.abs(Math.sin(Math.PI * tt / BEAT)), sw = Math.sin(Math.PI * tt / BEAT);
    // 构图：竖屏沿用原版；横屏地面压低，树在左、花在右、角色居中，音符跟着角色走
    const P = LAND ? { dy: -290, tr: 330, fl: [1400, 130], ch: 960, nt: 800 } : { dy: 0, tr: 170, fl: [760, 110], ch: 540, nt: 380 };
    ctx.save(); ctx.translate((hash1(fr * 3) - .5) * 8, (hash1(fr * 5) - .5) * 8);
    ctx.fillStyle = '#E4E0D6'; ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.fillStyle = '#B9B5AA'; ctx.beginPath(); ctx.moveTo(-20, 1150 + P.dy); for (let x = -20; x <= W + 20; x += 20) ctx.lineTo(x, 1110 + P.dy + Math.sin(x * .006 + 1) * 50); ctx.lineTo(W + 20, H); ctx.lineTo(-20, H); ctx.fill();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111';
    // swaying tree with face
    ctx.save(); ctx.translate(P.tr, 1150 + P.dy); ctx.rotate(sw * .12);
    ctx.lineWidth = 40; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sw * 40, -250, 0, -420); ctx.stroke();
    ctx.fillStyle = '#2A2A2A'; ctx.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; ctx.arc(Math.cos(a) * 110, -520 + Math.sin(a) * 90, 80, 0, TAU); } ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-30, -540, 20, 30, 0, 0, TAU); ctx.ellipse(30, -540, 20, 30, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(-26, -532, 9, 15, 0, 0, TAU); ctx.ellipse(34, -532, 9, 15, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, -500, 40, .3, Math.PI - .3); ctx.stroke(); ctx.restore();
    // flowers
    for (let k = 0; k < 3; k++) {
      const x = P.fl[0] + k * P.fl[1], sq = 1 - .15 * Math.abs(Math.sin(Math.PI * tt / BEAT + k)); ctx.save(); ctx.translate(x, 1180 + P.dy); ctx.rotate(Math.sin(Math.PI * tt / BEAT + k) * .25); ctx.scale(1, sq);
      ctx.strokeStyle = '#111'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -80, 0, -160); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.lineWidth = 5; for (let p = 0; p < 6; p++) { const a = p / 6 * TAU; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 34, -180 + Math.sin(a) * 34, 22, 14, a, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, -180, 24, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-8, -184, 5, 0, TAU); ctx.arc(8, -184, 5, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // character
    ctx.save(); ctx.translate(P.ch, 940 + P.dy - b * 50); ctx.rotate(sw * .08);
    const hose = (x0, y0, x1, y1, bend) => { ctx.lineWidth = 14; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + bend, (y0 + y1) / 2 - Math.abs(bend) * .3, x1, y1); ctx.stroke(); };
    const glove = (x, y) => { ctx.fillStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 30, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 10, y - 12); ctx.lineTo(x - 10, y + 6); ctx.moveTo(x + 4, y - 14); ctx.lineTo(x + 4, y + 6); ctx.stroke(); };
    const shoe = (x, y, d) => { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(x + d * 26, y, 50, 26, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x + d * 40, y - 10, 12, 6, 0, 0, TAU); ctx.fill(); };
    const lk = sw * 60;
    hose(-35, 90, -90 - lk, 250 + b * 50, -40); hose(35, 90, 90 - lk, 250 + b * 50 * (1 - Math.abs(sw)), 40);
    shoe(-90 - lk, 262 + b * 50, -1); shoe(90 - lk, 262 + b * 50 * (1 - Math.abs(sw)), 1);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 20, 95, 115, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 80, 80, 40, 0, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(-26, 70, 9, 0, TAU); ctx.arc(26, 70, 9, 0, TAU); ctx.fillStyle = '#111'; ctx.fill();
    const ha = sw * 1.2;
    hose(-80, -40, -220, -180 + ha * 90, 60); hose(80, -40, 220, -180 - ha * 90, -60);
    glove(-220, -180 + ha * 90); glove(220, -180 - ha * 90);
    // head
    ctx.save(); ctx.translate(0, -175); ctx.rotate(-sw * .15);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 105, 0, TAU); ctx.fill();
    ctx.fillStyle = '#EDE6D6'; ctx.beginPath(); ctx.ellipse(0, 30, 82, 66, 0, 0, TAU); ctx.moveTo(-60, -10); ctx.ellipse(-28, -20, 30, 40, 0, 0, TAU); ctx.ellipse(28, -20, 30, 40, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; [-26, 26].forEach(x => { ctx.beginPath(); ctx.ellipse(x, -24, 20, 34, 0, 0, TAU); ctx.fill(); });
    ctx.fillStyle = '#111'; [-22, 30].forEach(x => { ctx.beginPath(); ctx.moveTo(x, -18); ctx.ellipse(x, -18, 10, 20, 0, -Math.PI * .35, Math.PI * 1.35); ctx.fill(); });
    ctx.beginPath(); ctx.ellipse(0, 18, 20, 13, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-58, 38); ctx.quadraticCurveTo(0, 110, 58, 38); ctx.quadraticCurveTo(0, 70, -58, 38); ctx.fill();
    ctx.fillStyle = '#9A9A9A'; ctx.beginPath(); ctx.ellipse(0, 72, 18, 10, 0, 0, Math.PI); ctx.fill();
    // hat
    ctx.save(); ctx.translate(20, -95); ctx.rotate(.25 + sw * .15); ctx.translate(0, -b * 20);
    ctx.fillStyle = '#111'; ctx.fillRect(-70, -8, 140, 16); ctx.fillRect(-45, -90, 90, 86); ctx.fillStyle = '#fff'; ctx.fillRect(-45, -30, 90, 14); ctx.restore();
    ctx.restore(); ctx.restore();
    // music notes
    for (let k = 0; k < 4; k++) {
      const ph = (tt * .6 + k * .25) % 1, x = P.nt + k * 120 + Math.sin(ph * 8 + k) * 30, y = 700 + P.dy - ph * 400;
      ctx.globalAlpha = 1 - ph; ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(x, y, 20, 14, -.4, 0, TAU); ctx.fill(); ctx.fillRect(x + 14, y - 80, 7, 80); ctx.fillRect(x + 14, y - 80, 36, 10); ctx.globalAlpha = 1;
    }
    ctx.restore();
    // film artefacts
    grain(ctx, fr, .55);
    const R = mulberry32(fr * 17 + 3);
    for (let k = 0; k < 3; k++) { if (R() < .6) { const x = R() * W; ctx.fillStyle = `rgba(20,20,20,${.25 + R() * .4})`; ctx.fillRect(x, 0, 2 + R() * 2, H); } }
    for (let k = 0; k < 10; k++) { ctx.fillStyle = R() < .5 ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(R() * W, R() * H, 1 + R() * 5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = `rgba(0,0,0,${hash1(fr) * .12})`; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1050); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.95)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
});
