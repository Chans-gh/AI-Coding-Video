// C-092 刮画板：画面从全黑开始，明暗图（月亮、猫头鹰的受光面）交给 hatchLines 的 light 模式只在亮处出白线，羽毛是一组组短刮痕，脸盘是从眼睛向外放射的刮痕；每道刮痕整条出现不渐入，灰度只来自白线排得多密。
// 风格提示词：用刮画板风格：白色瓷土上盖一层黑墨，所有笔触都是用刀尖把墨刮掉，画面从全黑开始，在光照到的地方一道道刮出白色的毛发和轮廓，没有灰色，灰度只来自白线排得有多密，刮痕从不渐入，都是整条整条刻出来的。
// 题材：手绘与绘画 · 适合：动物、夜景、悬疑、版画质感的片头
scene({
  id: 'C-092', name: '刮画板', dur: 5, still: 4.6,
  fonts: ["900 100px 'Noto Serif SC'"],
  text: '夜里的眼睛',
  init() {
    const u = SHORT / 1080;
    // 构图：横屏猫头鹰在右、月亮在它右上、字在左；竖屏猫头鹰居中、字在下
    const k = (LAND ? .95 : 1.25) * u, ox = LAND ? W * .62 : W * .48, oy = LAND ? H * .55 : H * .47;
    const P = (x, y) => [ox + x * k, oy + y * k];
    const moon = [...P(250, -300), 240 * k];
    const path = fn => { const p = new Path2D(); fn(p); return p; };
    const body = path(p => p.ellipse(...P(0, 60), 150 * k, 215 * k, 0, 0, TAU));
    const head = path(p => { p.ellipse(...P(0, -175), 168 * k, 135 * k, 0, 0, TAU); p.moveTo(...P(-150, -230)); p.lineTo(...P(-138, -330)); p.lineTo(...P(-70, -280)); p.closePath(); p.moveTo(...P(150, -230)); p.lineTo(...P(138, -330)); p.lineTo(...P(70, -280)); p.closePath(); });
    const branch = path(p => { p.moveTo(...P(-620, 262)); p.quadraticCurveTo(...P(0, 230), ...P(640, 250)); p.lineTo(...P(640, 292)); p.quadraticCurveTo(...P(0, 276), ...P(-620, 300)); p.closePath(); });
    const hit = mk(4, 4).getContext('2d'), inn = (pa, x, y) => hit.isPointInPath(pa, x, y);
    const inOwl = (x, y) => inn(body, x, y) || inn(head, x, y);
    const eyes = [P(-62, -172), P(62, -172)];
    const T = toneMap(g => {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#f2f2f2'; g.beginPath(); g.arc(moon[0], moon[1], moon[2], 0, TAU); g.fill();
      g.fillStyle = '#9a9a9a'; [[-60, -50, 50], [70, 40, 38], [-20, 110, 30], [90, -90, 26]].forEach(([x, y, r]) => { g.beginPath(); g.arc(moon[0] + x * k, moon[1] + y * k, r * k, 0, TAU); g.fill(); });
      const lit = g.createRadialGradient(...P(140, -160), 20 * k, ...P(60, -40), 380 * k);    // 月光从右上来
      lit.addColorStop(0, '#fff'); lit.addColorStop(.45, '#999'); lit.addColorStop(1, '#000');
      g.fillStyle = lit; g.fill(body); g.fill(head);
      g.fillStyle = '#444'; g.fill(branch);
      g.fillStyle = '#000'; eyes.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 44 * k, 0, TAU); g.fill(); });
    }, { blur: 4 * u, pixel: (x, y, v) => v + (fbm(x * .01, y * .01, 2) - .5) * .15 });
    const ord = (x, y) => Math.hypot(x - moon[0], y - moon[1]) / LONG + hash2(Math.floor(x / 60), Math.floor(y / 60)) * .15;
    const notOwl = (x, y) => !inOwl(x, y);
    const moonS = [
      hatchLines(T, { angle: 0, gap: 7 * u, thr: .45, light: true, jitter: .2, order: ord, mask: notOwl, seed: 1, minLen: 6 * u }),
      hatchLines(T, { angle: 0, gap: 7 * u, thr: .8, light: true, jitter: .2, order: ord, mask: notOwl, seed: 2, minLen: 6 * u })];
    const feath = [
      hatchLines(T, { angle: 1.42, gap: 7 * u, thr: .22, light: true, maxLen: 26 * u, minLen: 8 * u, jitter: .5, order: ord, mask: (x, y) => inn(body, x, y) && !inn(head, x, y), seed: 3 }),
      hatchLines(T, { angle: 1.85, gap: 7 * u, thr: .5, light: true, maxLen: 22 * u, minLen: 8 * u, jitter: .5, order: ord, mask: (x, y) => inn(body, x, y) && !inn(head, x, y), seed: 4 }),
      hatchLines(T, { angle: .6, gap: 6 * u, thr: .3, light: true, maxLen: 30 * u, minLen: 8 * u, jitter: .5, order: ord, mask: (x, y) => inn(head, x, y) && Math.min(...eyes.map(([ex, ey]) => Math.hypot(x - ex, y - ey))) > 100 * k, seed: 5 }),
      hatchLines(T, { angle: .04, gap: 6 * u, thr: .2, light: true, maxLen: 120 * u, jitter: .3, mask: (x, y) => inn(branch, x, y) && !inOwl(x, y), seed: 6 })];
    // 脸盘：从眼睛向外放射的刮痕，越亮越长
    const disc = [];
    eyes.forEach(([ex, ey], j) => { for (let a = 0; a < TAU; a += .085) {
      const r0 = 52 * k, v = T.at(ex + Math.cos(a) * 75 * k, ey + Math.sin(a) * 75 * k), r1 = r0 + (25 + 70 * v) * k * (.8 + hash1(Math.round(a * 100) + j * 999) * .3);
      disc.push({ x0: ex + Math.cos(a) * r0, y0: ey + Math.sin(a) * r0, x1: ex + Math.cos(a) * r1, y1: ey + Math.sin(a) * r1, v, k: 0 }); } });
    disc.forEach((q, i) => q.k = i / (disc.length - 1));
    // 受光一侧的轮廓
    const rim = [circlePts(...P(0, 60), 150 * k, 50, -1.2, 1.1, .02, 1).map(([x, y]) => [x, P(0, 60)[1] + (y - P(0, 60)[1]) * 215 / 150]),
      circlePts(...P(0, -175), 168 * k, 40, -1.3, .5, .02, 2).map(([x, y]) => [x, P(0, -175)[1] + (y - P(0, -175)[1]) * 135 / 168])];
    const stars = Array.from({ length: 40 }, (_, i) => [hash1(i * 3 + 1) * W, hash1(i * 7 + 2) * H * .7, 1 + hash1(i) * 2]).filter(([x, y]) => T.at(x, y) < .1);
    return { u, k, P, eyes, moonS, feath, disc, rim, stars };
  },
  draw(ctx, t, s) {
    const { u, k } = s, tt = stepT(t, 15);
    ctx.fillStyle = '#0B0A0A'; ctx.fillRect(0, 0, W, H);
    const o = { color: '#F4F0E8', width: 2.2 * u, dur: .002, cap: 'butt' };
    s.stars.forEach(([x, y, r], i) => { if (tt > .1 + i * .02) { ctx.fillStyle = '#F4F0E8'; ctx.fillRect(x, y, r * u, r * u); } });
    drawHatch(ctx, s.moonS[0], inv(.1, 1.3, tt), o);
    drawHatch(ctx, s.moonS[1], inv(.5, 1.6, tt), o);
    ctx.save(); ctx.strokeStyle = '#F4F0E8'; ctx.lineWidth = 3 * u; ctx.lineCap = 'round';
    s.rim.forEach((pts, i) => drawPartial(ctx, pts, inv(1.2 + i * .25, 1.7 + i * .25, tt) > 0 ? 1 : 0));
    ctx.restore();
    drawHatch(ctx, s.feath[0], inv(1.4, 3.0, tt), { ...o, width: 2 * u });
    drawHatch(ctx, s.feath[1], inv(2.0, 3.4, tt), { ...o, width: 1.8 * u });
    drawHatch(ctx, s.feath[2], inv(1.7, 3.2, tt), { ...o, width: 1.8 * u });
    drawHatch(ctx, s.feath[3], inv(.8, 2.0, tt), o);
    drawHatch(ctx, s.disc, inv(2.8, 3.8, tt), { ...o, width: 1.8 * u });
    // 眼睛：最后刮出一圈眼眶和一点高光
    const ep = inv(3.8, 4.2, tt);
    if (ep > 0) s.eyes.forEach(([x, y], j) => {
      ctx.save(); ctx.strokeStyle = '#F4F0E8'; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.arc(x, y, 44 * k, -1.5, -1.5 + TAU * Math.min(1, ep * 2)); ctx.stroke();
      ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(x, y, 30 * k, 0, TAU * ep); ctx.stroke();
      if (ep >= 1) { ctx.fillStyle = '#F4F0E8'; ctx.fillRect(x + 8 * k, y - 18 * k, 10 * k, 10 * k); }
      ctx.restore();
    });
    if (ep > 0) { ctx.save(); ctx.strokeStyle = '#F4F0E8'; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(...s.P(-14, -128)); ctx.lineTo(...s.P(0, -95)); ctx.lineTo(...s.P(14, -128)); ctx.stroke(); ctx.restore(); }
    // 题字：刮出空心字
    const tp = inv(3.9, 4.4, tt);
    if (tp > 0) {
      const fs = Math.round((LAND ? 110 : 120) * u), tx = LAND ? W * .2 : W * .5, ty = LAND ? H * .34 : H * .88;
      ctx.save(); ctx.font = `900 ${fs}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.fillStyle = '#F4F0E8';
      ctx.beginPath(); ctx.rect(0, 0, tx - fs * 2.6 + fs * 5.2 * tp, H); ctx.clip(); ctx.fillText('夜里的眼睛', tx, ty);
      ctx.fillStyle = '#0B0A0A'; for (let i = 0; i < 14; i++) ctx.fillRect(tx - fs * 2.6, ty - fs * .85 + i * fs * .075, fs * 5.2, fs * .02);   // 字里也是一道道刮痕
      ctx.restore();
    }
  }
});
