// C-146 野兽派彩纸剪贴：Canvas 2D 在 init 里把每张纸先刷满水粉（底色上用 source-atop 叠几百道深浅不一的半透明笔触），再按剪纸外形裁出：海藻是沿中线左右错相的波形叶瓣，星形、叶片的轮廓带随机剪口，舞者由躯干椭圆和粗圆头的四肢拼成一张；draw 时每张纸在图钉处做小角度的错切当作纸角翘动，第 2.6 秒一大张钴蓝纸从左边扫过，换成钉在蓝纸上的舞者和星星。
// 风格提示词：用野兽派彩纸剪贴风格：先刷满浓烈水粉的彩纸再直接用剪刀剪出形状，海藻、叶片、星形和舞动人形的边缘带不规则剪口，钴蓝、柠檬黄、品红和翠绿平涂并排，纸片用图钉钉在白墙上留下细小投影，纸角随风轻轻翘动，转场是一大张蓝纸从侧边扫过换场。
// 题材：纸艺、材质与定格 · 适合：音乐与舞蹈、儿童艺术启蒙、轻快的品牌片
scene({
  id: 'C-146', name: '野兽派彩纸剪贴', dur: 4, still: 3.6,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    const COL = { blue: '#1F49B6', yel: '#F4CF1E', mag: '#D3246E', grn: '#1E9A62', org: '#EE6A24', blk: '#1A1A1A', wht: '#F7F4EC' };
    // 刷水粉的纸：底色 + 笔触
    const gouache = (g, w, h, col, seed) => {
      const R = mulberry32(seed), c = hex2rgb(col); g.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 260; i++) { const d = (R() - .5) * 46; g.strokeStyle = `rgba(${clamp(c[0] + d, 0, 255) | 0},${clamp(c[1] + d, 0, 255) | 0},${clamp(c[2] + d, 0, 255) | 0},.35)`; g.lineWidth = (6 + R() * 22) * u; const x = R() * w, y = R() * h, a = -.4 + R() * .3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 160 * u, y + Math.sin(a) * 160 * u); g.stroke(); }
      g.globalCompositeOperation = 'source-over';
    };
    const make = (w, h, col, seed, shape) => { const c = mk(Math.ceil(w), Math.ceil(h)), g = c.getContext('2d'); g.fillStyle = col; g.beginPath(); shape(g, mulberry32(seed + 7)); g.fill(); gouache(g, w, h, col, seed); return c; };
    // 剪口：沿外形折线随机插入小尖角
    const cutPath = (g, pts, R) => { pts.forEach(([x, y], i) => { const n = pts[(i + 1) % pts.length]; i ? g.lineTo(x, y) : g.moveTo(x, y); if (R() < .18) { const mx = (x + n[0]) / 2, my = (y + n[1]) / 2, d = Math.hypot(n[0] - x, n[1] - y) || 1; g.lineTo(mx - (n[1] - y) / d * 10 * u, my + (n[0] - x) / d * 10 * u); } }); g.closePath(); };
    const weed = (w, h, col, seed, lobes) => make(w, h, col, seed, (g, R) => {
      const L = [], Rr = [];
      for (let i = 0; i <= 60; i++) { const q = i / 60, cx = w / 2 + Math.sin(q * 3 + seed) * w * .12, y = h - q * h * .98, base = w * .42 * (1 - q * .7);
        L.push([cx - base * (.25 + .75 * Math.abs(Math.sin(q * Math.PI * lobes))), y]); Rr.push([cx + base * (.25 + .75 * Math.abs(Math.sin(q * Math.PI * lobes + 1.2))), y]); }
      cutPath(g, [...L, ...Rr.reverse()], R);
    });
    const star = (r, col, seed) => make(r * 2, r * 2, col, seed, (g, R) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5 + (R() - .5) * .2, rr0 = (i % 2 ? .4 : .95) * r * (.85 + R() * .15); p.push([r + Math.cos(a) * rr0, r + Math.sin(a) * rr0]); } cutPath(g, p, R); });
    const leaf = (w, h, col, seed) => make(w, h, col, seed, (g, R) => { const p = []; for (let i = 0; i <= 24; i++) { const q = i / 24; p.push([w / 2 + Math.sin(q * Math.PI) * w * .48 * (1 - .15 * Math.sin(q * 9)), h * q]); } for (let i = 24; i >= 0; i--) { const q = i / 24; p.push([w / 2 - Math.sin(q * Math.PI) * w * .45, h * q]); } cutPath(g, p, R); });
    const dancer = (sz, col, seed) => {
      const c = mk(Math.ceil(sz), Math.ceil(sz * 1.3)), g = c.getContext('2d'), k = sz / 400; g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.arc(210 * k, 70 * k, 44 * k, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(200 * k, 230 * k, 66 * k, 110 * k, .2, 0, TAU); g.fill();
      g.lineWidth = 52 * k; g.beginPath(); g.moveTo(170 * k, 170 * k); g.quadraticCurveTo(80 * k, 120 * k, 40 * k, 30 * k); g.moveTo(240 * k, 170 * k); g.quadraticCurveTo(320 * k, 200 * k, 370 * k, 130 * k); g.stroke();
      g.lineWidth = 64 * k; g.beginPath(); g.moveTo(170 * k, 310 * k); g.quadraticCurveTo(120 * k, 400 * k, 50 * k, 470 * k); g.moveTo(230 * k, 310 * k); g.quadraticCurveTo(300 * k, 370 * k, 320 * k, 470 * k); g.stroke();
      gouache(g, c.width, c.height, col, seed);
      return c;
    };
    const A = [[weed(260 * u, 640 * u, COL.grn, 1, 4), .14, .5, 0], [weed(220 * u, 520 * u, COL.mag, 2, 3), .34, .55, 1], [leaf(200 * u, 380 * u, COL.org, 3), .52, .45, 2], [star(130 * u, COL.yel, 4), .7, .3, 3], [weed(240 * u, 600 * u, COL.blue, 5, 5), .86, .55, 4], [star(80 * u, COL.mag, 6), .56, .78, 5], [leaf(150 * u, 280 * u, COL.grn, 7), .74, .74, 6]];
    const B = [[dancer(560 * u, COL.wht, 8), .5, .5, 0], [star(110 * u, COL.yel, 9), .2, .26, 1], [star(80 * u, COL.yel, 10), .82, .22, 2], [star(95 * u, COL.yel, 11), .14, .78, 3], [leaf(140 * u, 300 * u, COL.grn, 12), .86, .74, 4], [star(60 * u, COL.mag, 13), .76, .5, 5]];
    const blue = make(W * 1.04, H * 1.04, COL.blue, 20, g => g.rect(0, 0, W * 1.04, H * 1.04));
    return { A, B, blue, wall: makePaper('#F3F0E8', { seed: 146, grain: 8, fiber: .2, blot: 3 }) };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.drawImage(s.wall, 0, 0, W, H);
    const pin = (img, x, y, i, t0) => {
      const p = eOutBack(inv(t0, t0 + .3, t)); if (p <= 0) return;
      const sk = Math.sin(t * 3.1 + i * 1.7) * .035, rot = (hash1(i * 5) - .5) * .25;
      ctx.save(); ctx.translate(x, y - img.height * .4); ctx.rotate(rot); ctx.scale(p, p); ctx.transform(1, 0, sk, 1 + sk * .3, 0, 0);
      ctx.shadowColor = 'rgba(40,40,60,.28)'; ctx.shadowBlur = 6 * u; ctx.shadowOffsetX = 5 * u; ctx.shadowOffsetY = 7 * u;
      ctx.drawImage(img, -img.width / 2, 0); ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(3 * u, 18 * u, 9 * u, 0, TAU); ctx.fill();
      ctx.fillStyle = '#B9B4A8'; ctx.beginPath(); ctx.arc(0, 14 * u, 9 * u, 0, TAU); ctx.fill(); ctx.fillStyle = '#E8E4DA'; ctx.beginPath(); ctx.arc(-2 * u, 12 * u, 4 * u, 0, TAU); ctx.fill();
      ctx.restore();
    };
    const sw = eInOutCubic(inv(2.5, 3.1, t));
    if (sw < 1) s.A.forEach(([img, fx, fy, i]) => { const PA = [[.22, .3], [.5, .33], [.8, .25], [.78, .55], [.3, .7], [.6, .62], [.75, .82]], [x, y] = LAND ? [fx * W, fy * H] : [PA[i][0] * W, PA[i][1] * H]; pin(img, x, y - img.height * .1, i, .05 + i * .15); });
    // 蓝纸扫过：从左边带着翘起的边扫进来，之后留在墙上
    if (sw > 0) {
      const m = 50 * u, edge = lerp(-W * .1, W, sw), bw = W - 2 * m, bh = H - 2 * m;
      ctx.save(); ctx.beginPath(); ctx.moveTo(m, m); ctx.lineTo(Math.min(edge, m + bw), m); ctx.quadraticCurveTo(Math.min(edge, m + bw) + (1 - sw) * 120 * u, H / 2, Math.min(edge, m + bw), m + bh); ctx.lineTo(m, m + bh); ctx.closePath();
      ctx.shadowColor = 'rgba(20,30,60,.35)'; ctx.shadowBlur = 20 * u; ctx.shadowOffsetX = 10 * u; ctx.fillStyle = '#1F49B6'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.clip(); ctx.drawImage(s.blue, 0, 0); ctx.restore();
      if (sw < 1) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(edge - 30 * u, m, 30 * u, H - 2 * m); }
    }
    if (sw >= 1) s.B.forEach(([img, fx, fy, i]) => { const PB = [[.5, .5], [.2, .14], [.8, .16], [.2, .84], [.8, .82], [.84, .5]], [x, y] = LAND ? [fx * W, fy * H] : [PB[i][0] * W, PB[i][1] * H]; pin(img, x, y - (i ? 0 : img.height * .1), i + 10, 3.05 + i * .1); });
  }
});
