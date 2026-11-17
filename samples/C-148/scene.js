// C-148 街头波普涂鸦：Canvas 2D 把小人存成 4 组关节坐标（头、颈、胯、肘、手、膝、脚），每 8 帧硬切一组；身体是同一条路径先描一道很宽的黑线、再描一道窄些的荧光色线，于是自带等宽粗黑轮廓；全体按节拍整体弹跳，身边短黑线随姿势换一套方向；转场时一个小人放大到满屏，它身体那道彩色线改用下一幕画面做图案，于是身体里装着下一幅画。
// 风格提示词：用街头波普涂鸦风格：纯色背景上只有等宽粗黑线画的小人、狗、心形和电视，没有五官细节，身体周围有短短的放射动作线，所有形象每 8 帧硬切一个姿势地跳舞并跟着节拍整体弹跳，配色是荧光红、黄、绿，转场是一个小人放大、身体里装着下一幅画。
// 题材：手绘与绘画 · 适合：音乐 MV、公益宣传、派对与节日
const POP_POSE = [
  { n: [0, -1.6], h: [0, -2.3], p: [0, 0], le: [-.75, -2.0], lh: [-1.15, -2.7], re: [.75, -2.0], rh: [1.15, -2.7], lk: [-.55, .8], lf: [-.8, 1.6], rk: [.55, .8], rf: [.8, 1.6] },
  { n: [0, -1.6], h: [-.1, -2.3], p: [0, 0], le: [-.85, -1.4], lh: [-1.5, -1.1], re: [.55, -2.2], rh: [.85, -2.95], lk: [-.75, .35], lf: [-.55, 1.1], rk: [.3, .85], rf: [.35, 1.65] },
  { n: [.35, -1.5], h: [.65, -2.1], p: [0, 0], le: [-.55, -1.65], lh: [-1.35, -1.55], re: [1.15, -1.35], rh: [1.8, -1.75], lk: [-.65, .7], lf: [-1.1, 1.5], rk: [.4, .8], rf: [.45, 1.65] },
  { n: [0, -1.3], h: [0, -2.0], p: [0, .2], le: [-.95, -1.2], lh: [-.95, -1.95], re: [.95, -1.2], rh: [.95, -1.95], lk: [-.85, .65], lf: [-.65, 1.65], rk: [.85, .65], rf: [.65, 1.65] }];
scene({
  id: 'C-148', name: '街头波普涂鸦', dur: 5, still: 2.55,
  init() { return { offB: mk(W, H) }; },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, INK = '#111', RED = '#FF2A3D', YEL = '#FFE600', GRN = '#2BE04A', BT = .375;
    const bounce = -Math.abs(Math.sin(t * Math.PI / BT)) * 34 * u, step = f >> 3;
    const stroke2 = (c, U, path, col, lw = .62, cw = .34) => { c.lineCap = c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = lw * U; path(); c.stroke(); c.strokeStyle = col; c.lineWidth = cw * U; path(); c.stroke(); };
    const rays = (c, x, y, r0, r1, n, U, ph) => { c.strokeStyle = INK; c.lineWidth = .13 * U; c.lineCap = 'round'; for (let k = 0; k < n; k++) { const a = (k + (ph % 2) * .5) / n * TAU; c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke(); } };
    const figPath = (c, P) => () => { c.beginPath(); c.moveTo(...P.n); c.lineTo(...P.p); c.moveTo(...P.lh); c.lineTo(...P.le); c.lineTo(...P.n); c.lineTo(...P.re); c.lineTo(...P.rh); c.moveTo(...P.lf); c.lineTo(...P.lk); c.lineTo(...P.p); c.lineTo(...P.rk); c.lineTo(...P.rf); };
    const fig = (c, x, y, sc, pi, col, mir, rayOn = true, colOverride) => {
      const U = 100 * u * sc, P = POP_POSE[pi % 4];
      c.save(); c.translate(x, y); c.scale(mir ? -U : U, U);
      const one = 1 / U * U;   // 在单位坐标里画，线宽按 1 个单位算
      if (rayOn) rays(c, 0, -.8, 2.35, 2.75, 10, 1, pi);
      const fill = colOverride ? colOverride(c) : col;
      stroke2(c, one, figPath(c, P), fill);
      c.fillStyle = INK; c.beginPath(); c.arc(P.h[0], P.h[1], .5, 0, TAU); c.fill();
      c.fillStyle = fill; c.beginPath(); c.arc(P.h[0], P.h[1], .33, 0, TAU); c.fill();
      c.restore();
    };
    const heart = (c, x, y, sc, col, ph) => { const U = 100 * u * sc; c.save(); c.translate(x, y); c.scale(U, U); rays(c, 0, 0, 1.25, 1.65, 12, 1, ph); const hp = () => { c.beginPath(); c.moveTo(0, .75); c.bezierCurveTo(-1.3, -.1, -.65, -1.05, 0, -.45); c.bezierCurveTo(.65, -1.05, 1.3, -.1, 0, .75); c.closePath(); }; hp(); c.fillStyle = col; c.fill(); c.lineWidth = .14; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); c.restore(); };
    const dog = (c, x, y, sc, col, ph) => {
      const U = 100 * u * sc; c.save(); c.translate(x, y); c.scale(U, U);
      const legs = ph % 2 ? [[-.8, .9, -1.05], [.8, .9, 1.05]] : [[-.8, .9, -.6], [.8, .9, .6]];
      stroke2(c, 1, () => { c.beginPath(); c.moveTo(-1.0, 0); c.lineTo(.9, 0); c.moveTo(-1.0, 0); c.lineTo(-1.5, ph % 2 ? -.8 : -.5); legs.forEach(([x0, y1, x1]) => { c.moveTo(x0, 0); c.lineTo(x1, y1); }); c.moveTo(.9, 0); c.lineTo(1.3, -.55); }, col, .62, .36);
      c.fillStyle = INK; c.beginPath(); c.ellipse(1.55, -.75, .55, .42, -.3, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(1.55, -.75, .38, .26, -.3, 0, TAU); c.fill();
      c.strokeStyle = INK; c.lineWidth = .3; c.lineCap = 'round'; c.beginPath(); c.moveTo(1.35, -1.05); c.lineTo(1.2, -1.45); c.stroke();
      if (ph % 2) { c.lineWidth = .12; [[-.35, -.25], [0, -.05], [.3, .2]].forEach(([a, b]) => { c.beginPath(); c.moveTo(2.2, -.75 + b * .6); c.lineTo(2.6, -.75 + a * 1.4); c.stroke(); }); }
      c.restore();
    };
    const tv = (c, x, y, sc, col, ph) => {
      const U = 100 * u * sc; c.save(); c.translate(x, y); c.scale(U, U);
      rays(c, 0, 0, 2.2, 2.6, 14, 1, ph);
      c.strokeStyle = INK; c.lineWidth = .3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-.4, -1.25); c.lineTo(-1, -2.0); c.moveTo(.4, -1.25); c.lineTo(1, -2.0); c.stroke();
      c.fillStyle = INK; rr(c, -1.9, -1.35, 3.8, 2.7, .3); c.fill(); c.fillStyle = col; rr(c, -1.72, -1.17, 3.44, 2.34, .22); c.fill();
      c.fillStyle = INK; rr(c, -1.4, -.92, 2.3, 1.84, .2); c.fill(); c.fillStyle = '#FFFFFF'; rr(c, -1.27, -.79, 2.04, 1.58, .14); c.fill();
      c.fillStyle = INK; c.beginPath(); c.arc(1.3, -.4, .16, 0, TAU); c.arc(1.3, .3, .16, 0, TAU); c.fill();
      c.lineWidth = .22; c.beginPath(); c.moveTo(-1.2, 1.35); c.lineTo(-1.45, 1.8); c.moveTo(1.2, 1.35); c.lineTo(1.45, 1.8); c.stroke();
      c.restore();
      heart(c, x - .25 * U, y, sc * .55, RED, ph + 1);
    };
    // 两幕：A 黄底两人一狗一颗心，B 红底一台电视和两人
    const sceneA = (c) => {
      c.fillStyle = YEL; c.fillRect(0, 0, W, H);
      const gy = LAND ? H * .62 : H * .56, sc = LAND ? 1.4 : 1.45;
      heart(c, W * (LAND ? .83 : .5), (LAND ? H * .24 : H * .16) + bounce * .5, LAND ? 1.15 : 1.3, RED, step);
      fig(c, W * (LAND ? .2 : .26), gy + bounce, sc, step, RED, false);
      dog(c, W * (LAND ? .8 : .42), (LAND ? H * .78 : H * .86) + bounce, LAND ? 1.05 : 1.3, '#FFFFFF', step);
      return { x: W * (LAND ? .5 : .74), y: gy + bounce, sc };
    };
    const sceneB = (c) => {
      c.fillStyle = RED; c.fillRect(0, 0, W, H);
      const gy = LAND ? H * .66 : H * .74, sc = LAND ? 1.05 : 1.4;
      tv(c, W * .5, (LAND ? H * .45 : H * .3) + bounce * .6, LAND ? 1.15 : 1.6, YEL, step);
      fig(c, W * (LAND ? .17 : .25), gy + bounce, sc, step + 1, GRN, false);
      fig(c, W * (LAND ? .83 : .75), gy + bounce, sc, step + 3, YEL, true);
    };
    const T0 = 2.35, T1 = 3.05;
    if (t < T0) { const p = sceneA(ctx); fig(ctx, p.x, p.y, p.sc, step + 2, GRN, true); }
    else if (t < T1) {
      const k = eInCubic(clamp((t - T0) / (T1 - T0)));
      const p = sceneA(ctx);
      const g = s.offB.getContext('2d'); sceneB(g);
      const z = Math.exp(Math.log(16) * k), U = 100 * u * p.sc;
      const tx = lerp(p.x, W / 2, k), ty = lerp(p.y - .8 * U, H / 2, k);
      ctx.save(); ctx.translate(tx, ty); ctx.scale(z, z); ctx.translate(-p.x, -(p.y - .8 * U));
      fig(ctx, p.x, p.y, p.sc, 1, GRN, true, k < .3, (c) => { const pat = c.createPattern(s.offB, 'no-repeat'); pat.setTransform(c.getTransform().inverse()); return pat; });
      ctx.restore();
    } else sceneB(ctx);
  }
});
