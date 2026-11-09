// 第 1 段 先看成品：课上做出的 15 秒水循环短片全屏播放，放完定格压暗，字卡「5 分钟后，你也能做一条」。
scene({
  id: 'course-first-video:1', name: '先看成品',
  needs: ['common.js'],
  fonts: ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() { await L.init(); return { V: await loadVideo('C-038-16x9.mp4') }; },
  async draw(ctx, t, s) {
    const { u, K, F } = L;
    const el = await s.V.at(Math.min(t, s.V.dur - .05));
    const end = s.V.dur - .1, k = smooth(end - .4, end + .8, t);
    drawCover(ctx, el, 0, 0, W, H, { zoom: 1 + .04 * k });
    ctx.fillStyle = `rgba(16,20,30,${.62 * k})`; ctx.fillRect(0, 0, W, H);
    if (t < end) {                                                      // 角标：课上做的成片
      ctx.save(); ctx.globalAlpha = smooth(.3, .9, t) * (1 - k);
      L.chip(ctx, 'C', 60 * u, 90 * u, { label: '课上做的成片 · C-038 科普扁平 · 15 秒' }); ctx.restore();
    }
    const a = t - end - .3;
    if (a > 0) {
      L.title(ctx, '5 分钟后', W / 2, H * .42, 120, { align: 'center', color: '#fff', alpha: L.pop(a) });
      L.title(ctx, '你也能做一条', W / 2, H * .42 + 150 * u, 120, { align: 'center', color: K.hi, alpha: L.pop(a - .35) });
      ctx.save(); ctx.globalAlpha = L.fadeIn(a - .9, .5); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = F(400, 32); ctx.textAlign = 'center';
      ctx.fillText('每一帧都由代码算出 · 代码由 AI 编程助手来写', W / 2, H * .42 + 240 * u); ctx.restore();
    }
    L.frame(ctx, t, { dark: true, alpha: smooth(1, 2, t) });
    L.sub(ctx, t);
  }
});
