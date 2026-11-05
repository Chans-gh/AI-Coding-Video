// 第 7 段 返回和发布会金句：舱内降落伞、溅落、回收；发布会长录像（faster-whisper 转文字稿后挑句、对照原声核过）切两截竖屏，
// 原话中英大字幕。QUOTE 和 sound.py 的 QUOTE 一致：[quote.mp4 里的起点, 终点, 放在本段第几秒]。
const QUOTE = [[9.75, 22.6, 23.6], [29.8, 35.4, 37.05]];
// 原话（本段秒）：按文字稿的逐词时间；英文照原声，中文是本片的翻译
const SAYS = [
  [23.69, 30.23, 'The sense I had was this sense of fragility and feeling small, infinitesimally small.', '我当时的感觉，是一种脆弱，觉得自己很小，小到微不足道。'],
  [30.81, 36.23, 'But yet, this very powerful feeling as a human being, like as a group.', '但同时，作为人，作为一个集体，又有一种很强大的感觉。'],
  [37.15, 42.43, 'I kept seeing that same thing and that same feeling, small and powerless, but yet powerful together.', '我一次又一次看到同样的东西、同样的感受：渺小、无力，但在一起，就很强大。'],
];
scene({
  id: 'news-artemis:7', name: '返回和发布会金句',
  needs: ['../../../packs/news-brief/pack.js', 'common.js'],
  fonts: ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 96px 'Noto Serif SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    await C.init();
    const v = n => loadVideo('dl/' + n + '.mp4');
    const V = { chute: await v('chute'), splash: await v('splash'), quote: await v('quote') };
    const rec = NB.photo(await loadImage('dl/recovery.jpg'));
    const K = C.K, say = C.say;
    const chute = C.video(V.chute, lt => lt + 2), sp1 = C.video(V.splash, lt => lt), sp2 = C.video(V.splash, lt => lt + 22, { zoom: lt => 1.1 + lt * .01 });
    const qa = C.video(V.quote, lt => lt + say(3) - .3 - (QUOTE[0][2] - QUOTE[0][0])), qb = C.video(V.quote, lt => lt + QUOTE[1][0]);
    const vs = (o, cap, extra) => ({ prep: o.prep, draw: (c, lt, d) => { o.paint(c, lt); C.shade(c, .5, .7); if (cap) C.credit(c, cap); if (extra) extra(c, lt, d); } });
    const shots = [
      { at: 0, ...vs(chute, 'NASA · 舱内 GoPro · 主伞打开') },
      { at: say(0) - .3, ...vs(sp1, 'NASA · 空中机位 · 溅落', (c, lt) => { NB.tag(c, K, lt - .3, [40 * C.u, H * .3], '04.10 17:07 PDT · 圣迭戈外海', 'left'); }) },
      { at: say(1) - .3, draw: (c, lt, d) => { NB.LAYOUTS.kenburns.draw(c, K, lt, d, { photos: ['rec'], kind: 'note', move: { z: [1.15, 1.3], fx: [.5, .55], fy: [.6, .65] } }, { rec });
          C.shade(c); NB.tag(c, K, lt - .3, [40 * C.u, H * .3], '美国海军 · 约翰·P·穆尔萨号', 'left', 1, true); C.credit(c, 'NASA / James Blair · 回收'); } },
      { at: say(2) - .3, ...vs(sp2, 'NASA · 空中机位', total) },
      { at: say(3) - .3, ...vs(qa, null, quote) },
      { at: QUOTE[1][2], cut: true, ...vs(qb, null, (c, lt, d) => quote(c, lt + QUOTE[1][2] - say(3) + .3, d)) },
    ];
    return { shots };
  },
  async draw(ctx, t, s) {
    await C.shots(ctx, t, s.shots, .45);
    C.bug(ctx, t);
    C.head(ctx, t, 5, '返回', 'SPLASHDOWN · 2026.04.10');
    // 原话的中英大字幕
    for (const [a, b, en, zh] of SAYS) {
      if (t < a - .2 || t > b + .5) continue;
      const e = NB.pop(t - a + .2, .35) * (1 - smooth(b + .2, b + .5, t));
      ctx.save(); ctx.globalAlpha = e;
      caption(ctx, zh, { size: 54, weight: 900, y: H - 330 * C.u, bg: 'rgba(7,11,16,.78)', maxW: W * .86 });
      caption(ctx, en, { size: 30, weight: 400, y: H - 560 * C.u, bg: null, color: C.K.gold, maxW: W * .84, stroke: 'rgba(0,0,0,.8)' });
      ctx.restore();
    }
    C.foot(ctx, t);
    ctx.fillStyle = `rgba(0,0,0,${smooth(SEG.dur - 1.2, SEG.dur, t)})`; ctx.fillRect(0, 0, W, H);
  }
});
// 总航程
function total(c, lt) {
  const { K, u, F } = C, e = NB.pop(lt - .3, .5), y = H * .3, k = eOutCubic(inv(.4, 2.2, lt));
  c.save(); c.globalAlpha = e; c.fillStyle = K.glass; rr(c, 40 * u, y, W - 80 * u, 400 * u, 16 * u); c.fill();
  c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = K.gold; c.font = F(700, 30); c.fillText('十天 · 总航程', 80 * u, y + 70 * u);
  c.fillStyle = K.ink; c.font = `400 ${Math.round(170 * u)}px 'Bebas Neue'`; c.fillText(C.fmt(1118624 * k), 80 * u, y + 240 * u);
  c.fillStyle = K.red; c.font = F(900, 48); c.fillText('公里', 80 * u, y + 330 * u);
  c.fillStyle = K.muted; c.font = F(400, 26); c.fillText('NASA 公布 695,081 英里，按 1 英里 = 1.609344 公里换算', 210 * u, y + 325 * u);
  c.restore();
}
// 发布会：人名条
function quote(c, lt) {
  const { K, u, F } = C, e = NB.pop(lt - .6, .5), y = H - 820 * u;
  c.save(); c.globalAlpha = e; c.fillStyle = K.red; c.fillRect(40 * u, y, 12 * u, 120 * u);
  c.fillStyle = K.glass; c.fillRect(52 * u, y, 640 * u, 120 * u);
  c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = K.ink; c.font = F(900, 46); c.fillText('杰里米·汉森', 80 * u, y + 58 * u);
  c.fillStyle = K.muted; c.font = F(400, 26); c.fillText('加拿大航天局宇航员 · 任务后发布会', 80 * u, y + 100 * u);
  c.restore();
  C.credit(c, 'NASA · 任务后发布会录像');
}
