// C-007 铅笔素描：先用渐变和模糊画出静物（圆柱、立方体、球）的明暗图，lib 的 hatchLines 按明暗铺三层不同角度的短排线，暗处层层加密；先出淡淡的辅助线和轮廓，再逐笔排线、擦抹，最后用“橡皮”擦出高光，铅笔层被纸纹啃出颗粒。
// 风格提示词：用铅笔素描风格：速写本纸纹上的石墨灰阶，先出淡淡的构图辅助线再逐笔加深，阴影用排线和擦抹表现，保留擦痕和未完成的线，只用黑白灰。
// 题材：手绘与绘画 · 适合：创意过程、设计思考
scene({
  id: 'C-007', name: '铅笔素描', dur: 5, still: 4.7,
  fonts: ["400 56px 'Ma Shan Zheng'"],
  text: '光从左上来第稿',
  init() {
    const u = SHORT / 1080;
    // 构图：横屏静物放右侧、批注在左上；竖屏静物放中间偏上、批注在上
    const k = (LAND ? 1.02 : 1.12) * u, ax = LAND ? W * .6 : W * .5, ay = LAND ? H * .7 : H * .6;
    const P = (x, y) => [ax + x * k, ay + y * k];
    const cyl = { x: -310, y: -40, r: 105, h: 420, e: .27 }, cube = { x0: 40, x1: 290, y0: -300, y1: -50, dx: 95, dy: -62 }, sph = { x: -70, y: -70, r: 150 };
    const T = toneMap(g => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      const [bx, by] = P(-40, -260), bg = g.createRadialGradient(bx, by, 0, bx, by, 780 * k);          // 背后的墙：中间灰、四周留白
      bg.addColorStop(0, '#b8b8b8'); bg.addColorStop(.55, '#d4d4d4'); bg.addColorStop(1, '#fff');
      g.fillStyle = bg; g.fillRect(0, 0, W, P(0, -150)[1]);
      const tb = g.createLinearGradient(0, P(0, -150)[1], 0, P(0, 260)[1]);                                 // 桌面：近处亮
      tb.addColorStop(0, '#d8d8d8'); tb.addColorStop(1, '#fbfbfb'); g.fillStyle = tb;
      g.beginPath(); g.ellipse(...P(-20, 40), 720 * k, 260 * k, 0, 0, TAU); g.fill();
      g.filter = `blur(${14 * k}px)`; g.fillStyle = '#3a3a3a';                                              // 投影：光从左上，影子往右
      g.beginPath(); g.ellipse(...P(cyl.x + 150, cyl.y + 4), 200 * k, 40 * k, -.05, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(...P(cube.x1, cube.y1)); g.lineTo(...P(cube.x1 + 230, cube.y1 + 25)); g.lineTo(...P(cube.x1 + 280, cube.y1 - 40)); g.lineTo(...P(cube.x1 + cube.dx, cube.y1 + cube.dy)); g.fill();
      g.fillStyle = '#222'; g.beginPath(); g.ellipse(...P(sph.x + 95, sph.y + sph.r - 6), 215 * k, 42 * k, -.04, 0, TAU); g.fill();
      g.filter = 'none';
      // 圆柱：身子左亮右暗，顶面最亮
      const [c0x] = P(cyl.x - cyl.r, 0), [c1x] = P(cyl.x + cyl.r, 0), [, ctop] = P(0, cyl.y - cyl.h), [, cbot] = P(0, cyl.y);
      const cg = g.createLinearGradient(c0x, 0, c1x, 0);
      cg.addColorStop(0, '#c8c8c8'); cg.addColorStop(.28, '#f2f2f2'); cg.addColorStop(.62, '#8a8a8a'); cg.addColorStop(.88, '#3c3c3c'); cg.addColorStop(1, '#5a5a5a');
      g.fillStyle = cg; g.fillRect(c0x, ctop, c1x - c0x, cbot - ctop);
      g.beginPath(); g.ellipse(...P(cyl.x, cyl.y), cyl.r * k, cyl.r * cyl.e * k, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#ececec'; g.beginPath(); g.ellipse(...P(cyl.x, cyl.y - cyl.h), cyl.r * k, cyl.r * cyl.e * k, 0, 0, TAU); g.fill();
      // 立方体：顶面亮、正面中灰、侧面暗
      const { x0, x1, y0, y1, dx, dy } = cube, poly = (pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach((q, i) => g[i ? 'lineTo' : 'moveTo'](...P(...q))); g.closePath(); g.fill(); };
      poly([[x0, y0], [x1, y0], [x1 + dx, y0 + dy], [x0 + dx, y0 + dy]], '#e6e6e6');
      const fg = g.createLinearGradient(...P(x0, y0), ...P(x1, y1)); fg.addColorStop(0, '#a8a8a8'); fg.addColorStop(1, '#7e7e7e');
      poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fg);
      poly([[x1, y0], [x1 + dx, y0 + dy], [x1 + dx, y1 + dy], [x1, y1]], '#454545');
      // 球：高光在左上，暗部转到右下，边上一圈反光
      const [sx, sy] = P(sph.x, sph.y), sr = sph.r * k;
      const sg = g.createRadialGradient(sx - sr * .38, sy - sr * .42, sr * .05, sx + sr * .08, sy + sr * .1, sr * 1.08);
      sg.addColorStop(0, '#fdfdfd'); sg.addColorStop(.32, '#c4c4c4'); sg.addColorStop(.7, '#4c4c4c'); sg.addColorStop(.88, '#2c2c2c'); sg.addColorStop(1, '#6a6a6a');
      g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, sr, 0, TAU); g.fill();
    }, { blur: 3 * u, pixel: (x, y, v) => v + (fbm(x * .004, y * .004, 3) - .5) * .12 });
    // 三层排线：一层斜排铺大关系，二层换角度压暗部，三层最暗处
    const ord = (x, y, v) => v * .6 + fbm(x * .0025, y * .0025, 2) * .5;
    const H1 = hatchLines(T, { angle: -.95, gap: 10 * u, thr: .84, maxLen: 110 * u, jitter: .5, order: ord, seed: 1 });
    const H2 = hatchLines(T, { angle: -.35, gap: 8.5 * u, thr: .58, maxLen: 90 * u, jitter: .5, order: ord, seed: 2 });
    const H3 = hatchLines(T, { angle: -1.35, gap: 6.5 * u, thr: .34, maxLen: 70 * u, jitter: .5, order: ord, seed: 3 });
    // 辅助线：长、淡、出头
    const guide = [
      [P(-640, -150), P(640, -150)], [P(-720, 140), P(700, 120)],
      [P(sph.x, sph.y - 230), P(sph.x, sph.y + 200)], [P(sph.x - 220, sph.y), P(sph.x + 230, sph.y)],
      [P(cyl.x, cyl.y - cyl.h - 70), P(cyl.x, cyl.y + 60)],
      [P(cube.x0 - 60, cube.y0 + 40), P(cube.x1 + cube.dx + 80, cube.y0 + cube.dy - 20)], [P(cube.x1 - 40, cube.y1 + 30), P(cube.x1 + cube.dx + 60, cube.y1 + cube.dy - 40)],
    ].map(([a, b], i) => linePts(a[0], a[1], b[0], b[1], 10, 3 * u, i * 9));
    guide.push(circlePts(...P(cyl.x, cyl.y), cyl.r * k, 48, 0, TAU, .03, 4).map(([x, y]) => [x, P(0, cyl.y)[1] + (y - P(0, cyl.y)[1]) * cyl.e]));
    // 轮廓：稍抖、出头、不完全闭合
    const [sx, sy] = P(sph.x, sph.y), sr = sph.r * k;
    const ell = (cx, cy, r, e, a0, a1, sd) => circlePts(cx, cy, r, 40, a0, a1, .02, sd).map(([x, y]) => [x, cy + (y - cy) * e]);
    const { x0, x1, y0, y1, dx, dy } = cube, ln = (a, b, sd) => linePts(...P(...a), ...P(...b), 10, 2.5 * u, sd);
    const outline = [
      circlePts(sx, sy, sr, 72, -2.2, TAU - 2.35, .02, 7),
      ell(...P(cyl.x, cyl.y - cyl.h), cyl.r * k, cyl.e, 0, TAU * .97, 11), ell(...P(cyl.x, cyl.y), cyl.r * k, cyl.e, -.1, Math.PI + .15, 12),
      ln([cyl.x - cyl.r, cyl.y - cyl.h - 6], [cyl.x - cyl.r, cyl.y + 10], 13), ln([cyl.x + cyl.r, cyl.y - cyl.h], [cyl.x + cyl.r, cyl.y + 6], 14),
      ln([x0 - 8, y0], [x1 + 10, y0], 21), ln([x0, y0 - 6], [x0, y1 + 12], 22), ln([x1, y0], [x1, y1 + 8], 23), ln([x0 - 4, y1], [x1 + 6, y1], 24),
      ln([x0, y0], [x0 + dx, y0 + dy], 25), ln([x1, y0], [x1 + dx + 8, y0 + dy - 5], 26), ln([x0 + dx - 10, y0 + dy], [x1 + dx + 6, y0 + dy], 27), ln([x1 + dx, y0 + dy - 4], [x1 + dx, y1 + dy + 10], 28), ln([x1, y1], [x1 + dx, y1 + dy], 29),
    ];
    // 橡皮擦出的高光：球、圆柱、桌面几道
    const erase = [[sx - sr * .5, sy - sr * .52, sx - sr * .2, sy - sr * .3, 26], [...P(cyl.x - 40, cyl.y - cyl.h + 60), ...P(cyl.x - 30, cyl.y - 60), 18], [...P(-520, 170), ...P(-180, 150), 22]];
    // 纸的齿：随机透明点，把铅笔层啃出颗粒
    const tooth = mk(W / 2, H / 2), tg = tooth.getContext('2d'), im = tg.createImageData(W / 2, H / 2), R = mulberry32(77);
    for (let i = 0; i < im.data.length; i += 4) { const a = R(); im.data[i + 3] = a < .5 ? 0 : (a - .5) * 300; }
    tg.putImageData(im, 0, 0);
    return { u, k, P, T, H1, H2, H3, guide, outline, erase, tooth, L: mk(W, H), paper: makePaper('#F1EEE6', { seed: 7, grain: 14, fiber: .45, blot: 6 }) };
  },
  draw(ctx, t, s) {
    const { u, P, L } = s, g = L.getContext('2d');
    ctx.drawImage(s.paper, 0, 0, W, H);
    g.clearRect(0, 0, W, H);
    const lead = '#2b2b30';
    // 擦抹：明暗图模糊后淡淡一层，像手指揉开的石墨
    const sm = smooth(3.2, 4.4, t);
    if (sm > 0) { g.save(); g.globalAlpha = .3 * sm; g.filter = `blur(${6 * u}px)`; g.globalCompositeOperation = 'source-over';
      g.drawImage(s.T.canvas, 0, 0, W, H); g.restore(); }
    // 辅助线
    s.guide.forEach((pts, i) => { const p = inv(.05 + i * .1, .5 + i * .1, t); if (p <= 0) return;
      g.save(); g.strokeStyle = lead; g.globalAlpha = .28; g.lineWidth = 1.3 * u; drawPartial(g, pts, eOutCubic(p)); g.restore(); });
    // 排线三层
    const pa = (lo, hi) => v => lerp(hi, lo, v);
    drawHatch(g, s.H1, inv(1.2, 3.3, t), { color: lead, width: 1.5 * u, alpha: pa(.35, .7), bend: .06, wob: 1.6 * u, dur: .03 });
    drawHatch(g, s.H2, inv(2.1, 3.9, t), { color: lead, width: 1.6 * u, alpha: pa(.45, .8), bend: .05, wob: 1.4 * u, dur: .03, seed: 2 });
    drawHatch(g, s.H3, inv(3.0, 4.35, t), { color: '#1d1d21', width: 2 * u, alpha: pa(.6, .9), bend: .04, wob: 1.2 * u, dur: .03, seed: 3 });
    // 轮廓
    s.outline.forEach((pts, i) => { const p = inv(.6 + i * .09, 1.1 + i * .09, t); if (p <= 0) return;
      g.save(); g.strokeStyle = lead; g.globalAlpha = .75; g.lineWidth = (i < 5 ? 2.4 : 2.1) * u; g.lineCap = 'round'; drawPartial(g, pts, eOutCubic(p)); g.restore(); });
    // 橡皮：擦出高光（在铅笔层上挖掉）
    s.erase.forEach(([x0, y0, x1, y1, w], i) => { const p = eOutCubic(inv(4.15 + i * .12, 4.45 + i * .12, t)); if (p <= 0) return;
      g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = .85; g.lineCap = 'round'; g.lineWidth = w * u; g.filter = `blur(${3 * u}px)`;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, p), lerp(y0, y1, p)); g.stroke(); g.restore(); });
    // 纸纹啃出颗粒
    g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = .55; g.drawImage(s.tooth, 0, 0, W, H); g.restore();
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(L, 0, 0); ctx.restore();
    // 批注：光的方向箭头 + 第几稿
    const nx = LAND ? W * .07 : W * .08, ny = LAND ? H * .16 : H * .12;
    const na = smooth(.3, .9, t);
    if (na > 0) {
      ctx.save(); ctx.globalAlpha = na * .82; ctx.fillStyle = lead; ctx.strokeStyle = lead; ctx.lineWidth = 2.6 * u; ctx.lineCap = 'round';
      ctx.font = `400 ${Math.round(58 * u)}px 'Ma Shan Zheng'`; ctx.textAlign = 'left'; ctx.fillText('光从左上来', nx, ny);
      const ap = linePts(nx + 20 * u, ny + 40 * u, nx + 230 * u, ny + 140 * u, 10, 4 * u, 3); drawPartial(ctx, ap, eOutCubic(inv(.5, 1.1, t)));
      if (t > 1.1) { ctx.beginPath(); ctx.moveTo(nx + 230 * u, ny + 140 * u); ctx.lineTo(nx + 190 * u, ny + 140 * u); ctx.moveTo(nx + 230 * u, ny + 140 * u); ctx.lineTo(nx + 214 * u, ny + 104 * u); ctx.stroke(); }
      ctx.restore();
    }
    const sg = smooth(4.4, 4.8, t);
    if (sg > 0) { ctx.save(); ctx.globalAlpha = sg * .8; ctx.fillStyle = lead; ctx.font = `400 ${Math.round(44 * u)}px 'Ma Shan Zheng'`;
      ctx.textAlign = 'right'; ctx.fillText('第 3 稿', LAND ? W * .94 : W * .92, LAND ? H * .92 : H * .93); ctx.restore(); }
  }
});
