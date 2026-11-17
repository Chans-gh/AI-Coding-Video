// C-050 科幻情景喜剧卡通：Canvas 2D 把实验室、机器、外星小助手都写成一个个多边形，描边统一粗黑；每 2 帧换一个随机种子把所有顶点抖 1–2 像素，画面一直轻轻“沸腾”；绿色传送门是几圈错开转动的椭圆；每过一次传送门整套配色表换掉（墙、地板、机器、角色全换），只有传送门的绿不变，底部字幕一句一句冷冷地说。
// 风格提示词：用成人向科幻情景喜剧卡通风格：粗黑描边每帧轻微抖动、平涂无渐变，实验室里堆满稀奇古怪的装置，一个发光的绿色传送门，每个平行宇宙换一套完全不同的配色，对白驱动的冷幽默。
// 题材：卡通与动漫 · 适合：成人向搞笑
scene({
  id: 'C-050', name: '科幻情景喜剧卡通', dur: 5, still: 3.6,
  fonts: ["700 60px 'Noto Sans SC'"],
  text: '按一下，就回家。第37号宇宙。第112号。这里的冰箱有牙。……也行，就这儿吧。',
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, INK = '#151515', B = f >> 1, A = (LAND ? 1 : 1.6) * u;
    const SW = [1.6, 2.4, 3.2], ui = SW.filter(x => t >= x).length;
    const PAL = [
      { wall: '#6E8C7A', tile: '#5E7A69', floor: '#4A4038', mach: '#C9C2A8', acc: '#E0603A', body: '#B8E07A', bench: '#8A5A3A' },
      { wall: '#D46AA8', tile: '#BC5592', floor: '#3C2156', mach: '#7FD6E8', acc: '#FFE14D', body: '#FF9E5E', bench: '#5E2A7A' },
      { wall: '#F2A13B', tile: '#D88A2A', floor: '#2A4A6A', mach: '#3BD1C4', acc: '#7A2BD6', body: '#8EA6FF', bench: '#B4442A' },
      { wall: '#E8E4D8', tile: '#D3CEC0', floor: '#26262E', mach: '#3A3A3A', acc: '#E8102E', body: '#F2F2F2', bench: '#6A6A6A' }][ui];
    let idx = 0;
    const jit = () => { const R = mulberry32(B * 7919 + (idx++) * 131 + 50); return () => (R() - .5) * 3.2 * u; };
    const shape = (pts, fill, ol = 7) => { const J = jit(); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x + J(), y + J()) : ctx.moveTo(x + J(), y + J())); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (ol) { ctx.lineWidth = ol * u; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(); } };
    const ell = (x, y, rx, ry, n = 30, a0 = 0) => Array.from({ length: n }, (_, k) => [x + Math.cos(a0 + k / n * TAU) * rx, y + Math.sin(a0 + k / n * TAU) * ry]);
    const box = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    const limb = (pts, col, w) => { const J = jit(), q = pts.map(([x, y]) => [x + J(), y + J()]); ctx.lineCap = ctx.lineJoin = 'round'; [[INK, w + 14], [col, w]].forEach(([c, lw]) => { ctx.strokeStyle = c; ctx.lineWidth = lw * u; ctx.beginPath(); q.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }); };
    // 墙、瓷砖、地板
    const fy = LAND ? H * .74 : H * .72;
    ctx.fillStyle = PAL.wall; ctx.fillRect(0, 0, W, fy);
    ctx.strokeStyle = PAL.tile; ctx.lineWidth = 6 * u; const ts = 120 * u;
    for (let x = 0; x < W; x += ts) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, fy); ctx.stroke(); }
    for (let y = ts; y < fy; y += ts) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    shape([[-20, fy], [W + 20, fy], [W + 20, H + 20], [-20, H + 20]], PAL.floor);
    // 传送门：先算开合
    const pcx = LAND ? W * .78 : W * .64, pcy = LAND ? H * .44 : H * .27, prx = (LAND ? 180 : 300) * u, pry = (LAND ? 250 : 380) * u;
    const po = t < 1.2 ? 0 : eOutBack(clamp((t - 1.2) / .35), 2.2) * (1 + .03 * Math.sin(t * 9));
    if (po > 0) {
      const gg = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, pry * 2.2 * po); gg.addColorStop(0, 'rgba(124,255,79,.45)'); gg.addColorStop(1, 'rgba(124,255,79,0)');
      ctx.fillStyle = gg; ctx.fillRect(0, 0, W, fy);
      for (let k = 0; k < 6; k++) {
        const sc = po * (1 - k * .14), ox = Math.sin(t * 3 + k) * 8 * u, oy = Math.cos(t * 2.4 + k) * 8 * u;
        ctx.save(); ctx.translate(pcx + ox, pcy + oy); ctx.rotate(t * (k % 2 ? -1.6 : 2.2) + k);
        shape(ell(0, 0, prx * sc, pry * sc * (1 - k * .02), 26).map(([x, y], i) => [x * (1 + .06 * Math.sin(i * 1.7 + t * 6)), y * (1 + .06 * Math.sin(i * 1.7 + t * 6))]), k % 2 ? '#3FD13A' : '#8CFF5C', k ? 0 : 8);
        ctx.restore();
      }
      ctx.fillStyle = '#E8FFD8'; ctx.beginPath(); ctx.ellipse(pcx, pcy, prx * .18 * po, pry * .18 * po, 0, 0, TAU); ctx.fill();
    }
    // 机器：像旧冰箱，舷窗里转着液体，表盘指针乱摆，灯泡闪
    const mx = LAND ? W * .06 : W * .04, mw = (LAND ? 300 : 340) * u, mh = (LAND ? 520 : 780) * u, my = fy - mh + 10 * u;
    shape(box(mx, my, mw, mh), PAL.mach);
    shape(box(mx + mw * .06, my + mh * .45, mw * .88, 8 * u), INK, 0);
    const pw = mx + mw * .5, ph = my + mh * .24;
    shape(ell(pw, ph, 80 * u, 80 * u), INK);
    shape(ell(pw, ph, 66 * u, 66 * u, 24, t * 3), PAL.acc, 0);
    ctx.save(); ctx.translate(pw, ph); ctx.rotate(t * 4); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-50 * u, -8 * u, 70 * u, 16 * u); ctx.restore();
    (ui === 3 ? [] : [[.25, .62], [.62, .62]]).forEach(([a, b], k) => { const dx = mx + mw * a + 30 * u, dy = my + mh * b; shape(ell(dx, dy, 42 * u, 42 * u, 20), '#F4F1E6'); const ang = -2.4 + 1.6 * (1 + Math.sin(t * (k ? 7 : 4.3) + k)) ; limb([[dx, dy], [dx + Math.cos(ang) * 34 * u, dy + Math.sin(ang) * 34 * u]], PAL.acc, 2); });
    for (let k = 0; k < 4; k++) shape(ell(mx + mw * (.2 + k * .2), my + mh * .82, 16 * u, 16 * u, 12), ((B + k) % 3) ? '#F4F1E6' : PAL.acc, 5);
    if (ui === 3) {   // 这一宇宙的“冰箱”长着牙
      const tx = mx + mw * .12, tw = mw * .76, ty = my + mh * .56;
      shape([[tx, ty], [tx + tw, ty], [tx + tw, ty + 70 * u], [tx, ty + 70 * u]], '#000');
      const teeth = []; for (let k = 0; k <= 8; k++) teeth.push([tx + k / 8 * tw, ty + (k % 2 ? 34 : 0) * u]); teeth.push([tx + tw, ty], [tx, ty]);
      shape(teeth, '#FFFFFF', 4);
      const bot = []; for (let k = 0; k <= 8; k++) bot.push([tx + k / 8 * tw, ty + (k % 2 ? 36 : 70) * u]); bot.push([tx + tw, ty + 70 * u], [tx, ty + 70 * u]);
      shape(bot, '#FFFFFF', 4);
    }
    // 工作台 + 冒泡的试管（横屏）
    if (LAND) {
      const bx = W * .3, bw = W * .2, by = fy - 200 * u;
      shape(box(bx, by, bw, 28 * u), PAL.bench); shape(box(bx + 20 * u, by + 28 * u, 24 * u, 172 * u), PAL.bench); shape(box(bx + bw - 44 * u, by + 28 * u, 24 * u, 172 * u), PAL.bench);
      [0, 1, 2].forEach(k => { const x = bx + 60 * u + k * 80 * u; shape([[x, by - 150 * u], [x + 36 * u, by - 150 * u], [x + 36 * u, by - 20 * u], [x + 18 * u, by], [x, by - 20 * u]], '#EAF6F4'); shape([[x + 4 * u, by - 80 * u + k * 20 * u], [x + 32 * u, by - 80 * u + k * 20 * u], [x + 32 * u, by - 22 * u], [x + 18 * u, by - 4 * u], [x + 4 * u, by - 22 * u]], [PAL.acc, '#8CFF5C', PAL.body][k], 0); const bb = ((t * 1.3 + k * .37) % 1); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 18 * u + Math.sin(bb * 9) * 5 * u, by - 40 * u - bb * 110 * u, 6 * u, 0, TAU); ctx.fill(); });
    }
    // 电线：从机器爬到传送门
    limb([[mx + mw, fy - 40 * u], [lerp(mx + mw, pcx, .4), fy + 30 * u], [lerp(mx + mw, pcx, .8), fy + 10 * u], [pcx, fy - 6 * u]], '#333', 6);
    // 外星小助手：三只眼的梨形，姿势按关键帧整张替换
    const ax = LAND ? W * .56 : W * .64, ay = fy - 10 * u, bob = (B % 4 < 2 ? 0 : 3) * u;
    const pose = t < 1.05 ? 0 : t < 1.4 ? 1 : t < 4.3 ? 2 : 3;   // 0 举遥控 1 按下 2 东张西望 3 摊手
    const bodyY = ay - 150 * A + bob;
    shape(ell(ax, ay + 4 * u, 120 * A, 18 * A, 18), 'rgba(0,0,0,.25)', 0);
    [-1, 1].forEach(sd => limb([[ax + sd * 40 * A, ay - 50 * A], [ax + sd * 46 * A, ay]], PAL.body, 18 * A / u));
    shape(ell(ax, bodyY, 105 * A, 150 * A, 34).map(([x, y]) => [x + (y > bodyY ? (x - ax) * .18 : -(x - ax) * .1 * (bodyY - y) / (150 * A)), y]), PAL.body);
    const arm = [
      [[[-90, -10], [-150, 30], [-170, 90]], [[90, -10], [150, -40], [175, -110]]],
      [[[-90, -10], [-150, 30], [-170, 90]], [[90, -10], [160, -20], [180, -50]]],
      [[[-90, -10], [-150, 40], [-150, 100]], [[90, -10], [150, 30], [160, 90]]],
      [[[-90, -10], [-170, -40], [-210, -120]], [[90, -10], [170, -40], [210, -120]]]][pose];
    arm.forEach(seg => limb(seg.map(([x, y]) => [ax + x * A, bodyY + y * A]), PAL.body, 22 * A / u));
    if (pose < 2) { const hx = ax + (pose ? 180 : 175) * A, hy = bodyY + (pose ? -50 : -110) * A; shape(box(hx - 22 * A, hy - 40 * A, 44 * A, 70 * A), '#333'); shape(ell(hx, hy - 15 * A, 10 * A, 10 * A, 10), pose ? '#FFF' : '#E8102E', 3); }
    // 三只眼：白圆 + 不规则小瞳孔
    const look = [[0, 0], [0, -6], [[-14, 0], [14, 4], [-10, -8]][Math.min(2, Math.max(0, ui - 1))] || [0, 0], [0, 6]][pose];
    const blink = (t % 1.7) > 1.62;
    [[-48, -60, 34], [0, -100, 30], [48, -60, 34]].forEach(([ex, ey, r], k) => {
      const X = ax + ex * A, Y = bodyY + ey * A;
      if (blink) { limb([[X - r * A, Y], [X + r * A, Y]], INK, 2); return; }
      shape(ell(X, Y, r * A, r * A, 18), '#FFFFFF', 6);
      const R2 = mulberry32(k + 9), pp = Array.from({ length: 5 }, (_, i) => { const a = i / 5 * TAU, rr2 = (6 + R2() * 4) * A; return [X + look[0] * A + Math.cos(a) * rr2, Y + look[1] * A + Math.sin(a) * rr2]; });
      shape(pp, INK, 0);
    });
    // 嘴：松散的一笔，摊手时歪成一条斜线
    const mo = pose === 3 ? [[-40, 40], [0, 34], [40, 22]] : pose === 1 ? [[-30, 30], [0, 44], [30, 30]] : [[-34, 34], [-10, 38], [14, 33], [36, 36]];
    limb(mo.map(([x, y]) => [ax + x * A, bodyY + y * A]), INK, 1);
    // 宇宙切换：两帧绿光
    SW.forEach(x => { const k = (t - x) / .12; if (k >= 0 && k < 1) { ctx.fillStyle = `rgba(140,255,92,${.85 * (1 - k)})`; ctx.fillRect(0, 0, W, H); } });
    // 字幕：冷冷的一句
    const SUB = [[.2, 1.45, '按一下，就回家。'], [1.65, 2.35, '第 37 号宇宙。'], [2.45, 3.15, '第 112 号。'], [3.25, 4.25, '这里的冰箱有牙。'], [4.35, 5.1, '……也行，就这儿吧。']];
    const sub = SUB.find(([a, b]) => t >= a && t < b);
    if (sub) {
      ctx.font = `700 ${Math.round((LAND ? 58 : 62) * u)}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      const sy2 = LAND ? H - 70 * u : H - 150 * u;
      ctx.lineWidth = 12 * u; ctx.strokeStyle = INK; ctx.strokeText(sub[2], W / 2, sy2); ctx.fillStyle = '#FFF6C8'; ctx.fillText(sub[2], W / 2, sy2);
    }
    ctx.font = `700 ${Math.round(34 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillText(['C-000', 'C-037', 'C-112', 'C-404'][ui], 40 * u, 60 * u);
  }
});
