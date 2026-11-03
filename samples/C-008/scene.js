// C-008 一笔画：整幅画（房子、树、牵手的两个人、太阳、飞鸟、爱心）是同一条首尾不断的折线，按长度一点点描出，
// 镜头先贴着笔尖跟拍，最后拉远看全图。由 opus40 的同名场景改写，横屏重新构图。
function oneLinePath() {
  const P = []; const add = (x, y) => P.push([x, y]);
  const seg = (x0, y0, x1, y1, n = 8, wob = 3) => { for (let i = 1; i <= n; i++) { const k = i / n; add(lerp(x0, x1, k) + (noise1(P.length * .7) - .5) * wob, lerp(y0, y1, k) + (noise1(P.length * .7 + 40) - .5) * wob); } };
  const loop = (cx, cy, r, a0, turns, n = 40, ry = r) => { for (let i = 0; i <= n; i++) { const a = a0 + turns * TAU * i / n; add(cx + Math.cos(a) * r, cy + Math.sin(a) * ry); } };
  add(60, 1150); seg(60, 1150, 170, 1150, 4);
  // house
  seg(170, 1150, 170, 960); seg(170, 960, 280, 860); seg(280, 860, 390, 960); seg(390, 960, 170, 960, 6); seg(170, 960, 390, 960, 6);
  seg(390, 960, 390, 1150); seg(390, 1150, 340, 1150, 3); seg(340, 1150, 340, 1060, 4); seg(340, 1060, 290, 1060, 3); seg(290, 1060, 290, 1150, 4);
  seg(290, 1150, 460, 1150, 5);
  // tree
  seg(460, 1150, 470, 990, 6); loop(470, 910, 80, Math.PI / 2, 1.15, 50, 90); seg(P[P.length - 1][0], P[P.length - 1][1], 490, 1150, 6);
  seg(490, 1150, 600, 1150, 4);
  // two people holding hands
  const person = (x) => { seg(x - 30, 1150, x, 1060, 5); seg(x, 1060, x + 30, 1150, 5); seg(x + 30, 1150, x, 1060, 5); seg(x, 1060, x, 980, 4); loop(x, 945, 34, Math.PI / 2, 1, 30); seg(x, 980, x + 60, 1030, 4); };
  person(620); person(740); seg(800, 1030, 740, 980, 3); seg(740, 980, 740, 1060, 3); seg(740, 1060, 770, 1150, 4);
  seg(770, 1150, 1020, 1150, 6);
  // up into the sky: sun spiral + birds + heart
  seg(1020, 1150, 900, 700, 12, 6); for (let i = 0; i <= 70; i++) { const a = i / 70 * TAU * 2.2, r = 20 + i * 1.2; add(860 + Math.cos(a) * r, 560 + Math.sin(a) * r); }
  seg(P[P.length - 1][0], P[P.length - 1][1], 560, 500, 8);
  for (let b = 0; b < 2; b++) { const x = 560 - b * 130, y = 500 + b * 30; for (let i = 0; i <= 16; i++) { const u = i / 16; add(x - u * 90, y - Math.abs(Math.sin(u * Math.PI * 2)) * 30); } }
  const hx = 250, hy = 620; seg(P[P.length - 1][0], P[P.length - 1][1], hx, hy + 60, 6);
  for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU; const x = 16 * Math.pow(Math.sin(a), 3), y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); add(hx + x * 5, hy + y * 5 + 10); }
  return P;
}
scene({
  id: 'C-008', name: '一笔画', dur: 3, still: 2.4,
  fonts: ["40px 'Ma Shan Zheng'"],
  text: '一笔到底',
  init() { const P = oneLinePath(); return { P, L: polyLen(P), paper: makePaper('#FBF8F1', { seed: 401, blot: 6, grain: 12 }) }; },
  draw(ctx, t, s) {
    ctx.drawImage(s.paper, 0, 0, W, H);
    const p = inv(0, 2.45, t), pe = p;
    const zo = eInOutCubic(inv(2.2, 2.85, t)), sc = lerp(2.3, 1, zo);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#161616';
    // find tip
    const probe = mk(1, 1).getContext('2d'); probe.lineWidth = 1; const tip = drawPartial(probe, s.P, pe) || s.P[0];
    const fx = lerp(tip[0], 540, zo), fy = lerp(tip[1], 830, zo);
    // 构图：画本身横宽竖窄，横竖两版用同一条线；竖屏画在中部、题字在下，横屏画居中偏上、题字在画下方
    const [CX, CY, TY] = LAND ? [960, 450, 905] : [540, 780, 1215];
    ctx.save(); ctx.translate(CX, CY); ctx.scale(sc, sc); ctx.translate(-fx, -fy);
    ctx.lineWidth = 5; drawPartial(ctx, s.P, pe);
    if (p < 1) { ctx.fillStyle = '#FF6B4A'; ctx.beginPath(); ctx.arc(tip[0], tip[1], 8, 0, TAU); ctx.fill(); }
    ctx.restore();
    const c = inv(2.6, 2.9, t); if (c > 0) { ctx.fillStyle = `rgba(22,22,22,${c})`; ctx.font = "80px 'Ma Shan Zheng'"; ctx.textAlign = 'center'; ctx.fillText('一笔到底', CX, TY); ctx.textAlign = 'left'; }
  }
});
