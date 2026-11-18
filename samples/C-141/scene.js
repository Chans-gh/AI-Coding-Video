// C-141 表现主义：桥上一个原创的、脸像面具的人静静站着、身后翻卷的天空和水，先画成色块底图，方向场让天空和水绕着人横向翻滚，strokePlan 排出又长又弯的笔触，整张在 init 里画好；每帧把它按行切成细条，每条按正弦左右错开（越往后错得越厉害），画面像被情绪扭弯。
// 风格提示词：用表现主义风格：颜色不照现实而照情绪，血橙、硫磺黄和深蓝紫正面冲撞，笔触又长又弯、顺着形体翻卷，人脸像面具一样简化、眼窝和嘴是深色的洞，透视歪斜、地平线倾斜，整个画面随时间像热浪一样一行行左右扭动，转场是画面被拉成长条后卷走。
// 题材：绘画流派 · 适合：情绪短片、心理与焦虑话题、音乐 MV、海报
scene({
  id: 'C-141', name: '表现主义', dur: 5, still: 3.2,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    // 构图：横屏桥从左下斜到右边、人在左三分之一；竖屏人在中下、天空占上半
    const fx = LAND ? W * .3 : W * .5, fy = LAND ? H * .62 : H * .66, fs = (LAND ? 1.3 : 1.5) * u;
    const hz = LAND ? H * .48 : H * .44;
    const rail = x => (LAND ? H * .78 : H * .8) - (x / W) * (LAND ? 300 : 260) * u;          // 斜着的桥栏
    const P = (x, y) => [fx + x * fs, fy + y * fs];
    const M = paintMap(g => {
      const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#2A1A5A'); sky.addColorStop(.35, '#C2321E'); sky.addColorStop(.7, '#F07A1E'); sky.addColorStop(1, '#F4C82A');
      g.fillStyle = sky; g.fillRect(0, 0, W, hz + 20 * u);
      g.filter = `blur(${30 * u}px)`;
      [[.2, .18, '#E8461E'], [.62, .1, '#3A2A7A'], [.8, .3, '#F2D23A'], [.45, .34, '#E0602A']].forEach(([x, y, c]) => { g.fillStyle = c; g.beginPath(); g.ellipse(x * W, y * H, W * .2, H * .05, -.15, 0, TAU); g.fill(); });
      g.filter = 'none';
      g.fillStyle = '#26205A'; g.beginPath(); g.moveTo(0, hz); g.quadraticCurveTo(W * .3, hz - 80 * u, W * .55, hz + 10 * u); g.quadraticCurveTo(W * .8, hz + 60 * u, W, hz - 20 * u); g.lineTo(W, H); g.lineTo(0, H); g.fill();   // 远山
      const sea = g.createLinearGradient(0, hz, 0, H); sea.addColorStop(0, '#2C3A8A'); sea.addColorStop(1, '#1A1440'); g.fillStyle = sea;
      g.beginPath(); g.moveTo(0, hz + 40 * u); g.quadraticCurveTo(W * .5, hz + 120 * u, W, hz + 20 * u); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      g.fillStyle = '#B8541E'; g.beginPath(); g.moveTo(0, rail(0)); g.lineTo(W, rail(W)); g.lineTo(W, H); g.lineTo(0, H); g.fill();    // 桥面
      g.strokeStyle = '#5A2A1A'; g.lineWidth = 16 * u; g.beginPath(); g.moveTo(0, rail(0) - 60 * u); g.lineTo(W, rail(W) - 60 * u); g.stroke();
      // 人：深绿长衣、面具一样的脸，静静望着画外
      g.fillStyle = '#1E5A44'; g.beginPath(); g.moveTo(...P(-150, 420)); g.quadraticCurveTo(...P(-160, 20), ...P(-60, -50)); g.lineTo(...P(60, -50)); g.quadraticCurveTo(...P(160, 20), ...P(150, 420)); g.fill();
      g.fillStyle = '#123A30'; g.beginPath(); g.moveTo(...P(20, -40)); g.quadraticCurveTo(...P(140, 40), ...P(150, 420)); g.lineTo(...P(40, 420)); g.fill();
      g.fillStyle = '#E8D48A'; g.beginPath(); g.ellipse(...P(0, -150), 78 * fs, 118 * fs, 0, 0, TAU); g.fill();
      g.fillStyle = '#C9B060'; g.beginPath(); g.ellipse(...P(18, -130), 50 * fs, 90 * fs, 0, 0, TAU); g.fill();
    }, { res: 4, blur: 5 * u });
    const face = (x, y) => Math.hypot((x - fx) / (80 * fs), (y - fy + 150 * fs) / (120 * fs));
    const F = flowField({ res: 14, noise: .35, scale: .003, swirl: [[fx + 260 * fs, fy - 260 * fs, 220 * fs, 1], [W * .7, H * .15, 300 * u, -1]], fn: (x, y, a) => {
      if (y > rail(x) - 70 * u) return Math.atan2(-(LAND ? 300 : 260) * u, W);                // 桥：顺着斜线
      if (face(x, y) < 1.15) return Math.atan2(y - (fy - 150 * fs), x - fx) + Math.PI / 2;   // 脸：顺着椭圆绕
      if (Math.abs(x - fx) < 160 * fs && y > fy - 50 * fs) return Math.PI / 2 + Math.sin(y * .02) * .15;  // 衣服：竖
      return a + Math.sin(y * .01) * .4;                                                        // 天和水：横着翻卷
    } });
    const S = strokePlan(M, F, { gap: 13 * u, len: [50 * u, 90 * u], width: [10 * u, 14 * u], jitter: .2, spread: .1, follow: 4, layers: 2, detail: .07, seed: 41, mask: (x, y) => face(x, y) > 1,
      tint: (x, y, c, R) => R() < .1 ? [c[2], c[0] * .6, c[1]] : c });                         // 偶尔掉色成对比色
    const paint = mk(W, H), pg = paint.getContext('2d');
    pg.fillStyle = '#2A1A5A'; pg.fillRect(0, 0, W, H);
    drawStrokes(pg, S, 1, { style: 'dab' });
    const Sf = strokePlan(M, F, { gap: 7 * u, len: [16 * u, 26 * u], width: [7 * u, 9 * u], jitter: .1, follow: 2, layers: 2, detail: .05, seed: 42, mask: (x, y) => face(x, y) < 1.05 });
    drawStrokes(pg, Sf, 1, { style: 'dab' });
    // 面具：深色的眼窝和嘴、粗黑轮廓、栏杆
    pg.lineCap = 'round'; pg.lineJoin = 'round';
    const blob = (x, y, rx, ry, c) => { pg.fillStyle = c; pg.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, k = 1 + (hash1(i * 5 + x | 0) - .5) * .25; pg.lineTo(...P(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k)); } pg.fill(); };
    [-1, 1].forEach(sd => blob(sd * 32, -172, 24, 15, '#22163A')); blob(0, -82, 30, 5, '#22163A');   // 眼窝、抿紧的嘴
    [-1, 1].forEach(sd => { pg.fillStyle = '#F4C82A'; pg.beginPath(); pg.arc(...P(sd * 32 + 6, -174), 5 * fs, 0, TAU); pg.fill(); });   // 瞳孔一点黄
    pg.strokeStyle = '#140E24'; pg.lineWidth = 8 * u;
    pg.beginPath(); pg.ellipse(...P(0, -150), 80 * fs, 120 * fs, 0, 0, TAU); pg.stroke();
    pg.beginPath(); pg.moveTo(...P(-150, 420)); pg.quadraticCurveTo(...P(-160, 20), ...P(-60, -40)); pg.moveTo(...P(60, -40)); pg.quadraticCurveTo(...P(160, 20), ...P(150, 420)); pg.stroke();
    pg.lineWidth = 12 * u; pg.strokeStyle = '#3A1A14';
    const gx0 = fx - 165 * fs, gx1 = fx + 165 * fs;   // 栏杆在人身后断开
    for (const [a, b] of [[0, gx0], [gx1, W]]) { pg.beginPath(); pg.moveTo(a, rail(a) - 62 * u); pg.lineTo(b, rail(b) - 62 * u); pg.stroke(); }
    for (let i = 0; i < 14; i++) { const x = (i + .5) / 14 * W; if (x > gx0 - 10 * u && x < gx1 + 10 * u) continue; pg.beginPath(); pg.moveTo(x, rail(x) - 62 * u); pg.lineTo(x - 10 * u, rail(x) + 10 * u); pg.stroke(); }
    return { u, paint, S: [...S, ...Sf] };   // 铺笔时脸的小笔排在最后
  },
  draw(ctx, t, s) {
    const { u } = s, p = eOutCubic(inv(.1, 2.2, t));
    if (p < 1) { ctx.fillStyle = '#2A1A5A'; ctx.fillRect(0, 0, W, H); drawStrokes(ctx, s.S, p, { style: 'dab' }); ctx.globalAlpha = smooth(1.7, 2.2, t); ctx.drawImage(s.paint, 0, 0); ctx.globalAlpha = 1; return; }   // 最后淡入眼睛、轮廓和栏杆
    // 按行错开：振幅随时间变大，波沿着竖直方向往上爬
    const amp = (6 + 34 * smooth(2.2, 4.6, t)) * u, band = Math.max(2, Math.round(4 * u));
    ctx.fillStyle = '#140E24'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += band) {
      const dx = Math.sin(y * .012 - t * 3.2) * amp + Math.sin(y * .031 + t * 1.7) * amp * .35;
      ctx.drawImage(s.paint, 0, y, W, band, dx - amp * 1.5, y, W + amp * 3, band);   // 略拉宽，两边不露底
    }
  }
});
