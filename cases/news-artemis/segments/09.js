// 第 9 段 结尾：地球落下的照片慢推，两句收尾；之后栏目落版，素材出处逐行列出。
scene({
  id: 'news-artemis:9', name: '结尾',
  needs: ['../../../packs/news-brief/pack.js', 'common.js'],
  fonts: ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 96px 'Noto Serif SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    await C.init();
    return { P: NB.photo(await loadImage('dl/earthset2.jpg')) };
  },
  draw(ctx, t, s) {
    const { K, u, F, say } = C, A = s.P, end = say(2) - .4;
    const out = eInOutCubic(inv(end, end + 1, t));
    NB.cover(ctx, A.img, A, [0, 0, W, H], 1.6 - t * .02, .5, .4);
    C.shade(ctx, .4, .7);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = `900 ${Math.round(64 * u)}px 'Noto Serif SC'`;
    ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 20 * u; ctx.fillStyle = K.ink;
    ctx.globalAlpha = NB.pop(t - say(0), .8) * (1 - out); ctx.fillText('四十万公里之外', W / 2, H * .62); ctx.fillText('他们看着地球落下', W / 2, H * .62 + 90 * u);
    ctx.globalAlpha = NB.pop(t - say(1), .8) * (1 - out); ctx.fillStyle = K.gold; ctx.fillText('下一次', W / 2, H * .62 + 220 * u); ctx.fillText('人类要站在月面上看', W / 2, H * .62 + 310 * u);
    ctx.restore();
    if (out > 0) {
      // 落版：红条推进来，栏目名 + 出处
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * out, H); ctx.clip();
      ctx.fillStyle = K.navy; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = K.red; ctx.fillRect(0, H * .2, W, 170 * u);
      ctx.fillStyle = '#fff'; ctx.font = F(900, 110); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('星海速递', W / 2, H * .2 + 88 * u);
      ctx.fillStyle = K.ink; ctx.font = F(900, 56); ctx.fillText('我们下期见', W / 2, H * .2 + 280 * u);
      const L = [['录像、照片', 'NASA（公共领域）'], ['轨迹数据', 'NASA/JPL Horizons 星历'], ['深度图', '本仓库代码（Depth Anything V2）'], ['配乐', 'Insistent、ObservingTheStar（yd，CC0）'],
        ['旁白', 'AI 语音合成（公开音色）'], ['示意插画、月面基地视频', 'AI 生成'], ['段落图标', 'AI 生成（语言模型写的 SVG）']];
      L.forEach(([a, b], k) => {
        const e = NB.pop(t - end - .8 - k * .25, .4), y = H * .2 + 420 * u + k * 92 * u;
        ctx.globalAlpha = e; ctx.textAlign = 'left'; ctx.fillStyle = K.gold; ctx.font = F(700, 28); ctx.fillText(a, 80 * u, y);
        ctx.fillStyle = K.ink; ctx.font = F(400, 30); ctx.fillText(b, 80 * u, y + 40 * u);
      });
      ctx.restore();
    }
    C.bug(ctx, t);
    C.foot(ctx, t);
    ctx.fillStyle = `rgba(0,0,0,${smooth(SEG.dur - 1.5, SEG.dur, t)})`; ctx.fillRect(0, 0, W, H);
  }
});
