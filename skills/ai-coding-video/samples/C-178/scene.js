// C-178 折纸：纸是一组多边形，每一步折叠先用折痕线把纸面切开，折起的一半绕折痕在 3D 里转 180°，转到哪个角度就按法线算明暗、按朝向决定露出彩面还是白面；四步折成小猫，点上眼睛，弹两下再倒着展开；台面阴影按高度偏移并模糊
// 风格提示词：用折纸风格：一张方形彩纸在纯色桌面上沿折痕自己一步步折起来，山折谷折时纸面明暗随角度变化，折痕处留下浅浅的压线，最后变成鹤、青蛙或小船，成品轻轻弹跳后展开再折成下一个，纸面带细微纤维纹，侧光投出柔和阴影，配纸张摩擦声。
// 题材：纸艺、材质与定格 · 适合：手工教程、变化与成长寓意、日式品牌片
// 折痕：过点 a、方向 d；side 是折起那一侧（d 叉乘的符号）；valley 谷折朝镜头翻起，否则山折翻到背后；skip 里的组不动
const FOLDS = [
  { a: [0, 0], d: [1, 0], side: 1, valley: true, t0: .35, t1: 1.15, u0: 9, u1: 9, tip: '对角对折' },
  { a: [.3, 0], d: [.766, -.643], side: 1, valley: true, t0: 1.35, t1: 1.9, u0: 4.33, u1: 4.5, tip: '折出右耳' },
  { a: [-.3, 0], d: [-.766, -.643], side: -1, valley: true, t0: 1.95, t1: 2.5, u0: 4.15, u1: 4.33, tip: '折出左耳' },
  { a: [0, -.6], d: [1, 0], side: -1, valley: false, t0: 2.65, t1: 3.15, u0: 3.95, u1: 4.15, skip: [2, 3], tip: '头顶往后折' },
];
const TILT = .42, DIST = 7, LIGHT = [-.45, -.55, .7];
function clipHalf(poly, F, sgn) {                     // 留下折痕 sgn 一侧的部分
  const out = [], c = p => sgn * F.side * (F.d[0] * (p[1] - F.a[1]) - F.d[1] * (p[0] - F.a[0]));
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length], cp = c(P), cq = c(Q);
    if (cp >= 0) out.push(P);
    if ((cp >= 0) !== (cq >= 0)) { const k = cp / (cp - cq); out.push([P[0] + (Q[0] - P[0]) * k, P[1] + (Q[1] - P[1]) * k]); }
  }
  return out.length >= 3 ? out : null;
}
function turn(q, F, th) {                              // 绕折痕转 th：返回 [x, y, z]
  const rx = q[0] - F.a[0], ry = q[1] - F.a[1], al = rx * F.d[0] + ry * F.d[1], nx = -F.d[1], ny = F.d[0], dd = rx * nx + ry * ny;
  return [F.a[0] + F.d[0] * al + nx * dd * Math.cos(th), F.a[1] + F.d[1] * al + ny * dd * Math.cos(th), Math.abs(dd) * Math.sin(th) * (F.valley ? 1 : -1)];
}
const area = v => v.reduce((s, p, i) => { const q = v[(i + 1) % v.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
scene({
  id: 'C-178', name: '折纸', dur: 4.6, still: 3.45,
  fonts: ["700 40px 'Noto Sans SC'", "400 20px 'JetBrains Mono'"],
  text: '对角折出右耳左耳头顶往后完成小猫步骤',
  init() {
    // 预先算好每一步：哪些面不动、哪些面折起；折完把折起的面镜像过去，层序翻转后放到最上（谷折）或最下（山折）
    let polys = [{ v: [[0, -1], [1, 0], [0, 1], [-1, 0]], up: 0, L: 0, g: 0 }];   // up：朝上的是 0 白面 / 1 彩面
    const stages = [];
    FOLDS.forEach((F, k) => {
      const stat = [], mov = [];
      for (const p of polys) {
        if (F.skip && F.skip.includes(p.g)) { stat.push(p); continue; }
        const s = clipHalf(p.v, F, -1), m = clipHalf(p.v, F, 1);
        if (s) stat.push({ ...p, v: s });
        if (m) mov.push({ ...p, v: m });
      }
      stages.push({ stat, mov });
      const Ls = polys.map(p => p.L), hi = Math.max(...Ls), lo = Math.min(...Ls);
      const mh = Math.max(...mov.map(p => p.L)), ml = Math.min(...mov.map(p => p.L));
      polys = stat.concat(mov.map(p => ({ v: p.v.map(q => turn(q, F, Math.PI).slice(0, 2)), up: 1 - p.up, g: k + 1,
        L: F.valley ? hi + 1 + (mh - p.L) : lo - 1 - (p.L - ml) })));
    });
    stages.push({ stat: polys, mov: [] });
    // 纤维纹：细短线随机铺满的贴图
    const fib = mk(256, 256), g = fib.getContext('2d'), R = mulberry32(5);
    for (let i = 0; i < 700; i++) {
      const x = R() * 256, y = R() * 256, a = R() * TAU, l = 4 + 14 * R();
      g.strokeStyle = R() < .5 ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.7)'; g.lineWidth = .6;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    const sh = mk(W / 4, H / 4);
    return { stages, fib, sh, pat: null };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    if (!s.pat) s.pat = ctx.createPattern(s.fib, 'repeat');
    // 当前在第几步、这一步折到多少
    const prog = FOLDS.map(F => eInOutCubic(inv(F.t0, F.t1, t)) - eInOutCubic(inv(F.u0, F.u1, t)));
    let k = 0; while (k < FOLDS.length && prog[k] >= 1) k++;
    const th = k < FOLDS.length ? Math.PI * clamp(prog[k]) : 0, stage = s.stages[k];
    // 整体：缓慢转动，完成后弹跳两下
    const q = inv(3.25, 3.9, t), hop = .28 * Math.abs(Math.sin(q * Math.PI * 2)) * (1 - q * .6) * (q > 0 && q < 1);
    const rz = -.1 + .07 * Math.sin(t * .7) + .06 * hop, lift = hop;
    const sc = SHORT * (LAND ? .34 : .36), cx = LAND ? W * .6 : W / 2, cy = LAND ? H * .56 : H * .48;
    const ct = Math.cos(TILT), sn = Math.sin(TILT), cz = Math.cos(rz), sz = Math.sin(rz);
    const P = ([x, y, z]) => {
      const X = x * cz - y * sz, Y = x * sz + y * cz, Z = z + lift, Y2 = Y * ct - Z * sn, Z2 = Y * sn + Z * ct, kk = DIST / (DIST - Z2);
      return [cx + X * kk * sc, cy + Y2 * kk * sc, X, Y2, Z2];
    };
    // 台面
    const bg = ctx.createRadialGradient(cx - W * .1, cy - H * .2, 0, cx, cy, LONG * .8);
    bg.addColorStop(0, '#9bb3a6'); bg.addColorStop(1, '#6d8b7e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const faces = [];
    for (const p of stage.stat) faces.push({ p, v3: p.v.map(q => [q[0], q[1], .002 * p.L]), mov: 0 });
    const F = FOLDS[k];
    for (const p of stage.mov) faces.push({ p, v3: p.v.map(q => turn(q, F, th)), mov: 1 });
    // 阴影：按高度往光的反方向偏，画在 1/4 分辨率上再模糊放大
    const g = s.sh.getContext('2d'); g.clearRect(0, 0, W / 4, H / 4); g.fillStyle = 'rgba(25,40,35,1)';
    for (const fc of faces) {
      g.beginPath();
      fc.v3.forEach((v, i) => { const zz = v[2] + lift + .02, [x, y] = P([v[0] + zz * .5, v[1] + zz * .65, -lift]); i ? g.lineTo(x / 4, y / 4) : g.moveTo(x / 4, y / 4); });
      g.fill();
    }
    ctx.save(); ctx.globalAlpha = .32 - .12 * hop; ctx.filter = `blur(${(3 + 10 * hop) * u}px)`; ctx.drawImage(s.sh, 0, 0, W, H); ctx.restore();
    // 画的顺序：不动的按层序；折起的面过了 90° 后上下颠倒
    const late = th > Math.PI / 2;
    faces.sort((a, b) => {
      if (a.mov !== b.mov) return (a.mov - b.mov) * (F && !F.valley ? -1 : 1);
      return a.mov && late ? b.p.L - a.p.L : a.p.L - b.p.L;
    });
    for (const fc of faces) {
      const pts = fc.v3.map(P);
      const a2 = area(pts.map(p => [p[0], p[1]])), a0 = area(fc.p.v);
      const face = (a2 > 0) === (a0 > 0) ? fc.p.up : 1 - fc.p.up;
      // 法线 → 明暗
      const [A, B, C] = [pts[0], pts[1], pts[2]];
      let nx = (B[3] - A[3]) * (C[4] - A[4]) - (B[4] - A[4]) * (C[3] - A[3]);
      let ny = (B[4] - A[4]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[4] - A[4]);
      let nz = (B[2] - A[2]) * (C[3] - A[3]) - (B[3] - A[3]) * (C[2] - A[2]);
      const nl = Math.hypot(nx, ny, nz) || 1; if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const lit = .74 + .34 * Math.max(-.3, (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / nl);
      const base = face ? [208, 62, 50] : [246, 240, 228];
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = `rgb(${base.map(c => Math.min(255, c * lit) | 0)})`; ctx.fill();
      ctx.save(); ctx.clip(); ctx.globalAlpha = face ? .08 : .06; ctx.fillStyle = s.pat; ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.strokeStyle = face ? 'rgba(90,15,10,.35)' : 'rgba(120,100,80,.3)'; ctx.lineWidth = 1.2 * u; ctx.lineJoin = 'round'; ctx.stroke();
    }
    // 折好后点上眼睛和鼻子（墨点）
    const ey = smooth(3.15, 3.3, t) * (1 - smooth(3.9, 3.95, t));
    if (ey > 0) {
      ctx.fillStyle = `rgba(30,15,12,${ey})`;
      for (const [x, y, r] of [[-.17, -.36, .045], [.17, -.36, .045], [0, -.05, .035]]) {
        const [px, py] = P([x, y, .01]); ctx.beginPath(); ctx.ellipse(px, py, r * sc, r * sc * (y < -.2 ? 1.25 : .8), rz, 0, TAU); ctx.fill();
      }
    }
    // 步骤字幕
    const step = FOLDS.findIndex(F => t < F.t1 + .1), done = t > 3.2 && t < 3.95;
    const txt = done ? '完成：小猫' : step >= 0 && t > .2 ? `步骤 ${step + 1}/4 · ${FOLDS[step].tip}` : t >= 3.95 ? '展开，再折下一个' : '';
    if (txt) {
      ctx.fillStyle = 'rgba(30,45,40,.85)'; ctx.font = `700 ${Math.round(44 * u)}px 'Noto Sans SC'`;
      ctx.textAlign = LAND ? 'left' : 'center';
      ctx.fillText(txt, LAND ? W * .07 : W / 2, LAND ? H * .5 : H * .84);
      ctx.font = `400 ${Math.round(20 * u)}px 'JetBrains Mono'`; ctx.fillStyle = 'rgba(30,45,40,.55)';
      ctx.fillText('ORIGAMI · CAT', LAND ? W * .07 : W / 2, LAND ? H * .5 + 44 * u : H * .84 + 44 * u);
    }
  }
});
