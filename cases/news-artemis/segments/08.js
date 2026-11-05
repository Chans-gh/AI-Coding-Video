// 第 8 段 接下来：时间线逐个点亮；还没有真实画面的部分用 AI 生成的示意插画（单图推拉）和「未来月面基地」图生视频，
// 一直挂着「示意图 · AI 生成」「AI 生成示意」的牌子。
scene({
  id: 'news-artemis:8', name: '接下来',
  needs: ['../../../packs/news-brief/pack.js', 'common.js'],
  fonts: ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 96px 'Noto Serif SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    await C.init();
    const P = { dock: NB.photo(await loadImage('dock.jpg')), land: NB.photo(await loadImage('land.jpg')), base: NB.photo(await loadImage('base.jpg')) };
    const V = await loadVideo('base.mp4'), K = C.K, say = C.say, kb = NB.LAYOUTS.kenburns;
    const ill = (name, move, kicker, title, label) => (c, lt, d) => {
      const r = kb.draw(c, K, lt, d, { photos: [name], kind: 'headline', move }, P);
      C.shade(c, .5, .5); NB.headline(c, K, lt - .4, [60 * C.u, H * .55, W - 120 * C.u, H * .2], { kicker, title });
      C.aiLabel(c, lt, label);
    };
    let el = null;
    const shots = [
      { at: 0, draw: ill('dock', { z: [1.02, 1.12], fx: [.5, .5], fy: [.45, .4] }, '2027 · Artemis III', '近地轨道上，试验和登月器对接', '示意图 · AI 生成') },
      { at: say(1) - .3, draw: ill('land', { z: [1.05, 1.15], fx: [.5, .5], fy: [.5, .55] }, '2028 · Artemis IV', '降落在月球南极附近', '示意图 · AI 生成') },
      { at: say(2) - .3, draw: ill('base', { z: [1.0, 1.04], fx: [.5, .5], fy: [.5, .5] }, '再往后', '在月面长期驻留', 'AI 生成示意') },
      { at: say(2) + 2.3, cut: true, prep: async lt => { el = await V.at(lt); },
        draw: (c, lt) => { drawCover(c, el, 0, 0, W, H, { zoom: 1.04 }); C.shade(c, .5, .5); C.aiLabel(c, 1, 'AI 生成示意'); } },
      { at: say(2) + 2.3 + V.dur - .1, cut: true, prep: async () => { el = await V.at(V.dur - .1); },
        draw: (c, lt) => { drawCover(c, el, 0, 0, W, H, { zoom: 1.04 + lt * .025, fy: .55 }); C.shade(c, .5, .5); C.aiLabel(c, 1, 'AI 生成示意'); } },
    ];
    return { shots };
  },
  async draw(ctx, t, s) {
    const { K, u, F, say } = C;
    await C.shots(ctx, t, s.shots, .45);
    // 第 4 句「这几个画面是 AI 生成的示意图」：画面中间压一行大字
    if (t > say(3) - .2) {
      const e = NB.pop(t - say(3) + .2, .4);
      ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.gold; rr(ctx, 60 * u, H * .45, W - 120 * u, 110 * u, 12 * u); ctx.fill();
      ctx.fillStyle = '#111'; ctx.font = F(900, 44); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('以上画面为 AI 生成示意，不是真实影像', W / 2, H * .45 + 56 * u); ctx.restore();
    }
    timeline(ctx, t);
    C.bug(ctx, t);
    C.head(ctx, t, 6, '接下来', "WHAT'S NEXT · NASA 2026.10");
    C.foot(ctx, t);
  }
});
// 时间线：4 个节点按旁白逐个点亮（2026 已完成）
function timeline(c, t) {
  const { K, u, F, say } = C, y = 400 * u, x0 = 90 * u, x1 = W - 90 * u;
  const N = [['2026', 'Artemis II', '绕月飞行', -1], ['2027', 'Artemis III', '近地轨道对接', say(0)], ['2028', 'Artemis IV', '南极附近着陆', say(1)], ['之后', '月面驻留', '时间没查到', say(2)]];
  const e = NB.pop(t - .3, .5);
  c.save(); c.globalAlpha = e; c.fillStyle = K.glass; rr(c, 40 * u, y - 60 * u, W - 80 * u, 210 * u, 14 * u); c.fill();
  c.strokeStyle = K.line; c.lineWidth = 4 * u; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  N.forEach(([yr, name, what, at], k) => {
    const x = lerp(x0, x1, k / 3), on = at < 0 ? 1 : smooth(at - .2, at + .4, t);
    if (k) { c.strokeStyle = K.red; c.beginPath(); c.moveTo(lerp(x0, x1, (k - 1) / 3), y); c.lineTo(lerp(lerp(x0, x1, (k - 1) / 3), x, on), y); c.stroke(); }
    c.fillStyle = on > .5 ? K.red : '#334'; c.beginPath(); c.arc(x, y, (14 + 6 * on) * u, 0, TAU); c.fill();
    if (k === 0) { c.strokeStyle = '#fff'; c.lineWidth = 4 * u; c.beginPath(); c.moveTo(x - 7 * u, y); c.lineTo(x - 2 * u, y + 6 * u); c.lineTo(x + 8 * u, y - 6 * u); c.stroke(); }
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.globalAlpha = e * lerp(.45, 1, on);
    c.fillStyle = K.gold; c.font = `400 ${Math.round(44 * u)}px 'Bebas Neue'`; c.fillText(yr, x, y - 26 * u);
    c.fillStyle = K.ink; c.font = F(700, 24); c.fillText(name, x, y + 52 * u);
    c.fillStyle = K.muted; c.font = F(400, 20); c.fillText(what, x, y + 84 * u);
    c.globalAlpha = e;
  });
  c.restore();
}
