// C-147 波普艺术：Canvas 2D 用粗黑描边加规则大网点（裁进形状里的圆点阵）画一张原创漫画头像，只用纯黄、纯红、纯蓝和黑白；按鼓点硬切：思考泡、占半个画面的拟声字、一道闪电劈开画面后整帧网点化（先把上一镜画到离屏画布，再用它做图案填一阵圆点），最后四宫格里同一张头像每拍换一套配色。
// 风格提示词：用波普艺术风格：粗黑描边的漫画式人物，皮肤和背景是规则的大号网点，只用纯黄、纯红、纯蓝和黑白，思考泡和拟声字放大到占半个画面，同一张头像在四宫格里不断换配色，换场时一道闪电劈开画面并整体网点化，节奏跟着鼓点硬切。
// 题材：印刷、版画与装饰 · 适合：消费与流行文化、广告片、喜剧短片
scene({
  id: 'C-147', name: '波普艺术', dur: 4, still: 2.6,
  text: '它到底在哪叮找到了！？',
  fonts: ["900 40px 'Noto Sans SC'"],
  init() { return { off: mk(W, H) }; },
  draw(ctx, t, s) {
    const u = SHORT / 1080, Y = '#FFD400', RD = '#E3242B', BL = '#1F5FBF', K = '#111', WH = '#FFFFFF';
    const dots = (g, clip, col, sp, r) => { g.save(); g.beginPath(); clip(); g.clip(); g.fillStyle = col; g.beginPath();
      for (let y = 0, j = 0; y < H + sp; y += sp * .87, j++) for (let x = (j % 2) * sp / 2; x < W + sp; x += sp) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); } g.fill(); g.restore(); };
    const ink = (g, lw, fill) => { if (fill) { g.fillStyle = fill; g.fill(); } g.lineWidth = lw; g.strokeStyle = K; g.lineJoin = 'round'; g.stroke(); };
    // 原创漫画头像：短发、大眼、红唇、一滴泪
    const face = (g, x, y, R, P) => {
      const lw = R * .045;
      g.beginPath(); g.ellipse(x, y - .05 * R, 1.2 * R, 1.25 * R, 0, Math.PI * .9, Math.PI * 2.1); g.lineTo(x + 1.15 * R, y + .9 * R); g.lineTo(x - 1.15 * R, y + .9 * R); g.closePath(); ink(g, lw, K);
      g.beginPath(); g.ellipse(x, y + .1 * R, .82 * R, 1.02 * R, 0, 0, TAU); ink(g, lw, P.skin);
      dots(g, () => g.ellipse(x, y + .1 * R, .82 * R, 1.02 * R, 0, 0, TAU), P.dot, R * .09, R * .022);
      g.beginPath(); g.moveTo(x - .95 * R, y - .1 * R); g.quadraticCurveTo(x - .9 * R, y - 1.15 * R, x, y - 1.05 * R); g.quadraticCurveTo(x + .95 * R, y - 1.1 * R, x + .95 * R, y);
      g.quadraticCurveTo(x + .6 * R, y - .5 * R, x + .1 * R, y - .45 * R); g.quadraticCurveTo(x - .4 * R, y - .55 * R, x - .95 * R, y - .1 * R); ink(g, lw, K);
      g.strokeStyle = P.hl; g.lineWidth = R * .06; g.lineCap = 'round'; [[-.5, -.85, -.1, -.95], [.15, -.9, .55, -.75]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(x + a * R, y + b * R); g.quadraticCurveTo(x + (a + c) / 2 * R, y + (b + d) / 2 * R - .08 * R, x + c * R, y + d * R); g.stroke(); });
      [-1, 1].forEach(sd => {
        const ex = x + sd * .34 * R, ey = y + .05 * R;
        g.beginPath(); g.moveTo(ex - .2 * R, ey); g.quadraticCurveTo(ex, ey - .17 * R, ex + .2 * R, ey); g.quadraticCurveTo(ex, ey + .12 * R, ex - .2 * R, ey); ink(g, lw * .8, WH);
        g.beginPath(); g.arc(ex, ey - .01 * R, .085 * R, 0, TAU); ink(g, lw * .6, P.hl); g.beginPath(); g.arc(ex + .03 * R, ey - .04 * R, .025 * R, 0, TAU); g.fillStyle = WH; g.fill();
        g.lineWidth = lw * .8; g.strokeStyle = K; for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + sd * (.3 + i * .25); g.beginPath(); g.moveTo(ex + Math.cos(a) * .17 * R * sd * sd, ey - .08 * R); g.lineTo(ex + sd * (.08 + i * .07) * R, ey - .2 * R - (i === 3 ? 0 : .02 * R)); g.stroke(); }
        g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(ex - .2 * R, ey - .28 * R); g.quadraticCurveTo(ex, ey - .36 * R, ex + .2 * R, ey - .27 * R); g.stroke();
      });
      g.lineWidth = lw * .8; g.beginPath(); g.moveTo(x + .02 * R, y + .2 * R); g.lineTo(x - .05 * R, y + .38 * R); g.lineTo(x + .05 * R, y + .4 * R); g.stroke();
      g.beginPath(); g.moveTo(x - .22 * R, y + .62 * R); g.quadraticCurveTo(x - .1 * R, y + .52 * R, x, y + .57 * R); g.quadraticCurveTo(x + .1 * R, y + .52 * R, x + .22 * R, y + .62 * R); g.quadraticCurveTo(x, y + .78 * R, x - .22 * R, y + .62 * R); ink(g, lw * .8, P.lip);
      g.beginPath(); g.moveTo(x + .5 * R, y + .2 * R); g.quadraticCurveTo(x + .44 * R, y + .36 * R, x + .5 * R, y + .4 * R); g.quadraticCurveTo(x + .56 * R, y + .36 * R, x + .5 * R, y + .2 * R); ink(g, lw * .6, WH);
    };
    const P0 = { bg: Y, bgd: RD, skin: WH, dot: RD, hl: BL, lip: RD };
    const word = (g, txt, x, y, sz, fill) => { g.font = `900 ${sz}px 'Noto Sans SC'`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.fillStyle = K; g.fillText(txt, x + sz * .06, y + sz * .06); g.lineWidth = sz * .1; g.strokeStyle = K; g.strokeText(txt, x, y); g.fillStyle = fill; g.fillText(txt, x, y); g.textBaseline = 'alphabetic'; };
    const shotA = g => {
      g.fillStyle = Y; g.fillRect(0, 0, W, H); dots(g, () => g.rect(0, 0, W, H), RD, 46 * u, 9 * u);
      const hx = LAND ? W * .34 : W * .5, hy = LAND ? H * .58 : H * .64, R = LAND ? H * .33 : W * .36;
      face(g, hx, hy, R, P0);
      const bx = LAND ? W * .74 : W * .5, by = LAND ? H * .3 : H * .2, bw = LAND ? 440 * u : 420 * u, bh = 170 * u;
      [[.55, .9, .05], [.4, .6, .08]].forEach(([fx, fy, r]) => { g.beginPath(); g.arc(lerp(hx, bx, fx), lerp(hy - R, by, fy) + (LAND ? 0 : 120 * u), r * SHORT, 0, TAU); ink(g, 6 * u, WH); });
      g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; g.ellipse(bx + Math.cos(a) * bw * .78, by + Math.sin(a) * bh * .7, bw * .32, bh * .45, 0, 0, TAU); } g.fillStyle = K; g.save(); g.lineWidth = 12 * u; g.strokeStyle = K; g.stroke(); g.restore();
      g.fillStyle = WH; g.fill(); g.beginPath(); g.ellipse(bx, by, bw * .95, bh * .95, 0, 0, TAU); g.fill();
      g.fillStyle = K; g.font = `900 ${86 * u}px 'Noto Sans SC'`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('它到底在哪？', bx, by); g.textBaseline = 'alphabetic';
    };
    const burst = (g, x, y, r0, r1, n, col) => { g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, r = i % 2 ? r0 : r1 * (.85 + .3 * hash1(i * 3 + 7)); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); ink(g, 14 * u, col); };
    const shotB = g => {
      g.fillStyle = BL; g.fillRect(0, 0, W, H); dots(g, () => g.rect(0, 0, W, H), WH, 40 * u, 7 * u);
      const sc = 1 + .06 * eOutBack(inv(.9, 1.05, t));
      burst(g, W / 2, H / 2, SHORT * .32 * sc, SHORT * .55 * sc, 14, RD);
      word(g, '叮！', W / 2, H / 2, SHORT * .42 * sc, Y);
    };
    const grid = () => {
      const pals = [[Y, RD, WH, RD, BL, RD], [BL, WH, Y, RD, RD, RD], [RD, Y, WH, BL, BL, BL], [WH, BL, Y, RD, BL, RD], [Y, BL, WH, BL, RD, RD]];
      const beat = Math.floor((t - 2) / .25);
      for (let i = 0; i < 4; i++) {
        const c = pals[(i + beat) % 5], x0 = (i % 2) * W / 2, y0 = Math.floor(i / 2) * H / 2, P = { skin: c[2], dot: c[3], hl: c[4], lip: c[5] };
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, W / 2, H / 2); ctx.clip(); ctx.fillStyle = c[0]; ctx.fillRect(x0, y0, W / 2, H / 2);
        dots(ctx, () => ctx.rect(x0, y0, W / 2, H / 2), c[1], 30 * u, 6 * u);
        const R = Math.min(W / 2, H / 2) * .36; face(ctx, x0 + W / 4, y0 + H / 4 + R * .12, R, P); ctx.restore();
      }
      ctx.fillStyle = K; ctx.fillRect(W / 2 - 8 * u, 0, 16 * u, H); ctx.fillRect(0, H / 2 - 8 * u, W, 16 * u);
      ctx.lineWidth = 24 * u; ctx.strokeStyle = K; ctx.strokeRect(0, 0, W, H);
      if (t > 3.0) { const q = eOutBack(inv(3.0, 3.2, t)); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(q, q); ctx.rotate(-.06); burst(ctx, 0, 0, SHORT * .2, SHORT * .32, 12, Y); word(ctx, '找到了！', 0, 0, SHORT * .13, RD); ctx.restore(); }
    };
    if (t < .9) shotA(ctx);
    else if (t < 1.5) shotB(ctx);
    else if (t < 2) {
      // 闪电劈开，然后整帧网点化
      const g = s.off.getContext('2d'); shotA(g);
      const p = inv(1.5, 2, t), zig = [[W * .58, -10]]; for (let i = 1; i <= 6; i++) zig.push([W * (.58 + (i % 2 ? -.12 : .1) - i * .02), H * i / 6 + 10]);
      ctx.fillStyle = K; ctx.fillRect(0, 0, W, H);
      const pat = ctx.createPattern(s.off, 'no-repeat'), sp = 28 * u;
      ctx.fillStyle = pat; ctx.beginPath();
      for (let y = 0, j = 0; y < H + sp; y += sp * .87, j++) for (let x = (j % 2) * sp / 2; x < W + sp; x += sp) { const r = sp * .5 * (.55 + .45 * Math.sin(x * .004 + y * .003 + p * 6)); ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
      ctx.fill();
      const sh = 30 * u * eOutCubic(p);
      ctx.beginPath(); ctx.moveTo(...zig[0]); zig.forEach(q => ctx.lineTo(q[0] + sh, q[1])); zig.slice().reverse().forEach(q => ctx.lineTo(q[0] - sh, q[1])); ctx.closePath(); ctx.fillStyle = WH; ctx.fill();
      ctx.beginPath(); ctx.moveTo(...zig[0]); zig.forEach(q => ctx.lineTo(q[0] + sh * .4, q[1])); zig.slice().reverse().forEach(q => ctx.lineTo(q[0] - sh * .4, q[1])); ctx.closePath(); ctx.fillStyle = Y; ctx.fill();
      if (t < 1.56) { ctx.fillStyle = WH; ctx.fillRect(0, 0, W, H); }
    } else grid();
  }
});
