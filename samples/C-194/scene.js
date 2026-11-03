// C-194 旧学院风（暗黑学院）：书架、窗、书桌、台灯、地球仪全部用路径和渐变画好，再乘一张光照图，只有台灯照到的一圈是亮的；花体字是自己合成的连笔线：每个字母是一段带回环的摆线，按升部、降部改高度，再整体右倾，钢笔沿着这些线写出来；地球仪的大陆是经纬度上的多边形，每帧旋转后投影到球面；最后右页切成竖条，各条转不同角度，翻成一张带卷曲的书页
// 风格提示词：用旧学院风风格：深色木书架、绿罩台灯、皮面古籍、黄铜地球仪和散落的手写笔记，主色是墨绿、栗棕、酒红和羊皮纸黄，唯一的光源是暖黄烛光或台灯，在纸面上投出柔和的阴影，书页被风翻动、墨水笔在纸上写出花体字，窗外是阴雨的石砌回廊，画面压暗并带细颗粒，节奏缓慢，配钢琴和翻书声。
// 题材：手绘与绘画 · 适合：文学与哲学讲解、读书分享、学术与考试类内容、悬疑开场
const WRITE = [.5, 3.2], TURN = [3.45, 4.35];          // 写字、翻页的时间（sound.py 同步）
// 合成花体：一个字母 = 一段带回环的摆线；a 升部（高回环）、d 降部（向下回环）、n 普通
function cursive(R, x0, y0, nLetters, xh) {
  const pts = [], adv = xh * .95, c = adv * .34, N = 14;
  for (let k = 0; k < nLetters; k++) {
    const r = R(), kind = r < .18 ? 'a' : r < .3 ? 'd' : 'n';
    const cv = R() < .35 ? .25 : lerp(.7, 1.15, R());
    const h = kind === 'a' ? xh * 2.6 : kind === 'd' ? -xh * 1.9 : xh * lerp(.8, 1.15, R());
    for (let i = 0; i < N; i++) {
      const s = i / N, y = -h * (1 - Math.cos(TAU * s)) / 2;
      const x = (k + s) * adv - c * Math.sin(TAU * s) * (kind === 'n' ? cv : .55);
      pts.push([x0 + x - y * .32, y0 + y]);
    }
  }
  pts.push([x0 + nLetters * adv + xh * .2, y0 - xh * .3]);                // 收笔小勾
  return pts;
}
// 一页字：若干行，每行若干词；返回词的折线列表
function pageText(seed, PW, PH, k, lines, top) {
  const R = mulberry32(seed), words = [], xh = 9 * k, lh = 40 * k, m = 46 * k;
  for (let l = 0; l < lines; l++) {
    let x = m + (l === 0 ? 30 * k : 0); const y = top + l * lh;
    while (true) {
      const n = 3 + Math.floor(R() * 6), w = n * xh * .95 + xh;
      if (x + w > PW - m) break;
      words.push(cursive(R, x, y + (R() - .5) * 2 * k, n, xh)); x += w + xh * 1.6;
    }
  }
  return words;
}
scene({
  id: 'C-194', name: '旧学院风', dur: 4.6, still: 3.3,
  fonts: [],
  init() {
    const u = SHORT / 1080, R = mulberry32(194);
    const Lo = LAND
      ? { shelf: [0, 0, W * .6, H * .55], win: [W * .655, H * .05, W * .27, H * .48], desk: H * .55, book: [W * .47, H * .79, 400 * u], lamp: [W * .13, H * .76, 1.05 * u], globe: [W * .845, H * .63, H * .12], ink: [W * .76, H * .9] }
      : { shelf: [0, 0, W * .52, H * .34], win: [W * .58, H * .04, W * .36, H * .28], desk: H * .34, book: [W * .5, H * .63, 450 * u], lamp: [W * .2, H * .45, 1.0 * u], globe: [W * .79, H * .43, H * .075], ink: [W * .78, H * .86] };
    const [bx, by, PW] = Lo.book, PH = PW * 1.2, k = PW / 400, SQ = .74, ROT = -.03;
    // ---- 窗外：阴雨里的石砌回廊 ----
    const [wx, wy, ww, wh] = Lo.win;
    const out = mk(Math.ceil(ww), Math.ceil(wh)), o = out.getContext('2d');
    const sg = o.createLinearGradient(0, 0, 0, wh); sg.addColorStop(0, '#5d6b78'); sg.addColorStop(1, '#2c343c');
    o.fillStyle = sg; o.fillRect(0, 0, ww, wh);
    for (const [depth, col] of [[.55, '#46515c'], [1, '#262d33']]) {           // 两排拱廊，远的淡
      const aw = ww * .36 * depth, base = wh * (.55 + .4 * depth), ph = wh * .5 * depth;
      o.fillStyle = col;
      o.fillRect(0, base - ph - aw * .55, ww, aw * .25 + 2);
      for (let x = -aw * .3; x < ww + aw; x += aw) {
        o.fillRect(x - aw * .09, base - ph, aw * .18, ph + wh);                // 柱
        o.beginPath(); o.moveTo(x, base - ph); o.arc(x + aw / 2, base - ph, aw / 2, Math.PI, 0); o.lineTo(x + aw, base - ph - aw * .55); o.lineTo(x, base - ph - aw * .55); o.fill();   // 拱肩
      }
      o.fillRect(0, base, ww, wh);
    }
    const mist = o.createLinearGradient(0, wh * .5, 0, wh); mist.addColorStop(0, 'rgba(120,135,150,0)'); mist.addColorStop(1, 'rgba(120,135,150,.35)');
    o.fillStyle = mist; o.fillRect(0, 0, ww, wh);
    // ---- 静态的屋子：墙、书架、窗框、书桌（窗玻璃处留空）----
    const bg = mk(W, H), g = bg.getContext('2d');
    g.fillStyle = '#1c2a22'; g.fillRect(0, 0, W, Lo.desk);
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < W; x += 36 * u) g.fillRect(x, 0, 14 * u, Lo.desk);       // 墙纸竖纹
    const [sx, sy, sw, sh] = Lo.shelf, rows = 4, rh = sh / rows;
    g.fillStyle = '#24160d'; g.fillRect(sx, sy, sw, sh);
    const BOOK = ['#5a1a1c', '#1f3a2a', '#5a3418', '#1d2438', '#3b1414', '#2d2a1a', '#4a2a10'];
    for (let r = 0; r < rows; r++) {
      const y1 = sy + (r + 1) * rh - 14 * u;
      let x = sx + 18 * u;
      while (x < sx + sw - 30 * u) {
        const bw = lerp(16, 38, R()) * u, bh = rh * lerp(.62, .88, R()), col = BOOK[Math.floor(R() * BOOK.length)];
        if (R() < .06 && x + bh * .7 < sx + sw) {                               // 斜靠的一本
          g.save(); g.translate(x, y1); g.rotate(-.35); g.fillStyle = col; g.fillRect(0, -bh, bw, bh); g.restore(); x += bh * .38 + bw; continue;
        }
        const sp = g.createLinearGradient(x, 0, x + bw, 0); sp.addColorStop(0, 'rgba(0,0,0,.45)'); sp.addColorStop(.35, 'rgba(255,255,255,.07)'); sp.addColorStop(1, 'rgba(0,0,0,.5)');
        g.fillStyle = col; g.fillRect(x, y1 - bh, bw, bh); g.fillStyle = sp; g.fillRect(x, y1 - bh, bw, bh);
        g.fillStyle = '#b08a3e';                                               // 烫金横条
        for (const q of [.1, .16, .82, .88]) g.fillRect(x + 2 * u, y1 - bh * (1 - q), bw - 4 * u, Math.max(1, 2 * u));
        if (R() < .5) g.fillRect(x + bw * .3, y1 - bh * .6, bw * .4, bh * .12);
        x += bw + (R() < .1 ? 8 * u : 1.5 * u);
      }
      g.fillStyle = '#3a2414'; g.fillRect(sx, y1, sw, 14 * u);              // 搁板
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(sx, y1 + 14 * u, sw, 6 * u);
    }
    g.fillStyle = '#2e1c10'; g.fillRect(sx + sw - 18 * u, sy, 18 * u, sh); g.fillRect(sx, sy, 14 * u, sh);
    // 窗：尖拱窗框，玻璃处挖空
    const arch = (c, pad) => { c.beginPath(); c.moveTo(wx + pad, wy + wh - pad); c.lineTo(wx + pad, wy + ww * .5); c.quadraticCurveTo(wx + pad, wy + pad, wx + ww / 2, wy + pad); c.quadraticCurveTo(wx + ww - pad, wy + pad, wx + ww - pad, wy + ww * .5); c.lineTo(wx + ww - pad, wy + wh - pad); c.closePath(); };
    g.fillStyle = '#2a1a0e'; arch(g, -22 * u); g.fill();
    g.globalCompositeOperation = 'destination-out'; arch(g, 0); g.fill(); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#2a1a0e'; g.fillRect(wx + ww / 2 - 6 * u, wy, 12 * u, wh); g.fillRect(wx, wy + wh * .55, ww, 10 * u);
    g.fillStyle = '#21140a'; g.fillRect(wx - 40 * u, wy + wh, ww + 80 * u, 22 * u);    // 窗台
    // 书桌：木纹
    const dg = g.createLinearGradient(0, Lo.desk, 0, H); dg.addColorStop(0, '#3a2212'); dg.addColorStop(1, '#2a170b');
    g.fillStyle = dg; g.fillRect(0, Lo.desk, W, H - Lo.desk);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2 * u;
    for (let i = 0; i < 46; i++) {
      const y0 = Lo.desk + (i + R()) / 46 * (H - Lo.desk); g.beginPath();
      for (let x = 0; x <= W; x += 20 * u) g.lineTo(x, y0 + (noise1(x / (300 * u) + i * 3) - .5) * 14 * u);
      g.stroke();
    }
    g.fillStyle = '#4a2c16'; g.fillRect(0, Lo.desk, W, 8 * u); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, Lo.desk + 8 * u, W, 10 * u);
    // 散落的笔记和墨水瓶
    const parch = makePaper('#d9c391', { w: 300, h: 380, seed: 11, fiber: .2, grain: 14 });
    const note = (x, y, a, s, seed) => {
      g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-142, -182, 300, 380);
      g.drawImage(parch, -150, -190, 300, 380);
      g.strokeStyle = 'rgba(60,40,30,.75)'; g.lineWidth = 1.4;
      for (const w of pageText(seed, 300, 380, .75, 9, 40)) { g.beginPath(); w.forEach(([px, py], i) => i ? g.lineTo(px - 150, py - 190) : g.moveTo(px - 150, py - 190)); g.stroke(); }
      g.restore();
    };
    if (LAND) { note(W * .2, H * .93, -.25, .9 * u, 3); note(W * .73, H * .83, .18, .85 * u, 4); }
    else { note(W * .18, H * .84, -.2, 1.05 * u, 3); note(W * .82, H * .7, .22, .9 * u, 4); note(W * .55, H * .92, .05, 1.0 * u, 5); }
    const [ix, iy] = Lo.ink;
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(ix + 10 * u, iy + 8 * u, 46 * u, 18 * u, 0, 0, TAU); g.fill();
    const ig = g.createLinearGradient(ix - 40 * u, 0, ix + 40 * u, 0); ig.addColorStop(0, '#0b1018'); ig.addColorStop(.3, '#2a3a52'); ig.addColorStop(1, '#05070a');
    g.fillStyle = ig; g.beginPath(); g.moveTo(ix - 40 * u, iy); g.lineTo(ix - 34 * u, iy - 48 * u); g.lineTo(ix + 34 * u, iy - 48 * u); g.lineTo(ix + 40 * u, iy); g.fill();
    g.fillStyle = '#8a6a2a'; g.fillRect(ix - 16 * u, iy - 64 * u, 32 * u, 18 * u);
    // ---- 书页 ----
    const pageTex = seed => {
      const c = mk(Math.ceil(PW), Math.ceil(PH)), p = c.getContext('2d');
      p.drawImage(makePaper('#e6d3a2', { w: 200, h: 240, seed, fiber: .25, grain: 12 }), 0, 0, PW, PH);
      const st = p.createRadialGradient(PW * .7, PH * .8, 0, PW * .7, PH * .8, PW * .5); st.addColorStop(0, 'rgba(140,100,50,.12)'); st.addColorStop(1, 'rgba(140,100,50,0)');
      p.fillStyle = st; p.fillRect(0, 0, PW, PH);
      return c;
    };
    const leftP = pageTex(21), rightP = pageTex(22), nextP = pageTex(23);
    const lp = leftP.getContext('2d');
    lp.strokeStyle = 'rgba(45,30,40,.8)'; lp.lineWidth = 1.5 * k;
    for (const w of pageText(31, PW, PH, k, 6, 70 * k)) { lp.beginPath(); w.forEach(([x, y], i) => i ? lp.lineTo(x, y) : lp.moveTo(x, y)); lp.stroke(); }
    // 左页下半：一张手绘天体轨道图
    const ox = PW * .5, oy = PH * .7;
    lp.lineWidth = 1.2 * k; lp.strokeStyle = 'rgba(45,30,40,.7)';
    for (const r of [30, 60, 95, 130]) { lp.beginPath(); lp.ellipse(ox, oy, r * k, r * k * .55, -.2, 0, TAU); lp.stroke(); }
    lp.fillStyle = 'rgba(45,30,40,.85)'; lp.beginPath(); lp.arc(ox, oy, 8 * k, 0, TAU); lp.fill();
    for (const [r, a] of [[30, 1], [60, 2.5], [95, 4.2], [130, 5.5]]) { lp.beginPath(); lp.arc(ox + Math.cos(a) * r * k * Math.cos(.2) , oy + Math.sin(a) * r * k * .55, 4 * k, 0, TAU); lp.fill(); }
    // 右页要写的字：首字母大花饰 + 五行
    const words = pageText(41, PW, PH, k, 7, 74 * k);
    const capR = mulberry32(5), cap = [];
    for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU * 1.6; cap.push([46 * k + 14 * k + Math.cos(a + 1) * (12 + i * .25) * k, 64 * k - Math.sin(a + 1) * (16 + i * .3) * k]); }
    words.unshift(cap);
    const lens = words.map(polyLen), total = lens.reduce((a, b) => a + b, 0);
    const rightFull = mk(rightP.width, rightP.height), rf = rightFull.getContext('2d');
    rf.drawImage(rightP, 0, 0); rf.strokeStyle = '#1c1430'; rf.lineWidth = 1.7 * k; rf.lineJoin = rf.lineCap = 'round';
    for (const w of words) drawPartial(rf, w, 1);
    // ---- 地球仪的大陆：经纬度上的随机团块 ----
    const conts = [];
    for (let i = 0; i < 6; i++) {
      const la = (R() - .5) * 2.2, lo = R() * TAU, rr = lerp(.25, .55, R()), pts = [];
      for (let j = 0; j < 18; j++) { const a = j / 18 * TAU, q = rr * (.6 + .5 * R()); pts.push([la + Math.sin(a) * q * .8, lo + Math.cos(a) * q]); }
      conts.push(pts);
    }
    // ---- 光照图：台灯照一圈暖光，窗口一点冷光，其余压暗 ----
    const lm = mk(W / 2, H / 2), l = lm.getContext('2d'); l.scale(.5, .5);
    l.fillStyle = '#2a221c'; l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'lighter';
    const [lx, ly] = Lo.lamp, pcx = lerp(lx, bx, .62), pcy = lerp(ly, by, .5);
    l.save(); l.translate(pcx, pcy); l.scale(1.5, 1);
    const pr = PW * 1.45, pool = l.createRadialGradient(0, 0, 0, 0, 0, pr);
    pool.addColorStop(0, 'rgb(225,200,160)'); pool.addColorStop(.45, 'rgb(170,135,95)'); pool.addColorStop(1, 'rgb(0,0,0)');
    l.fillStyle = pool; l.fillRect(-pr, -pr, pr * 2, pr * 2); l.restore();
    const wl = l.createRadialGradient(wx + ww / 2, wy + wh / 2, 0, wx + ww / 2, wy + wh / 2, ww); wl.addColorStop(0, 'rgb(70,85,100)'); wl.addColorStop(1, 'rgb(0,0,0)');
    l.fillStyle = wl; l.fillRect(0, 0, W, H);
    const motes = Array.from({ length: 40 }, () => ({ x: R(), y: R(), ph: R() * TAU, s: lerp(1, 2.6, R()) }));
    const drops = Array.from({ length: 16 }, () => ({ x: R(), y: R(), v: lerp(.04, .14, R()), ph: R() }));
    return { Lo, out, bg, PW, PH, k, SQ, ROT, leftP, rightP, nextP, rightFull, words, lens, total, conts, lm, pcx, pcy, motes, drops };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, { Lo, PW, PH, k, SQ, ROT } = s;
    const [bx, by] = Lo.book, [wx, wy, ww, wh] = Lo.win;
    // 镜头：慢慢推近书页
    const Z = 1 + .07 * eInOutCubic(inv(0, 4.6, t)), fx = lerp(W / 2, bx, .5), fy = lerp(H / 2, by, .4);
    ctx.save(); ctx.translate(fx, fy); ctx.scale(Z, Z); ctx.translate(-fx, -fy);
    // 窗外和雨
    ctx.drawImage(s.out, wx, wy, ww, wh);
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    ctx.strokeStyle = 'rgba(200,215,230,.22)'; ctx.lineWidth = 1.3 * u; ctx.beginPath();
    for (let i = 0; i < 90; i++) {
      const x = wx + hash1(i) * ww * 1.2, y = wy + ((hash1(i + 99) + t * 1.6) % 1) * (wh + 60 * u) - 30 * u;
      ctx.moveTo(x, y); ctx.lineTo(x - 6 * u, y + 34 * u);
    }
    ctx.stroke();
    for (const d of s.drops) {                                             // 玻璃上往下滑的水珠
      const y = wy + ((d.y + t * d.v) % 1) * wh, x = wx + d.x * ww;
      ctx.strokeStyle = 'rgba(210,225,240,.18)'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(x, y - 50 * u * d.v * 10); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = 'rgba(225,235,245,.45)'; ctx.beginPath(); ctx.ellipse(x, y, 3.2 * u, 4.2 * u, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.drawImage(s.bg, 0, 0);
    // 地球仪
    const [gx, gy, gr] = Lo.globe, rot = t * .55;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(gx + gr * .2, gy + gr * 1.75, gr * .9, gr * .2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a4a1c'; ctx.beginPath(); ctx.moveTo(gx - gr * .5, gy + gr * 1.72); ctx.lineTo(gx - gr * .12, gy + gr * 1.2); ctx.lineTo(gx + gr * .12, gy + gr * 1.2); ctx.lineTo(gx + gr * .5, gy + gr * 1.72); ctx.fill();
    ctx.fillRect(gx - gr * .06, gy + gr, gr * .12, gr * .3);
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(.4);
    const sea = ctx.createRadialGradient(-gr * .35, -gr * .35, gr * .1, 0, 0, gr); sea.addColorStop(0, '#5e7a6a'); sea.addColorStop(1, '#1d2e2a');
    ctx.fillStyle = sea; ctx.beginPath(); ctx.arc(0, 0, gr, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, gr, 0, TAU); ctx.clip();
    const proj = (la, lo) => { const c = Math.cos(la); let x = Math.sin(lo + rot) * c, y = -Math.sin(la), z = Math.cos(lo + rot) * c; if (z < 0) { const n = Math.hypot(x, y) || 1; x /= n; y /= n; } return [x * gr, y * gr, z]; };
    ctx.fillStyle = '#c9b07a';
    for (const c of s.conts) {
      const P = c.map(([la, lo]) => proj(la, lo)); if (P.every(p => p[2] < 0)) continue;
      ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(230,210,160,.25)'; ctx.lineWidth = 1 * u;
    for (let j = 0; j < 12; j++) { const a = ((j / 12 * TAU + rot) % TAU + TAU) % TAU; if (Math.cos(a) < 0) continue; ctx.beginPath(); ctx.ellipse(0, 0, Math.abs(Math.sin(a)) * gr, gr, 0, 0, TAU); ctx.stroke(); }
    for (const la of [-.6, 0, .6]) { ctx.beginPath(); ctx.ellipse(0, -Math.sin(la) * gr, Math.cos(la) * gr, Math.cos(la) * gr * .08, 0, 0, Math.PI); ctx.stroke(); }
    const sh = ctx.createRadialGradient(-gr * .4, -gr * .4, gr * .2, 0, 0, gr); sh.addColorStop(0, 'rgba(255,240,200,.18)'); sh.addColorStop(.7, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = sh; ctx.fillRect(-gr, -gr, gr * 2, gr * 2);
    ctx.restore();
    ctx.strokeStyle = '#a8803a'; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.arc(0, 0, gr * 1.1, -Math.PI * .5, Math.PI * .5); ctx.stroke();       // 黄铜子午圈
    ctx.restore();
    // ---- 书 ----
    ctx.save(); ctx.translate(bx, by); ctx.rotate(ROT); ctx.scale(1, SQ);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-PW - 30 * k, -PH / 2 + 30 * k, PW * 2 + 70 * k, PH + 40 * k);    // 影子
    ctx.fillStyle = '#4a1418'; ctx.fillRect(-PW - 22 * k, -PH / 2 - 10 * k, PW * 2 + 44 * k, PH + 34 * k);          // 皮面封皮
    ctx.fillStyle = '#cdb88a'; ctx.fillRect(-PW - 6 * k, -PH / 2 + 4 * k, PW * 2 + 12 * k, PH + 10 * k);            // 书页厚度
    ctx.strokeStyle = 'rgba(120,95,60,.6)'; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-PW - 6 * k + i, PH / 2 + i * 2.5 * k); ctx.lineTo(PW + 6 * k - i, PH / 2 + i * 2.5 * k); ctx.stroke(); }
    ctx.drawImage(s.leftP, -PW, -PH / 2, PW, PH);
    const turning = t >= TURN[0];
    ctx.drawImage(turning ? s.nextP : s.rightP, 0, -PH / 2, PW, PH);
    // 写字：按总长匀速，词与词之间提笔
    let tip = null;
    if (!turning) {
      ctx.save(); ctx.translate(0, -PH / 2); ctx.strokeStyle = '#1c1430'; ctx.lineWidth = 1.7 * k; ctx.lineJoin = ctx.lineCap = 'round';
      let L = s.total * inv(WRITE[0], WRITE[1], t);
      for (let i = 0; i < s.words.length && L > 0; i++) {
        const p = Math.min(1, L / s.lens[i]); const q = drawPartial(ctx, s.words[i], p); L -= s.lens[i];
        if (p < 1 || (L <= 0 && t < WRITE[1])) tip = q;
      }
      ctx.restore();
      if (tip) tip = [tip[0], tip[1] - PH / 2];
    }
    // 书脊阴影
    const gut = ctx.createLinearGradient(-PW * .12, 0, PW * .12, 0); gut.addColorStop(0, 'rgba(60,40,20,0)'); gut.addColorStop(.5, 'rgba(60,40,20,.5)'); gut.addColorStop(1, 'rgba(60,40,20,0)');
    ctx.fillStyle = gut; ctx.fillRect(-PW * .12, -PH / 2, PW * .24, PH);
    // 翻页：右页切成竖条，靠书脊的转得多、外缘落后一点，形成卷曲
    if (turning && t < TURN[1] + .05) {
      const a0 = Math.PI * eInOutCubic(inv(TURN[0], TURN[1], t)), N = 28, sw = PW / N;
      let x = 0, y = 0;
      for (let i = 0; i < N; i++) {
        const uu = (i + .5) / N, a = clamp(a0 - Math.sin(a0) * .9 * uu, 0, Math.PI), c = Math.cos(a), sn = Math.sin(a);
        const dx = sw * c, lift = sw * sn * 1.1;
        ctx.save(); ctx.translate(x, -y);
        if (c >= 0) { ctx.transform(c, -sn * 1.1, 0, 1, 0, 0); ctx.drawImage(s.rightFull, i * s.rightFull.width / N, 0, s.rightFull.width / N + 1, s.rightFull.height, 0, -PH / 2, sw + .6, PH); }
        else { ctx.transform(c, -sn * 1.1, 0, 1, 0, 0); ctx.drawImage(s.nextP, (N - 1 - i) * s.nextP.width / N, 0, s.nextP.width / N + 1, s.nextP.height, 0, -PH / 2, sw + .6, PH); }
        ctx.fillStyle = `rgba(40,25,10,${.35 * Math.abs(sn) * (c < 0 ? .5 : 1)})`; ctx.fillRect(0, -PH / 2, sw + .6, PH);
        ctx.restore();
        x += dx; y += lift;
      }
    }
    ctx.restore();
    // 钢笔：笔尖在当前写到的位置（书的局部坐标换成画面坐标）
    if (tip) {
      const cs = Math.cos(ROT), sn = Math.sin(ROT), px = bx + tip[0] * cs - tip[1] * SQ * sn, py = by + tip[0] * sn + tip[1] * SQ * cs;
      const L = 300 * k;
      ctx.save(); ctx.translate(px + 10 * k, py + 4 * k); ctx.rotate(-.8);
      ctx.fillStyle = 'rgba(30,15,5,.22)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L, -10 * k); ctx.lineTo(L, 10 * k); ctx.fill(); ctx.restore();       // 影子
      ctx.save(); ctx.translate(px, py); ctx.rotate(-.95);
      ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34 * k, -7 * k); ctx.lineTo(34 * k, 7 * k); ctx.fill();
      ctx.strokeStyle = '#5a4210'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2 * k, 0); ctx.lineTo(28 * k, 0); ctx.stroke();
      const bar = ctx.createLinearGradient(0, -10 * k, 0, 10 * k); bar.addColorStop(0, '#3a3a40'); bar.addColorStop(.3, '#0c0c10'); bar.addColorStop(1, '#000');
      ctx.fillStyle = bar; ctx.beginPath(); ctx.moveTo(34 * k, -8 * k); ctx.lineTo(L, -11 * k); ctx.quadraticCurveTo(L + 14 * k, 0, L, 11 * k); ctx.lineTo(34 * k, 8 * k); ctx.fill();
      ctx.fillStyle = '#c9a24a'; ctx.fillRect(110 * k, -10 * k, 8 * k, 20 * k); ctx.fillRect(150 * k, -12 * k, 120 * k, 4 * k);
      ctx.restore();
    }
    // 光照：乘光照图
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(s.lm, 0, 0, W, H); ctx.restore();
    // 台灯：绿玻璃罩自己发光
    const [lx, ly, ls] = Lo.lamp;
    ctx.save(); ctx.translate(lx, ly); ctx.scale(ls, ls);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(10, 6, 120, 26, 0, 0, TAU); ctx.fill();
    const br = ctx.createLinearGradient(-100, 0, 100, 0); br.addColorStop(0, '#3a2a10'); br.addColorStop(.4, '#c9a24a'); br.addColorStop(1, '#4a3412');
    ctx.fillStyle = br; ctx.beginPath(); ctx.ellipse(0, 0, 100, 22, 0, 0, TAU); ctx.fill();
    ctx.fillRect(-8, -230, 16, 230); ctx.fillRect(-60, -238, 120, 10);
    ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(70, -240); ctx.lineTo(70, -170); ctx.stroke();
    ctx.beginPath(); ctx.arc(70, -166, 5, 0, TAU); ctx.stroke();
    const glow = ctx.createRadialGradient(0, -230, 10, 0, -200, 260); glow.addColorStop(0, 'rgba(255,220,150,.35)'); glow.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = glow; ctx.fillRect(-260, -460, 520, 520); ctx.globalCompositeOperation = 'source-over';
    const shade = ctx.createLinearGradient(0, -310, 0, -240); shade.addColorStop(0, '#0c3a24'); shade.addColorStop(.6, '#1f7a4a'); shade.addColorStop(1, '#58c486');
    ctx.fillStyle = shade; ctx.beginPath(); ctx.moveTo(-150, -236); ctx.quadraticCurveTo(-140, -318, 0, -322); ctx.quadraticCurveTo(140, -318, 150, -236); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(200,255,220,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-110, -300); ctx.quadraticCurveTo(0, -318, 110, -300); ctx.stroke();
    ctx.fillStyle = '#ffe9b0'; ctx.fillRect(-150, -240, 300, 6);
    ctx.restore();
    // 光里的浮尘
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const m of s.motes) {
      const x = s.pcx + (m.x - .5) * PW * 1.6 + Math.sin(t * .4 + m.ph) * 30 * u, y = lerp(ly - 300 * ls, by, m.y) + Math.cos(t * .3 + m.ph * 2) * 20 * u - t * 6 * u;
      ctx.fillStyle = `rgba(255,225,170,${.25 + .2 * Math.sin(t * 2 + m.ph)})`; ctx.beginPath(); ctx.arc(x, y, m.s * u, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.restore();
    grain(ctx, f, .32);
    vignette(ctx, .7, .3);
  }
});
