// 第 2 段 片头：栏目包装（栏目名、标题条、日期），6 个段落图标逐个点亮，底图是地球落下的照片慢推。
scene({
  id: 'news-artemis:2', name: '片头',
  needs: ['../../../packs/news-brief/pack.js', 'common.js'],
  fonts: ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 96px 'Noto Serif SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    await C.init();
    return { P: NB.photo(await loadImage('dl/earthset2.jpg')) };
  },
  draw(ctx, t, s) {
    const { K, u, F } = C;
    const A = s.P;
    NB.cover(ctx, A.img, A, [0, 0, W, H], 1.25 + t * .012, .5, .62);
    ctx.fillStyle = 'rgba(7,11,16,.55)'; ctx.fillRect(0, 0, W, H);
    // 红条从左扫进来，栏目名压在上面
    const e1 = eOutCubic(inv(.1, .7, t)), e2 = eOutCubic(inv(.4, 1.0, t)), y = H * .3;
    ctx.fillStyle = K.red; ctx.fillRect(0, y, W * e1, 190 * u);
    ctx.fillStyle = K.navy; ctx.fillRect(W * (1 - e2), y + 190 * u, W * e2, 90 * u);
    ctx.save(); ctx.beginPath(); ctx.rect(0, y, W * e1, 190 * u); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.font = F(900, 128); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('星海速递', W / 2, y + 100 * u);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = e2; ctx.fillStyle = K.ink; ctx.font = F(700, 30, K.mono); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SPACE NEWS BRIEF · 资讯解说', W / 2, y + 236 * u); ctx.restore();
    // 本期标题
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = NB.pop(t - 1.2, .6); ctx.fillStyle = K.gold; ctx.font = F(700, 40); ctx.fillText('本期', W / 2, y + 380 * u);
    ctx.globalAlpha = NB.pop(t - 1.5, .6); ctx.fillStyle = K.ink; ctx.font = F(900, 92); ctx.fillText('Artemis II', W / 2, y + 490 * u);
    ctx.font = F(900, 80); ctx.fillText('绕月十天回顾', W / 2, y + 590 * u);
    ctx.globalAlpha = NB.pop(t - 1.9, .6); ctx.fillStyle = K.muted; ctx.font = F(700, 30, K.mono); ctx.fillText('2026.04.01 — 2026.04.10', W / 2, y + 650 * u);
    ctx.restore();
    // 6 个段落图标：跟着 0.375 秒的拍子逐个点亮，下面写段名
    const names = ['发射', '航线', '飞掠', '对比', '返回', '下一步'], n = 6, gap = 150 * u, x0 = W / 2 - gap * (n - 1) / 2, iy = y + 760 * u;
    for (let k = 0; k < n; k++) {
      const e = NB.pop(t - 2.6 - k * K.beat, .4), on = smooth(0, .3, t - 2.6 - k * K.beat);
      ctx.save(); ctx.translate(x0 + gap * k, iy); ctx.scale(lerp(.6, 1, e), lerp(.6, 1, e));
      ctx.globalAlpha = e; ctx.strokeStyle = on > .5 ? K.red : K.line; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(0, 0, 62 * u, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(14,34,56,.8)'; ctx.fill();
      C.icon(ctx, k + 1, -46 * u, -46 * u, 92 * u, e);
      ctx.fillStyle = K.ink; ctx.font = F(700, 26); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(names[k], 0, 78 * u);
      ctx.restore();
    }
    C.bug(ctx, t);
    C.foot(ctx, t);
  }
});
