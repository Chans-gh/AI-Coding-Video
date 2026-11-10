// P3 整片：进度条分三格，跟着第一句的逐字进度填满，第二句打勾；收尾淡到底色
scene({
  id: 'P3', name: '整片', needs: ['common.js'], fonts: ["700 48px 'Noto Sans SC'"],
  text: '分段渲染接片自检响度黑帧',
  draw(ctx, t) {
    backdrop(ctx, t);
    const a = say(0), b = say(1), labels = ['分段渲染', '接片', '自检'];
    const bw = (LAND ? 1200 : 860) * U, bh = 90 * U, x0 = W / 2 - bw / 2, y0 = H * .4;
    const fill = sayP(0, t) * 2 + inv(b.t0, b.t0 + 1, t);
    labels.forEach((l, i) => {
      const cw = bw / 3 - 12 * U, x = x0 + i * bw / 3, k = clamp(fill - i);
      ctx.fillStyle = '#161D27'; rr(ctx, x, y0, cw, bh, 14 * U); ctx.fill();
      ctx.fillStyle = BRAND; rr(ctx, x, y0, cw * eOutCubic(k), bh, 14 * U); ctx.fill();
      heading(ctx, l, x + cw / 2, y0 + bh + 60 * U, 40, k >= 1 ? INK : '#6E7F96', 1);
    });
    const c = eOutBack(inv(b.t1 - .7, b.t1 - .1, t));
    if (c > 0) {
      ctx.save(); ctx.translate(W / 2, y0 - 120 * U); ctx.scale(c, c);
      ctx.strokeStyle = GOLD; ctx.lineWidth = 14 * U; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-50 * U, 0); ctx.lineTo(-12 * U, 38 * U); ctx.lineTo(56 * U, -42 * U); ctx.stroke();
      ctx.restore();
    }
    subtitle(ctx, t); edgesFade(ctx, t);
  },
});
