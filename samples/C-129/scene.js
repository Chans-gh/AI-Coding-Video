// C-129 古埃及墓室壁画：init 里先用分形噪声铺一面沙黄灰泥墙，按横向带状分栏画两面壁画——侧脸正眼、正面肩膀的人物（身份越高画得越大）用土红、孔雀绿、青金蓝平涂再勾细黑线，叠上 weathering 的剥落和裂纹；每帧旁边竖排的象形符号用 drawPartial 一笔一笔写出，3 秒时上一面像石板一样下滑露出下一面。
// 风格提示词：用古埃及墓室壁画风格：沙黄灰泥墙按横向带状分栏，人物头和腿画侧面、眼睛和肩膀画正面，土红、孔雀绿、青金蓝平涂后勾细黑线，旁边竖排的象形符号一笔一笔重新写出，人物按身份定大小，转场是上一栏像石板一样下滑露出下一栏。
// 题材：手绘与绘画 · 适合：古文明科普、历史叙事、仪式与流程讲解
scene({
  id: 'C-129', name: '古埃及墓室壁画', dur: 5, still: 2.5,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    const C = { red: '#A4442A', skin: '#9A4A2A', fem: '#D9A050', grn: '#3E8A6A', blu: '#2E4E8C', blk: '#1C1612', lin: '#F2EAD6', wall: '#D8BC8A', ylw: '#D9A43A' };
    const plaster = makePaper(C.wall, { grain: 10, fiber: .2, blot: 26, seed: 4 });
    const age = weathering({ flake: .03, flakeColor: '#E2CCA2', stain: .28, stainColor: '#6A4426', cracks: 14, seed: 3 });
    // 人物（朝右，原点在两脚中间的地面，h 是身高）
    function figure(g, x, y, h, o = {}) {
      const k = h / 100; g.save(); g.translate(x, y); g.scale(o.left ? -k : k, k); g.lineJoin = 'round'; g.lineCap = 'round';
      const sk = o.fem ? C.fem : C.skin, line = () => { g.strokeStyle = C.blk; g.lineWidth = .7; g.stroke(); };
      const poly = (pts, c) => { g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.fillStyle = c; g.fill(); line(); };
      const arm = (pts, c = sk) => { g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.strokeStyle = C.blk; g.lineWidth = 5.6; g.stroke(); g.strokeStyle = c; g.lineWidth = 4.2; g.stroke(); };
      const st = o.stride ?? 1;
      if (o.back) arm(o.back);
      // 腿：侧面，一前一后
      poly([[-5, -48], [-9 * st, -6], [-13 * st, 0], [-1 * st - 1, 0], [-2 * st, -6], [2, -46]], sk);
      poly([[1, -48], [9 * st, -6], [7 * st, 0], [21 * st, 0], [15 * st, -5], [7, -46]], sk);
      if (o.fem) poly([[-7, -70], [7, -70], [10 * st + 2, -3], [-10 * st, -3]], C.lin);          // 女子：白色长裙
      else poly([[-8, -58], [8, -58], [15, -35], [-10, -35]], C.lin), poly([[2, -58], [8, -58], [15, -35], [7, -35]], '#E4D9BE');   // 男子：短裙和前褶
      // 躯干：肩膀正面
      poly(o.fem ? [[-12, -81], [12, -81], [7, -68], [-6, -68]] : [[-14, -81], [14, -81], [8, -58], [-7, -58]], sk);
      if (o.fem) { g.strokeStyle = C.lin; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-5, -70); g.lineTo(-7, -80); g.moveTo(5, -70); g.lineTo(7, -80); g.stroke(); }
      poly([[-3, -80], [3, -80], [4, -86], [-2, -86]], sk);                                       // 脖子
      // 宽领：三道彩环
      [[C.grn, 7], [C.blu, 5], [C.red, 3]].forEach(([c, r]) => { g.beginPath(); g.ellipse(0, -81, 10 + r * .6, r + 1.5, 0, 0, Math.PI); g.fillStyle = c; g.fill(); line(); });
      // 头：侧脸，鼻子朝右；眼睛画正面
      g.beginPath(); g.moveTo(-5, -86); g.quadraticCurveTo(-8, -98, 1, -101); g.quadraticCurveTo(8, -101, 8, -95); g.lineTo(11, -92); g.lineTo(8, -91);
      g.quadraticCurveTo(9, -88, 7, -87); g.quadraticCurveTo(4, -84, 2, -85); g.closePath(); g.fillStyle = sk; g.fill(); line();
      g.beginPath(); g.moveTo(-9, o.fem ? -72 : -82); g.quadraticCurveTo(-11, -100, 1, -102); g.quadraticCurveTo(7, -102, 6, -97); g.lineTo(-1, -96); g.lineTo(-1, o.fem ? -74 : -84); g.closePath(); g.fillStyle = C.blk; g.fill();   // 假发
      if (o.fem) { g.fillStyle = C.blu; g.fillRect(-9, -99.5, 15, 1.6); }
      g.beginPath(); g.ellipse(4, -94, 2.6, 1.2, 0, 0, TAU); g.fillStyle = '#FFF8E8'; g.fill(); g.lineWidth = .5; g.strokeStyle = C.blk; g.stroke();
      g.beginPath(); g.arc(4.4, -94, .9, 0, TAU); g.fillStyle = C.blk; g.fill();
      g.beginPath(); g.moveTo(1.4, -94); g.lineTo(-1.4, -93.2); g.lineWidth = .6; g.stroke();                          // 眼线拉长
      if (o.front) arm(o.front);
      if (o.item) o.item(g);
      g.restore();
    }
    // 拿着的东西（人物坐标系里）
    const staff = g => { g.strokeStyle = C.blk; g.lineWidth = 1.8; g.beginPath(); g.moveTo(22, -104); g.lineTo(22, 0); g.stroke(); g.strokeStyle = C.ylw; g.lineWidth = 1; g.stroke(); };
    const lotus = g => { g.strokeStyle = C.grn; g.lineWidth = 1; g.beginPath(); g.moveTo(17, -72); g.quadraticCurveTo(20, -80, 18, -88); g.stroke();
      g.fillStyle = C.blu; g.beginPath(); g.moveTo(18, -88); g.lineTo(13, -98); g.lineTo(18, -94); g.lineTo(18, -100); g.lineTo(20, -94); g.lineTo(24, -98); g.closePath(); g.fill(); g.strokeStyle = C.blk; g.lineWidth = .5; g.stroke(); };
    const basket = g => { g.fillStyle = C.ylw; g.beginPath(); g.moveTo(-10, -102); g.lineTo(12, -102); g.lineTo(8, -112); g.lineTo(-6, -112); g.closePath(); g.fill(); g.strokeStyle = C.blk; g.lineWidth = .6; g.stroke();
      [[-4, C.red], [1, C.grn], [6, C.red]].forEach(([x, c]) => { g.beginPath(); g.arc(x, -115, 3.4, 0, TAU); g.fillStyle = c; g.fill(); g.stroke(); });
      for (let i = -6; i < 9; i += 3) { g.beginPath(); g.moveTo(i, -103); g.lineTo(i + 1, -111); g.stroke(); } };
    const duck = g => { g.save(); g.translate(20, -66); g.fillStyle = '#E8E0CC'; g.beginPath(); g.ellipse(0, 0, 8, 4, .1, 0, TAU); g.fill(); g.strokeStyle = C.blk; g.lineWidth = .6; g.stroke();
      g.fillStyle = C.grn; g.beginPath(); g.ellipse(2, -1, 5, 2.4, .2, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-7, 0); g.quadraticCurveTo(-10, -6, -8, -9); g.lineWidth = 1.6; g.strokeStyle = '#E8E0CC'; g.stroke(); g.fillStyle = C.red; g.beginPath(); g.arc(-8, -9.5, 1.6, 0, TAU); g.fill(); g.restore(); };
    const jar = g => { g.save(); g.translate(19, -62); g.fillStyle = C.red; g.beginPath(); g.moveTo(-3, -8); g.quadraticCurveTo(-7, 0, -3, 8); g.lineTo(3, 8); g.quadraticCurveTo(7, 0, 3, -8); g.closePath(); g.fill(); g.strokeStyle = C.blk; g.lineWidth = .6; g.stroke(); g.fillStyle = C.blu; g.fillRect(-3.5, -10, 7, 2); g.restore(); };
    // 象形符号：单位方格里的折线，一笔一笔写
    const Q = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
    const GLY = {
      bird: [Q(16, s => [.25 + s * .5, .35 - Math.sin(s * Math.PI) * .12]), Q(14, s => [.75 - s * .5, .35 + Math.sin(s * Math.PI) * .3]), [[.32, .62], [.3, .92]], [[.5, .62], [.52, .92]], [[.74, .34], [.9, .38]]],
      reed: [Q(14, s => [.5 + Math.sin(s * Math.PI) * .14, .95 - s * .9]), Q(14, s => [.5 - Math.sin(s * Math.PI) * .06, .95 - s * .9])],
      water: [Q(18, s => [.1 + s * .8, .5 + ((s * 12 | 0) % 2 ? -.06 : .06)])],
      mouth: [Q(16, s => [.15 + s * .7, .5 - Math.sin(s * Math.PI) * .14]), Q(16, s => [.15 + s * .7, .5 + Math.sin(s * Math.PI) * .14])],
      loaf: [Q(16, s => [.2 + s * .6, .65 - Math.sin(s * Math.PI) * .35]), [[.15, .66], [.85, .66]]],
      sun: [Q(24, s => [.5 + Math.cos(s * TAU) * .28, .5 + Math.sin(s * TAU) * .28]), Q(10, s => [.5 + Math.cos(s * TAU) * .06, .5 + Math.sin(s * TAU) * .06])],
      snake: [Q(20, s => [.1 + s * .8, .62 - Math.sin(s * Math.PI * 2.2) * .1]), [[.18, .55], [.12, .46], [.22, .48]]],
      hand: [[[.1, .6], [.7, .55], [.9, .5], [.92, .58], [.7, .66], [.1, .7]], [[.68, .56], [.8, .44], [.86, .46], [.78, .57]]],
      loop: [Q(20, s => [.5 + Math.sin(s * TAU) * .2, .3 - Math.cos(s * TAU) * .16 + .14]), [[.3, .58], [.7, .58]], [[.5, .6], [.5, .95]]],
      eye: [Q(16, s => [.12 + s * .76, .45 - Math.sin(s * Math.PI) * .16]), Q(16, s => [.12 + s * .76, .45 + Math.sin(s * Math.PI) * .1]), Q(10, s => [.5 + Math.cos(s * TAU) * .07, .44 + Math.sin(s * TAU) * .07]), [[.46, .56], [.4, .82], [.3, .86]]]
    };
    const col = (seq, x, y0, w, h) => { const n = seq.length, cell = h / n, out = [];
      seq.forEach((nm, i) => GLY[nm].forEach(pl => out.push({ pts: pl.map(([a, b]) => [x + (a - .5) * w * .9 + w / 2, y0 + i * cell + b * cell * .9]), len: polyLen(pl.map(([a, b]) => [a * w, b * cell])) })));
      const tot = out.reduce((a, q) => a + q.len, 0); let acc = 0; out.forEach(q => { q.k0 = acc / tot; acc += q.len; q.k1 = acc / tot; }); return out; };
    // 墙面：frieze + 分栏线
    const L = LAND, m = 40 * u;
    function wall(g, seed) {
      g.drawImage(plaster, 0, 0, W, H);
      const fz = 64 * u; for (let i = 0; i * 26 * u < W; i++) { const c = [C.red, C.grn, C.blu, C.ylw][i % 4]; g.fillStyle = c; g.globalAlpha = .9; g.beginPath(); g.moveTo(i * 26 * u + 4 * u, fz); g.lineTo(i * 26 * u + 4 * u, 18 * u); g.quadraticCurveTo(i * 26 * u + 13 * u, 6 * u, i * 26 * u + 22 * u, 18 * u); g.lineTo(i * 26 * u + 22 * u, fz); g.fill(); }
      g.globalAlpha = 1; [[C.blu, 0], [C.red, 1], [C.grn, 2]].forEach(([c, i]) => { g.fillStyle = c; g.fillRect(0, fz + i * 7 * u, W, 6 * u); });
      return fz + 22 * u;
    }
    const band = (g, y, x0 = m * .5, x1 = W - m * .5) => [[C.red, 0], [C.ylw, 1], [C.blu, 2]].forEach(([c, i]) => { g.fillStyle = c; g.fillRect(x0, y + i * 6 * u, x1 - x0, 5 * u); });
    const water = (g, x0, x1, y, h) => { g.fillStyle = C.blu; g.fillRect(x0, y, x1 - x0, h); g.strokeStyle = '#1A2E5A'; g.lineWidth = 2.5 * u;
      for (let r = 0; r < 3; r++) { g.beginPath(); for (let x = x0; x <= x1; x += 14 * u) g.lineTo(x, y + h * (.25 + r * .25) + (((x - x0) / 14 / u | 0) % 2 ? -5 : 5) * u); g.stroke(); } };
    const papyrus = (g, x, y, h, R) => { for (let i = 0; i < 7; i++) { const dx = (i - 3) * 9 * u, hh = h * (.75 + R() * .3); g.strokeStyle = C.grn; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(x + dx * .3, y); g.lineTo(x + dx, y - hh); g.stroke();
      g.fillStyle = C.grn; g.beginPath(); g.moveTo(x + dx, y - hh); g.lineTo(x + dx - 14 * u, y - hh - 26 * u); g.quadraticCurveTo(x + dx, y - hh - 34 * u, x + dx + 14 * u, y - hh - 26 * u); g.closePath(); g.fill(); g.strokeStyle = C.blk; g.lineWidth = 1 * u; g.stroke(); } };
    // 版面
    const top = 112 * u, bot = H - m;
    let A = mk(W, H), B = mk(W, H), gA = A.getContext('2d'), gB = B.getContext('2d'), cols = [];
    // —— 第一面：墓主（大）、竖排符号、两栏献礼的人（小）
    wall(gA);
    const ow = L ? [m, top, W * .27, bot - top] : [m, top, W * .55, H * .5 - top];
    const gc = L ? [ow[0] + ow[2] + 10 * u, top + 10 * u, 80 * u, bot - top - 20 * u] : [ow[0] + ow[2] + 20 * u, top + 10 * u, 90 * u, ow[3] - 20 * u];
    const rg = L ? [[gc[0] + gc[2] + 30 * u, top, W - m - gc[0] - gc[2] - 30 * u, (bot - top) / 2 - 10 * u], [gc[0] + gc[2] + 30 * u, top + (bot - top) / 2 + 10 * u, W - m - gc[0] - gc[2] - 30 * u, (bot - top) / 2 - 10 * u]]
      : [[m, H * .5 + 20 * u, W - 2 * m, (bot - H * .5 - 40 * u) / 2], [m, H * .5 + 40 * u + (bot - H * .5 - 40 * u) / 2, W - 2 * m, (bot - H * .5 - 40 * u) / 2]];
    figure(gA, ow[0] + ow[2] * .45, ow[1] + ow[3] - 12 * u, ow[3] * .9, { item: staff, front: [[12, -80], [18, -70], [22, -60]], back: [[-12, -80], [-14, -62], [-12, -46]] });
    gA.strokeStyle = C.blk; gA.lineWidth = 2 * u; gA.strokeRect(gc[0], gc[1], gc[2], gc[3]);
    gA.globalAlpha = 1;
    rg.forEach(([x, y, w, h], ri) => { band(gA, y + h - 2 * u, x - 10 * u, x + w + 10 * u);
      const n = L ? 4 : 3, items = ri ? [jar, duck, lotus, basket] : [basket, lotus, duck, jar];
      for (let i = 0; i < n; i++) { const fx = x + w * (i + .55) / n, fem = (i + ri) % 2 === 1, it = items[i % 4];
        figure(gA, fx, y + h - 6 * u, h * (it === basket ? .78 : .85), { left: true, fem, item: it, stride: fem ? .5 : 1,
          front: it === basket ? [[12, -80], [16, -96], [10, -104]] : [[12, -80], [18, -72], [20, -66]], back: [[-12, -80], [-16, -66], [-14, -52]] }); }
    });
    band(gA, ow[1] + ow[3] - 6 * u, m * .5, L ? gc[0] + gc[2] : W - m * .5);
    cols.push({ g: col(['bird', 'reed', 'water', 'loaf', 'sun', 'snake', 'eye', 'reed', 'hand', 'loop'].slice(0, L ? 10 : 7), gc[0], gc[1] + 8 * u, gc[2], gc[3] - 16 * u), t0: .3, t1: 2.6, A: true });
    // —— 第二面：芦苇船、水和鸟、一栏女子
    wall(gB);
    const R = mulberry32(5), h1 = L ? (bot - top) * .55 : (bot - top) * .5;
    water(gB, m, W - m, top + h1 - 60 * u, 60 * u);
    papyrus(gB, W * .12, top + h1 - 50 * u, h1 * .55, R); papyrus(gB, W * (L ? .88 : .8), top + h1 - 50 * u, h1 * .6, R);
    for (let i = 0; i < (L ? 9 : 5); i++) { const bx = W * (.2 + .6 * hash1(i + 4)), by = top + 30 * u + hash1(i + 30) * h1 * .3, k = (L ? 1.3 : 1.1) * u;   // 鸟
      gB.save(); gB.translate(bx, by); gB.scale(k * (i % 2 ? -1 : 1), k); gB.fillStyle = i % 3 ? C.grn : C.blu; gB.beginPath(); gB.ellipse(0, 0, 18, 8, -.2, 0, TAU); gB.fill(); gB.strokeStyle = C.blk; gB.lineWidth = 1; gB.stroke();
      gB.fillStyle = C.red; gB.beginPath(); gB.moveTo(-4, -4); gB.lineTo(-22, -26); gB.lineTo(6, -6); gB.fill(); gB.stroke(); gB.beginPath(); gB.moveTo(14, -4); gB.quadraticCurveTo(22, -10, 26, -6); gB.lineWidth = 3; gB.stroke(); gB.restore(); }
    // 船
    const bx = W * .5, by = top + h1 - 62 * u, bw = W * (L ? .26 : .36);
    gB.fillStyle = C.grn; gB.beginPath(); gB.moveTo(bx - bw, by - 50 * u); gB.quadraticCurveTo(bx - bw * .7, by + 6 * u, bx, by + 6 * u); gB.quadraticCurveTo(bx + bw * .7, by + 6 * u, bx + bw, by - 50 * u); gB.quadraticCurveTo(bx, by - 12 * u, bx - bw, by - 50 * u); gB.fill(); gB.strokeStyle = C.blk; gB.lineWidth = 2 * u; gB.stroke();
    for (let i = -6; i <= 6; i++) { gB.beginPath(); gB.moveTo(bx + i * bw / 7, by - 14 * u + Math.abs(i) * Math.abs(i) * .6 * u); gB.lineTo(bx + i * bw / 7, by + 2 * u); gB.lineWidth = 1.2 * u; gB.stroke(); }
    figure(gB, bx - bw * .25, by - 8 * u, h1 * .62, { front: [[12, -80], [24, -84], [36, -92]], back: [[-12, -80], [-4, -86], [6, -96]], item: g => { g.strokeStyle = C.blk; g.lineWidth = 1.6; g.beginPath(); g.moveTo(40, -96); g.lineTo(-14, -60); g.stroke(); } });
    figure(gB, bx + bw * .28, by - 8 * u, h1 * .42, { left: true, fem: true, stride: .5, item: lotus, front: [[12, -80], [17, -74], [18, -70]] });
    const ry = top + h1 + 20 * u, rh = bot - ry;
    band(gB, ry - 14 * u);
    const rows = L ? 1 : 2, nf = L ? 6 : 3, rhh = rh / rows;
    for (let r = 0; r < rows; r++) { const yb = ry + rhh * (r + 1); band(gB, yb - 6 * u);
      for (let i = 0; i < nf; i++) { const j = i + r * nf; figure(gB, m + (W - 2 * m - (L ? 120 * u : 0)) * (i + .5) / nf, yb - 10 * u, rhh * .82, { fem: j % 2 === 0, stride: j % 2 ? 1 : .5, item: [lotus, jar, duck][j % 3], front: [[12, -80], [18, -72], [20, -66]], back: [[-12, -80], [-16, -66], [-14, -52]] }); } }
    const gc2 = L ? [W - m - 100 * u, ry, 80 * u, rh - 16 * u] : [W - m - 90 * u, top + 14 * u, 76 * u, h1 * .7];
    gB.strokeStyle = C.blk; gB.lineWidth = 2 * u; gB.strokeRect(...gc2);
    cols.push({ g: col(L ? ['sun', 'loop', 'water', 'bird', 'mouth'] : ['eye', 'water', 'bird', 'loaf'], ...gc2), t0: 3.4, t1: 4.8, A: false });
    for (const g of [gA, gB]) { g.drawImage(age, 0, 0, W, H); }
    return { u, A, B, cols, age, C };
  },
  draw(ctx, t, s) {
    const { u } = s, slide = eInCubic(inv(2.85, 3.45, t)), oy = slide * H;
    const glyph = (c, g0) => { const p = inv(c.t0, c.t1, t); ctx.save(); ctx.strokeStyle = '#1E3A78'; ctx.lineWidth = 4.6 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const q of c.g) { const pp = inv(q.k0, q.k1, p); if (pp <= 0) break; drawPartial(ctx, q.pts, pp); }
      ctx.restore(); };
    ctx.drawImage(s.B, 0, 0); if (t > 3.3) glyph(s.cols[1]);
    if (slide < 1) {
      ctx.save(); ctx.translate(0, oy);
      if (oy > 0) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, -26 * u, W, 26 * u); }                 // 石板上沿的影子
      ctx.drawImage(s.A, 0, 0); glyph(s.cols[0]); ctx.fillStyle = 'rgba(40,24,10,.5)'; ctx.fillRect(0, 0, W, 4 * u);
      ctx.restore();
    }
    // 火把光：暖色暗角轻轻闪
    const fl = .32 + Math.sin(t * 9.1) * .03 + Math.sin(t * 23.7) * .02;
    vignette(ctx, fl, .3, '40,18,4');
  }
});
