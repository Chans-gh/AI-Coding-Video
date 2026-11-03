// C-015 窗花剪纸：整张红纸先画好再用 destination-out 镂空出对称纹样，扇形裁切模拟展开，洞里透出暖光
// 由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-015', name: '窗花剪纸', dur: 3, still: 2.4,
  fonts: ["900 150px 'Noto Serif SC'"],
  text: '福',
  init() {
    const pc = mk(900, 900), g = pc.getContext('2d');
    g.translate(450, 450); g.fillStyle = '#D42A20'; g.beginPath(); g.arc(0, 0, 420, 0, TAU); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    const N = 16;
    for (let k = 0; k < N; k++) {
      g.save(); g.rotate(k / N * TAU);
      // teardrops
      g.beginPath(); g.moveTo(0, -300); g.bezierCurveTo(40, -330, 30, -380, 0, -395); g.bezierCurveTo(-30, -380, -40, -330, 0, -300); g.fill();
      // sawtooth edge
      for (let j = 0; j < 4; j++) { const a = (j / 4 - .5) * (TAU / N); g.save(); g.rotate(a); g.beginPath(); g.moveTo(-10, -421); g.lineTo(0, -404); g.lineTo(10, -421); g.fill(); g.restore(); }
      // crescents
      g.save(); g.rotate(Math.PI / N); g.beginPath(); g.arc(0, -250, 30, 0, TAU); g.fill(); g.restore();
      // petals
      g.beginPath(); g.ellipse(0, -185, 16, 48, 0, 0, TAU); g.fill();
      g.save(); g.rotate(Math.PI / N); g.beginPath(); g.arc(0, -140, 11, 0, TAU); g.fill(); g.restore();
      g.restore();
    }
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#D42A20';
    for (let k = 0; k < N; k++) { g.save(); g.rotate((k + .5) / N * TAU); g.beginPath(); g.arc(0, -250, 18, 0, TAU); g.fill(); g.restore(); }
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, 0, 112, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#D42A20'; g.lineWidth = 14; g.strokeStyle = '#D42A20'; g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.stroke();
    g.font = "900 150px 'Noto Serif SC'"; g.textAlign = 'center'; g.fillText('福', 0, 52);
    const R = mulberry32(10), sn = []; for (let i = 0; i < 70; i++) sn.push([R() * W, R() * H, 2 + R() * 4, R()]);
    return { pc, paper: makePaper('#1C2A4E', { seed: 101, blot: 14, fiber: .9 }), sn };
  },
  draw(ctx, t, s) {
    ctx.drawImage(s.paper, 0, 0, W, H);
    const cx = W / 2, cy = LAND ? H / 2 : 790, glow = smooth(.9, 2.0, t);
    const unf = eInOutCubic(inv(0, 1.05, t)), ang = lerp(TAU / 16, TAU, unf);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI / 2 - ang / 2 + Math.PI / 2 * 0);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 470, -Math.PI / 2 - ang / 2, -Math.PI / 2 + ang / 2); ctx.closePath(); ctx.restore();
    const clipPath = new Path2D(); clipPath.moveTo(cx, cy); clipPath.arc(cx, cy, 470, -Math.PI / 2 - ang / 2, -Math.PI / 2 + ang / 2); clipPath.closePath();
    // glow behind
    if (glow > 0) { ctx.save(); ctx.clip(clipPath); const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 440); g.addColorStop(0, `rgba(255,214,120,${glow})`); g.addColorStop(.7, `rgba(255,150,60,${glow * .85})`); g.addColorStop(1, `rgba(255,120,40,${glow * .4})`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 425, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.clip(clipPath);
    const sc = lerp(.92, 1, eOutCubic(t / 1.2)); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.rotate(Math.sin(t * .8) * .02);
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 18;
    ctx.drawImage(s.pc, -450, -450); ctx.restore();
    // outer glow halo
    if (glow > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(cx, cy, 380, cx, cy, 640); g.addColorStop(0, `rgba(255,140,60,${.35 * glow})`); g.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // gold flecks drifting
    for (const [x, y, r, p] of s.sn) { const yy = (y + t * 60 * (p + .4)) % H; ctx.fillStyle = `rgba(255,210,120,${.3 + .5 * Math.abs(Math.sin(t * 3 + p * 20))})`; ctx.beginPath(); ctx.arc(x + Math.sin(t + p * 8) * 16, yy, r, 0, TAU); ctx.fill(); }
    // corner cuts
    ctx.save(); ctx.fillStyle = '#C8261C';
    [[0, H], [W, H]].forEach(([x, y], i) => { ctx.save(); ctx.translate(x, y); ctx.scale(i ? -1 : 1, -1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(300, 0); ctx.quadraticCurveTo(120, 60, 0, 300); ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(40 + k * 36, 40 + (4 - k) * 8, 12, 0, TAU); ctx.fill(); } ctx.globalCompositeOperation = 'source-over'; ctx.restore(); });
    ctx.restore();
  }
});
