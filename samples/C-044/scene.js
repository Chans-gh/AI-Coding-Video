// C-044 暗色科技发布会：近黑渐变加发丝网格，界面卡片吸附进场、一道扫光、柱状图长起，最后一个巨大数字
// 由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-044', name: '暗色科技发布会', dur: 3, still: 2.6,
  fonts: ["700 40px 'Noto Sans SC'", "380px 'Bebas Neue'"],
  text: '渲染速度对比上一代',
  init() { return { L: LAND ? { glow: [560, 520], cx: 140, cy: [360, 300], num: [1430, 720], cap: 800, ng: [360, 720] } : { glow: [540, 620], cx: 180, cy: [420, 360], num: [540, 1140], cap: 1215, ng: [780, 1150] } }; },
  draw(ctx, t, s) {
    const L = s.L;
    const g = ctx.createRadialGradient(W / 2, H * .37, 50, W / 2, H * .42, LONG * .68); g.addColorStop(0, '#16152A'); g.addColorStop(1, '#05050A'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 60) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
    const acc = '#8B7BFF';
    const gl = ctx.createRadialGradient(L.glow[0], L.glow[1], 0, L.glow[0], L.glow[1], 500); gl.addColorStop(0, 'rgba(139,123,255,.28)'); gl.addColorStop(1, 'rgba(139,123,255,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    // card snaps into grid
    const e = eOutExpo(inv(0, .7, t)), cx = L.cx, cy = lerp(L.cy[0], L.cy[1], e), cw = 720, ch = 480;
    ctx.save(); ctx.globalAlpha = e; rr(ctx, cx, cy, cw, ch, 28);
    const cg = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch); cg.addColorStop(0, 'rgba(255,255,255,.10)'); cg.addColorStop(1, 'rgba(255,255,255,.03)'); ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.clip();
    [0, 1, 2].forEach(i => { ctx.fillStyle = ['#FF5F57', '#FEBC2E', '#28C840'][i]; ctx.beginPath(); ctx.arc(cx + 40 + i * 30, cy + 40, 8, 0, TAU); ctx.fill(); });
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = "700 30px 'Noto Sans SC'"; ctx.fillText('Render Queue', cx + 40, cy + 110);
    const bars = [.35, .5, .42, .7, .62, .88, 1]; bars.forEach((b, i) => { const h = 220 * b * eOutCubic(inv(.4 + i * .06, .9 + i * .06, t)); const bg2 = ctx.createLinearGradient(0, cy + 420 - h, 0, cy + 420); bg2.addColorStop(0, acc); bg2.addColorStop(1, 'rgba(139,123,255,.15)'); ctx.fillStyle = bg2; rr(ctx, cx + 40 + i * 94, cy + 420 - h, 60, h, 10); ctx.fill(); });
    // light sweep
    const sx = lerp(-400, 1400, inv(.3, 1.3, t)); const sg = ctx.createLinearGradient(sx - 200, 0, sx + 200, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.save(); ctx.transform(1, 0, -.4, 1, 0, 0); ctx.fillRect(sx - 200, cy, 400 + ch, ch); ctx.restore();
    ctx.restore();
    // big number
    const n = inv(1.3, 2.4, t); if (n > 0) {
      const v = lerp(1, 10, eOutExpo(n)); ctx.textAlign = 'center';
      const ng = ctx.createLinearGradient(0, L.ng[0], 0, L.ng[1]); ng.addColorStop(0, '#FFFFFF'); ng.addColorStop(1, acc);
      ctx.save(); ctx.globalAlpha = smooth(0, .3, n); ctx.shadowColor = 'rgba(139,123,255,.8)'; ctx.shadowBlur = 60; ctx.fillStyle = ng; ctx.font = "380px 'Bebas Neue'"; ctx.fillText((v >= 9.95 ? '10' : v.toFixed(1)) + '×', L.num[0], L.num[1]); ctx.restore();
      ctx.globalAlpha = smooth(.5, .9, n); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = "700 40px 'Noto Sans SC'"; ctx.fillText('渲染速度 · 对比上一代', L.num[0], L.cap); ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
  }
});
