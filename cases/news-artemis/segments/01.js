// 第 1 段 冷开场：发射慢放铺底，最大的那个数字砸进来，一句话说清新闻。
scene({
  id: 'news-artemis:1', name: '冷开场',
  needs: ['../../../packs/news-brief/pack.js', 'common.js'],
  fonts: ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 96px 'Noto Serif SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    await C.init();
    return { V: await loadVideo('dl/causeway.mp4') };
  },
  async draw(ctx, t, s) {
    const { K, u, F } = C;
    const el = await s.V.at(t * s.V.dur / SEG.dur * .98);
    drawCover(ctx, el, 0, 0, W, H, { zoom: 1.05 + t * .006, fx: .5 });
    ctx.fillStyle = `rgba(7,11,16,${lerp(.15, .5, smooth(.8, 2, t))})`; ctx.fillRect(0, 0, W, H);
    C.shade(ctx);
    // 大数字 + 单位 + 一行说明
    const t1 = C.say(0), up = eInOutCubic(inv(C.say(2) - .4, C.say(2) + .6, t));
    const y = lerp(H * .44, H * .3, up);
    C.slam(ctx, t - t1, '406,771', W / 2, y, 250);
    ctx.save(); ctx.globalAlpha = NB.pop(t - t1 - .4, .4); ctx.textAlign = 'center'; ctx.fillStyle = K.red; ctx.font = F(900, 64);
    ctx.fillText('公里', W / 2, y + 100 * u);
    ctx.globalAlpha = NB.pop(t - C.say(1), .5); ctx.fillStyle = K.ink; ctx.font = F(700, 46);
    ctx.fillText('人类离开地球最远的一次', W / 2, y + 190 * u);
    ctx.globalAlpha *= 1; ctx.fillStyle = K.gold; ctx.font = F(700, 26, K.mono);
    ctx.fillText('2026.04.06 19:02 EDT · 距地球表面', W / 2, y + 250 * u);
    ctx.restore();
    if (t > C.say(2)) NB.tag(ctx, K, t - C.say(2) - .3, [W / 2 - 200 * u, y + 320 * u], 'ARTEMIS II · 4 名宇航员', 'left');
    C.credit(ctx, 'NASA · 堤道低机位 · 慢放', smooth(1, 2, t));
    C.foot(ctx, t);
    ctx.fillStyle = `rgba(0,0,0,${smooth(SEG.dur - .6, SEG.dur, t)})`; ctx.fillRect(0, 0, W, H);
  }
});
