// C-090 炭笔擦除重绘：先用画布渐变画出梨、投影、桌面和背景的明暗（只是灰度），再逐像素和带方向的纸纹噪声比较，暗处才挂得住炭粉，变成颗粒状的炭笔调子；每帧按时间叠：柳枝炭的辅助线、第一版调子、纸擦笔揉开（模糊版交叉淡入）、可塑橡皮用 destination-out 擦掉大半（留残影）、挪了位置的第二版、压缩炭条压出最黑的地方，再提几处高光。
// 风格提示词：用炭笔擦除重绘风格：厚棉纸上先用柳枝炭条轻轻起形、最后才用压缩炭条提黑，侧锋铺大调子、纸擦笔揉成雾气，每次修改都用可塑橡皮擦掉一部分再画在残影上，什么都不会被擦干净，只用一种暖黑和奶油白。
// 题材：手绘与绘画 · 适合：回忆与思考、艺术创作过程、静物与树木
function pear(g, cx, cy, s) {
  g.beginPath(); g.moveTo(cx - .1 * s, cy - 1.7 * s);
  g.bezierCurveTo(cx + .5 * s, cy - 1.7 * s, cx + .45 * s, cy - .9 * s, cx + .8 * s, cy - .55 * s);
  g.bezierCurveTo(cx + 1.25 * s, cy - .1 * s, cx + 1.1 * s, cy + .95 * s, cx, cy + .98 * s);
  g.bezierCurveTo(cx - 1.1 * s, cy + .95 * s, cx - 1.2 * s, cy - .1 * s, cx - .75 * s, cy - .6 * s);
  g.bezierCurveTo(cx - .45 * s, cy - .95 * s, cx - .65 * s, cy - 1.7 * s, cx - .1 * s, cy - 1.7 * s);
}
function charcoal(paint, seed, gain = 1) {
  // 灰度明暗 → 炭粉：暗度超过纸纹噪声的像素才上色，噪声带斜向的侧锋纹理
  const g0 = mk(W, H), a = g0.getContext('2d'); paint(a);
  const src = a.getImageData(0, 0, W, H).data, c = mk(W, H), g = c.getContext('2d'), id = g.createImageData(W, H), d = id.data, o = seed * 41.3;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, dk = src[i + 3] / 255 * gain; if (dk < .02) continue;
    const n = .55 * vnoise(x / 2.4 + o, y / 3.1) + .3 * vnoise((x + y) * .04 + o, (x - y) * .006) + .15 * hash2(x + seed, y);
    d[i] = 35; d[i + 1] = 28; d[i + 2] = 23; d[i + 3] = 255 * clamp((dk - n * .85 + .02) / .2);
  }
  g.putImageData(id, 0, 0); return c;
}
function blurred(c, r) { const b = mk(W, H), g = b.getContext('2d'); g.filter = `blur(${r}px)`; g.drawImage(c, 0, 0); return b; }
scene({
  id: 'C-090', name: '炭笔擦除重绘', dur: 5, still: 4.6,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    const P1 = LAND ? [W * .4, H * .56, 150 * u] : [W * .4, H * .53, 170 * u], P2 = LAND ? [W * .53, H * .55, 172 * u] : [W * .54, H * .52, 205 * u];
    const tone = ([cx, cy, s], bg) => a => {
      const ty = cy + .92 * s;
      if (bg) {   // 背景和桌面：侧锋大块铺
        a.lineCap = 'round'; const R = mulberry32(bg);
        for (let k = 0; k < 18; k++) { a.strokeStyle = `rgba(0,0,0,${.07 + R() * .07})`; a.lineWidth = (60 + R() * 60) * u; const y = R() * ty, x = W * (.45 + R() * .6); a.beginPath(); a.moveTo(x - 300 * u, y + 120 * u); a.lineTo(x + 300 * u, y - 120 * u); a.stroke(); }
        const tg = a.createLinearGradient(0, ty, 0, H); tg.addColorStop(0, 'rgba(0,0,0,.3)'); tg.addColorStop(1, 'rgba(0,0,0,.12)'); a.fillStyle = tg; a.fillRect(0, ty, W, H);
      }
      a.save(); a.filter = `blur(${14 * u}px)`; a.fillStyle = 'rgba(0,0,0,.75)'; a.beginPath(); a.ellipse(cx + .95 * s, ty, 1.35 * s, .22 * s, 0, 0, TAU); a.fill(); a.restore();
      pear(a, cx, cy, s); const rg = a.createRadialGradient(cx - .45 * s, cy - .5 * s, .05 * s, cx - .1 * s, cy, 1.3 * s);
      rg.addColorStop(0, 'rgba(0,0,0,.06)'); rg.addColorStop(.5, 'rgba(0,0,0,.45)'); rg.addColorStop(1, 'rgba(0,0,0,.92)'); a.fillStyle = rg; a.fill();
      a.strokeStyle = 'rgba(0,0,0,.7)'; a.lineWidth = 4 * u; a.stroke();
      a.beginPath(); a.moveTo(cx - .1 * s, cy - 1.7 * s); a.quadraticCurveTo(cx - .05 * s, cy - 1.95 * s, cx + .12 * s, cy - 2.08 * s); a.lineWidth = 9 * u; a.stroke();
    };
    const v1 = charcoal(tone(P1, 4), 1), v2 = charcoal(tone(P2), 2, 1.1);
    const darks = charcoal(a => {   // 压缩炭条：只压最暗的几处
      const [cx, cy, s] = P2; a.lineCap = 'round'; a.strokeStyle = '#000';
      a.filter = `blur(${2 * u}px)`; a.strokeStyle = 'rgba(0,0,0,.85)'; a.lineWidth = 14 * u; a.beginPath(); a.ellipse(cx + .1 * s, cy + .93 * s, .85 * s, .07 * s, 0, .15 * Math.PI, .85 * Math.PI); a.stroke();
      a.lineWidth = 12 * u; a.beginPath(); a.moveTo(cx + .9 * s, cy - .2 * s); a.bezierCurveTo(cx + 1.15 * s, cy + .3 * s, cx + .9 * s, cy + .9 * s, cx + .1 * s, cy + .98 * s); a.stroke();
      a.lineWidth = 11 * u; a.beginPath(); a.moveTo(cx - .1 * s, cy - 1.7 * s); a.quadraticCurveTo(cx - .05 * s, cy - 1.95 * s, cx + .12 * s, cy - 2.08 * s); a.stroke();
    }, 3, 1);
    // 柳枝炭辅助线
    const guides = [];
    for (const [cx, cy, s] of [P1, P2]) {
      guides.push(circlePts(cx, cy, s, 50, 0, TAU, .03, cx), circlePts(cx - .12 * s, cy - 1.05 * s, .6 * s, 40, 0, TAU, .03, cy), linePts(cx - .1 * s, cy - 2.1 * s, cx + .05 * s, cy + 1.15 * s, 10, 4 * u, 5), linePts(cx - 1.6 * s, cy + .92 * s, cx + 2.4 * s, cy + .9 * s, 12, 3 * u, 7));
    }
    // 可塑橡皮的擦痕（第一版的大半个梨）
    const [ex, ey, es] = P1, er = [];
    for (let k = 0; k < 11; k++) er.push([ex - 1.3 * es + (k % 2) * 2.5 * es, ey - 2.1 * es + k * .34 * es]);
    const lifts = [[P2[0] - .45 * P2[2], P2[1] - .45 * P2[2]], [P2[0] - .2 * P2[2], P2[1] - 1.2 * P2[2]], [P2[0] - .55 * P2[2], P2[1] + .1 * P2[2]]];
    return { v1, v1b: blurred(v1, 9 * u), v2, v2b: blurred(v2, 6 * u), darks, guides, er, es, lifts, P2, gt: toothMask(W, H, { cut: .5, scale: 2.5, seed: 8 }), lay: mk(W, H), gl: mk(W, H), paper: makePaper('#EFE6D3', { seed: 77, grain: 22, fiber: .35, blot: 8 }) };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, z = 1 + .05 * eInOutCubic(inv(0, 5, t));
    ctx.drawImage(s.paper, 0, 0, W, H);
    ctx.save(); ctx.translate(s.P2[0], s.P2[1]); ctx.scale(z, z); ctx.translate(-s.P2[0], -s.P2[1]);
    // 辅助线（柳枝炭，很淡，后来大多被盖住）
    const gg = s.gl.getContext('2d'); gg.clearRect(0, 0, W, H); gg.strokeStyle = '#2a211b'; gg.lineWidth = 2.5 * u; gg.lineCap = 'round';
    s.guides.forEach((p, i) => drawPartial(gg, p, eOutCubic(inv(.05 + (i % 4) * .12 + (i > 3 ? 2.6 : 0), .5 + (i % 4) * .12 + (i > 3 ? 2.6 : 0), t))));
    gg.globalCompositeOperation = 'destination-in'; gg.drawImage(s.gt, 0, 0); gg.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = .45; ctx.drawImage(s.gl, 0, 0); ctx.globalAlpha = 1;
    // 炭粉层
    const g = s.lay.getContext('2d'); g.clearRect(0, 0, W, H);
    const a1 = smooth(.6, 1.7, t), sm1 = smooth(1.8, 2.4, t);
    if (a1 > 0) {
      g.save(); g.beginPath(); const wx = lerp(-W * .2, W * 1.2, eOutCubic(inv(.6, 1.8, t))); g.moveTo(-10, -10); g.lineTo(wx + H * .3, -10); g.lineTo(wx - H * .3, H + 10); g.lineTo(-10, H + 10); g.clip();
      g.globalAlpha = a1 * (1 - sm1 * .45); g.drawImage(s.v1, 0, 0); g.globalAlpha = a1 * sm1 * .6; g.drawImage(s.v1b, 0, 0); g.restore(); g.globalAlpha = 1;
    }
    // 可塑橡皮：擦不干净
    const ep = eInOutCubic(inv(2.45, 3.2, t));
    if (ep > 0) { g.save(); g.globalCompositeOperation = 'destination-out'; g.filter = `blur(${10 * u}px)`; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 110 * u; g.lineCap = g.lineJoin = 'round'; drawPartial(g, s.er, ep); g.restore(); }
    // 第二版：挪过位置，揉开
    const a2 = smooth(3.0, 3.8, t), sm2 = smooth(3.6, 4.1, t);
    if (a2 > 0) { g.globalAlpha = a2 * (1 - sm2 * .5); g.drawImage(s.v2, 0, 0); g.globalAlpha = a2 * sm2 * .4; g.drawImage(s.v2b, 0, 0); g.globalAlpha = 1; }
    const ad = smooth(3.9, 4.35, t); if (ad > 0) { g.globalAlpha = ad; g.drawImage(s.darks, 0, 0); g.globalAlpha = 1; }
    // 提亮：橡皮捏尖点几下
    s.lifts.forEach(([x, y], i) => { const p = smooth(4.35 + i * .1, 4.5 + i * .1, t); if (p <= 0) return; g.save(); g.globalCompositeOperation = 'destination-out'; const rg = g.createRadialGradient(x, y, 0, x, y, 34 * u); rg.addColorStop(0, `rgba(0,0,0,${.45 * p})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, 34 * u, 22 * u, -.6, 0, TAU); g.fill(); g.restore(); });
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(s.lay, 0, 0); ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    vignette(ctx, .3, .45, '50,35,20');
  }
});