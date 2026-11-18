// C-138 后印象派厚涂：山坡上的小屋、路灯和星空先画成色块底图，方向场按区域定（墙竖排、屋顶顺坡、路朝消失点、天空绕两个漩涡），strokePlan 铺满带暗边和高光的厚涂短笔，整张在 init 里画好；前 3 秒按 k 一笔笔铺上来，之后直接贴画好的整张；会动的只有：深蓝粗轮廓线每 4 帧抖一下，灯和星外一圈圈光晕往外扩。
// 风格提示词：用后印象派厚涂风格：画面由一根根方向明确的短粗油彩笔触铺满，墙面竖排、地面顺着透视、天空绕着漩涡打转，同一区域里混用十几种相近色相，钴蓝和铬黄互补对撞，轮廓用深蓝粗线勾出并每隔几帧轻轻抖动，灯和星星外有一圈圈光晕向外扩，转场是漩涡把画面卷走。
// 题材：绘画流派 · 适合：情绪 MV、艺术史讲解、夜景与乡村
scene({
  id: 'C-138', name: '后印象派厚涂', dur: 5, still: 3.6,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    // 构图：横屏小屋在右、路灯在左、路从左下伸向屋门；竖屏小屋在中下、天空占上半
    const hill = x => (LAND ? H * .6 : H * .58) - Math.sin(x / W * 2.6 + .4) * 50 * u;
    const hx = LAND ? W * .64 : W * .55, hs = (LAND ? 1 : 1.2) * u, hy = hill(hx) + 30 * hs;    // 小屋底边中点
    const house = { x0: hx - 180 * hs, x1: hx + 180 * hs, y0: hy - 230 * hs, y1: hy, top: hy - 380 * hs };
    const door = [hx + 60 * hs, hy], lamp = [LAND ? W * .3 : W * .2, LAND ? H * .44 : H * .5], post = (LAND ? 1 : 1.2) * u;
    const moon = LAND ? [W * .86, H * .15] : [W * .78, H * .12];
    const stars = [[.08, .1], [.22, .26], [.36, .08], [.5, .3], [.62, .12], [.72, .32], [.12, .4], [.94, .36]].map(([x, y]) => [x * W, y * hill(x * W) * .95]);
    const wins = [[-130, -170], [-130, -90], [-40, -170], [110, -170]].map(([x, y]) => [hx + x * hs, hy + y * hs, 50 * hs, 56 * hs]);
    const M = paintMap(g => {
      const sky = g.createLinearGradient(0, 0, 0, H * .6); sky.addColorStop(0, '#1C2E6E'); sky.addColorStop(1, '#3C68B0');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.filter = `blur(${40 * u}px)`; g.fillStyle = '#5A88C8';
      g.beginPath(); g.ellipse(W * .45, H * .18, W * .25, H * .07, -.1, 0, TAU); g.fill(); g.filter = 'none';
      for (const [x, y] of stars) { const gr = g.createRadialGradient(x, y, 0, x, y, 70 * u); gr.addColorStop(0, '#FCEB8A'); gr.addColorStop(.35, '#E9C64A'); gr.addColorStop(1, 'rgba(60,104,176,0)'); g.fillStyle = gr; g.fillRect(x - 80 * u, y - 80 * u, 160 * u, 160 * u); }
      const mg = g.createRadialGradient(...moon, 0, ...moon, 150 * u); mg.addColorStop(0, '#FBE27A'); mg.addColorStop(.5, '#F0C23A'); mg.addColorStop(1, 'rgba(60,104,176,0)'); g.fillStyle = mg; g.fillRect(0, 0, W, H);
      g.fillStyle = '#2A4A3A'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, hill(x)); g.lineTo(W, H); g.fill();
      const gr = g.createLinearGradient(0, hill(0), 0, H); gr.addColorStop(0, '#3E6A3A'); gr.addColorStop(1, '#6A7A2A'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, hill(x) + 30 * u); g.lineTo(W, H); g.fill();
      g.fillStyle = '#C8A04A'; g.beginPath(); g.moveTo(door[0] - 20 * hs, hy); g.lineTo(door[0] + 20 * hs, hy); g.lineTo(LAND ? W * .5 : W * .85, H); g.lineTo(LAND ? W * .05 : W * .2, H); g.fill();   // 路
      g.fillStyle = '#C9B08A'; g.fillRect(house.x0, house.y0, house.x1 - house.x0, house.y1 - house.y0);                           // 墙
      g.fillStyle = '#8A6A5A'; g.fillRect(hx + 40 * hs, house.y0, house.x1 - hx - 40 * hs, house.y1 - house.y0);
      g.fillStyle = '#B4462E'; g.beginPath(); g.moveTo(house.x0 - 30 * hs, house.y0); g.lineTo(hx - 40 * hs, house.top); g.lineTo(hx + 80 * hs, house.top); g.lineTo(house.x1 + 30 * hs, house.y0); g.fill();   // 屋顶
      g.fillStyle = '#F5C83A'; wins.forEach(w => g.fillRect(...w)); g.fillStyle = '#3A2A3A'; g.fillRect(door[0] - 28 * hs, hy - 110 * hs, 56 * hs, 110 * hs);
      const lg = g.createRadialGradient(...lamp, 0, ...lamp, 200 * u); lg.addColorStop(0, '#FFF0A0'); lg.addColorStop(.3, '#F2C23A'); lg.addColorStop(1, 'rgba(242,194,58,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
      g.fillStyle = '#1E2A4A'; g.fillRect(lamp[0] - 8 * post, lamp[1], 16 * post, H);
    }, { res: 4, blur: 4 * u });
    const inside = (x, y, r) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1;
    const F = flowField({ res: 14, noise: .3, scale: .004, swirl: [[W * .45, H * .18, 260 * u, 1], [W * .2, H * .12, 180 * u, -1], [...moon, 190 * u, 1], [...lamp, 120 * u, 1]], fn: (x, y, a) => {
      if (inside(x, y, house)) return Math.PI / 2 + (a - Math.PI / 2) * .15;                   // 墙：竖
      if (y < house.y0 + 4 * hs && y > house.top - 10 * hs && x > house.x0 - 40 * hs && x < house.x1 + 40 * hs) return x < hx + 20 * hs ? -.9 : .9;   // 屋顶：顺坡
      if (y > hill(x) + 20 * u) return Math.atan2(door[1] - y, door[0] - x);                 // 地面：朝屋门透视
      return a;                                                                                 // 天空：漩涡 + 噪声
    } });
    const S = strokePlan(M, F, { gap: 15 * u, len: [26 * u, 44 * u], width: [11 * u, 15 * u], jitter: .14, spread: .15, follow: 2, layers: 2, detail: .07, seed: 8,
      tint: (x, y, c, R) => R() < .12 ? (c[2] > c[0] ? [lerp(c[0], 40, .4), lerp(c[1], 80, .4), lerp(c[2], 200, .4)] : [lerp(c[0], 245, .4), lerp(c[1], 200, .4), lerp(c[2], 40, .4)]) : c });   // 钴蓝、铬黄
    const paint = mk(W, H), pg = paint.getContext('2d');
    pg.fillStyle = '#1C2E6E'; pg.fillRect(0, 0, W, H);
    drawStrokes(pg, S, 1, { style: 'impasto' });
    // 深蓝轮廓线
    const ol = [[[house.x0, house.y1], [house.x0, house.y0], [house.x1, house.y0], [house.x1, house.y1], [house.x0, house.y1]],
      [[house.x0 - 30 * hs, house.y0], [hx - 40 * hs, house.top], [hx + 80 * hs, house.top], [house.x1 + 30 * hs, house.y0]],
      Array.from({ length: 30 }, (_, i) => [W * i / 29, hill(W * i / 29)]), [[lamp[0], lamp[1] + 20 * u], [lamp[0], H]],
      [[door[0] - 20 * hs, hy], [LAND ? W * .05 : W * .2, H]], [[door[0] + 20 * hs, hy], [LAND ? W * .5 : W * .85, H]],
      ...wins.map(([x, y, w, h]) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]])];
    S.forEach(q => q.k = q.k * .6 + (q.y / H) * .4); S.sort((a, b) => a.k - b.k);   // 大致从上往下、按层铺
    return { u, S, paint, ol, lamp, moon, stars };
  },
  draw(ctx, t, s) {
    const { u } = s, st = Math.floor(t * 30 / 4);                                               // 每 4 帧换一次抖动
    const p = eOutCubic(inv(.1, 3, t));
    if (p < 1) { ctx.fillStyle = '#1C2E6E'; ctx.fillRect(0, 0, W, H); drawStrokes(ctx, s.S, p, { style: 'impasto' }); } else ctx.drawImage(s.paint, 0, 0);
    ctx.save(); ctx.globalAlpha = smooth(1.6, 3, t); ctx.strokeStyle = '#13245A'; ctx.lineWidth = 9 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha *= .85;
    s.ol.forEach((pts, i) => { ctx.beginPath(); pts.forEach(([x, y], j) => { const jx = (hash2(st * 31 + i, j) - .5) * 5 * u, jy = (hash2(j * 17 + i, st) - .5) * 5 * u; j ? ctx.lineTo(x + jx, y + jy) : ctx.moveTo(x + jx, y + jy); }); ctx.stroke(); });
    ctx.restore();
    // 光晕：一圈圈往外扩、变淡
    const halo = ([x, y], r0, n, col, sp) => { ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) { const ph = (t * sp + i / n) % 1, r = r0 * (1 + ph * 2.2);
        ctx.globalAlpha = (1 - ph) * .7 * smooth(1.2, 2.4, t); ctx.strokeStyle = col; ctx.lineWidth = r0 * .16 * (1 - ph * .5); ctx.setLineDash([r0 * .3, r0 * .14]); ctx.lineDashOffset = -t * 40 * u * (i % 2 ? 1 : -1);
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
      ctx.restore(); };
    halo(s.lamp, 46 * u, 3, '#F6D24A', .35);
    halo(s.moon, 70 * u, 3, '#F2C23A', .25);
    s.stars.forEach((p, i) => halo(p, (18 + (i % 3) * 5) * u, 2, i % 2 ? '#F7E38A' : '#EBC64A', .3 + (i % 4) * .05));
  }
});
