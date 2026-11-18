// C-088 圆珠笔速写：老闹钟的明暗先用渐变画成明暗图，再由 hatchLines 铺四层不同角度的排线（越暗叠得越多），线宽始终不变，只靠疏密出明暗；先描轮廓再一层层排线，笔停处留一个小墨点，整张像速写慢放。
// 风格提示词：用圆珠笔速写风格：奶油色卡纸上只有一支蓝色圆珠笔，线条粗细几乎不变，明暗全靠排线的疏密来表现，笔画停住的地方留一个小墨点，先画轮廓再一层层加排线，整段像把一张速写慢放出来。
// 题材：手绘与绘画 · 适合：产品与物件特写、手账感讲解、复古钟表机械
scene({
  id: 'C-088', name: '圆珠笔速写', dur: 5, still: 4.6,
  fonts: ["400 56px 'Ma Shan Zheng'"],
  text: '老闹钟速写七点十分',
  init() {
    const u = SHORT / 1080;
    // 构图：横屏闹钟在右、手写字在左；竖屏闹钟在上、字在下
    const k = (LAND ? .95 : 1.25) * u, cx = LAND ? W * .64 : W * .5, cy = LAND ? H * .52 : H * .4;
    const P = (x, y) => [cx + x * k, cy + y * k], R0 = 250, Rf = 212;
    const bells = [-1, 1].map(d => { const a = -Math.PI / 2 + d * .72; return [Math.cos(a) * 300, Math.sin(a) * 300, a]; });
    const T = toneMap(g => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.filter = `blur(${18 * k}px)`; g.fillStyle = '#555';                                  // 桌上的影子，往右下
      g.beginPath(); g.ellipse(...P(70, 300), 330 * k, 46 * k, 0, 0, TAU); g.fill(); g.filter = 'none';
      for (const [bx, by, a] of bells) {                                                      // 铃：金属，高光在左上
        const [x, y] = P(bx, by), gr = g.createRadialGradient(x - 30 * k, y - 34 * k, 4 * k, x, y, 110 * k);
        gr.addColorStop(0, '#fff'); gr.addColorStop(.35, '#bbb'); gr.addColorStop(.8, '#3a3a3a'); gr.addColorStop(1, '#555');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, 100 * k, a - Math.PI / 2, a + Math.PI / 2); g.closePath(); g.fill();
      }
      g.fillStyle = '#444'; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(...P(d * 150, 190)); g.lineTo(...P(d * 215, 290)); g.lineTo(...P(d * 185, 296)); g.lineTo(...P(d * 120, 205)); g.fill(); }
      const [bx, by] = P(0, 0), body = g.createRadialGradient(bx - 90 * k, by - 110 * k, 20 * k, bx + 20 * k, by + 20 * k, R0 * 1.1 * k);
      body.addColorStop(0, '#e8e8e8'); body.addColorStop(.55, '#888'); body.addColorStop(.85, '#2e2e2e'); body.addColorStop(1, '#4a4a4a');
      g.fillStyle = body; g.beginPath(); g.arc(bx, by, R0 * k, 0, TAU); g.fill();
      const face = g.createRadialGradient(bx - 40 * k, by - 50 * k, 10 * k, bx, by, Rf * k);   // 表盘：亮，右下边沿有一圈玻璃的阴影
      face.addColorStop(0, '#fff'); face.addColorStop(.75, '#f2f2f2'); face.addColorStop(.92, '#bdbdbd'); face.addColorStop(1, '#7a7a7a');
      g.fillStyle = face; g.beginPath(); g.arc(bx, by, Rf * k, 0, TAU); g.fill();
      g.fillStyle = '#3a3a3a'; g.beginPath(); g.ellipse(...P(0, -R0 - 22), 34 * k, 26 * k, 0, 0, TAU); g.fill();
    }, { blur: 2 * u, pixel: (x, y, v) => v + (fbm(x * .006, y * .006, 2) - .5) * .08 });
    const ord = (x, y, v) => v * .5 + Math.atan2(y - cy, x - cx) / TAU * .5 + .25;            // 绕着钟一圈圈加
    const box = [cx - 560 * k, cy - 470 * k, cx + 560 * k, cy + 380 * k];
    const lay = [[-.8, 10, .82], [.55, 8.5, .6], [-1.45, 7.5, .38], [.05, 6.5, .2]].map(([angle, gap, thr], i) =>
      hatchLines(T, { angle, gap: gap * u, thr, maxLen: 70 * u, minLen: 8 * u, jitter: .4, order: ord, box, seed: 11 + i }));
    // 轮廓：表身两圈、铃、腿、提手、锤；刻度和指针
    const ol = [circlePts(...P(0, 0), R0 * k, 90, -1.8, TAU - 1.75, .015, 1), circlePts(...P(0, 0), Rf * k, 80, -1.2, TAU - 1.3, .015, 2)];
    for (const [bx, by, a] of bells) ol.push(circlePts(...P(bx, by), 100 * k, 30, a - Math.PI / 2 - .05, a + Math.PI / 2 + .05, .03, a * 10));
    for (const d of [-1, 1]) ol.push(linePts(...P(d * 150, 190), ...P(d * 212, 296), 6, 2 * u, d + 5), linePts(...P(d * 120, 205), ...P(d * 185, 298), 6, 2 * u, d + 7));
    ol.push(circlePts(...P(0, -R0 - 10), 120 * k, 40, Math.PI + .25, TAU - .25, .03, 9), linePts(...P(0, -R0), ...P(0, -R0 - 60), 4, u, 3));
    ol.push(linePts(...P(-330, 300), ...P(380, 296), 14, 4 * u, 21));
    const ticks = [], hands = [];
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = i % 3 ? 186 : 170; ticks.push(linePts(...P(Math.sin(a) * r0, -Math.cos(a) * r0), ...P(Math.sin(a) * 200, -Math.cos(a) * 200), 2, 0, i)); }
    const hand = (a, l) => linePts(...P(-Math.sin(a) * 26, Math.cos(a) * 26), ...P(Math.sin(a) * l, -Math.cos(a) * l), 6, 1.5 * u, a * 7);
    hands.push(hand((7 + 10 / 60) / 12 * TAU, 115), hand(10 / 60 * TAU, 165));
    return { u, k, P, T, lay, ol, ticks, hands, paper: makePaper('#F4ECDA', { seed: 88, grain: 10, fiber: .3, blot: 6 }) };
  },
  draw(ctx, t, s) {
    const { u } = s, ink = '#1F3C9C';
    ctx.drawImage(s.paper, 0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 2 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    s.ol.forEach((pts, i) => { const p = inv(.05 + i * .1, .4 + i * .1, t); if (p > 0) { const tip = drawPartial(ctx, pts, eOutCubic(p)); if (p >= 1 && i % 2 === 0) { ctx.beginPath(); ctx.arc(tip[0], tip[1], 2.3 * u, 0, TAU); ctx.fill(); } } });
    s.ticks.forEach((pts, i) => { if (t > 1.4 + i * .04) drawPartial(ctx, pts, 1); });
    s.hands.forEach((pts, i) => { const p = inv(1.9 + i * .2, 2.2 + i * .2, t); if (p > 0) { ctx.lineWidth = (3.2 - i) * u; drawPartial(ctx, pts, p); } });
    if (t > 2.4) { ctx.beginPath(); ctx.arc(...s.P(0, 0), 8 * u, 0, TAU); ctx.fill(); }
    const spans = [[1.1, 2.6], [1.9, 3.4], [2.6, 4.1], [3.2, 4.5]];
    s.lay.forEach((L, i) => drawHatch(ctx, L, inv(...spans[i], t), { color: ink, width: 1.7 * u, alpha: .82, bend: .04, wob: .8 * u, blob: 1.9 * u, dur: .02, seed: i + 1 }));
    // 手写字
    const tx = LAND ? W * .08 : W * .5, ty = LAND ? H * .3 : H * .8, a = LAND ? 'left' : 'center';
    ctx.font = `400 ${Math.round(76 * u)}px 'Ma Shan Zheng'`; ctx.textAlign = a;
    textReveal(ctx, '老闹钟速写', tx, ty, inv(.3, 1.3, t), a);
    ctx.font = `400 ${Math.round(46 * u)}px 'Ma Shan Zheng'`;
    textReveal(ctx, '七点十分 · 该起床了', tx, ty + 80 * u, inv(3.9, 4.6, t), a);
    ctx.restore();
  }
});
