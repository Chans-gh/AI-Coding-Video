// C-100 旧档案剪贴簿：Canvas 2D 在 init 里用分形噪声做泛黄带锈斑的相册页，铜版插画（灯塔）用疏密不同的排线画在离屏卡片上再叠淡彩，卡片毛边是带抖动的多边形；draw 时卡片依次贴上、发黄胶带落下，麻绳上的木夹卡片轻晃，打字机字逐字敲出，勒索信剪字一块块拍上，红笔圈注按 drawPartial 画出，最后橡皮章砸下。
// 风格提示词：用旧档案剪贴簿风格：泛黄、带锈斑的老相册页，撕边卡片用发黄的胶带粘住或用木夹子夹在麻绳上，卡片上是手工上过淡彩的铜版插画，配打字机字、勒索信式剪字和红笔批注，最后盖一个橡皮章。
// 题材：纸艺、材质与定格 · 适合：调查与历史故事、田野笔记、悬疑纪录片
scene({
  id: 'C-100', name: '旧档案剪贴簿', dur: 4, still: 3.6,
  text: '失踪的看守人一九三一年十月三日雾很大北面有光已归档第号灯塔?',
  fonts: ["400 40px 'Noto Sans SC'", "900 40px 'Noto Sans SC'", "900 40px 'Noto Serif SC'", "40px 'Ma Shan Zheng'", "400 40px 'ZCOOL KuaiLe'", "400 40px 'JetBrains Mono'", "80px 'Bebas Neue'"],
  init() {
    const u = SHORT / 1080;
    // 相册页：底色 + 锈斑（噪声阈值）+ 边缘发暗
    const page = makePaper('#D9C49A', { seed: 100, grain: 20, fiber: .6, blot: 18, w: W, h: H }), pg = page.getContext('2d');
    const sm = mk(Math.ceil(W / 8), Math.ceil(H / 8)), sg = sm.getContext('2d'), id = sg.createImageData(sm.width, sm.height);
    for (let y = 0; y < sm.height; y++) for (let x = 0; x < sm.width; x++) {
      const n = fbm(x / 22, y / 22 + 40, 5), k = (y * sm.width + x) * 4, a = clamp((n - .56) * 5) * .55;
      id.data[k] = 120; id.data[k + 1] = 70; id.data[k + 2] = 30; id.data[k + 3] = a * 255;
    }
    sg.putImageData(id, 0, 0); pg.imageSmoothingEnabled = true; pg.drawImage(sm, 0, 0, W, H);
    const vg = pg.createRadialGradient(W / 2, H / 2, SHORT * .3, W / 2, H / 2, LONG * .7); vg.addColorStop(0, 'rgba(80,50,20,0)'); vg.addColorStop(1, 'rgba(80,50,20,.45)'); pg.fillStyle = vg; pg.fillRect(0, 0, W, H);
    const torn = (g, w, h, seed, col) => { const R = mulberry32(seed); g.beginPath(); resample(rectPts(6, 6, w - 12, h - 12), 200).forEach((p, i) => { const j = (R() - .5) * 6 * u; (i ? g.lineTo : g.moveTo).call(g, p.x + p.nx * j, p.y + p.ny * j); }); g.closePath(); g.fillStyle = col; g.fill(); };
    // 铜版插画卡片：灯塔
    const cw = Math.round(560 * u), ch = Math.round(680 * u), card = mk(cw, ch), c = card.getContext('2d');
    torn(c, cw, ch, 1, '#F1E6CC');
    const ix = 40 * u, iy = 40 * u, iw = cw - 80 * u, ih = ch - 170 * u;
    c.save(); c.beginPath(); c.rect(ix, iy, iw, ih); c.clip();
    c.strokeStyle = '#2A2219'; c.lineCap = 'round';
    // 天空：横排线，越往上越密
    for (let y = iy; y < iy + ih * .62; y += (3 + 4 * (y - iy) / ih) * u) { c.lineWidth = .9 * u; c.beginPath(); for (let x = ix; x < ix + iw; x += 6 * u) { if (hash2(x / u | 0, y / u | 0) < .06) c.moveTo(x + 6 * u, y); else c.lineTo(x, y + Math.sin(x * .05) * .4 * u); } c.stroke(); }
    // 灯塔：梯形塔身，右侧排线更密（背光）
    const tx = ix + iw * .5, tb = iy + ih * .74, tt = iy + ih * .2, w0 = 64 * u, w1 = 38 * u;
    c.fillStyle = '#F1E6CC'; c.beginPath(); c.moveTo(tx - w0, tb); c.lineTo(tx - w1, tt); c.lineTo(tx + w1, tt); c.lineTo(tx + w0, tb); c.fill();
    for (let y = tt; y < tb; y += 3 * u) { const q = (y - tt) / (tb - tt), hw = lerp(w1, w0, q); c.lineWidth = .8 * u; c.beginPath(); c.moveTo(tx + hw * .1, y); c.lineTo(tx + hw, y); c.stroke(); }
    for (let x = -1; x <= 1; x += .25) { c.lineWidth = .7 * u; c.beginPath(); c.moveTo(tx + x * w1, tt); c.lineTo(tx + x * w0, tb); c.stroke(); }
    c.lineWidth = 2 * u; c.beginPath(); c.moveTo(tx - w0, tb); c.lineTo(tx - w1, tt); c.lineTo(tx + w1, tt); c.lineTo(tx + w0, tb); c.stroke();
    c.strokeRect(tx - w1 - 8 * u, tt - 14 * u, (w1 + 8 * u) * 2, 14 * u); c.strokeRect(tx - w1 * .6, tt - 70 * u, w1 * 1.2, 56 * u);
    c.beginPath(); c.moveTo(tx - w1 * .8, tt - 70 * u); c.lineTo(tx, tt - 104 * u); c.lineTo(tx + w1 * .8, tt - 70 * u); c.stroke();
    // 光束：留白的楔形，边缘一道线
    c.beginPath(); c.moveTo(tx - 10 * u, tt - 44 * u); c.lineTo(ix - 10 * u, tt - 140 * u); c.lineTo(ix - 10 * u, tt + 20 * u); c.closePath(); c.fillStyle = 'rgba(241,230,204,.9)'; c.fill();
    // 礁石：交叉排线
    c.fillStyle = '#E6D8B8'; c.beginPath(); c.moveTo(ix, tb + 40 * u); c.quadraticCurveTo(tx - 140 * u, tb - 30 * u, tx - 40 * u, tb); c.lineTo(tx + 90 * u, tb + 4 * u); c.quadraticCurveTo(tx + 180 * u, tb + 10 * u, ix + iw, tb + 50 * u); c.lineTo(ix + iw, iy + ih); c.lineTo(ix, iy + ih); c.fill();
    c.save(); c.clip(); c.lineWidth = .8 * u;
    for (let k = -ih; k < iw + ih; k += 6 * u) { c.beginPath(); c.moveTo(ix + k, iy + ih * .7); c.lineTo(ix + k - ih * .3, iy + ih); c.stroke(); }
    for (let k = -ih; k < iw + ih; k += 9 * u) { c.beginPath(); c.moveTo(ix + k, iy + ih * .7); c.lineTo(ix + k + ih * .3, iy + ih); c.stroke(); }
    c.restore();
    // 海：波纹短线
    for (let y = tb + 10 * u; y < iy + ih; y += 9 * u) for (let x = ix; x < ix + iw; x += 30 * u) { if (hash2(x / u | 0, y / u | 0) < .5) { c.lineWidth = .8 * u; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8 * u, y - 3 * u, x + 18 * u, y); c.stroke(); } }
    // 手工淡彩：正片叠底
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = 'rgba(120,160,190,.35)'; c.fillRect(ix, iy, iw, ih * .62);
    c.fillStyle = 'rgba(190,60,50,.45)'; for (let k = 0; k < 3; k++) { const y = tt + (tb - tt) * (.12 + k * .3); c.fillRect(tx - w0, y, w0 * 2, (tb - tt) * .12); }
    c.fillStyle = 'rgba(80,130,120,.3)'; c.fillRect(ix, tb, iw, ih);
    c.fillStyle = 'rgba(230,190,90,.5)'; c.beginPath(); c.arc(tx, tt - 44 * u, 18 * u, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = '#2A2219'; c.lineWidth = 2 * u; c.strokeRect(ix, iy, iw, ih);
    c.fillStyle = '#2A2219'; c.font = `900 ${30 * u}px 'Noto Serif SC'`; c.textAlign = 'center'; c.fillText('第 七 号 灯 塔', cw / 2, ch - 82 * u);
    c.font = `400 ${18 * u}px 'JetBrains Mono'`; c.fillText('PL. VII  ·  1931', cw / 2, ch - 50 * u);
    // 木夹卡片（麻绳上）
    const kw = Math.round(300 * u), kh = Math.round(220 * u), clip = mk(kw, kh), k2 = clip.getContext('2d');
    torn(k2, kw, kh, 2, '#E8DCC0'); k2.fillStyle = '#3A2E22'; k2.font = `400 ${22 * u}px 'JetBrains Mono'`; k2.textAlign = 'center';
    k2.fillText('No. 0731', kw / 2, 70 * u); k2.font = `40px 'Ma Shan Zheng'`; k2.font = `${44 * u}px 'Ma Shan Zheng'`; k2.fillText('雾很大', kw / 2, 140 * u);
    // 打字机卡片
    const pw = Math.round((LAND ? 640 : 640) * u), ph = Math.round(300 * u), note = mk(pw, ph), n2 = note.getContext('2d');
    torn(n2, pw, ph, 3, '#F3EDDC'); n2.strokeStyle = 'rgba(120,150,190,.5)'; n2.lineWidth = 1.5 * u;
    for (let y = 80 * u; y < ph - 20 * u; y += 46 * u) { n2.beginPath(); n2.moveTo(24 * u, y + 10 * u); n2.lineTo(pw - 24 * u, y + 10 * u); n2.stroke(); }
    // 勒索信剪字：每个字一块不同纸、不同字体
    const fonts = [`900 ${86 * u}px 'Noto Sans SC'`, `${92 * u}px 'Ma Shan Zheng'`, `900 ${80 * u}px 'Noto Serif SC'`, `400 ${84 * u}px 'ZCOOL KuaiLe'`, `900 ${78 * u}px 'Noto Sans SC'`];
    const cols = [['#1F1B18', '#F2EAD3'], ['#C9B48A', '#2A1E14'], ['#B23A2C', '#F6EBD6'], ['#F4F0E6', '#1A1A1A'], ['#2E4A6B', '#F3EAD6']];
    const cut = [...'失踪的看守人'].map((ch, i) => {
      const [bgc, fc] = cols[i % 5], s0 = Math.round(118 * u), cc = mk(s0, s0), g = cc.getContext('2d'), R = mulberry32(i + 50);
      g.fillStyle = bgc; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R() * .5; g.lineTo(s0 / 2 + Math.cos(a) * s0 * (.42 + R() * .08), s0 / 2 + Math.sin(a) * s0 * (.42 + R() * .08)); } g.fill();
      g.fillStyle = fc; g.font = fonts[i % 5]; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, s0 / 2, s0 / 2 + 4 * u); return cc;
    });
    const sw = Math.round(360 * u), sh = Math.round(144 * u), stamp = mk(sw, sh), q = stamp.getContext('2d');
    q.translate(sw / 2, sh / 2); q.strokeStyle = '#A82424'; q.fillStyle = '#A82424'; q.lineWidth = 8 * u; rr(q, -170 * u, -62 * u, 340 * u, 124 * u, 14 * u); q.stroke();
    q.lineWidth = 3 * u; rr(q, -156 * u, -48 * u, 312 * u, 96 * u, 8 * u); q.stroke();
    q.font = `900 ${66 * u}px 'Noto Sans SC'`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('已 归 档', 0, 2 * u);
    q.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 160; i++) { q.globalAlpha = hash1(i) * .7; q.beginPath(); q.arc((hash1(i + 9) - .5) * 340 * u, (hash1(i + 19) - .5) * 124 * u, hash1(i + 29) * 6 * u, 0, TAU); q.fill(); }
    return { page, card, clip, note, cut, stamp };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.drawImage(s.page, 0, 0);
    const shadow = on => { if (on) { ctx.shadowColor = 'rgba(40,25,10,.4)'; ctx.shadowBlur = 14 * u; ctx.shadowOffsetX = 6 * u; ctx.shadowOffsetY = 10 * u; } else { ctx.shadowColor = 'transparent'; } };
    const tape = (x, y, w, a, p) => { if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = p * .8; ctx.fillStyle = '#E7D79A'; ctx.fillRect(-w / 2, -18 * u, w, 36 * u); ctx.fillStyle = 'rgba(160,120,40,.25)'; ctx.fillRect(-w / 2, -18 * u, w, 5 * u); ctx.restore(); };
    const place = (img, x, y, a, t0, sc = 1) => {
      const p = eOutCubic(inv(t0, t0 + .35, t)); if (p <= 0) return 0;
      ctx.save(); ctx.translate(x, y - (1 - p) * 60 * u); ctx.rotate(a + (1 - p) * .1); ctx.scale(sc * (1 + (1 - p) * .08), sc * (1 + (1 - p) * .08)); ctx.globalAlpha = p;
      shadow(true); ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore(); return p;
    };
    // 版式：[灯塔卡 x,y] [打字卡 x,y] [剪字起点 x,y,字距] [绳子 y、夹子 x]
    const Lc = LAND ? [W * .26, H * .54] : [W * .5, H * .42], Ln = LAND ? [W * .7, H * .74] : [W * .5, H * .83];
    const Lr = LAND ? [W * .5, H * .15, 120 * u] : [W * .5 - 300 * u, H * .14, 120 * u], rope = LAND ? H * .3 : H * .06, clipX = LAND ? W * .78 : W * .78;
    // 麻绳 + 木夹卡片
    ctx.strokeStyle = '#8A6A44'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.moveTo(-10, rope - 20 * u); ctx.quadraticCurveTo(W / 2, rope + 30 * u, W + 10, rope - 20 * u); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,40,20,.5)'; ctx.lineWidth = 1.5 * u; ctx.setLineDash([6 * u, 6 * u]); ctx.stroke(); ctx.setLineDash([]);
    if (LAND) {
      const sw = Math.sin(t * 2.2) * .05 * (1 - inv(0, 4, t) * .5), ry = rope + 12 * u;
      ctx.save(); ctx.translate(clipX, ry); ctx.rotate(sw); shadow(true); ctx.drawImage(s.clip, -s.clip.width / 2, 10 * u); shadow(false);
      ctx.fillStyle = '#B58B5A'; ctx.fillRect(-14 * u, -26 * u, 28 * u, 70 * u); ctx.fillStyle = '#8E6A40'; ctx.fillRect(-14 * u, 6 * u, 28 * u, 4 * u); ctx.restore();
    }
    // 灯塔卡 + 胶带
    const SC = LAND ? 1 : 1.3, pc = place(s.card, Lc[0], Lc[1], -.04, .1, SC);
    tape(Lc[0] - 220 * u * SC, Lc[1] - 330 * u * SC, 150 * u, -.6, inv(.4, .55, t)); tape(Lc[0] + 230 * u * SC, Lc[1] - 340 * u * SC, 150 * u, .55, inv(.5, .65, t));
    // 打字卡 + 逐字打字
    const pn = place(s.note, Ln[0], Ln[1], .025, .6, LAND ? 1 : 1.25);
    if (pn > 0) {
      const lines = ['1931年10月3日 22:40', '灯塔看守人最后一次记录：', '雾很大，北面有光。'], all = lines.join('').length;
      let n = Math.floor(inv(1.0, 2.5, t) * all);
      ctx.save(); ctx.translate(Ln[0], Ln[1]); ctx.rotate(.025); if (!LAND) ctx.scale(1.25, 1.25); ctx.textAlign = 'left';
      const x0 = -s.note.width / 2 + 36 * u;
      lines.forEach((ln, r) => { let x = x0; [...ln].forEach((ch, j) => { if (n-- <= 0) return; const mono = /[0-9:年月日 ]/.test(ch) && /[0-9:]/.test(ch); ctx.font = mono ? `400 ${32 * u}px 'JetBrains Mono'` : `400 ${34 * u}px 'Noto Sans SC'`; ctx.fillStyle = `rgba(30,24,20,${.7 + hash1(r * 40 + j) * .3})`; ctx.fillText(ch, x, -s.note.height / 2 + (82 + r * 46) * u + (hash1(r * 40 + j + 7) - .5) * 3 * u); x += ctx.measureText(ch).width + 1 * u; }); });
      ctx.restore();
    }
    // 勒索信剪字：一块块拍上
    s.cut.forEach((c, i) => {
      const t0 = 1.5 + i * .12, p = inv(t0, t0 + .14, t); if (p <= 0) return;
      const k = 1 + (1 - p) * .6, x = Lr[0] + (i - 2.5) * Lr[2] * (LAND ? 1 : .85), y = Lr[1] + (hash1(i + 3) - .5) * 26 * u;
      ctx.save(); ctx.translate(LAND ? x : Lr[0] + 300 * u + (i - 2.5) * Lr[2] * .85, y); ctx.rotate((hash1(i) - .5) * .35); ctx.scale(k, k); ctx.globalAlpha = p; shadow(true); ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore();
    });
    shadow(false);
    // 红笔：圈住灯塔 + 箭头 + 问号
    if (pc > 0) {
      const cx = Lc[0] + 4 * u * SC, cy = Lc[1] - 140 * u * SC, p = inv(2.3, 2.9, t);
      ctx.strokeStyle = 'rgba(190,30,30,.85)'; ctx.lineWidth = 6 * u; ctx.lineCap = 'round';
      drawPartial(ctx, circlePts(cx, cy, 120 * u * SC, 50, -1.2, -1.2 + TAU * 1.1, .25, 4).map(([x, y]) => [x, y * .9 + cy * .1 + (y - cy) * .2]), p);
      const q = inv(2.8, 3.1, t);
      if (q > 0) {
        const a0 = LAND ? [cx + 130 * u, cy - 40 * u] : [cx + 130 * u, cy - 80 * u], a1 = LAND ? [cx + 330 * u, cy - 190 * u] : [cx + 330 * u, cy - 250 * u];
        drawPartial(ctx, linePts(a1[0], a1[1], a0[0], a0[1], 10, 6 * u, 3), q);
        if (q >= 1) { ctx.beginPath(); ctx.moveTo(a0[0] + 26 * u, a0[1] - 2 * u); ctx.lineTo(...a0); ctx.lineTo(a0[0] + 12 * u, a0[1] - 26 * u); ctx.stroke(); }
        ctx.fillStyle = `rgba(190,30,30,${q})`; ctx.font = `${80 * u}px 'Ma Shan Zheng'`; ctx.textAlign = 'center'; ctx.fillText('?', a1[0] + 30 * u, a1[1] - 4 * u);
      }
    }
    // 橡皮章：已归档
    const sp = inv(3.2, 3.35, t);
    if (sp > 0) {
      const k = (1 + (1 - eOutCubic(sp)) * 1.2) * (LAND ? 1 : 1.2), x = LAND ? W * .52 : W * .66, y = LAND ? H * .5 : H * .68;
      ctx.save(); ctx.translate(x, y); ctx.rotate(-.18); ctx.scale(k, k); ctx.globalAlpha = sp * .85;
      ctx.drawImage(s.stamp, -s.stamp.width / 2, -s.stamp.height / 2);
      ctx.restore();
    }
  }
});
