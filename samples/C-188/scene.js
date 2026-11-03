// C-188 新海诚式光影：窗外的积雨云是几十团渐变圆团叠成，再用「云的形状减去朝背光方向平移的形状」取出朝太阳的那一圈边、模糊后加亮成金边；屋里的光柱是把每格窗玻璃沿太阳方向一层层平移到地板上、用加色叠出来的，乘上流动的噪声就成了丁达尔光；女孩逆光，身上是冷色平涂加同一个减法做出的暖色轮廓光；最后叠泛光、沿太阳与画面中心连线排开的光晕和冷暖分离的调色，镜头缓慢推近并上仰。
// 风格提示词：用新海诚式光影风格：几乎写实的室内或街景，天空是饱和的蓝和层层叠叠被阳光镶边的积雨云，电线、屋顶和飞机拉线衬在天边，窗外强光把窗框投成地板上的亮块，空气里有丁达尔光柱和漂浮的光尘，玻璃上挂着水珠，角色用赛璐璐平涂、阴影落在背光一侧并带一道暖色轮廓光，整体叠加镜头光晕、泛光和冷暖分离的调色，镜头缓慢推近或仰拍天空。只学画法，不出现现有角色或场景。
// 题材：卡通与动漫 · 适合：青春、离别与重逢、城市日常、音乐 MV
scene({
  id: 'C-188', name: '新海诚式光影', dur: 5, still: 3.6,
  fonts: [],
  init() {
    const u = SHORT / 1080, R = mulberry32(188);
    const L = LAND ? { wl: W * .36, wr: W * .95, wt: H * .07, wb: H * .6, fy: H * .73, cols: 3, rows: 2 }
                   : { wl: W * .08, wr: W * .94, wt: H * .07, wb: H * .55, fy: H * .65, cols: 2, rows: 3 };
    L.ww = L.wr - L.wl; L.wh = L.wb - L.wt;
    L.sun = [L.wl + L.ww * .84, L.wt + L.wh * .14];
    // ---- 积雨云：圆团叠体积，金边＝形状减去背光方向平移的形状 ----
    const cl = mk(W, H), g = cl.getContext('2d');
    const puffs = [];
    const tower = (cx, base, w, h, n) => { for (let i = 0; i < n; i++) { const a = R(), y = base - h * Math.pow(R(), .8), wy = w * (.35 + .65 * Math.pow((base - y) / h, .6)) * (.5 + .5 * Math.sin(a * 9)); const big = i < n * .2; puffs.push([cx + (R() - .5) * wy * (big ? .6 : 1), y, big ? (.07 + .06 * R()) * h + w * .06 : (.025 + .035 * R()) * h + w * .02]); } };
    if (LAND) { tower(L.wl + L.ww * .5, L.wb - L.wh * .05, L.ww * .34, L.wh * .82, 230); tower(L.wl + L.ww * .16, L.wb - L.wh * .1, L.ww * .22, L.wh * .4, 80); tower(L.wl + L.ww * .86, L.wb - L.wh * .02, L.ww * .28, L.wh * .3, 80); }
    else { tower(L.wl + L.ww * .45, L.wb - L.wh * .05, L.ww * .5, L.wh * .8, 230); tower(L.wl + L.ww * .88, L.wb - L.wh * .05, L.ww * .3, L.wh * .35, 80); }
    // 用圆团拼出形状场，再叠 fbm 细节；亮度取「这一点的密度减去朝太阳挪一步处的密度」
    const [sx, sy] = L.sun, SC = 2, cw = Math.ceil(W / SC), ch = Math.ceil(H / SC), img = g.createImageData(cw, ch), D = img.data;
    const dens = (x, y) => { let m = 0; for (const [px, py, r] of puffs) { const dx = (x - px) / r, dy = (y - py) * 1.15 / r, q = dx * dx + dy * dy; if (q < 6) m += Math.exp(-2 * q); } return m - .5 + .14 * (fbm(x * .02 / u, y * .02 / u, 3) - .5) + .18 * (fbm(x * .006 / u, y * .006 / u, 3) - .5); };
    for (let yy = Math.floor(L.wt / SC); yy < Math.ceil(L.wb / SC); yy++) for (let xx = Math.floor(L.wl / SC); xx < Math.ceil(L.wr / SC); xx++) {
      const x = xx * SC, y = yy * SC, d = dens(x, y); if (d < -.05) continue;
      const dx = sx - x, dy = sy - y, dl = Math.hypot(dx, dy), ux = dx / dl, uy = dy / dl, l = clamp(.45 + (d - dens(x + ux * 7 * u, y + uy * 7 * u)) * 2.4 + (d - dens(x + ux * 30 * u, y + uy * 30 * u)) * .5);
      const v = clamp((y - L.wt) / L.wh), sh = l * (1 - .35 * v), warm = clamp(1 - dl / (L.ww * .7));
      const i = (yy * cw + xx) * 4;
      D[i] = lerp(112, 255, sh) + 0 * warm; D[i + 1] = lerp(134, 250, sh) - 8 * warm * sh; D[i + 2] = lerp(196, 245, sh) - 30 * warm * sh; D[i + 3] = 255 * smooth(-.05, .12, d);
    }
    let gr;
    const tmp = mk(cw, ch); tmp.getContext('2d').putImageData(img, 0, 0); g.drawImage(tmp, 0, 0, W, H);
    const rim = (d, blur, a) => {
      const m = mk(W, H), q = m.getContext('2d'), ang = Math.atan2(sy - L.wb, sx - (L.wl + L.ww * .5));
      q.drawImage(cl, 0, 0); q.globalCompositeOperation = 'destination-out'; q.drawImage(cl, -Math.cos(ang) * d, -Math.sin(ang) * d);
      q.globalCompositeOperation = 'source-in'; q.fillStyle = '#fff1c8'; q.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.filter = `blur(${blur}px)`; g.drawImage(m, 0, 0); g.restore();
    };
    rim(5 * u, 1.5 * u, .9); rim(16 * u, 8 * u, .45);
    // ---- 屋顶、电线杆（逆光剪影） ----
    const roofs = mk(W, H), q = roofs.getContext('2d');
    q.fillStyle = '#34446c'; q.beginPath(); q.moveTo(L.wl, L.wb);
    let x = L.wl; while (x < L.wr) { const w = (60 + R() * 110) * u, h = (25 + R() * 60) * u * (R() < .15 ? 2.6 : 1); const y = L.wb - h; if (R() < .5) { q.lineTo(x, y); q.lineTo(x + w / 2, y - w * .25); q.lineTo(x + w, y); } else { q.lineTo(x, y); q.lineTo(x + w, y); } x += w; }
    q.lineTo(L.wr, L.wb); q.closePath(); q.fill();
    q.fillStyle = '#2a3757'; for (let i = 0; i < 6; i++) q.fillRect(L.wl + R() * L.ww, L.wb - (20 + R() * 40) * u, (10 + R() * 18) * u, (20 + R() * 40) * u);
    q.globalCompositeOperation = 'source-atop'; q.strokeStyle = 'rgba(255,214,160,.7)'; q.lineWidth = 2 * u;
    q.translate(-1.5 * u, 2 * u); q.globalCompositeOperation = 'destination-over';
    const px = L.wl + L.ww * (LAND ? .7 : .74), ptop = L.wt + L.wh * .2;
    q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-over'; q.fillStyle = '#1c2442';
    q.fillRect(px - 5 * u, ptop, 10 * u, L.wb - ptop); for (const [yy, ww] of [[0, 90], [26, 70]]) q.fillRect(px - ww * u, ptop + yy * u + 20 * u, ww * 2 * u, 6 * u);
    q.strokeStyle = '#1c2442'; q.lineWidth = 2 * u;
    for (const [yy, ww, i] of [[0, 90, 0], [0, -90, 1], [26, 70, 2], [26, -70, 3], [0, 40, 4]]) {
      const y0 = ptop + yy * u + 18 * u, x0 = px + ww * u * .9;
      q.beginPath(); q.moveTo(x0, y0); q.quadraticCurveTo((x0 + L.wl) / 2, y0 + (60 + i * 12) * u, L.wl - 10, y0 + (20 + i * 25) * u); q.stroke();
      q.beginPath(); q.moveTo(x0, y0); q.quadraticCurveTo((x0 + L.wr) / 2, y0 + (40 + i * 10) * u, L.wr + 10, y0 + (35 - i * 6) * u); q.stroke();
    }
    // ---- 地板：木纹透视线 ----
    const fl = mk(W, H), h = fl.getContext('2d');
    gr = h.createLinearGradient(0, L.fy, 0, H); gr.addColorStop(0, '#4c3d3c'); gr.addColorStop(1, '#2c2531'); h.fillStyle = gr; h.fillRect(0, L.fy, W, H - L.fy);
    h.strokeStyle = 'rgba(20,15,25,.45)'; h.lineWidth = 1.5 * u; const vx = W * .6, vy = L.fy - H * .6;
    for (let i = -14; i <= 14; i++) { const bx = W * .5 + i * W * .12; h.beginPath(); h.moveTo(lerp(vx, bx, (L.fy - vy) / (H * 1.1 - vy)), L.fy); h.lineTo(bx, H * 1.1); h.stroke(); }
    // ---- 水珠：固定位置，几颗往下滑 ----
    const drops = []; for (let i = 0; i < (LAND ? 70 : 60); i++) { const dx = L.wl + L.ww * (.45 + .55 * R()), dy = L.wt + L.wh * (.35 + .65 * R()); drops.push({ x: dx, y: dy, r: (2 + 7 * R() ** 2) * u, slide: R() < .1 ? 1 + R() * 3 : 0 }); }
    // 光柱噪声纹理
    const nz = mk(W / 4, H / 4), n = nz.getContext('2d'), id = n.createImageData(nz.width, nz.height);
    for (let yy = 0; yy < nz.height; yy++) for (let xx = 0; xx < nz.width; xx++) { const v = fbm(xx * .02 + yy * .012, yy * .02, 4), i = (yy * nz.width + xx) * 4; id.data[i] = id.data[i + 1] = id.data[i + 2] = 255; id.data[i + 3] = 255 * clamp(.25 + (v - .35) * 2.2); }
    n.putImageData(id, 0, 0);
    const motes = Array.from({ length: 140 }, () => ({ x: R() * W, y: R() * H, r: (1 + R() * 3) * u, sp: .3 + R(), ph: R() * TAU }));
    return { u, L, cl, roofs, fl, drops, nz, motes, shaft: mk(W, H) };
  },
  draw(ctx, t, s, f) {
    const { u, L } = s, k = eInOutCubic(t / 5), z = 1 + .08 * k, FX = W * .6, FY = H * .35, ty = -H * .022 * k;
    const M = (x, y) => [x * z + FX * (1 - z), y * z + FY * (1 - z) - ty];
    ctx.setTransform(z, 0, 0, z, FX * (1 - z), FY * (1 - z) - ty);
    // 墙：背光的室内偏冷偏暗
    let gr = ctx.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#272c45'); gr.addColorStop(1, '#4a5578');
    ctx.fillStyle = gr; ctx.fillRect(-W * .1, -H * .1, W * 1.2, L.fy + H * .1);
    // 窗外
    ctx.save(); ctx.beginPath(); ctx.rect(L.wl, L.wt, L.ww, L.wh); ctx.clip();
    gr = ctx.createLinearGradient(0, L.wt, 0, L.wb); gr.addColorStop(0, '#0b46c0'); gr.addColorStop(.55, '#2c86ec'); gr.addColorStop(1, '#a6dcff');
    ctx.fillStyle = gr; ctx.fillRect(L.wl, L.wt, L.ww, L.wh);
    const [sx, sy] = L.sun;
    gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, L.ww * .5); gr.addColorStop(0, 'rgba(255,250,230,.95)'); gr.addColorStop(.12, 'rgba(255,236,190,.5)'); gr.addColorStop(1, 'rgba(255,230,190,0)');
    ctx.fillStyle = gr; ctx.fillRect(L.wl, L.wt, L.ww, L.wh);
    ctx.drawImage(s.cl, -t * 6 * u, 0);
    // 飞机和拉线
    const plx = L.wl + L.ww * (.78 - .22 * t / 5), ply = L.wt + L.wh * (.2 - .03 * t / 5), tl = L.ww * (.32 + .2 * t / 5);
    gr = ctx.createLinearGradient(plx, ply, plx + tl, ply + tl * .14); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = gr; ctx.lineCap = 'round';
    for (const [w, a] of [[3, 1], [9, .25]]) { ctx.lineWidth = w * u; ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(plx, ply); ctx.lineTo(plx + tl, ply + tl * .14 + 6 * u); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(plx, ply, 5 * u, 2 * u, .14, 0, TAU); ctx.fill();
    ctx.drawImage(s.roofs, 0, 0);
    // 水珠：深色中心折射出天色，底部亮月牙，左上一个高光点
    for (const d of s.drops) {
      const y = d.y + (d.slide ? Math.max(0, t - d.slide) ** 2 * 40 * u : 0);
      if (d.slide && t > d.slide) { ctx.strokeStyle = 'rgba(200,230,255,.25)'; ctx.lineWidth = d.r * .8; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(30,70,140,.45)'; ctx.beginPath(); ctx.arc(d.x, y, d.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,245,220,.85)'; ctx.lineWidth = d.r * .35; ctx.beginPath(); ctx.arc(d.x, y, d.r * .8, .3, 2.6); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(d.x - d.r * .35, y - d.r * .35, d.r * .22, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // 窗框、窗台
    const fw = 22 * u, mw = 12 * u;
    ctx.fillStyle = '#1f2638';
    ctx.fillRect(L.wl - fw, L.wt - fw, L.ww + 2 * fw, fw); ctx.fillRect(L.wl - fw, L.wt - fw, fw, L.wh + 2 * fw); ctx.fillRect(L.wr, L.wt - fw, fw, L.wh + 2 * fw);
    const panes = [];
    for (let i = 1; i < L.cols; i++) ctx.fillRect(L.wl + L.ww * i / L.cols - mw / 2, L.wt, mw, L.wh);
    for (let j = 1; j < L.rows; j++) ctx.fillRect(L.wl, L.wt + L.wh * j / L.rows - mw / 2, L.ww, mw);
    for (let i = 0; i < L.cols; i++) for (let j = 0; j < L.rows; j++) panes.push([L.wl + L.ww * i / L.cols + mw / 2, L.wt + L.wh * j / L.rows + mw / 2, L.ww / L.cols - mw, L.wh / L.rows - mw]);
    ctx.fillStyle = 'rgba(255,205,150,.55)'; for (let i = 1; i < L.cols; i++) ctx.fillRect(L.wl + L.ww * i / L.cols - mw / 2, L.wt, 2 * u, L.wh);
    ctx.fillStyle = '#2a3249'; ctx.fillRect(L.wl - fw * 2, L.wb, L.ww + fw * 4, 26 * u);
    ctx.fillStyle = '#ffd7a0'; ctx.fillRect(L.wl - fw * 2, L.wb, L.ww + fw * 4, 3 * u);
    // 窗台上的小盆栽和水杯（剪影＋亮边）
    const pp = L.wl + L.ww * .2, gp = L.wl + L.ww * .3;
    ctx.fillStyle = '#20283c'; ctx.beginPath(); ctx.moveTo(pp - 22 * u, L.wb); ctx.lineTo(pp - 28 * u, L.wb - 40 * u); ctx.lineTo(pp + 28 * u, L.wb - 40 * u); ctx.lineTo(pp + 22 * u, L.wb); ctx.fill();
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .32 + .05 * Math.sin(t * 2 + i); ctx.save(); ctx.translate(pp, L.wb - 40 * u); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(32 * u, 0, 30 * u, 9 * u, 0, 0, TAU); ctx.fillStyle = '#1b2a2e'; ctx.fill(); ctx.strokeStyle = 'rgba(255,214,150,.6)'; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.ellipse(32 * u, 0, 30 * u, 9 * u, 0, -1.6, 0); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = 'rgba(180,215,255,.35)'; ctx.fillRect(gp - 14 * u, L.wb - 50 * u, 28 * u, 50 * u); ctx.fillStyle = 'rgba(255,240,210,.9)'; ctx.fillRect(gp + 10 * u, L.wb - 48 * u, 3 * u, 46 * u);
    // 地板和投在地上的窗格亮块：窗上高度 h 的点落到 (x - a·h, fy + c·h)
    ctx.drawImage(s.fl, 0, 0);
    const A = LAND ? .55 : .5, C = LAND ? .42 : .55, proj = (x, y, p = 1) => { const hgt = L.fy - y; return [x - A * hgt * p, y + (L.fy - y + C * hgt) * p]; };
    const quad = (pn, p) => { const [x, y, w, hh] = pn, a = proj(x, y, p), b = proj(x + w, y, p), c = proj(x + w, y + hh, p), d = proj(x, y + hh, p); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); };
    ctx.save(); ctx.beginPath(); ctx.rect(-W, L.fy, W * 3, H * 2); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    for (const pn of s.panes || panes) { quad(pn, 1); ctx.fillStyle = 'rgba(255,196,128,.55)'; ctx.fill(); }
    ctx.restore();
    // 光柱：窗格沿太阳方向一层层平移，加色叠出体积，再乘流动的噪声
    const sc = s.shaft.getContext('2d'); sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, W, H); sc.setTransform(z, 0, 0, z, FX * (1 - z), FY * (1 - z) - ty);
    const _ctx = ctx; { const ctx = sc; for (const pn of panes) for (let i = 1; i <= 40; i++) { const p = i / 41, [x, y, w, hh] = pn, a = proj(x, y, p), b = proj(x + w, y, p), c = proj(x + w, y + hh, p), d = proj(x, y + hh, p); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fillStyle = `rgba(255,214,160,${.026 * (1 - p * .5)})`; ctx.fill(); } }
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalCompositeOperation = 'destination-in'; sc.drawImage(s.nz, -t * 30 * u, -t * 10 * u, W * 1.2, H * 1.2); sc.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.filter = `blur(${4 * u}px)`; ctx.drawImage(s.shaft, 0, 0); ctx.drawImage(s.shaft, 0, 0); ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(z, 0, 0, z, FX * (1 - z), FY * (1 - z) - ty);
    // 窗帘：半透明、被光透亮，下摆随风
    const cx0 = L.wl - fw * .6, cw = L.ww * (LAND ? .13 : .2);
    for (let i = 0; i < 9; i++) {
      const q = i / 8, sway = Math.sin(t * 1.4 + q * 2) * 14 * u * q + 10 * u * Math.sin(t * .9);
      ctx.beginPath(); ctx.moveTo(cx0 + cw * q * .7, L.wt - fw); ctx.quadraticCurveTo(cx0 + cw * q + sway * .4, (L.wt + L.wb) / 2, cx0 + cw * q * 1.1 + sway, L.wb + 30 * u);
      ctx.lineTo(cx0 + cw * (q + .11) * 1.1 + sway, L.wb + 30 * u); ctx.quadraticCurveTo(cx0 + cw * (q + .11) + sway * .4, (L.wt + L.wb) / 2, cx0 + cw * (q + .11) * .7, L.wt - fw); ctx.closePath();
      ctx.fillStyle = i % 2 ? 'rgba(255,246,232,.32)' : 'rgba(225,232,250,.22)'; ctx.fill();
    }
    // 光尘：在光柱里才亮（反解：这一点沿光线往回能不能落进某格窗）
    const inShaft = (X, Y) => { for (let i = 0; i <= 12; i++) { const p = i / 12, den = 1 - (1 + C) * p; if (Math.abs(den) < .05) continue; const y = (Y - (1 + C) * L.fy * p) / den, x = X + A * (L.fy - y) * p; for (const [px, py, w, hh] of panes) if (x > px && x < px + w && y > py && y < py + hh) return true; } return false; };
    ctx.globalCompositeOperation = 'lighter';
    for (const m of s.motes) {
      const x = (m.x + t * 18 * u * m.sp + Math.sin(t * m.sp + m.ph) * 20 * u) % W, y = m.y + Math.sin(t * .7 * m.sp + m.ph * 2) * 30 * u - t * 6 * u;
      const tw = .5 + .5 * Math.sin(t * 5 * m.sp + m.ph), lit = inShaft(x, y) ? 1 : .08; ctx.fillStyle = `rgba(255,236,200,${(.25 + .55 * tw) * lit})`; ctx.beginPath(); ctx.arc(x, y, m.r * (.6 + .4 * tw), 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    drawGirl188(ctx, t, s);
    // ---- 屏幕空间：泛光、光晕、调色 ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const [SX, SY] = M(sx, sy);
    ctx.globalCompositeOperation = 'lighter';
    gr = ctx.createRadialGradient(SX, SY, 0, SX, SY, LONG * .45); gr.addColorStop(0, 'rgba(255,240,200,.55)'); gr.addColorStop(.25, 'rgba(255,200,140,.12)'); gr.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(SX, SY); for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 6 + t * .02); const l = LONG * (.18 + .08 * (i % 2)); const sg = ctx.createLinearGradient(-l, 0, l, 0); sg.addColorStop(0, 'rgba(255,240,210,0)'); sg.addColorStop(.5, 'rgba(255,240,210,.35)'); sg.addColorStop(1, 'rgba(255,240,210,0)'); ctx.fillStyle = sg; ctx.fillRect(-l, -1.2 * u, 2 * l, 2.4 * u); } ctx.restore();
    const CX = W / 2, CY = H / 2;
    [[.35, 30, '120,255,190', .08], [.6, 60, '255,170,90', .06], [1.25, 44, '160,140,255', .06], [1.55, 110, '120,200,255', .035], [1.9, 30, '255,220,120', .06]].forEach(([p, r, c, a]) => {
      const x = SX + (CX - SX) * p, y = SY + (CY - SY) * p, rr = r * u * (1 + .1 * Math.sin(t * 2 + p)), g = ctx.createRadialGradient(x, y, rr * .6, x, y, rr);
      g.addColorStop(0, `rgba(${c},${a * .6})`); g.addColorStop(.85, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
    });
    ctx.globalCompositeOperation = 'overlay';
    gr = ctx.createLinearGradient(W, 0, 0, H); gr.addColorStop(0, 'rgba(255,190,110,.45)'); gr.addColorStop(.5, 'rgba(128,128,128,0)'); gr.addColorStop(1, 'rgba(40,70,160,.55)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    grain(ctx, f, .05); vignette(ctx, .3, .4, '10,15,40');
  }
});

// 逆光的女孩：背对镜头看向窗外。底色是冷色阴影，朝窗的一侧由「形状减去背光方向平移的形状」得到暖色轮廓光
function drawGirl188(ctx, t, s) {
  const { u, L } = s, k = u * (LAND ? 1 : 1.15);
  const ox = LAND ? W * .22 : W * .3, oy = LAND ? H * .44 : H * .47;
  const rim = (p, base, light, d = 7) => { ctx.save(); ctx.clip(p); ctx.fillStyle = light; ctx.fill(p); ctx.translate(-d, d * .45); ctx.fillStyle = base; ctx.fill(p); ctx.restore(); };
  ctx.save(); ctx.translate(ox, oy); ctx.scale(k, k);
  const sway = Math.sin(t * 1.3) * 3;
  // 身体（白衬衫，背光一侧冷灰蓝）
  const body = new Path2D(); body.moveTo(-95, 120); body.bezierCurveTo(-110, 160, -120, 400, -130, 760); body.lineTo(150, 760); body.bezierCurveTo(140, 400, 130, 160, 110, 118); body.bezierCurveTo(60, 92, -40, 90, -95, 120); body.closePath();
  rim(body, '#7d89a8', '#ffe2b4', 9);
  const collar = new Path2D(); collar.moveTo(-70, 104); collar.lineTo(80, 100); collar.lineTo(60, 190); collar.lineTo(10, 210); collar.lineTo(-50, 190); collar.closePath();
  rim(collar, '#1f2a4d', '#ffcf94', 6);
  // 伸向窗框的手臂
  const arm = new Path2D(); arm.moveTo(100, 125); arm.bezierCurveTo(170, 170, 230, 180, 300 + sway, 150); arm.lineTo(305 + sway, 180); arm.bezierCurveTo(230, 215, 160, 215, 108, 200); arm.closePath();
  rim(arm, '#7d89a8', '#ffe2b4', 8);
  const hand = new Path2D(); hand.ellipse(312 + sway, 162, 20, 24, .3, 0, TAU); rim(hand, '#a88583', '#ffd8b0', 6);
  // 脖子、头、头发
  const neck = new Path2D(); neck.moveTo(-14, 40); neck.lineTo(20, 40); neck.lineTo(24, 100); neck.lineTo(-18, 100); neck.closePath(); rim(neck, '#9a7a7c', '#ffcfa6', 6);
  const hair = new Path2D(); hair.moveTo(-80, -10); hair.bezierCurveTo(-90, -110, 80, -130, 92, -20);
  for (let i = 0; i <= 8; i++) { const q = i / 8, x = lerp(92, -84, q), y = 70 + 16 * Math.sin(q * 9) + Math.sin(t * 2.2 + q * 4) * 6 * q; hair.lineTo(x + Math.sin(t * 1.8 + q * 3) * 4, y); }
  hair.closePath(); rim(hair, '#1c2036', '#ffc98a', 7);
  ctx.strokeStyle = 'rgba(140,160,220,.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(4, -10, 70, -2.6, -1.2); ctx.stroke();   // 头发上的一圈冷光
  ctx.strokeStyle = 'rgba(255,230,180,.6)'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const a = .3 + i * .05; ctx.beginPath(); ctx.moveTo(80 + i * 2, -10 + i * 10); ctx.quadraticCurveTo(100 + i * 3 + Math.sin(t * 3 + i) * 4, 20 + i * 12, 96 + i * 4 + Math.sin(t * 2.6 + i) * 6, 60 + i * 9); ctx.stroke(); }
  ctx.restore();
}
