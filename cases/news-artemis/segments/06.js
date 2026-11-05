// 第 6 段 和阿波罗比：档案照片用风格包 news-brief 的多图拼贴分屏（collage）上屏；距离用数据卡对比；
// 最后同一张卡片模板套「阿波罗 13 号 / Artemis II」两行（乘组、人数、几个第一次）。
scene({
  id: 'news-artemis:6', name: '和阿波罗比',
  needs: ['../../../packs/news-brief/pack.js', 'common.js'],
  fonts: ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 96px 'Noto Serif SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    await C.init();
    const im = n => loadImage('dl/' + n + '.jpg');
    const P = {}; for (const n of ['a13crew', 'a13moon', 'a13mcc', 'a13rec', 'crew']) P[n] = NB.photo(await im(n));
    const L = NB.LAYOUTS.collage, K = C.K, say = C.say;
    const shots = [
      { at: 0, draw: (c, lt, d) => { const r = L.draw(c, K, lt, d, { photos: ['a13crew', 'a13moon'], kind: 'headline', labels: ['1970 · 乘组', '返航途中拍的月球'], move: { z: [1.02, 1.1], fx: [.5, .5], fy: [.4, .45] } }, P);
          NB.headline(c, K, lt - .6, r.box, { kicker: '上一次走这么远', title: '阿波罗 13 号', sub: '1970 年 4 月' }, true); } },
      { at: say(1) - .3, draw: (c, lt, d) => { const r = L.draw(c, K, lt, d, { photos: ['a13mcc', 'a13rec'], kind: 'headline', labels: ['休斯敦任务控制中心', '1970.04.17 回收'], move: { z: [1.02, 1.12], fx: [.5, .5], fy: [.5, .5] } }, P);
          NB.headline(c, K, lt - .6, r.box, { kicker: '服务舱氧气罐故障 · 登月取消', title: '绕过月球紧急返航', sub: '最远到达 400,171 公里' }, true); } },
      { at: say(2) - .3, draw: (c, lt, d) => bars(c, lt) },
      { at: say(3) - .3, draw: (c, lt, d) => rows(c, lt, P) },
    ];
    return { shots };
  },
  async draw(ctx, t, s) {
    await C.shots(ctx, t, s.shots, .45);
    C.bug(ctx, t);
    C.head(ctx, t, 4, '和阿波罗比', 'APOLLO 13 VS ARTEMIS II');
    C.foot(ctx, t);
  }
});
// 数据卡：两根横条，长度按离地球最远的距离（从 39 万公里画起，差值才看得出），右边写差值
function bars(c, lt) {
  const { K, u, F } = C;
  c.fillStyle = K.navy; c.fillRect(0, 0, W, H);
  const y0 = H * .3, x0 = 60 * u, bw = W - 120 * u, lo = 390000, hi = 410000, X = v => x0 + (v - lo) / (hi - lo) * bw;
  c.save(); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.globalAlpha = NB.pop(lt, .5); c.fillStyle = K.gold; c.font = F(700, 32); c.fillText('离地球最远的距离（公里）', x0, y0);
  c.fillStyle = K.muted; c.font = F(400, 24); c.fillText('横条从 39 万公里画起', x0, y0 + 44 * u);
  const row = (k, name, v, col, t0) => {
    const e = eOutCubic(inv(t0, t0 + 1.2, lt)), y = y0 + 120 * u + k * 230 * u;
    c.globalAlpha = NB.pop(lt - t0 + .3, .4); c.fillStyle = K.ink; c.font = F(900, 44); c.fillText(name, x0, y);
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x0, y + 24 * u, bw, 70 * u);
    c.fillStyle = col; c.fillRect(x0, y + 24 * u, (X(v) - x0) * e, 70 * u);
    c.font = `400 ${Math.round(84 * u)}px 'Bebas Neue'`; c.fillStyle = K.ink; c.fillText(C.fmt(lo + (v - lo) * e), x0, y + 180 * u);
  };
  row(0, '阿波罗 13 号 · 1970', 400171, 'rgba(245,247,250,.7)', .3);
  row(1, 'Artemis II · 2026', 406771, K.red, 1.0);
  const e = NB.pop(lt - 2.4, .5);
  c.globalAlpha = e; c.fillStyle = K.gold; c.font = `400 ${Math.round(150 * u)}px 'Bebas Neue'`; c.textAlign = 'right';
  c.fillText('+6,616', W - 60 * u, y0 + 720 * u); c.font = F(900, 44); c.fillText('公里', W - 60 * u, y0 + 790 * u);
  c.restore();
}
// 两行同一模板的卡片：照片、任务、年份、人数、乘组；Artemis II 那一行后面跟着点亮 3 个「第一次」
function rows(c, lt, P) {
  const { K, u, F } = C, t0 = C.say(3);
  c.fillStyle = K.bg; c.fillRect(0, 0, W, H);
  const R = [
    { p: 'a13crew', fy: .45, name: '阿波罗 13 号', year: '1970', n: '3 人', crew: '洛弗尔 · 斯威格特 · 海斯', at: .2 },
    { p: 'crew', fy: .55, fx: .3, name: 'Artemis II', year: '2026', n: '4 人', crew: '怀斯曼 · 格洛弗 · 科赫 · 汉森', at: C.cue('这一次是', 6) - t0 },
  ];
  R.forEach((r, k) => {
    const e = NB.pop(lt - r.at, .5), y = 330 * u + k * 520 * u, A = P[r.p];
    c.save(); c.globalAlpha = e; c.translate((1 - e) * 120 * u * (k ? 1 : -1), 0);
    c.fillStyle = K.navy; c.fillRect(40 * u, y, W - 80 * u, 480 * u);
    NB.cover(c, A.img, A, [40 * u, y, W - 80 * u, 260 * u], 1.05, r.fx ?? .5, r.fy);
    c.fillStyle = k ? K.red : 'rgba(245,247,250,.6)'; c.fillRect(40 * u, y + 260 * u, W - 80 * u, 8 * u);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = K.ink; c.font = F(900, 56); c.fillText(r.name, 70 * u, y + 340 * u);
    c.fillStyle = K.gold; c.font = `400 ${Math.round(60 * u)}px 'Bebas Neue'`; c.textAlign = 'right'; c.fillText(r.year, W - 70 * u, y + 340 * u);
    c.textAlign = 'left'; c.fillStyle = K.red; c.font = F(900, 40); c.fillText(r.n, 70 * u, y + 420 * u);
    c.fillStyle = K.muted; c.font = F(700, 32); c.fillText(r.crew, 170 * u, y + 418 * u);
    c.restore();
  });
  const F3 = [['女性', '第一位飞向月球的女性', '科赫'], ['有色人种', '第一位有色人种宇航员', '格洛弗'], ['加拿大人', '第一位加拿大人', '汉森']];
  F3.forEach(([kw, txt, who], k) => {
    const e = NB.pop(lt - (C.cue(kw, 30 + k * 2) - t0) + .3, .4), y = 1400 * u + k * 0, x = 40 * u + k * (W - 80 * u) / 3, w = (W - 80 * u) / 3 - 14 * u;
    c.save(); c.globalAlpha = e; c.translate(0, (1 - e) * 40 * u);
    c.fillStyle = K.gold; rr(c, x, y - 1400 * u + 1390 * u, w, 150 * u, 12 * u); c.fill();
    c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = F(900, 30);
    wrapCJK(c, txt, w - 30 * u).forEach((l, i) => c.fillText(l, x + w / 2, y + 40 * u + i * 40 * u));
    c.font = F(700, 26); c.fillText(who, x + w / 2, y + 126 * u);
    c.restore();
  });
}
