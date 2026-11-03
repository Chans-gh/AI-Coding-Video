// C-011 沙画：两幅画各自在形状内部均匀取点，一粒沙对应一个点；前一幅画好后，每粒沙沿噪声场打着旋
// 流到后一幅的位置，像手指把沙推成新画面。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-011', name: '沙画', dur: 3, still: 2.4,
  fonts: [],
  init() {
    // 构图：竖屏沿用原版；横屏地面拉宽、压低，树和月亮往两边分开，第二幅的飞鸟和碗放在画面中间
    const L = LAND ? { gr: [900, 450, 700, 1000, 660, 760, 1010], tr: [300, -290], mo: [1380, 270], ln: [1150, 860], bi: [960, 400], bw: [960, 760] }
                   : { gr: [1260, 250, 980, 560, 930, 1060, 1300], tr: [0, 0], mo: [760, 560], ln: [650, 1150], bi: [540, 780], bw: [540, 1120] };
    const A = samplePoints(g => {
      const [y0, c1x, c1y, c2x, c2y, y1, yb] = L.gr, [tx, ty] = L.tr, [mx, my] = L.mo, [lx, ly] = L.ln;
      g.fillStyle = '#000'; g.beginPath(); g.moveTo(0, y0); g.bezierCurveTo(c1x, c1y, c2x, c2y, W, y1); g.lineTo(W, yb); g.lineTo(0, yb); g.fill();
      g.fillRect(335 + tx, 820 + ty, 26, 200); for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(348 + tx + Math.cos(k) * 70, 760 + ty + Math.sin(k * 1.7) * 55, 70, 0, TAU); g.fill(); }
      g.beginPath(); g.arc(mx, my, 120, 0, TAU); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(mx + 50, my - 40, 110, 0, TAU); g.fill();
      g.globalCompositeOperation = 'source-over'; g.fillRect(lx, ly, 220, 10); g.fillRect(lx + 50, ly + 30, 140, 8);
    }, 4, 5);
    const B = samplePoints(g => {
      g.fillStyle = '#000'; g.save(); g.translate(...L.bi);
      g.beginPath(); g.ellipse(0, 0, 150, 48, -.2, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(-40, -10); g.bezierCurveTo(-120, -200, -300, -330, -430, -300); g.bezierCurveTo(-300, -240, -200, -120, -80, 30); g.fill();
      g.beginPath(); g.moveTo(40, -20); g.bezierCurveTo(120, -230, 280, -360, 430, -340); g.bezierCurveTo(300, -260, 210, -120, 80, 20); g.fill();
      g.beginPath(); g.arc(150, -40, 44, 0, TAU); g.fill(); g.beginPath(); g.moveTo(186, -46); g.lineTo(250, -30); g.lineTo(188, -20); g.fill();
      g.beginPath(); g.moveTo(-140, 0); g.lineTo(-300, 60); g.lineTo(-250, 10); g.lineTo(-300, -30); g.fill();
      g.restore(); g.lineWidth = 30; g.strokeStyle = '#000'; g.beginPath(); g.arc(L.bw[0], L.bw[1], 240, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      g.fillRect(L.bw[0] - 340, L.bw[1] + 60, 680, 12);
    }, 4, 6);
    shuffle(A, 1); shuffle(B, 2);
    const N = Math.max(A.length, B.length), P = [];
    for (let i = 0; i < N; i++) { const a = A[i % A.length], b = B[i % B.length]; P.push([a[0], a[1], b[0], b[1], hash1(i * 13)]); }
    return { P };
  },
  draw(ctx, t, s) {
    const cx = W / 2, cy = LAND ? H * .45 : 820, g = ctx.createRadialGradient(cx, cy, 50, cx, cy, LAND ? 1250 : 1150); g.addColorStop(0, '#FFF1CF'); g.addColorStop(.5, '#F4C983'); g.addColorStop(1, '#9A5A22');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(48,26,10,.55)';
    for (const [ax, ay, bx, by, r] of s.P) {
      const k = eInOutCubic(inv(.95 + r * .35, 1.75 + r * .35, t));
      const sw = Math.sin(k * Math.PI);
      const x = lerp(ax, bx, k) + sw * (fbm(ax * .004, ay * .004 + 3, 2) - .5) * 500, y = lerp(ay, by, k) + sw * (fbm(ax * .004 + 9, ay * .004, 2) - .5) * 500;
      ctx.fillRect(x, y, 3.2, 3.2);
    }
    // finger groove: sweeping swirl cleared through the sand while morphing
    // 浮沙每秒换 12 次，台面上一直有细沙在动
    const R = mulberry32(3 + Math.floor(t * 12)); ctx.fillStyle = 'rgba(48,26,10,.35)';
    for (let i = 0; i < 1400; i++) ctx.fillRect(R() * W, R() * H, 2, 2);
  }
});
