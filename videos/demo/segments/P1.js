// P1 片头：标题随第一句一个字一个字亮起，第二句时副标题滑入
scene({
  id: 'P1', name: '片头', needs: ['common.js'], fonts: ["700 96px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  text: '配音和整片工具演示片三段验收',
  draw(ctx, t) {
    backdrop(ctx, t);
    const title = '配音和整片工具', a = say(0), b = say(1);
    const n = Math.floor(clamp((t - a.t0) / (a.t1 - a.t0)) * title.length + (t >= a.t0 ? 1 : 0));
    ctx.font = `700 ${96 * U}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = INK; ctx.fillText(title.slice(0, Math.min(n, title.length)), W / 2, H * .42);
    const bar = eOutCubic(inv(a.t0, a.t1, t));
    ctx.fillStyle = BRAND; ctx.fillRect(W / 2 - 260 * U * bar, H * .42 + 80 * U, 520 * U * bar, 8 * U);
    heading(ctx, '一支三段的演示片 · 验收用', W / 2, H * .42 + 150 * U, 40, GOLD, inv(b.t0, b.t0 + .6, t));
    subtitle(ctx, t); edgesFade(ctx, t);
  },
});
