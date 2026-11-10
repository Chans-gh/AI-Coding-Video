// P2 配音：每句开始时翻出一张卡（C-044 的卡片翻出做法），卡上的字和字幕同时出
scene({
  id: 'P2', name: '配音', needs: ['common.js'], fonts: ["700 52px 'Noto Sans SC'", "400 34px 'Noto Sans SC'"],
  text: '逐字稿一句一项按段合成切回每句改一句只重配一句123',
  draw(ctx, t) {
    backdrop(ctx, t);
    const cards = [['1', '逐字稿', '一句一项'], ['2', '按段合成', '切回每一句'], ['3', '改一句', '只重配那一句']];
    const cw = LAND ? 480 * U : 760 * U, ch = LAND ? 420 * U : 300 * U, gap = 50 * U;
    cards.forEach(([no, big, small], i) => {
      const s = say(i); const p = eOutBack(inv(s.t0, s.t0 + .5, t));
      const x = LAND ? W / 2 + (i - 1) * (cw + gap) - cw / 2 : W / 2 - cw / 2;
      const y = LAND ? H * .42 - ch / 2 : H * .2 + i * (ch + gap);
      ctx.save(); ctx.translate(x + cw / 2, y + ch / 2); ctx.scale(1, clamp(p, 0, 1.2)); ctx.globalAlpha = clamp(p);
      const on = sayingAt(t, .3) === i;
      ctx.fillStyle = on ? '#1B2533' : '#161D27'; rr(ctx, -cw / 2, -ch / 2, cw, ch, 24 * U); ctx.fill();
      ctx.strokeStyle = on ? GOLD : BRAND; ctx.lineWidth = 4 * U; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = on ? GOLD : BRAND; ctx.font = `700 ${72 * U}px 'Noto Sans SC'`; ctx.fillText(no, 0, -ch * .24);
      ctx.fillStyle = INK; ctx.font = `700 ${52 * U}px 'Noto Sans SC'`; ctx.fillText(big, 0, ch * .06);
      ctx.fillStyle = '#9FB0C6'; ctx.font = `400 ${34 * U}px 'Noto Sans SC'`; ctx.fillText(small, 0, ch * .28);
      ctx.restore();
    });
    subtitle(ctx, t); edgesFade(ctx, t);
  },
});
