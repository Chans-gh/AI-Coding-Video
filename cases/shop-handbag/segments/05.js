// 第 5 段 能装什么：前半，硬切，关键词大字 + 逐句字幕。
// 1 奶白底上 5 件东西平铺排开（代码画的简笔：手机、卡夹、纸巾、口红、唇釉；照品牌容量图的排法重画，不带别家的标志）
// → 2 俯拍 4 张步骤图（生图，只出手，放大到包口），念到哪样东西切到哪张；下方一排小图标跟着打勾、计数 1 到 5 → 3 手合上包盖，标「无夹层」「包盖式」。
// 3 层：底层生成的俯拍图和奶白底，中层平铺的物品，上层计数、标注和字幕。时间由旁白 3 句驱动。
scene({
  id: 'shop-handbag:5', name: '能装什么',
  needs: ['common.js'],
  fonts: ["900 96px 'Noto Serif SC'", "600 96px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  async init() {
    await C.init();
    const fb = await loadImage('brand/08-black-top.jpg');
    const im = n => loadImage(`gen/${n}.jpg`).catch(() => fb);
    const P = { steps: await Promise.all([1, 2, 3, 4].map(k => im(`5-2-${k}`))), close: await im('5-3') };
    const q = C.cue, s = i => SEG.vo[i].at;
    const when = ['手机', '卡夹', '纸巾', '化妆品'].map(k => q(k) - .25);
    const at = [0, ...when, s(2) - .25];
    return { P, at, when, cue: { layer: q('夹层'), lid: q('包盖') } };
  },
  async draw(ctx, t, s) {
    const { K, u, F, bg } = C, { P, at } = s;
    const FOCUS = [[.37, .19], [.58, .13], [.63, .04], [.76, .13]];   // 每张步骤图包口的位置（drawCover 的对齐比例）
    const shots = [
      { at: at[0], draw: (c, lt, d) => {               // 1 平铺
        bg(c);
        items(c, W / 2, H * .5, 1.25, k => eOutBack(inv(.2 + k * .12, .7 + k * .12, lt)));
        C.word(c, lt, '能装什么？', .2, d + 1, { size: 120, y: .24, color: K.ink, weight: 900 });
      } },
      ...P.steps.map((img, k) => ({ at: at[k + 1], draw: (c, lt, d) => {
        // 生图把提绳和珠子画到了包身侧面（真品装在盖子上）：放大到只看包口和手，提手、盖子出画（需求方定）
        const [fx, fy] = FOCUS[k];
        drawCover(c, img, 0, 0, W, H, { zoom: 2.2 + .08 * lt / d, fx, fy });
        C.film(c, t, { warm: .12, vig: .3, grain: .08 }); C.aiTag(c);
      } })),
      { at: at[5], draw: (c, lt, d) => {               // 3 合上包盖
        drawCover(c, P.close, 0, 0, W, H, { zoom: 1.03 + .04 * lt / d });
        C.film(c, t, { warm: .12, vig: .3, grain: .08 }); C.aiTag(c);
        C.shade(c, .5, .5);
        const L = s.cue.layer - at[5], D = s.cue.lid - at[5];
        C.word(c, lt, '无夹层', L, d + 1, { size: 110, y: .62 });
        C.word(c, lt, '包盖式', D, d + 1, { size: 110, y: .7 });
      } },
    ];
    const i = await C.shots(ctx, t, shots);
    if (i >= 1 && i <= 4) tray(ctx, t);
    C.sub(ctx, t);

    // 5 件东西的简笔（无标志）：手机、卡夹、纸巾、口红、唇釉；(cx, cy) 中心，k 缩放，pop(k) 每件出现的比例
    function items(c, cx, cy, k, pop) {
      const S = u * k, list = [
        [-300, 0, (c) => { rr(c, -55, -110, 110, 220, 18); c.fill(); c.stroke(); c.beginPath(); c.arc(-28, -84, 9, 0, TAU); c.stroke(); }],
        [-140, 10, (c) => { rr(c, -70, -48, 140, 96, 10); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-70, -10); c.lineTo(70, -10); c.stroke(); }],
        [30, 0, (c) => { rr(c, -50, -78, 100, 156, 12); c.fill(); c.stroke(); c.beginPath(); c.ellipse(0, -40, 26, 8, 0, 0, TAU); c.stroke(); }],
        [160, 0, (c) => { rr(c, -18, -40, 36, 120, 6); c.fill(); c.stroke(); rr(c, -12, -88, 24, 50, 10); c.fill(); c.stroke(); }],
        [270, 0, (c) => { rr(c, -16, -10, 32, 100, 6); c.fill(); c.stroke(); rr(c, -11, -100, 22, 90, 8); c.fill(); c.stroke(); }],
      ];
      const fills = ['#E9E6E1', '#F7F4EE', '#DDE4EA', '#D9A79A', '#E8C2BC'];
      list.forEach(([x, y, f], j) => {
        const p = pop(j); if (p <= 0) return;
        c.save(); c.translate(cx + x * S, cy + y * S); c.scale(S * p, S * p);
        c.fillStyle = fills[j]; c.strokeStyle = K.ink; c.lineWidth = 4; c.lineJoin = 'round'; f(c); c.restore();
      });
    }
    // 下方的物品条：已经放进去的打勾，右边计数 n / 5（第 4 张图是两支化妆品，一次加 2）
    function tray(c, t) {
      const n = s.when.reduce((m, w, k) => t >= w + .2 ? (k === 3 ? 5 : k + 1) : m, 0);
      const w = W * .86, h = 170 * u, x = (W - w) / 2, y = H * .64;
      c.save(); c.fillStyle = 'rgba(244,239,230,.9)'; rr(c, x, y, w, h, 24 * u); c.fill(); c.restore();
      items(c, W / 2 - 70 * u, y + h / 2 + 8 * u, .55, j => 1);
      for (let j = 0; j < 5; j++) {
        const xs = [-300, -140, 30, 160, 270][j] * .55 * u + W / 2 - 70 * u;
        if (j < n) {
          const e = eOutBack(inv(s.when[Math.min(j, 3)] + .2, s.when[Math.min(j, 3)] + .6, t));
          c.save(); c.translate(xs, y + 34 * u); c.scale(e, e);
          c.fillStyle = K.river; c.beginPath(); c.arc(0, 0, 22 * u, 0, TAU); c.fill();
          c.strokeStyle = K.cream; c.lineWidth = 5 * u; c.beginPath(); c.moveTo(-10 * u, 0); c.lineTo(-2 * u, 8 * u); c.lineTo(11 * u, -8 * u); c.stroke(); c.restore();
        }
      }
      c.save(); c.fillStyle = K.ink; c.font = F(900, 84, C.SERIF); c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillText(n, x + w - 110 * u, y + h / 2); c.font = F(400, 40); c.textAlign = 'left'; c.fillText('/ 5', x + w - 100 * u, y + h / 2 + 10 * u);
      c.restore();
    }
  }
});
