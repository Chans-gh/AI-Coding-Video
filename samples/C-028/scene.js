// C-028 黏土定格：每个物体是一团平滑闭合曲线，加径向高光、边缘暗部和指纹圈做出黏土质感；
// 按每秒 12 格量化，每格给轮廓点重新抖一下，像逐格重捏，小家伙压扁、弹起、落地。由 opus40 的同名场景改写，横屏重新构图。
function clayBlob(ctx, pts, color, fr, seed, light = [-.35, -.45]) {
  const j = pts.map((p, i) => [p[0] + (hash2(fr + seed, i) - .5) * 3.5, p[1] + (hash2(i, fr + seed * 3) - .5) * 3.5]);
  const xs = j.map(p => p[0]), ys = j.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = Math.max(x1 - x0, y1 - y0) / 2;
  const path = new Path2D(); j.forEach((p, i) => { const q = j[(i + 1) % j.length]; const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; if (i === 0) path.moveTo(m[0], m[1]); else path.quadraticCurveTo(p[0], p[1], m[0], m[1]); });
  const p0 = j[0], q0 = j[1]; path.quadraticCurveTo(p0[0], p0[1], (p0[0] + q0[0]) / 2, (p0[1] + q0[1]) / 2); path.closePath();
  ctx.fillStyle = color; ctx.fill(path);
  ctx.save(); ctx.clip(path);
  const g = ctx.createRadialGradient(cx + light[0] * r, cy + light[1] * r, r * .05, cx, cy, r * 1.3);
  g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(.8, 'rgba(60,20,10,.12)'); g.addColorStop(1, 'rgba(60,20,10,.35)');
  ctx.fillStyle = g; ctx.fillRect(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20);
  ctx.strokeStyle = 'rgba(40,20,10,.10)'; ctx.lineWidth = 1.5; const fx = cx + (hash1(seed) - .5) * r, fy = cy + (hash1(seed + 1) - .5) * r;
  for (let k = 1; k < 9; k++) { ctx.beginPath(); ctx.ellipse(fx, fy, k * 6, k * 4.5, seed, .3, 5.6); ctx.stroke(); }
  ctx.restore();
  return path;
}
function blobPts(cx, cy, rx, ry, n = 22, wob = .04, seed = 0) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; const k = 1 + wob * Math.sin(a * 3 + seed) + wob * .5 * Math.sin(a * 5 + seed * 2); p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return p; }
scene({
  id: 'C-028', name: '黏土定格', dur: 3, still: 2.4,
  fonts: [],
  draw(ctx, t, s, f) {
    const tt = stepT(t, 12), fr = Math.floor(t * 12);
    // 构图：竖屏沿用原版；横屏地面压低到画面下部，太阳去右上、云去左上，两朵花分到两边，小家伙在中间跳
    const P = LAND ? { sun: [1500, 260], cl: [[380, 230, 1], [640, 340, .7]], gy: 820, fl: [[360, 790], [1560, 780]], hx: 960, dy: -310 }
                   : { sun: [820, 470], cl: [[250, 430, 1], [420, 560, .7]], gy: 1130, fl: [[170, 1100], [930, 1090]], hx: 540, dy: 0 };
    const [ux, uy] = P.sun;
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#F6E2CC'); bg.addColorStop(1, '#E9B59A'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // sun + rays
    ctx.save(); ctx.translate(ux, uy); ctx.rotate(tt * .5);
    for (let k = 0; k < 9; k++) { ctx.save(); ctx.rotate(k / 9 * TAU); clayBlob(ctx, blobPts(0, -150, 18, 34, 12, .08, k), '#F7B544', fr, 20 + k); ctx.restore(); }
    ctx.restore(); clayBlob(ctx, blobPts(ux, uy, 100, 100, 26, .03, 1), '#F59E42', fr, 3);
    ctx.fillStyle = '#6B3A1E'; ctx.beginPath(); ctx.arc(ux - 30, uy - 10, 9, 0, TAU); ctx.arc(ux + 30, uy - 10, 9, 0, TAU); ctx.fill();
    // clouds
    P.cl.forEach(([x, y, sc], k) => { const dx = Math.sin(tt * .8 + k) * 20; for (let i = 0; i < 3; i++) clayBlob(ctx, blobPts(x + dx + (i - 1) * 60 * sc, y - (i === 1 ? 26 : 0) * sc, 62 * sc, 48 * sc, 16, .05, i), '#FBF6EE', fr, 40 + i + k * 5); });
    // ground
    ctx.save(); ctx.shadowColor = 'rgba(80,30,10,.25)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = -6;
    const gp = []; for (let x = -60; x <= W + 60; x += 60) gp.push([x, P.gy + Math.sin(x * .006) * 40]); gp.push([W + 60, 1900], [-60, 1900]);
    clayBlob(ctx, gp, '#7FBF6A', fr, 7, [-.2, -.9]); ctx.restore();
    // flowers
    P.fl.forEach(([x, y], k) => {
      ctx.strokeStyle = '#4E9A45'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.quadraticCurveTo(x + 20, y - 60, x, y - 120 + Math.sin(tt * 4 + k) * 6); ctx.stroke();
      for (let p = 0; p < 5; p++) { const a = p / 5 * TAU + k; clayBlob(ctx, blobPts(x + Math.cos(a) * 40, y - 130 + Math.sin(a) * 40, 30, 30, 12, .06, p), k ? '#9B8CE8' : '#F27D72', fr, 60 + p + k * 7); }
      clayBlob(ctx, blobPts(x, y - 130, 24, 24, 12, .04, 3), '#FFD24D', fr, 70 + k);
    });
    // hero hop: 2 beats per hop
    const ph = (tt % (BEAT * 2)) / (BEAT * 2), air = Math.sin(ph * Math.PI), land = ph < .15 ? 1 - ph / .15 : 0;
    const hx = P.hx + Math.sin(tt * 1.2) * 60, hy = 1010 + P.dy - air * 190;
    const sx = 1 + .18 * land - .08 * air, sy = 1 - .2 * land + .12 * air;
    ctx.fillStyle = `rgba(60,40,20,${.28 - air * .15})`; ctx.beginPath(); ctx.ellipse(hx, 1140 + P.dy, 130 * (1 - air * .35), 26, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(hx, hy); ctx.scale(sx, sy);
    clayBlob(ctx, blobPts(-60, 118, 40, 22, 12), '#E0707E', fr, 80); clayBlob(ctx, blobPts(60, 118, 40, 22, 12), '#E0707E', fr, 81);
    clayBlob(ctx, blobPts(0, 0, 150, 135, 30, .03, 5), '#F08BA0', fr, 9);
    [[-52, -20], [52, -20]].forEach(([x, y], k) => { clayBlob(ctx, blobPts(x, y, 34, 38, 14), '#FFFFFF', fr, 90 + k); clayBlob(ctx, blobPts(x + 6, y + 8, 16, 18, 10), '#2B1B1B', fr, 95 + k); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 12, y + 2, 5, 0, TAU); ctx.fill(); });
    clayBlob(ctx, blobPts(-95, 40, 24, 14, 10), '#F5657E', fr, 100); clayBlob(ctx, blobPts(95, 40, 24, 14, 10), '#F5657E', fr, 101);
    ctx.strokeStyle = '#5A2230'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 40, 26, .3, Math.PI - .3); ctx.stroke();
    ctx.restore();
    // warm studio light falloff
    vignette(ctx, .35, .4, '90,40,20');
  }
});
