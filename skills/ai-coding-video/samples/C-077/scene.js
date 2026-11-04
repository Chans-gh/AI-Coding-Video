// C-077 生成式音乐可视化：画面由一张节拍表驱动，每个半拍一颗彩球飞到圆环上击中，炸出波纹和光束；
// 120 根放射柱和万花筒线条的幅度跟着包络涨落，全部用叠加混合。由 opus40 的同名场景改写，横屏重新构图。
const VIZ_HITS = Array.from({ length: 15 }, (_, k) => (k + 1) * BEAT / 2);
scene({
  id: 'C-077', name: '生成式抽象 / 音乐可视化', dur: 3, still: 2.4,
  fonts: [],
  draw(ctx, t) {
    ctx.fillStyle = '#05040A'; ctx.fillRect(0, 0, W, H);
    // 构图：竖屏沿用原版；横屏圆环居中、半径收小一点，放射柱不出画
    const cx = W / 2, cy = LAND ? H / 2 : 940, R0 = LAND ? 290 : 330;
    let env = 0; for (const h of VIZ_HITS) { const d = t - h; if (d >= 0) env += Math.exp(-d / .18); }
    const beatPulse = Math.exp(-(t % BEAT) / .1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // kaleidoscope
    ctx.translate(cx, cy);
    for (let k = 0; k < 12; k++) {
      ctx.save(); ctx.rotate(k / 12 * TAU + t * .4); const hue = (t * 60 + k * 30) % 360;
      ctx.strokeStyle = `hsla(${hue},90%,60%,.35)`; ctx.lineWidth = 2;
      ctx.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40; ctx.lineTo(u * 700, Math.sin(u * 12 + t * 3) * 60 * u * (1 + env * .4)); } ctx.stroke();
      ctx.restore();
    }
    // radial bars
    for (let k = 0; k < 120; k++) {
      const a = k / 120 * TAU, amp = 20 + 90 * Math.abs(Math.sin(k * .7 + t * 4)) * (.3 + env * .5) + beatPulse * 30;
      ctx.strokeStyle = `hsla(${(k * 3 + t * 90) % 360},100%,62%,.8)`; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * (R0 + 14), Math.sin(a) * (R0 + 14)); ctx.lineTo(Math.cos(a) * (R0 + 14 + amp), Math.sin(a) * (R0 + 14 + amp)); ctx.stroke();
    }
    ctx.strokeStyle = `rgba(255,255,255,${.5 + beatPulse * .5})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, R0, 0, TAU); ctx.stroke();
    // balls, beams, ripples
    VIZ_HITS.forEach((h, k) => {
      const a = k * 2.39996 + .5, hue = (k * 47) % 360, x = Math.cos(a) * R0, y = Math.sin(a) * R0;
      const d = t - h;
      if (d < 0 && d > -BEAT / 2) { const u = 1 + d / (BEAT / 2); const r = R0 * u * u; ctx.fillStyle = `hsl(${hue},100%,70%)`; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 16, 0, TAU); ctx.fill(); }
      if (d >= 0 && d < .7) {
        const e = d / .7; ctx.strokeStyle = `hsla(${hue},100%,65%,${1 - e})`; ctx.lineWidth = 10 * (1 - e) + 2; ctx.beginPath(); ctx.arc(x, y, 20 + e * 260, 0, TAU); ctx.stroke();
        ctx.strokeStyle = `hsla(${hue},100%,80%,${(1 - e) * .8})`; ctx.lineWidth = 8 * (1 - e); ctx.beginPath(); ctx.moveTo(x * -1, y * -1); ctx.lineTo(x * 3, y * 3); ctx.stroke();
      }
    });
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 200); cg.addColorStop(0, `rgba(255,120,200,${.35 + env * .2})`); cg.addColorStop(1, 'rgba(255,120,200,0)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, 200, 0, TAU); ctx.fill();
    ctx.restore();
  }
});
