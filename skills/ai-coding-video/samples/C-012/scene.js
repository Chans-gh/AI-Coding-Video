// C-012 手绘卡通角色片：p5.js（instance 模式，逐帧 redraw）配 p5.brush 的水彩填色和铅笔线，角色线条按 12 帧/秒换种子“抖”，背景种子固定；一滴雨落在头顶的小芽上，角色吓一跳、看着芽开出花，再高兴地蹦两下。
// 风格提示词：用手绘卡通角色片风格：纸张质感背景，用 p5.brush 水彩笔刷上色、线条略带抖动，角色造型简单且全片固定，有清晰表情和夸张但克制的表演，每个镜头围绕角色情绪展开。
// 题材：手绘与绘画 · 适合：角色短片、个人故事
scene({
  id: 'C-012', name: '手绘卡通角色片', dur: 4, still: 3.05, libs: ['p5.brush'], text: '小团开花了',
  fonts: ["400 80px 'ZCOOL KuaiLe'"],
  async init() {
    const paper = makePaper('#F4ECDC', { seed: 12, grain: 14, fiber: .45, blot: 6 });
    const u = SHORT / 1080;
    const L = LAND
      ? { cx: W * .40, gy: H * .80, R: 250 * u, cap: [W * .74, H * .30] }
      : { cx: W * .50, gy: H * .66, R: 240 * u, cap: [W * .50, H * .20] };
    const sk = await p5Sketch(p => { brush.scaleBrushes(3.2 * u); }, (p, t, f) => scene_draw(p, t, L, u), { webgl: true, brush: true, scale: .7 });
    return { sk, paper, L, u };
  },
  async draw(ctx, t, s) {
    const { L, u } = s;
    ctx.drawImage(s.paper, 0, 0, W, H);
    await s.sk.render(t);
    ctx.drawImage(s.sk.canvas, 0, 0, W, H);
    face(ctx, t, L.face, u);
    // 片尾手写字幕
    const a = smooth(2.7, 3.1, t);
    if (a > 0) {
      ctx.globalAlpha = a; ctx.fillStyle = '#5b3a2e'; ctx.textAlign = 'center';
      ctx.font = `400 ${Math.round(84 * u)}px 'ZCOOL KuaiLe'`;
      ctx.fillText('小团开花了', L.cap[0], L.cap[1] + (1 - eOutBack(a)) * 30 * u);
      ctx.globalAlpha = 1;
    }
    grain(ctx, Math.floor(t * 12), .18);
  }
});

// 脸：眼睛、嘴用 Canvas 2D 画，线条按 12 帧/秒加一点抖动
function face(ctx, t, F, u) {
  const { cx, ex, ey } = F, look = -smooth(1.55, 1.9, t) * 16 * u * (1 - smooth(2.55, 2.75, t));
  const surprised = t > .95 && t < 1.85, happy = t > 2.6, sd = Math.floor(t * 12);
  ctx.fillStyle = ctx.strokeStyle = '#2b1d17'; ctx.lineCap = ctx.lineJoin = 'round';
  if (happy) {
    ctx.lineWidth = 7 * u;
    for (const d of [-1, 1]) { ctx.beginPath(); const c = circlePts(cx + d * ex, ey + 8 * u, 20 * u, 16, Math.PI * 1.1, Math.PI * 1.9, 1.5 * u, sd + d); c.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.stroke(); }
  } else {
    const blink = (t > .3 && t < .4) ? .15 : 1, er = (surprised ? 22 : 14) * u;
    for (const d of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(cx + d * ex, ey + look, er, er * blink, 0, 0, TAU); ctx.fill();
      if (surprised) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + d * ex + 6 * u, ey + look - 7 * u, 6 * u, 0, TAU); ctx.fill(); ctx.fillStyle = '#2b1d17'; }
    }
  }
  const my = ey + 56 * u + look * .5;
  ctx.lineWidth = 6 * u;
  if (surprised) { ctx.fillStyle = '#7a3b33'; ctx.beginPath(); ctx.ellipse(cx, my + 6 * u, 14 * u, 18 * u, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  else if (happy) { ctx.fillStyle = '#9a4038'; ctx.beginPath(); ctx.moveTo(cx - 40 * u, my - 8 * u); ctx.quadraticCurveTo(cx, my - 2 * u, cx + 40 * u, my - 8 * u); ctx.quadraticCurveTo(cx + 30 * u, my + 40 * u, cx, my + 40 * u); ctx.quadraticCurveTo(cx - 30 * u, my + 40 * u, cx - 40 * u, my - 8 * u); ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(cx - 18 * u, my); ctx.quadraticCurveTo(cx, my + 10 * u, cx + 18 * u, my); ctx.stroke(); }
}

// 角色每一帧的姿态（只由 t 决定）
function pose(t) {
  let sx = 1, sy = 1, hop = 0;
  const sq = (t0, k) => { const x = (t - t0) / .14; return x > 0 && x < 1 ? Math.sin(x * Math.PI) * k : 0; };
  // 被雨滴砸中：先压扁，再一跳
  const hit = sq(.95, .16);
  sx += hit; sy -= hit;
  const j1 = inv(1.08, 1.5, t); if (j1 > 0 && j1 < 1) { hop = Math.sin(j1 * Math.PI) * 70; sy += .1 * Math.sin(j1 * Math.PI); sx -= .06 * Math.sin(j1 * Math.PI); }
  const land = sq(1.5, .1); sx += land; sy -= land;
  // 高兴：蹦两下
  for (const t0 of [2.75, 3.3]) {
    const pre = sq(t0 - .14, .08); sx += pre; sy -= pre;
    const j = inv(t0, t0 + .36, t); if (j > 0 && j < 1) { hop = Math.max(hop, Math.sin(j * Math.PI) * 48); sy += .08 * Math.sin(j * Math.PI); }
    const l = sq(t0 + .36, .07); sx += l; sy -= l;
  }
  const breathe = Math.sin(t * 5) * .015;
  return { sx: sx - breathe, sy: sy + breathe, hop };
}

function scene_draw(p, t, L, u) {
  p.clear();
  const { cx, gy, R } = L;
  // ---- 背景：种子固定，不抖 ----
  p.randomSeed(31);
  brush.noStroke(); brush.fillBleed(.25, 'out'); brush.fillTexture(.55, .45);
  brush.fill('#A9CFE0', 70); brush.rect(-40, -40, W + 80, gy + 40);            // 天空淡蓝
  brush.fill('#9CC68A', 150);
  brush.polygon([[-40, gy - 22 * u], [W * .3, gy - 40 * u], [W * .7, gy - 18 * u], [W + 40, gy - 36 * u], [W + 40, H + 40], [-40, H + 40]]);
  brush.fill('#7FAE6E', 110); brush.rect(-40, gy + 70 * u, W + 80, H, 'corner');
  brush.noFill(); brush.set('HB', '#56704a', 1);
  for (let k = 0; k < 14; k++) {                                                    // 草
    const x = W * (k + .5) / 14 + (hash1(k) - .5) * 80 * u, y = gy + (20 + hash1(k + 9) * 140) * u;
    brush.line(x, y, x - 8 * u, y - 24 * u); brush.line(x + 6 * u, y, x + 12 * u, y - 20 * u);
  }
  // 远处的小花盆：静物，交代空间
  const px = LAND ? W * .76 : W * .8, py = gy - 6 * u;
  brush.noStroke(); brush.fill('#D98C5F', 170);
  brush.polygon([[px - 60 * u, py - 90 * u], [px + 60 * u, py - 90 * u], [px + 44 * u, py], [px - 44 * u, py]]);
  brush.noFill(); brush.set('2B', '#3b2a22', 1.1);
  brush.polygon([[px - 60 * u, py - 90 * u], [px + 60 * u, py - 90 * u], [px + 44 * u, py], [px - 44 * u, py]]);

  // ---- 角色：12 帧/秒换种子，线条微微抖 ----
  p.randomSeed(100 + Math.floor(t * 12));
  const { sx, sy, hop } = pose(t);
  const by = gy - hop * u;                                // 身体底部
  const rx = R * sx, ry = R * .9 * sy, ccy = by - ry;      // 身体中心
  // 地面影子
  brush.noStroke(); brush.fill('#5d7a52', 90 * (1 - hop / 120));
  brush.polygon(circlePts(cx, gy + 6 * u, 1, 24).map(q => [cx + (q[0] - cx) * rx * (1 - hop / 200), gy + 6 * u + (q[1] - gy - 6 * u) * 18 * u]));
  const body = Array.from({ length: 28 }, (_, k) => { const a = k / 28 * TAU; return [cx + Math.cos(a) * rx, ccy + Math.sin(a) * ry * (Math.sin(a) > 0 ? .92 : 1)]; });
  brush.fill('#F4B9A6', 235); brush.fillTexture(.35, .5); brush.polygon(body);
  brush.noFill(); brush.set('pen', '#3a2a22', 2.2); brush.polygon(body);
  // 脚
  brush.set('pen', '#3a2a22', 2);
  brush.line(cx - rx * .35, by - 4 * u, cx - rx * .42, by + 14 * u); brush.line(cx + rx * .35, by - 4 * u, cx + rx * .42, by + 14 * u);
  // 小芽：头顶的茎，开花后变长
  const grow = eOutCubic(inv(1.6, 2.4, t));
  const topY = ccy - ry, stem = (40 + 90 * grow) * u, sway = Math.sin(t * 3) * 6 * u + (t > .95 && t < 1.4 ? Math.sin((t - .95) * 40) * 14 * u * (1.4 - t) : 0);
  const tipX = cx + sway, tipY = topY - stem;
  brush.set('HB', '#4c7a3a', 1.6); brush.spline([[cx, topY + 4 * u], [cx + sway * .4, topY - stem * .5], [tipX, tipY]], .5);
  brush.noStroke(); brush.fill('#7DBB5A', 200);
  const leaf = (dx) => brush.polygon([[cx + sway * .3, topY - stem * .35], [cx + sway * .3 + dx * 40 * u, topY - stem * .55 - 10 * u], [cx + sway * .3 + dx * 56 * u, topY - stem * .35 - 30 * u], [cx + sway * .3 + dx * 18 * u, topY - stem * .3 - 6 * u]]);
  leaf(-1); leaf(1);
  // 花：花瓣按 eOutBack 张开
  const bloom = eOutBack(inv(2.1, 2.6, t));
  if (bloom > 0) {
    brush.fill('#F28FA6', 210); brush.fillTexture(.5, .6);
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - Math.PI / 2 + t * .4; brush.circle(tipX + Math.cos(a) * 26 * u * bloom, tipY + Math.sin(a) * 26 * u * bloom, 20 * u * bloom); }
    brush.fill('#F7D25C', 230); brush.circle(tipX, tipY, 14 * u * bloom);
  } else {
    brush.fill('#9BD06E', 210); brush.circle(tipX, tipY, 12 * u);                         // 花苞
  }
  // 雨滴：落到芽尖，溅开
  if (t < .95) {
    const k = eInCubic(inv(.35, .95, t)), dy = lerp(-80 * u, tipY - 18 * u, k);
    brush.fill('#6FA8D6', 220); brush.polygon([[tipX, dy - 26 * u], [tipX + 12 * u, dy], [tipX, dy + 12 * u], [tipX - 12 * u, dy]]);
  } else if (t < 1.35) {
    const k = inv(.95, 1.35, t);
    brush.set('HB', '#6FA8D6', 1.4);
    for (const a of [-2.4, -1.9, -1.2, -.7]) { const r0 = (14 + 40 * k) * u; brush.line(tipX + Math.cos(a) * r0, tipY + Math.sin(a) * r0, tipX + Math.cos(a) * (r0 + 16 * u), tipY + Math.sin(a) * (r0 + 16 * u)); }
  }
  // ---- 表情：位置记下来，交给 Canvas 2D 画（深色小面积用水彩会被冲淡） ----
  L.face = { cx, ccy, rx, ry, ex: rx * .34, ey: ccy - ry * .08 };
  // 腮红
  if (t > 2.3) { brush.noStroke(); brush.fill('#EE7F8E', 150 * smooth(2.3, 2.7, t)); for (const d of [-1, 1]) brush.circle(cx + d * rx * .62, L.face.ey + 36 * u, 24 * u); }
  // 惊吓线
  if (t > .95 && t < 1.5) { brush.set('HB', '#3a2a22', 1.2); for (const d of [-1, 1]) for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + d * (.5 + k * .28); brush.line(cx + Math.cos(a) * (rx + 20 * u), ccy + Math.sin(a) * (ry + 20 * u), cx + Math.cos(a) * (rx + 52 * u), ccy + Math.sin(a) * (ry + 52 * u)); } }
}
