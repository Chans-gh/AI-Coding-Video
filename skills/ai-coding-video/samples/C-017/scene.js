// C-017 麻胶版画：红黑两色平涂，山体里用一组波浪白线当刻刀痕，整版再用固定的随机墨点抠出斑驳；
// 动作按每秒 8 格量化出版画的顿挫，开头像揭开刚压好的版。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-017', name: '麻胶版画', dur: 3, still: 2.4,
  fonts: ["900 40px 'Noto Sans SC'"],
  text: '一句话就够',
  init() {
    const spk = mk(W, H), g = spk.getContext('2d'), R = mulberry32(26);
    for (let i = 0; i < 9000; i++) { g.fillStyle = '#000'; g.globalAlpha = .5 + R() * .5; g.fillRect(R() * W, R() * H, 1 + R() * 4, 1 + R() * 2); }
    return { paper: makePaper('#ECE4D2', { seed: 261, grain: 16, blot: 10 }), spk, L: mk(W, H) };
  },
  draw(ctx, t, s, f) {
    const tt = stepT(t, 8), st = Math.floor(t * 8);
    ctx.drawImage(s.paper, 0, 0, W, H);
    const L = s.L, g = L.getContext('2d'); g.clearRect(0, 0, W, H);
    const red = '#C8302A', blk = '#141210';
    // 构图：竖屏沿用原版（标题在上、太阳居中、山在下）；横屏标题放左上，太阳移到右侧，山横向拉开、整体上移
    const P = LAND ? { sun: [1330, 450], sx: W / 1080, dy: -330, hd: [560, 300], cy: 560, r0: 0, rs: 1180 } : { sun: [540, 820], sx: 1, dy: 0, hd: [540, 470], cy: 620, r0: 250, rs: 1700 };
    const [ux, uy] = P.sun, M = (x, y) => [x * P.sx, y + P.dy];
    // red sun + rays
    g.fillStyle = red; g.save(); g.translate(ux, uy); g.rotate(tt * .15);
    for (let k = 0; k < 16; k++) { g.rotate(TAU / 16); g.beginPath(); g.moveTo(0, 0); g.lineTo(-40, -900); g.lineTo(40, -900); g.closePath(); if (k % 2) g.fill(); }
    g.restore(); g.fillStyle = '#ECE4D2'; g.beginPath(); g.arc(ux, uy, 330, 0, TAU); g.fill();
    g.fillStyle = red; g.beginPath(); for (let i = 0; i <= 80; i++) { const a = i / 80 * TAU; const r = 290 + (hash1(i * 7 + (st % 2)) - .5) * 10; g.lineTo(ux + Math.cos(a) * r, uy + Math.sin(a) * r); } g.fill();
    // black mountains with gouge marks
    const mp = new Path2D(); [[0, 1300], [0, 1000], [220, 860], [360, 960], [560, 780], [760, 980], [900, 900], [1080, 1010], [1080, 1300]].forEach(([x, y], i) => mp[i ? 'lineTo' : 'moveTo'](...M(x, y))); mp.closePath();
    g.fillStyle = blk; g.fill(mp);
    g.save(); g.clip(mp); g.strokeStyle = '#ECE4D2'; g.lineCap = 'round';
    for (let k = 0; k < 16; k++) { g.lineWidth = 2 + (k % 3) * 2; g.beginPath(); for (let x = -20; x <= W + 20; x += 30) g.lineTo(x, 900 + P.dy + k * 26 + Math.sin(x * .01 + k) * 20 + (x % 60 === 0 ? 4 : -4) + Math.abs(x / P.sx - 560) * .25); g.stroke(); }
    g.restore();
    // crane
    const cx = lerp(-100, W + 100, t / 3), cy = P.cy - Math.sin(t) * 40, fl = (st % 2) ? 1 : -.6;
    g.save(); g.translate(cx, cy); g.fillStyle = blk;
    g.beginPath(); g.ellipse(0, 0, 70, 22, -.1, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-20, -5); g.lineTo(-120, -150 * fl); g.lineTo(-40, -150 * fl); g.lineTo(30, -5); g.fill();
    g.lineWidth = 8; g.strokeStyle = blk; g.beginPath(); g.moveTo(60, -10); g.quadraticCurveTo(110, -30, 140, -20); g.stroke(); g.beginPath(); g.moveTo(-60, 5); g.lineTo(-170, 30); g.stroke();
    g.fillStyle = red; g.beginPath(); g.arc(140, -26, 9, 0, TAU); g.fill(); g.restore();
    // headline
    g.fillStyle = blk; g.font = "900 150px 'Noto Sans SC'"; g.textAlign = 'center'; g.fillText('一句话就够', ...P.hd);
    g.fillStyle = red; g.fillRect(P.hd[0] - 370, P.hd[1] + 35, 740, 18);
    g.save(); g.globalCompositeOperation = 'destination-out'; g.translate((st % 3) * 7, (st % 2) * 5); g.drawImage(s.spk, 0, 0); g.restore();
    // print-pull reveal
    const rv = eOutCubic(inv(0, .55, t)); g.save(); g.globalCompositeOperation = 'destination-in'; g.fillRect(0, 0, W, P.r0 + rv * P.rs); g.restore();
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(L, 0, 0); ctx.restore();
    if (rv < 1) { const ry = P.r0 + rv * P.rs - 30; ctx.fillStyle = '#2A2622'; ctx.fillRect(0, ry, W, 60); ctx.fillStyle = '#5C544C'; ctx.fillRect(0, ry, W, 12); }
  }
});
