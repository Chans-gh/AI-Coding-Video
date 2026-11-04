// C-191 柯比式 60 年代美漫：同一组形状画两遍：色版画布上用青、品红、黄三种网点图案（每种转不同角度、点的大小代表浓淡）正片叠底出颜色，墨版画布上画粗黑轮廓、「形状减去朝光源平移的形状」得到的大块实黑和沿明暗交界的一排平行排线；墨版整体错开几像素再叠回旧新闻纸，像套色不准。能量是一簇簇大小不一的黑点，每两帧换一次位置；拟声字和对白框用手写字体。
// 风格提示词：用柯比式 60 年代美漫风格：米黄旧新闻纸上，同一组形体先印一遍平涂色块加本戴网点（青、品红、黄网点角度各不相同），再叠一遍粗黑墨线，两层故意错开几像素像套色不准；阴影是背光一侧的大块实黑加一圈平行羽化排线，能量用一簇簇大小不一、不断跳动的黑色圆点表示，构图夸张、透视强烈、人物动作张开到极致，拟声字和对白框手写。
// 题材：卡通与动漫 · 适合：超级英雄式的夸张叙事、科幻冒险、产品“超能力”宣传
const INK191 = { C: [0, 163, 217], M: [226, 60, 125], Y: [247, 212, 23] }, ANG191 = { C: 15, M: 75, Y: 0 };
scene({
  id: 'C-191', name: '柯比式 60 年代美漫', dur: 5, still: 3.0,
  fonts: ["900 200px 'Noto Sans SC'", "400 80px 'Ma Shan Zheng'"],
  text: '轰！就是现在这一刻——',
  init() {
    const u = SHORT / 1080;
    const paper = makePaper('#efe0bf', { w: W / 2, h: H / 2, grain: 16, fiber: .8, blot: 14, seed: 19 });
    const col = mk(W, H), ink = mk(W, H), tmp = mk(W, H), cg = col.getContext('2d');
    // 网点图案：一格 P，点的面积 = 覆盖率
    const P = 9 * u, pats = {};
    for (const k of 'CMY') for (const cov of [.15, .3, .5, .7]) {
      const c = mk(Math.ceil(P), Math.ceil(P)), g = c.getContext('2d'), r = P * Math.sqrt(cov / Math.PI);
      g.fillStyle = `rgb(${INK191[k]})`; g.beginPath(); g.arc(P / 2, P / 2, r, 0, TAU); g.fill();
      const p = cg.createPattern(c, 'repeat'); p.setTransform(new DOMMatrix().rotate(ANG191[k])); pats[k + cov] = p;
    }
    return { u, paper, col, ink, tmp, pats };
  },
  draw(ctx, t, s, f) {
    const { u } = s, cg = s.col.getContext('2d'), ig = s.ink.getContext('2d'), tg = s.tmp.getContext('2d');
    cg.setTransform(1, 0, 0, 1, 0, 0); ig.setTransform(1, 0, 0, 1, 0, 0); cg.clearRect(0, 0, W, H); ig.clearRect(0, 0, W, H);
    const IMP = .72, tj = stepT(t, 12);                                   // 冲到眼前的时刻；能量点一拍二跳动
    const shake = t > IMP && t < IMP + .5 ? (1 - inv(IMP, IMP + .5, t)) * 14 * u : 0;
    const sx = (hash1(Math.floor(t * 30)) - .5) * shake, sy = (hash1(Math.floor(t * 30) + 99) - .5) * shake;
    // 颜色规格：[[版, 覆盖率]]，覆盖率 1 是实地
    const colorFill = (g, p, spec) => { g.save(); g.clip(p); g.globalCompositeOperation = 'destination-out'; g.fill(p); g.globalCompositeOperation = 'multiply';
      for (const [k, c] of spec) { g.fillStyle = c >= 1 ? `rgb(${INK191[k]})` : s.pats[k + c]; g.fill(p); } g.restore(); };
    const BLUE = [['C', 1], ['M', .5]], RED = [['M', 1], ['Y', 1]], SKIN = [['Y', .3], ['M', .15]], YEL = [['Y', 1]], ORG = [['Y', 1], ['M', .3]];
    // 背景：放射色块
    const fx = (LAND ? W * .37 : W * .38) + sx, fy = (LAND ? H * .6 : H * .6) + sy;
    cg.save(); cg.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 24; i++) {
      const a0 = i / 24 * TAU + t * .05, a1 = a0 + TAU / 24, p = new Path2D(); p.moveTo(fx, fy); p.lineTo(fx + Math.cos(a0) * LONG * 1.5, fy + Math.sin(a0) * LONG * 1.5); p.lineTo(fx + Math.cos(a1) * LONG * 1.5, fy + Math.sin(a1) * LONG * 1.5); p.closePath();
      for (const [k, c] of (i % 2 ? [['Y', .5]] : [['Y', .7], ['M', .3]])) { cg.fillStyle = s.pats[k + c]; cg.fill(p); }
    }
    cg.restore();
    // 速度线（墨版）
    ig.strokeStyle = '#111'; ig.lineCap = 'round';
    for (let i = 0; i < 40; i++) { const a = hash1(i) * TAU, r0 = LONG * (.25 + .2 * hash1(i + 7)), r1 = r0 + LONG * (.15 + .3 * hash1(i + 3)); ig.lineWidth = (2 + 5 * hash1(i + 11)) * u; ig.beginPath(); ig.moveTo(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0); ig.lineTo(fx + Math.cos(a) * r1, fy + Math.sin(a) * r1); ig.stroke(); }
    // ---- 英雄：拳头冲向镜头的强透视，局部坐标原点在拳头 ----
    const zoom = lerp(.3, 1, eOutBack(inv(0, IMP, t), 1.4)), k = u * (LAND ? .95 : .82) * zoom, bob = Math.sin(t * 3) * 6;
    const M = new DOMMatrix().translate(fx, fy).rotate(LAND ? -4 : -32).scale(k, k).translate(0, bob);
    const limb = (pts, rs) => {                                    // 一串点、各点半径 → 粗细渐变的肢体外形
      const p = new Path2D(), L = [], R = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; L.push([pts[i][0] - dy / l * rs[i], pts[i][1] + dx / l * rs[i]]); R.push([pts[i][0] + dy / l * rs[i], pts[i][1] - dx / l * rs[i]]); }
      p.moveTo(...L[0]); for (const q of L.slice(1)) p.lineTo(...q); for (const q of R.reverse()) p.lineTo(...q); p.closePath();
      p.moveTo(pts[0][0] + rs[0], pts[0][1]); p.arc(pts[0][0], pts[0][1], rs[0], 0, TAU); p.moveTo(pts.at(-1)[0] + rs.at(-1), pts.at(-1)[1]); p.arc(pts.at(-1)[0], pts.at(-1)[1], rs.at(-1), 0, TAU);
      return p;
    };
    const tr = p => { const q = new Path2D(); q.addPath(p, M); return q; };
    const wv = Math.sin(t * 5);
    const cape = new Path2D(); cape.moveTo(250, -280); cape.bezierCurveTo(450, -520, 650, -560 + wv * 30, 900, -470 + wv * 40); cape.lineTo(860, -380 - wv * 20); cape.lineTo(960, -300 + wv * 30); cape.bezierCurveTo(800, -200, 650, -120, 470, -150); cape.closePath();
    const parts = [
      [cape, RED],
      [limb([[450, -130], [640, -230], [830, -200]], [80, 60, 55]), BLUE], [limb([[790, -205], [880, -190]], [58, 52]), RED],
      [limb([[300, -210], [440, -110]], [135, 100]), BLUE],
      [limb([[420, -80], [570, -10], [720, 30]], [85, 62, 55]), BLUE], [limb([[690, 25], [790, 50]], [58, 54]), RED],
      [limb([[400, -290], [520, -390], [600, -350]], [55, 45, 40]), BLUE], [limb([[600, -350]], [55]), RED],
      [(() => { const p = new Path2D(); p.arc(360, -380, 82, 0, TAU); return p; })(), SKIN],
      [(() => { const p = new Path2D(); p.arc(360, -380, 84, Math.PI * .97, Math.PI * 2.08); p.lineTo(430, -372); p.lineTo(360, -366); p.lineTo(280, -370); p.closePath(); return p; })(), BLUE],
      [(() => { const p = new Path2D(); p.moveTo(230, -260); p.lineTo(300, -150); p.lineTo(370, -270); p.lineTo(330, -270); p.lineTo(300, -210); p.lineTo(270, -260); p.closePath(); return p; })(), YEL],
      [(() => { const p = new Path2D(); p.moveTo(300, -455); p.quadraticCurveTo(350, -490, 410, -462); p.lineTo(404, -444); p.quadraticCurveTo(350, -470, 306, -438); p.closePath(); return p; })(), YEL],
      [limb([[230, -240], [120, -110], [40, -30]], [72, 82, 100]), BLUE],
      [(() => { const p = new Path2D(); p.arc(0, 0, 150, 0, TAU); return p; })(), RED],
    ].map(([p, c]) => [tr(p), c]);
    // 色版
    for (const [p, c] of parts) colorFill(cg, p, c);
    // 墨版：先擦掉后面的墨，再画实黑阴影、排线、轮廓
    const d = 26 * k, dl = [-d * .8, -d];
    for (const [p] of parts) {
      ig.save(); ig.clip(p);
      ig.globalCompositeOperation = 'destination-out'; ig.fill(p); ig.globalCompositeOperation = 'source-over';
      ig.fillStyle = '#111'; ig.fill(p); ig.globalCompositeOperation = 'destination-out'; ig.translate(...dl); ig.fill(p); ig.restore();
      // 羽化排线：只留在实黑边外一窄条
      tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, W, H); tg.save(); tg.clip(p); tg.strokeStyle = '#111'; tg.lineWidth = 2.6 * u; tg.beginPath();
      const b = 9 * u; for (let x = -H; x < W; x += b) { tg.moveTo(x, 0); tg.lineTo(x + H * .6, H); } tg.stroke(); tg.restore();
      tg.globalCompositeOperation = 'destination-out'; tg.translate(dl[0] * 1.9, dl[1] * 1.9); tg.fill(p); tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-over';
      ig.save(); ig.clip(p); ig.drawImage(s.tmp, 0, 0); ig.restore();
      // 外轮廓：描粗线再挖掉形状内部，关节处的圆就不会露线
      tg.clearRect(0, 0, W, H); tg.lineWidth = 14 * u * zoom; tg.lineJoin = 'round'; tg.strokeStyle = '#111'; tg.stroke(p);
      tg.globalCompositeOperation = 'destination-out'; tg.fill(p); tg.globalCompositeOperation = 'source-over'; ig.drawImage(s.tmp, 0, 0);
    }
    // 面部和拳头的细节墨线（同一个变换）
    ig.save(); ig.setTransform(M); ig.lineCap = 'round'; ig.strokeStyle = '#111'; ig.fillStyle = '#111';
    ig.lineWidth = 11; ig.beginPath(); ig.moveTo(298, -418); ig.lineTo(352, -400); ig.moveTo(378, -404); ig.lineTo(428, -428); ig.stroke();   // 怒眉
    ig.beginPath(); ig.moveTo(320, -345); ig.quadraticCurveTo(355, -300, 400, -350); ig.closePath(); ig.fill();                            // 张嘴大喊
    ig.lineWidth = 8; for (let i = -1; i <= 2; i++) { ig.beginPath(); ig.arc(-20 + i * 55, -60, 40, Math.PI * 1.05, Math.PI * 1.85); ig.stroke(); }   // 指节
    ig.beginPath(); ig.moveTo(-120, 30); ig.quadraticCurveTo(-40, 90, 80, 70); ig.stroke();
    ig.restore();
    // 能量：一簇簇大小不一的黑点，每两帧跳一次
    const nE = t < IMP ? 0 : 14;
    for (let c = 0; c < nE; c++) {
      const h = hash1(c * 13 + Math.floor(tj * 12) * 3), a = c / nE * TAU + h * .6, rr = (200 + 260 * hash1(c + 5) + 60 * h) * k / zoom * zoom;
      const cx = fx + Math.cos(a) * rr, cy = fy + Math.sin(a) * rr, sz = (18 + 26 * hash1(c + 9)) * u * eOutBack(inv(IMP, IMP + .25, t));
      ig.fillStyle = '#111'; ig.beginPath();
      for (let j = 0; j < 9; j++) { const hj = hash1(c * 37 + j + Math.floor(tj * 12) * 7), q = (j / 9) * TAU + hj, r = sz * (.3 + .9 * hj); const x = cx + Math.cos(q) * sz * 1.3 * hash1(j + c), y = cy + Math.sin(q) * sz * 1.3 * hash1(j + c + 1); ig.moveTo(x + r, y); ig.arc(x, y, r, 0, TAU); }
      ig.fill(); ig.fillStyle = 'rgba(0,0,0,0)';
    }
    // 叠印：纸 → 色版正片叠底 → 墨版错开几像素
    ctx.drawImage(s.paper, 0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .92; ctx.drawImage(s.col, 0, 0); ctx.globalAlpha = 1;
    ctx.drawImage(s.ink, 5 * u, -3 * u); ctx.restore();
    // 面罩上的眼洞（纸白加黑边）
    ctx.save(); ctx.setTransform(new DOMMatrix().translate(5 * u, -3 * u).multiply(M)); ctx.fillStyle = '#fbf6e8'; ctx.strokeStyle = '#111'; ctx.lineWidth = 6;
    for (const [ex, ey, r] of [[330, -392, .1], [400, -398, -.15]]) { ctx.beginPath(); ctx.ellipse(ex, ey, 24, 11, r, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    // 拟声字：「轰！」黄字黑边，红色立体厚度
    const sp = eOutBack(inv(IMP, IMP + .3, t), 2.2);
    if (sp > 0) {
      const sxy = LAND ? [W * .73, H * .8] : [W * .62, H * .86], fs = Math.round((LAND ? 300 : 260) * u);
      ctx.save(); ctx.translate(sxy[0] + sx, sxy[1] + sy); ctx.rotate(-.18); ctx.transform(1, 0, -.25, 1, 0, 0); ctx.scale(sp, sp);
      ctx.font = `900 ${fs}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      for (let i = 12; i > 0; i--) { ctx.fillStyle = `rgb(${INK191.M.map((v, j) => Math.round(v * .55 + INK191.Y[j] * .1))})`; ctx.fillText('轰！', i * 1.6 * u, i * 1.4 * u); }
      ctx.lineWidth = 16 * u; ctx.strokeStyle = '#111'; ctx.strokeText('轰！', 0, 0);
      ctx.fillStyle = `rgb(${INK191.Y})`; ctx.fillText('轰！', 0, 0);
      ctx.restore();
    }
    // 旁白框和对白框（手写字）
    ctx.save(); ctx.lineWidth = 5 * u; ctx.strokeStyle = '#111';
    const cap = LAND ? [W * .05, H * .07] : [W * .07, H * .05];
    ctx.font = `400 ${Math.round(52 * u)}px 'Ma Shan Zheng'`; const cw = ctx.measureText('就在这一刻——').width + 40 * u;
    ctx.fillStyle = `rgb(${INK191.Y})`; ctx.fillRect(cap[0], cap[1], cw, 80 * u); ctx.strokeRect(cap[0], cap[1], cw, 80 * u);
    ctx.fillStyle = '#111'; ctx.textBaseline = 'middle'; ctx.fillText('就在这一刻——', cap[0] + 20 * u, cap[1] + 42 * u);
    const bp = eOutBack(inv(1.5, 1.8, t));
    if (bp > 0) {
      const head = M.transformPoint(new DOMPoint(360, -380)), bx = LAND ? W * .22 : W * .3, by = LAND ? H * .3 : H * .2;
      ctx.translate(bx, by); ctx.scale(bp, bp);
      ctx.fillStyle = '#fbf6e8'; ctx.beginPath(); ctx.ellipse(0, 0, 230 * u, 110 * u, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(60 * u, 80 * u); ctx.lineTo((head.x - bx) * .7, (head.y - by) * .7); ctx.lineTo(130 * u, 60 * u); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, 230 * u, 110 * u, 0, .62, .32 + TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60 * u, 96 * u); ctx.lineTo((head.x - bx) * .7, (head.y - by) * .7); ctx.lineTo(132 * u, 76 * u); ctx.stroke();
      ctx.fillStyle = '#111'; ctx.font = `400 ${Math.round(92 * u)}px 'Ma Shan Zheng'`; ctx.textAlign = 'center';
      ctx.fillText('就是现在！'.slice(0, Math.ceil(5 * inv(1.6, 2.3, t))), 0, 6 * u);
    }
    ctx.restore();
    // 画格边框
    ctx.strokeStyle = '#111'; ctx.lineWidth = 10 * u; ctx.strokeRect(26 * u, 26 * u, W - 52 * u, H - 52 * u);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(21 * u, 21 * u, W - 42 * u, H - 42 * u); ctx.clip('evenodd'); ctx.drawImage(s.paper, 0, 0, W, H); ctx.restore();
  }
});
