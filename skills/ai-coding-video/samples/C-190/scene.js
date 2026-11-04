// C-190 草间弥生式无限波点：墙、地板、人和桌子各是一块剪裁区，区内按大小两套错位网格铺圆点，每个点用哈希值略微压扁、转一个角度，像手画；所有点的半径乘同一道从画面中心向外扩散的正弦波，整个房间一起胀缩；窗里是三维网格上的彩色小灯，按 1/z 投影并不断朝镜头移近；最后一圈波浪形的边界从人身上向外扩大，圈内只剩同一种红底白点，物体轮廓就此消失。
// 风格提示词：用草间弥生式无限波点风格：墙面、地板、人物和物件全部铺满大小两套错位排列、手画般略带椭圆的圆点，红底白点、黄底黑点为主，所有点的大小随一道从画面中心向外扩散的波一起胀缩，像整个空间在呼吸；窗外是一格格规则排列、向镜头无限飞来的彩色小灯，像镜屋里的无尽反射；结尾全屏被同一种波点吞没、物体轮廓消融在点阵里。
// 题材：手绘与绘画 · 适合：艺术展宣传、品牌联名、音乐可视化、关于“无限”和“重复”的主题
scene({
  id: 'C-190', name: '草间弥生式无限波点', dur: 5, still: 3.0,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    const hz = LAND ? H * .62 : H * .56;                                   // 墙脚线
    const win = LAND ? [W * .3, H * .1, W * .26, H * .34] : [W * .18, H * .08, W * .5, H * .26];
    const fig = LAND ? { x: W * .7, y: H * .93, k: u * 1.05 } : { x: W * .62, y: H * .88, k: u * 1.25 };
    const tab = LAND ? { x: W * .36, y: H * .84, k: u } : { x: W * .3, y: H * .8, k: u * 1.05 };
    // 墙面点阵：大点网格 + 错开四分之一格的小点网格
    const grid = (x0, y0, x1, y1, S, r0, r1, seed) => {
      const pts = []; let i = 0;
      for (let y = y0 - S; y < y1 + S; y += S * .87) for (let x = x0 - S + ((Math.round(y / (S * .87)) & 1) ? S / 2 : 0); x < x1 + S; x += S) {
        pts.push([x, y, r0, hash1(seed + i), hash1(seed + i + 9e5)]); pts.push([x + S / 2, y + S * .29, r1, hash1(seed + i + 3e5), hash1(seed + i + 7e5)]); i++;
      }
      return pts;
    };
    const wall = grid(0, 0, W, hz, 92 * u, 22 * u, 8 * u, 1);
    // 地板点：透视网格，越近越大越扁
    const floor = []; const camH = 1, f = H * .55;
    for (let zi = 0; zi < 60; zi++) {
      const Z = .75 * 1.12 ** zi; if (Z > 14) break;
      const y = hz + camH * f / Z / 2.2 * 1.0; if (y > H + 40) continue;
      for (let xi = -40; xi <= 40; xi++) {
        const X = (xi + (zi & 1) * .5) * .62, x = W / 2 + X * f / Z;
        if (x < -60 || x > W + 60) continue;
        if (36 * u / Z < 1.5 * u) continue; floor.push([x, y, 36 * u / Z, hash1(zi * 131 + xi), hash1(zi * 71 + xi + 5)]);
      }
    }
    const glob = grid(0, 0, W, H, 84 * u, 24 * u, 9 * u, 5);
    const lights = []; const LR = mulberry32(190), COLS = ['#ff5aa5', '#ffd23f', '#5ce1e6', '#9b7bff', '#7dff8a', '#ff8c42'];
    for (let i = -6; i <= 6; i++) for (let j = -4; j <= 4; j++) for (let z = 0; z < 8; z++) lights.push([i, j, z, COLS[Math.floor(LR() * COLS.length)]]);
    return { u, hz, win, fig, tab, wall, floor, glob, lights, tmp: mk(W, H) };
  },
  draw(ctx, t, s, f) {
    const ctx0 = ctx, { u, hz } = s, CX = W / 2, CY = H * .45;
    const amp = .22 + .2 * smooth(0, 3, t);
    const wave = (x, y) => 1 + amp * Math.sin(Math.hypot(x - CX, y - CY) / (95 * u) - t * 5.5);
    const dots = (pts, col, scale = 1, sq = 1, ctx = ctx0) => {
      ctx.fillStyle = col; ctx.beginPath();
      for (const [x, y, r, h1, h2] of pts) {
        const rr = r * scale * wave(x, y); if (rr < .4) continue;
        const rx = rr * (1 + .14 * (h1 - .5)), ry = rr * (1 + .14 * (h2 - .5)) * sq;
        ctx.moveTo(x + rx, y); ctx.ellipse(x, y, rx, ry, sq < 1 ? 0 : h1 * 3, 0, TAU);
      }
      ctx.fill();
    };
    // 墙
    ctx.fillStyle = '#e0242c'; ctx.fillRect(0, 0, W, hz);
    dots(s.wall, '#fff7ee');
    // 窗：镜屋里飞来的彩灯
    const [wx, wy, ww, wh] = s.win;
    ctx.fillStyle = '#fff7ee'; ctx.fillRect(wx - 14 * u, wy - 14 * u, ww + 28 * u, wh + 28 * u);
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    ctx.fillStyle = '#05040c'; ctx.fillRect(wx, wy, ww, wh);
    const lcx = wx + ww / 2, lcy = wy + wh / 2, fl = ww * .45, spd = 1.6, D = 8;
    const L = s.lights.map(([i, j, z, c]) => [i, j, ((z - t * spd) % D + D) % D + .35, c]).sort((a, b) => b[2] - a[2]);
    for (const [i, j, z, c] of L) {
      const x = lcx + i * .9 * fl / z, y = lcy + j * .9 * fl / z, r = 7 * u / z * 2.2; if (x < wx - r || x > wx + ww + r || y < wy - r || y > wy + wh + r) continue;
      const a = clamp(1 - z / D) * clamp(z * 2); ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.globalAlpha = a * .25; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
    // 地板
    ctx.fillStyle = '#c9171f'; ctx.fillRect(0, hz, W, H - hz);
    dots(s.floor, '#fff7ee', 1, .45);
    // 桌子（黄底黑点）
    const tb = s.tab, tk = tb.k;
    const shadow = (x, y, rx) => { ctx.fillStyle = 'rgba(80,0,10,.35)'; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * .18, 0, 0, TAU); ctx.fill(); };
    shadow(tb.x + 20 * tk, tb.y, 190 * tk);
    const tp = new Path2D(), TP = [tp]; tp.ellipse(tb.x, tb.y - 230 * tk, 200 * tk, 46 * tk, 0, 0, TAU);
    tp.rect(tb.x - 30 * tk, tb.y - 230 * tk, 60 * tk, 220 * tk); tp.ellipse(tb.x, tb.y - 8 * tk, 110 * tk, 24 * tk, 0, 0, TAU);
    tp.rect(tb.x - 200 * tk, tb.y - 230 * tk, 400 * tk, 24 * tk); tp.ellipse(tb.x, tb.y - 206 * tk, 200 * tk, 46 * tk, 0, 0, Math.PI);
    // 一个物体＝几块形状的并集：先在离屏画布上填成剪影，再只在剪影里涂底色和点
    const fillSurf = (ps, base, dotCol, S, r0, r1, seed) => {
      const m = s.tmp.getContext('2d'); m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, W, H); m.fillStyle = '#000';
      for (const p of ps) m.fill(p);
      m.globalCompositeOperation = 'source-atop'; m.fillStyle = base; m.fillRect(0, 0, W, H);
      const b = s['b' + seed] || (s['b' + seed] = (() => { const pts = []; let i = 0; for (let y = -S; y < H + S; y += S * .87) for (let x = ((Math.round(y / (S * .87)) & 1) ? S / 2 : 0) - S; x < W + S; x += S) { pts.push([x, y, r0, hash1(seed + i), hash1(seed + i + 1e5)]); pts.push([x + S / 2, y + S * .29, r1, hash1(seed + i + 2e5), hash1(seed + i + 4e5)]); i++; } return pts; })());
      dots(b, dotCol, 1, 1, m); ctx.drawImage(s.tmp, 0, 0);
    };
    fillSurf(TP, '#ffd400', '#111', 54 * tk, 13 * tk, 5 * tk, 31);
    // 人（黄底黑点的连衣裙和帽子，整个人都铺满点）
    const g = s.fig, k = g.k, sw = Math.sin(t * 1.6) * 6 * k;
    shadow(g.x + 30 * k, g.y, 150 * k);
    const FP = [], np = () => { const p = new Path2D(); FP.push(p); return p; }; let fp = np();
    fp.arc(g.x + sw * .3, g.y - 560 * k, 58 * k, 0, TAU);                                  // 头
    fp.rect(g.x - 18 * k + sw * .2, g.y - 510 * k, 36 * k, 40 * k);                        // 脖子
    fp.moveTo(g.x - 70 * k, g.y - 470 * k); fp.lineTo(g.x + 70 * k, g.y - 470 * k); fp.quadraticCurveTo(g.x + 90 * k, g.y - 300 * k, g.x + 170 * k + sw, g.y - 90 * k);
    fp.quadraticCurveTo(g.x, g.y - 60 * k, g.x - 170 * k + sw, g.y - 90 * k); fp.quadraticCurveTo(g.x - 90 * k, g.y - 300 * k, g.x - 70 * k, g.y - 470 * k); fp.closePath();   // 喇叭裙
    for (const sx of [-1, 1]) { fp = np(); fp.moveTo(g.x + sx * 66 * k, g.y - 465 * k); fp.quadraticCurveTo(g.x + sx * 130 * k, g.y - 380 * k, g.x + sx * 118 * k, g.y - 270 * k + sw * sx); fp.lineTo(g.x + sx * 92 * k, g.y - 268 * k + sw * sx); fp.quadraticCurveTo(g.x + sx * 100 * k, g.y - 380 * k, g.x + sx * 50 * k, g.y - 440 * k); fp.closePath(); }   // 手臂
    fp = np(); for (const sx of [-1, 1]) fp.rect(g.x + sx * 45 * k - 14 * k, g.y - 95 * k, 28 * k, 95 * k);   // 腿
    fp = np(); fp.ellipse(g.x + sw * .3, g.y - 600 * k, 92 * k, 22 * k, 0, 0, TAU); fp = np(); fp.ellipse(g.x + sw * .3, g.y - 615 * k, 50 * k, 40 * k, 0, Math.PI, TAU);   // 宽檐帽
    fillSurf(FP, '#ffd400', '#111', 40 * k, 10 * k, 4 * k, 77);
    // 结尾：一圈波浪边界从人身上向外扩大，圈内只剩同一种红底白点
    const e = eInOutCubic(inv(3.3, 4.7, t));
    if (e > 0) {
      const ex = g.x, ey = g.y - 380 * k, Rf = e * LONG * 1.25, cp = new Path2D();
      for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU, r = Rf * (1 + .07 * Math.sin(7 * a + t * 4) + .04 * Math.sin(13 * a - t * 3)); i ? cp.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r) : cp.moveTo(ex + r, ey); }
      ctx.save(); ctx.clip(cp); ctx.fillStyle = '#e0242c'; ctx.fillRect(0, 0, W, H); dots(s.glob, '#fff7ee'); ctx.restore();
      // 边界上撒一圈白点，让界线也化成点
      ctx.fillStyle = '#fff7ee'; ctx.beginPath();
      for (let i = 0; i < 90; i++) { const a = i / 90 * TAU + hash1(i) * .05, r = Rf * (1 + .07 * Math.sin(7 * a + t * 4) + .04 * Math.sin(13 * a - t * 3)), rr = (8 + 14 * hash1(i + 50)) * u * wave(ex, ey); const x = ex + Math.cos(a) * r, y = ey + Math.sin(a) * r; ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, TAU); }
      ctx.fill();
    }
    grain(ctx, f, .04);
  }
});
