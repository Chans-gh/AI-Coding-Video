// 第 5 段 飞掠：宇航员拍的照片按深度图拆成远中近三层做视差推镜（风格包 news-brief 的 parallax），
// 时刻、距离用数据卡和计时器标出来；最后在东方盆地上画批注圈。
scene({
  id: 'news-artemis:5', name: '飞掠',
  needs: ['../../../packs/news-brief/pack.js', 'common.js'],
  fonts: ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 96px 'Noto Serif SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    await C.init();
    const im = n => loadImage('dl/' + n);
    const P = {
      crescent: NB.photo(await im('crescent.jpg')),
      earthset: NB.photo(await im('earthset.jpg'), await im('earthset-depth.png')),
      orientale: NB.photo(await im('orientale.jpg'), await im('orientale-depth.png'), [.4, .75]),
    };
    const L = NB.LAYOUTS, K = C.K, say = C.say;
    const shots = [
      { at: 0, draw: (c, lt, d) => { const r = L.kenburns.draw(c, K, lt, d, { photos: ['crescent'], kind: 'headline', move: { z: [1.05, 1.2], fx: [.5, .55], fy: [.5, .5] } }, P);
          NB.headline(c, K, lt - .3, [60 * C.u, H * .52, W - 120 * C.u, H * .2], { kicker: '2026.04.06 · 飞行第 6 天', title: '飞掠月球', sub: '照片：飞掠后的月牙（4 月 7 日）' }); } },
      { at: say(1) - .3, draw: (c, lt, d) => { L.kenburns.draw(c, K, lt + 6, d, { photos: ['crescent'], kind: 'chart', move: { z: [1.2, 1.35], fx: [.55, .6], fy: [.5, .5] } }, P); record(c, lt); } },
      { at: say(2) - .3, draw: (c, lt, d) => { const r = L.parallax.draw(c, K, lt, d + (say(4) - say(3)), { photos: ['earthset'], kind: 'note', move: { z: [1.05, 1.18], fx: [.5, .5], fy: [.55, .5] } }, P);
          C.shade(c); NB.tag(c, K, lt - .4, [40 * C.u, H * .3], '18:41 EDT · 地球落下', 'left'); C.credit(c, 'NASA · art002e009288 · 舷窗拍摄'); } },
      { at: say(3) - .3, cut: true, draw: (c, lt, d) => { L.parallax.draw(c, K, lt + say(3) - say(2), d + say(3) - say(2), { photos: ['earthset'], kind: 'note', move: { z: [1.05, 1.18], fx: [.5, .5], fy: [.55, .5] } }, P);
          blackout(c, lt, d); } },
      { at: say(4) - .3, draw: (c, lt, d) => { const r = L.parallax.draw(c, K, lt, d, { photos: ['orientale'], kind: 'note', move: { z: [1.0, 1.45], fx: [.5, .3], fy: [.5, .72] } }, P);
          C.shade(c); closest(c, lt, r, d); C.credit(c, 'NASA · art002e012090'); } },
    ];
    return { shots };
  },
  async draw(ctx, t, s) {
    await C.shots(ctx, t, s.shots, .45);
    C.bug(ctx, t);
    C.head(ctx, t, 3, '飞掠', 'LUNAR FLYBY · 2026.04.06');
    C.foot(ctx, t);
  }
});
// 距离纪录：计数器从 39 万涨过阿波罗 13 号的 400,171 公里
function record(c, lt) {
  const { K, u, F } = C, y = H * .3, e = NB.pop(lt, .5);
  c.save(); c.globalAlpha = e; c.fillStyle = K.glass; rr(c, 40 * u, y, W - 80 * u, 560 * u, 18 * u); c.fill();
  c.fillStyle = K.gold; c.font = F(700, 30); c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('13:56 EDT · 离地球的距离', 80 * u, y + 40 * u);
  const k = eInOutCubic(inv(.6, 5.5, lt)), val = lerp(390000, 400400, k), beat = val >= 400171;
  c.font = `400 ${Math.round(170 * u)}px 'Bebas Neue'`; c.fillStyle = beat ? K.gold : K.ink; c.fillText(C.fmt(val), 80 * u, y + 90 * u);
  const nw = c.measureText('000,000').width;
  c.font = F(900, 44); c.fillStyle = K.red; c.fillText('公里', 100 * u + nw, y + 175 * u);
  // 刻度条：39 万到 41 万，标出阿波罗 13 号
  const bx = 80 * u, bw = W - 160 * u, by = y + 330 * u, X = v => bx + (v - 390000) / 20000 * bw;
  c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(bx, by, bw, 18 * u);
  c.fillStyle = beat ? K.gold : K.ink; c.fillRect(bx, by, X(val) - bx, 18 * u);
  c.fillStyle = K.red; c.fillRect(X(400171) - 3 * u, by - 30 * u, 6 * u, 78 * u);
  c.font = F(700, 26); c.fillStyle = K.ink; c.textAlign = 'center'; c.fillText('阿波罗 13 号 · 1970 · 400,171', X(400171), by + 60 * u);
  if (beat) { c.globalAlpha = e * NB.pop(lt - 5.2, .4); c.fillStyle = K.red; c.textAlign = 'left'; c.font = F(900, 48); c.fillText('纪录保持了 56 年，今天被打破', bx, by + 120 * u); }
  c.restore();
}
// 失联 41 分钟：画面压暗、去色，计时器走完
function blackout(c, lt, d) {
  const { K, u, F } = C, k = smooth(0, 1.2, lt);
  c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = `rgba(128,128,128,${k})`; c.fillRect(0, 0, W, H); c.restore();
  c.fillStyle = `rgba(0,0,0,${.55 * k})`; c.fillRect(0, 0, W, H);
  const y = H * .3, e = NB.pop(lt - .3, .5), p = inv(.6, d - 1, lt), m = Math.floor(p * 41), s = Math.floor((p * 41 * 60) % 60);
  c.save(); c.globalAlpha = e; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillStyle = K.gold; c.font = F(700, 30); c.fillText('18:44 — 19:25 EDT · 月球背面', W / 2, y);
  c.fillStyle = K.ink; c.font = F(900, 64); c.fillText('与地球失去联系', W / 2, y + 100 * u);
  c.font = `400 ${Math.round(200 * u)}px 'Bebas Neue'`; c.fillStyle = K.red;
  c.fillText(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, W / 2, y + 300 * u);
  c.font = F(700, 28); c.fillStyle = K.muted; c.fillText('共 41 分钟', W / 2, y + 360 * u);
  c.restore();
}
// 最近点、最远点两行数据，之后在东方盆地上画批注圈（局部放大的圆框）
function closest(c, lt, r, d) {
  const { K, u, F } = C, y = H * .26, say = C.say, b = say(5) - say(4);
  const row = (k, t0, time, label, val) => {
    const e = NB.pop(lt - t0, .5) * (1 - smooth(b - .6, b, lt)); if (e <= 0) return;
    const yy = y + k * 190 * u;
    c.save(); c.globalAlpha = e; c.fillStyle = K.glass; rr(c, 40 * u, yy, W - 80 * u, 170 * u, 14 * u); c.fill();
    c.fillStyle = k ? K.red : K.gold; c.fillRect(40 * u, yy, 10 * u, 170 * u);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = K.gold; c.font = F(700, 28, K.mono); c.fillText(time, 76 * u, yy + 52 * u);
    c.fillStyle = K.ink; c.font = F(700, 34); c.fillText(label, 76 * u, yy + 120 * u);
    c.font = `400 ${Math.round(110 * u)}px 'Bebas Neue'`; c.textAlign = 'right'; c.fillText(val, W - 150 * u, yy + 135 * u);
    c.font = F(700, 28); c.fillStyle = K.red; c.fillText('公里', W - 76 * u, yy + 130 * u);
    c.restore();
  };
  row(0, .3, '19:00 EDT', '离月面最近（约）', '6,545');
  row(1, 3.2, '19:02 EDT', '离地球最远', '406,771');
  // 批注：东方盆地（照片里大约 (0.36, 0.68) 处的暗色区，内环直径约占画面宽 0.3）
  const t2 = lt - b; if (t2 < 0) return;
  const cpt = r.pin(0, .36, .68), edge = r.pin(0, .36 + .16, .68), R = Math.hypot(edge[0] - cpt[0], edge[1] - cpt[1]);
  const dr = eOutCubic(inv(.2, 1.4, t2));
  c.save(); c.strokeStyle = K.gold; c.lineWidth = 6 * u; c.setLineDash([]); c.beginPath(); c.arc(cpt[0], cpt[1], R, -Math.PI / 2, -Math.PI / 2 + TAU * dr); c.stroke();
  c.lineWidth = 3 * u; c.globalAlpha = dr; c.beginPath(); c.moveTo(cpt[0] + R * .7, cpt[1] - R * .7); c.lineTo(cpt[0] + R * 1.1, cpt[1] - R * 1.25); c.lineTo(W - 60 * u, cpt[1] - R * 1.25); c.stroke();
  c.restore();
  NB.note(c, K, t2 - .8, [40 * u, H * .24, W - 80 * u, 250 * u], { kicker: '窗外 · 东方盆地', title: '宽将近 1000 公里的古老撞击盆地', lineTo: 0 }, [-999, -999], [-999, -999]);
}
