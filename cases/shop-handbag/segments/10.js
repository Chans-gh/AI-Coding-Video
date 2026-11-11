// 第 10 段 价格和品牌：后半的讲解调子，段内溶解 0.4 秒。
// 1 黑色款 + 价格卡「960 元」，服务 3 条念到哪条出哪条 → 2 「北山制包所 · 2014 · 北京」，接竖排「山海经 · 北山经」
// → 3 2-1 的草原慢放，品牌的话三句逐句出 → 4 落版：BEISHAN 字标、「旷野 · 布丁包」、「素材由品牌方提供」。
// 3 层：底层照片 / 生成视频 / 奶白底，中层价格卡和文字排版，上层字标和字幕。时间由旁白 3 句驱动，最后留约 2 秒落版。
scene({
  id: 'shop-handbag:10', name: '价格和品牌',
  needs: ['common.js'],
  fonts: ["900 96px 'Noto Serif SC'", "600 96px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  async init() {
    await C.init();
    const P = { black: await loadImage('brand/color/01-black.jpg'), logo: await loadImage('brand/beishan.png') };
    const V = await loadVideo('gen/2-1.mp4');
    const s = i => SEG.vo[i].at, q = C.cue;
    const at = { a: 0, b: s(1) - .2, c: s(2) - .2, d: SEG.vo[2].at + SEG.vo[2].t + .3 };
    // 字标染成墨色：离屏画一次
    const ink = mk(P.logo.width, P.logo.height), g = ink.getContext('2d');
    g.drawImage(P.logo, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = C.K.ink; g.fillRect(0, 0, ink.width, ink.height);
    const vid = C.clip(V, at.d - at.c, { from: .5 });
    const cue = { ship: q('顺丰') - at.a, fast: q('24') - at.a, back: q('7 天') - at.a, year: q('2014') - at.b, book: q('山海经') - at.b,
      w: ['有追求', '有原则', '独立'].map(k => q(k) - at.c) };
    return { P, ink, vid, at, cue };
  },
  async draw(ctx, t, s) {
    const { K, u, F, bg, photo } = C, { P, at, cue } = s;
    const list = [
      { at: at.a, draw: (c, lt, d) => {                // 1 价格卡
        photo(c, P.black, lt, d, { w: .9, y: .22, push: .05 });
        const e = eOutCubic(inv(.1, .7, lt)), w = W * .84, h = H * .31, x = (W - w) / 2, y = H * .45 + (1 - e) * 40 * u;
        c.save(); c.globalAlpha = e;
        c.shadowColor = 'rgba(42,38,34,.18)'; c.shadowBlur = 40 * u; c.shadowOffsetY = 10 * u;
        c.fillStyle = '#FBF8F2'; rr(c, x, y, w, h, 28 * u); c.fill(); c.shadowColor = 'transparent';
        c.textAlign = 'center'; c.fillStyle = K.river; c.font = F(400, 40); c.fillText('旷野 · 布丁包', W / 2, y + 90 * u);
        c.fillStyle = K.ink; c.font = F(900, 170, C.SERIF); c.fillText('960', W / 2 - 40 * u, y + 270 * u);
        c.font = F(700, 56); c.textAlign = 'left'; c.fillText('元', W / 2 + 150 * u, y + 262 * u);
        c.restore();
        [['顺丰包邮', cue.ship], ['24 小时内发货', cue.fast], ['7 天无理由退货', cue.back]].forEach(([txt, when], k) => {
          const p = eOutCubic(inv(when, when + .5, lt)); if (p <= 0) return;
          const yy = y + 360 * u + k * 78 * u;
          c.save(); c.globalAlpha = p; c.translate((1 - p) * 30 * u, 0);
          c.fillStyle = K.grass; c.beginPath(); c.arc(x + 150 * u, yy - 14 * u, 12 * u, 0, TAU); c.fill();
          c.fillStyle = K.ink; c.font = F(400, 44); c.textAlign = 'left'; c.fillText(txt, x + 190 * u, yy);
          c.restore();
        });
      } },
      { at: at.b, mix: .4, draw: (c, lt, d) => {       // 2 品牌：北山制包所 · 2014 · 北京，竖排山海经
        bg(c); hills(c, lt);
        C.word(c, lt, '北山制包所', .2, d + 1, { size: 120, y: .26, color: K.ink, weight: 900 });
        C.word(c, lt, '2014 · 北京', cue.year, d + 1, { size: 60, y: .34, color: K.river, weight: 600 });
        const p = eOutCubic(inv(cue.book, cue.book + 1.2, lt));
        if (p > 0) {
          const chars = [...'山海经·北山经'], x = W / 2, y0 = H * .42;
          c.save(); c.font = F(600, 64, C.SERIF); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = K.ink;
          chars.forEach((ch, k) => { c.globalAlpha = clamp(p * chars.length - k); c.fillText(ch, x, y0 + k * 76 * u); });
          c.strokeStyle = '#B5462F'; c.lineWidth = 3 * u; c.globalAlpha = p;
          c.strokeRect(x - 52 * u, y0 - 50 * u, 104 * u, chars.length * 76 * u + 24 * u);
          c.restore();
        }
      } },
      { at: at.c, mix: .4, prep: s.vid.prep, draw: (c, lt, d) => {   // 3 品牌的话：草原慢放
        s.vid.paint(c, lt);
        C.film(c, t); C.shade(c, .2, .45); C.aiTag(c);
        ['有追求，但又节制', '有原则，且不圆滑', '独立，而不无聊'].forEach((w, k) =>
          C.word(c, lt, w, cue.w[k], d + 1, { size: 84, y: .3 + k * .085 }));
      } },
      { at: at.d, mix: .6, draw: (c, lt, d) => {       // 4 落版
        bg(c);
        const e = eOutCubic(inv(.2, 1, lt)), lw = W * .56, lh = lw * s.ink.height / s.ink.width;
        c.save(); c.globalAlpha = e; c.drawImage(s.ink, (W - lw) / 2, H * .42 - lh / 2 + (1 - e) * 20 * u, lw, lh); c.restore();
        C.word(c, lt, '旷野 · 布丁包', .6, d + 1, { size: 56, y: .5, color: K.ink, weight: 600 });
        c.save(); c.globalAlpha = smooth(.9, 1.4, lt); c.fillStyle = K.river; c.font = F(400, 30); c.textAlign = 'center';
        c.fillText('素材由品牌方提供 · 部分画面由 AI 生成', W / 2, H * .9); c.restore();
      } },
    ];
    await C.shots(ctx, t, list);
    C.sub(ctx, t);

    // 远山的线：三道起伏的细线，从左往右慢慢画出来
    function hills(c, lt) {
      c.save(); c.strokeStyle = 'rgba(126,139,116,.45)'; c.lineWidth = 3 * u;
      for (let k = 0; k < 3; k++) {
        const y = H * (.74 + k * .045), p = eInOutCubic(inv(k * .2, 1.6 + k * .2, lt));
        c.beginPath();
        for (let i = 0; i <= 60 * p; i++) { const x = W * i / 60, yy = y - 60 * u * Math.sin(i / 60 * Math.PI * (1.2 + k * .3) + k) * (1 - k * .25); i ? c.lineTo(x, yy) : c.moveTo(x, yy); }
        c.stroke();
      }
      c.restore();
    }
  }
});
