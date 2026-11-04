// T-017 体操骨骼示范：美国空军体能测试教学片里一段俯卧撑侧面示范，pose.py 用 MediaPipe 逐帧算出骨骼点和人体遮罩；片头一道擦除把原片（旁边跪着计数的考官）换成代码画的训练房，人按遮罩抠出来放进去；骨骼线和关节点跟着人走，肘角弧线和读数实时变，躯干从肩到踝拉一条直线、按直线度变色，肘角先低于 100° 再撑过 150° 记一次，旁边一条肘角曲线带阈值线和播放头
// 素材：录像（Internet Archive FedFlix 收录的美国国防部教学片）、数据（pose.py 算出的骨骼点、肘角、计数和抠像遮罩）；配乐 CC0
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [0, 11], [0, 12]];
const CROP = [.17, .36, .8, .48];           // 原片里取景的范围（0–1）：人横着趴在中下部
const G = '#3ff5a8', O = '#ffb23f', Wt = '#f2f6f8';
const ZH = '标准俯卧撑骨骼示范美国空军体能测试教学片年原片抠像换背景肘角躯干直线下到以内撑起手臂伸直身体保持一条次计数平均最低曲线阈值骨骼本仓库计算录像国防部配乐';
scene({
  id: 'T-017', name: '体操骨骼示范', dur: 12, still: 6.0,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'", "700 40px 'JetBrains Mono'"],
  text: ZH,
  async init() {
    const A = await loadAssets(), P = JSON.parse(await loadText('pose.json'));
    const v = await loadVideo('drill.mp4'), m = await loadVideo('mask.mp4');
    const person = mk(v.w, v.h), alpha = mk(m.w, m.h);
    return { A, P, v, m, person, alpha, room: room() };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, P = s.P;
    const fi = Math.min(P.frames.length - 1, Math.floor(t * P.fps + 1e-6));
    const el = await s.v.at(t);
    // 抠像：遮罩的亮度 → 透明度，再盖到这一帧上
    const me = await s.m.at(t), ac = s.alpha.getContext('2d');
    ac.drawImage(me, 0, 0, s.alpha.width, s.alpha.height);
    const id = ac.getImageData(0, 0, s.alpha.width, s.alpha.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const a = clamp((d[i] - 40) * 1.6, 0, 255); d[i + 3] = a; d[i] = d[i + 1] = d[i + 2] = 255; }
    ac.putImageData(id, 0, 0);
    const pc = s.person.getContext('2d');
    pc.globalCompositeOperation = 'source-over'; pc.clearRect(0, 0, s.person.width, s.person.height);
    pc.drawImage(el, 0, 0);
    pc.globalCompositeOperation = 'destination-in'; pc.drawImage(s.alpha, 0, 0, s.person.width, s.person.height);
    pc.globalCompositeOperation = 'source-over';
    // 取景框：原片的 CROP 映射到画面的 box
    const bw = LAND ? W * .64 : W, bh = bw * (CROP[3] * s.v.h) / (CROP[2] * s.v.w);
    const bx = LAND ? 30 * u : 0, by = LAND ? (H - bh) / 2 + 30 * u : H * .2;
    const map = (x, y) => [bx + (x - CROP[0]) / CROP[2] * bw, by + (y - CROP[1]) / CROP[3] * bh];
    const sx = CROP[0] * s.v.w, sy = CROP[1] * s.v.h, sw = CROP[2] * s.v.w, sh = CROP[3] * s.v.h;
    // 背景：代码画的训练房
    ctx.drawImage(s.room, 0, 0, W, H);
    floor(ctx, by + bh * .78, u);
    // 人的影子 + 抠出来的人
    ctx.save(); ctx.globalAlpha = .45; ctx.filter = `blur(${10 * u}px) brightness(0)`;
    ctx.drawImage(s.person, sx, sy, sw, sh, bx + 14 * u, by + 18 * u, bw, bh * 1.02); ctx.restore();
    ctx.drawImage(s.person, sx, sy, sw, sh, bx, by, bw, bh);
    // 片头：原片从右往左擦掉
    const wipe = eInOutCubic(inv(.6, 1.5, t));
    if (wipe < 1) {
      const cx = bx + bw * wipe;
      ctx.save(); ctx.beginPath(); ctx.rect(cx, by - 4, W, bh + 8); ctx.clip();
      ctx.drawImage(el, sx, sy, sw, sh, bx, by, bw, bh);
      ctx.restore();
      if (wipe > 0) { ctx.fillStyle = G; ctx.fillRect(cx - 2 * u, by - 20 * u, 4 * u, bh + 40 * u); }
      ctx.save(); ctx.font = `700 ${24 * u}px 'Noto Sans SC'`; ctx.fillStyle = Wt; ctx.textBaseline = 'bottom';
      ctx.fillText('原片', bx + bw - 90 * u, by - 12 * u);
      if (wipe > .05) ctx.fillText('抠像换背景', bx + 10 * u, by - 12 * u);
      ctx.restore();
    }
    const L = P.frames[fi], on = smooth(1.2, 1.8, t);
    if (L && on > 0) skeleton(ctx, L, P, fi, map, u, on, t);
    hud(ctx, t, s, fi, u, by, bh);
    ctx.save(); ctx.font = `400 ${15 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), W - 22 * u, H - 16 * u); ctx.restore();
  },
});

function room() {
  const c = mk(W, H), g = c.getContext('2d'), u = SHORT / 1080;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b2a33'); gr.addColorStop(.6, '#123c45'); gr.addColorStop(1, '#081a20');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const rg = g.createRadialGradient(W * .35, H * .45, 0, W * .35, H * .45, LONG * .6);
  rg.addColorStop(0, 'rgba(120,255,210,.16)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
  g.font = `400 ${(LAND ? 300 : 260) * u}px 'Bebas Neue'`; g.fillStyle = 'rgba(255,255,255,.04)'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('PUSH-UP', LAND ? W * .36 : W / 2, LAND ? H * .3 : H * .12);
  return c;
}
function floor(ctx, y, u) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, y, W, H - y);
  ctx.strokeStyle = 'rgba(63,245,168,.18)'; ctx.lineWidth = 1.5 * u;
  for (let i = 0; i < 8; i++) { const yy = y + (H - y) * (i / 8) ** 1.7; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
  for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(W * .4 + i * 60 * u, y); ctx.lineTo(W * .4 + i * 260 * u, H); ctx.stroke(); }
  ctx.restore();
}

function skeleton(ctx, L, P, fi, map, u, on, t) {
  const side = P.side === 'left' ? [11, 13, 15, 23, 27] : [12, 14, 16, 24, 28];
  const pt = j => map(L[j][0], L[j][1]);
  ctx.save(); ctx.globalAlpha = on; ctx.lineCap = 'round';
  // 躯干直线：肩 → 踝，按直线度变色
  const line = P.line[fi], ok = line > 165;
  const [ax, ay] = pt(side[0]), [kx, ky] = pt(side[4]);
  ctx.setLineDash([14 * u, 10 * u]); ctx.strokeStyle = ok ? G : O; ctx.lineWidth = 3 * u;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(kx, ky); ctx.stroke(); ctx.setLineDash([]);
  for (const [a, b] of BONES) {
    if (L[a][2] < .3 || L[b][2] < .3) continue;
    const [x0, y0] = pt(a), [x1, y1] = pt(b);
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 9 * u; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = Wt; ctx.lineWidth = 4.5 * u; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  for (let j = 11; j <= 32; j++) {
    if (L[j][2] < .3 || (j > 16 && j < 23)) continue;
    const [x, y] = pt(j); ctx.fillStyle = side.includes(j) ? G : Wt;
    ctx.beginPath(); ctx.arc(x, y, (side.includes(j) ? 8 : 5) * u, 0, TAU); ctx.fill();
  }
  // 肘角弧线和读数
  const e = P.elbow[fi], [sx, sy] = pt(side[0]), [ex, ey] = pt(side[1]), [wx, wy] = pt(side[2]);
  const a0 = Math.atan2(sy - ey, sx - ex), a1 = Math.atan2(wy - ey, wx - ex);
  let da = a1 - a0; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
  const low = e < P.down;
  ctx.fillStyle = rgba(low ? [63, 245, 168] : [255, 178, 63], .28); ctx.strokeStyle = low ? G : O; ctx.lineWidth = 3 * u;
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.arc(ex, ey, 46 * u, a0, a0 + da, da < 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.font = `700 ${34 * u}px 'JetBrains Mono'`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.lineWidth = 6 * u; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(`${Math.round(e)}°`, ex, ey - 56 * u);
  ctx.fillStyle = low ? G : O; ctx.fillText(`${Math.round(e)}°`, ex, ey - 56 * u);
  ctx.restore();
}

function hud(ctx, t, s, fi, u, by, bh) {
  const P = s.P, n = P.reps.filter(r => r <= t).length, last = P.reps.filter(r => r <= t).at(-1) ?? -9;
  ctx.save(); ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  // 标题
  const tx = 50 * u, ty = (LAND ? 42 : 90) * u;
  ctx.fillStyle = G; ctx.fillRect(tx, ty + 6 * u, 8 * u, 74 * u);
  ctx.font = `900 ${(LAND ? 50 : 62) * u}px 'Noto Sans SC'`; ctx.fillStyle = Wt; ctx.fillText('标准俯卧撑 · 骨骼示范', tx + 26 * u, ty);
  ctx.font = `400 ${(LAND ? 22 : 28) * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(242,246,248,.7)';
  ctx.fillText('美国空军体能测试教学片（2010）· 骨骼点逐帧算出', tx + 28 * u, ty + (LAND ? 64 : 80) * u);
  // 计数
  const pop = 1 + .25 * (1 - smooth(last, last + .35, t));
  const cx = LAND ? W - 300 * u : W - 230 * u, cy = LAND ? 70 * u : by + bh + 60 * u;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop);
  ctx.font = `400 ${(LAND ? 170 : 190) * u}px 'Bebas Neue'`; ctx.fillStyle = G; ctx.textAlign = 'right';
  ctx.fillText(String(n), 0, 0);
  ctx.font = `700 ${30 * u}px 'Noto Sans SC'`; ctx.fillStyle = Wt; ctx.textAlign = 'left'; ctx.fillText('次', 12 * u, 90 * u);
  ctx.restore();
  // 读数
  const e = P.elbow[fi], ln = P.line[fi];
  const rx = LAND ? W - 330 * u : 50 * u, ry = LAND ? 280 * u : by + bh + 70 * u;
  ctx.font = `400 ${(LAND ? 22 : 28) * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(242,246,248,.7)';
  ctx.fillText('肘角', rx, ry); ctx.fillText('躯干直线', rx, ry + 92 * u);
  ctx.font = `700 ${(LAND ? 48 : 56) * u}px 'JetBrains Mono'`;
  ctx.fillStyle = e < P.down ? G : O; ctx.fillText(`${Math.round(e)}°`, rx, ry + 28 * u);
  ctx.fillStyle = ln > 165 ? G : O; ctx.fillText(`${Math.round(ln)}°`, rx, ry + 120 * u);
  // 肘角曲线
  const gx = LAND ? W - 330 * u : 50 * u, gy = LAND ? 520 * u : H - 520 * u, gw = LAND ? 290 * u : W - 100 * u, gh = LAND ? 220 * u : 220 * u;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(ctx, gx - 14 * u, gy - 44 * u, gw + 28 * u, gh + 74 * u, 14 * u); ctx.fill();
  ctx.font = `700 ${20 * u}px 'Noto Sans SC'`; ctx.fillStyle = Wt; ctx.fillText('肘角曲线 · 阈值 100° / 150°', gx, gy - 34 * u);
  const Y = a => gy + gh * (1 - (a - 50) / 140), X = k => gx + gw * k / (P.elbow.length - 1);
  for (const [a, c] of [[P.down, G], [P.up, O]]) { ctx.strokeStyle = c; ctx.globalAlpha = .5; ctx.setLineDash([6 * u, 6 * u]); ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(gx, Y(a)); ctx.lineTo(gx + gw, Y(a)); ctx.stroke(); }
  ctx.setLineDash([]); ctx.globalAlpha = .25; ctx.strokeStyle = Wt; ctx.lineWidth = 2 * u; curve(ctx, P.elbow, P.elbow.length - 1, X, Y);
  ctx.globalAlpha = 1; ctx.strokeStyle = G; ctx.lineWidth = 3.5 * u; curve(ctx, P.elbow, fi, X, Y);
  ctx.fillStyle = Wt; ctx.beginPath(); ctx.arc(X(fi), Y(e), 6 * u, 0, TAU); ctx.fill();
  for (const r of P.reps) if (r <= t) { const k = Math.round(r * P.fps); ctx.fillStyle = G; ctx.fillRect(X(k) - 1.5 * u, gy + gh - 12 * u, 3 * u, 12 * u); }
  // 教练提示
  const tip = t < 1.8 ? null : e < P.down ? '下到肘部 100° 以内' : e > P.up ? '撑起，手臂伸直' : ln > 165 ? '身体保持一条直线' : '收紧核心，别塌腰';
  if (tip) caption(ctx, tip, { size: LAND ? 40 : 50, y: LAND ? H - 60 * u : by - 40 * u, bg: 'rgba(0,0,0,.55)', color: Wt, x: LAND ? W * .34 : W / 2 });
  // 结尾小结
  const q = smooth(10.9, 11.3, t);
  if (q > 0) {
    const lows = []; let cur = 999;
    P.elbow.forEach((a, i) => { cur = Math.min(cur, a); if (P.reps.some(r => Math.round(r * P.fps) === i)) { lows.push(cur); cur = 999; } });
    const avg = lows.reduce((a, b) => a + b, 0) / lows.length, minLine = Math.min(...P.line.filter(Boolean));
    ctx.globalAlpha = q;
    caption(ctx, `${P.reps.length} 次 · 平均最低肘角 ${Math.round(avg)}° · 躯干直线 ≥ ${Math.round(minLine)}°`, { size: LAND ? 38 : 44, y: LAND ? by - 30 * u : H - 130 * u, bg: G, color: '#062018', x: LAND ? W * .34 : W / 2 });
  }
  ctx.restore();
}
function curve(ctx, a, n, X, Y) {
  ctx.beginPath(); for (let k = 0; k <= n; k++) { if (a[k] == null) continue; k ? ctx.lineTo(X(k), Y(a[k])) : ctx.moveTo(X(k), Y(a[k])); } ctx.stroke();
}
