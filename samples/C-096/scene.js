// C-096 铜版雕刻（博物图版）：毒蝇伞的明暗先画成明暗图，hatchLines 按亮度铺一层平行线、二层交叉、最暗处第三层，drawHatch 把每根线画成由细变粗再收尖的刻线，轮廓用 toneRibbon 随明暗变粗细；线刻完后再“手工”罩透明水彩，颜色故意溢出线条，最后压上版痕和题字。
// 风格提示词：用 19 世纪铜版雕刻博物图版风格：刻刀在铜板上刻出由细变粗再收尖的线，明暗全靠排线（一层平行线、二层交叉、最暗处第三层），不用任何灰色填充，奶油色版画纸上有压痕和边框，罗马体大写标题配意大利体学名，印好之后再手工罩一层透明水彩，颜色可以溢出线条。
// 题材：印刷、版画与装饰 · 适合：自然博物、历史、科普、美术馆展览
scene({
  id: 'C-096', name: '铜版雕刻（博物图版）', dur: 5, still: 4.7,
  fonts: ["700 60px 'Noto Serif SC'", "italic 400 40px 'Playfair Display'"],
  text: 'AMANITA MUSCARIA毒蝇伞图版第七',
  init() {
    const u = SHORT / 1080;
    // 构图：横屏标本在右、题字在左；竖屏标题在上、标本居中、学名在下
    const k = (LAND ? .95 : 1.4) * u, ox = LAND ? W * .64 : W * .44, oy = LAND ? H * .82 : H * .74;
    const P = (x, y) => [ox + x * k, oy + y * k];
    const shroom = (x, s, open) => {                                                          // 一朵蘑菇的各部分（Path2D）
      const Q = (a, b) => P(x + a * s, b * s), path = fn => { const p = new Path2D(); fn(p); return p; };
      const cr = 230 * (open ? 1 : .8), ch = 170 * (open ? 1 : 1.3);
      return {
        cap: path(p => { p.moveTo(...Q(-cr, -340)); p.bezierCurveTo(...Q(-cr, -340 - ch * 1.25), ...Q(cr, -340 - ch * 1.25), ...Q(cr, -340)); p.quadraticCurveTo(...Q(0, -300), ...Q(-cr, -340)); }),
        gill: path(p => { p.moveTo(...Q(-cr + 8, -338)); p.quadraticCurveTo(...Q(0, -300), ...Q(cr - 8, -338)); p.quadraticCurveTo(...Q(0, -270), ...Q(-cr + 8, -338)); }),
        stem: path(p => { p.moveTo(...Q(-42, -300)); p.lineTo(...Q(-55, -30)); p.quadraticCurveTo(...Q(-80, 10), ...Q(0, 12)); p.quadraticCurveTo(...Q(80, 10), ...Q(55, -30)); p.lineTo(...Q(42, -300)); p.closePath(); }),
        ring: path(p => { p.moveTo(...Q(-46, -265)); p.quadraticCurveTo(...Q(-90, -215), ...Q(-70, -205)); p.quadraticCurveTo(...Q(0, -190), ...Q(70, -205)); p.quadraticCurveTo(...Q(90, -215), ...Q(46, -265)); p.closePath(); }),
        warts: Array.from({ length: open ? 16 : 9 }, (_, i) => { const a = hash1(i * 7 + x) * 2 - 1, b = hash1(i * 13 + x); return [...Q(a * cr * .8, -345 - ch * .85 * Math.sqrt(1 - a * a) * (.3 + b * .7)), (8 + hash1(i) * 10) * s * k]; }),
        Q, cr, ch, s,
      };
    };
    const M = [shroom(-30, 1, true), shroom(250, .55, false)];
    const T = toneMap(g => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.filter = `blur(${16 * k}px)`; g.fillStyle = '#666'; g.beginPath(); g.ellipse(...P(60, 14), 330 * k, 34 * k, 0, 0, TAU); g.fill(); g.filter = 'none';
      for (const m of M) {
        const [cx, cy] = m.Q(0, -340 - m.ch * .6), R = m.cr * m.s * k;
        const cg = g.createRadialGradient(cx - R * .45, cy - R * .35, R * .05, cx, cy + R * .2, R * 1.15);   // 菌盖：左上受光
        cg.addColorStop(0, '#f0f0f0'); cg.addColorStop(.5, '#9a9a9a'); cg.addColorStop(1, '#2a2a2a');
        g.fillStyle = cg; g.fill(m.cap);
        g.fillStyle = '#3a3a3a'; g.fill(m.gill);
        const [sx] = m.Q(0, 0), sg = g.createLinearGradient(sx - 60 * m.s * k, 0, sx + 60 * m.s * k, 0);
        sg.addColorStop(0, '#d8d8d8'); sg.addColorStop(.35, '#fafafa'); sg.addColorStop(1, '#6a6a6a');
        g.fillStyle = sg; g.fill(m.stem);
        g.fillStyle = '#555'; g.fillRect(...m.Q(-60, -205), 120 * m.s * k, 40 * m.s * k);       // 菌环下的影子
        g.fillStyle = sg; g.fill(m.ring);
        g.fillStyle = '#fff'; m.warts.forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r, r * .7, 0, 0, TAU); g.fill(); });
      }
    }, { blur: 2 * u, res: 3 });
    const notWart = (x, y) => !M.some(m => m.warts.some(([wx, wy, r]) => Math.hypot(x - wx, (y - wy) / .7) < r * 1.3));
    const box = [ox - 330 * k, oy - 650 * k, ox + 420 * k, oy + 60 * k];
    const ord = (x, y) => y / H * .6 + hash2(Math.floor(x / 40), Math.floor(y / 40)) * .2;
    const lay = [[.42, 7.5, .8], [-.62, 7.5, .52], [1.25, 6.5, .28]].map(([angle, gap, thr], i) =>
      hatchLines(T, { angle, gap: gap * u, thr, minLen: 10 * u, jitter: .12, swell: true, mask: notWart, order: ord, box, seed: 61 + i }));
    // 轮廓：菌盖顶、菌褶下沿、菌柄两侧、菌环
    const ol = [];
    for (const m of M) {
      const q = (pts) => pts.map(([a, b]) => m.Q(a, b));
      const arc = (x0, y0, c1, c2, x1, y1, n = 40) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, mt = 1 - t;
        out.push([mt ** 3 * x0 + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * x1, mt ** 3 * y0 + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * y1]); } return q(out); };
      ol.push(arc(-m.cr, -340, [-m.cr, -340 - m.ch * 1.25], [m.cr, -340 - m.ch * 1.25], m.cr, -340));
      ol.push(arc(-m.cr + 8, -338, [-m.cr * .4, -280], [m.cr * .4, -280], m.cr - 8, -338, 24));
      ol.push(q([[-42, -300], [-48, -150], [-55, -30], [-62, 0], [0, 12]]), q([[42, -300], [48, -150], [55, -30], [62, 0], [0, 12]]));
      ol.push(arc(-70, -205, [-20, -188], [20, -188], 70, -205, 20));
    }
    // 水彩：红的菌盖、淡黄的菌柄、草绿的地面；故意错位溢出
    const wash = mk(W, H), wg = wash.getContext('2d');
    const blob = (path, col, a, dx, dy) => { wg.save(); wg.translate(dx, dy); wg.globalAlpha = a; wg.fillStyle = col; wg.filter = `blur(${2.5 * u}px)`; wg.fill(path); wg.restore(); };
    for (const m of M) {
      blob(m.cap, '#C9402E', .62, 7 * u, -5 * u); blob(m.cap, '#E06A3A', .3, -4 * u, 6 * u);
      blob(m.stem, '#E9D7A2', .55, -5 * u, 3 * u); blob(m.ring, '#E9D7A2', .5, 4 * u, 2 * u);
      wg.save(); wg.globalCompositeOperation = 'destination-out'; wg.fillStyle = '#000'; m.warts.forEach(([x, y, r]) => { wg.beginPath(); wg.ellipse(x - 2 * u, y + 2 * u, r * 1.1, r * .8, 0, 0, TAU); wg.fill(); }); wg.restore();
    }
    wg.save(); wg.globalAlpha = .35; wg.fillStyle = '#7E9A55'; wg.filter = `blur(${10 * u}px)`; wg.beginPath(); wg.ellipse(...P(60, 18), 380 * k, 30 * k, 0, 0, TAU); wg.fill(); wg.restore();
    const im = wg.getImageData(0, 0, W, H);                                                   // 颜料不匀：按噪声深浅
    for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) { const i = (y * W + x) * 4 + 3; if (im.data[i]) im.data[i] *= .7 + .5 * fbm(x * .01, y * .01, 3); }
    wg.putImageData(im, 0, 0);
    return { u, k, P, T, lay, ol, wash, paper: makePaper('#F2E9D3', { seed: 96, grain: 12, fiber: .4, blot: 10 }) };
  },
  draw(ctx, t, s) {
    const { u } = s, ink = '#1E1A16';
    ctx.drawImage(s.paper, 0, 0, W, H);
    // 版痕：压进纸里的一圈边，内侧略暗、外侧一道亮边
    const m = (LAND ? 70 : 60) * u;
    ctx.save(); ctx.globalAlpha = .9; ctx.fillStyle = 'rgba(120,100,70,.08)'; ctx.fillRect(m, m, W - 2 * m, H - 2 * m);
    ctx.strokeStyle = 'rgba(90,70,40,.35)'; ctx.lineWidth = 3 * u; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2 * u; ctx.strokeRect(m - 3 * u, m - 3 * u, W - 2 * m + 6 * u, H - 2 * m + 6 * u);
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6 * u; ctx.strokeRect(m + 26 * u, m + 26 * u, W - 2 * m - 52 * u, H - 2 * m - 52 * u);
    ctx.restore();
    // 刻线
    s.ol.forEach((pts, i) => { const p = inv(.1 + (i % 5) * .12, .7 + (i % 5) * .12, t); if (p > 0) toneRibbon(ctx, pts, s.T, 1.2 * u, 4.2 * u, eOutCubic(p), ink); });
    const spans = [[.5, 2.0], [1.2, 2.7], [1.9, 3.4]];
    s.lay.forEach((L, i) => drawHatch(ctx, L, inv(...spans[i], t), { color: ink, taper: true, swell: [.6 * u, 3.2 * u], dur: .03 }));
    // 手工上色：从左往右刷过去
    const wp = inv(2.5, 4.0, t);
    if (wp > 0) {                                                                         // 刷过去之后颜色还在慢慢渗开、变深
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * eOutCubic(wp) * 1.05, H); ctx.clip();
      ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = lerp(.6, 1, inv(2.5, 4.95, t)); ctx.drawImage(s.wash, 0, 0); ctx.restore();
    }
    // 题字：罗马体大写 + 意大利体学名 + 图版号
    const tp = smooth(3.3, 4.2, t);
    if (tp > 0) {
      ctx.save(); ctx.globalAlpha = tp; ctx.fillStyle = ink;
      const tx = LAND ? W * .25 : W * .5, ty = LAND ? H * .4 : H * .15;
      ctx.textAlign = 'center';
      ctx.font = `700 ${Math.round((LAND ? 66 : 70) * u)}px 'Noto Serif SC'`;
      ctx.letterSpacing = `${8 * u}px`; ctx.fillText('AMANITA', tx, ty); ctx.fillText('MUSCARIA', tx, ty + 82 * u); ctx.letterSpacing = '0px';
      const ly = LAND ? ty + 180 * u : H * .86;
      ctx.font = `italic 400 ${Math.round(46 * u)}px 'Playfair Display'`; ctx.fillText('Amanita muscaria (L.) Lam.', tx, ly);
      ctx.font = `700 ${Math.round(34 * u)}px 'Noto Serif SC'`; ctx.fillText('毒蝇伞 · 图版第七', tx, ly + 60 * u);
      ctx.fillRect(tx - 120 * u, ty + 116 * u, 240 * u, 2 * u);
      ctx.restore();
    }
  }
});
