// 第 8 段 怎么搭：品牌的模特图（长图切成的单张），全段硬切，每张慢推；左下角一行颜色和搭配的小字。
// 1 黑色款全身 → 2 黑色款近一点（鹅黄外套 + 手套）→ 3 白色款红西装 → 4 五色匀速快切：苏丹棕、枫叶红、向日葵黄、银雾蓝、鳄纹棕。
// 2 层：底层模特原图（只推镜，不送进生成模型），上层小字和字幕。时间由旁白 4 句驱动。
scene({
  id: 'shop-handbag:8', name: '怎么搭',
  needs: ['common.js'],
  fonts: ["900 96px 'Noto Serif SC'", "600 96px 'Noto Serif SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  async init() {
    await C.init();
    const s = i => SEG.vo[i].at;
    // [图, 颜色, 搭配, 取景 fx, fy, 小字靠哪边（默认左）, 小字的 y（默认 .68）]
    const rows = [
      ['01-2', '', '', .5, .4],
      ['01-1', '黑色', '鹅黄外套 + 手套', .5, .45],
      ['02-2', '白色', '红色西装', .5, .4],
      ['03-1', '苏丹棕', '针织马甲', .5, .35],
      ['04-1', '枫叶红', '白衬衫', .5, .35],
      ['05-2', '向日葵黄', '复古长裙', .5, .5],
      ['06-1', '银雾蓝', '复古长裙', .5, .4],
      ['07-1', '鳄纹棕', '白衬衫', .5, .4, 'right', .1],    // 左下是包，小字放右上的天空
    ];
    const img = await Promise.all(rows.map(r => loadImage(`brand/model/${r[0]}.jpg`)));
    const t5 = s(3) - .2, step = (SEG.dur - t5) / 5;
    const at = [0, s(1) - .3, s(2) - .3, ...[0, 1, 2, 3, 4].map(k => t5 + k * step)];
    return { rows, img, at };
  },
  async draw(ctx, t, s) {
    const { K, u, F } = C;
    const shots = s.rows.map((r, k) => ({
      at: s.at[k],
      draw: (c, lt, d) => {
        const p = lt / d, dir = k % 2 ? 1 : -1;
        drawCover(c, s.img[k], 0, 0, W, H, { zoom: 1.03 + .07 * p, fx: r[3] + dir * .08 * (p - .5), fy: r[4] });
        if (r[1]) tag(c, lt, r[1], r[2], r[5], r[6]);
      },
    }));
    await C.shots(ctx, t, shots);
    C.film(ctx, t, { warm: .08, vig: .3, grain: .03 });
    C.shade(ctx, .6, .5);
    C.sub(ctx, t);

    // 左下角：颜色（宋体）+ 一道短线 + 搭配（黑体），切进来 0.4 秒内由左滑入
    function tag(c, lt, color, wear, side = 'left', fy = .68) {
      const e = eOutCubic(inv(.1, .6, lt)), R = side === 'right', x = R ? W - 70 * u + (1 - e) * 40 * u : 70 * u - (1 - e) * 40 * u, y = H * fy;
      c.save(); c.globalAlpha = e; c.textAlign = side; c.textBaseline = 'alphabetic';
      c.shadowColor = 'rgba(20,16,12,.6)'; c.shadowBlur = 18 * u;
      c.fillStyle = K.cream; c.font = F(900, 76, C.SERIF); c.fillText(color, x, y);
      c.fillRect(R ? x - 70 * u * e : x, y + 26 * u, 70 * u * e, 4 * u);
      c.font = F(400, 40); c.fillText(wear, x, y + 86 * u);
      c.restore();
    }
  }
});
