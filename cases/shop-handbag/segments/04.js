// 第 4 段 多大、多重：前半，关键词大字 + 逐句字幕，段内溶解 0.4 秒。
// 1 一只手拎起黑色包（生视频，只出手）→ 2 包的正面线稿，高 16.5、宽 14、厚 14 cm 念到哪个画哪条 → 3 提手 13.5 cm、「不可拆」「不可调」
// → 4 手拎的画面定格，角落的秤读数滚到 360 g → 5 包和一部大屏手机的轮廓并排比高，小字「手工测量，误差 0–3 cm」。
// 3 层：底层生成镜头和奶白底，中层代码画的线稿和尺寸线，上层数字和字幕。时间由旁白 5 句驱动。
scene({
  id: 'shop-handbag:4', name: '多大、多重',
  needs: ['common.js'],
  fonts: ["900 96px 'Noto Serif SC'", "600 96px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  async init() {
    await C.init();
    const V = await loadVideo('gen/4-1.mp4').catch(() => null);
    const still = await loadImage('gen/4-1.jpg').catch(() => loadImage('brand/color/01-black.jpg'));
    const q = C.cue, s = i => SEG.vo[i].at;
    const at = { a: 0, b: s(1) - .2, c: s(2) - .2, d: s(3) - .2, e: s(4) - .2 };
    const vid = V ? C.clip(V, at.b) : null;
    // 定格用视频末帧
    let last = still;
    if (V) { const el = await V.at(V.dur - .1); last = mk(W, H); drawCover(last.getContext('2d'), el, 0, 0, W, H); }
    const cue = { h: q('16.5') - at.b, w: q('宽') - at.b, d: q('厚') - at.b, hd: q('13.5') - at.c, nc: q('不能拆') - at.c, na: q('也不能调') - at.c,
      kg: q('360') - at.d, err: q('误差') - at.e, phone: q('手机') - at.e };
    return { vid, still, last, at, cue };
  },
  async draw(ctx, t, s) {
    const { K, u, F, bg } = C, { at, cue } = s;
    const RED = '#B5462F';
    const list = [
      { at: at.a, prep: s.vid ? s.vid.prep : null, draw: (c, lt, d) => {
        s.vid ? s.vid.paint(c, lt) : drawCover(c, s.still, 0, 0, W, H, { zoom: 1.04 + .05 * lt / d });
        C.film(c, t, { warm: .12, vig: .3, grain: .08 }); C.aiTag(c);
      } },
      { at: at.b, mix: .4, draw: (c, lt, d) => {       // 2 正面线稿 + 高、宽、厚
        bg(c); push(c, lt, d); const B = bagAt(W * .54, H * .66, 30 * u);
        drawBag(c, B, 1);
        dim(c, B.x0 - 90 * u, B.top, B.x0 - 90 * u, B.bot, '16.5 cm', inv(cue.h, cue.h + .7, lt), 'left');
        dim(c, B.x0, B.bot + 80 * u, B.x1, B.bot + 80 * u, '14 cm', inv(cue.w, cue.w + .7, lt), 'below');
        // 厚：右下角斜着画一条，表示进深
        dim(c, B.x1 + 30 * u, B.bot + 10 * u, B.x1 + 160 * u, B.bot - 110 * u, '厚 14 cm', inv(cue.d, cue.d + .7, lt), 'right');
        C.word(c, lt, '高 16.5 · 宽 14 · 厚 14', cue.h, d + 1, { size: 64, y: .14, color: K.ink, weight: 900 });
      } },
      { at: at.c, mix: .4, draw: (c, lt, d) => {       // 3 提手 13.5 cm、不可拆、不可调
        bg(c); push(c, lt, d); const B = bagAt(W * .46, H * .66, 30 * u);
        drawBag(c, B, 1, true);
        dim(c, B.x1 + 70 * u, B.top - B.k * 13.5, B.x1 + 70 * u, B.top, '13.5 cm', inv(cue.hd, cue.hd + .7, lt), 'right');
        badge(c, W * .3, H * .17, '不可拆', inv(cue.nc, cue.nc + .5, lt));
        badge(c, W * .7, H * .17, '不可调', inv(cue.na, cue.na + .5, lt));
      } },
      { at: at.d, mix: .4, draw: (c, lt, d) => {       // 4 定格 + 秤读数
        drawCover(c, s.last, 0, 0, W, H, { zoom: 1.02 });
        C.film(c, t, { warm: .12, vig: .3, grain: .08 }); C.aiTag(c);
        scale(c, lt);
      } },
      { at: at.e, mix: .4, draw: (c, lt, d) => {       // 5 和手机比高
        bg(c); push(c, lt, d); const k = 34 * u, base = H * .72;
        const B = bagAt(W * .36, base, k); drawBag(c, B, 1);
        const pw = 7.8 * k, ph = 15.9 * k, px = W * .72 - pw / 2, py = base - ph, p = eOutCubic(inv(cue.phone - .2, cue.phone + .6, lt));
        c.save(); c.globalAlpha = p; c.translate(0, (1 - p) * 60 * u);
        c.fillStyle = 'rgba(42,38,34,.06)'; c.strokeStyle = K.ink; c.lineWidth = 6 * u; rr(c, px, py, pw, ph, 46 * u); c.fill(); c.stroke();
        c.lineWidth = 3 * u; rr(c, px + 16 * u, py + 16 * u, pw - 32 * u, ph - 32 * u, 32 * u); c.stroke();
        c.font = F(400, 34); c.fillStyle = K.river; c.textAlign = 'center'; c.fillText('大屏手机 约 16 cm', px + pw / 2, base + 60 * u);
        c.restore();
        c.save(); c.font = F(400, 34); c.fillStyle = K.river; c.textAlign = 'center'; c.globalAlpha = smooth(.2, .8, lt);
        c.fillText('包身 16.5 cm', B.cx, base + 60 * u); c.restore();
        // 一条虚线拉齐两个顶
        const pl = smooth(cue.phone + .6, cue.phone + 1.4, lt);
        c.save(); c.globalAlpha = pl; c.strokeStyle = RED; c.lineWidth = 3 * u; c.setLineDash([14 * u, 10 * u]);
        c.beginPath(); c.moveTo(W * .1, B.top); c.lineTo(W * .9, B.top); c.stroke(); c.restore();
        C.word(c, lt, '差不多一样高', cue.phone + 1, d + 1, { size: 80, y: .14, color: K.ink, weight: 900 });
        c.save(); c.globalAlpha = smooth(cue.err, cue.err + .5, lt); c.font = F(400, 34); c.fillStyle = K.ink; c.textAlign = 'center';
        c.fillText('手工测量，误差 0–3 cm', W / 2, base + 130 * u); c.restore();
      } },
    ];
    await C.shots(ctx, t, list);
    C.sub(ctx, t);

    // 线稿镜头慢慢推近一点，免得整段停住（bg 之后调，变换由 shots 收回）
    function push(c, lt, d) { const k = 1 + .05 * eInOutCubic(clamp(lt / d)); c.translate(W / 2, H * .55); c.scale(k, k); c.translate(-W / 2, -H * .55); }
    // 包的正面尺寸（cm）：包身高 16.5、底宽 14、顶宽约 10.5；提手高 13.5。k 是每厘米多少像素，(cx, bot) 是底边中点
    function bagAt(cx, bot, k) {
      const h = 16.5 * k, wb = 14 * k, wt = 10.5 * k;
      return { cx, bot, top: bot - h, x0: cx - wb / 2, x1: cx + wb / 2, t0: cx - wt / 2, t1: cx + wt / 2, k };
    }
    function drawBag(c, B, a, hl) {
      c.save(); c.globalAlpha = a; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(B.t0, B.top); c.lineTo(B.t1, B.top); c.lineTo(B.x1, B.bot); c.lineTo(B.x0, B.bot); c.closePath();
      c.fillStyle = 'rgba(42,38,34,.08)'; c.fill(); c.strokeStyle = K.ink; c.lineWidth = 6 * u; c.stroke();
      c.beginPath(); c.ellipse(B.cx, B.top, (B.t1 - B.t0) / 2 + 8 * u, 12 * u, 0, 0, TAU); c.fillStyle = '#E6DCCB'; c.fill(); c.stroke();
      // 提手和珠子
      const hx = (B.t1 - B.t0) * .3, ht = B.top - B.k * 13.5;
      c.strokeStyle = hl ? RED : K.ink; c.lineWidth = (hl ? 7 : 6) * u;
      c.beginPath(); c.moveTo(B.cx - hx, B.top); c.lineTo(B.cx - hx, ht + hx); c.arcTo(B.cx - hx, ht, B.cx, ht, hx); c.arcTo(B.cx + hx, ht, B.cx + hx, ht + hx, hx); c.lineTo(B.cx + hx, B.top); c.stroke();
      c.fillStyle = '#8A5A36'; c.strokeStyle = K.ink; c.lineWidth = 3 * u;
      for (let j = 0; j < 3; j++) for (const sx of [-1, 1]) { c.beginPath(); c.arc(B.cx + sx * hx, B.top - B.k * (1.3 + j * 2.1), B.k * 1.05, 0, TAU); c.fill(); c.stroke(); }
      c.restore();
    }
    // 尺寸线：两端短竖线 + 中间数字；p 0–1 画出来
    function dim(c, x0, y0, x1, y1, txt, p, where) {
      if (p <= 0) return;
      const e = eInOutCubic(p), xm = lerp(x0, x1, e), ym = lerp(y0, y1, e), ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang) * 18 * u, ny = Math.cos(ang) * 18 * u;
      c.save(); c.strokeStyle = RED; c.fillStyle = RED; c.lineWidth = 4 * u; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0 - nx, y0 - ny); c.lineTo(x0 + nx, y0 + ny); c.moveTo(x0, y0); c.lineTo(xm, ym); c.stroke();
      if (e >= 1) { c.beginPath(); c.moveTo(x1 - nx, y1 - ny); c.lineTo(x1 + nx, y1 + ny); c.stroke(); }
      c.globalAlpha = smooth(.6, 1, p); c.font = F(700, 48); c.textBaseline = 'middle';
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      if (where === 'left') { c.textAlign = 'right'; c.fillText(txt, mx - 30 * u, my); }
      else if (where === 'below') { c.textAlign = 'center'; c.fillText(txt, mx, my + 56 * u); }
      else { c.textAlign = 'left'; c.fillText(txt, mx + 30 * u, my); }
      c.restore();
    }
    // 圆角标签 + 一条斜杠（不可拆、不可调）
    function badge(c, x, y, txt, p) {
      if (p <= 0) return;
      const e = eOutBack(p), w = 260 * u, h = 96 * u;
      c.save(); c.translate(x, y); c.scale(e, e);
      c.fillStyle = '#FBF8F2'; c.strokeStyle = RED; c.lineWidth = 4 * u; rr(c, -w / 2, -h / 2, w, h, h / 2); c.fill(); c.stroke();
      c.fillStyle = RED; c.font = F(700, 46); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, 2 * u);
      c.restore();
    }
    // 右下角的电子秤读数：0 → 360 g
    function scale(c, lt) {
      const e = eOutCubic(inv(.1, .5, lt)), v = Math.round(360 * eOutCubic(inv(cue.kg + .1, cue.kg + 1.1, lt)));
      const w = 420 * u, h = 200 * u, x = W - w - 60 * u, y = H * .58 + (1 - e) * 30 * u;
      c.save(); c.globalAlpha = e;
      c.fillStyle = 'rgba(42,38,34,.82)'; rr(c, x, y, w, h, 24 * u); c.fill();
      c.fillStyle = '#1C1A17'; rr(c, x + 24 * u, y + 24 * u, w - 48 * u, h - 48 * u, 12 * u); c.fill();
      c.fillStyle = '#E8D9A8'; c.font = F(700, 96, C.SANS); c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillText(String(v), x + w - 120 * u, y + h / 2 + 4 * u);
      c.font = F(400, 44); c.textAlign = 'left'; c.fillText('g', x + w - 100 * u, y + h / 2 + 12 * u);
      c.restore();
    }
  }
});
