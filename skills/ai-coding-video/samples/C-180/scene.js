// C-180 工笔：荷花、荷叶、花苞和茎都由贝塞尔曲线采样成折线，init 里一次算好；先按顺序用粗细均匀的细墨线把每条折线逐段描出（铁线描），再分三层上色：平涂淡底色、从花瓣根部到尖端的渐变分染、尖端加深和叶脉；每帧先画颜色再画墨线，线始终压在色上。绢底是暖黄底色加经纬细纹和水渍
// 风格提示词：用工笔风格：微黄的熟绢底上，形象先用细匀的铁线描勾出完整墨线，再一层层平涂分染石青、石绿、朱砂和胭脂，花瓣和羽毛的颜色从根部向外渐淡，边线始终清晰、不被颜色盖住，画面一线一线勾出、一层一层染出来，配古筝。
// 题材：东方传统 · 适合：花鸟与节令、宫廷与仕女、文博科普
function bz(p0, p1, p2, p3, n = 20) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n, a = 1 - t; out.push([a * a * a * p0[0] + 3 * a * a * t * p1[0] + 3 * a * t * t * p2[0] + t * t * t * p3[0], a * a * a * p0[1] + 3 * a * a * t * p1[1] + 3 * a * t * t * p2[1] + t * t * t * p3[1]]); }
  return out;
}
const xf = (pts, o, a) => pts.map(([x, y]) => [o[0] + x * Math.cos(a) - y * Math.sin(a), o[1] + x * Math.sin(a) + y * Math.cos(a)]);
function petal(o, a, L, w, sk = 0) {             // 花瓣：根在 o，朝 a 方向（0 朝上），长 L 宽 w，sk 让尖端偏一点
  const r = bz([0, 0], [w * .9, -L * .25], [w * .75 + sk, -L * .85], [sk * .6, -L]);
  const l = bz([sk * .6, -L], [-w * .75 + sk, -L * .85], [-w * .9, -L * .25], [0, 0]);
  return xf(r.concat(l.slice(1)), o, a);
}
scene({
  id: 'C-180', name: '工笔', dur: 4.6, still: 4.2,
  fonts: ["700 40px 'Noto Serif SC'"],
  text: '清夏一池风工笔',
  init() {
    const R = mulberry32(17), parts = [];
    // part：pts 折线、closed、线的开始时刻和用时、色层 fill(g, path, 层号)
    const add = (pts, t0, d, kind, extra = {}) => parts.push({ pts, t0, d, kind, closed: kind !== 'stem' && kind !== 'vein', ...extra });
    // 茎：两条平行线
    for (const [x0, y0, x1, y1, c] of [[0, 70, 30, 1700, 40], [230, 30, 300, 1700, -30], [-250, 300, -200, 1700, 20]]) {
      const mid = bz([x0, y0], [x0 + c, y0 + 300], [x1 - c, y1 - 300], [x1, y1], 24);
      add(mid.map(([x, y]) => [x - 7, y]), .15, .7, 'stem'); add(mid.map(([x, y]) => [x + 7, y]), .2, .7, 'stem');
      parts.push({ pts: mid, t0: 0, d: 0, kind: 'stemfill', closed: false });
    }
    // 荷叶：椭圆加波浪边，叶脉从叶心放射
    const leaves = [[-250, 300, 250, 105], [140, 420, 150, 60]];
    leaves.forEach(([cx, cy, rx, ry], j) => {
      const pts = [];
      for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU, r = 1 + .045 * Math.sin(a * 9 + j) + .02 * Math.sin(a * 23); pts.push([cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)]); }
      add(pts, .3 + j * .2, 1.0, 'leaf', { c: [cx, cy - ry * .15] });
      for (let k = 0; k < 13; k++) { const a = k / 13 * TAU + .2, q = pts[Math.round(a / TAU * 72) % 72]; add(bz([cx, cy - ry * .15], [cx, cy - ry * .15], q, q, 6).map(([x, y], i) => [x, y + Math.sin(i) * 2]), 1.1 + k * .03, .5, 'vein', { tone: 'leaf' }); }
    });
    // 花：后排五瓣、莲蓬、前排三瓣
    const fo = [0, 60];
    [-1.05, -.55, 0, .55, 1.05].forEach((a, i) => add(petal([fo[0] + a * 14, fo[1] - 10], a * .9, 230 - Math.abs(a) * 30, 78, (R() - .5) * 20), .45 + i * .08, .9, 'petal', { a: a * .9, o: [fo[0] + a * 14, fo[1] - 10], L: 230 - Math.abs(a) * 30 }));
    add([[-42, -18], [42, -18], [30, 22], [-30, 22]], .85, .5, 'pod');
    [-.65, 0, .65].forEach((a, i) => add(petal([fo[0] + a * 20, fo[1] + 8], a * .75, 165, 82, (R() - .5) * 16), .7 + i * .1, .9, 'petal', { a: a * .75, o: [fo[0] + a * 20, fo[1] + 8], L: 165 }));
    // 花苞
    const bo = [230, 30];
    add(petal(bo, .25, 170, 58, 6), 1.0, .7, 'petal', { a: .25, o: bo, L: 170, bud: 1 });
    add(petal([bo[0] + 4, bo[1]], .1, 120, 34, 4), 1.15, .6, 'petal', { a: .1, o: bo, L: 120, bud: 1 });
    // 花瓣脉：挂在各自的花瓣上，跟着花瓣一起画（被前面的花瓣挡住）
    for (const p of parts.filter(p => p.kind === 'petal')) p.veins = [-.45, -.15, .15, .45].map(v => xf(bz([0, -6], [v * 30, -p.L * .35], [v * 34, -p.L * .7], [v * 18, -p.L * .9], 10), p.o, p.a));
    // 绢底：暖黄、经纬细纹、水渍和压暗的边
    const bg = mk(W, H), g = bg.getContext('2d');
    g.fillStyle = '#e4cf9f'; g.fillRect(0, 0, W, H);
    g.globalAlpha = .05; g.fillStyle = '#6b5530';
    for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    for (let x = 0; x < W; x += 3) g.fillRect(x, 0, 1, H);
    g.globalAlpha = 1;
    const st = mk(W / 8, H / 8), sg = st.getContext('2d'), id = sg.createImageData(W / 8, H / 8);
    for (let i = 0; i < id.data.length / 4; i++) { const x = i % (W / 8), y = Math.floor(i / (W / 8)), n = fbm(x / 30, y / 30, 4); id.data[i * 4] = 110; id.data[i * 4 + 1] = 80; id.data[i * 4 + 2] = 40; id.data[i * 4 + 3] = Math.max(0, n - .45) * 160; }
    sg.putImageData(id, 0, 0); g.drawImage(st, 0, 0, W, H);
    const vg = g.createRadialGradient(W / 2, H / 2, SHORT * .3, W / 2, H / 2, LONG * .7); vg.addColorStop(0, 'rgba(90,60,20,0)'); vg.addColorStop(1, 'rgba(90,60,20,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return { parts, bg };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    ctx.drawImage(s.bg, 0, 0);
    const k = u * (LAND ? .95 : 1.05) * (1 + .05 * eInOutCubic(inv(0, 4.6, t)));
    const ox = LAND ? W * .6 : W * .52, oy = LAND ? H * .36 : H * .42;
    ctx.save(); ctx.translate(ox, oy); ctx.scale(k, k);
    const path = pts => { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
    const L1 = smooth(1.6, 2.2, t), L2 = smooth(2.1, 2.9, t), L3 = smooth(2.8, 3.5, t);
    // 从后往前逐个画：先用绢底挡住后面的东西，再按三层上色（平涂、分染、加深），最后描线，线压在色上
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const line = (pts, q, close, c, w) => { if (q <= 0) return; ctx.strokeStyle = c; ctx.lineWidth = w; drawPartial(ctx, pts, q, close && q >= 1); ctx.stroke(); };
    for (const p of s.parts) {
      if (p.kind === 'stemfill') {
        if (L1 > 0) { ctx.strokeStyle = `rgba(110,140,80,${.75 * L1})`; ctx.lineWidth = 13; ctx.beginPath(); p.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
        continue;
      }
      const pa = path(p.pts), q = inv(p.t0, p.t0 + p.d, t);
      if (p.closed && q >= 1) { ctx.save(); ctx.clip(pa); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(s.bg, 0, 0); ctx.restore(); }
      if (p.kind === 'leaf') {
        ctx.fillStyle = `rgba(118,160,120,${.55 * L1})`; ctx.fill(pa);
        if (L2 > 0) { const gr = ctx.createRadialGradient(p.c[0], p.c[1], 0, p.c[0], p.c[1], 260); gr.addColorStop(0, `rgba(40,100,110,${.75 * L2})`); gr.addColorStop(1, `rgba(60,120,100,${.1 * L2})`); ctx.fillStyle = gr; ctx.fill(pa); }
        if (L3 > 0) { ctx.save(); ctx.clip(pa); ctx.strokeStyle = `rgba(30,80,70,${.25 * L3})`; ctx.lineWidth = 18; ctx.stroke(pa); ctx.restore(); }
      } else if (p.kind === 'petal') {
        ctx.fillStyle = `rgba(246,226,222,${.8 * L1})`; ctx.fill(pa);
        const tip = [p.o[0] + Math.sin(p.a) * p.L, p.o[1] - Math.cos(p.a) * p.L];
        if (L2 > 0) { const gr = ctx.createLinearGradient(p.o[0], p.o[1], tip[0], tip[1]); gr.addColorStop(0, 'rgba(235,170,180,0)'); gr.addColorStop(.55, `rgba(226,120,145,${.35 * L2})`); gr.addColorStop(1, `rgba(206,70,105,${.85 * L2})`); ctx.fillStyle = gr; ctx.fill(pa); }
        if (L3 > 0) { const gr = ctx.createLinearGradient(p.o[0], p.o[1], tip[0], tip[1]); gr.addColorStop(.7, 'rgba(180,40,80,0)'); gr.addColorStop(1, `rgba(170,30,70,${.6 * L3})`); ctx.fillStyle = gr; ctx.fill(pa); }
      } else if (p.kind === 'pod') {
        ctx.fillStyle = `rgba(214,190,90,${.9 * L1})`; ctx.fill(pa);
        if (L2 > 0) { ctx.fillStyle = `rgba(150,150,60,${.8 * L2})`; for (const [x, y] of [[-20, -6], [0, -8], [20, -6], [-10, 6], [10, 6]]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); } }
      }
      line(p.pts, q, p.closed, p.kind === 'vein' ? 'rgba(40,50,35,.7)' : 'rgba(40,30,24,.92)', p.kind === 'vein' ? 1.3 : 2);
      if (p.veins) for (const v of p.veins) line(v, inv(3.0, 3.5, t), false, 'rgba(170,50,80,.55)', 1);
    }
    ctx.restore();
    // 题款和朱印
    const a = smooth(3.4, 3.9, t);
    if (a > 0) {
      const fs = Math.round(54 * u), tx = LAND ? W * .2 : W * .14, ty = LAND ? H * .22 : H * .1;
      ctx.fillStyle = `rgba(40,30,24,${.85 * a})`; ctx.font = `700 ${fs}px 'Noto Serif SC'`; ctx.textAlign = 'center';
      [...'清夏一池风'].forEach((c, i) => ctx.fillText(c, tx, ty + i * fs * 1.15));
      const sy = ty + 5 * fs * 1.15 + 10 * u, sz = 64 * u;
      ctx.fillStyle = `rgba(190,40,30,${.9 * a})`; ctx.fillRect(tx - sz / 2, sy, sz, sz);
      ctx.fillStyle = `rgba(240,225,200,${a})`; ctx.font = `700 ${Math.round(26 * u)}px 'Noto Serif SC'`;
      ctx.fillText('工', tx, sy + sz * .45); ctx.fillText('笔', tx, sy + sz * .88);
    }
  }
});
