// C-130 古希腊黑绘陶瓶：init 里把一圈人物饰带（赛跑者、持盾武士、骑手、弹里拉琴的人，黑剪影上用陶色细线刻出细节，点缀紫红和白）、棕榈叶带、回纹带各画成一张首尾相接的长条；每帧按圆柱把它们一条条竖切贴到瓶身上（越到两边压得越窄），饰带随瓶子转动横移、上下沿的花纹反向滚动，再叠上圆柱明暗和釉面高光。
// 风格提示词：用古希腊黑绘陶瓶风格：橙红陶土底上人物和动物都是光亮的黑色剪影，细节用刻线刮出、露出底下的陶色，偶尔点一点紫红和白，画面绕着弧形瓶身展开，回纹和棕榈叶饰带在上下沿反向滚动，镜头像转动陶瓶一样横移换场，配里拉琴拨弦。
// 题材：手绘与绘画 · 适合：神话故事、体育竞技、古典文学
scene({
  id: 'C-130', name: '古希腊黑绘陶瓶', dur: 5, still: 2.4,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    const CL = '#D27A3E', BK = '#17110E', PU = '#7A2626', WH = '#EFE4CC';
    // 瓶形：v 从上到下 0–1 → 半径（相对 sc）
    const KP = [[0, .27], [.035, .27], [.05, .19], [.17, .18], [.27, .36], [.36, .47], [.47, .5], [.58, .48], [.7, .4], [.84, .22], [.885, .16], [.9, .23], [1, .24]];
    const prof = v => { let i = 1; while (i < KP.length - 1 && KP[i][0] < v) i++; const [a, ra] = KP[i - 1], [b, rb] = KP[i], q = clamp((v - a) / (b - a)); if (i <= 3 || i >= 11) return lerp(ra, rb, q); const r0 = KP[i - 2][1], r3 = KP[Math.min(i + 1, KP.length - 1)][1];
      return .5 * (2 * ra + (rb - r0) * q + (2 * r0 - 5 * ra + 4 * rb - r3) * q * q + (3 * ra - r0 - 3 * rb + r3) * q * q * q); };   // Catmull-Rom
    const VH = LAND ? H * 1.7 : H * .9, sc = LAND ? W * .8 : W * .96, top = LAND ? H * .5 - VH * .52 : H * .06, cx = W / 2;
    const Y = v => top + v * VH, Rr = v => prof(v) * sc;
    const outline = []; for (let i = 0; i <= 100; i++) { const v = i / 100; outline.push([cx + Rr(v), Y(v)]); }
    for (let i = 100; i >= 0; i--) { const v = i / 100; outline.push([cx - Rr(v), Y(v)]); }
    // 长条纹理：长度 = 这一圈的周长
    const band = (v0, v1, fn) => { const r = Rr((v0 + v1) / 2), w = Math.round(TAU * r), h = Math.round(Y(v1) - Y(v0)), c = mk(w, h), g = c.getContext('2d');
      g.fillStyle = CL; g.fillRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round'; fn(g, w, h); return { c, w, h, v0, v1, r }; };
    // 人物饰带
    const fr = band(.37, .62, (g, w, h) => {
      const k = h / 120, gy = h * .9, R = mulberry32(3);
      g.fillStyle = BK; g.fillRect(0, gy, w, 3 * k);
      const inc = (pts, lw = .7) => { g.strokeStyle = CL; g.lineWidth = lw * k; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); };
      const limb = (pts, lw) => { g.strokeStyle = BK; g.lineWidth = lw * k; g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); };
      // 人：原点在脚下，朝右，单位 k
      const man = (x, o = {}) => { g.save(); g.translate(x, gy); if (o.left) g.scale(-1, 1); const P = (a, b) => [a * k, b * k];
        const sk = o.white ? WH : BK, s = o.run ?? .4;
        g.lineCap = 'round';
        const leg = (a, b, c) => { limb([a, b], 12); limb([b, c], 8); g.fillStyle = BK; g.beginPath(); g.ellipse(c[0] + 3 * k, c[1] - 1 * k, 6 * k, 2.4 * k, 0, 0, TAU); g.fill(); };
        leg(P(-3, -50), P(-16 * s - 4, -27), P(-28 * s - 4, -5)); leg(P(3, -50), P(14 * s + 5, -28), P(10 * s + 10, -4));   // 腿：大腿粗、小腿细
        g.fillStyle = sk; g.beginPath(); g.moveTo(...P(-11, -85)); g.lineTo(...P(12, -85)); g.quadraticCurveTo(...P(15, -72), ...P(7, -50)); g.lineTo(...P(-8, -50)); g.quadraticCurveTo(...P(-13, -68), ...P(-11, -85)); g.closePath(); g.fill();
        if (o.white) { g.fillStyle = BK; g.beginPath(); g.moveTo(...P(-8, -76)); g.lineTo(...P(9, -76)); g.lineTo(...P(14, -4)); g.lineTo(...P(-12, -4)); g.closePath(); g.fill();
          for (let i = 0; i < 4; i++) inc([P(-6 + i * 5, -70), P(-9 + i * 6.5, -8)], .6); g.fillStyle = PU; g.fillRect(...P(-9, -40), 21 * k, 4 * k); }
        g.fillStyle = sk; g.beginPath(); g.arc(...P(3, -94), 9.5 * k, 0, TAU); g.fill(); g.beginPath(); g.moveTo(...P(9, -96)); g.lineTo(...P(14, -91)); g.lineTo(...P(9, -89)); g.fill();
        limb([P(-6, -80), ...(o.armB || [P(-20, -66), P(-28, -76)])], 7.5); g.strokeStyle = sk;
        if (o.white) { g.strokeStyle = WH; g.lineWidth = 7 * k; g.beginPath(); [P(5, -80), ...(o.armF || [P(18, -70), P(28, -80)])].forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke(); }
        else limb([P(6, -80), ...(o.armF || [P(18, -70), P(28, -80)])], 7.5);
        g.fillStyle = o.white ? BK : CL; g.beginPath(); g.ellipse(...P(6, -94), 2.2 * k, 1.1 * k, 0, 0, TAU); g.fill();       // 刻出的眼
        if (!o.white) { inc([P(-5, -76), P(3, -70), P(7, -76)]); inc([P(-1, -64), P(3, -58), P(1, -52)]); inc([P(-6, -100), P(0, -102), P(8, -100)], .6);
          if (o.beard) { g.fillStyle = PU; g.beginPath(); g.moveTo(...P(4, -88)); g.lineTo(...P(12, -88)); g.lineTo(...P(6, -78)); g.fill(); } }
        else { g.fillStyle = BK; g.beginPath(); g.arc(...P(1, -97), 8 * k, Math.PI * .9, Math.PI * 2.1); g.fill(); g.beginPath(); g.ellipse(...P(-6, -88), 4 * k, 9 * k, 0, 0, TAU); g.fill(); }
        if (o.item) o.item(P); g.restore(); };
      const shield = (P, flip) => { const [x, y] = P(16, -66); g.fillStyle = BK; g.beginPath(); g.arc(x, y, 22 * k, 0, TAU); g.fill();
        g.strokeStyle = PU; g.lineWidth = 3 * k; g.beginPath(); g.arc(x, y, 18 * k, 0, TAU); g.stroke(); g.strokeStyle = CL; g.lineWidth = .7 * k; g.beginPath(); g.arc(x, y, 21 * k, 0, TAU); g.stroke();
        g.fillStyle = WH; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + Math.cos(i * TAU / 3 + .5) * 8 * k, y + Math.sin(i * TAU / 3 + .5) * 8 * k, 2.6 * k, 0, TAU); g.fill(); } };
      const helmet = P => { g.fillStyle = BK; g.beginPath(); g.moveTo(...P(-6, -101)); g.quadraticCurveTo(...P(4, -116), ...P(18, -104)); g.lineTo(...P(10, -100)); g.fill();
        g.fillStyle = PU; g.beginPath(); g.moveTo(...P(-10, -104)); g.quadraticCurveTo(...P(0, -126), ...P(16, -112)); g.quadraticCurveTo(...P(4, -114), ...P(-10, -104)); g.fill(); };
      const spear = P => { g.strokeStyle = BK; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(...P(-30, -110)); g.lineTo(...P(52, -72)); g.stroke(); g.fillStyle = BK; g.beginPath(); g.moveTo(...P(52, -72)); g.lineTo(...P(44, -78)); g.lineTo(...P(46, -70)); g.fill(); };
      const lyre = P => { g.strokeStyle = BK; g.lineWidth = 3 * k; g.beginPath(); g.moveTo(...P(20, -96)); g.quadraticCurveTo(...P(14, -70), ...P(24, -62)); g.quadraticCurveTo(...P(34, -70), ...P(30, -96)); g.stroke();
        g.lineWidth = 2 * k; g.beginPath(); g.moveTo(...P(18, -94)); g.lineTo(...P(32, -94)); g.stroke(); g.fillStyle = BK; g.beginPath(); g.ellipse(...P(24, -64), 7 * k, 5 * k, 0, 0, TAU); g.fill();
        g.strokeStyle = CL; g.lineWidth = .5 * k; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(...P(21 + i * 2, -93)); g.lineTo(...P(22 + i * 1.2, -66)); g.stroke(); } };
      const horse = (x, left) => { g.save(); g.translate(x, gy); if (left) g.scale(-1, 1); const P = (a, b) => [a * k, b * k];
        g.fillStyle = BK; g.beginPath(); g.ellipse(...P(0, -52), 30 * k, 13 * k, 0, 0, TAU); g.fill();
        g.beginPath(); g.moveTo(...P(20, -60)); g.quadraticCurveTo(...P(36, -84), ...P(44, -88)); g.lineTo(...P(56, -74)); g.lineTo(...P(50, -70)); g.lineTo(...P(38, -72)); g.lineTo(...P(28, -48)); g.fill();
        for (const [a, b, c] of [[-24, -40, 1], [-16, -38, -1], [20, -42, 1], [26, -44, -1]]) limb([P(a, b), P(a + c * 8, -20), P(a + c * 2, 0)], 4.5);
        g.strokeStyle = BK; g.lineWidth = 4 * k; g.beginPath(); g.moveTo(...P(-29, -56)); g.quadraticCurveTo(...P(-44, -50), ...P(-42, -26)); g.stroke();
        g.fillStyle = PU; g.beginPath(); g.moveTo(...P(26, -64)); g.quadraticCurveTo(...P(34, -86), ...P(44, -90)); g.lineTo(...P(40, -80)); g.quadraticCurveTo(...P(32, -74), ...P(30, -60)); g.fill();   // 鬃毛
        inc([P(-18, -58), P(-4, -62), P(12, -58)]); inc([P(-26, -50), P(-20, -44)]); g.fillStyle = CL; g.beginPath(); g.arc(...P(46, -82), 1.4 * k, 0, TAU); g.fill();
        g.restore(); };
      const tree = x => { g.strokeStyle = BK; g.lineWidth = 2.4 * k; g.beginPath(); g.moveTo(x, gy); g.quadraticCurveTo(x + 6 * k, gy - 50 * k, x - 4 * k, gy - 100 * k); g.stroke();
        for (let i = 0; i < 9; i++) { const yy = gy - (30 + i * 8) * k, sd = i % 2 ? 1 : -1; g.fillStyle = BK; g.beginPath(); g.ellipse(x + sd * 10 * k, yy, 9 * k, 3 * k, sd * .5, 0, TAU); g.fill(); } };
      // 一圈排开：武士对峙 · 树 · 赛跑 · 树 · 骑手 · 女子与琴师
      const sp = w / k / 990; let x = 40;
      const put = (dx, f) => { x += dx * sp; f(x * k); };
      put(0, X => man(X, { run: .5, item: P => { spear(P); helmet(P); shield(P); }, beard: true, armF: [[18 * k, -64 * k], [26 * k, -70 * k]].map(([a, b]) => [a, b]) }));
      put(110, X => man(X, { left: true, run: .5, beard: true, item: P => { spear(P); helmet(P); shield(P); } }));
      put(70, X => tree(X));
      for (let i = 0; i < 3; i++) put(i ? 62 : 70, X => man(X, { run: 1, armB: [[-20 * k, -64 * k], [-30 * k, -54 * k]], armF: [[20 * k, -84 * k], [30 * k, -96 * k]] }));
      put(70, X => tree(X));
      put(100, X => { horse(X); man(X - 6 * k, { run: .1, item: P => {}, armF: [[16 * k, -78 * k], [38 * k, -80 * k]] }); });
      put(110, X => horse(X, true));
      put(80, X => man(X, { white: true, run: .15, armF: [[16 * k, -76 * k], [22 * k, -88 * k]], armB: [[-12 * k, -70 * k], [-14 * k, -56 * k]] }));
      put(70, X => man(X, { left: true, run: .15, beard: true, item: lyre, armF: [[16 * k, -76 * k], [22 * k, -84 * k]] }));
      put(80, X => tree(X));
      // 刻线的分隔条
      g.fillStyle = BK; g.fillRect(0, 0, w, 2.5 * k);
    });
    // 棕榈叶 + 莲花带（肩）
    const pal = band(.265, .35, (g, w, h) => { const n = Math.round(w / (h * 1.1)), cw = w / n;
      g.fillStyle = BK; g.fillRect(0, h - 3 * u, w, 3 * u);
      for (let i = 0; i < n; i++) { const x = (i + .5) * cw, b = h * .9;
        if (i % 2 === 0) for (let p = -3; p <= 3; p++) { const a = -Math.PI / 2 + p * .32; g.fillStyle = p % 2 ? PU : BK; g.beginPath(); g.ellipse(x + Math.cos(a) * h * .34, b + Math.sin(a) * h * .34, h * .26, h * .07, a, 0, TAU); g.fill(); }
        else { g.fillStyle = BK; g.beginPath(); g.moveTo(x, b - h * .78); g.lineTo(x - h * .16, b - h * .2); g.lineTo(x + h * .16, b - h * .2); g.fill(); g.beginPath(); g.moveTo(x - h * .3, b - h * .5); g.quadraticCurveTo(x - h * .2, b - h * .1, x, b); g.quadraticCurveTo(x + h * .2, b - h * .1, x + h * .3, b - h * .5); g.lineWidth = 2.5 * u; g.strokeStyle = BK; g.stroke(); }
        g.fillStyle = BK; g.beginPath(); g.arc(x, b, h * .07, 0, TAU); g.fill();
        g.strokeStyle = BK; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(x + h * .1, b); g.quadraticCurveTo(x + cw / 2, b + h * .1, x + cw - h * .1, b); g.stroke(); } });
    // 回纹带（下）
    const mea = band(.635, .675, (g, w, h) => { const s = h * .16, n = Math.round(w / (s * 6)), cw = w / n; g.strokeStyle = BK; g.lineWidth = s * .7; g.lineCap = 'square';
      g.fillStyle = BK; g.fillRect(0, 0, w, s * .5); g.fillRect(0, h - s * .5, w, s * .5);
      for (let i = 0; i < n; i++) { const x = i * cw, y0 = h * .82, q = cw / 6; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + 5 * q, y0); g.lineTo(x + 5 * q, y0 - 4 * q); g.lineTo(x + q, y0 - 4 * q); g.lineTo(x + q, y0 - 2 * q); g.lineTo(x + 3 * q, y0 - 2 * q); g.stroke(); } });
    // 光芒带（足）
    const ray = band(.69, .86, (g, w, h) => { const n = Math.round(w / (h * .35)); g.fillStyle = BK; for (let i = 0; i < n; i++) { const x = (i + .5) * w / n; g.beginPath(); g.moveTo(x - w / n * .4, h); g.lineTo(x, h * .08); g.lineTo(x + w / n * .4, h); g.fill(); } });
    // 背景：暗色展柜 + 顶光
    const bg = mk(W, H), bgc = bg.getContext('2d'); bgc.fillStyle = '#16120F'; bgc.fillRect(0, 0, W, H);
    const sp = bgc.createRadialGradient(cx, H * .3, 0, cx, H * .3, LONG * .7); sp.addColorStop(0, 'rgba(120,96,70,.5)'); sp.addColorStop(1, 'rgba(0,0,0,0)'); bgc.fillStyle = sp; bgc.fillRect(0, 0, W, H);
    const clay = makePaper(CL, { grain: 8, fiber: .1, blot: 14, seed: 6 });
    return { u, outline, Y, Rr, cx, fr, pal, mea, ray, bg, clay, BK, CL };
  },
  draw(ctx, t, s) {
    const { u, cx, Y, Rr } = s;
    ctx.drawImage(s.bg, 0, 0);
    // 瓶子在展柜台上的影子
    const path = () => { ctx.beginPath(); s.outline.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); };
    ctx.save(); path(); ctx.clip();
    ctx.drawImage(s.clay, 0, 0, W, H);
    // 黑釉：口、颈、下腹以下以外的部分
    ctx.fillStyle = s.BK; ctx.fillRect(0, Y(0), W, Y(.265) - Y(0)); ctx.fillRect(0, Y(.86), W, Y(1) - Y(.86)); ctx.fillRect(0, Y(.35), W, Y(.37) - Y(.35)); ctx.fillRect(0, Y(.62), W, Y(.635) - Y(.62)); ctx.fillRect(0, Y(.675), W, Y(.69) - Y(.675));
    // 贴圆柱：竖切
    const rot = t * .2 + eInOutCubic(inv(2.2, 3.6, t)) * .9;                     // 转瓶：中间加快一段换场
    const wrap = (B, off) => { const r = B.r, y0 = Y(B.v0), y1 = Y(B.v1), step = 3;
      for (let x = -r; x < r; x += step) { const th = Math.asin(clamp(x / r, -1, 1)), th2 = Math.asin(clamp((x + step) / r, -1, 1));
        let tx = (((th + off) / TAU) % 1 + 1) % 1 * B.w, sw = Math.max(1, (th2 - th) / TAU * B.w); if (tx + sw > B.w) tx = B.w - sw;
        ctx.drawImage(B.c, tx, 0, sw, B.h, cx + x, y0, step + .6, y1 - y0); } };
    wrap(s.fr, rot); wrap(s.pal, -t * .35); wrap(s.mea, t * .35 + 1); wrap(s.ray, rot * .5);
    // 圆柱明暗 + 釉面高光
    const R0 = Rr(.5), sh = ctx.createLinearGradient(cx - R0 * 1.05, 0, cx + R0 * 1.05, 0);
    sh.addColorStop(0, 'rgba(10,6,4,.85)'); sh.addColorStop(.2, 'rgba(10,6,4,.25)'); sh.addColorStop(.45, 'rgba(0,0,0,0)'); sh.addColorStop(.8, 'rgba(10,6,4,.35)'); sh.addColorStop(1, 'rgba(10,6,4,.9)');
    ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    const hl = ctx.createLinearGradient(cx - R0 * .55, 0, cx - R0 * .25, 0); hl.addColorStop(0, 'rgba(255,240,220,0)'); hl.addColorStop(.5, 'rgba(255,240,220,.28)'); hl.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = hl; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.restore();
    // 把手（侧面两个黑环）
    ctx.strokeStyle = s.BK; ctx.lineWidth = 16 * u * (LAND ? 1.4 : 1); ctx.lineCap = 'round';
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * Rr(.12), Y(.1)); ctx.bezierCurveTo(cx + sd * Rr(.12) * 2.2, Y(.08), cx + sd * Rr(.3) * 1.2, Y(.22), cx + sd * Rr(.3) * .96, Y(.3)); ctx.stroke(); }
    vignette(ctx, .45, .4);
  }
});
