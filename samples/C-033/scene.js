// C-033 瑞士国际主义排版：Canvas 2D 先按短边算出模块网格（横屏 12 栏、竖屏 6 栏），所有字和色块的位置都取格线坐标；每个元素在节拍上用 0.2 秒的指数缓动冲到格线急停，只用一种无衬线字、黑白加信号红。
// 风格提示词：用瑞士国际主义动态排版风格：白底模块化网格，只用一种无衬线字体、黑白加一个信号红，文字和色块严格沿网格对齐、也可竖排，运动像印刷机一样精准卡拍，没有任何装饰和渐变。
// 题材：平面设计与动态排版 · 适合：设计、规则类内容
scene({
  id: 'C-033', name: '瑞士国际主义排版', dur: 4, still: 3.1,
  fonts: ["900 80px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  text: '网格秩序栏距字号颜色只用一种字体黑白红GRIDORDERSYSTEM2026设计规则第页',
  init() {
    const cols = LAND ? 12 : 6, m = SHORT * .06, gut = SHORT * .018;
    const cw = (W - 2 * m - gut * (cols - 1)) / cols;
    const rows = LAND ? 8 : 14, rh = (H - 2 * m - gut * (rows - 1)) / rows;
    const X = c => m + c * (cw + gut), Y = r => m + r * (rh + gut);
    const CW = n => n * cw + (n - 1) * gut, RH = n => n * rh + (n - 1) * gut;
    return { cols, rows, X, Y, CW, RH, m };
  },
  draw(ctx, t, s) {
    const { X, Y, CW, RH, cols, rows } = s, u = SHORT / 1080, RED = '#E3241B', INK = '#111';
    const k = (t0, d = .22) => eOutExpo(inv(t0, t0 + d, t));          // 节拍上急停
    const B = i => i * BEAT;
    ctx.fillStyle = '#F4F3EF'; ctx.fillRect(0, 0, W, H);
    // 网格：先横后竖逐条画出，之后淡到很浅
    const ga = lerp(.5, .14, inv(1.2, 1.8, t));
    ctx.strokeStyle = `rgba(0,0,0,${ga})`; ctx.lineWidth = 1;
    for (let c = 0; c < cols; c++) {
      const p = k(c * .03, .3);
      [X(c), X(c) + CW(1)].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H * p); ctx.stroke(); });
    }
    for (let r = 0; r < rows; r++) {
      const p = k(.15 + r * .025, .3);
      [Y(r), Y(r) + RH(1)].forEach(y => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W * p, y); ctx.stroke(); });
    }
    // 版式：横竖各一套格位（栏, 行, 宽栏数, 高行数）
    const L = LAND
      ? { red: [0, 0, 5, 5], red2: [6, 5, 5, 3], big: [0, 5], vert: [11, 0], col: [6, 0, 2], num: [8, 1] }
      : { red: [0, 0, 4, 4], red2: [2, 11, 4, 3], big: [0, 6], vert: [5, 0], col: [0, 11, 2], num: [0, 5] };
    // 红块：先从左冲进来占 5 栏，第 6 拍换到右下另一组格位
    const mv = k(B(6)), r0 = L.red, r1 = L.red2;
    const rx = lerp(X(r0[0]), X(r1[0]), mv), ry = lerp(Y(r0[1]), Y(r1[1]), mv);
    const rw = lerp(CW(r0[2]), CW(r1[2]), mv), rhh = lerp(RH(r0[3]), RH(r1[3]), mv);
    const enter = k(B(1));
    ctx.fillStyle = RED; ctx.fillRect(lerp(-rw, rx, enter), ry, rw, rhh);
    // 大字：从格底线往上被裁切露出
    ctx.save();
    const by = Y(L.big[1]) + RH(LAND ? 3 : 4);
    ctx.beginPath(); ctx.rect(0, Y(L.big[1]) - RH(1), W, by - Y(L.big[1]) + RH(1)); ctx.clip();
    ctx.fillStyle = INK; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    const bs = LAND ? 330 * u : 300 * u;
    ctx.font = `900 ${bs}px 'Noto Sans SC'`;
    ctx.fillText('网格', X(L.big[0]) - bs * .04, by + (1 - k(B(2), .25)) * bs);
    ctx.restore();
    // 第 5 拍：大字下压一道红色细栏
    const ul = k(B(5));
    ctx.fillStyle = RED; ctx.fillRect(X(L.big[0]), by + 18 * u, CW(LAND ? 6 : 6) * ul, 10 * u);
    // 竖排英文
    ctx.save(); ctx.translate(X(L.vert[0]) + CW(1) * .78, Y(L.vert[1]));
    ctx.rotate(Math.PI / 2); ctx.fillStyle = INK; ctx.font = `700 ${Math.round(CW(1) * .78)}px 'Noto Sans SC'`;
    ctx.beginPath(); ctx.rect(0, -CW(1), H, CW(1) * 1.3); ctx.clip();
    ctx.fillText('GRID / ORDER / SYSTEM', (1 - k(B(3), .3)) * -H * .6, 0);
    ctx.restore();
    // 小字栏：三行规则，逐拍落位
    const rules = [['01', '栏距', '只取格线'], ['02', '字体', '只用一种'], ['03', '颜色', '黑白加红']];
    const cx = X(L.col[0]), cy0 = Y(L.col[1]);
    rules.forEach((r, i) => {
      const p = k(B(3 + i * .66)), top = cy0 + i * 118 * u, dy = (1 - p) * 118 * u;
      ctx.save(); ctx.beginPath(); ctx.rect(cx, top, CW(L.col[2]), 118 * u); ctx.clip();
      ctx.fillStyle = INK; ctx.fillRect(cx, top + dy, CW(L.col[2]), 3 * u);
      ctx.font = `700 ${Math.round(30 * u)}px 'Noto Sans SC'`; ctx.fillStyle = i === 0 && t > B(7) ? RED : INK;
      ctx.fillText(r[0], cx, top + 52 * u + dy);
      ctx.font = `700 ${Math.round(42 * u)}px 'Noto Sans SC'`; ctx.fillStyle = INK;
      ctx.fillText(r[1], cx + 58 * u, top + 54 * u + dy);
      ctx.font = `400 ${Math.round(28 * u)}px 'Noto Sans SC'`;
      ctx.fillText(r[2], cx + 58 * u, top + 96 * u + dy);
      ctx.restore();
    });
    // 大号数字：12 栏 → 换成页码，像印刷机卡一下
    ctx.font = `900 ${Math.round(150 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'left';
    const nx = X(L.num[0]), ny = Y(L.num[1]) + RH(1) * .9;
    const n = t < B(8) ? String(cols).padStart(2, '0') : '26';
    const np = k(B(4)), np2 = k(B(8), .15);
    ctx.save(); ctx.beginPath(); ctx.rect(nx, ny - 150 * u, CW(3), 170 * u); ctx.clip();
    ctx.fillStyle = mv > .5 ? INK : RED;
    ctx.fillText(n, nx, ny + (1 - np) * 170 * u - (t < B(8) ? 0 : (1 - np2) * -170 * u));
    ctx.restore();
    ctx.font = `400 ${Math.round(24 * u)}px 'Noto Sans SC'`; ctx.fillStyle = INK;
    if (np > .5) ctx.fillText(t < B(8) ? '栏 / COLUMNS' : '第 26 页 / 设计规则', nx, ny + 44 * u);
    // 白字压在红块上：最后一拍
    const tp = k(B(9));
    if (tp > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(rx, ry, rw, rhh); ctx.clip();
      ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(74 * u)}px 'Noto Sans SC'`;
      ctx.fillText('只用一种字体', rx + 28 * u, ry + rhh - 40 * u + (1 - tp) * 120 * u);
      ctx.restore();
    }
  }
});
