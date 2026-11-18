// C-097 单线雕版：整幅月亮只有一根从圆心绕出去的阿基米德螺线，toneRibbon 沿线取亮度定粗细（亮处细、暗处粗），月面的海和环形山是 init 里算好的反照率图，光照每帧按球面法线现算，所以线画完后月相还会慢慢变。
// 风格提示词：用单线雕版风格：整幅画只用一根不断的雕刻线，像螺旋一样绕出整个形体，线的粗细随明暗变化，亮处细、暗处粗，没有任何填充和别的笔画，整幅图就是一笔。
// 题材：印刷、版画与装饰 · 适合：品牌标志、月亮与星球等圆形主体、艺术短片
scene({
  id: 'C-097', name: '单线雕版', dur: 5, still: 4.4,
  fonts: ["700 60px 'Noto Serif SC'", "italic 400 40px 'Playfair Display'"],
  text: '一笔月',
  init() {
    const u = SHORT / 1080;
    // 构图：横屏月亮在右、字在左；竖屏月亮在上、字在下
    const R = (LAND ? 410 : 450) * u, cx = LAND ? W * .64 : W * .5, cy = LAND ? H * .5 : H * .4, gap = 9 * u;
    // 反照率：几片月海（暗）和环形山（亮边暗底）
    const A = toneMap(g => {
      g.fillStyle = '#eee'; g.fillRect(0, 0, W, H);
      g.filter = `blur(${22 * u}px)`; g.fillStyle = '#8a8a8a';
      [[-.25, -.3, .32], [.15, -.2, .26], [.05, .15, .22], [-.35, .2, .18], [.35, .25, .14]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(cx + x * R, cy + y * R, r * R, r * R * .8, x * 3, 0, TAU); g.fill(); });
      g.filter = 'none';
      const Rr = mulberry32(97);
      for (let i = 0; i < 26; i++) { const a = Rr() * TAU, d = Math.sqrt(Rr()) * R * .92, r = (8 + Rr() * 30) * u, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        g.fillStyle = '#777'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = r * .25; g.beginPath(); g.arc(x - r * .1, y - r * .1, r, 0, TAU); g.stroke(); }
    }, { res: 3, blur: 2 * u, pixel: (x, y, v) => v * (.85 + .3 * fbm(x * .01, y * .01, 3)) });
    // 螺线：从圆心按弧长等距取点，一直绕到月亮外面一点
    const pts = [], step = 3 * u;
    for (let th = 4; ; ) { const r = gap * th / TAU; if (r > R * 1.12) break; pts.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]); th += step / r; }
    return { u, R, cx, cy, gap, A, pts, paper: makePaper('#EFE7D4', { seed: 97, grain: 12, fiber: .3, blot: 8 }) };
  },
  draw(ctx, t, s) {
    const { u, R, cx, cy, gap } = s;
    ctx.drawImage(s.paper, 0, 0, W, H);
    // 光从左边来，线画完后光慢慢转到正面（月相变圆）
    const ph = lerp(-1.05, -.35, smooth(2.2, 5, t)), lx = Math.cos(ph) * -1, lz = Math.sin(ph) * -1, ly = -.25, ln = Math.hypot(lx, ly, lz);
    const T = { at: (x, y) => {
      const nx = (x - cx) / R, ny = (y - cy) / R, q = nx * nx + ny * ny;
      if (q >= 1) return 1;                                                                   // 月亮外：最细的线
      const nz = Math.sqrt(1 - q), d = Math.max(0, (nx * lx + ny * ly + nz * lz) / ln);
      return clamp(.04 + s.A.at(x, y) * Math.pow(d, .7) * 1.05);
    } };
    toneRibbon(ctx, s.pts, T, .5 * u, gap * .92, eInOutCubic(inv(.1, 3.4, t)), '#1A2030');
    // 笔尖：画的时候有一个小亮点跟着走
    const p = eInOutCubic(inv(.1, 3.4, t));
    if (p > 0 && p < 1) { const [x, y] = s.pts[Math.round(p * (s.pts.length - 1))]; ctx.fillStyle = '#C8A24A'; ctx.beginPath(); ctx.arc(x, y, 6 * u, 0, TAU); ctx.fill(); }
    // 字
    const tp = smooth(3.4, 4.1, t);
    if (tp > 0) {
      ctx.save(); ctx.globalAlpha = tp; ctx.fillStyle = '#1A2030'; ctx.textAlign = 'center';
      const tx = LAND ? W * .2 : W * .5, ty = LAND ? H * .48 : H * .82;
      ctx.font = `700 ${Math.round(120 * u)}px 'Noto Serif SC'`; ctx.fillText('一笔月', tx, ty);
      ctx.font = `italic 400 ${Math.round(40 * u)}px 'Playfair Display'`; ctx.fillText('one line, one moon', tx, ty + 70 * u);
      ctx.restore();
    }
  }
});
