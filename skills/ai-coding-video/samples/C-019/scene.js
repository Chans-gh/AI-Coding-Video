// C-019 Risograph 孔版印刷：黄、粉、蓝三版分别画好，渐变先换算成网点（每格一个圆，面积对应浓度），
// 每版抠出随机缺墨点、各自错位几像素再正片叠底，像三次过机没对准。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-019', name: 'Risograph 孔版印刷', dur: 3, still: 2.4,
  fonts: ["40px 'ZCOOL KuaiLe'", "40px 'Bebas Neue'"],
  text: '早安GOOD MORNING',
  init() { return { paper: makePaper('#F4EDE0', { seed: 221, grain: 22, blot: 6 }), d: mk(W / 12, H / 12), L: mk(W, H) }; },
  draw(ctx, t, s, f) {
    const tt = stepT(t, 8), st = Math.floor(t * 8);
    ctx.drawImage(s.paper, 0, 0, W, H);
    const inks = [['#FFE800', 0], ['#FF48B0', 1], ['#0078BF', 2]], GW = W / 12, GH = H / 12;
    // 构图：竖屏沿用原版（太阳右上、「早安」居中、杯子和英文在下）；横屏「早安」放左边，杯子和英文放右下，太阳在右上
    const P = LAND ? { sun: [1480, 430, 290], pk: [420, 1080], bl: [0, 480], zh: [620, 650], cup: [1230, 740], en: [1420, 770] }
                   : { sun: [720, 920, 760], pk: [900, 1700], bl: [450, 1000], zh: [520, 1100], cup: [430, 1260], en: [660, 1300] };
    const sunY = lerp(P.sun[1], P.sun[2], eOutCubic(tt / 2.5));
    for (const [ink, k] of inks) {
      const d = s.d.getContext('2d'); d.clearRect(0, 0, GW, GH); d.save(); d.scale(1 / 12, 1 / 12); d.fillStyle = '#000';
      const L = s.L.getContext('2d'); L.clearRect(0, 0, W, H); L.fillStyle = ink; L.strokeStyle = ink;
      if (k === 0) { const sx = P.sun[0], sy = sunY; const g = d.createRadialGradient(sx, sy, 20, sx, sy, 260); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.7, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g; d.fillRect(0, 0, W, H); }
      if (k === 1) { const g = d.createLinearGradient(0, P.pk[0], 0, P.pk[1]); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.9)'); d.fillStyle = g; d.fillRect(0, P.pk[0], W, H); }
      if (k === 2) { const g = d.createLinearGradient(0, P.bl[0], 0, P.bl[1]); g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g; d.fillRect(0, 0, W, P.bl[1]); }
      d.restore();
      const px = d.getImageData(0, 0, GW, GH).data;
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const a = px[(y * GW + x) * 4 + 3] / 255; if (a > .03) { L.beginPath(); L.arc(x * 12 + 6 + (y % 2) * 6, y * 12 + 6, Math.sqrt(a) * 7.4, 0, TAU); L.fill(); } }
      if (k === 1) { L.font = "330px 'ZCOOL KuaiLe'"; L.textAlign = 'center'; L.fillText('早安', ...P.zh); }
      if (k === 2) {
        L.save(); L.translate(...P.cup); L.beginPath(); L.roundRect(-150, -90, 260, 250, [0, 0, 70, 70]); L.fill(); L.lineWidth = 30; L.beginPath(); L.arc(120, 20, 55, -1.2, 1.2); L.stroke();
        L.lineWidth = 16; L.lineCap = 'round'; for (let j = 0; j < 3; j++) { L.beginPath(); for (let y = 0; y < 170; y += 8) L.lineTo(-80 + j * 70 + Math.sin(y * .06 + tt * 7 + j) * 16, -120 - y); L.stroke(); }
        L.restore(); L.font = "88px 'Bebas Neue'"; L.textAlign = 'left'; L.fillText('GOOD', ...P.en); L.fillText('MORNING', P.en[0], P.en[1] + 80);
      }
      if (k === 0) { L.beginPath(); L.arc(P.sun[0], sunY, 150, 0, TAU); L.fill(); }
      // ink speckle
      L.save(); L.globalCompositeOperation = 'destination-out'; const R = mulberry32(k * 99 + st % 3); for (let i = 0; i < 1600; i++) { L.fillRect(R() * W, R() * H, 2 + R() * 3, 2 + R() * 3); } L.restore();
      const ox = (hash2(st, k * 7) - .5) * 14, oy = (hash2(k * 5, st) - .5) * 14;
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .92; ctx.drawImage(s.L, ox, oy); ctx.restore();
    }
    grain(ctx, st, .35);
  }
});
