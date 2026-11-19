// C-131 古罗马石子马赛克：先把图案（边框、圆形画心、海豚、浪、常春藤叶）画进一张低分辨率的区域图，对每个区域做距离变换，再按「离轮廓的距离」从近到远贪心地摆石块，石块边对着轮廓的切线，所以一圈圈沿轮廓排开；每块石头是带一点歪斜的四边形，按区域取天然土色再抖一抖明暗，左上描亮边、右下描暗边；翻面的波前从画心一点出发、每一拍往外推一圈，石块在波前经过时绕自己的轴翻过来。
// 风格提示词：用古罗马石子马赛克风格：形象由几毫米见方的小石块沿轮廓一圈圈排出，石色是大理石白、赭黄、砖红、灰绿这些天然土色，块与块之间露出暗灰灰泥缝，石面有细微凹凸和高光，新画面跟着鼓点从一点开始一块块翻面铺开，镜头像俯看庭院地面一样缓慢移动。
// 题材：印刷、版画与装饰 · 适合：古代城市、考古科普、庄重的纪念片
scene({
  id: 'C-131', name: '古罗马石子马赛克', dur: 5, still: 4.6,
  fonts: [],
  init() {
    const u = SHORT / 1080, ts = 15 * u, m = ts / 3, mw = Math.ceil(W / m), mh = Math.ceil(H / m);
    const PAL = ['#E6E0D2', '#A8452E', '#38342F', '#AEB9A4', '#C9933E', '#4F5A46', '#5C7A45', '#4E6E70'];
    // 区域图：红通道 = 区域号 × 30
    const c = mk(mw, mh), g = c.getContext('2d'); g.scale(1 / m, 1 / m);
    const F = (id) => `rgb(${id * 30},0,0)`;
    g.fillStyle = F(0); g.fillRect(0, 0, W, H);
    const b0 = 34 * u, bw = 64 * u; g.fillStyle = F(1); g.fillRect(b0, b0, W - 2 * b0, H - 2 * b0);
    g.fillStyle = F(2); g.fillRect(b0 + bw, b0 + bw, W - 2 * (b0 + bw), H - 2 * (b0 + bw));
    g.fillStyle = F(0); g.fillRect(b0 + bw + 12 * u, b0 + bw + 12 * u, W - 2 * (b0 + bw + 12 * u), H - 2 * (b0 + bw + 12 * u));
    // 红边框里的一串白色方块（像回纹的节奏）
    g.fillStyle = F(0); for (let x = b0 + bw; x < W - b0 - bw; x += 110 * u) for (const y of [b0 + bw / 2, H - b0 - bw / 2]) g.fillRect(x + 35 * u, y - 13 * u, 26 * u, 26 * u);
    for (let y = b0 + bw; y < H - b0 - bw; y += 110 * u) for (const x of [b0 + bw / 2, W - b0 - bw / 2]) g.fillRect(x - 13 * u, y + 35 * u, 26 * u, 26 * u);
    const cx = W / 2, cy = H / 2, Rm = Math.min(W, H) * (LAND ? .34 : .36);
    g.fillStyle = F(2); g.beginPath(); g.arc(cx, cy, Rm + 14 * u, 0, TAU); g.fill();
    g.fillStyle = F(3); g.beginPath(); g.arc(cx, cy, Rm, 0, TAU); g.fill();
    g.save(); g.translate(cx, cy); g.scale(Rm, Rm);
    g.strokeStyle = F(7); g.lineWidth = .06; for (const y of [.5, .66]) { g.beginPath(); for (let x = -1; x <= 1; x += .02) g.lineTo(x, y + .05 * Math.sin(x * 9 + y * 5)); g.stroke(); }
    g.fillStyle = F(4); g.beginPath(); g.moveTo(-.6, .25); g.bezierCurveTo(-.4, -.35, .3, -.45, .62, -.08); g.lineTo(.76, -.02); g.lineTo(.6, .04); g.bezierCurveTo(.35, .16, -.2, .1, -.6, .3); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-.58, .27); g.lineTo(-.86, .03); g.quadraticCurveTo(-.74, .28, -.88, .52); g.closePath(); g.fill();
    g.fillStyle = F(5); g.beginPath(); g.moveTo(-.04, -.3); g.lineTo(-.16, -.54); g.quadraticCurveTo(.05, -.42, .14, -.31); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-.58, .2); g.bezierCurveTo(-.4, -.3, .3, -.42, .62, -.08); g.bezierCurveTo(.3, -.24, -.3, -.12, -.58, .2); g.fill();
    g.beginPath(); g.moveTo(.16, .06); g.lineTo(.04, .3); g.lineTo(.3, .09); g.closePath(); g.fill();
    g.fillStyle = F(2); g.beginPath(); g.arc(.5, -.07, .035, 0, TAU); g.fill();
    g.restore();
    // 角上的常春藤叶
    const leaf = (x, y, s, a) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = F(6); g.beginPath(); g.moveTo(0, s * .55); g.bezierCurveTo(-s * .9, -s * .1, -s * .45, -s * .75, 0, -s * .3); g.bezierCurveTo(s * .45, -s * .75, s * .9, -s * .1, 0, s * .55); g.fill(); g.strokeStyle = F(6); g.lineWidth = s * .08; g.beginPath(); g.moveTo(0, s * .5); g.quadraticCurveTo(s * .3, s * .9, s * .1, s * 1.2); g.stroke(); g.restore(); };
    const ls = 110 * u, ins = b0 + bw + 100 * u;
    if (LAND) [[ins, ins, 2.4], [W - ins, ins, -2.4], [ins, H - ins, .8], [W - ins, H - ins, -.8]].forEach(([x, y, a]) => leaf(x, y, ls, a));
    else [[W / 2, ins + 40 * u, Math.PI], [W / 2, H - ins - 40 * u, 0]].forEach(([x, y, a]) => leaf(x, y, ls * .9, a));
    const D = g.getImageData(0, 0, mw, mh).data, id = new Uint8Array(mw * mh);
    for (let i = 0; i < mw * mh; i++) id[i] = Math.min(7, Math.round(D[i * 4] / 30));
    // 距离变换（到别的区域的距离）
    const dist = new Float32Array(mw * mh).fill(1e9), at = (x, y) => y * mw + x;
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) { const i = at(x, y); if ((x > 0 && id[i - 1] !== id[i]) || (x < mw - 1 && id[i + 1] !== id[i]) || (y > 0 && id[i - mw] !== id[i]) || (y < mh - 1 && id[i + mw] !== id[i]) || x === 0 || y === 0 || x === mw - 1 || y === mh - 1) dist[i] = .5; }
    const relax = (x, y, dx, dy, w) => { const j = at(x + dx, y + dy), i = at(x, y); if (id[j] === id[i] && dist[j] + w < dist[i]) dist[i] = dist[j] + w; };
    for (let y = 1; y < mh - 1; y++) for (let x = 1; x < mw - 1; x++) { relax(x, y, -1, 0, 1); relax(x, y, 0, -1, 1); relax(x, y, -1, -1, 1.41); relax(x, y, 1, -1, 1.41); }
    for (let y = mh - 2; y > 0; y--) for (let x = mw - 2; x > 0; x--) { relax(x, y, 1, 0, 1); relax(x, y, 0, 1, 1); relax(x, y, 1, 1, 1.41); relax(x, y, -1, 1, 1.41); }
    // 按到轮廓的距离贪心摆石块
    const R = mulberry32(7), order = [];
    for (let y = 1; y < mh - 1; y++) for (let x = 1; x < mw - 1; x++) order.push([dist[at(x, y)] + R() * .4, x, y]);
    order.sort((a, b) => a[0] - b[0]);
    const cell = 3, gw = Math.ceil(mw / cell), grid = new Map(), tiles = [], minD = 2.85;
    for (const [, x, y] of order) {
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell); let ok = true;
      for (let j = -1; j <= 1 && ok; j++) for (let i = -1; i <= 1 && ok; i++) for (const q of grid.get((gy + j) * gw + gx + i) || []) if ((q[0] - x) ** 2 + (q[1] - y) ** 2 < minD * minD) { ok = false; break; }
      if (!ok) continue;
      const k = (gy) * gw + gx; if (!grid.has(k)) grid.set(k, []); grid.get(k).push([x, y]);
      const i0 = at(x, y), gxd = dist[i0 + 1] - dist[i0 - 1] + (x > 1 && x < mw - 2 ? (dist[i0 + 2] - dist[i0 - 2]) * .5 : 0), gyd = dist[i0 + mw] - dist[i0 - mw] + (y > 1 && y < mh - 2 ? (dist[i0 + 2 * mw] - dist[i0 - 2 * mw]) * .5 : 0), a = Math.atan2(gyd, gxd);
      const [r, gg, b] = hex2rgb(PAL[id[i0]]), j = .86 + R() * .26;
      tiles.push({ x: (x + .5) * m, y: (y + .5) * m, a, s: ts * (.4 + R() * .07), w: ts * (.4 + R() * .07), c: `rgb(${Math.min(255, r * j) | 0},${Math.min(255, gg * j) | 0},${Math.min(255, b * j) | 0})`, k: [R(), R(), R(), R()].map(v => (v - .5) * .16) });
    }
    // 翻面时间：波前从画心一点出发，每拍推一圈
    const ox = cx + Rm * .5, oy = cy - Rm * .07, maxD = Math.hypot(W, H) * .62, NB = 10, t0 = .2;
    const front = tt => { const b = (tt - t0) / BEAT; if (b <= 0) return 0; const k = Math.min(NB, Math.floor(b)), f = b - k; return maxD * (k + (k < NB ? eOutCubic(f) : 0)) / NB; };
    for (const T of tiles) { const d = Math.hypot(T.x - ox, T.y - oy) * (1 + .1 * hash1(T.x * 7 + T.y)); let lo = 0, hi = 5; for (let i = 0; i < 26; i++) { const mid = (lo + hi) / 2; if (front(mid) >= d) hi = mid; else lo = mid; } T.t = hi; }
    return { tiles, grout: makePaper('#4A453E', { seed: 3, grain: 30, fiber: .2, blot: 20 }) };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, z = 1.12 - .06 * eInOutCubic(inv(0, 5, t)), px = (t - 2.5) * 14 * u, py = (t - 2.5) * 6 * u;
    ctx.save(); ctx.translate(W / 2 + px, H / 2 + py); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(s.grout, 0, 0, W, H);
    for (const T of s.tiles) {
      const p = clamp((t - T.t) / .28), fl = Math.cos(p * Math.PI), sx = Math.abs(fl) * .92 + .08, front = p > .5;
      const ca = Math.cos(T.a), sa = Math.sin(T.a), hw = T.w * sx, hs = T.s, k = T.k;
      const P = [[-hw * (1 + k[0]), -hs * (1 + k[1])], [hw * (1 + k[2]), -hs], [hw, hs * (1 + k[3])], [-hw, hs]].map(([x, y]) => [T.x + x * ca - y * sa, T.y + x * sa + y * ca]);
      ctx.fillStyle = front ? T.c : (p > 0 ? '#9A9282' : '#8E887C');
      ctx.beginPath(); ctx.moveTo(...P[0]); ctx.lineTo(...P[1]); ctx.lineTo(...P[2]); ctx.lineTo(...P[3]); ctx.closePath(); ctx.fill();
      if (p > 0 && p < 1) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill(); }
      ctx.lineWidth = 1.4 * u;
      const tl = [P[0], P[1], P[2], P[3]].sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
      ctx.strokeStyle = 'rgba(255,250,235,.35)'; ctx.beginPath(); ctx.moveTo(...tl[1]); ctx.lineTo(...tl[0]); ctx.lineTo(...tl[2]); ctx.stroke();
      ctx.strokeStyle = 'rgba(20,15,10,.35)'; ctx.beginPath(); ctx.moveTo(...tl[1]); ctx.lineTo(...tl[3]); ctx.lineTo(...tl[2]); ctx.stroke();
    }
    ctx.restore();
    const lg = ctx.createLinearGradient(0, 0, W, H); lg.addColorStop(0, 'rgba(255,240,210,.1)'); lg.addColorStop(1, 'rgba(40,20,0,.18)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    vignette(ctx, .4, .45);
  }
});