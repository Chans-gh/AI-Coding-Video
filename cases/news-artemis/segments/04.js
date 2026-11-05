// 第 4 段 航线：JPL Horizons 星历（Orion -1024、月球 301，地心黄道坐标，每 10 分钟一点）画出整趟轨迹，
// 时间按旁白分几截快进，读数（美国东部时间、离地心距离、速度）跟着走；地球、月球画大了，只是示意。
scene({
  id: 'news-artemis:4', name: '航线',
  needs: ['../../../packs/news-brief/pack.js', 'common.js'],
  fonts: ["900 96px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 96px 'Noto Serif SC'", "150px 'Bebas Neue'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    await C.init();
    const O = parseCSV(await loadText('dl/orion.csv')), M = parseCSV(await loadText('dl/moon.csv'));
    O.forEach(r => { r.x = r.x_km; r.y = r.y_km; r.z = r.z_km; });
    const o = C.ephem(O), m = C.ephem(M), J = C.JD;
    const jFly = J(2026, 4, 6, 23, 0), mf = m(jFly), rot = -Math.PI / 2 - Math.atan2(mf.y, mf.x);   // 飞掠时的月球转到正上方
    const P = r => { const c = Math.cos(rot), s = Math.sin(rot); return [r.x * c - r.y * s, r.x * s + r.y * c]; };
    // 本段秒 → 任务时间（JD）：按旁白分截
    const K = [[0, O[0].jd], [C.say(1), O[0].jd], [C.say(2), J(2026, 4, 2, 23, 49)], [C.say(3), J(2026, 4, 4, 12)],
      [C.say(4) - .5, J(2026, 4, 7, 6)], [C.say(5), O[O.length - 1].jd]];
    const jdAt = t => { let i = K.length - 2; while (i > 0 && t < K[i][0]) i--; const [a, b] = [K[i], K[i + 1]]; return lerp(a[1], b[1], eInOutCubic(inv(a[0], b[0], t))); };
    const moonImg = await loadImage('dl/a13moon.jpg');
    return { O, o, m, P, jdAt, jFly, moonImg, tli: J(2026, 4, 2, 23, 49) };
  },
  draw(ctx, t, s) {
    const { K, u, F } = C;
    const jd = s.jdAt(t);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    // 星点
    for (let i = 0; i < 160; i++) { const x = hash1(i) * W, y = hash1(i + 999) * H, a = .15 + .5 * hash1(i + 77); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(x, y, 2 * u, 2 * u); }
    // 镜头：最后一截推近到月球附近，看清每 10 分钟一个点
    const zk = eInOutCubic(inv(C.say(5) - .3, C.say(5) + 3.5, t)), mfp = s.P(s.m(s.jFly));
    const base = H * .34 / 384400, sc = base * lerp(1, 7, zk);
    const E = [W / 2, H * .64], cx = lerp(0, mfp[0], zk), cy = lerp(0, mfp[1], zk), cen = [lerp(E[0], W / 2, zk), lerp(E[1], H * .45, zk)];
    const S = r => { const p = s.P(r); return [cen[0] + (p[0] - cx) * sc, cen[1] + (p[1] - cy) * sc]; };
    // 月球的路径（这十天）
    ctx.save(); ctx.setLineDash([6 * u, 10 * u]); ctx.strokeStyle = 'rgba(245,247,250,.25)'; ctx.lineWidth = 2 * u; ctx.beginPath();
    s.O.forEach((r, i) => { if (i % 6) return; const p = S(s.m(r.jd)); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }); ctx.stroke(); ctx.restore();
    // 地球
    const ep = S({ x: 0, y: 0 }), er = 34 * u * lerp(1, 2.2, zk);
    let g = ctx.createRadialGradient(ep[0] - er * .3, ep[1] - er * .3, er * .1, ep[0], ep[1], er);
    g.addColorStop(0, '#7FB6FF'); g.addColorStop(1, '#1B4F9A'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(...ep, er, 0, TAU); ctx.fill();
    // Orion 的轨迹：到当前时刻为止
    const n = s.O.findIndex(r => r.jd > jd), last = n < 0 ? s.O.length : n;
    ctx.strokeStyle = K.gold; ctx.lineWidth = 4 * u; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let i = 0; i < last; i++) { const p = S(s.O[i]); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
    const head = S(s.o(jd)); if (last) ctx.lineTo(...head); ctx.stroke();
    if (zk > .3) { ctx.fillStyle = `rgba(255,201,74,${smooth(.3, .8, zk)})`; for (let i = 0; i < last; i++) { const p = S(s.O[i]); ctx.beginPath(); ctx.arc(...p, 4 * u, 0, TAU); ctx.fill(); } }
    // 月球（照片贴图：阿波罗 13 号拍的满月）
    const mp = S(s.m(jd)), mr = 26 * u * lerp(1, 2.2, zk);
    ctx.save(); ctx.beginPath(); ctx.arc(...mp, mr, 0, TAU); ctx.clip(); ctx.drawImage(s.moonImg, mp[0] - mr * 1.12, mp[1] - mr * 1.12, mr * 2.24, mr * 2.24); ctx.restore();
    const lab = (txt, p, dx, dy, a, col = K.ink) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.font = F(700, 30); ctx.fillStyle = col; ctx.textAlign = dx < 0 ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, p[0] + dx, p[1] + dy); ctx.restore(); };
    // 镜头推近时，标出飞掠那一刻月球的位置
    if (zk > 0) { const fp = S(s.m(s.jFly)); ctx.save(); ctx.globalAlpha = zk; ctx.beginPath(); ctx.arc(...fp, mr, 0, TAU); ctx.clip(); ctx.drawImage(s.moonImg, fp[0] - mr * 1.12, fp[1] - mr * 1.12, mr * 2.24, mr * 2.24); ctx.restore();
      lab('4 月 6 日飞掠时的月球', fp, mr + 16 * u, 0, zk, K.muted); }
    // 飞船
    g = ctx.createRadialGradient(...head, 0, ...head, 22 * u); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,201,74,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(...head, 22 * u, 0, TAU); ctx.fill();
    // 标注
    lab('地球', ep, 0, er + 30 * u, (1 - zk) * NB.pop(t - .3), K.muted); ctx.textAlign = 'left';
    lab('月球', mp, mr + 16 * u, 0, NB.pop(t - .6) * (1 - zk * .5), K.muted);
    const card = (t0, t1, kicker, title, y) => {
      const e = NB.pop(t - t0, .5) * (1 - smooth(t1 - .4, t1, t)); if (e <= 0) return;
      ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.glass; rr(ctx, 40 * u, y, W - 80 * u, 150 * u, 14 * u); ctx.fill();
      ctx.fillStyle = K.red; ctx.fillRect(40 * u, y, 10 * u, 150 * u);
      ctx.fillStyle = K.gold; ctx.font = F(700, 28); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(kicker, 76 * u, y + 24 * u);
      ctx.fillStyle = K.ink; ctx.font = F(900, 48); ctx.fillText(title, 76 * u, y + 70 * u); ctx.restore();
    };
    const cy0 = 380 * u;
    card(C.say(0), C.say(1), '路线', '不是直线奔月', cy0);
    card(C.say(1), C.say(2), '第 1 天 · 绕地球的大椭圆轨道', '远地点约 70,377 公里', cy0);
    card(C.say(2), C.say(3), '4 月 2 日 · 奔月点火', '5 分 55 秒 · 速度增加 388 米/秒', cy0);
    card(C.say(3), C.say(4), '自由返回轨道', '借月球引力拐弯，地球引力拉回', cy0);
    card(C.say(4), C.say(5), '返回途中的修正', '最小一次 0.49 米/秒', cy0);
    card(C.say(5), SEG.dur + 1, '数据 · NASA/JPL Horizons', '每 10 分钟一个点', cy0);
    // 奔月点火的位置
    if (t > C.say(2) - .2) { const p = S(s.o(s.tli)); ctx.strokeStyle = K.red; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.arc(...p, 16 * u * NB.pop(t - C.say(2) + .2), 0, TAU); ctx.stroke(); }
    // 读数：时间、离地心、速度
    const r = s.o(jd), dist = Math.hypot(r.x, r.y, r.z), v = Math.hypot(r.vx, r.vy, r.vz);
    const e = NB.pop(t - C.say(1) + .3, .5), y = H - 470 * u;
    ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.glass; rr(ctx, 40 * u, y - 130 * u, W - 80 * u, 150 * u, 14 * u); ctx.fill();
    const col = (k, label, val, unit) => {
      const x = 70 * u + [0, .44, .76][k] * (W - 140 * u);
      ctx.fillStyle = K.muted; ctx.font = F(700, 22); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(label, x, y - 88 * u);
      ctx.fillStyle = K.ink; ctx.font = `400 ${Math.round(64 * u)}px 'Bebas Neue'`; ctx.fillText(val, x, y - 20 * u);
      const w = ctx.measureText(val).width; ctx.fillStyle = K.gold; ctx.font = F(700, 22); ctx.fillText(unit, x + w + 8 * u, y - 24 * u);
    };
    col(0, '美国东部时间', C.edt(jd), ''); col(1, '离地心', C.fmt(dist), '公里'); col(2, '速度', v.toFixed(2), '公里/秒');
    ctx.restore();
    ctx.save(); ctx.globalAlpha = .7; ctx.fillStyle = K.muted; ctx.font = F(400, 22); ctx.textAlign = 'right'; ctx.fillText('地球、月球、飞船放大画出 · 轨迹按星历真实比例', W - 40 * u, y + 40 * u); ctx.restore();
    C.bug(ctx, t);
    C.head(ctx, t, 2, '航线', 'TRAJECTORY · JPL HORIZONS');
    C.foot(ctx, t);
  }
});
