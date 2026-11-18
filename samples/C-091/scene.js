// C-091 彩色铅笔：每种颜色先画一张“这颜色该涂多重”的明暗图，各自交给 hatchLines 铺成同一斜向的短弯排线，按顺序一层层叠（紫叠暮蓝、蓝叠青）；铅笔层被纸的齿啃出细小留白，最后深色铅笔补几根断续的外形线。
// 风格提示词：用彩色铅笔风格：奶油色卡纸的纸纹让每片颜色里都带着细小的留白，笔触是短而略弯的排线，几乎全部朝同一个斜向，颜色靠力度和一层层叠色出来（紫叠暮蓝、蓝叠青），没有轮廓线，最后才用深色铅笔补几根断续的外形线。
// 题材：手绘与绘画 · 适合：儿童内容、生活场景插画、温和的讲解
scene({
  id: 'C-091', name: '彩色铅笔', dur: 5, still: 4.7,
  fonts: ["400 80px 'ZCOOL KuaiLe'"],
  text: '晚安小屋',
  init() {
    const u = SHORT / 1080;
    // 构图：横屏小屋在右、字在左上；竖屏小屋在中下、字在上
    const hz = LAND ? H * .62 : H * .62, hx = LAND ? W * .66 : W * .5, moon = LAND ? [W * .84, H * .2] : [W * .74, H * .14];
    const back = x => hz - 60 * u - Math.sin(x / W * 5 + 1) * 50 * u - Math.sin(x / W * 11) * 18 * u;          // 远山
    const front = x => hz + 60 * u + Math.pow((x - hx) / W, 2) * 360 * u - 50 * u * Math.cos((x - hx) / W * 3);   // 近处的坡，小屋在坡顶
    const hy = front(hx), hs = (LAND ? 1 : 1.2) * u;                                                              // 小屋底边、大小
    const house = { x0: hx - 120 * hs, x1: hx + 120 * hs, y0: hy - 170 * hs, y1: hy + 10 * hs, roof: hy - 290 * hs };
    const tree = [hx - 250 * hs, hy - 10 * hs];
    const fillCurve = (g, f, y1) => { g.beginPath(); g.moveTo(0, y1); for (let x = 0; x <= W; x += 20) g.lineTo(x, f(x)); g.lineTo(W, y1); g.closePath(); g.fill(); };
    const housePath = g => { g.beginPath(); g.moveTo(house.x0, house.y1); g.lineTo(house.x0, house.y0); g.lineTo(hx, house.roof); g.lineTo(house.x1, house.y0); g.lineTo(house.x1, house.y1); g.closePath(); };
    const win = [hx - 30 * hs, hy - 120 * hs, 60 * hs, 60 * hs];
    // 每种颜色的“涂多重”：黑 = 涂满，白 = 不涂
    const cov = fn => toneMap(g => { fn(g); }, { res: 5, blur: 6 * u });
    const lg = (g, y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(([p, c]) => gr.addColorStop(p, c)); return gr; };
    const layers = [
      ['#55B6C8', g => { g.fillStyle = lg(g, 0, hz, [[0, '#888'], [.6, '#555'], [1, '#bbb']]); g.fillRect(0, 0, W, hz); }],                       // 青：天的底
      ['#3C55A5', g => { g.fillStyle = lg(g, 0, hz, [[0, '#222'], [.55, '#999'], [.8, '#fff']]); g.fillRect(0, 0, W, hz); }],                      // 暮蓝
      ['#7A4C9C', g => { g.fillStyle = lg(g, 0, hz, [[0, '#444'], [.35, '#ccc'], [.5, '#fff']]); g.fillRect(0, 0, W, hz); g.fillStyle = '#777'; fillCurve(g, back, H); }],  // 紫：天顶、远山
      ['#EE9A6A', g => { g.fillStyle = lg(g, hz * .45, hz, [[0, '#fff'], [.75, '#777'], [1, '#666']]); g.fillRect(0, 0, W, hz); }],                // 天边的橙粉
      ['#7DB357', g => { g.fillStyle = '#555'; fillCurve(g, front, H); }],                                                                            // 草坡
      ['#2E6A4B', g => { g.fillStyle = lg(g, hz, H, [[0, '#ddd'], [1, '#444']]); fillCurve(g, front, H);
        g.fillStyle = '#222'; g.beginPath(); g.ellipse(tree[0], tree[1] - 170 * hs, 95 * hs, 130 * hs, 0, 0, TAU); g.fill(); }],                     // 深绿：坡的暗部、远山、树冠
      ['#C2573C', g => { g.fillStyle = '#555'; housePath(g); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.moveTo(house.x0 - 20 * hs, house.y0 + 4 * hs); g.lineTo(hx, house.roof - 10 * hs); g.lineTo(house.x1 + 20 * hs, house.y0 + 4 * hs); g.lineTo(hx, house.y0 - 50 * hs); g.fill();
        g.fillStyle = '#333'; g.fillRect(tree[0] - 12 * hs, tree[1] - 80 * hs, 24 * hs, 90 * hs); }],                                                 // 砖红：墙、屋顶、树干
      ['#F3C844', g => { g.fillStyle = '#111'; g.fillRect(...win); g.beginPath(); g.arc(...moon, 62 * u, 0, TAU); g.fill();
        const gl = g.createRadialGradient(win[0] + 30 * hs, win[1] + 30 * hs, 0, win[0] + 30 * hs, win[1] + 30 * hs, 170 * hs); gl.addColorStop(0, '#aaa'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); }],  // 黄：窗、月亮
    ];
    const order = (x, y) => (x / W) * .8 + fbm(x * .003, y * .003, 2) * .4;
    const L = layers.map(([c, fn], i) => {
      const T = cov(fn);
      return { c, H: hatchLines(T, { angle: -1.12, gap: 4.1 * u, thr: .93, maxLen: 30 * u, minLen: 6 * u, jitter: .6, order, seed: 30 + i }) };
    });
    // 深色铅笔：断续的外形线
    const seg = (pts, a, b) => pts.slice(Math.floor(pts.length * a), Math.ceil(pts.length * b));
    const roofL = linePts(house.x0 - 20 * hs, house.y0 + 4 * hs, hx, house.roof - 10 * hs, 10, 3 * u, 1), roofR = linePts(hx, house.roof - 10 * hs, house.x1 + 20 * hs, house.y0 + 4 * hs, 10, 3 * u, 2);
    const ridge = Array.from({ length: 40 }, (_, i) => { const x = W * i / 39; return [x, front(x)]; });
    const outl = [seg(roofL, 0, .8), seg(roofR, .15, 1), linePts(house.x0, house.y0 + 10 * hs, house.x0, house.y1, 6, 2 * u, 3), linePts(house.x1, house.y0 + 20 * hs, house.x1, house.y1 - 10 * hs, 6, 2 * u, 4),
      seg(ridge, .15, .4), seg(ridge, .52, .7), seg(ridge, .78, .95), rectPts(...win, 1.5 * u, 5), circlePts(tree[0], tree[1] - 170 * hs, 120 * hs, 40, 2.2, 5.6, .06, 7)];
    const tooth = mk(W / 2, H / 2), tg = tooth.getContext('2d'), im = tg.createImageData(W / 2, H / 2), R = mulberry32(91);
    for (let y = 0; y < H / 2; y++) for (let x = 0; x < W / 2; x++) { const i = (y * W / 2 + x) * 4, n = vnoise(x * .9, y * .9) * .6 + R() * .4; im.data[i + 3] = n > .55 ? 255 : 0; }
    tg.putImageData(im, 0, 0);
    return { u, L, outl, tooth, B: mk(W, H), paper: makePaper('#F5ECD9', { seed: 91, grain: 12, fiber: .35, blot: 8 }) };
  },
  draw(ctx, t, s) {
    const { u, B } = s, g = B.getContext('2d');
    ctx.drawImage(s.paper, 0, 0, W, H);
    g.clearRect(0, 0, W, H);
    s.L.forEach((l, i) => {
      const p = inv(.15 + i * .42, .15 + i * .42 + 1.1, t);
      if (p > 0) drawHatch(g, l.H, p, { color: l.c, width: 3.2 * u, alpha: v => lerp(.9, .35, v), bend: .18, wob: 1 * u, dur: .05, seed: i + 1 });
    });
    // 题字：留白字，天空涂到字边就绕开
    const tp = inv(.6, 2.2, t);
    if (tp > 0) {
      const tx = LAND ? W * .08 : W * .5, ty = LAND ? H * .22 : H * .3, a = LAND ? 'left' : 'center';
      g.save(); g.globalCompositeOperation = 'destination-out';
      g.font = `400 ${Math.round((LAND ? 130 : 140) * u)}px 'ZCOOL KuaiLe'`; g.textAlign = a; g.fillStyle = '#000';
      g.fillText('晚安，小屋', tx, ty); g.restore();
    }
    // 纸齿：颜色里带细小留白
    g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = .6; g.drawImage(s.tooth, 0, 0, W, H); g.restore();
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(B, 0, 0); ctx.restore();
    // 最后几根深色外形线
    ctx.save(); ctx.strokeStyle = '#2D2838'; ctx.globalAlpha = .75; ctx.lineWidth = 2.6 * u; ctx.lineCap = 'round';
    s.outl.forEach((pts, i) => { const p = inv(3.9 + i * .07, 4.2 + i * .07, t); if (p > 0) drawPartial(ctx, pts, p); });
    ctx.restore();
  }
});
