// C-006 儿童涂鸦：Canvas 2D 每 0.25 秒换一个随机种子（一秒 4 张），所有线条按种子重新抖一遍，像一张张重画；蜡笔线是同一条折线错开画三遍、带断续，涂色是出界的来回折线，水彩笔块是半透明的叠色；太阳、小人、小狗和鸟都只在两三个姿势之间整张替换。
// 风格提示词：用儿童涂鸦风格：像 6 岁孩子画的，线条稚拙、比例不准、颜色涂出界，蜡笔和水彩笔混用，动作是一格一格的简单替换，不要任何专业透视和光影。
// 题材：手绘与绘画 · 适合：亲子、MV；可附孩子的原画让它照着动起来
scene({
  id: 'C-006', name: '儿童涂鸦', dur: 4, still: 2.6,
  fonts: ["400 80px 'ZCOOL KuaiLe'"],
  text: '我的家爸爸妈妈我小狗',
  init() { return { paper: makePaper('#FBF8F0', { seed: 6, blot: 4, grain: 10, fiber: .2 }) }; },
  draw(ctx, t, s) {
    const u = SHORT / 1080, fr = Math.floor(t * 4), R = mulberry32(fr * 977 + 6);
    ctx.drawImage(s.paper, 0, 0, W, H);
    const j = (a = 6) => (R() - .5) * 2 * a * u;
    // 蜡笔线：同一条线错开画几遍，偶尔断开
    const crayon = (pts, col, w = 10) => {
      ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let pass = 0; pass < 3; pass++) {
        ctx.globalAlpha = .55; ctx.lineWidth = (w - pass * 2) * u; ctx.beginPath();
        pts.forEach(([x, y], i) => { const X = x + j(3), Y = y + j(3); if (i && R() < .06) ctx.moveTo(X, Y); else i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    // 涂色：在框里来回折线，故意涂出界
    const scribble = (x, y, w, h, col, dens = 18) => {
      ctx.strokeStyle = col; ctx.lineWidth = 9 * u; ctx.globalAlpha = .6; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let k = 0; k <= dens; k++) { const yy = y + k / dens * h; ctx.lineTo(x - 15 * u + j(14), yy + j(4)); ctx.lineTo(x + w + 15 * u + j(14), yy + h / dens * .5 + j(4)); }
      ctx.stroke(); ctx.globalAlpha = 1;
    };
    const blob = (x, y, r, col) => { ctx.fillStyle = col; ctx.globalAlpha = .45; ctx.beginPath(); for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, rr_ = r * (1 + (R() - .5) * .25); ctx.lineTo(x + Math.cos(a) * rr_, y + Math.sin(a) * rr_); } ctx.fill(); ctx.globalAlpha = 1; };
    const circ = (x, y, r, n = 18) => Array.from({ length: n + 2 }, (_, k) => [x + Math.cos(k / n * TAU) * r * (1 + (R() - .5) * .12), y + Math.sin(k / n * TAU) * r * (1 + (R() - .5) * .12)]);
    // 地面：一条歪绿线 + 草
    const gy = LAND ? H * .78 : H * .6, fy = LAND ? gy : H * .88;   // fy：竖屏一家人站在前景草地上
    scribble(0, gy, W, H - gy, '#7BC86C', 26);
    crayon([[0, gy + 10 * u], [W * .3, gy - 12 * u], [W * .6, gy + 8 * u], [W, gy - 6 * u]], '#3A9A3A', 12);
    // 太阳：一角，带脸，光线长短交替（两张图替换）
    const sx = LAND ? W * .86 : W * .8, sy = LAND ? H * .18 : H * .12, sr = 110 * u;
    blob(sx, sy, sr * 1.05, '#FFD23F');
    crayon(circ(sx, sy, sr), '#F59B00', 12);
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, L = (fr + k) % 2 ? 80 : 50; crayon([[sx + Math.cos(a) * sr * 1.2, sy + Math.sin(a) * sr * 1.2], [sx + Math.cos(a) * (sr * 1.2 + L * u), sy + Math.sin(a) * (sr * 1.2 + L * u)]], '#F59B00', 9); }
    crayon([[sx - 35 * u, sy - 15 * u], [sx - 30 * u, sy - 20 * u]], '#333', 12); crayon([[sx + 30 * u, sy - 15 * u], [sx + 35 * u, sy - 20 * u]], '#333', 12);
    crayon(Array.from({ length: 8 }, (_, k) => [sx - 40 * u + k * 11 * u, sy + 25 * u + Math.sin(k / 7 * Math.PI) * 18 * u]), '#E5484D', 8);
    // 房子：歪方块 + 三角屋顶 + 门窗
    const hx = LAND ? W * .14 : W * .1, hw = (LAND ? 380 : 520) * u, hh = (LAND ? 300 : 380) * u, hy = gy - hh;
    scribble(hx, hy, hw, hh, '#FF8FA3', 14);
    crayon([[hx, hy + 6 * u], [hx + hw, hy - 8 * u], [hx + hw + 10 * u, gy], [hx - 6 * u, gy + 4 * u], [hx, hy + 6 * u]], '#C2185B', 11);
    scribble(hx - 20 * u, hy - 200 * u, hw + 40 * u, 160 * u, '#E5484D', 8);
    crayon([[hx - 40 * u, hy], [hx + hw * .45, hy - 230 * u], [hx + hw + 40 * u, hy - 10 * u], [hx - 40 * u, hy]], '#9B1C1C', 12);
    blob(hx + hw * .72, hy + hh * .35, 48 * u, '#6EC6FF');
    crayon([[hx + hw * .6, hy + hh * .22], [hx + hw * .86, hy + hh * .2], [hx + hw * .85, hy + hh * .5], [hx + hw * .6, hy + hh * .5], [hx + hw * .6, hy + hh * .22]], '#1565C0', 8);
    crayon([[hx + hw * .2, gy], [hx + hw * .2, hy + hh * .45], [hx + hw * .42, hy + hh * .45], [hx + hw * .42, gy]], '#6D4C41', 10);
    // 一家人：大头、细线身子，手臂在两个姿势间替换
    const K = LAND ? 1 : 1.3, fam = [[LAND ? W * .45 : W * .17, 1.15 * K, '#3F51B5', '爸爸'], [LAND ? W * .56 : W * .43, 1.0 * K, '#E91E63', '妈妈'], [LAND ? W * .65 : W * .66, .7 * K, '#FF9800', '我']];
    fam.forEach(([x, sc, col, name], i) => {
      const up = (fr + i) % 2, hr = 60 * u * sc, by = fy - 260 * u * sc, jump = i === 2 && up ? -40 * u : 0;
      const y0 = by + jump;
      blob(x, y0, hr, '#FFE0B2'); crayon(circ(x, y0, hr), '#5D4037', 9);
      crayon([[x - hr * .35, y0 - hr * .1], [x - hr * .3, y0 - hr * .15]], '#222', 10); crayon([[x + hr * .3, y0 - hr * .1], [x + hr * .35, y0 - hr * .15]], '#222', 10);
      crayon([[x - hr * .3, y0 + hr * .3], [x, y0 + hr * .5], [x + hr * .35, y0 + hr * .25]], '#E5484D', 7);
      // 身子：三角裙或方块衣服
      scribble(x - 50 * u * sc, y0 + hr, 100 * u * sc, 120 * u * sc, col, 7);
      crayon([[x, y0 + hr], [x - 55 * u * sc, y0 + hr + 130 * u * sc], [x + 55 * u * sc, y0 + hr + 130 * u * sc], [x, y0 + hr]], col, 9);
      crayon([[x - 25 * u * sc, y0 + hr + 130 * u * sc], [x - 30 * u * sc, fy + jump]], '#333', 8); crayon([[x + 25 * u * sc, y0 + hr + 130 * u * sc], [x + 32 * u * sc, fy + jump]], '#333', 8);
      const ay = up ? -90 : 40;
      crayon([[x - 20 * u * sc, y0 + hr + 30 * u * sc], [x - 110 * u * sc, y0 + hr + ay * u * sc]], '#333', 8);
      crayon([[x + 20 * u * sc, y0 + hr + 30 * u * sc], [x + 110 * u * sc, y0 + hr + ay * u * sc]], '#333', 8);
      ctx.fillStyle = col; ctx.font = `400 ${Math.round(40 * u)}px 'ZCOOL KuaiLe'`; ctx.textAlign = 'center';
      ctx.fillText(name, x + j(3), y0 - hr - 20 * u);
    });
    // 小狗：尾巴两张图替换
    const dx = LAND ? W * .78 : W * .84, dy = fy - 60 * u;
    blob(dx, dy, 60 * u, '#BCAAA4');
    crayon([[dx - 70 * u, dy - 20 * u], [dx + 60 * u, dy - 25 * u], [dx + 65 * u, dy + 25 * u], [dx - 65 * u, dy + 25 * u], [dx - 70 * u, dy - 20 * u]], '#6D4C41', 9);
    crayon(circ(dx + 85 * u, dy - 40 * u, 38 * u), '#6D4C41', 9);
    crayon([[dx + 95 * u, dy - 48 * u], [dx + 98 * u, dy - 52 * u]], '#222', 10);
    [-50, -15, 20, 50].forEach(o => crayon([[dx + o * u, dy + 25 * u], [dx + o * u, fy + 10 * u]], '#6D4C41', 8));
    crayon(fr % 2 ? [[dx - 70 * u, dy - 10 * u], [dx - 120 * u, dy - 70 * u]] : [[dx - 70 * u, dy - 10 * u], [dx - 130 * u, dy - 20 * u]], '#6D4C41', 9);
    // 鸟：两张 V 形替换
    for (let k = 0; k < 3; k++) {
      const bx = ((t * 120 * u + k * 260 * u) % (W + 200 * u)) - 100 * u, by = (LAND ? 160 : 380) * u + k * 50 * u, fl = (fr + k) % 2 ? 30 : -10;
      crayon([[bx - 40 * u, by - fl * u], [bx, by], [bx + 40 * u, by - fl * u]], '#333', 8);
    }
    // 标题：歪歪扭扭的字
    ctx.font = `400 ${Math.round((LAND ? 120 : 130) * u)}px 'ZCOOL KuaiLe'`; ctx.textAlign = 'left';
    [...'我的家'].forEach((c, k) => { ctx.save(); ctx.translate((LAND ? 90 : 80) * u + k * 140 * u + j(4), (LAND ? 170 : 260) * u + (k % 2 ? 20 : -10) * u + j(4)); ctx.rotate((R() - .5) * .3); ctx.fillStyle = ['#E5484D', '#1E88E5', '#43A047'][k]; ctx.fillText(c, 0, 0); ctx.restore(); });
  }
});
