// C-023 金色马赛克：在鱼的轮廓里按网格取点，每点一块金色方砖，砖从四周旋转着飞来拼成鱼；
// 拼好后整条鱼按正弦波摆尾，每块砖各自按相位闪一下高光。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-023', name: '金色马赛克', dur: 3, still: 2.4,
  fonts: [],
  init() {
    // 构图：竖屏鱼放在画面正中；横屏鱼放大 1.2 倍放在画面正中，马赛克从四周飞来的范围横向拉开
    const k = LAND ? 1.2 : 1, cx = LAND ? W / 2 : 620, cy = LAND ? H / 2 : 960, M = (x, y) => [(x - 620) * k + cx, (y - 830) * k + cy];
    const [ex, ey] = M(330, 770), [bx, by] = M(700, 850), tailX = M(230, 0)[0];
    const pts = samplePoints(g => {
      g.translate(cx, cy); g.scale(k, k); g.translate(-620, -830);
      g.fillStyle = '#000'; g.beginPath(); g.moveTo(230, 800); g.bezierCurveTo(250, 640, 520, 600, 700, 700); g.bezierCurveTo(780, 740, 830, 760, 880, 700);
      g.lineTo(980, 610); g.quadraticCurveTo(960, 700, 1010, 780); g.lineTo(890, 780); g.bezierCurveTo(820, 860, 600, 960, 420, 930); g.bezierCurveTo(300, 910, 225, 880, 230, 800); g.fill();
      g.beginPath(); g.moveTo(440, 900); g.quadraticCurveTo(420, 1030, 520, 1060); g.quadraticCurveTo(500, 980, 520, 910); g.fill();
    }, 15, 32);
    const R = mulberry32(32), tiles = pts.map(([x, y], i) => {
      const a = R() * TAU, r = 300 + R() * 900; const eye = Math.hypot(x - ex, y - ey) < 22 * k, belly = y > by && x < bx;
      return { x, y, sx: W / 2 + Math.cos(a) * r * (LAND ? 1.4 : 1), sy: H / 2 + Math.sin(a) * r * (LAND ? 1 : 1.4), d: R() * .6, c: eye ? [20, 40, 90] : belly ? hex2rgb(['#F6E7B6', '#EBD79A'][i % 2]) : hex2rgb(['#C9982E', '#E8C15A', '#F6DC8C', '#A87A22', '#D9AE45'][Math.floor(R() * 5)]), ph: R() * TAU, s: 12 + R() * 3 };
    });
    const bub = []; for (let i = 0; i < 90; i++) bub.push([R() * W, R() * H, R(), R() * TAU]);
    return { tiles, bub, tailX, span: 780 * k };
  },
  draw(ctx, t, s) {
    const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 1100); g.addColorStop(0, '#2A1E10'); g.addColorStop(1, '#070504'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const [x, y, r, p] of s.bub) { const yy = ((y - t * 60 * (r + .3)) % H + H) % H; ctx.fillStyle = `rgba(232,193,90,${.15 + .25 * r})`; ctx.fillRect(x + Math.sin(t * 2 + p) * 10, yy, 7, 7); }
    const swim = t;
    for (const q of s.tiles) {
      const k = eInOutCubic(inv(q.d, q.d + 1.1, t));
      const wave = Math.sin(q.x * .012 - swim * 4) * 26 * ((q.x - s.tailX) / s.span) * k;
      const tx = q.x + Math.sin(swim * 1.2) * 20, ty = q.y + wave - 30 * Math.sin(swim * .9);
      const va = (1 - k) * 4 + q.ph; const x = lerp(q.sx, tx, k) + Math.cos(va) * (1 - k) * 80, y = lerp(q.sy, ty, k) + Math.sin(va) * (1 - k) * 80;
      const glint = Math.pow(Math.max(0, Math.sin(t * 3 + q.x * .02 - q.y * .01 + q.ph * .3)), 12);
      const L = .75 + .6 * glint; ctx.fillStyle = `rgb(${q.c.map(v => Math.min(255, v * L + glint * 60)).join(',')})`;
      const w = q.s * (.7 + .3 * Math.abs(Math.cos(q.ph + t * 2 * (1 - k))));
      ctx.fillRect(x - w / 2, y - q.s / 2, w, q.s);
    }
  }
});
