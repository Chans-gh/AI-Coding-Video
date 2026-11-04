// C-192 瑞克和莫蒂式扁平卡通：车库背景（洞洞板、旧冰箱改的机器、工作台）一次画好，全部是平涂加同一粗细的黑描边，只在台面下、下巴下各补一块硬阴影；两个原创角色的手臂是两节描边粗线，按关键姿势表在几帧内「啪」地换姿势（带一点回弹），眼睛是白圆加用哈希抖动的不规则小瞳孔，表演靠停顿和眼神方向；传送门是几条随时间旋转的螺旋线叠在发光的绿圆上，边缘按正弦起伏，并给整个场景泼一层绿光。
// 风格提示词：用瑞克和莫蒂式扁平卡通风格：均匀的细黑描边，几乎没有明暗，只在少数地方加一阶硬阴影，角色眼睛是带不规则小瞳孔的白圆、嘴形松散、身材比例略微怪异，背景是饱和而有点脏的平涂色，科幻道具画得像旧家电，传送门之类的特效是一团发光的绿色螺旋，表演靠姿势切换、停顿和眼神。角色全部原创，不使用剧中人物。
// 题材：卡通与动漫 · 适合：荒诞科幻喜剧、技术梗讲解、成人向短剧
const OPEN192 = 1.0, CLOSE192 = 4.35;
// 关键姿势表：t 起换到这一组；角度 0 = 手臂朝下，π/2 = 朝右
const GRAN = [
  { t: 0, aL: [.5, -.6], aR: [-.25, .1], look: [.1, .8], mo: 0, mc: .2, lean: 0 },
  { t: .78, aL: [1.6, .3], aR: [-.25, .1], look: [.4, .5], mo: .2, mc: .5, lean: .04 },     // 按下按钮
  { t: 1.08, aL: [1.4, .3], aR: [-.3, .1], look: [.8, -.7], mo: .5, mc: 0, lean: -.03 },    // 看传送门
  { t: 2.75, aL: [-1.9, -1.2], aR: [1.9, 1.2], look: [0, 0], mo: 0, mc: -.3, lean: 0 },      // 摊手、看镜头
  { t: 3.7, aL: [-1.9, -1.2], aR: [1.9, 1.2], look: [.9, .1], mo: .1, mc: -.1, lean: .02 },
  { t: 4.5, aL: [.4, -.5], aR: [-.3, .1], look: [0, 0], mo: 0, mc: .15, lean: 0 },
];
const ALIEN = [
  { t: 0, aL: [-.3, -.2], aR: [.35, -2.0], look: [-.3, .6], mo: 0, mc: .1, lean: 0, neck: 1 },
  { t: 1.12, aL: [-.5, -.3], aR: [.35, -2.0], look: [-.9, -.8], mo: .55, mc: 0, lean: -.06, neck: 1.18 },   // 吓一跳，看传送门
  { t: 1.75, aL: [-.5, -.3], aR: [.35, -2.0], look: [0, 0], mo: 0, mc: 0, lean: 0, neck: 1.1 },          // 面无表情看镜头（停顿）
  { t: 2.45, aL: [-.5, -.3], aR: [.35, -2.0], look: [-1, .1], mo: .15, mc: -.2, lean: -.02, neck: 1.05 }, // 看阿婆
  { t: 3.35, aL: [-2.6, -2.8], aR: [2.6, 2.8], look: [-.6, -.9], mo: .9, mc: 0, lean: .03, neck: 1.25 },   // 杯子掉了，双手举起
  { t: 4.5, aL: [-.3, -.2], aR: [.3, .2], look: [0, 0], mo: 0, mc: -.25, lean: 0, neck: 1 },
];
function poseAt(list, t) {
  let i = 0; while (i + 1 < list.length && list[i + 1].t <= t) i++;
  const a = list[Math.max(0, i - 1)], b = list[i], e = i === 0 ? 1 : eOutBack(inv(b.t, b.t + .09, t), 2.2);
  const L = (x, y) => Array.isArray(x) ? x.map((v, j) => lerp(v, y[j], e)) : lerp(x, y, e);
  const o = {}; for (const k in b) o[k] = L(a[k], b[k]); return o;
}
scene({
  id: 'C-192', name: '瑞克和莫蒂式扁平卡通', dur: 5, still: 2.0,
  fonts: [],
  init() {
    const u = SHORT / 1080, bg = mk(W, H), g = bg.getContext('2d'), R = mulberry32(192);
    const fy = LAND ? H * .74 : H * .7, lw = 3 * u;
    const ol = (p, c) => { g.fillStyle = c; g.fill(p); g.lineWidth = lw; g.strokeStyle = '#151515'; g.stroke(p); };
    const P = d => new Path2D(d);
    g.fillStyle = '#7f8b4a'; g.fillRect(0, 0, W, fy);
    for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(70,60,30,.06)'; g.beginPath(); g.ellipse(R() * W, R() * fy, (40 + R() * 120) * u, (20 + R() * 60) * u, 0, 0, TAU); g.fill(); }   // 脏渍
    g.fillStyle = '#6a5847'; g.fillRect(0, fy, W, H - fy); g.strokeStyle = '#151515'; g.lineWidth = lw; g.beginPath(); g.moveTo(0, fy); g.lineTo(W, fy); g.stroke();
    for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(40,30,20,.25)'; g.beginPath(); g.ellipse(R() * W, fy + R() * (H - fy), (30 + R() * 90) * u, (8 + R() * 18) * u, 0, 0, TAU); g.fill(); }   // 油渍
    // 洞洞板和工具
    const pb = LAND ? [W * .05, H * .12, W * .26, H * .3] : [W * .06, H * .52, W * .4, H * .12];
    ol(P(`M${pb[0]} ${pb[1]}h${pb[2]}v${pb[3]}h${-pb[2]}z`), '#b78a55');
    g.fillStyle = '#5a4128'; for (let x = pb[0] + 16 * u; x < pb[0] + pb[2]; x += 26 * u) for (let y = pb[1] + 16 * u; y < pb[1] + pb[3]; y += 26 * u) { g.beginPath(); g.arc(x, y, 3 * u, 0, TAU); g.fill(); }
    const tool = (x, y, s, rot, d, c) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * u, s * u); g.lineWidth = lw / (s * u); g.fillStyle = c; const p = new Path2D(d); g.fill(p); g.strokeStyle = '#151515'; g.stroke(p); g.restore(); };
    tool(pb[0] + pb[2] * .2, pb[1] + pb[3] * .5, 1, .2, 'M-8 -60h16v90a12 12 0 0 1 -16 0z M-26 -78h52v26h-52z', '#9aa3a8');
    tool(pb[0] + pb[2] * .5, pb[1] + pb[3] * .5, 1, -.3, 'M-6 -70h12v120h-12z M-22 -84a22 22 0 1 1 44 0l-8 10h-28z', '#c9c2b0');
    tool(pb[0] + pb[2] * .8, pb[1] + pb[3] * .45, 1, .1, 'M-5 -40h10v90h-10z M-20 -60h40l-6 22h-28z', '#d9532c');
    // 旧冰箱改的机器
    const mx = LAND ? W * .84 : W * .8, mw = (LAND ? 210 : 180) * u, mh = (LAND ? 380 : 330) * u;
    ol(P(`M${mx - mw / 2} ${fy}v${-mh}q0 -24 24 -24h${mw - 48}q24 0 24 24v${mh}z`), '#d8d0a6');
    g.fillStyle = '#b6ad84'; g.fillRect(mx + mw * .3, fy - mh, mw * .2 - lw, mh);                          // 侧面一阶硬阴影
    ol(P(`M${mx - mw * .4} ${fy - mh * .62}h${mw * .8}`), '#000');
    for (const [dx, dy, c] of [[-.25, -.85, '#e2473b'], [0, -.85, '#f2c94c'], [.25, -.85, '#4bb3d9']]) { const p = new Path2D(); p.arc(mx + dx * mw, fy - mh * -dy * 1 + 0, 1, 0, 0); const q = new Path2D(); q.arc(mx + dx * mw, fy + dy * mh, 18 * u, 0, TAU); ol(q, c); }
    ol(P(`M${mx - mw * .3} ${fy - mh * .45}h${mw * .6}v${mh * .22}h${-mw * .6}z`), '#2e3b2f');
    g.strokeStyle = '#7dff5a'; g.lineWidth = 2 * u; g.beginPath(); for (let i = 0; i <= 30; i++) { const x = mx - mw * .28 + i / 30 * mw * .56, y = fy - mh * .34 + Math.sin(i * .9) * 14 * u * (i % 3 ? 1 : .3); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.strokeStyle = '#151515'; g.lineWidth = lw; g.beginPath(); g.moveTo(mx, fy - mh - 24 * u); g.lineTo(mx - 30 * u, fy - mh - 90 * u); g.moveTo(mx, fy - mh - 24 * u); g.lineTo(mx + 40 * u, fy - mh - 80 * u); g.stroke();
    for (const [x, y] of [[mx - 30 * u, fy - mh - 90 * u], [mx + 40 * u, fy - mh - 80 * u]]) { const q = new Path2D(); q.arc(x, y, 8 * u, 0, TAU); ol(q, '#e2473b'); }
    g.strokeStyle = '#151515'; g.lineWidth = 5 * u; g.beginPath(); g.moveTo(mx - mw / 2, fy - mh * .3); g.bezierCurveTo(mx - mw, fy - mh * .2, mx - mw * 1.1, fy + 20 * u, mx - mw * 1.6, fy + 10 * u); g.stroke();
    // 工作台（台面下一块硬阴影）
    const bx = LAND ? W * .03 : W * .02, bw = LAND ? W * .3 : W * .5, bh = (LAND ? 150 : 130) * u;
    g.fillStyle = '#4c3e31'; g.fillRect(bx + 10 * u, fy - bh + 30 * u, bw - 20 * u, bh - 30 * u);
    ol(P(`M${bx} ${fy - bh}h${bw}v${30 * u}h${-bw}z`), '#8b5a36');
    ol(P(`M${bx + 14 * u} ${fy - bh + 30 * u}h${22 * u}v${bh - 30 * u}h${-22 * u}z M${bx + bw - 36 * u} ${fy - bh + 30 * u}h${22 * u}v${bh - 30 * u}h${-22 * u}z`), '#8b5a36');
    for (let i = 0; i < 4; i++) { const jx = bx + bw * (.2 + i * .18), jh = (40 + R() * 40) * u; ol(P(`M${jx - 18 * u} ${fy - bh}v${-jh}h${36 * u}v${jh}z`), ['#9cd3c9', '#e8a7c0', '#f2c94c', '#a3c96a'][i]); ol(P(`M${jx - 20 * u} ${fy - bh - jh}h${40 * u}v${-10 * u}h${-40 * u}z`), '#6c6c6c'); }
    return { u, bg, fy, lw };
  },
  draw(ctx, t, s, f) {
    const { u, fy } = s;
    ctx.drawImage(s.bg, 0, 0);
    // ---- 传送门 ----
    const PC = LAND ? [W * .52, H * .38] : [W * .5, H * .27], PR = (LAND ? 230 : 250) * u;
    const op = t < OPEN192 ? 0 : t < CLOSE192 ? eOutBack(inv(OPEN192, OPEN192 + .3, t), 2) : 1 - eInCubic(inv(CLOSE192, CLOSE192 + .2, t));
    if (op > 0) {
      const r = PR * op, edge = a => r * (1 + .07 * Math.sin(5 * a + t * 7) + .04 * Math.sin(9 * a - t * 5));
      let gr = ctx.createRadialGradient(PC[0], PC[1], r * .5, PC[0], PC[1], r * 1.8); gr.addColorStop(0, 'rgba(150,255,80,.5)'); gr.addColorStop(1, 'rgba(150,255,80,0)');
      ctx.fillStyle = gr; ctx.fillRect(PC[0] - r * 2, PC[1] - r * 2, r * 4, r * 4);
      const bp = new Path2D(); for (let i = 0; i <= 90; i++) { const a = i / 90 * TAU, e = edge(a); i ? bp.lineTo(PC[0] + Math.cos(a) * e, PC[1] + Math.sin(a) * e) : bp.moveTo(PC[0] + e, PC[1]); }
      gr = ctx.createRadialGradient(PC[0], PC[1], 0, PC[0], PC[1], r); gr.addColorStop(0, '#e9ffb0'); gr.addColorStop(.35, '#7bea3a'); gr.addColorStop(1, '#2f9e2a');
      ctx.fillStyle = gr; ctx.fill(bp);
      ctx.save(); ctx.clip(bp); ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        ctx.strokeStyle = i % 2 ? 'rgba(25,110,30,.8)' : 'rgba(220,255,140,.9)'; ctx.lineWidth = (i % 2 ? 14 : 8) * u * op; ctx.beginPath();
        for (let j = 0; j <= 40; j++) { const q = j / 40, a = i / 7 * TAU + q * 4.2 - t * 6, rr = q * r * 1.05; j ? ctx.lineTo(PC[0] + Math.cos(a) * rr, PC[1] + Math.sin(a) * rr) : ctx.moveTo(PC[0], PC[1]); }
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = '#c8ff7a'; ctx.lineWidth = 6 * u; ctx.stroke(bp);
      for (let i = 0; i < 24; i++) { const a = hash1(i) * TAU + t * (1 + hash1(i + 3)), ph = (t * 1.3 + hash1(i + 9)) % 1, rr = r * (1 + ph * .5); ctx.fillStyle = `rgba(200,255,120,${1 - ph})`; ctx.beginPath(); ctx.arc(PC[0] + Math.cos(a) * rr, PC[1] + Math.sin(a) * rr, 5 * u * (1 - ph), 0, TAU); ctx.fill(); }
    }
    // ---- 角色 ----
    const gp = poseAt(GRAN, t), ap = poseAt(ALIEN, t);
    const blink = (t0) => Math.abs(t - t0) < .05;
    drawGran(ctx, s, gp, LAND ? W * .26 : W * .27, LAND ? H * .94 : H * .95, u * (LAND ? 1 : 1.35), blink(2.2) || blink(4.75), t);
    drawAlien(ctx, s, ap, LAND ? W * .73 : W * .75, LAND ? H * .95 : H * .96, u * (LAND ? 1 : 1.3), blink(.6) || blink(4.75), t);
    // 绿光泼满场景
    if (op > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      const gr = ctx.createRadialGradient(PC[0], PC[1], 0, PC[0], PC[1], LONG * .8); gr.addColorStop(0, `rgba(90,200,40,${.35 * op})`); gr.addColorStop(1, 'rgba(90,200,40,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    // 关门时一声「啵」的闪光
    const pop = inv(CLOSE192 + .15, CLOSE192 + .35, t);
    if (pop > 0 && pop < 1) { ctx.strokeStyle = `rgba(220,255,150,${1 - pop})`; ctx.lineWidth = 8 * u; ctx.beginPath(); ctx.arc(PC[0], PC[1], PR * .3 * (1 + pop * 1.5), 0, TAU); ctx.stroke(); }
  }
});

// 通用：描边形状、两节手臂、眼睛（白圆＋抖动的不规则小瞳孔）、松散的嘴
function ol192(ctx, p, c, lw) { ctx.fillStyle = c; ctx.fill(p); ctx.lineWidth = lw; ctx.strokeStyle = '#151515'; ctx.stroke(p); }
function arm192(ctx, x, y, a, l1, l2, w, c, lw) {
  const ex = x + Math.sin(a[0]) * l1, ey = y + Math.cos(a[0]) * l1, a2 = a[0] + a[1], hx = ex + Math.sin(a2) * l2, hy = ey + Math.cos(a2) * l2;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [ww, cc] of [[w + lw * 2, '#151515'], [w, c]]) { ctx.lineWidth = ww; ctx.strokeStyle = cc; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke(); }
  return [hx, hy];
}
function eye192(ctx, x, y, r, look, seed, lw, shut) {
  const p = new Path2D(); p.arc(x, y, r, 0, TAU); ol192(ctx, p, '#fbfbf5', lw);
  if (shut) { ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.stroke(); return; }
  const px = x + look[0] * r * .55, py = y + look[1] * r * .55, pr = r * .2;
  ctx.fillStyle = '#151515'; ctx.beginPath();
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, rr = pr * (.7 + .5 * hash1(seed * 13 + i)); i ? ctx.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr) : ctx.moveTo(px + rr, py); }
  ctx.fill();
}
function mouth192(ctx, x, y, w, mo, mc, lw) {
  ctx.lineWidth = lw; ctx.strokeStyle = '#151515'; ctx.lineCap = 'round';
  if (mo > .25) { const p = new Path2D(); p.moveTo(x - w / 2, y); p.bezierCurveTo(x - w / 3, y - 6, x + w / 3, y + 4, x + w / 2, y - 2); p.bezierCurveTo(x + w / 3, y + w * mo * .9, x - w / 3, y + w * mo, x - w / 2, y); ol192(ctx, p, '#5a1a1a', lw); ctx.fillStyle = '#e06a7a'; ctx.beginPath(); ctx.ellipse(x, y + w * mo * .55, w * .2, w * mo * .18, 0, 0, TAU); ctx.fill(); return; }
  ctx.beginPath(); ctx.moveTo(x - w / 2, y + mc * 8); ctx.bezierCurveTo(x - w / 5, y - mc * 14 + 4, x + w / 6, y - mc * 10 - 3, x + w / 2, y + mc * 6 + 2); ctx.stroke();
}
function drawGran(ctx, s, P, x, y, k, shut, t) {
  const lw = s.lw / k; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(P.lean);
  ctx.fillStyle = 'rgba(30,20,10,.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 110, 16, 0, 0, TAU); ctx.fill();
  for (const dx of [-30, 26]) { ol192(ctx, new Path2D(`M${dx - 12} -70h24v62h-24z`), '#8a5d4a', lw); ol192(ctx, new Path2D(`M${dx - 20} -14h40q8 0 8 10v4h-56v-4q0 -10 8 -10z`), '#3a2c2c', lw); }
  ol192(ctx, new Path2D('M-60 -250 C-110 -180 -120 -110 -100 -60 L100 -60 C120 -110 110 -180 60 -250 Z'), '#9b7cc0', lw);       // 开衫裙
  ol192(ctx, new Path2D('M-45 -220 L45 -220 L62 -70 L-62 -70 Z'), '#5ea36f', lw);                                                  // 围裙
  ol192(ctx, new Path2D('M-20 -170h40v30h-40z'), '#4a8a5c', lw);
  const hand = arm192(ctx, -62, -235, P.aL, 70, 66, 24, '#9b7cc0', lw);
  ol192(ctx, new Path2D(`M${hand[0] - 26} ${hand[1] - 40}h52v58h-52z`), '#8d9396', lw);                                            // 遥控器（旧收音机样）
  ol192(ctx, new Path2D(`M${hand[0] - 8} ${hand[1] - 30}a9 9 0 1 0 0.1 0z`), '#e2473b', lw);
  ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(hand[0] + 20, hand[1] - 40); ctx.lineTo(hand[0] + 40, hand[1] - 90); ctx.stroke();
  ol192(ctx, new Path2D(`M${hand[0] - 14} ${hand[1] + 4}a14 14 0 1 0 0.1 0z`), '#f1c9a3', lw);
  const h2 = arm192(ctx, 62, -235, P.aR, 70, 66, 24, '#9b7cc0', lw);
  ol192(ctx, new Path2D(`M${h2[0] - 14} ${h2[1]}a14 14 0 1 0 0.1 0z`), '#f1c9a3', lw);
  // 头：大圆头、灰发髻、额头上的护目镜；下巴下一块硬阴影
  ol192(ctx, new Path2D('M-18 -270h36v24h-36z'), '#f1c9a3', lw);
  ctx.fillStyle = '#c99a78'; ctx.fillRect(-18, -262, 36, 12);
  ol192(ctx, new Path2D('M0 -440 a92 92 0 1 0 0.1 0z'), '#f1c9a3', lw);
  ol192(ctx, new Path2D('M-90 -330 C-110 -420 -40 -470 10 -462 C70 -458 110 -410 92 -330 C80 -390 40 -420 0 -418 C-40 -420 -80 -390 -90 -330Z'), '#bcbcc8', lw);
  ol192(ctx, new Path2D('M0 -520 a40 34 0 1 0 0.1 0z'), '#bcbcc8', lw);
  ctx.lineWidth = 10; ctx.strokeStyle = '#3a2c2c'; ctx.beginPath(); ctx.moveTo(-88, -392); ctx.quadraticCurveTo(0, -416, 88, -392); ctx.stroke();
  for (const dx of [-32, 32]) ol192(ctx, new Path2D(`M${dx} -428a24 24 0 1 0 0.1 0z`), '#e7a33a', lw);
  eye192(ctx, -30, -350, 24, P.look, 1, lw, shut); eye192(ctx, 32, -352, 22, P.look, 2, lw, shut);
  ol192(ctx, new Path2D('M4 -340 C30 -330 34 -300 6 -300 C-14 -300 -12 -318 4 -340Z'), '#e8a988', lw);   // 大鼻头
  mouth192(ctx, 2, -282, 54, P.mo, P.mc, lw);
  ctx.restore();
}
function drawAlien(ctx, s, P, x, y, k, shut, t) {
  const lw = s.lw / k, nk = P.neck; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(P.lean);
  ctx.fillStyle = 'rgba(30,20,10,.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 90, 14, 0, 0, TAU); ctx.fill();
  for (const dx of [-24, 22]) { ol192(ctx, new Path2D(`M${dx - 11} -250h22v232h-22z`), '#3f5f8f', lw); ol192(ctx, new Path2D(`M${dx - 16} -20h${dx > 0 ? 50 : 36}q6 0 6 10v10h-56z`), '#f2f2ea', lw); }
  ol192(ctx, new Path2D('M-58 -470 L58 -470 L66 -240 L-66 -240 Z'), '#e98a3a', lw);         // 卫衣
  ol192(ctx, new Path2D('M-40 -320h80l-8 50h-64z'), '#d0742a', lw);
  const hL = arm192(ctx, -56, -455, P.aL, 110, 110, 18, '#e98a3a', lw);
  ol192(ctx, new Path2D(`M${hL[0] - 13} ${hL[1]}a13 13 0 1 0 0.1 0z`), '#7fc1c9', lw);
  const hR = arm192(ctx, 56, -455, P.aR, 110, 110, 18, '#e98a3a', lw);
  ol192(ctx, new Path2D(`M${hR[0] - 13} ${hR[1]}a13 13 0 1 0 0.1 0z`), '#7fc1c9', lw);
  // 杯子：手里拿着，3.35 秒后自由落体、落地碎成一滩
  const DROP = 3.3;
  if (t < DROP) ol192(ctx, new Path2D(`M${hR[0] - 22} ${hR[1] - 50}h44v52h-44z M${hR[0] + 22} ${hR[1] - 40}a14 14 0 0 1 0 28`), '#f2e3c4', lw);
  else {
    const dt = t - DROP, hx = 56 + Math.sin(.35) * 110 + Math.sin(.35 - 2) * 110, hy = -455 + Math.cos(.35) * 110 + Math.cos(.35 - 2) * 110, my = Math.min(hy + 1800 * dt * dt, -30);
    if (my < -30) { ctx.save(); ctx.translate(hx, my); ctx.rotate(dt * 9); ol192(ctx, new Path2D('M-22 -50h44v52h-44z'), '#f2e3c4', lw); ctx.restore(); }
    else { ol192(ctx, new Path2D(`M${hx - 70} -8 C${hx - 40} -30 ${hx + 40} -26 ${hx + 80} -6 C${hx + 40} 8 ${hx - 40} 10 ${hx - 70} -8Z`), '#7a4a2a', lw); for (const [dx, r] of [[-40, .4], [10, -.6], [50, 1.1]]) ol192(ctx, new Path2D(`M${hx + dx} -20l14 -6l6 14z`), '#f2e3c4', lw); }
  }
  // 长脖子、偏长的头、两根晃动的触角、一大一小的眼
  const ny = -470 - 120 * nk;
  ol192(ctx, new Path2D(`M-14 -470 L-12 ${ny + 10} L12 ${ny + 10} L14 -470 Z`), '#7fc1c9', lw);
  ctx.fillStyle = '#5f9ea6'; ctx.fillRect(-12, ny + 6, 24, 26);
  for (const sx of [-1, 1]) { const tx = sx * 40 + Math.sin(t * 4 + sx) * 10, ty = ny - 200; ctx.lineWidth = lw; ctx.strokeStyle = '#151515'; ctx.beginPath(); ctx.moveTo(sx * 20, ny - 150); ctx.quadraticCurveTo(sx * 30, ny - 190, tx, ty); ctx.stroke(); ol192(ctx, new Path2D(`M${tx - 10} ${ty}a10 10 0 1 0 0.1 0z`), '#f2c94c', lw); }
  ol192(ctx, new Path2D(`M0 ${ny - 170} C70 ${ny - 170} 74 ${ny + 10} 0 ${ny + 14} C-74 ${ny + 10} -70 ${ny - 170} 0 ${ny - 170}Z`), '#7fc1c9', lw);
  eye192(ctx, -24, ny - 90, 30, P.look, 5, lw, shut); eye192(ctx, 30, ny - 84, 22, P.look, 6, lw, shut);
  mouth192(ctx, 0, ny - 30, 46, P.mo, P.mc, lw);
  ctx.restore();
}
