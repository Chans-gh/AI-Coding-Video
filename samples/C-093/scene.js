// C-093 点刻：鹦鹉螺的外形用对数螺线算出，明暗（受光、条纹、螺口的暗处）画成明暗图，lib 的 stipple 在抖动网格里按暗度取点，所有点一样大、先点最暗处再向亮处扩散，点只出现不渐入；没有一根线。
// 风格提示词：用点刻风格：一支 0.25 mm 针管笔在光滑白卡纸上一个点一个点地点出来，所有点一样大，明暗只由点的疏密决定，没有线、没有排线、没有轮廓，边缘就是点密度变化的地方，先点最暗的部分再向亮处扩散，点只出现、不渐入、不移动。
// 题材：手绘与绘画 · 适合：博物与自然标本、科普、慢节奏纪录片
scene({
  id: 'C-093', name: '点刻', dur: 5, still: 4.6,
  fonts: ["700 40px 'Noto Serif SC'", "italic 400 40px 'Playfair Display'"],
  text: '鹦鹉螺标本第号',
  init() {
    const u = SHORT / 1080;
    // 构图：横屏贝壳在右、标签在左下；竖屏贝壳在上、标签在下
    const R0 = (LAND ? 400 : 530) * u, X0 = LAND ? W * .66 : W * .5, Y0 = LAND ? H * .47 : H * .38;
    const b = Math.log(3.2) / TAU, sp = th => R0 * Math.exp(b * (th - TAU));                 // 对数螺线：转一圈放大 3.2 倍
    const raw = th => [Math.cos(th + 2.3) * sp(th), Math.sin(th + 2.3) * sp(th)];
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (let th = 0; th <= TAU; th += .05) { const [x, y] = raw(th); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const cx = X0 - (x0 + x1) / 2, cy = Y0 - (y0 + y1) / 2;                                   // 螺线的中心不在外形中间：按外框挪正
    const pt = th => [cx + raw(th)[0], cy + raw(th)[1]];
    const outer = []; for (let th = 0; th <= TAU; th += .02) outer.push(pt(th));
    const inner = []; for (let th = -TAU; th <= 0; th += .02) inner.push(pt(th));
    const T = toneMap(g => {
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.filter = `blur(${26 * u}px)`; g.fillStyle = 'rgba(0,0,0,.17)';                          // 落在纸上的影子
      g.beginPath(); g.ellipse(X0 + 40 * u, Y0 + R0 * .78, R0 * .8, R0 * .1, 0, 0, TAU); g.fill(); g.filter = 'none';
      g.save(); g.beginPath(); outer.forEach((q, i) => g[i ? 'lineTo' : 'moveTo'](...q)); g.closePath(); g.clip();
      const lit = g.createRadialGradient(cx - R0 * .4, cy - R0 * .45, R0 * .05, cx, cy, R0 * 1.15);  // 光从左上
      lit.addColorStop(0, '#fafafa'); lit.addColorStop(.45, '#c8c8c8'); lit.addColorStop(.8, '#7a7a7a'); lit.addColorStop(1, '#3a3a3a');
      g.fillStyle = lit; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'multiply';                                                  // 火焰状条纹：从脐部向外弯出去
      for (let i = 0; i < 13; i++) {
        const a0 = i / 13 * TAU * .92; g.beginPath();
        for (let j = 0; j <= 30; j++) { const s = j / 30, th = a0 + s * .9, r = sp(th) * lerp(.3, 1.05, s), w = (1 - s) * .1 + .05;
          g.lineTo(cx + Math.cos(th + 2.3 - w) * r, cy + Math.sin(th + 2.3 - w) * r); }
        for (let j = 30; j >= 0; j--) { const s = j / 30, th = a0 + s * .9, r = sp(th) * lerp(.3, 1.05, s), w = (1 - s) * .1 + .05;
          g.lineTo(cx + Math.cos(th + 2.3 + w) * r, cy + Math.sin(th + 2.3 + w) * r); }
        g.fillStyle = lerp(0, 1, i / 13) > .75 ? '#bbb' : '#444'; g.fill();
      }
      g.globalCompositeOperation = 'source-over';
      const um = g.createRadialGradient(cx, cy, 0, cx, cy, R0 * .3); um.addColorStop(0, '#111'); um.addColorStop(1, 'rgba(0,0,0,0)');   // 脐部最暗
      g.fillStyle = um; g.fillRect(0, 0, W, H);
      g.restore();
      const ap = pt(TAU), ap2 = pt(0);                                                          // 螺口：深色的开口
      g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse((ap[0] + ap2[0]) / 2, (ap[1] + ap2[1]) / 2, Math.hypot(ap[0] - ap2[0], ap[1] - ap2[1]) / 2, R0 * .12, Math.atan2(ap[1] - ap2[1], ap[0] - ap2[0]), 0, TAU); g.fill();
      g.strokeStyle = '#555'; g.lineWidth = 16 * u; g.beginPath(); inner.slice(Math.floor(inner.length * .55)).forEach((q, i) => g[i ? 'lineTo' : 'moveTo'](...q)); g.stroke();   // 内圈缝合线：一道暗带
    }, { blur: 3 * u, res: 3 });
    const D = stipple(T, { cell: 3.4 * u, gamma: 1.4, thr: .96, seed: 9 });
    return { u, D };
  },
  draw(ctx, t, s) {
    const { u } = s;
    ctx.fillStyle = '#FBFAF6'; ctx.fillRect(0, 0, W, H);
    // 点一点点出现：时间均匀分到每个点，先暗后亮
    drawDots(ctx, s.D, Math.pow(inv(.1, 4.9, t), .8), 1.55 * u, '#16140F');
    // 标本标签：印刷字，不是画出来的
    const lp = smooth(3.6, 4.3, t);
    if (lp > 0) {
      ctx.save(); ctx.globalAlpha = lp; ctx.fillStyle = '#16140F';
      const lx = LAND ? W * .1 : W * .5, ly = LAND ? H * .72 : H * .8, a = LAND ? 'left' : 'center';
      ctx.textAlign = a;
      ctx.font = `italic 400 ${Math.round(58 * u)}px 'Playfair Display'`; ctx.fillText('Nautilus pompilius', lx, ly);
      ctx.font = `700 ${Math.round(44 * u)}px 'Noto Serif SC'`; ctx.fillText('鹦鹉螺 · 标本第 12 号', lx, ly + 70 * u);
      ctx.restore();
    }
  }
});
