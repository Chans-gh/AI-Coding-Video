// C-160 玻璃版长曝光：init 里把银灰色的街景（楼、橱窗、煤气灯、风里糊掉的树）、玻璃版的灰尘划痕和边缘药膜剥落画好；每帧先由 t 算出“已曝光的世界时间” w，再把行人在 0–w 之间每隔 Δ 的位置各画一次、透明度取 Δ/w——走过的人随曝光变长渐成半透明的幽灵拖影直到消失，站着擦鞋的人一直清楚；太阳按 w 在天上画出一道道弧线，亮处加光晕，角上纸套用手写字计曝光时长。
// 风格提示词：用玻璃版长曝光风格：像 19 世纪的玻璃底片曝光几分钟甚至几个月，静止的建筑和树清晰锐利，走过的人只留下半透明的幽灵拖影，太阳在天上画出一道道弧线，银灰色调带光晕、灰尘、划痕和边缘药膜剥落，画面一角的纸套上用手写字计着曝光时长。
// 题材：电影年代与屏幕科技 · 适合：时间流逝、静与动的对比、怀旧与记忆
scene({
  id: 'C-160', name: '玻璃版长曝光', dur: 5, still: 3.4,
  fonts: ["400 60px 'Ma Shan Zheng'"],
  init() {
    const u = SHORT / 1080, R = mulberry32(4);
    const hz = LAND ? H * .62 : H * .6;                        // 人行道的后沿
    const bg = mk(W, H), g = bg.getContext('2d');
    // 天
    const sk = g.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, '#6E6C68'); sk.addColorStop(1, '#A8A49C'); g.fillStyle = sk; g.fillRect(0, 0, W, hz);
    for (let i = 0; i < 6; i++) { g.save(); g.filter = `blur(${18 * u}px)`; g.fillStyle = 'rgba(200,196,188,.35)'; g.fillRect(W * (R() * .8 - .1), H * (.05 + R() * .2), W * (.3 + R() * .4), 14 * u); g.restore(); }   // 云被拖成横条
    // 楼：一排立面，窗、檐口、招牌
    let x = -20 * u; const fac = [];
    while (x < W) { const w = (180 + R() * 160) * u, h = (LAND ? H * (.32 + R() * .2) : H * (.3 + R() * .18)), tone = 70 + R() * 70; fac.push([x, w, h, tone]); x += w; }
    for (const [x0, w, h, tn] of fac) { const y0 = hz - h; g.fillStyle = `rgb(${tn},${tn - 4},${tn - 10})`; g.fillRect(x0, y0, w, h);
      g.fillStyle = `rgb(${tn - 30},${tn - 32},${tn - 36})`; g.fillRect(x0 - 4 * u, y0 - 10 * u, w + 8 * u, 14 * u);
      const cols = Math.max(2, Math.round(w / (60 * u))), rows = Math.max(2, Math.round((h - 120 * u) / (80 * u)));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const wx = x0 + w * (c + .5) / cols - 14 * u, wy = y0 + 30 * u + r * 80 * u;
        g.fillStyle = '#2A2826'; g.fillRect(wx, wy, 28 * u, 50 * u); g.fillStyle = 'rgba(200,196,190,.25)'; g.fillRect(wx + 3 * u, wy + 3 * u, 10 * u, 20 * u); g.fillStyle = `rgb(${tn + 30},${tn + 26},${tn + 20})`; g.fillRect(wx - 3 * u, wy + 50 * u, 34 * u, 5 * u); }
      g.fillStyle = '#1E1C1A'; g.fillRect(x0 + w * .15, hz - 90 * u, w * .7, 90 * u); g.fillStyle = 'rgba(190,186,176,.3)'; g.fillRect(x0 + w * .18, hz - 84 * u, w * .64, 40 * u);   // 橱窗
      g.fillStyle = '#D8D4C8'; g.fillRect(x0 + w * .2, hz - 112 * u, w * .6, 18 * u); g.fillStyle = '#3A3836'; for (let k = 0; k < 6; k++) g.fillRect(x0 + w * (.24 + k * .09), hz - 108 * u, w * .05, 10 * u); }
    // 人行道、街面（石块）
    g.fillStyle = '#8C8880'; g.fillRect(0, hz, W, 50 * u); g.fillStyle = '#5A5854'; g.fillRect(0, hz + 50 * u, W, 8 * u);
    const rd = g.createLinearGradient(0, hz + 58 * u, 0, H); rd.addColorStop(0, '#6A6862'); rd.addColorStop(1, '#4A4844'); g.fillStyle = rd; g.fillRect(0, hz + 58 * u, W, H);
    g.strokeStyle = 'rgba(30,28,26,.35)'; g.lineWidth = 1.2 * u; for (let y = hz + 70 * u, k = 0; y < H; y += (14 + k * 3) * u, k++) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x2 = (k % 2) * 20 * u; x2 < W; x2 += (40 + k * 6) * u) { g.beginPath(); g.moveTo(x2, y); g.lineTo(x2, y + (14 + k * 3) * u); g.stroke(); } }
    // 煤气灯（静的，清楚）
    const lamp = LAND ? W * .7 : W * .78; g.fillStyle = '#1E1C1A'; g.fillRect(lamp - 5 * u, hz - 260 * u, 10 * u, 300 * u); g.fillRect(lamp - 22 * u, hz - 300 * u, 44 * u, 44 * u); g.fillStyle = '#C8C4B8'; g.fillRect(lamp - 16 * u, hz - 294 * u, 32 * u, 32 * u);
    // 树：叶子被风吹糊
    const tx = LAND ? W * .16 : W * .2; g.fillStyle = '#2A2826'; g.beginPath(); g.moveTo(tx - 10 * u, hz + 30 * u); g.lineTo(tx - 6 * u, hz - 200 * u); g.lineTo(tx + 6 * u, hz - 200 * u); g.lineTo(tx + 12 * u, hz + 30 * u); g.fill();
    g.save(); g.filter = `blur(${10 * u}px)`; for (let i = 0; i < 26; i++) { const a = R() * TAU, r = Math.sqrt(R()) * 150 * u; g.fillStyle = `rgba(${40 + R() * 40},${40 + R() * 40},${36 + R() * 36},.7)`; g.beginPath(); g.arc(tx + Math.cos(a) * r * 1.2, hz - 270 * u + Math.sin(a) * r * .8, (40 + R() * 40) * u, 0, TAU); g.fill(); } g.restore();
    // 擦鞋的人和客人：一直站着，所以清楚
    const sx = LAND ? W * .44 : W * .46, sy = hz + 44 * u;
    // 玻璃版的瑕疵：灰尘、划痕、边缘药膜剥落
    const flaw = mk(W, H), fg = flaw.getContext('2d');
    for (let i = 0; i < 160; i++) { fg.fillStyle = R() < .6 ? `rgba(255,255,250,${.3 + R() * .5})` : `rgba(10,10,8,${.3 + R() * .5})`; fg.beginPath(); fg.ellipse(R() * W, R() * H, (.6 + R() * 2.4) * u, (.6 + R() * 1.6) * u, R() * 3, 0, TAU); fg.fill(); }
    for (let i = 0; i < 7; i++) { fg.strokeStyle = `rgba(240,240,230,${.25 + R() * .3})`; fg.lineWidth = (.6 + R()) * u; fg.beginPath(); let px = R() * W, py = R() * H; fg.moveTo(px, py); for (let k = 0; k < 8; k++) { px += (R() - .5) * 60 * u; py += (40 + R() * 80) * u; fg.lineTo(px, py); } fg.stroke(); }
    const edge = mk(W, H), eg = edge.getContext('2d'), id = eg.createImageData(W / 2 | 0, H / 2 | 0), d = id.data, w2 = W / 2 | 0, h2 = H / 2 | 0;
    for (let y = 0; y < h2; y++) for (let x2 = 0; x2 < w2; x2++) { const e = Math.min(x2, y, w2 - x2, h2 - y) / (SHORT * .5), n = fbm(x2 * .03, y * .03, 4), i = (y * w2 + x2) * 4, m = e - (n - .5) * .07;
      if (m < .012) { d[i] = d[i + 1] = d[i + 2] = 14; d[i + 3] = 255; } else if (m < .03) { d[i] = 220; d[i + 1] = 214; d[i + 2] = 196; d[i + 3] = 200 * (1 - (m - .012) / .018); } }
    eg.putImageData(id, 0, 0); const edgeC = mk(W, H); edgeC.getContext('2d').drawImage(edge, 0, 0, w2, h2, 0, 0, W, H);
    // 行人：在世界时间 w 里的位置
    const walkers = [];
    for (let i = 0; i < (LAND ? 9 : 7); i++) { const dir = i % 2 ? 1 : -1, y = hz + (14 + R() * 70 + (i % 3) * 80) * u, sp = (24 + R() * 30) * u * (1 + (y - hz) / H), x0 = W * (.08 + R() * .84);
      walkers.push({ y, dir, sp, x0, k: (1 + (y - hz) / (H * .5)) * (LAND ? 1.15 : 1.3) * u, hat: R() < .5, dress: R() < .35, stopAt: i === 2 ? 1.5 : -1, tone: 20 + R() * 40 }); }
    return { u, bg, flaw, edgeC, walkers, hz, sx, sy, sun: LAND ? [W * .5, hz] : [W * .5, hz * .9] };
  },
  draw(ctx, t, s) {
    const { u } = s, w = .04 * Math.pow(10, t * .85);            // 已曝光的世界秒数：从 0.04 秒指数增长到约 12 分钟
    ctx.drawImage(s.bg, 0, 0);
    // 太阳弧：每“过一段”画一道，当前这道画到一半
    ctx.save(); ctx.lineCap = 'round';
    const arcs = 4;
    for (let i = 0; i < arcs; i++) { const p = clamp((t - 1.2 - i * .9) / .9); if (p <= 0) break; const [cx, cy] = s.sun, rx = W * (.32 + i * .03), ry = s.hz * (.62 - i * .08);
      ctx.strokeStyle = 'rgba(255,253,245,.9)'; ctx.lineWidth = (5 - i * .6) * u; ctx.shadowColor = 'rgba(255,255,240,.9)'; ctx.shadowBlur = 18 * u;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, Math.PI + p * Math.PI); ctx.stroke();
      if (p < 1) { const a = Math.PI + p * Math.PI; ctx.fillStyle = '#FFFEF8'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 12 * u, 0, TAU); ctx.fill(); } }
    ctx.restore();
    // 一个人：长衣或长裙、礼帽，腿按世界时间迈步
    const person = (x, y, k, o, ph, alpha) => { ctx.globalAlpha = alpha; ctx.fillStyle = `rgb(${o.tone},${o.tone - 2},${o.tone - 4})`;
      const sw = Math.sin(ph) * 10; ctx.save(); ctx.translate(x, y); ctx.scale(k * o.dir, k);
      if (o.dress) { ctx.beginPath(); ctx.moveTo(-8, -70); ctx.lineTo(8, -70); ctx.lineTo(22, 0); ctx.lineTo(-22, 0); ctx.fill(); }
      else { ctx.fillRect(-4 + sw * .4, -36, 7, 36); ctx.fillRect(-3 - sw * .4, -36, 7, 36); ctx.beginPath(); ctx.moveTo(-10, -74); ctx.lineTo(10, -74); ctx.lineTo(13, -30); ctx.lineTo(-13, -30); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, -84, 9, 0, TAU); ctx.fill(); ctx.fillRect(-9, -75, 18, 30);
      if (o.hat) { ctx.fillRect(-12, -94, 24, 3); ctx.fillRect(-7, -112, 14, 18); } else if (o.dress) { ctx.beginPath(); ctx.ellipse(0, -92, 16, 5, 0, 0, TAU); ctx.fill(); }
      ctx.restore(); ctx.globalAlpha = 1; };
    for (const o of s.walkers) {
      const pos = q => { const tq = o.stopAt > 0 ? (q < o.stopAt ? q : q < o.stopAt + 900 ? o.stopAt : q - 900) : q; return o.x0 + o.dir * o.sp * tq; };
      const D = Math.max(.01, w / 80), n = Math.floor(w / D);
      for (let i = 0; i <= n; i++) { const q = i * D, x = pos(q); if (x < -60 * u || x > W + 60 * u) continue; person(x, o.y, o.k, o, q * 2.2, Math.min(1, D / w * 1.6)); }
    }
    // 擦鞋：一直不动
    const k = (LAND ? 1.25 : 1.4) * u; person(s.sx, s.sy, k, { dir: 1, tone: 22, hat: true, dress: false }, 0, 1);
    ctx.save(); ctx.translate(s.sx + 30 * k, s.sy); ctx.scale(k, k); ctx.fillStyle = '#26241F'; ctx.fillRect(-14, -26, 28, 26); ctx.beginPath(); ctx.arc(4, -40, 9, 0, TAU); ctx.fill(); ctx.fillRect(-16, -32, 26, 8); ctx.restore();
    // 光晕：亮处糊开一圈
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = `blur(${14 * u}px)`; ctx.globalAlpha = .35; ctx.drawImage(ctx.canvas, 0, 0, W, H, 0, 0, W, H); ctx.restore();
    // 银灰调
    ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = '#9C988C'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.drawImage(s.flaw, 0, 0); vignette(ctx, .45, .45); ctx.drawImage(s.edgeC, 0, 0);
    // 纸套上的手写计时
    const m = Math.floor(w / 60), sec = (w % 60).toFixed(w < 10 ? 2 : 0), bx = LAND ? W - 420 * u : W - 380 * u, by = H - 200 * u;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(-.04); ctx.fillStyle = '#E2D6B8'; ctx.fillRect(0, 0, 400 * u, 200 * u); ctx.fillStyle = 'rgba(90,70,40,.18)'; ctx.fillRect(0, 0, 400 * u, 12 * u);
    ctx.fillStyle = '#2A2016'; ctx.font = `400 ${40 * u}px 'Ma Shan Zheng'`; ctx.fillText('第 17 号 · 曝光', 24 * u, 66 * u);
    ctx.font = `400 ${64 * u}px 'Ma Shan Zheng'`; ctx.fillText(`${m} 分 ${sec} 秒`, 24 * u, 150 * u); ctx.restore();
  }
});
