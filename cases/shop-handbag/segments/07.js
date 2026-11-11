// 第 7 段 11 个颜色：后半，逐句字幕。1 十一条色块从上到下依次亮起 → 2 十一个旷野场景（生图，每色一只包、不出人），念到哪个颜色切到哪张，硬切
// → 3 溶解进左右分屏：鳄纹棕放大看鳄鱼纹，旁边苏丹棕的平滑皮面。
// 2 层：底层色块 / 生成场景图 / 颜色款式图，上层颜色名和字幕。时间由旁白驱动：第 2、3 句念 11 个颜色。
// 色值是在 assets/brand/color/ 各图包身中间取的平均色。
scene({
  id: 'shop-handbag:7', name: '11 个颜色',
  needs: ['common.js'],
  fonts: ["900 96px 'Noto Serif SC'", "600 96px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  async init() {
    await C.init();
    const COL = [
      ['黑色', '01-black', '#2B2C2D'], ['白色', '02-white', '#E6E6DE'], ['苏丹棕', '03-sudan-brown', '#A64601'], ['枫叶红', '04-maple-red', '#D5011D'],
      ['向日葵黄', '05-sunflower-yellow', '#ECAB2C'], ['银雾蓝', '06-mist-blue', '#89A1A8'], ['鳄纹棕', '07-croc-brown', '#4E2620'], ['灰汁色', '08-ash-grey', '#9C8D70'],
      ['安可拉红', '09-ancora-red', '#7F2E31'], ['抹茶绿', '10-matcha-green', '#9AA977'], ['蜜桃粉', '11-peach-pink', '#E3BAB8'],
    ];
    const img = await Promise.all(COL.map(([, f], k) =>
      loadImage(`gen/7-${String(k + 1).padStart(2, '0')}.jpg`).then(i => ({ i, ai: true })).catch(() => loadImage(`brand/color/${f}.jpg`).then(i => ({ i, ai: false })))));
    const P = { croc: await loadImage('brand/color/07-croc-brown.jpg'), sudan: await loadImage('brand/color/03-sudan-brown.jpg') };
    const q = C.cue, s = i => SEG.vo[i].at;
    const when = COL.map(([n]) => q(n) - .12);
    return { COL, img, P, when, end: s(3) - .2 };
  },
  async draw(ctx, t, s) {
    const { K, u, F, bg, ring } = C, { COL, img, P, when } = s;
    const list = [
      { at: 0, draw: (c, lt, d) => {                   // 1 十一条色块
        bg(c);
        const h = H * .055, gap = 10 * u, y0 = H / 2 - (11 * h + 10 * gap) / 2;
        COL.forEach(([, , hex], k) => {
          const e = eOutCubic(inv(.1 + k * .09, .5 + k * .09, lt));
          c.save(); c.globalAlpha = e; c.fillStyle = hex; rr(c, W * .14, y0 + k * (h + gap), W * .72 * e, h, h / 2); c.fill(); c.restore();
        });
        C.word(c, lt, '11 个颜色', .1, d + 1, { size: 96, y: .12, color: K.ink, weight: 900 });
      } },
      ...COL.map(([name, , hex], k) => ({ at: when[k], draw: (c, lt, d) => {   // 2 场景图快切
        const { i, ai } = img[k];
        if (ai) { drawCover(c, i, 0, 0, W, H, { zoom: 1.04 + .04 * lt / Math.max(d, .5) }); C.film(c, t, { warm: .1, vig: .3, grain: .06 }); C.aiTag(c); }
        else C.photo(c, i, lt, d, { w: 1.1, y: .42 });
        C.shade(c, .55, .5);
        swatch(c, name, hex, k);
      } })),
      { at: s.end, mix: .4, draw: (c, lt, d) => {      // 3 鳄纹棕 vs 苏丹棕
        bg(c);
        const half = (im, x, label, note, k) => {
          const w = W * .46, y = H * .14, h = H * .46;
          c.save(); c.beginPath(); rr(c, x, y, w, h, 16 * u); c.clip();
          drawCover(c, im, x, y, w, h, { zoom: 2.2 + .1 * lt / d, fx: .5, fy: .88 }); c.restore();
          ring(c, x + w / 2, y + h / 2, 130 * u, lt - .5 - k * .4);
          c.save(); c.textAlign = 'center'; c.globalAlpha = smooth(.3 + k * .4, .8 + k * .4, lt);
          c.fillStyle = K.ink; c.font = F(900, 60, C.SERIF); c.fillText(label, x + w / 2, y + h + 80 * u);
          c.font = F(400, 38); c.fillStyle = K.river; c.fillText(note, x + w / 2, y + h + 136 * u); c.restore();
        };
        half(P.croc, W * .03, '鳄纹棕', '鳄鱼纹', 0);
        half(P.sudan, W * .51, '苏丹棕', '平滑皮面（其余 10 色同）', 1);
      } },
    ];
    await C.shots(ctx, t, list);
    C.sub(ctx, t);

    // 颜色名：色块圆点 + 名字 + 序号 n / 11
    function swatch(c, name, hex, k) {
      const x = 80 * u, y = H * .66;
      c.save();
      c.fillStyle = hex; c.strokeStyle = K.cream; c.lineWidth = 4 * u; c.beginPath(); c.arc(x + 36 * u, y, 36 * u, 0, TAU); c.fill(); c.stroke();
      c.shadowColor = 'rgba(20,16,12,.6)'; c.shadowBlur = 16 * u;
      c.fillStyle = K.cream; c.font = F(900, 88, C.SERIF); c.textBaseline = 'middle'; c.fillText(name, x + 100 * u, y + 4 * u);
      c.font = F(400, 36); c.textAlign = 'right'; c.fillText(`${k + 1} / 11`, W - 80 * u, y + 8 * u);
      c.restore();
    }
  }
});
