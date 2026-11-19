// C-164 车厢珐琅彩绘：init 里在墨绿漆木板上画金箔饰框和里面的夜景，四周的玫瑰、卷叶、C 形卷草都用“双色笔”画——每一笔是两头收尖的弯笔形，横跨笔宽填从深到浅两种颜色的渐变，再挑一记白色高光细笔，最后叠 weathering 的清漆细裂和一道釉面反光；每帧夜景里的路灯和窗按节拍一盏盏亮，顶上的彩带在两组点位之间逐点插值，打成蝴蝶结又松开。
// 风格提示词：用车厢珐琅彩绘风格：画面就是一节旅行篷车的木侧板，用光亮珐琅漆画成，每一笔都是双色鬃刷笔触加一记白色高光挑笔，玫瑰、卷叶和金箔饰框围住中间的风景，表面有清漆细裂，夜景里的灯跟着节拍一盏盏亮起，边框上的彩带打结又解开。
// 题材：印刷、版画与装饰 · 适合：公路与旅人、民间集市、节庆夜晚
scene({
  id: 'C-164', name: '车厢珐琅彩绘', dur: 5, still: 2.6,
  fonts: [],
  init() {
    const u = SHORT / 1080, R = mulberry32(12);
    const pnl = mk(W, H), g = pnl.getContext('2d');
    // 木板：墨绿漆、一圈凸起的边框
    g.fillStyle = '#123C30'; g.fillRect(0, 0, W, H);
    g.drawImage(makePaper('#1A4A3A', { grain: 6, fiber: 1.2, blot: 10, seed: 3 }), 0, 0, W, H);
    const bw = 46 * u; g.fillStyle = '#6A1E1A'; g.fillRect(0, 0, W, bw); g.fillRect(0, H - bw, W, bw); g.fillRect(0, 0, bw, H); g.fillRect(W - bw, 0, bw, H);
    g.strokeStyle = '#E2B04A'; g.lineWidth = 5 * u; g.strokeRect(bw + 8 * u, bw + 8 * u, W - 2 * bw - 16 * u, H - 2 * bw - 16 * u);
    g.strokeStyle = 'rgba(255,230,200,.25)'; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(0, 2 * u); g.lineTo(W, 2 * u); g.moveTo(2 * u, 0); g.lineTo(2 * u, H); g.stroke();
    // 双色笔：沿 pts 画一笔，宽 w0 起头、收尖，横向从 c1 渐到 c2，hl 挑高光
    const dstroke = (pts, w0, c1, c2, hl = true, taper = [.25, 1]) => {
      const P = resample(pts, 24), L = [], Rr = [];
      P.forEach((p, i) => { const q = i / (P.length - 1), w = w0 * Math.sin(Math.PI * clamp(lerp(taper[0], taper[1], q) * .5 + q * .5)) * (q < .15 ? .6 + q * 2.6 : 1) * .5; L.push([p.x + p.nx * w, p.y + p.ny * w]); Rr.push([p.x - p.nx * w, p.y - p.ny * w]); });
      const m = P[P.length >> 1], gr = g.createLinearGradient(m.x + m.nx * w0 * .5, m.y + m.ny * w0 * .5, m.x - m.nx * w0 * .5, m.y - m.ny * w0 * .5); gr.addColorStop(0, c1); gr.addColorStop(.55, c1); gr.addColorStop(1, c2);
      g.fillStyle = gr; g.beginPath(); L.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); Rr.reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fill();
      if (hl) { g.strokeStyle = 'rgba(255,255,250,.85)'; g.lineCap = 'round'; const a = Math.floor(P.length * .3), b = Math.floor(P.length * .7);
        for (let i = a; i < b; i++) { g.lineWidth = w0 * .09 * Math.sin((i - a) / (b - a) * Math.PI); g.beginPath(); g.moveTo(P[i].x - P[i].nx * w0 * .22, P[i].y - P[i].ny * w0 * .22); g.lineTo(P[i + 1].x - P[i + 1].nx * w0 * .22, P[i + 1].y - P[i + 1].ny * w0 * .22); g.stroke(); } } };
    const arcPts = (cx, cy, r, a0, a1, n = 12) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
    // 玫瑰：深红球心 + 一圈圈 C 形瓣
    // 玫瑰：月牙形的瓣一层层压上去，每瓣从深（里）渐到浅（外沿），再挑白边
    const cres = (x, y, r, a0, a1, th, c0, c1, hl) => { const am = (a0 + a1) / 2, ix = x + Math.cos(am) * -th, iy = y + Math.sin(am) * -th;
      g.beginPath(); for (let i = 0; i <= 20; i++) { const a = lerp(a0, a1, i / 20); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      for (let i = 20; i >= 0; i--) { const a = lerp(a0, a1, i / 20); g.lineTo(ix + Math.cos(a) * r * .92, iy + Math.sin(a) * r * .92); } g.closePath();
      const gr = g.createRadialGradient(x, y, r * .55, x, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fill();
      if (hl) { g.strokeStyle = 'rgba(255,250,245,.8)'; g.lineWidth = r * .045; g.lineCap = 'round'; g.beginPath(); for (let i = 4; i <= 16; i++) { const a = lerp(a0, a1, i / 20); g.lineTo(x + Math.cos(a) * r * .95, y + Math.sin(a) * r * .95); } g.stroke(); } };
    const rose = (x, y, s, c = ['#7A0E14', '#E8506A']) => {
      g.fillStyle = c[0]; g.beginPath(); g.arc(x, y, s * .62, 0, TAU); g.fill();
      cres(x, y - s * .05, s * .62, Math.PI * 1.05, Math.PI * 1.95, s * .25, c[0], c[1], true);                       // 后面的碗
      cres(x - s * .3, y, s * .55, Math.PI * .55, Math.PI * 1.25, s * .2, c[0], c[1], false); cres(x + s * .3, y, s * .55, Math.PI * 1.75, Math.PI * 2.45, s * .2, c[0], c[1], false);
      g.fillStyle = c[0]; g.beginPath(); g.ellipse(x, y - s * .08, s * .26, s * .18, 0, 0, TAU); g.fill();
      cres(x, y - s * .12, s * .26, Math.PI * .1, Math.PI * .9, s * .12, c[0], c[1], true);                            // 花心的小杯
      for (let i = 0; i < 3; i++) cres(x + (i - 1) * s * .08, y + s * (.02 + i * .1), s * (.5 + i * .12), Math.PI * (.12 + i * .04), Math.PI * (.88 - i * .04), s * (.22 - i * .03), c[0], i === 2 ? '#FBD0D8' : c[1], true);   // 前面的瓣
    };
    const leaf = (x, y, s, a) => { const pts = [[x, y], [x + Math.cos(a - .3) * s * .5, y + Math.sin(a - .3) * s * .5], [x + Math.cos(a) * s, y + Math.sin(a) * s]]; dstroke(pts, s * .38, '#1E6A2A', '#C8D850'); };
    const scroll = (x, y, s, a, flip) => { const pts = []; for (let i = 0; i <= 20; i++) { const q = i / 20, r = s * (1 - q * .8), b = a + (flip ? -1 : 1) * q * 4.2; pts.push([x + Math.cos(b) * r + Math.cos(a) * s * q * 1.2, y + Math.sin(b) * r + Math.sin(a) * s * q * 1.2]); } dstroke(pts, s * .32, '#C8781A', '#F8E06A'); };
    // 中间的金箔饰框
    const L = LAND, cx = W / 2, cy = H / 2, ew = L ? W * .27 : W * .36, eh = L ? H * .3 : H * .22;
    const cart = c => { c.beginPath(); for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU, k = 1 + .045 * Math.cos(a * 8); c.lineTo(cx + Math.cos(a) * ew * k, cy + Math.sin(a) * eh * k); } c.closePath(); };
    const gold = g.createLinearGradient(cx - ew, cy - eh, cx + ew, cy + eh); gold.addColorStop(0, '#8A5A12'); gold.addColorStop(.3, '#F6DA80'); gold.addColorStop(.5, '#B8862A'); gold.addColorStop(.75, '#FFF0B0'); gold.addColorStop(1, '#8A5A12');
    g.save(); g.translate(cx, cy); g.scale(1.08, 1.1); g.translate(-cx, -cy); cart(g); g.fillStyle = gold; g.fill(); g.restore();
    g.save(); g.translate(cx, cy); g.scale(1.04, 1.05); g.translate(-cx, -cy); cart(g); g.strokeStyle = '#6A4010'; g.lineWidth = 2 * u; g.stroke(); g.restore();
    // 夜景（画进饰框，灯另画）
    const scn = mk(W, H), s2 = scn.getContext('2d');
    const sk = s2.createLinearGradient(0, cy - eh, 0, cy + eh); sk.addColorStop(0, '#0C1640'); sk.addColorStop(1, '#3A3A7A'); s2.fillStyle = sk; s2.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) { s2.fillStyle = `rgba(255,250,220,${.4 + R() * .6})`; s2.beginPath(); s2.arc(cx + (R() - .5) * ew * 2, cy - eh + R() * eh, (1 + R() * 1.6) * u, 0, TAU); s2.fill(); }
    s2.fillStyle = '#F8EAA8'; s2.beginPath(); s2.arc(cx + ew * .55, cy - eh * .5, eh * .14, 0, TAU); s2.fill(); s2.fillStyle = '#0C1640'; s2.beginPath(); s2.arc(cx + ew * .6, cy - eh * .54, eh * .12, 0, TAU); s2.fill();
    [['#1A3A4A', .1, .5], ['#14302A', .3, .7]].forEach(([c, y0, amp]) => { s2.fillStyle = c; s2.beginPath(); s2.moveTo(cx - ew * 1.2, cy + eh); for (let i = 0; i <= 40; i++) { const q = i / 40; s2.lineTo(cx - ew * 1.2 + q * ew * 2.4, cy + eh * y0 - Math.sin(q * 5 + y0 * 9) * eh * .14 * amp); } s2.lineTo(cx + ew * 1.2, cy + eh); s2.fill(); });
    const road = q => [cx - ew * .9 + q * ew * 1.5 + Math.sin(q * 5) * ew * .1, cy + eh * (.95 - q * .6)];
    s2.strokeStyle = '#7A6A4A'; s2.lineWidth = 16 * u; s2.lineCap = 'round'; s2.beginPath(); for (let i = 0; i <= 30; i++) s2.lineTo(...road(i / 30)); s2.stroke();
    const lamps = [], wins = [];
    for (let i = 0; i < 6; i++) { const [x, y] = road(.08 + i * .16), h = (40 - i * 4) * u, lx = x + (i % 2 ? 1 : -1) * 26 * u; s2.strokeStyle = '#0A0A14'; s2.lineWidth = 3 * u; s2.beginPath(); s2.moveTo(lx, y); s2.lineTo(lx, y - h); s2.stroke(); lamps.push([lx, y - h, (9 - i) * u]); }
    for (const [hx, hy, hs] of [[cx - ew * .45, cy + eh * .1, 1], [cx + ew * .1, cy - eh * .05, .8], [cx + ew * .55, cy + eh * .3, 1.1]]) { const k = hs * u;
      s2.fillStyle = '#2A2030'; s2.fillRect(hx - 40 * k, hy - 40 * k, 80 * k, 40 * k); s2.fillStyle = '#4A1A1A'; s2.beginPath(); s2.moveTo(hx - 48 * k, hy - 40 * k); s2.lineTo(hx, hy - 72 * k); s2.lineTo(hx + 48 * k, hy - 40 * k); s2.fill();
      wins.push([hx - 26 * k, hy - 30 * k, 14 * k, 14 * k], [hx + 12 * k, hy - 30 * k, 14 * k, 14 * k]); }
    g.save(); cart(g); g.clip(); g.drawImage(scn, 0, 0); g.restore();
    g.save(); cart(g); g.strokeStyle = '#FFF4C0'; g.lineWidth = 3 * u; g.stroke(); g.restore();
    // 四周的花
    const corners = L ? [[W * .14, H * .26, 1], [W * .86, H * .26, 1], [W * .14, H * .76, 1.1], [W * .86, H * .76, 1.1]] : [[W * .22, H * .18, 1.1], [W * .78, H * .18, 1.1], [W * .22, H * .84, 1.2], [W * .78, H * .84, 1.2]];
    const rs = (L ? 120 : 125) * u;
    for (const [x, y, k] of corners) { const sd = x < cx ? 1 : -1;
      for (let i = 0; i < 5; i++) leaf(x + sd * rs * .3, y, rs * k * (1.1 - i * .08), (sd > 0 ? 0 : Math.PI) + (i - 2) * .55 * sd + (y < cy ? .3 : -.3) * sd);
      scroll(x + sd * rs * 1.4, y + (y < cy ? 1 : -1) * rs * .6, rs * .5 * k, sd > 0 ? -.4 : Math.PI + .4, sd < 0);
      rose(x, y, rs * k, R() < .5 ? ['#7A0E14', '#E8506A'] : ['#8A3A0A', '#F6B04A']);
      rose(x + sd * rs * 1.05, y + (y < cy ? 1 : -1) * rs * .9, rs * .55 * k, ['#5A1060', '#D088D8']); }
    // 饰框左右的小花枝
    for (const sd of [-1, 1]) { const x = cx + sd * ew * 1.2, y = cy; for (let i = 0; i < 4; i++) leaf(x, y + (i - 1.5) * 30 * u, 70 * u, (sd > 0 ? 0 : Math.PI) + (i - 1.5) * .35 * sd);
      rose(x + sd * 10 * u, y, 46 * u, ['#7A0E14', '#E8506A']); [[-40, -60], [40, 60], [-30, 70], [30, -70]].forEach(([dx, dy]) => { g.fillStyle = '#F8E06A'; g.beginPath(); g.arc(x + dx * u, y + dy * u, 6 * u, 0, TAU); g.fill(); }); }
    // 清漆细裂 + 微黄
    g.drawImage(weathering({ flake: 0, stain: .18, stainColor: '#6A5010', cracks: 60, crackColor: 'rgba(30,20,8,.35)', seed: 5 }), 0, 0, W, H);
    g.fillStyle = 'rgba(200,170,60,.07)'; g.fillRect(0, 0, W, H);
    // 彩带的两组点位：松开时是一条垂弧，打结时中间成两个环、两根尾巴
    const N = 120, rx0 = bw * 2.2, rx1 = W - bw * 2.2, ry = bw * 1.6, slack = [], bow = [], kx = W / 2, ky = ry + 34 * u, lr = (L ? 90 : 70) * u;
    for (let i = 0; i <= N; i++) { const q = i / N; slack.push([lerp(rx0, rx1, q), ry + Math.sin(q * Math.PI) * 60 * u + Math.sin(q * Math.PI * 6) * 6 * u]);
      let p; if (q < .3) { const a = q / .3; p = [lerp(rx0, kx - 10 * u, a), ry + Math.sin(a * Math.PI) * 40 * u * (1 - a) + a * (ky - ry)]; }
      else if (q < .7) { const a = (q - .3) / .4 * TAU; p = [kx - Math.sin(a) * lr * 1.2, ky + Math.sin(a * 2) * lr * .6]; }
      else { const a = (q - .7) / .3; p = [lerp(kx + 10 * u, rx1, a), ky + Math.sin(a * Math.PI) * 40 * u * a + (1 - a) * 0 - a * (ky - ry)]; }
      bow.push(p); }
    return { u, pnl, lamps, wins, slack, bow, kx, ky, cart: { cx, cy, ew, eh } };
  },
  draw(ctx, t, s) {
    const { u } = s; ctx.drawImage(s.pnl, 0, 0);
    // 按拍亮灯
    const on = i => smooth(.3 + i * BEAT, .3 + i * BEAT + .12, t);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    s.lamps.forEach(([x, y, r], i) => { const a = on(i) * (.85 + Math.sin(t * 9 + i) * .15); if (a <= 0) return; const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 6); gr.addColorStop(0, `rgba(255,220,120,${a})`); gr.addColorStop(.25, `rgba(255,170,60,${a * .5})`); gr.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = gr; ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12); });
    s.wins.forEach(([x, y, w, h], i) => { const a = on(6 + i); ctx.fillStyle = `rgba(255,200,90,${a * .95})`; ctx.fillRect(x, y, w, h); });
    ctx.restore();
    s.lamps.forEach(([x, y, r], i) => { ctx.fillStyle = on(i) > .5 ? '#FFF2B0' : '#3A3020'; ctx.beginPath(); ctx.arc(x, y, r * .6, 0, TAU); ctx.fill(); });
    // 彩带：先松后结、再松开
    const k = eInOutCubic(smooth(.4, 1.8, t)) * (1 - eInOutCubic(smooth(3.4, 4.6, t)));
    const pts = s.slack.map((p, i) => [lerp(p[0], s.bow[i][0], k), lerp(p[1], s.bow[i][1], k)]), P = resample(pts, 140), hw = 13 * u;
    for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1], sh = .65 + .35 * Math.abs(a.ny);
      for (const [o0, o1, c] of [[-1, -.3, [200, 30, 40]], [-.3, .3, [250, 210, 60]], [.3, 1, [200, 30, 40]]]) {
        ctx.fillStyle = `rgb(${c[0] * sh | 0},${c[1] * sh | 0},${c[2] * sh | 0})`; ctx.beginPath();
        ctx.moveTo(a.x + a.nx * hw * o0, a.y + a.ny * hw * o0); ctx.lineTo(b.x + b.nx * hw * o0, b.y + b.ny * hw * o0); ctx.lineTo(b.x + b.nx * hw * o1, b.y + b.ny * hw * o1); ctx.lineTo(a.x + a.nx * hw * o1, a.y + a.ny * hw * o1); ctx.fill(); } }
    if (k > .6) { ctx.fillStyle = '#B81E2A'; ctx.beginPath(); ctx.ellipse(s.kx, s.ky, 16 * u, 20 * u, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2 * u; ctx.stroke(); }
    // 釉面反光：一道斜的白，随时间轻轻挪
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const x0 = W * (.2 + t * .03);
    const gl = ctx.createLinearGradient(x0, 0, x0 + W * .25, H * .4); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.5, 'rgba(255,255,250,.14)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
});
