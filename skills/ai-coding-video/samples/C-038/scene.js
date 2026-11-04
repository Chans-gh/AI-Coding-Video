// C-038 科普扁平：饱和渐变、圆润扁平造型、边缘高光和长投影，前中后景按不同速度视差移动
// 由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-038', name: '科普扁平', dur: 3, still: 1.6,
  fonts: [],
  init() { const R = mulberry32(27), st = []; for (let i = 0; i < 160; i++) st.push([R() * W, R() * H, R() * 2.5 + .5, R()]); return { st }; },
  draw(ctx, t, s) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120C3A'); g.addColorStop(.6, '#2D2A8C'); g.addColorStop(1, '#4B3BB0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const [x, y, r, p] of s.st) { ctx.fillStyle = `rgba(255,255,255,${.3 + .7 * Math.abs(Math.sin(t * 2 + p * 30))})`; ctx.beginPath(); ctx.arc((x - t * 8) % W, y, r, 0, TAU); ctx.fill(); }
    // far planet
    ctx.fillStyle = '#6C5CE7'; ctx.beginPath(); ctx.arc((LAND ? 300 : 230) - t * 10, LAND ? 220 : 520, 70, 0, TAU); ctx.fill(); ctx.fillStyle = '#8E7CF7'; ctx.beginPath(); ctx.arc((LAND ? 285 : 215) - t * 10, LAND ? 205 : 505, 50, 0, TAU); ctx.fill();
    // big planet
    const px = (LAND ? 1250 : 640) - t * 22, py = LAND ? 600 : 1080, pr = 330;
    ctx.save(); ctx.translate(px, py);
    const ring = (front) => { ctx.save(); ctx.rotate(-.35); ctx.beginPath(); ctx.ellipse(0, 0, 520, 110, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.lineWidth = 34; ctx.strokeStyle = '#FFD27A'; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = '#FF9F5A'; ctx.beginPath(); ctx.ellipse(0, 0, 470, 96, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke(); ctx.restore(); };
    ring(false);
    const pg = ctx.createLinearGradient(-pr, -pr, pr, pr); pg.addColorStop(0, '#FFB23F'); pg.addColorStop(1, '#E8466E'); ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, pr, 0, TAU); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(160,30,80,.35)'; [[-100, -60, 60], [80, 90, 44], [-30, 170, 30], [150, -140, 36]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x + t * 12, y, r, 0, TAU); ctx.fill(); });
    ctx.fillStyle = 'rgba(40,10,60,.38)'; ctx.beginPath(); ctx.arc(120, 120, pr * 1.02, 0, TAU); ctx.arc(-40, -40, pr * 1.06, 0, TAU, true); ctx.fill('evenodd');
    ctx.restore();
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255,240,200,.8)'; ctx.beginPath(); ctx.arc(0, 0, pr - 6, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
    ring(true); ctx.restore();
    // orbiting moon
    const ma = t * 1.1 - .4, mx = px + Math.cos(ma) * 560, my = py - 200 + Math.sin(ma) * 140;
    ctx.fillStyle = '#3FD0C9'; ctx.beginPath(); ctx.arc(mx, my, 48, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,40,80,.35)'; ctx.beginPath(); ctx.arc(mx + 14, my + 14, 48, 0, TAU); ctx.arc(mx - 4, my - 4, 50, 0, TAU, true); ctx.fill('evenodd');
    // rocket
    const rt = t / 3, R0 = LAND ? [180, 1000] : [120, 1200], R1 = LAND ? [820, 160] : [900, 360], rx = lerp(R0[0], R1[0], rt), ry = lerp(R0[1], R1[1], rt);
    for (let k = 0; k < 18; k++) { const b = k / 18; ctx.fillStyle = `rgba(255,255,255,${.35 * (1 - b)})`; ctx.beginPath(); ctx.arc(rx - (b * 300) * .68 + Math.sin(k * 3 + t * 20) * 6, ry + b * 300 * .73, 10 + b * 26, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.translate(rx, ry); ctx.rotate(Math.atan2(R1[1] - R0[1], R1[0] - R0[0]) + Math.PI / 2);
    ctx.fillStyle = '#FF6B6B'; ctx.beginPath(); ctx.moveTo(-34, 40); ctx.lineTo(-64, 90); ctx.lineTo(-30, 80); ctx.fill(); ctx.beginPath(); ctx.moveTo(34, 40); ctx.lineTo(64, 90); ctx.lineTo(30, 80); ctx.fill();
    const fl = 1 + .25 * Math.sin(t * 50); ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.moveTo(-18, 85); ctx.quadraticCurveTo(0, 85 + 90 * fl, 18, 85); ctx.fill(); ctx.fillStyle = '#FF8C42'; ctx.beginPath(); ctx.moveTo(-10, 85); ctx.quadraticCurveTo(0, 85 + 50 * fl, 10, 85); ctx.fill();
    ctx.fillStyle = '#F4F4FF'; ctx.beginPath(); ctx.moveTo(0, -100); ctx.bezierCurveTo(45, -60, 42, 40, 32, 88); ctx.lineTo(-32, 88); ctx.bezierCurveTo(-42, 40, -45, -60, 0, -100); ctx.fill();
    ctx.fillStyle = '#C9CBEF'; ctx.beginPath(); ctx.moveTo(0, -100); ctx.bezierCurveTo(45, -60, 42, 40, 32, 88); ctx.lineTo(8, 88); ctx.bezierCurveTo(20, 30, 20, -50, 0, -100); ctx.fill();
    ctx.fillStyle = '#3FD0C9'; ctx.beginPath(); ctx.arc(0, -20, 18, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6C5CE7'; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    // foreground asteroids with long shadows
    (LAND ? [[120, 430, 46], [1650, 900, 60], [760, 820, 30]] : [[140, 400, 46], [930, 1180, 60], [860, 520, 30]]).forEach(([x, y, r], k) => {
      const xx = x - t * (40 + k * 20), yy = y + Math.sin(t + k) * 10;
      ctx.fillStyle = 'rgba(10,5,40,.35)'; ctx.beginPath(); ctx.moveTo(xx - r * .7, yy + r * .7); ctx.lineTo(xx + r * 3, yy + r * 4); ctx.lineTo(xx + r * 4, yy + r * 3); ctx.lineTo(xx + r * .7, yy - r * .7); ctx.fill();
      ctx.fillStyle = '#8B7FD6'; ctx.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + t * .5; const rr = r * (.8 + .25 * hash1(i + k * 9)); ctx.lineTo(xx + Math.cos(a) * rr, yy + Math.sin(a) * rr); } ctx.fill();
      ctx.fillStyle = '#B3A8F5'; ctx.beginPath(); ctx.arc(xx - r * .25, yy - r * .25, r * .35, 0, TAU); ctx.fill();
    });
  }
});
