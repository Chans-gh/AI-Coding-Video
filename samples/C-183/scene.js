// C-183 京剧脸谱：三张原创脸谱，每张是一组只写右半边坐标的色块（平滑闭合曲线），画两次（第二次水平镜像）得到左右对称；每块色带白色勾边，再加卷纹、火焰纹、腮纹等装饰线；第一张先描墨线、再填色，都用一个从中轴往两边张开的裁剪框，所以线和色从中间向两侧同时长出；锣响时一道深红水袖从脸前扫过，脸谱横向翻一下换成下一张。背景是竖褶的深红幕布和上下两条金色回纹
// 风格提示词：用京剧脸谱风格：一张左右对称的大脸谱占满画面，额头、眉眼和鼻窝用红、黑、白、金、蓝大块勾画，颜色代表人物性格，线条从中轴向两边同时一笔笔描出，背景是深红幕布和金色回纹，每一声锣响就像变脸一样翻换成下一张，配京胡和锣鼓点。
// 题材：东方传统 · 适合：戏曲科普、国潮品牌、人物性格讲解
const FACE = [[0, -1.38], [.6, -1.28], [.95, -.88], [1.02, -.2], [.94, .45], [.72, .96], [.4, 1.26], [0, 1.36], [-.4, 1.26], [-.72, .96], [-.94, .45], [-1.02, -.2], [-.95, -.88], [-.6, -1.28]];
const RD = '#c8202a', BK = '#16110f', WT = '#f5efe4', GD = '#d9a93a', BL = '#2858b4';
const MASKS = [
  { name: '红脸', trait: '忠勇', base: RD, parts: [
    { c: BK, p: [[.1, -.5], [.42, -.78], [.86, -.66], [.94, -.46], [.6, -.52], [.24, -.38]] },
    { c: GD, p: [[.2, -.52], [.45, -.68], [.75, -.62], [.5, -.58]], line: GD },
    { c: BK, p: [[.16, -.26], [.5, -.42], [.84, -.3], [.74, -.1], [.46, -.06], [.2, -.14]] },
    { c: WT, p: [[.3, -.24], [.5, -.33], [.66, -.25], [.5, -.17]] },
    { c: BK, p: [[.44, -.27], [.53, -.27], [.53, -.21], [.44, -.21]] },
    { c: WT, p: [[-.06, -1.25], [.06, -1.25], [.05, -.62], [-.05, -.62]] },
    { c: GD, p: [[0, -.72], [.08, -.62], [0, -.52], [-.08, -.62]] },
    { c: '#8e1018', p: [[0, -.14], [.16, .12], [.2, .3], [0, .38], [-.2, .3], [-.16, .12]] },
    { c: BK, p: [[0, .52], [.34, .48], [.6, .62], [.52, .76], [.2, .7], [0, .8], [-.2, .7], [-.52, .76], [-.6, .62], [-.34, .48]] },
    { c: BK, p: [[0, .96], [.36, .9], [.56, 1.04], [.38, 1.26], [0, 1.36], [-.38, 1.26], [-.56, 1.04], [-.36, .9]] },
  ] },
  { name: '黑脸', trait: '刚直', base: BK, parts: [
    { c: WT, p: [[.08, -.4], [.46, -.6], [.9, -.42], [.82, -.12], [.5, -.02], [.2, -.1]] },
    { c: BK, p: [[.3, -.3], [.52, -.38], [.7, -.28], [.52, -.2]] },
    { c: WT, p: [[.5, -.31], [.58, -.31], [.58, -.25], [.5, -.25]] },
    { c: WT, p: [[.08, -.68], [.5, -.86], [.88, -.7], [.5, -.74]], line: WT },
    { c: GD, p: [[0, -1.14], [.16, -.96], [0, -.8], [-.16, -.96]] },
    { c: WT, p: [[0, -.06], [.12, .16], [.14, .3], [0, .34], [-.14, .3], [-.12, .16]] },
    { c: RD, p: [[0, .54], [.28, .5], [.44, .62], [.26, .72], [0, .7], [-.26, .72], [-.44, .62], [-.28, .5]] },
    { c: WT, p: [[0, 1.0], [.3, .96], [.4, 1.12], [0, 1.24], [-.4, 1.12], [-.3, .96]] },
  ] },
  { name: '蓝脸', trait: '刚猛', base: BL, parts: [
    { c: RD, p: [[.08, -.52], [.4, -.82], [.92, -.7], [1.0, -.5], [.6, -.56], [.22, -.4]] },
    { c: BK, p: [[.1, -.24], [.44, -.48], [.98, -.38], [.7, -.22], [.46, -.04], [.16, -.1]] },
    { c: WT, p: [[.3, -.25], [.52, -.35], [.7, -.27], [.5, -.17]] },
    { c: BK, p: [[.46, -.28], [.55, -.28], [.55, -.21], [.46, -.21]] },
    { c: GD, p: [[0, -1.2], [.22, -.92], [0, -.62], [-.22, -.92]], line: BK },
    { c: WT, p: [[0, -.1], [.16, .14], [.18, .32], [0, .4], [-.18, .32], [-.16, .14]] },
    { c: BK, p: [[0, .5], [.4, .44], [.8, .56], [.7, .9], [.4, 1.2], [0, 1.36], [-.4, 1.2], [-.7, .9], [-.8, .56], [-.4, .44]] },
    { c: RD, p: [[0, .58], [.24, .56], [.34, .64], [.2, .72], [0, .7], [-.2, .72], [-.34, .64], [-.24, .56]] },
  ] },
];
const spiral = (cx, cy, r0, r1, turns, a0 = 0, dir = 1) => Array.from({ length: 40 }, (_, i) => { const q = i / 39, a = a0 + dir * q * turns * TAU, r = lerp(r0, r1, q); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
// 装饰线（右半边坐标，开口折线）：[颜色, 粗细, 点]
MASKS[0].deco = [[BK, 3, spiral(.62, .36, .02, .16, 1.2, 0)], [BK, 3, [[.22, .2], [.42, .12], [.62, .2], [.78, .4]]], [GD, 3, [[.06, -.62], [.2, -.86], [.1, -1.06], [.22, -1.2]]],
  [BK, 3, [[.86, -.64], [.98, -.8], [.92, -.98], [.8, -1.02]]], [WT, 2.5, [[.18, -.12], [.46, -.02], [.76, -.08]]], [BK, 2.5, [[.06, .86], [.3, .84], [.5, .9]]]];
MASKS[1].deco = [[WT, 3, spiral(0, -.98, .3, .02, 1.6, -1.6)], [WT, 3, [[.2, .18], [.5, .12], [.82, .26]]], [WT, 3, [[.24, .32], [.56, .3], [.78, .44]]],
  [GD, 2.5, [[.08, -.4], [.46, -.64], [.92, -.44]]], [WT, 3, spiral(.86, -.06, .02, .1, 1.3, 1)], [RD, 3, [[.06, .48], [.3, .44], [.5, .5]]]];
MASKS[2].deco = [[RD, 3, [[.04, -.66], [.14, -.9], [.06, -1.1], [.16, -1.28]]], [GD, 3, [[.2, .18], [.5, .12], [.86, .28]]], [GD, 3, spiral(.7, .3, .02, .14, 1.2, 2)],
  [WT, 2.5, [[.12, -.06], [.44, .02], [.8, -.16]]], [RD, 3, [[.92, -.7], [1.0, -.86], [.9, -1.0]]], [GD, 2.5, [[.1, .9], [.4, .86], [.66, .7]]]];
const GONG = [1.95, 3.0];                    // 变脸的锣响时刻（sound.py 同步）
function sm(ctx, pts) {                        // 过各点中点的平滑闭合曲线
  const n = pts.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  ctx.beginPath(); ctx.moveTo(...m(pts[n - 1], pts[0]));
  for (let i = 0; i < n; i++) ctx.quadraticCurveTo(...pts[i], ...m(pts[i], pts[(i + 1) % n]));
  ctx.closePath();
}
scene({
  id: 'C-183', name: '京剧脸谱', dur: 4.2, still: 1.75,
  fonts: ["900 40px 'Noto Serif SC'", "400 20px 'JetBrains Mono'"],
  text: '红脸忠勇黑刚直蓝猛',
  init() {
    // 幕布：竖褶的明暗 + 上下金色回纹
    const bg = mk(W, H), g = bg.getContext('2d'), u = SHORT / 1080;
    for (let x = 0; x < W; x += 2) {
      const k = .55 + .25 * Math.sin(x / (46 * u)) + .15 * Math.sin(x / (17 * u) + 1) + .05 * Math.sin(x / (7 * u));
      g.fillStyle = `rgb(${110 * k + 20 | 0},${12 * k | 0},${16 * k | 0})`; g.fillRect(x, 0, 2, H);
    }
    const vg = g.createRadialGradient(W / 2, H * .45, SHORT * .2, W / 2, H / 2, LONG * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    const s = 34 * u;
    for (const y0 of [24 * u, H - 24 * u - s]) {
      g.fillStyle = '#2a0608'; g.fillRect(0, y0 - 8 * u, W, s + 16 * u);
      g.strokeStyle = GD; g.lineWidth = 3.5 * u; g.lineJoin = 'miter';
      for (let x = 0; x < W + s; x += s) {                      // 回纹：每格一个方折回旋
        g.beginPath(); g.moveTo(x, y0 + s); g.lineTo(x, y0); g.lineTo(x + s * .8, y0); g.lineTo(x + s * .8, y0 + s * .7); g.lineTo(x + s * .3, y0 + s * .7); g.lineTo(x + s * .3, y0 + s * .35); g.lineTo(x + s * .55, y0 + s * .35); g.stroke();
      }
      g.beginPath(); g.moveTo(0, y0 - 6 * u); g.lineTo(W, y0 - 6 * u); g.moveTo(0, y0 + s + 6 * u); g.lineTo(W, y0 + s + 6 * u); g.stroke();
    }
    return { bg };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    ctx.drawImage(s.bg, 0, 0);
    const k = LAND ? H * .3 : W * .4, cx = LAND ? W * .6 : W / 2, cy = LAND ? H / 2 : H * .44;
    // 追光
    const sp = ctx.createRadialGradient(cx, cy, k * .5, cx, cy, k * 2.2); sp.addColorStop(0, 'rgba(255,200,150,.22)'); sp.addColorStop(1, 'rgba(255,200,150,0)');
    ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H);
    const mi = t < GONG[0] ? 0 : t < GONG[1] ? 1 : 2, M = MASKS[mi];
    // 变脸：锣响前后 0.12 秒横向翻一下
    let sx = 1;
    for (const g of GONG) { const d = (t - g) / .12; if (Math.abs(d) < 1) sx = Math.max(.04, Math.abs(d)); }
    const lineP = mi ? 1 : eInOutCubic(inv(.2, 1.1, t)), fillP = mi ? 1 : eInOutCubic(inv(.8, 1.7, t));
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k * sx, k * (1 + .015 * Math.sin(t * 3)));
    const clip = p => { ctx.beginPath(); ctx.rect(-1.2 * p, -1.6, 2.4 * p, 3.2); ctx.clip(); };
    // 底色
    ctx.save(); sm(ctx, FACE); ctx.clip();
    ctx.save(); clip(fillP); ctx.fillStyle = M.base; ctx.fillRect(-1.2, -1.6, 2.4, 3.2); ctx.restore();
    if (fillP < 1) { ctx.save(); ctx.beginPath(); ctx.rect(-1.2, -1.6, 2.4, 3.2); ctx.rect(-1.2 * fillP, -1.6, 2.4 * fillP, 3.2); ctx.clip('evenodd'); ctx.fillStyle = '#efe6d6'; ctx.fillRect(-1.2, -1.6, 2.4, 3.2); ctx.restore(); }
    // 色块：左右各画一次
    for (const sgn of [1, -1]) {
      ctx.save(); ctx.scale(sgn, 1);
      for (const pt of M.parts) {
        ctx.save(); clip(fillP); sm(ctx, pt.p); ctx.strokeStyle = WT; ctx.lineWidth = 9 / k * u; ctx.stroke(); ctx.fillStyle = pt.c; ctx.fill(); ctx.restore();   // 白色勾边
        ctx.save(); clip(lineP); sm(ctx, pt.p); ctx.strokeStyle = pt.line || (pt.c === BK ? GD : BK); ctx.lineWidth = (pt.c === BK ? 2.5 : 4) / k * u; ctx.stroke(); ctx.restore();
      }
      ctx.save(); clip(lineP); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [c, w, pts] of M.deco) { ctx.strokeStyle = c; ctx.lineWidth = w * 1.4 / k * u; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
      ctx.restore();
      ctx.restore();
    }
    // 脸上的油彩光泽
    const gl = ctx.createRadialGradient(-.35, -.7, 0, -.35, -.7, 1.2); gl.addColorStop(0, 'rgba(255,255,255,.18)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(-1.2, -1.6, 2.4, 3.2);
    ctx.restore();
    ctx.save(); clip(lineP); sm(ctx, FACE); ctx.strokeStyle = BK; ctx.lineWidth = 7 / k * u; ctx.stroke(); ctx.restore();
    ctx.restore();
    // 水袖：锣响时从左往右扫过
    for (const g of GONG) {
      const p = inv(g - .16, g + .16, t);
      if (p <= 0 || p >= 1) continue;
      const x = lerp(-W * .3, W * 1.3, eInOutCubic(p));
      const sl = ctx.createLinearGradient(x - W * .25, 0, x + W * .25, 0);
      sl.addColorStop(0, 'rgba(240,235,225,0)'); sl.addColorStop(.45, 'rgba(240,235,225,.85)'); sl.addColorStop(.55, 'rgba(225,215,200,.9)'); sl.addColorStop(1, 'rgba(240,235,225,0)');
      ctx.save(); ctx.translate(x, cy); ctx.rotate(-.25); ctx.fillStyle = sl; ctx.translate(-x, -cy); ctx.fillRect(x - W * .25, cy - H, W * .5, H * 2); ctx.restore();
    }
    // 颜色代表的性格
    const a = mi ? smooth(GONG[mi - 1] + .1, GONG[mi - 1] + .35, t) : smooth(1.2, 1.6, t);
    ctx.textAlign = 'center';
    const tx = LAND ? W * .2 : W / 2, ty = LAND ? H * .48 : H * .86;
    ctx.fillStyle = `rgba(245,225,170,${a})`; ctx.font = `900 ${Math.round(110 * u)}px 'Noto Serif SC'`; ctx.fillText(M.name, tx, ty);
    ctx.fillStyle = `rgba(245,235,215,${.85 * a})`; ctx.font = `900 ${Math.round(46 * u)}px 'Noto Serif SC'`; ctx.fillText('· ' + M.trait + ' ·', tx, ty + 74 * u);
    ctx.fillStyle = `rgba(245,225,170,${.5 * a})`; ctx.font = `400 ${Math.round(16 * u)}px 'JetBrains Mono'`; ctx.fillText(`MASK ${mi + 1} / 3`, tx, ty + 118 * u);
  }
});
