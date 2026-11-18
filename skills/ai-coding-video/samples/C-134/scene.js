// C-134 盛期文艺复兴晕涂：原创的半身像（戴软帽的年轻人、四分之三侧、双手捧书，构成三角形），身后是一层比一层更蓝更淡的远山；脸、手的明暗全靠模糊滤镜叠出的软边（没有轮廓线），init 里画好彩色层、灰褐单色层、龟裂纹和底稿线；每帧按时间依次显出底稿 → 单色素描 → 色彩罩染 → 黄色旧光油和龟裂，镜头一直慢慢推近脸。
// 风格提示词：用盛期文艺复兴晕涂风格：人物半身像按稳定的三角形构图，脸和手的明暗像烟雾一样一点点化开，看不到一条硬轮廓线，暗部是透明的暖褐色，背景远山一层比一层更蓝更淡（空气透视），整幅画蒙着一层发黄的旧光油和细密的龟裂纹，镜头极慢地推近，转场是画面像罩染一样一层层叠上来。
// 题材：绘画流派 · 适合：艺术史与博物馆、人物故事开场、古典气质的品牌片
scene({
  id: 'C-134', name: '盛期文艺复兴晕涂', dur: 5, still: 4.6,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    // 构图：人物居中，脸在上三分之一；竖屏人物更大
    const k = (LAND ? .95 : 1.25) * u, fx = W * .5, fy = LAND ? H * .34 : H * .32;
    const P = (x, y) => [fx + x * k, fy + y * k];
    const blur = (g, r) => { g.filter = r > 0 ? `blur(${r * k}px)` : 'none'; };
    const ell = (g, x, y, rx, ry, c, rot = 0) => { g.fillStyle = c; g.beginPath(); g.ellipse(...P(x, y), rx * k, ry * k, rot, 0, TAU); g.fill(); };
    const path = (g, pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...P(...p)) : g.moveTo(...P(...p))); g.closePath(); g.fill(); };
    const color = mk(W, H), g = color.getContext('2d');
    // 天空和远山：越远越蓝越淡
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#93A6A0'); sky.addColorStop(.45, '#D8D8C0'); sky.addColorStop(1, '#8A8A70');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const ridge = (base, amp, seed, c, b) => { blur(g, b); g.fillStyle = c; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) { const y = base - (Math.abs(noise1(x * .004 + seed) - .5) * 2 + Math.pow(noise1(x * .0016 + seed * 3), 2)) * amp; g.lineTo(x, y); }
      g.lineTo(W, H); g.fill(); };
    ridge(fy + 40 * k, 220 * k, 1, '#A9BCC4', 10); ridge(fy + 140 * k, 200 * k, 4, '#8AA2AC', 7); ridge(fy + 260 * k, 160 * k, 7, '#7A8A76', 5); ridge(fy + 380 * k, 120 * k, 9, '#6A6244', 4);
    blur(g, 6); g.strokeStyle = 'rgba(226,222,196,.45)'; g.lineWidth = 14 * k; g.beginPath();                        // 蜿蜒的小河
    for (let i = 0; i <= 40; i++) { const s = i / 40, x = W * (.08 + s * .3) + Math.sin(s * 9) * 60 * k, y = fy + (60 + s * 360) * k; i ? g.lineTo(x, y) : g.moveTo(x, y); g.lineWidth = (4 + s * 12) * k; }
    g.stroke(); blur(g, 0);
    // 衣服：深色的三角形，几道柔和的褶
    blur(g, 10); path(g, [[-70, 150], [-300, 290], [-400, 380], [-500, 1400], [500, 1400], [400, 380], [300, 290], [70, 150]], '#3E1E14');
    blur(g, 18); [[-250, 520, 40, 260, .25], [230, 540, 36, 260, -.2], [-60, 760, 30, 200, .05]].forEach(([x, y, rx, ry, r]) => ell(g, x, y, rx, ry, 'rgba(24,12,8,.6)', r));
    [[-300, 380, 50, 90, .4]].forEach(([x, y, rx, ry, r]) => ell(g, x, y, rx, ry, 'rgba(120,60,40,.3)', r));                 // 左肩受光
    blur(g, 9); path(g, [[-90, 200], [-40, 290], [40, 290], [90, 200], [120, 210], [60, 320], [-60, 320], [-120, 210]], 'rgba(24,14,10,.85)');   // 深色领口
    blur(g, 3); g.strokeStyle = 'rgba(230,220,196,.8)'; g.lineWidth = 7 * k; g.beginPath(); g.moveTo(...P(-62, 200)); g.quadraticCurveTo(...P(0, 236), ...P(62, 200)); g.stroke();   // 白衬衣领边
    // 头发、脖子、脸
    blur(g, 9); ell(g, 6, -10, 150, 190, '#4A3220'); [[-128, 40], [-110, 100], [128, 30], [116, 96], [80, 140]].forEach(([x, y]) => ell(g, x, y, 34, 42, '#3E2A1A'));   // 短卷发
    blur(g, 4); path(g, [[-55, 90], [-60, 230], [60, 230], [55, 90]], '#C49A72');
    blur(g, 10); ell(g, 30, 190, 50, 50, 'rgba(90,60,40,.55)');
    blur(g, 3); const sk = g.createRadialGradient(...P(-55, -45), 10 * k, ...P(-10, 0), 230 * k); sk.addColorStop(0, '#EED2AC'); sk.addColorStop(.5, '#D2AA80'); sk.addColorStop(1, '#8A6246');
    g.fillStyle = sk; g.beginPath(); g.ellipse(...P(0, 0), 122 * k, 162 * k, .06, 0, TAU); g.fill();
    blur(g, 22); ell(g, 92, 20, 56, 150, 'rgba(86,58,38,.6)');                                                     // 背光的半边脸
    blur(g, 14); ell(g, -48, -22, 38, 22, 'rgba(120,80,52,.45)'); ell(g, 42, -22, 34, 22, 'rgba(110,72,48,.55)');  // 眼窝
    ell(g, -60, 40, 34, 24, 'rgba(210,120,96,.18)'); ell(g, 50, 46, 26, 20, 'rgba(190,110,90,.14)');               // 脸颊
    blur(g, 2.4); [[-48, -18, 1], [40, -18, .9]].forEach(([x, y, s]) => {                                          // 眼睛
      ell(g, x, y, 20 * s, 7.5, 'rgba(220,206,180,.85)'); ell(g, x - 4, y, 8, 8, '#3A281A');
      g.strokeStyle = 'rgba(60,40,26,.8)'; g.lineWidth = 3 * k; g.beginPath(); g.ellipse(...P(x, y + 2), 21 * s * k, 10 * k, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); });
    blur(g, 3); g.strokeStyle = 'rgba(80,56,36,.35)'; g.lineWidth = 5 * k; [[-48, -46, 32], [42, -46, 28]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(...P(x, y + 14), r * k, 14 * k, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); });
    blur(g, 7); g.strokeStyle = 'rgba(110,72,48,.5)'; g.lineWidth = 12 * k; g.beginPath(); g.moveTo(...P(4, -10)); g.quadraticCurveTo(...P(18, 30), ...P(14, 58)); g.stroke();   // 鼻侧
    ell(g, 2, 64, 22, 8, 'rgba(100,66,44,.55)'); blur(g, 18); ell(g, -40, -90, 50, 26, 'rgba(250,230,200,.35)'); blur(g, 6); ell(g, -12, 30, 6, 26, 'rgba(250,228,200,.4)');
    blur(g, 3); g.strokeStyle = 'rgba(110,60,46,.75)'; g.lineWidth = 4 * k; g.beginPath(); g.moveTo(...P(-32, 100)); g.quadraticCurveTo(...P(-6, 106), ...P(26, 98)); g.stroke();   // 嘴角微微上扬
    blur(g, 5); ell(g, -4, 110, 22, 7, 'rgba(186,110,90,.35)'); ell(g, 0, 160, 50, 14, 'rgba(120,80,56,.25)');
    // 软帽：压在头上、往右歪
    blur(g, 6); ell(g, 10, -150, 175, 66, '#6A2A1E', -.12); ell(g, 30, -176, 130, 52, '#5A2218', -.12); blur(g, 14); ell(g, -60, -170, 60, 22, 'rgba(170,80,56,.5)', -.12); ell(g, 90, -140, 70, 24, 'rgba(20,8,6,.5)', -.12);
    // 捧着的书和双手
    blur(g, 6); path(g, [[-190, 560], [170, 520], [200, 640], [-160, 690]], '#2E3A2A'); blur(g, 4); path(g, [[-176, 548], [160, 510], [168, 526], [-170, 566]], '#D8CCA8');   // 绿皮书、书页边
    blur(g, 5); const hd = g.createRadialGradient(...P(-120, 560), 10 * k, ...P(-60, 600), 160 * k); hd.addColorStop(0, '#E8C8A0'); hd.addColorStop(1, '#9A7050');
    const finger = (x0, y0, a, len, w) => { g.lineCap = 'round'; g.lineWidth = w * k; g.beginPath(); g.moveTo(...P(x0, y0)); g.lineTo(...P(x0 + Math.cos(a) * len, y0 + Math.sin(a) * len)); g.stroke(); };
    g.fillStyle = hd; g.strokeStyle = hd;
    g.beginPath(); g.ellipse(...P(-150, 690), 60 * k, 40 * k, -.3, 0, TAU); g.fill();                                       // 左手在书下托着，手指从下沿弯上来
    [[-190, 680], [-164, 690], [-138, 696], [-112, 698]].forEach(([x, y], i) => finger(x, y, -1.45 + i * .05, 44 - i * 4, 20));
    g.beginPath(); g.ellipse(...P(150, 520), 62 * k, 40 * k, .35, 0, TAU); g.fill();                                        // 右手搭在书上，四指往左下伸
    [[120, 520], [124, 544], [130, 566], [138, 586]].forEach(([x, y], i) => finger(x, y, 2.75 - i * .08, 80 - i * 8, 20)); finger(170, 500, 2.2, 50, 22);
    blur(g, 6); g.strokeStyle = 'rgba(110,76,52,.4)'; g.lineWidth = 3 * k; [[120, 532], [126, 555], [133, 576]].forEach(([x, y]) => { g.beginPath(); g.moveTo(...P(x, y)); g.lineTo(...P(x - 70, y + 22)); g.stroke(); });
    blur(g, 0);
    // 灰褐单色层（素描阶段）
    const grey = mk(W, H), gg = grey.getContext('2d'); gg.filter = 'grayscale(1) sepia(.7) contrast(1.1)'; gg.drawImage(color, 0, 0); gg.filter = 'none';
    // 底稿线：轮廓的几笔
    const sketch = [
      Array.from({ length: 41 }, (_, i) => P(Math.cos(i / 40 * TAU) * 122, Math.sin(i / 40 * TAU) * 162)),
      [P(-400, 380), P(-300, 290), P(-70, 150)], [P(400, 380), P(300, 290), P(70, 150)], [P(-400, 380), P(-500, 1400)], [P(400, 380), P(500, 1400)],
      Array.from({ length: 31 }, (_, i) => P(10 + Math.cos(i / 30 * TAU) * 175, -150 + Math.sin(i / 30 * TAU) * 66)),
      [P(-190, 560), P(170, 520), P(200, 640), P(-160, 690), P(-190, 560)],
      [P(-68, -18), P(-28, -18)], [P(22, -18), P(58, -18)], [P(4, -10), P(14, 58), P(-4, 66)], [P(-32, 100), P(26, 98)],
      [P(-W / k, 0), P(-150, 60), P(-220, 30)], [P(150, 40), P(260, 0), P(W / k, 60)],
    ];
    // 龟裂纹：许多会拐弯、分叉的细线
    const crack = mk(W, H), cg = crack.getContext('2d'), R = mulberry32(134);
    cg.lineCap = 'round';
    const cell = 26 * u, nx = Math.ceil(W / cell) + 1, ny = Math.ceil(H / cell) + 1, pt = (i, j) => [(i + .5 + (hash2(i, j * 7 + 1) - .5) * .8) * cell, (j + .5 + (hash2(i * 3 + 5, j) - .5) * .8) * cell];
    cg.strokeStyle = 'rgba(30,20,10,.3)'; cg.lineWidth = .7 * u; cg.beginPath();
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const a = pt(i, j);                                     // 每个点连右边和下边的点，随机断掉一些
      if (R() < .75) { cg.moveTo(...a); cg.lineTo(...pt(i + 1, j)); } if (R() < .75) { cg.moveTo(...a); cg.lineTo(...pt(i, j + 1)); } }
    cg.stroke();
    return { u, k, fx, fy, color, grey, sketch, crack, ground: makePaper('#8A6A44', { seed: 134, grain: 14, fiber: .2, blot: 6 }) };
  },
  draw(ctx, t, s) {
    const { u, k, fx, fy } = s;
    // 镜头：慢慢推近脸
    const z = 1 + .08 * eInOutCubic(t / 5), cx = fx, cy = fy + 60 * k;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy);
    ctx.drawImage(s.ground, 0, 0, W, H);
    // 底稿：红褐色的几笔
    const sp = inv(.1, 1.2, t);
    ctx.strokeStyle = 'rgba(70,36,20,.75)'; ctx.lineWidth = 2.4 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    s.sketch.forEach((pts, i) => { const p = clamp(sp * s.sketch.length - i * .6); if (p > 0) drawPartial(ctx, pts, p); });
    // 单色素描 → 色彩罩染
    const ga = smooth(.9, 2.2, t), ca = smooth(2, 3.4, t);
    if (ga > 0) { ctx.globalAlpha = ga; ctx.drawImage(s.grey, 0, 0); }
    if (ca > 0) { ctx.globalAlpha = ca; ctx.drawImage(s.color, 0, 0); }
    ctx.globalAlpha = 1;
    // 旧光油：整体发黄、四角压暗；龟裂纹
    const va = smooth(3.2, 4.4, t);
    if (va > 0) {
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(214,170,80,${.55 * va})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = va * .55; ctx.drawImage(s.crack, 0, 0); ctx.globalAlpha = 1;
    }
    ctx.restore();
    vignette(ctx, .25 + .35 * va);
  }
});
