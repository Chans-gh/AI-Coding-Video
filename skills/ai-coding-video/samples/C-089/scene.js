// C-089 碎色印象派：河湾午后的景先用色块画成底图，lib 的 strokePlan 按底图取色、按分区的方向场（水面横、天空顺云势斜、树竖）排几千个不透明短笔，三成的笔换成补色（暗处落蓝紫、亮处落橙金）并排放；笔触一笔笔落在亚麻底上不再修改，水面的亮点随时间明灭。
// 风格提示词：用印象派碎色笔触风格：亚麻底布上一小块一小块不混色的不透明色点，每一笔落下就不再修改，互补色并排放着让眼睛自己去混（橙玫瑰进蓝影、紫进金），水面用长而平的笔触、天空顺着云势排，全程没有轮廓线，形体就是色点停下来的地方。
// 题材：绘画流派 · 适合：风景、日出日落、旅行、艺术感广告
scene({
  id: 'C-089', name: '碎色印象派', dur: 5, still: 4.5,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    // 构图：横屏地平线在中间偏上、河从右下流进来；竖屏天空占上半、河在下半
    const hz = LAND ? H * .44 : H * .4, bank = LAND ? H * .58 : H * .54;
    const river = (x) => bank + (LAND ? 40 : 60) * u + Math.sin(x / W * 3 + .5) * 30 * u;
    const M = paintMap(g => {
      const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#5E86C4'); sky.addColorStop(.6, '#9DB8D8'); sky.addColorStop(1, '#F1D7A6');
      g.fillStyle = sky; g.fillRect(0, 0, W, hz + 20 * u);
      g.filter = `blur(${24 * u}px)`;
      [[.18, .14, .16], [.42, .22, .2], [.75, .12, .18], [.62, .3, .12]].forEach(([x, y, r]) => { g.fillStyle = '#F4E6E0'; g.beginPath(); g.ellipse(x * W, y * hz * 1.6, r * W, r * W * .28, -.1, 0, TAU); g.fill();
        g.fillStyle = '#C9A8C2'; g.beginPath(); g.ellipse(x * W + 30 * u, y * hz * 1.6 + 40 * u, r * W * .8, r * W * .12, -.1, 0, TAU); g.fill(); });
      g.filter = 'none';
      for (let i = 0; i < 26; i++) { const x = (i + .3 * hash1(i)) / 25 * W, hh = (90 + 120 * hash1(i * 7)) * u;              // 对岸一排杨树
        g.fillStyle = i % 3 ? '#3F6B48' : '#5D5A8A'; g.beginPath(); g.ellipse(x, hz - hh * .45, 24 * u + 14 * u * hash1(i * 3), hh * .6, 0, 0, TAU); g.fill(); }
      g.fillStyle = '#4D6E4A'; g.fillRect(0, hz - 10 * u, W, bank - hz + 10 * u);
      const fld = g.createLinearGradient(0, hz, 0, bank); fld.addColorStop(0, '#7E9A55'); fld.addColorStop(1, '#D9B65A');
      g.fillStyle = fld; g.fillRect(0, hz + 25 * u, W, H);
      g.fillStyle = '#4C7AB0'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, river(x)); g.lineTo(W, H); g.fill();
      const rf = g.createLinearGradient(0, river(W / 2), 0, H); rf.addColorStop(0, '#9DB8D8'); rf.addColorStop(1, '#2F558C');
      g.fillStyle = rf; g.globalAlpha = .6; g.fillRect(0, river(W / 2), W, H); g.globalAlpha = 1;
      g.save(); g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, river(x)); g.lineTo(W, H); g.lineTo(0, H); g.clip(); g.fillStyle = 'rgba(241,215,166,.8)'; g.beginPath(); g.ellipse(W * .62, river(W * .62) + 160 * u, 90 * u, 300 * u, 0, 0, TAU); g.fill(); g.restore();   // 天光在水里的倒影
      g.fillStyle = '#5B7F3E'; g.beginPath(); g.moveTo(0, H); g.lineTo(0, H * .82); g.quadraticCurveTo(W * .2, H * .8, W * .32, H); g.fill();     // 近岸草
    }, { res: 4, blur: 6 * u });
    const F = flowField({ res: 16, noise: .25, scale: .003, fn: (x, y, a) => {
      if (y < hz - 40 * u) return -.25 + Math.sin(x * .002 + y * .004) * .3;                 // 天空顺着云势斜排
      if (y < hz + 10 * u) return Math.PI / 2 + (a - Math.PI / 2) * .2;                       // 树：竖
      if (y < river(x)) return .1 + a * .2;                                                   // 田：略斜
      return a * .1;                                                                           // 水：长而平
    } });
    const water = (x, y) => y > river(x) + 6 * u;
    const tint = (x, y, c, R) => {                                                             // 补色并置：暗处落蓝紫、亮处落橙金
      if (R() > .3) return c;
      const l = (c[0] + c[1] + c[2]) / 765;
      return l < .45 ? [lerp(c[0], 110, .5), lerp(c[1], 80, .5), lerp(c[2], 170, .5)] : [lerp(c[0], 245, .45), lerp(c[1], 160, .45), lerp(c[2], 90, .45)];
    };
    const ord = (x, y, L) => L * .6 + (y / H) * .5 + hash2(Math.floor(x / 90), Math.floor(y / 90)) * .5;
    const S1 = strokePlan(M, F, { gap: 18 * u, len: [22 * u, 40 * u], width: [12 * u, 17 * u], jitter: .1, spread: .25, layers: 2, detail: .06, tint, order: ord, mask: (x, y) => !water(x, y), seed: 1 });
    const S2 = strokePlan(M, F, { gap: 13 * u, len: [50 * u, 90 * u], width: [9 * u, 12 * u], jitter: .12, spread: .05, tint, order: (x, y) => y / H + hash2(Math.floor(x / 70), Math.floor(y / 30)) * .4, mask: water, seed: 2 });
    const glint = Array.from({ length: 60 }, (_, i) => [W * (.48 + hash1(i * 3) * .28), river(W * .6) + (20 + hash1(i * 5) * 380) * u * (LAND ? .8 : 1.4), (30 + hash1(i * 7) * 50) * u, hash1(i * 11) * TAU]);
    return { u, S1, S2, glint, linen: makePaper('#C9B48E', { seed: 89, grain: 26, fiber: .9, blot: 4 }) };
  },
  draw(ctx, t, s) {
    const { u } = s;
    ctx.drawImage(s.linen, 0, 0, W, H);
    drawStrokes(ctx, s.S1, inv(.1, 3.4, t), { style: 'dab' });
    drawStrokes(ctx, s.S2, inv(1.2, 3.9, t), { style: 'dab' });
    // 水面碎光：亮色短笔，随时间明灭
    const gp = smooth(2.8, 3.6, t);
    if (gp > 0) { ctx.save(); ctx.lineCap = 'round';
      s.glint.forEach(([x, y, l, ph], i) => { const a = gp * (.5 + .5 * Math.sin(t * 4 + ph)); if (a < .05) return;
        ctx.globalAlpha = a; ctx.strokeStyle = i % 3 ? '#FBE7B0' : '#F2A86A'; ctx.lineWidth = 8 * u; ctx.beginPath(); ctx.moveTo(x - l / 2, y); ctx.lineTo(x + l / 2, y + 2 * u); ctx.stroke(); });
      ctx.restore(); }
  }
});
