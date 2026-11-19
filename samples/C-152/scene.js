// C-152 波斯细密画：init 里把一整页画到比画面高的离屏画布上——不用透视，从下往上堆花园和溪水、铺八角星瓷砖的平台、拱门亭子、粉紫色海绵状山石和金色天空，每层都铺满小花和纹样，几十个小人各做各的事；页边是洒金纸、泥金藤蔓花边，上下各一栏用笔画拼出的仿书法；每帧镜头从下往上缓慢摇，溪水流动、鸟飞过、琴师拨弦、倒水的人倒水、旗子飘动。
// 风格提示词：用波斯细密画风格：画面不用透视，花园、建筑和人物从下往上层层堆叠，每一层都布满精细的花草纹样，群青、翠绿、朱红和金色平涂，边框外有书法栏和泥金花边，人物小而多、同时在做不同的事，镜头像读书页一样从下往上缓慢摇，配乌德琴。
// 题材：手绘与绘画 · 适合：中东与丝路故事、宫廷与诗歌、群像叙事
scene({
  id: 'C-152', name: '波斯细密画', dur: 5, still: 2.5,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    const C = { ult: '#24409A', tq: '#2E9A9A', grn: '#3E8A3A', grn2: '#7AB04A', red: '#C8341E', gold: '#D4A43A', gold2: '#F2D27A', cream: '#F2E6C8', pink: '#D9A0B0', lil: '#A48AC0', ink: '#1E1410', wht: '#F8F2E4', skin: '#F0D2B0' };
    const PW = W, PH = Math.round(LAND ? H * 2.3 : H * 1.55), pg = mk(PW, PH), g = pg.getContext('2d'), R = mulberry32(17);
    const m = 44 * u, fw = 26 * u, X0 = m + fw, X1 = PW - m - fw, Y0 = m + fw, Y1 = PH - m - fw, IW = X1 - X0, IH = Y1 - Y0;
    const Yf = f => Y1 - f * IH;                                                   // 从下往上的高度比例 → y
    g.lineJoin = 'round'; g.lineCap = 'round';
    // 洒金页边
    g.drawImage(makePaper('#EADCB8', { w: PW / 2, h: PH / 2, grain: 8, fiber: .3, blot: 14, seed: 5 }), 0, 0, PW, PH);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(212,164,58,${.4 + R() * .5})`; const x = R() * PW, y = R() * PH, r = (1 + R() * 3) * u; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x, y - r * .6); g.lineTo(x + r * .8, y + r * .3); g.fill(); }
    // 泥金藤蔓花边（框外一圈）
    g.fillStyle = C.ult; g.fillRect(m, m, PW - 2 * m, PH - 2 * m); g.fillStyle = C.gold; g.fillRect(m + 4 * u, m + 4 * u, PW - 2 * m - 8 * u, PH - 2 * m - 8 * u);
    g.fillStyle = C.ult; g.fillRect(m + 8 * u, m + 8 * u, PW - 2 * m - 16 * u, PH - 2 * m - 16 * u);
    const vineBand = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(L / (40 * u)); g.strokeStyle = C.gold; g.lineWidth = 1.6 * u;
      g.beginPath(); for (let i = 0; i <= n * 4; i++) { const q = i / (n * 4), s2 = Math.sin(q * n * Math.PI) * 6 * u; g.lineTo(lerp(x0, x1, q) - (y1 - y0) / L * s2, lerp(y0, y1, q) + (x1 - x0) / L * s2); } g.stroke();
      for (let i = 0; i < n; i++) { const q = (i + .5) / n, x = lerp(x0, x1, q), y = lerp(y0, y1, q); g.fillStyle = i % 2 ? C.red : C.wht; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * TAU / 5) * 3.6 * u, y + Math.sin(k * TAU / 5) * 3.6 * u, 2.6 * u, 0, TAU); g.fill(); } g.fillStyle = C.gold2; g.beginPath(); g.arc(x, y, 2 * u, 0, TAU); g.fill(); } };
    const bm = m + fw / 2 + 2 * u; vineBand(bm, bm, PW - bm, bm); vineBand(bm, PH - bm, PW - bm, PH - bm); vineBand(bm, bm, bm, PH - bm); vineBand(PW - bm, bm, PW - bm, PH - bm);
    // 仿书法：从右往左，竖笔、碗形、齿、点
    const script = (x0, x1, y, sz, col = C.ink) => { let x = x1 - sz * .3; g.strokeStyle = col; g.fillStyle = col;
      while (x > x0 + sz * 1.6) { const n = 2 + (R() * 4 | 0), yb = y;
        for (let i = 0; i < n && x > x0 + sz; i++) { const k = R(); g.lineWidth = sz * .14; g.beginPath();
          if (k < .28) { g.moveTo(x, yb - sz * 1.3); g.quadraticCurveTo(x - sz * .08, yb - sz * .5, x - sz * .02, yb); x -= sz * .32; }
          else if (k < .5) { g.moveTo(x, yb); g.bezierCurveTo(x - sz * .2, yb + sz * .7, x - sz * 1.2, yb + sz * .6, x - sz * 1.3, yb - sz * .1); x -= sz * .9; }
          else if (k < .75) { g.moveTo(x, yb); g.lineTo(x - sz * .2, yb); g.lineTo(x - sz * .26, yb - sz * .3); g.moveTo(x - sz * .26, yb); g.lineTo(x - sz * .55, yb); x -= sz * .55; }
          else { g.moveTo(x, yb); g.bezierCurveTo(x - sz * .1, yb - sz * .6, x - sz * .6, yb - sz * .5, x - sz * .5, yb); g.lineTo(x - sz * .9, yb + sz * .05); x -= sz * .9; }
          g.stroke(); if (R() < .45) { g.beginPath(); g.arc(x + sz * .3, yb + (R() < .5 ? -sz * .55 : sz * .45), sz * .09, 0, TAU); g.fill(); } }
        x -= sz * .7; } };
    const panel = (y0, h) => { g.fillStyle = C.cream; g.fillRect(X0, y0, IW, h); g.strokeStyle = C.red; g.lineWidth = 2 * u; g.strokeRect(X0 + 5 * u, y0 + 5 * u, IW - 10 * u, h - 10 * u);
      const cols = LAND ? 4 : 2, cw = IW / cols; for (let i = 0; i < cols; i++) { const x = X0 + i * cw; g.fillStyle = C.gold; g.globalAlpha = .45;
        g.beginPath(); for (let k = 0; k <= 30; k++) { const q = k / 30; g.lineTo(x + cw * (.06 + q * .88), y0 + h * (.5 + Math.sin(q * TAU * 2) * .3)); } for (let k = 30; k >= 0; k--) { const q = k / 30; g.lineTo(x + cw * (.06 + q * .88), y0 + h * (.5 + Math.sin(q * TAU * 2) * .3) + h * .16); } g.fill(); g.globalAlpha = 1;
        script(x + cw * .1, x + cw * .9, y0 + h * .62, h * .32);
        if (i) { g.strokeStyle = C.ult; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(x, y0 + 8 * u); g.lineTo(x, y0 + h - 8 * u); g.stroke(); } } };
    g.save(); g.beginPath(); g.rect(X0, Y0, IW, IH); g.clip();
    // 底：花园和溪水
    const ph = IH * .07;
    g.fillStyle = C.grn; g.fillRect(X0, Yf(.34), IW, Yf(.07) - Yf(.34));
    const flowers = (y0, y1, n) => { for (let i = 0; i < n; i++) { const x = X0 + R() * IW, y = lerp(y0, y1, R()), r = (2 + R() * 2.4) * u, c = [C.red, C.wht, C.gold2, C.pink][i % 4];
      g.strokeStyle = C.grn2; g.lineWidth = 1 * u; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + r * 3); g.stroke(); g.fillStyle = c; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * TAU / 5) * r, y + Math.sin(k * TAU / 5) * r, r * .7, 0, TAU); g.fill(); } } };
    flowers(Yf(.33), Yf(.08), LAND ? 900 : 520);
    const streamY = q => Yf(.2) + Math.sin(q * TAU * 1.5) * IH * .03, sw = IH * .025;           // 溪水：银蓝色，弯弯地横穿
    g.fillStyle = '#9AB4C8'; g.beginPath(); for (let i = 0; i <= 60; i++) g.lineTo(X0 + i / 60 * IW, streamY(i / 60) - sw); for (let i = 60; i >= 0; i--) g.lineTo(X0 + i / 60 * IW, streamY(i / 60) + sw); g.fill(); g.strokeStyle = C.wht; g.lineWidth = 2 * u; g.stroke();
    const cypress = (x, y, h) => { g.fillStyle = '#1E5A30'; g.beginPath(); g.moveTo(x, y - h); g.quadraticCurveTo(x + h * .16, y - h * .5, x + h * .07, y); g.lineTo(x - h * .07, y); g.quadraticCurveTo(x - h * .16, y - h * .5, x, y - h); g.fill();
      g.strokeStyle = '#3E8A4A'; g.lineWidth = 1 * u; for (let i = 0; i < 12; i++) { const yy = y - h * (.1 + i * .07); g.beginPath(); g.moveTo(x - h * .05, yy); g.lineTo(x, yy - h * .03); g.lineTo(x + h * .05, yy); g.stroke(); } };
    const bloom = (x, y, h) => { g.strokeStyle = '#6A4A2A'; g.lineWidth = 4 * u; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h * .5); g.stroke();
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .45; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(x, y - h * .45); g.quadraticCurveTo(x + Math.cos(a) * h * .2, y - h * .6, x + Math.cos(a) * h * .4, y - h * .5 + Math.sin(a) * h * .45); g.stroke(); }
      g.fillStyle = 'rgba(122,176,74,.85)'; g.beginPath(); g.ellipse(x, y - h * .72, h * .4, h * .32, 0, 0, TAU); g.fill();
      for (let i = 0; i < 160; i++) { const a = R() * TAU, r = Math.sqrt(R()) * h * .4; g.fillStyle = R() < .5 ? C.wht : C.pink; g.beginPath(); g.arc(x + Math.cos(a) * r, y - h * .72 + Math.sin(a) * r * .8, 4.5 * u, 0, TAU); g.fill(); } };
    // 小人：头巾 + 长袍，站或坐；动的部分（手）每帧另画
    const figs = [];
    const fig = (x, y, s, o) => { const P = (a, b) => [x + a * s * (o.left ? -1 : 1), y + b * s];
      g.fillStyle = o.robe; g.strokeStyle = C.ink; g.lineWidth = 1 * u;
      if (o.sit) { g.beginPath(); g.moveTo(...P(-14, 0)); g.quadraticCurveTo(...P(-12, -26), ...P(-6, -32)); g.lineTo(...P(6, -32)); g.quadraticCurveTo(...P(14, -20), ...P(16, 0)); g.closePath(); g.fill(); g.stroke(); }
      else { g.beginPath(); g.moveTo(...P(-9, 0)); g.lineTo(...P(-6, -42)); g.lineTo(...P(6, -42)); g.lineTo(...P(10, 0)); g.closePath(); g.fill(); g.stroke(); g.fillStyle = C.ink; g.fillRect(...P(-6, -1), 5 * s, 1.5 * s); g.fillRect(...P(2, -1), 5 * s, 1.5 * s); }
      const top = o.sit ? -32 : -42; g.fillStyle = o.sash; g.fillRect(...P(-6, top + 12), 12 * s * (o.left ? -1 : 1), 3 * s);
      g.fillStyle = o.coat || o.robe; g.beginPath(); g.moveTo(...P(-6, top)); g.lineTo(...P(-8, top + 22)); g.lineTo(...P(-3, top + 22)); g.lineTo(...P(-1, top)); g.fill();
      g.fillStyle = C.skin; g.beginPath(); g.ellipse(...P(1, top - 6), 5 * s, 6 * s, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = C.ink; g.beginPath(); g.arc(...P(2.6, top - 7), .7 * s, 0, TAU); g.fill();
      g.fillStyle = o.turban || C.wht; g.beginPath(); g.ellipse(...P(0, top - 11), 6.5 * s, 4.5 * s, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = C.red; g.fillRect(...P(-1, top - 19), 2 * s * (o.left ? -1 : 1), 6 * s);
      if (o.beard) { g.fillStyle = C.ink; g.beginPath(); g.moveTo(...P(-2, top - 3)); g.lineTo(...P(5, top - 3)); g.lineTo(...P(2, top + 3)); g.fill(); }
      if (o.act) figs.push({ x, y: y + top * s, s, left: o.left, act: o.act }); };
    const pal = [[C.red, C.gold], [C.ult, C.red], [C.grn, C.gold], [C.tq, C.red], ['#E07A2A', C.ult], [C.lil, C.gold], [C.wht, C.ult]];
    const fs = (LAND ? 3.4 : 2.6) * u;
    // 花园里的人：园丁、两人在溪边说话、倒水的仆人
    for (let i = 0; i < (LAND ? 7 : 4); i++) { const x = X0 + IW * (i + .5) / (LAND ? 7 : 4) + (R() - .5) * 40 * u; (i % 2 ? cypress : bloom)(x, Yf(i % 2 ? .23 : .09), IH * (LAND ? .12 : .09)); }
    fig(X0 + IW * .18, Yf(.1), fs, { robe: pal[2][0], sash: pal[2][1], act: 'dig' });
    fig(X0 + IW * .42, Yf(.25), fs, { robe: pal[0][0], sash: pal[0][1], beard: true }); fig(X0 + IW * .48, Yf(.25), fs, { robe: pal[1][0], sash: pal[1][1], left: true, act: 'talk' });
    fig(X0 + IW * .74, Yf(.12), fs, { robe: pal[3][0], sash: pal[3][1], act: 'pour' });
    // 平台：八角星瓷砖地 + 地毯 + 坐着的人
    const tiles = (x0, y0, w, h, s) => { g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.fillStyle = C.wht; g.fillRect(x0, y0, w, h);
      for (let y = y0; y < y0 + h + s; y += s) for (let x = x0; x < x0 + w + s; x += s) { g.fillStyle = ((x - x0) / s + (y - y0) / s) % 2 < 1 ? C.ult : C.tq;
        g.beginPath(); for (let k = 0; k < 16; k++) { const a = k * TAU / 16, r = k % 2 ? s * .28 : s * .42; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill();
        g.fillStyle = C.gold; g.beginPath(); g.arc(x + s / 2, y + s / 2, s * .1, 0, TAU); g.fill(); } g.restore(); };
    tiles(X0, Yf(.48), IW, Yf(.34) - Yf(.48), 26 * u);
    g.fillStyle = C.red; const cx0 = X0 + IW * .25, cw0 = IW * .5, cy0 = Yf(.46), ch0 = Yf(.36) - Yf(.46); g.fillRect(cx0, cy0, cw0, ch0); g.strokeStyle = C.gold; g.lineWidth = 6 * u; g.strokeRect(cx0 + 8 * u, cy0 + 8 * u, cw0 - 16 * u, ch0 - 16 * u);
    g.fillStyle = C.ult; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(cx0 + cw0 * (i + .5) / 6, cy0 + ch0 / 2, Math.min(ch0 * .18, cw0 / 16), 0, TAU); g.fill(); }
    fig(X0 + IW * .34, Yf(.4), fs, { robe: pal[4][0], sash: pal[4][1], sit: true, act: 'oud' });
    fig(X0 + IW * .5, Yf(.42), fs * 1.15, { robe: pal[1][0], sash: C.gold, coat: C.gold, sit: true, beard: true, turban: C.wht });   // 主人稍大
    fig(X0 + IW * .64, Yf(.4), fs, { robe: pal[5][0], sash: pal[5][1], sit: true, left: true, act: 'read' });
    fig(X0 + IW * .1, Yf(.36), fs, { robe: pal[6][0], sash: pal[6][1], act: 'tray' }); fig(X0 + IW * .88, Yf(.36), fs, { robe: pal[3][0], sash: pal[3][1], left: true });
    // 山石和金天
    g.fillStyle = C.gold; g.fillRect(X0, Yf(.93), IW, Yf(.77) - Yf(.93));
    for (let i = 0; i < 18; i++) { const x = X0 + R() * IW, y = Yf(.78 + R() * .06), r = (60 + R() * 90) * u; g.fillStyle = [C.lil, C.pink, '#C8A0D0', '#8A9AC8'][i % 4];
      g.beginPath(); for (let k = 0; k <= 60; k++) { const a = Math.PI + k / 60 * Math.PI, rr = r * (1 + .1 * Math.sin(a * 5 + i) + .05 * Math.sin(a * 11 + i)); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 1.3); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(60,30,60,.5)'; g.lineWidth = 1.4 * u; g.stroke();
      for (let k = 1; k < 4; k++) { g.beginPath(); for (let q = 0; q <= 20; q++) { const a = Math.PI * (1.15 + q / 20 * .7); g.lineTo(x + Math.cos(a) * r * (1 - k * .22), y + Math.sin(a) * r * 1.3 * (1 - k * .22) - k * 4 * u); } g.stroke(); } }
    g.fillStyle = C.grn2; g.fillRect(X0, Yf(.78), IW, Yf(.48) - Yf(.78)); flowers(Yf(.77), Yf(.5), LAND ? 500 : 260);
    for (let i = 0; i < (LAND ? 9 : 5); i++) { const x = X0 + IW * (i + .5) / (LAND ? 9 : 5); (i % 2 ? cypress : bloom)(x, Yf(.5 + (i % 3) * .04), IH * .16); }
    for (let i = 0; i < 5; i++) { const x = X0 + IW * (.1 + i * .2), y = Yf(.88 + (i % 2) * .02); g.strokeStyle = C.wht; g.lineWidth = 6 * u; g.beginPath();      // 云带
      for (let k = 0; k <= 30; k++) { const q = k / 30; g.lineTo(x + (q - .5) * 200 * u, y + Math.sin(q * TAU * 1.5) * 14 * u); } g.stroke(); g.strokeStyle = C.ult; g.lineWidth = 1.2 * u; g.stroke(); }
    // 亭子：瓷砖墙、拱门、金顶，楼上也有人
    const bx0 = X0 + IW * (LAND ? .14 : .06), bx1 = X1 - IW * (LAND ? .14 : .06), by0 = Yf(.74), by1 = Yf(.48);
    g.fillStyle = '#E8D8B8'; g.fillRect(bx0, by0, bx1 - bx0, by1 - by0); tiles(bx0, by1 - (by1 - by0) * .22, bx1 - bx0, (by1 - by0) * .22, 20 * u);
    const nA = LAND ? 5 : 3, aw = (bx1 - bx0) / nA;
    for (let i = 0; i < nA; i++) { const ax = bx0 + aw * (i + .5), aT = by0 + (by1 - by0) * .18, aB = by1 - (by1 - by0) * .26, w2 = aw * .32;
      g.fillStyle = i === (nA >> 1) ? '#1A2440' : C.ult; g.beginPath(); g.moveTo(ax - w2, aB); g.lineTo(ax - w2, aT + w2); g.quadraticCurveTo(ax - w2, aT, ax, aT - w2 * .5); g.quadraticCurveTo(ax + w2, aT, ax + w2, aT + w2); g.lineTo(ax + w2, aB); g.fill();
      g.strokeStyle = C.gold; g.lineWidth = 3 * u; g.stroke();
      if (i !== (nA >> 1)) { g.strokeStyle = C.gold2; g.lineWidth = 1.2 * u; g.beginPath(); g.moveTo(ax, aT - w2 * .4); g.lineTo(ax, aT + w2 * .6); g.stroke(); g.fillStyle = C.gold2; g.beginPath(); g.moveTo(ax - 6 * u, aT + w2 * .6); g.lineTo(ax + 6 * u, aT + w2 * .6); g.lineTo(ax, aT + w2 * .6 + 16 * u); g.fill(); } }
    g.fillStyle = C.tq; g.fillRect(bx0 - 10 * u, by0 - 14 * u, bx1 - bx0 + 20 * u, 18 * u); g.fillStyle = C.gold; for (let x = bx0; x < bx1; x += 18 * u) g.fillRect(x, by0 - 30 * u, 9 * u, 16 * u);
    // 金顶和旗杆
    const dx = (bx0 + bx1) / 2, dr = (bx1 - bx0) * (LAND ? .12 : .2);
    g.fillStyle = C.gold; g.beginPath(); g.moveTo(dx - dr, by0 - 30 * u); g.bezierCurveTo(dx - dr, by0 - 30 * u - dr * 1.5, dx, by0 - 30 * u - dr * 1.2, dx, by0 - 30 * u - dr * 1.9); g.bezierCurveTo(dx, by0 - 30 * u - dr * 1.2, dx + dr, by0 - 30 * u - dr * 1.5, dx + dr, by0 - 30 * u); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.4 * u; g.stroke();
    g.strokeStyle = C.gold2; g.lineWidth = 1 * u; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(dx - dr + k * dr * .4, by0 - 30 * u); g.quadraticCurveTo(dx - dr * .6 + k * dr * .3, by0 - 30 * u - dr * 1.3, dx, by0 - 30 * u - dr * 1.9); g.stroke(); }
    const flagAt = [[bx0 + 20 * u, by0 - 30 * u], [bx1 - 20 * u, by0 - 30 * u]]; flagAt.forEach(([x, y]) => { g.strokeStyle = C.ink; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 110 * u); g.stroke(); });
    // 楼上平台的人
    for (let i = 0; i < nA; i++) if (i !== (nA >> 1)) fig(bx0 + aw * (i + .5), by1 - (by1 - by0) * .26, fs * .9, { robe: pal[(i + 2) % 7][0], sash: pal[(i + 2) % 7][1], left: i > nA / 2, act: i === 0 ? 'wave' : null });
    g.restore();
    panel(Yf(1), Yf(.93) - Yf(1)); panel(Yf(.07), ph);
    return { u, pg, PH, X0, IW, streamY, sw, figs, flagAt, C };
  },
  draw(ctx, t, s) {
    const { u, C } = s, oy = (s.PH - H) * (1 - (1 - Math.cos(clamp(t / 5) * Math.PI)) / 2);
    ctx.drawImage(s.pg, 0, -oy);
    ctx.save(); ctx.translate(0, -oy); ctx.lineCap = 'round';
    // 溪水：白色波纹往右流
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.6 * u;
    for (let i = 0; i < 40; i++) { const q = ((i / 40 + t * .05) % 1), x = s.X0 + q * s.IW, y = s.streamY(q) + ((i % 3) - 1) * s.sw * .5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8 * u, y - 4 * u, x + 16 * u, y); ctx.stroke(); }
    // 小人的动作
    for (const f of s.figs) { const d = f.left ? -1 : 1, k = f.s; ctx.strokeStyle = C.skin; ctx.lineWidth = 2.2 * k; ctx.fillStyle = C.ink;
      if (f.act === 'oud') { ctx.fillStyle = '#8A5A2A'; ctx.beginPath(); ctx.ellipse(f.x + 8 * k * d, f.y + 16 * k, 8 * k, 6 * k, -.5 * d, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5A3A1A'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(f.x + 12 * k * d, f.y + 12 * k); ctx.lineTo(f.x + 24 * k * d, f.y + 2 * k); ctx.stroke();
        ctx.strokeStyle = C.skin; ctx.lineWidth = 2.2 * k; ctx.beginPath(); ctx.moveTo(f.x, f.y + 8 * k); ctx.lineTo(f.x + (6 + Math.sin(t * 18) * 2) * k * d, f.y + (17 + Math.sin(t * 18) * 1.5) * k); ctx.stroke(); }
      if (f.act === 'pour') { const a = Math.sin(t * 2) * .3; ctx.save(); ctx.translate(f.x + 10 * k * d, f.y + 12 * k); ctx.rotate(a * d - .4 * d); ctx.fillStyle = C.gold; ctx.beginPath(); ctx.ellipse(0, 0, 4 * k, 6 * k, 0, 0, TAU); ctx.fill(); ctx.fillRect(0, -6 * k, 6 * k * d, 2 * k); ctx.restore();
        ctx.strokeStyle = 'rgba(200,230,255,.9)'; ctx.lineWidth = 1.4 * k; ctx.beginPath(); ctx.moveTo(f.x + 16 * k * d, f.y + 8 * k); ctx.quadraticCurveTo(f.x + 22 * k * d, f.y + 20 * k, f.x + 20 * k * d, f.y + 42 * k); ctx.stroke(); }
      if (f.act === 'dig') { const a = Math.sin(t * 4) * .4; ctx.save(); ctx.translate(f.x + 6 * k * d, f.y + 10 * k); ctx.rotate(a); ctx.strokeStyle = '#6A4A2A'; ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.moveTo(0, -4 * k); ctx.lineTo(4 * k, 34 * k); ctx.stroke(); ctx.fillStyle = '#8A8A8A'; ctx.fillRect(1 * k, 30 * k, 7 * k, 6 * k); ctx.restore(); }
      if (f.act === 'read') { const p = (Math.sin(t * 1.3) + 1) / 2; ctx.fillStyle = C.red; ctx.fillRect(f.x + 4 * k * d, f.y + 12 * k, 10 * k * d, 8 * k); ctx.fillStyle = C.wht; ctx.fillRect(f.x + (5 + p * 4) * k * d, f.y + 12.5 * k, 4 * k * d, 7 * k); }
      if (f.act === 'talk' || f.act === 'wave') { const a = Math.sin(t * (f.act === 'wave' ? 6 : 3)) * .5; ctx.beginPath(); ctx.moveTo(f.x, f.y + 6 * k); ctx.lineTo(f.x + (8 + Math.cos(a) * 4) * k * d, f.y + (f.act === 'wave' ? -6 : 4) * k + Math.sin(a) * 6 * k); ctx.stroke(); }
      if (f.act === 'tray') { ctx.fillStyle = C.gold; ctx.beginPath(); ctx.ellipse(f.x + 10 * k * d, f.y + 8 * k + Math.sin(t * 3) * k, 9 * k, 2.4 * k, 0, 0, TAU); ctx.fill(); [[-4, C.red], [0, C.grn2], [4, '#E07A2A']].forEach(([o, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(f.x + (10 + o) * k * d, f.y + 5 * k + Math.sin(t * 3) * k, 2.2 * k, 0, TAU); ctx.fill(); }); }
    }
    // 旗子飘
    s.flagAt.forEach(([x, y], i) => { ctx.fillStyle = i ? C.red : C.grn; ctx.beginPath(); ctx.moveTo(x, y - 110 * u); for (let k = 0; k <= 10; k++) { const q = k / 10; ctx.lineTo(x + q * 60 * u, y - 110 * u + Math.sin(q * 4 - t * 6 + i) * 6 * u * q); }
      for (let k = 10; k >= 0; k--) { const q = k / 10; ctx.lineTo(x + q * 60 * u, y - 80 * u + Math.sin(q * 4 - t * 6 + i) * 6 * u * q - q * 8 * u); } ctx.fill(); });
    ctx.restore();
    // 飞过的鸟（画面坐标）
    for (let i = 0; i < 3; i++) { const x = ((t * .14 + i * .33) % 1.2 - .1) * W, y = H * (.18 + i * .1) + Math.sin(t * 2 + i) * 10 * u, w = Math.sin(t * 12 + i) * 8 * u;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.4 * u; ctx.beginPath(); ctx.moveTo(x - 14 * u, y - w); ctx.quadraticCurveTo(x - 6 * u, y - 4 * u, x, y); ctx.quadraticCurveTo(x + 6 * u, y - 4 * u, x + 14 * u, y - w); ctx.stroke(); }
  }
});
