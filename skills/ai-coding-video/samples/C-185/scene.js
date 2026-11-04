// C-185 水墨漫画：一页四格，格框是抖动的粗墨线；人物、山崖、速度线、刀光都用 brushStroke（一束会断墨的笔毛）沿折线画，衣袍是填黑的平滑形状再沿边扫几笔干笔；镜头逐格推过去，每格在镜头到达时按时间画出，最后拉远看整页；拟声字用毛笔字体，全页只有血点用朱红
// 风格提示词：用水墨漫画风格：宣纸色的漫画页被不规则的墨线框分成几格，人物用浓墨粗线勾出，衣袍是一大笔泼墨带飞白，打斗时的速度线是一笔扫过的干笔，拟声字用毛笔写成，只有血或火用一点朱红，镜头在格子之间推进，配鼓点和刀剑声。
// 题材：卡通与动漫 · 适合：武侠与仙侠故事、动作短片、国风连载
const INK = '#14110e', RED = '#c0281c';
// 每格：横版和竖版的位置（占画面比例 x, y, w, h）、镜头到达的时刻
const PANELS = [
  { L: [.03, .05, .42, .43], P: [.04, .03, .92, .29], t: 0 },
  { L: [.03, .52, .2, .43], P: [.04, .34, .44, .3], t: 1.0 },
  { L: [.25, .52, .2, .43], P: [.52, .34, .44, .3], t: 1.8 },
  { L: [.48, .05, .49, .9], P: [.04, .66, .92, .31], t: 2.6 },
];
const BEATS = [.1, 1.05, 1.95, 2.85];        // 每格的重音（sound.py 同步）
function blob(ctx, pts) { const n = pts.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; ctx.beginPath(); ctx.moveTo(...m(pts[n - 1], pts[0])); for (let i = 0; i < n; i++) ctx.quadraticCurveTo(...pts[i], ...m(pts[i], pts[(i + 1) % n])); ctx.closePath(); }
const tr = (pts, x, y, s, fl = 1) => pts.map(([a, b]) => [x + a * s * fl, y + b * s]);
// 斗笠客：站立，衣袍被风吹向右（单位：身高约 2.2）
function swordsman(ctx, x, y, s, lt, fl = 1) {
  ctx.fillStyle = INK;
  blob(ctx, tr([[-.34, -.6], [.32, -.62], [.4, -.2], [.5, .45], [.66, .96], [.3, .88], [.08, 1.0], [-.18, .9], [-.5, .98], [-.44, .3], [-.42, -.3]], x, y, s, fl)); ctx.fill();
  for (let i = 0; i < 4; i++) brushStroke(ctx, tr([[-.4 + i * .28, .2], [-.46 + i * .3, .7], [-.52 + i * .34, 1.0]], x, y, s, fl), .14 * s, 1, { dry: .6, seed: 80 + i, bristles: 8 });
  brushStroke(ctx, tr([[.2, -.5], [.6, -.2], [1.0, -.05], [1.35, .05]], x, y, s, fl), .22 * s, eOutCubic(clamp(lt * 2)), { dry: .7, seed: 3 });
  brushStroke(ctx, tr([[.3, 0], [.75, .25], [1.2, .35]], x, y, s, fl), .16 * s, eOutCubic(clamp(lt * 2 - .2)), { dry: .8, seed: 4 });
  brushStroke(ctx, tr([[-.12, .85], [-.16, 1.16]], x, y, s, fl), .09 * s, 1, { dry: .2, seed: 5 });
  brushStroke(ctx, tr([[.16, .85], [.24, 1.16]], x, y, s, fl), .09 * s, 1, { dry: .2, seed: 6 });
  ctx.strokeStyle = INK; ctx.lineWidth = .025 * s; ctx.beginPath(); ctx.moveTo(...tr([[-.4, -.55]], x, y, s, fl)[0]); ctx.lineTo(...tr([[.45, .25]], x, y, s, fl)[0]); ctx.stroke();
  ctx.fillStyle = INK; blob(ctx, tr([[-.66, -.6], [0, -.95], [.66, -.6], [.5, -.55], [-.5, -.55]], x, y, s, fl)); ctx.fill();   // 斗笠直接压在肩上
}
scene({
  id: 'C-185', name: '水墨漫画', dur: 4.6, still: 3.25,
  fonts: ["400 40px 'Ma Shan Zheng'", "700 40px 'Noto Serif SC'"],
  text: '唰斩风起孤峰月下第一话',
  init() {
    const R = mulberry32(21);
    // 格框：每条边是一条有抖动的折线
    const frames = PANELS.map((p, k) => {
      const [x, y, w, h] = (LAND ? p.L : p.P).map((v, i) => v * (i % 2 ? H : W));
      const c = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      return { x, y, w, h, edges: c.map((a, i) => { const b = c[(i + 1) % 4]; return linePts(a[0], a[1], b[0], b[1], 10, SHORT * .004, k * 9 + i); }) };
    });
    // 第 3 格的速度线、第 4 格的血点：随机量一次定好
    const speed = Array.from({ length: 46 }, () => ({ a: R() * TAU, r0: .55 + .4 * R(), w: .006 + .014 * R(), s: R() * 99 | 0 }));
    const drops = Array.from({ length: 26 }, () => ({ a: -.9 + R() * 1.4, d: .1 + .5 * R(), r: .004 + .016 * R() }));
    const paper = makePaper('#ece2cb', { seed: 2, fiber: .3 });
    return { frames, speed, drops, paper };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    // 镜头：逐格推进，最后拉远看整页
    const shot = k => { if (k >= PANELS.length) return [W / 2, H / 2, 1]; const r = s.frames[k]; return [r.x + r.w / 2, r.y + r.h / 2, Math.min(W / (r.w * 1.1), H / (r.h * 1.1))]; };
    let k = 0; while (k < PANELS.length - 1 && t >= PANELS[k + 1].t) k++;
    const out = eInOutCubic(inv(3.6, 4.3, t));
    let [cx, cy, z] = shot(k);
    if (k + 1 < PANELS.length) { const q = eInOutCubic(inv(PANELS[k + 1].t - .3, PANELS[k + 1].t, t)), [x2, y2, z2] = shot(k + 1); cx = lerp(cx, x2, q); cy = lerp(cy, y2, q); z = Math.exp(lerp(Math.log(z), Math.log(z2), q)); }
    cx = lerp(cx, W / 2, out); cy = lerp(cy, H / 2, out); z = Math.exp(lerp(Math.log(z), 0, out));
    z *= 1 + .02 * Math.sin(t * 1.3);
    const hw = W / 2 / z, hh = H / 2 / z;                   // 镜头不出页面
    cx = z >= 1 ? clamp(cx, hw, W - hw) : W / 2; cy = z >= 1 ? clamp(cy, hh, H - hh) : H / 2;
    ctx.fillStyle = '#ece2cb'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy);
    ctx.drawImage(s.paper, 0, 0, W, H);
    s.frames.forEach((r, i) => {
      const lt = t - PANELS[i].t;
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.translate(r.x, r.y);
      const w = r.w, h = r.h, m = Math.min(w, h);
      if (lt > -.15) PANEL_DRAW[i](ctx, w, h, m, Math.max(0, lt), s);
      ctx.restore();
    });
    s.frames.forEach((r, i) => r.edges.forEach((e, j) => brushStroke(ctx, e, 9 * u, 1, { dry: .25, seed: i * 4 + j + 1, taper: false })));
    ctx.restore();
  }
});
const PANEL_DRAW = [
  // 1：远山淡墨、近处山崖，月下斗笠客，旁白框
  (ctx, w, h, m, lt) => {
    for (const [y0, a, sc] of [[.62, .18, 1.0], [.7, .3, 1.6]]) {
      ctx.fillStyle = `rgba(20,17,14,${a})`; ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) ctx.lineTo(x, h * y0 - fbm(x / (m * .35) * sc, y0 * 9, 4) * h * .35); ctx.lineTo(w, h); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(20,17,14,.45)'; ctx.lineWidth = m * .006; ctx.beginPath(); ctx.arc(w * .78, h * .28, m * .12, 0, TAU); ctx.stroke();
    ctx.fillStyle = INK; blob(ctx, [[-20, h * .8], [w * .35, h * .74], [w * .55, h * .78], [w * .62, h + 20], [-20, h + 20]]); ctx.fill();
    brushStroke(ctx, [[0, h * .79], [w * .3, h * .73], [w * .58, h * .77]], m * .05, 1, { dry: .6, seed: 7 });
    swordsman(ctx, w * .36, h * .74 - m * .19 * 1.1, m * .19, lt);
    for (let i = 0; i < 6; i++) brushStroke(ctx, [[w * (.5 + i * .07), h * (.2 + i * .07)], [w * (.75 + i * .07), h * (.18 + i * .07)]], m * .008, eOutCubic(clamp(lt * 2.5 - i * .15)), { dry: .5, seed: 20 + i, bristles: 5 });
    const a = smooth(.3, .5, lt);
    if (a > 0) {
      ctx.globalAlpha = a; ctx.fillStyle = '#f6efe0'; ctx.strokeStyle = INK; ctx.lineWidth = m * .008;
      const bx = w * .05, by = h * .08, bw = m * .16, bh = m * .5; ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = INK; ctx.font = `400 ${Math.round(bw * .62)}px 'Ma Shan Zheng'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [...'风起'].forEach((c, i) => ctx.fillText(c, bx + bw / 2, by + bh * (.27 + i * .45))); ctx.globalAlpha = 1;
    }
  },
  // 2：特写——斗笠帽檐下的一双眼睛
  (ctx, w, h, m, lt) => {
    for (let i = 0; i < 18; i++) { ctx.strokeStyle = 'rgba(20,17,14,.25)'; ctx.lineWidth = m * .004; ctx.beginPath(); ctx.moveTo(0, h * (i / 18)); ctx.lineTo(w, h * (i / 18) + h * .05); ctx.stroke(); }
    ctx.fillStyle = INK; blob(ctx, [[-20, -20], [w + 20, -20], [w + 20, h * .32], [w * .5, h * .4], [-20, h * .3]]); ctx.fill();
    brushStroke(ctx, [[-10, h * .32], [w * .5, h * .42], [w + 10, h * .33]], m * .07, 1, { dry: .55, seed: 11 });
    const p = clamp(lt * 2.5);
    for (const sx of [-1, 1]) {
      const ex = w / 2 + sx * w * .22, ey = h * .58;
      brushStroke(ctx, [[ex - sx * m * .18, ey + m * .02], [ex, ey - m * .06], [ex + sx * m * .2, ey - m * .03]], m * .045, p, { dry: .3, seed: 12 + sx });
      brushStroke(ctx, [[ex - sx * m * .14, ey + m * .05], [ex + sx * m * .16, ey + m * .03]], m * .018, p, { dry: .4, seed: 14 + sx, bristles: 6 });
      if (lt > .45) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + sx * m * .02, ey, m * .035, 0, TAU); ctx.fill(); ctx.fillStyle = '#f6efe0'; ctx.beginPath(); ctx.arc(ex + sx * m * .03, ey - m * .012, m * .01, 0, TAU); ctx.fill(); }
      brushStroke(ctx, [[ex - sx * m * .2, ey - m * .16], [ex + sx * m * .18, ey - m * .2]], m * .05, p, { dry: .5, seed: 16 + sx });
    }
    for (let i = 0; i < 5; i++) brushStroke(ctx, [[w * (.15 + i * .17), h * .36], [w * (.1 + i * .17), h * .5], [w * (.02 + i * .17), h * .6]], m * .014, clamp(lt * 2 - .2), { dry: .7, seed: 30 + i, bristles: 5 });
  },
  // 3：对手持剑冲来，放射的干笔速度线，拟声字“唰”
  (ctx, w, h, m, lt, s) => {
    const fx = w * .45, fy = h * .5;
    for (const l of s.speed) {
      const R0 = Math.hypot(w, h) * .6, a = l.a;
      brushStroke(ctx, [[fx + Math.cos(a) * R0, fy + Math.sin(a) * R0], [fx + Math.cos(a) * R0 * (1 - l.r0 * .6), fy + Math.sin(a) * R0 * (1 - l.r0 * .6)]], m * l.w * 2, eOutCubic(clamp(lt * 4)), { dry: .6, seed: l.s, bristles: 5 });
    }
    const p = eOutCubic(clamp(lt * 3)), x = lerp(w * .9, w * .42, p), y = h * .55, sc = m * .2;
    ctx.fillStyle = INK; blob(ctx, tr([[-.3, -.5], [.25, -.55], [.5, 0], [.7, .6], [.1, .55], [-.6, .7], [-.3, 0]], x, y, sc)); ctx.fill();
    ctx.beginPath(); ctx.arc(x - .1 * sc, y - .75 * sc, .2 * sc, 0, TAU); ctx.fill();
    brushStroke(ctx, tr([[.1, .6], [.9, 1.1], [1.4, 1.2]], x, y, sc), .2 * sc, 1, { dry: .7, seed: 41 });
    brushStroke(ctx, tr([[-.1, .55], [-.6, 1.05], [-1.0, 1.3]], x, y, sc), .2 * sc, 1, { dry: .6, seed: 42 });
    brushStroke(ctx, tr([[-.2, -.35], [-.8, -.45], [-1.2, -.55]], x, y, sc), .12 * sc, 1, { dry: .3, seed: 43 });
    ctx.strokeStyle = INK; ctx.lineWidth = m * .008; ctx.beginPath(); ctx.moveTo(...tr([[-1.2, -.55]], x, y, sc)[0]); ctx.lineTo(...tr([[-2.6, -.85]], x, y, sc)[0]); ctx.stroke();
    for (let i = 0; i < 5; i++) brushStroke(ctx, tr([[.6, -.3 + i * .25], [1.8 + i * .2, -.4 + i * .25]], x, y, sc), .06 * sc, 1, { dry: .7, seed: 50 + i, bristles: 5 });
    const a = inv(.3, .45, lt);
    if (a > 0) {
      ctx.save(); ctx.translate(w * .78, h * .26); ctx.rotate(-.18); ctx.scale(1 + .5 * (1 - eOutBack(a)), 1 + .5 * (1 - eOutBack(a)));
      ctx.fillStyle = INK; ctx.font = `400 ${Math.round(m * .38)}px 'Ma Shan Zheng'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#f6efe0'; ctx.lineWidth = m * .03; ctx.strokeText('唰', 0, 0); ctx.fillText('唰', 0, 0); ctx.restore();
    }
  },
  // 4：一刀斩下——巨大的弧形干笔刀光，朱红血点，拟声字“斩”
  (ctx, w, h, m, lt, s) => {
    const p = eOutExpo(clamp(lt / .3));
    const arc = []; for (let i = 0; i <= 30; i++) { const a = lerp(-2.6, .3, i / 30); arc.push([w * .5 + Math.cos(a) * m * .62, h * .55 + Math.sin(a) * m * .5]); }
    brushStroke(ctx, arc, m * .16, p, { dry: .75, seed: 61, bristles: 20 });
    brushStroke(ctx, arc.map(([x, y]) => [x + m * .03, y + m * .06]), m * .05, p, { dry: .9, seed: 62, bristles: 8 });
    swordsman(ctx, w * (LAND ? .3 : .22), h * .62, m * .2, 1, -1);
    const sp = eOutCubic(inv(.25, .55, lt));
    if (sp > 0) {
      const ox = w * .66, oy = h * .48;
      for (const d of s.drops) { ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(ox + Math.cos(d.a) * d.d * m * sp, oy + Math.sin(d.a) * d.d * m * sp * .7, d.r * m * (1.2 - .4 * sp), 0, TAU); ctx.fill(); }
      brushStroke(ctx, [[ox - m * .05, oy], [ox + m * .3 * sp, oy - m * .12 * sp]], m * .03, 1, { dry: .6, seed: 71, color: RED, bristles: 7 });
    }
    const a = inv(.3, .42, lt);
    if (a > 0) {
      ctx.save(); ctx.translate(w * (LAND ? .72 : .8), h * (LAND ? .78 : .7)); ctx.rotate(.12); const sc = 1 + .8 * (1 - eOutCubic(a)); ctx.scale(sc, sc);
      ctx.fillStyle = INK; ctx.font = `400 ${Math.round(m * .42)}px 'Ma Shan Zheng'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#f6efe0'; ctx.lineWidth = m * .035; ctx.strokeText('斩', 0, 0); ctx.fillText('斩', 0, 0); ctx.restore();
    }
  },
];
