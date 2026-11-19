// C-094 民间故事绘本：所有形状先用灰铅笔线（每条描两遍、略错开）画成完整底稿；中景的田地和小屋是多边形反复细分出毛边后低透明度叠几十层的透明水彩，用正片叠底盖在铅笔线上；近景的孩子、白鹅、树和草坡是在形状里撒点、每点一笔带亮边的厚水粉短笔触，按顺序一笔笔铺满；远山和塔楼始终只有铅笔线，越远越空。
// 风格提示词：用民间故事绘本风格：奶油色纸上先有一幅完整的铅笔底稿，再上水粉和水彩，近处厚涂、饱和、笔触可见，中景变成透明的薄水彩，远处干脆只留铅笔线，画面越远越空，深度就靠这种画法本身。
// 题材：手绘与绘画 · 适合：童话与民间故事、亲子内容、乡村题材
function rough(pts, depth, amt, R) {
  let p = pts;
  for (let d = 0; d < depth; d++) {
    const q = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), g = (R() + R() - 1) * amt * l;
      q.push(a, [(a[0] + b[0]) / 2 - (b[1] - a[1]) / (l || 1) * g, (a[1] + b[1]) / 2 + (b[0] - a[0]) / (l || 1) * g]);
    }
    p = q;
  }
  return p;
}
scene({
  id: 'C-094', name: '民间故事绘本', dur: 5, still: 4.4,
  fonts: ["60px 'Ma Shan Zheng'"],
  init() {
    const u = SHORT / 1080, X = x => x * W, Y = y => y * H;
    const yh = LAND ? .4 : .38, yf = LAND ? .68 : .64;   // 远景底线、近景顶线
    const E = (cx, cy, rx, ry, n = 28) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU) * rx, cy + Math.sin(i / n * TAU) * ry]);
    const band = (y0, amp, y1, ph) => { const p = []; for (let x = -.05; x <= 1.05; x += .05) p.push([X(x), Y(y0) - amp * u * (.5 + .5 * Math.sin(x * 7 + ph))]); p.push([X(1.05), Y(y1)], [X(-.05), Y(y1)]); return p; };
    // 远景：只有铅笔
    const far = [];
    const ridge = []; for (let x = -.05; x <= 1.05; x += .02) ridge.push([X(x), Y(yh) - (100 + 55 * Math.sin(x * 9) + 30 * Math.sin(x * 23 + 1)) * u * (LAND ? 1 : 1.1)]);
    far.push(ridge);
    const ridge2 = []; for (let x = .35; x <= 1.05; x += .02) ridge2.push([X(x), Y(yh) - (170 + 50 * Math.sin(x * 13 + 2)) * u]); far.push(ridge2);
    const Rh = mulberry32(4);
    for (let i = 0; i < 70; i++) { const k = Math.floor(Rh() * (ridge.length - 1)), [x, y] = ridge[k]; const l = (20 + Rh() * 40) * u; far.push([[x + 4 * u, y + 8 * u], [x - l * .5, y + l]]); }
    const tx = X(.72), ty = ridge[Math.round(.77 / .02)][1] + 6 * u, tw = 26 * u;
    far.push([[tx - tw, ty], [tx - tw * .8, ty - 110 * u], [tx + tw * .8, ty - 110 * u], [tx + tw, ty]], [[tx - tw * 1.1, ty - 110 * u], [tx, ty - 165 * u], [tx + tw * 1.1, ty - 110 * u]], [[tx - 5 * u, ty - 60 * u], [tx + 5 * u, ty - 60 * u], [tx + 5 * u, ty - 75 * u], [tx - 5 * u, ty - 75 * u], [tx - 5 * u, ty - 60 * u]]);
    for (let i = 0; i < 3; i++) { const bx = X(.3 + i * .06), by = Y(yh * .4 + i * .02); far.push([[bx - 14 * u, by - 6 * u], [bx, by], [bx + 14 * u, by - 6 * u]]); }
    // 中景：水彩
    const mid = [
      [band(yh, 30, yf + .02, 1), '#9CB86A'], [band(yh + .07, 40, yf + .02, 3), '#C9B45E'], [band(yh + .14, 30, yf + .02, 5), '#7FA35A'],
    ];
    const hx = X(LAND ? .26 : .22), hy = Y(yh + .13), hw = 120 * u;
    const house = [[hx - hw / 2, hy], [hx + hw / 2, hy], [hx + hw / 2, hy - 80 * u], [hx - hw / 2, hy - 80 * u]], roof = [[hx - hw * .65, hy - 80 * u], [hx, hy - 150 * u], [hx + hw * .65, hy - 80 * u]];
    mid.push([house, '#E7D8B8'], [roof, '#B9533F']);
    const path = []; for (let k = 0; k <= 20; k++) { const q = k / 20, x = lerp(hx + 40 * u, X(.55), q) + Math.sin(q * 4) * 90 * u, w = lerp(10, 120, q * q) * u, y = lerp(hy + 6 * u, Y(yf + .03), q); path.push([x - w, y], [x + w, y]); }
    const pathPoly = [...path.filter((_, i) => i % 2 === 0), ...path.filter((_, i) => i % 2).reverse()];
    mid.push([pathPoly, '#D9B98A']);
    const washes = mid.map(([p, c], i) => {
      const R = mulberry32(20 + i), base = rough(p, 2, .3, R), cv = mk(W, H), g = cv.getContext('2d'); g.fillStyle = c;
      for (let l = 0; l < 22; l++) { g.globalAlpha = .05; g.beginPath(); rough(base, 2, .25, R).forEach(q => g.lineTo(...q)); g.fill(); }
      return { cv, d: 1.6 + i * .12, pts: p };
    });
    // 近景：水粉
    const ground = band(yf, 50, 1.05, 2), cx = X(LAND ? .62 : .6), cy = Y(LAND ? .93 : .9), ch = (LAND ? 300 : 380) * u;
    const kid = [
      [E(cx, cy - ch * .5, ch * .17, ch * .3), '#B8322A'],                       // 斗篷
      [E(cx, cy - ch * .86, ch * .085, ch * .095), '#F0C8A0'],                   // 脸
      [E(cx, cy - ch * .9, ch * .12, ch * .1, 20).filter(([x, y]) => y < cy - ch * .86), '#9E2A24'],  // 兜帽
      [[[cx - ch * .1, cy - ch * .7], [cx + ch * .1, cy - ch * .7], [cx + ch * .08, cy - ch * .62], [cx - ch * .08, cy - ch * .62]], '#E8B23A'],   // 围巾
      [E(cx - ch * .06, cy - ch * .1, ch * .03, ch * .1), '#4A3A30'], [E(cx + ch * .06, cy - ch * .1, ch * .03, ch * .1), '#4A3A30'],
      [E(cx + ch * .3, cy - ch * .62, ch * .05, ch * .065), '#F7C440'],          // 灯笼
    ];
    const gx = cx - ch * .48, gy = cy - ch * .1;
    const goose = [[E(gx, gy, ch * .16, ch * .1), '#F4F0E6'], [[[gx + ch * .08, gy - ch * .05], [gx + ch * .14, gy - ch * .35], [gx + ch * .19, gy - ch * .36], [gx + ch * .15, gy - ch * .03]], '#F4F0E6'], [E(gx + ch * .2, gy - ch * .35, ch * .04, ch * .025), '#E8862F']];
    const trX = X(LAND ? .07 : .06), trY = Y(1);
    const tree = [[[[trX - 30 * u, trY], [trX + 30 * u, trY], [trX + 18 * u, Y(yf) - 120 * u], [trX - 18 * u, Y(yf) - 120 * u]], '#6B4A32'], [E(trX + 40 * u, Y(yf) - 200 * u, 190 * u, 160 * u), '#3D6E3A'], [E(trX + 150 * u, Y(yf) - 120 * u, 120 * u, 100 * u), '#4E8044']];
    const fore = [[ground, '#5F8F3E', 17], ...tree.map(([p, c]) => [p, c, 16]), ...goose.map(([p, c]) => [p, c, 9]), ...kid.map(([p, c]) => [p, c, 6])];
    const dabs = [];
    fore.forEach(([poly, col, step], ri) => {
      const pts = samplePoints(g => { g.beginPath(); poly.forEach(q => g.lineTo(...q)); g.fill(); }, Math.round(step * u), 30 + ri);
      const [r, gg, b] = hex2rgb(col), R = mulberry32(60 + ri), a0 = R() * Math.PI;
      shuffle(pts, ri).forEach(([x, y], k) => {
        const j = .8 + R() * .35, sh = ri === 0 ? [[1, 1, 1], [1.2, 1.12, 1.05], [.85, .9, .95], [1.25, 1.2, .9]][k % 4] : [1, 1, 1];
        dabs.push({ x, y, a: a0 + (R() - .5) * .9, l: step * u * (1.4 + R()), w: step * u * (.7 + R() * .3), c: `rgb(${Math.min(255, r * j * sh[0]) | 0},${Math.min(255, gg * j * sh[1]) | 0},${Math.min(255, b * j * sh[2]) | 0})`, hl: `rgba(255,250,235,${.25 + R() * .2})`, d: 2.3 + ri * .07 + k / pts.length * .9 });
      });
    });
    // 花：近景草坡上的小点
    const Rf = mulberry32(8);
    for (let i = 0; i < 60; i++) { const x = Rf() * W, y = Y(yf + .05) + Rf() * (H - Y(yf + .05)); if (Math.abs(x - cx) < ch * .3 && y > cy - ch) continue; dabs.push({ x, y, a: 0, l: 10 * u, w: 10 * u, c: ['#F2E6C8', '#E8B23A', '#D45A48'][i % 3], hl: 'rgba(255,255,255,.5)', d: 3.4 + Rf() * .4 }); }
    // 铅笔底稿：每样东西两遍
    const pencil = [...far.map(p => ({ p, d: .1, far: 1 })), ...mid.map(([p], i) => ({ p: i < 3 ? p.slice(0, -2) : [...p, p[0]], d: .5 })), ...fore.map(([p], i) => ({ p: i ? [...p, p[0]] : p.slice(0, -2), d: .8, fig: i >= 4 }))].flatMap((o, i) => [0, 1].map(k => {
      const R = mulberry32(i * 2 + k + 1);
      return { ...o, p: o.p.map(([x, y]) => [x + (R() - .5) * 3 * u, y + (R() - .5) * 3 * u]), d: o.d + (i % 12) * .06 + k * .25 };
    }));
    return { pencil, washes, dabs, lamp: [cx + ch * .3, cy - ch * .62, ch], yh, paper: makePaper('#F1E6CC', { seed: 12, grain: 18, fiber: .5, blot: 12 }) };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, z = 1 + .05 * eInOutCubic(inv(0, 5, t));
    ctx.drawImage(s.paper, 0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H * .6); ctx.scale(z, z); ctx.translate(-W / 2, -H * .6);
    ctx.globalCompositeOperation = 'multiply';
    for (const w of s.washes) { const a = smooth(w.d, w.d + .6, t); if (a > 0) { ctx.globalAlpha = a; ctx.drawImage(w.cv, 0, 0); } }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(70,62,56,.55)'; ctx.lineCap = ctx.lineJoin = 'round';
    for (const L of s.pencil) { const p = eOutCubic(inv(L.d, L.d + .7, t)); if (p <= 0) continue; ctx.lineWidth = (L.far ? 1.8 : 1.5) * u; drawPartial(ctx, L.p, p); }
    ctx.globalCompositeOperation = 'source-over';
    for (const D of s.dabs) {
      const p = inv(D.d, D.d + .12, t); if (p <= 0) continue;
      const c = Math.cos(D.a), sn = Math.sin(D.a), l = D.l * eOutCubic(p);
      ctx.setTransform(c * z, sn * z, -sn * z, c * z, (W / 2 + (D.x - W / 2) * z), (H * .6 + (D.y - H * .6) * z));
      ctx.fillStyle = D.c; rr(ctx, -l / 2, -D.w / 2, l, D.w, D.w / 2); ctx.fill();
      ctx.fillStyle = D.hl; ctx.fillRect(-l / 2 + D.w * .3, -D.w / 2 + D.w * .12, l - D.w * .6, D.w * .18);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 近处人物再勾一遍铅笔，脸上点眼睛
    const ol = smooth(3.4, 3.9, t);
    if (ol > 0) {
      ctx.save(); ctx.translate(W / 2, H * .6); ctx.scale(z, z); ctx.translate(-W / 2, -H * .6);
      ctx.strokeStyle = `rgba(60,45,38,${.6 * ol})`; ctx.lineWidth = 2.2 * u;
      for (const L of s.pencil) if (L.fig) drawPartial(ctx, L.p, 1);
      const [lx, ly, ch] = s.lamp, fx = lx - ch * .3, fy = ly - ch * .24; ctx.fillStyle = `rgba(50,35,30,${ol})`;
      for (const dx of [-.03, .03]) { ctx.beginPath(); ctx.arc(fx + dx * ch, fy, ch * .011, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // 灯笼的光
    const lg = smooth(3.6, 4.2, t);
    if (lg > 0) {
      const [lx, ly, ch] = s.lamp, x = W / 2 + (lx - W / 2) * z, y = H * .6 + (ly - H * .6) * z, r = ch * .28 * (1 + .05 * Math.sin(t * 9));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,190,90,${.4 * lg})`); g.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(80,60,45,.85)'; ctx.font = `${Math.round(60 * u)}px 'Ma Shan Zheng'`;
    textReveal(ctx, '从前，山那边……', LAND ? W * .06 : W * .08, LAND ? H * .12 : H * .1, inv(3.8, 4.4, t));
    vignette(ctx, .25, .5, '80,55,30');
  }
});