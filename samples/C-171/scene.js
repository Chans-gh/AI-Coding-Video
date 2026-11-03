// C-171 流动的丝线：上千条流线从左侧几束种子点出发，沿一张随时间缓慢变化的噪声流场逐步积分走出去，相邻的线挨得很近就成了丝带；1.5 秒重音时给流场叠一阵高频扰动让丝散开，再按指数衰减慢慢理顺，叠加混合让交叠处更亮
// 风格提示词：用流动的丝线风格：深色背景上成千上万根半透明细丝顺着缓慢变化的噪声流场游走，留下柔和的轨迹，颜色从珍珠白渐变到淡金和冰蓝，丝线交叠处更亮，音乐重音时被扰动散开、再慢慢理顺，镜头几乎不动，整体像丝绸在水里漂。
// 题材：3D 与实时图形 · 适合：冥想与放松、奢侈品与面料广告、抽象音乐可视化
const HIT = 1.5;                                    // 重音时刻
const SILK = [[244, 239, 230], [232, 201, 138], [169, 212, 236]];
scene({
  id: 'C-171', name: '流动的丝线', dur: 4, still: 3.3,
  init() {
    const R = mulberry32(17), bands = [];
    for (let b = 0; b < 6; b++) {
      const lines = [];
      for (let k = 0; k < 120; k++) lines.push({ off: (R() - .5) * (R() < .85 ? .05 : .16), c: R() });
      bands.push({ y: (b + .5) / 6 + (R() - .5) * .08, ph: R() * TAU, col: b % 3, lines });
    }
    return { bands, buf: mk(W / 2, H / 2) };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 2160, step = 15 * u, K = Math.ceil((LAND ? 1.15 : 1.5) * LONG / step * (LAND ? 1 : .62));
    const kick = t > HIT ? Math.exp(-(t - HIT) * 1.6) * smooth(HIT, HIT + .12, t) : 0;
    const sc = 1 / (480 * u), W2 = W / 2, H2 = H / 2;
    const field = (x, y) => {
      let a = (vnoise(x * sc + 3, y * sc + t * .18) - .5) * 2.4 + (vnoise(x * sc * 2.3, y * sc * 2.3 - t * .25) - .5) * 1.1;
      if (!LAND) a += .35;                                        // 竖屏：丝带斜着往下漂，铺满高度
      if (kick > 0) a += kick * (vnoise(x * sc * 9, y * sc * 9 + t) - .5) * 7;
      return a;
    };
    const g = s.buf.getContext('2d');
    const bg = g.createRadialGradient(W2 * .5, H2 * .45, 0, W2 * .5, H2 * .5, LONG * .35);
    bg.addColorStop(0, '#111a2c'); bg.addColorStop(1, '#03050b');
    g.globalCompositeOperation = 'source-over'; g.fillStyle = bg; g.fillRect(0, 0, W2, H2);
    g.globalCompositeOperation = 'lighter'; g.lineWidth = 1; g.lineCap = 'round';
    for (const b of s.bands) {
      const y0 = (LAND ? b.y * H2 : b.y * H2 * .8 - H2 * .05) + Math.sin(t * .5 + b.ph) * 50 * u;
      const paths = [new Path2D(), new Path2D(), new Path2D()];
      for (const l of b.lines) {
        let x = -40 * u - l.c * 60 * u, y = y0 + l.off * SHORT / 2;
        const p = paths[(b.col + (l.c > .7 ? 1 : 0) + (l.c > .9 ? 1 : 0)) % 3];
        p.moveTo(x, y);
        for (let k = 0; k < K; k++) {
          const a = field(x, y);
          x += Math.cos(a) * step; y += Math.sin(a) * step;
          p.lineTo(x, y);
          if (x > W2 + 20 || y < -100 || y > H2 + 100) break;
        }
      }
      paths.forEach((p, i) => { g.strokeStyle = rgba(SILK[i], .16); g.stroke(p); });
    }
    ctx.drawImage(s.buf, 0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(7px)'; ctx.globalAlpha = .8; ctx.drawImage(s.buf, 0, 0, W / 2, H / 2, 0, 0, W, H); ctx.restore();
    vignette(ctx, .55, .4);
  }
});
