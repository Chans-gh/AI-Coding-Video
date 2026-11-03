// C-002 水彩：每块颜色是一个多边形反复随机细分出毛边，再用很低的透明度叠几十层，边缘自然晕开、中间更浓；
// 正片叠底让颜色互相透出，铅笔线故意和色块错开。由 opus40 的同名场景改写，横屏重新构图。
function deformPoly(pts, depth, amt, R) {
  let p = pts;
  for (let d = 0; d < depth; d++) {
    const q = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length]; q.push(a);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]); const g = (R() + R() + R() - 1.5) * amt * len * (a[2] ?? 1);
      const nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
      q.push([(a[0] + b[0]) / 2 + nx * g, (a[1] + b[1]) / 2 + ny * g, (a[2] ?? 1) * .9]);
    }
    p = q;
  }
  return p;
}
function makeWash(poly, color, seed, layers = 26, alpha = .045) {
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  const x0 = Math.min(...xs) - 120, y0 = Math.min(...ys) - 120, w = Math.max(...xs) - x0 + 120, h = Math.max(...ys) - y0 + 120;
  const c = mk(Math.ceil(w / 2), Math.ceil(h / 2)), g = c.getContext('2d'), R = mulberry32(seed);
  g.scale(.5, .5); g.translate(-x0, -y0);
  const base = deformPoly(poly.map(p => [p[0], p[1], .6 + R() * .8]), 2, .5, R);
  g.fillStyle = color;
  for (let l = 0; l < layers; l++) {
    const p = deformPoly(base, 3, .35, R); g.globalAlpha = alpha; g.beginPath(); p.forEach(q => g.lineTo(q[0], q[1])); g.closePath(); g.fill();
  }
  return { c, x0, y0, w, h, cx: x0 + w / 2, cy: y0 + h / 2 };
}
scene({
  id: 'C-002', name: '水彩', dur: 3, still: 2.4,
  fonts: ["40px 'Ma Shan Zheng'"],
  text: '午后·湖边',
  init() {
    const blob = (cx, cy, rx, ry, n = 14) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; };
    const X1 = LAND ? 2300 : 1500;
    const band = (y0, amp, y1, fq, ph) => { const p = []; for (let x = -200; x <= X1; x += 100) p.push([x, y0 - amp * (.5 + .5 * Math.sin(x * fq + ph))]); p.push([X1, y1], [-200, y1]); return p; };
    // 构图：竖屏沿用原版（湖在中下部、标题在天空）；横屏把远山、湖面压扁拉宽，太阳移到右上，小屋和树放在左中
    const P = LAND ? { sky: [260, 50, 640], sun: [1480, 300, 110], hill: [600, 110, 780], mid: [680, 70, 820], lake: [790, 10, 940],
                       trees: [[860, 700, 60, 75], [930, 715, 48, 60], [260, 730, 70, 85]], house: [560, 700], fg: [930, 40, 1300], title: [140, 230] }
                   : { sky: [420, 60, 900], sun: [820, 560, 120], hill: [900, 140, 1120], mid: [1000, 90, 1200], lake: [1130, 10, 1330],
                       trees: [[560, 990, 70, 85], [640, 1010, 55, 70], [170, 1030, 80, 95]], house: [300, 1010], fg: [1300, 40, 1800], title: [110, 420] };
    const [hx, hy] = P.house, [t0, t1, t2] = P.trees;
    const washes = [
      [band(...P.sky, .004, 1), '#8CC0E3', 1, 0],
      [blob(P.sun[0], P.sun[1], P.sun[2], P.sun[2]), '#F2A541', 2, .15, 1],
      [band(...P.hill, .005, 2), '#8F9BD0', 3, .3],
      [band(...P.mid, .007, 4), '#86B96A', 4, .45],
      [band(...P.lake, .01, 0), '#5E9FD6', 5, .6],
      [blob(...t0), '#2F6E4A', 6, .8], [blob(...t1), '#3E8055', 7, .85], [blob(...t2), '#2F6E4A', 8, .9],
      [[[hx, hy], [hx + 120, hy], [hx + 120, hy + 90], [hx, hy + 90]], '#E0DCD2', 9, 1.0], [[[hx - 15, hy + 5], [hx + 60, hy - 60], [hx + 135, hy + 5]], '#D8574A', 10, 1.05],
      [band(...P.fg, .008, 3), '#B9C95C', 11, 1.1],
    ].map(([p, c, sd, d, n]) => ({ ...makeWash(p, c, sd), d, n }));
    return { P, washes, paper: makePaper('#F6EFE2', { seed: 131, blot: 10, grain: 26, fiber: .6 }) };
  },
  draw(ctx, t, s) {
    ctx.drawImage(s.paper, 0, 0, W, H);
    ctx.save(); ctx.translate(-t * 40, 0);
    ctx.globalCompositeOperation = 'multiply';
    for (const w of s.washes) {
      const a = smooth(w.d, w.d + .55, t); if (a <= 0) continue; const sc = lerp(.9, 1, eOutCubic(inv(w.d, w.d + .8, t)));
      ctx.save(); ctx.globalAlpha = a; if (w.n) ctx.globalCompositeOperation = 'source-over'; ctx.translate(w.cx, w.cy); ctx.scale(sc, sc); ctx.drawImage(w.c, -w.w / 2, -w.h / 2, w.w, w.h); ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    // pencil lines (offset from the colour)
    ctx.strokeStyle = 'rgba(70,60,55,.55)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    const pl = smooth(.2, 1.2, t);
    const P = s.P, [hx, hy] = P.house, ly = P.hill[0] - (LAND ? 30 : 20);
    drawPartial(ctx, [[hx - 8, hy + 10], [hx + 62, hy - 50], [hx + 140, hy + 12], [hx + 128, hy + 96], [hx + 4, hy + 94], [hx - 4, hy + 12]], pl);
    drawPartial(ctx, linePts(-100, ly, LAND ? 2200 : 1400, ly - 20, 40, 30, 3), pl);
    drawPartial(ctx, circlePts(P.sun[0] - 10, P.sun[1] - 5, P.sun[2] - 5, 50, 0, TAU, .05, 2), pl);
    // dry-brush streaks
    ctx.fillStyle = 'rgba(40,90,140,.18)'; const R = mulberry32(13);
    for (let k = 0; k < 120; k++) { const x = 100 + R() * (LAND ? 1700 : 900), y = P.lake[0] + (LAND ? 50 : 70) + R() * 60; if (hash2(Math.floor(x / 6), Math.floor(y / 3)) > .45) ctx.fillRect(x, y, 30 + R() * 60, 2 + R() * 2); }
    ctx.restore();
    ctx.fillStyle = 'rgba(80,70,65,.8)'; ctx.font = "64px 'Ma Shan Zheng'"; textReveal(ctx, '午后 · 湖边', ...P.title, inv(1.8, 2.5, t));
  }
});
