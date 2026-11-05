// 第 3 段 发射：NASA 的五路机位接起来，任务时钟按固体助推器点火（T-0）对齐；中间插乘组照片和名单。
// 各机位的 T-0（固体助推器点火）在素材里的秒数是按画面对齐的（log.md）：观众区 12（现场倒计时牌归零的那一秒）、近景 8.5、塔架 8.5、跟踪 2.5、水面 6.5；
// 助推器分离（T+2:09）在 sep.mp4 的第 11 秒附近。本段第 9 秒 = T-0。
const T0 = 9;
scene({
  id: 'news-artemis:3', name: '发射',
  needs: ['../../../packs/news-brief/pack.js', 'common.js'],
  fonts: ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 96px 'Noto Serif SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    await C.init();
    const v = n => loadVideo('dl/' + n + '.mp4');
    const V = { crowd: await v('crowd'), close: await v('close'), tower: await v('tower'), track: await v('track'), sep: await v('sep'), water: await v('water') };
    const crew = NB.photo(await loadImage('dl/crew.jpg'));
    const clip = (name, off, o) => C.video(V[name], lt => lt + off, o);
    // 镜头表：at 本段秒，off = 素材秒 − 本镜头本地秒，clock = 本镜头本地秒 → 任务时钟（秒，负数是倒计时）
    const L = [
      { at: 0, v: clip('crowd', 3.0, { fx: .33 }), cap: 'NASA · 观众区机位（现场倒计时牌）' },
      { at: 5.5, v: clip('close', 5.0, { fx: .5 }), clock: lt => lt + 5.5 - T0, cap: 'NASA · 发射台近景' },
      { at: 10.5, v: clip('tower', 10.0, { fx: .5, zoom: lt => 1 + lt * .01 }), clock: lt => lt + 10.5 - T0, cap: 'NASA · 塔架机位' },
      { at: 14.6, crew: true },
      { at: 25.5, v: clip('track', 19.0, { fx: .5 }), clock: lt => lt + 19.0 - 2.5, cap: 'NASA · 跟踪机位' },
      { at: 31, v: clip('sep', 7.0, { fx: .5 }), clock: lt => lt + 7.0 + 117.5, cap: 'NASA · 跟踪机位（助推器分离）' },
      { at: 38, v: clip('water', 7.0, { fx: .5, zoom: lt => 1.02 + lt * .006 }), cap: 'NASA · 水面机位' },
    ];
    const shots = L.map(s => s.crew ? { at: s.at, draw: (c, lt, d) => crewShot(c, lt, d, crew) } : {
      at: s.at, prep: s.v.prep,
      draw: (c, lt) => { s.v.paint(c, lt); C.shade(c, .5, .75); if (s.clock) clock(c, s.clock(lt)); C.credit(c, s.cap); },
    });
    return { shots };
  },
  async draw(ctx, t, s) {
    const { K, u, F } = C;
    await C.shots(ctx, t, s.shots, .45);
    // 旁白第 1 句：时间、地点的标签；第 4 句：半个多世纪
    if (t > C.say(0) && t < C.say(1)) {
      NB.tag(ctx, K, t - C.say(0), [40 * u, H * .62], '2026.04.01 18:35 EDT', 'left');
      NB.tag(ctx, K, t - C.say(0) - .4, [40 * u, H * .62 + 80 * u], '肯尼迪航天中心 · 39B 发射台', 'left', 1, true);
    }
    if (t > C.say(2) && t < C.say(3)) {
      NB.tag(ctx, K, t - C.say(2), [40 * u, H * .62], 'T+7 秒 越过发射塔', 'left', 1, true);
      NB.tag(ctx, K, t - C.say(2) - 2.4, [40 * u, H * .62 + 70 * u], 'T+2:09 助推器分离', 'left', 1, true);
    }
    if (t > C.say(3)) {
      const e = NB.pop(t - C.say(3), .6), y = H * .5;
      ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'left'; ctx.fillStyle = K.gold; ctx.font = F(700, 34); ctx.fillText('1972 → 2026', 60 * u, y);
      ctx.fillStyle = K.ink; ctx.font = F(900, 76); ctx.fillText('半个多世纪以来', 60 * u, y + 100 * u); ctx.fillText('第一次飞向月球', 60 * u, y + 190 * u);
      ctx.fillStyle = K.red; ctx.fillRect(60 * u, y + 220 * u, 300 * u * e, 8 * u); ctx.restore();
    }
    C.bug(ctx, t);
    C.head(ctx, t, 1, '发射', 'LAUNCH · 2026.04.01');
    C.foot(ctx, t);
  }
});
// 任务时钟：右上角，T−倒计时 / T+ 正计时
function clock(c, sec) {
  const { K, u, F } = C, neg = sec < 0, a = Math.abs(sec), m = Math.floor(a / 60), s = Math.floor(a % 60);
  const txt = `T${neg ? '−' : '+'}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  c.save(); c.textAlign = 'right'; c.textBaseline = 'alphabetic';
  c.fillStyle = K.glass; rr(c, W - 360 * u, 170 * u, 320 * u, 120 * u, 12 * u); c.fill();
  c.fillStyle = neg ? K.ink : K.gold; c.font = `400 ${Math.round(96 * u)}px 'Bebas Neue'`; c.fillText(txt, W - 64 * u, 268 * u);
  c.fillStyle = K.muted; c.font = F(700, 20, K.mono); c.textAlign = 'left'; c.fillText('MISSION CLOCK', W - 340 * u, 196 * u);
  c.restore();
}
// 乘组：照片上半屏（2023 年公布乘组时的合影），下面四行名单
function crewShot(c, lt, d, P) {
  const { K, u, F } = C;
  c.fillStyle = K.bg; c.fillRect(0, 0, W, H);
  NB.cover(c, P.img, P, [0, 330 * u, W, 620 * u], 1.0 + lt * .01, .3, .55);
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3 * u; c.strokeRect(0, 330 * u, W, 620 * u);
  NB.tag(c, K, lt - .2, [40 * u, 360 * u], '乘组 · 2023 年公布时的合影', 'left', 1, true);
  const rows = [['指令长', '里德·怀斯曼', 'NASA'], ['驾驶员', '维克多·格洛弗', 'NASA'], ['任务专家', '克里斯蒂娜·科赫', 'NASA'], ['任务专家', '杰里米·汉森', '加拿大航天局']];
  rows.forEach((r, k) => {
    const e = NB.pop(lt + 14.6 - C.cue(r[1].slice(-2), 15 + k * 2) + .2, .5), y = 1000 * u + k * 105 * u;
    c.save(); c.globalAlpha = e; c.translate((1 - e) * 80 * u, 0);
    c.fillStyle = k === 3 ? K.red : K.navy; c.fillRect(40 * u, y, 10 * u, 84 * u);
    c.fillStyle = K.gold; c.font = F(700, 28); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(r[0], 70 * u, y + 42 * u);
    c.fillStyle = K.ink; c.font = F(900, 50); c.fillText(r[1], 250 * u, y + 42 * u);
    c.fillStyle = K.muted; c.font = F(400, 26); c.textAlign = 'right'; c.fillText(r[2], W - 40 * u, y + 42 * u);
    c.restore();
  });
  C.credit(c, 'NASA / James Blair · jsc2023e018469', 1);
}
