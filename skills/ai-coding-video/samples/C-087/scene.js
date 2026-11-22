// C-087 多画风穿越：同一个原创角色（黄雨衣、红背包、蓝雨靴的小孩）以同样的剪影和配色依次走过四个世界，每个世界用不同的画法：暖色街景用 lib 的 paintMap + strokePlan 铺成油画短笔，动漫街道是平涂色块加黑描边和两档硬阴影，黏土村庄是带径向渐变高光、指纹噪点、按一拍二抖动的圆胖形状，像素世界整幅先画在 1/12 大小的画布上再关掉平滑放大；角色也由同一套姿势分别用这四种画法画；世界之间的分界线从右往左扫过画面，分界两侧用裁剪各画各的世界，扫过角色时她半边是旧画风、半边是新画风，画风切换本身就是转场。
// 风格提示词：让同一个角色依次穿越多种画风世界（如暖色写实城市→动漫东京→黏土村庄→像素世界）：角色的外形、配色和剪影在每个世界保持不变，只改变线条、填色、纹理和着色方式，镜头贴近角色视线高度，每次画风切换本身就是转场。
// 题材：卡通与动漫 · 适合：品牌 IP 角色、年度回顾、炫技短片；需要先给角色设定图
const SW = [1.05, 2.3, 3.55];    // 三次切换开始的时刻，每次扫过画面 0.7 秒
scene({
  id: 'C-087', name: '多画风穿越', dur: 5, still: 2.6,
  fonts: ["900 56px 'Noto Sans SC'", "700 28px 'JetBrains Mono'"],
  init() {
    const u = SHORT / 1080, gy = LAND ? H * .8 : H * .7;
    // 世界 0：暖色油画街景（静态，一次画好）
    const M = paintMap(g => {
      const sk = g.createLinearGradient(0, 0, 0, gy); sk.addColorStop(0, '#f2a65a'); sk.addColorStop(.6, '#f7d08a'); sk.addColorStop(1, '#f4e2b8');
      g.fillStyle = sk; g.fillRect(0, 0, W, gy);
      g.fillStyle = '#fff1c8'; g.beginPath(); g.arc(W * .7, gy * .45, SHORT * .08, 0, TAU); g.fill();
      const R = mulberry32(3);
      for (let x = -40; x < W + 80;) { const w = (140 + R() * 160) * u, h = (LAND ? .3 : .25) * H + R() * H * .25; g.fillStyle = ['#b8643a', '#9a4e34', '#c87a48', '#8a5a44'][Math.floor(R() * 4)]; g.fillRect(x, gy - h, w, h);
        g.fillStyle = '#ffd890'; for (let wy = gy - h + 30 * u; wy < gy - 60 * u; wy += 70 * u) for (let wx = x + 20 * u; wx < x + w - 40 * u; wx += 50 * u) if (R() < .5) g.fillRect(wx, wy, 22 * u, 30 * u);
        x += w + 6 * u; }
      g.fillStyle = '#7a5a48'; g.fillRect(0, gy, W, H - gy); g.fillStyle = '#a07a5a'; g.fillRect(0, gy, W, 14 * u);
    }, { res: 4, blur: 3 });
    const F = flowField({ res: 16, noise: .5, scale: .004, map: M, contour: .4 });
    const S = strokePlan(M, F, { gap: 14 * u, len: [18 * u, 34 * u], width: [9 * u, 14 * u], jitter: .12, spread: .3, layers: 2, detail: .05, seed: 7 });
    const paint = mk(W, H); drawStrokes(paint.getContext('2d'), S, 1, { style: 'impasto' });
    // 黏土纹理：指纹和颗粒
    const clayTex = mk(512, 512), ct = clayTex.getContext('2d'), cim = ct.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { const k = (y * 512 + x) * 4, v = 128 + 40 * (fbm(x / 20, y / 20, 3) - .5) + 30 * Math.sin(Math.hypot(x - 200, y - 260) * .5) * smooth(80, 0, Math.hypot(x - 200, y - 260)); cim.data[k] = cim.data[k + 1] = cim.data[k + 2] = v; cim.data[k + 3] = 40; }
    ct.putImageData(cim, 0, 0);
    const px = mk(Math.round(W / 12), Math.round(H / 12));
    const tmp = mk(W, H);
    return { gy, paint, clayTex, px, tmp };
  },
  draw(ctx, t, s, f) {
    const { gy, paint, clayTex, px, tmp } = s, u = SHORT / 1080;
    const cx = LAND ? W * .42 : W * .45, sc = (LAND ? 1.45 : 1.6) * u;
    const walk = t * 8.5, scroll = t * 260 * u;
    // 分界线位置：第 k 次切换时从右边扫到左边
    const edge = k => W * (1.08 - 1.16 * eInOutCubic(clamp((t - SW[k]) / .7)));
    // 画第 w 个世界（全屏），再叠角色
    const world = (g, w) => {
      g.save();
      if (w === 0) { g.drawImage(paint, -scroll * .15 % 60, 0, W * 1.05, H); }
      if (w === 1) anime(g); if (w === 2) clay(g); if (w === 3) pixel(g);
      g.restore();
      if (w !== 3) kid(g, w, cx, gy, sc);
    };
    const anime = g => {
      const sk = g.createLinearGradient(0, 0, 0, gy); sk.addColorStop(0, '#3a8ef0'); sk.addColorStop(1, '#bfe4ff'); g.fillStyle = sk; g.fillRect(0, 0, W, gy);
      g.fillStyle = '#fff'; g.strokeStyle = '#2a3a5a'; g.lineWidth = 3 * u;
      for (let i = 0; i < 3; i++) { const x = ((i * 700 - scroll * .2) % (W + 600) + W + 600) % (W + 600) - 300, y = gy * (.18 + i * .12); g.beginPath(); [[0, 0, 70], [70, -30, 90], [160, 0, 70], [80, 20, 60]].forEach(([dx, dy, r]) => g.arc(x + dx * u, y + dy * u, r * u, 0, TAU)); g.fill(); }
      const R = mulberry32(11); let x = -((scroll * .6) % (2000 * u));
      while (x < W + 200) { const w = (160 + R() * 140) * u, h = H * (.2 + R() * .35), c = ['#f4e8d8', '#e8eef6', '#f8dcd0', '#dfeadf'][Math.floor(R() * 4)];
        g.fillStyle = c; g.fillRect(x, gy - h, w, h); g.fillStyle = 'rgba(40,60,110,.18)'; g.fillRect(x + w * .72, gy - h, w * .28, h);
        g.fillStyle = '#9cc8ea'; for (let wy = gy - h + 24 * u; wy < gy - 50 * u; wy += 60 * u) g.fillRect(x + 18 * u, wy, w * .5, 28 * u);
        g.strokeRect(x, gy - h, w, h); if (R() < .5) { g.fillStyle = ['#e84a5a', '#3a6ad0'][Math.floor(R() * 2)]; g.fillRect(x + 10 * u, gy - h * .45, w * .5, 40 * u); g.strokeRect(x + 10 * u, gy - h * .45, w * .5, 40 * u); }
        x += w + 4 * u; }
      g.fillStyle = '#7a7a8a'; g.fillRect(0, gy, W, H - gy); g.fillStyle = '#fff'; for (let i = 0; i < 12; i++) g.fillRect(((i * 220 * u - scroll) % (W + 200 * u) + W + 200 * u) % (W + 200 * u) - 100 * u, gy + (H - gy) * .5, 110 * u, 10 * u);
      g.strokeStyle = '#2a3a5a'; g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
      // 电线
      g.lineWidth = 2 * u; g.beginPath(); for (let k = 0; k < 2; k++) { g.moveTo(0, gy * (.12 + k * .05)); g.quadraticCurveTo(W / 2, gy * (.22 + k * .05), W, gy * (.1 + k * .05)); } g.stroke();
    };
    const blob = (g, x, y, rx, ry, col, hl = true) => {
      const gr = g.createRadialGradient(x - rx * .35, y - ry * .4, 0, x, y, Math.max(rx, ry) * 1.2);
      const c = hex2rgb(col); gr.addColorStop(0, rgba(c.map(v => Math.min(255, v + 60)), 1)); gr.addColorStop(.6, col); gr.addColorStop(1, rgba(c.map(v => v * .55), 1));
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
      if (hl) { g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(x - rx * .35, y - ry * .45, rx * .25, ry * .15, -.5, 0, TAU); g.fill(); }
    };
    const clay = g => {
      const ts = stepT(t, 12), j = (i) => (hash2(i, Math.floor(ts * 12)) - .5) * 3 * u;
      const sk = g.createLinearGradient(0, 0, 0, gy); sk.addColorStop(0, '#a8d8e8'); sk.addColorStop(1, '#e8f0d8'); g.fillStyle = sk; g.fillRect(0, 0, W, gy);
      for (let i = 0; i < 3; i++) blob(g, ((i * 600 - scroll * .2) % (W + 400) + W + 400) % (W + 400) - 200, gy * (.2 + i * .1), 110 * u, 50 * u, '#f8f8f4');
      for (let i = 0; i < 4; i++) blob(g, W * (i * .33) + j(i), gy + 40 * u, W * .26, H * .2, '#7ab05a', false);
      const R = mulberry32(21); let x = -((scroll * .7) % (1800 * u)) - 100 * u;
      while (x < W + 300) {
        const w = (180 + R() * 100) * u, h = (150 + R() * 120) * u, k = Math.floor(R() * 99);
        blob(g, x + w / 2 + j(k), gy - h / 2, w / 2, h / 2, ['#e8c890', '#f0a080', '#d8b0e0'][k % 3]);
        g.fillStyle = '#c85a3a'; g.beginPath(); g.moveTo(x - 20 * u, gy - h * .8); g.quadraticCurveTo(x + w / 2, gy - h * 1.45, x + w + 20 * u, gy - h * .8); g.fill();
        blob(g, x + w / 2 + j(k + 1), gy - h * .25, 26 * u, 40 * u, '#8a5a3a', false);
        if (R() < .7) { blob(g, x + w + 60 * u + j(k + 2), gy - 130 * u, 60 * u, 70 * u, '#5aa04a'); g.fillStyle = '#8a5a3a'; g.fillRect(x + w + 52 * u, gy - 70 * u, 16 * u, 70 * u); }
        x += w + 160 * u;
      }
      g.fillStyle = '#c8a070'; g.fillRect(0, gy, W, H - gy); blob(g, W / 2, gy + 10 * u, W * .7, 26 * u, '#d8b080', false);
      g.save(); g.globalCompositeOperation = 'overlay'; g.fillStyle = g.createPattern(clayTex, 'repeat'); g.fillRect(0, 0, W, H); g.restore();
    };
    const pixel = g => {
      const p = px.getContext('2d'), pw = px.width, ph = px.height, k = pw / W, py = Math.round(gy * k);
      p.imageSmoothingEnabled = false;
      p.fillStyle = '#5a3a8a'; p.fillRect(0, 0, pw, py * .4); p.fillStyle = '#8a4a9a'; p.fillRect(0, py * .4, pw, py * .3); p.fillStyle = '#e86a8a'; p.fillRect(0, py * .7, pw, py * .3);
      p.fillStyle = '#ffe08a'; p.fillRect(Math.round(pw * .72), Math.round(py * .3), 6, 6);
      const R = mulberry32(31); let x = -Math.round((scroll * k * .5) % 200);
      while (x < pw + 20) { const w = 6 + Math.floor(R() * 6), h = 8 + Math.floor(R() * 14); p.fillStyle = '#2a1a4a'; p.fillRect(x, py - h, w, h); p.fillStyle = '#ffd04a'; for (let yy = py - h + 2; yy < py - 2; yy += 3) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (R() < .35) p.fillRect(xx, yy, 1, 1); x += w + 1; }
      p.fillStyle = '#3a8a3a'; p.fillRect(0, py, pw, ph - py); p.fillStyle = '#8a5a2a';
      for (let i = 0; i < pw; i += 4) p.fillRect(i - Math.round(scroll * k) % 4, py + 2, 2, 1);
      p.fillStyle = '#6ac04a'; p.fillRect(0, py, pw, 1);
      kid(p, 3, Math.round(cx * k), py, sc * k);
      // 金币
      for (let i = 0; i < 5; i++) { const cxp = Math.round(((i * 30 - scroll * k * .9) % (pw + 30) + pw + 30) % (pw + 30)) - 10; p.fillStyle = (Math.floor(t * 8) + i) % 2 ? '#ffd04a' : '#ffa020'; p.fillRect(cxp, py - 14, 2, 3); }
      g.imageSmoothingEnabled = false; g.drawImage(px, 0, 0, W, H); g.imageSmoothingEnabled = true;
    };
    // 角色：同一套姿势，四种画法
    const kid = (g, w, x, y, k) => {
      const ph = walk, sw = Math.sin(ph), lift = Math.abs(Math.cos(ph)) * 6 * k;
      const P = {   // 关键点（相对脚底中心，朝右走）
        head: [6, -232], body: [[-38, -170], [44, -170], [56, -62], [-50, -62]], hood: [2, -238],
        pack: [-58, -150, 40, 70], legL: [-14, -62, -14 + sw * 30, -6], legR: [16, -62, 16 - sw * 30, -6],
        arm: [30, -150, 30 + sw * -34, -96],
      };
      const X = v => x + v * k, Y = v => y - lift + v * k;
      const C = { coat: '#f6c830', coatD: '#d89a18', pack: '#e0403a', packD: '#a82a28', boot: '#2a6ad0', skin: '#f6d2b0', line: '#2a2030' };
      if (w === 3) {   // 像素：直接按格子填
        const R2 = (a, b, c2, d, col) => { g.fillStyle = col; g.fillRect(Math.round(X(a)), Math.round(Y(b)), Math.max(1, Math.round(c2 * k)), Math.max(1, Math.round(d * k))); };
        R2(P.legL[2] - 12, -60, 22, 60, C.boot); R2(P.legR[2] - 12, -60, 22, 60, C.boot);
        R2(-44, -175, 96, 115, C.coat); R2(-78, -160, 40, 76, C.pack); R2(-40, -280, 92, 86, C.coat); R2(-14, -252, 56, 50, C.skin); R2(28, -236, 10, 10, C.line);
        R2(24 + sw * -24, -150, 22, 56, C.coatD);
        return;
      }
      g.save(); g.lineJoin = g.lineCap = 'round';
      const ol = w === 1 ? 5 * k : 0;
      const leg = ([a, b, c2, d]) => { g.strokeStyle = C.boot; g.lineWidth = 24 * k; g.beginPath(); g.moveTo(X(a), Y(b)); g.lineTo(X(c2), Y(d)); g.stroke(); };
      const shape = (pts, col, dark) => {
        g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(X(a), Y(b)) : g.moveTo(X(a), Y(b))); g.closePath();
        if (w === 2) { const [a0, b0] = pts[0]; const gr = g.createLinearGradient(X(a0), Y(b0), X(a0 + 80), Y(b0 + 100)); gr.addColorStop(0, rgba(hex2rgb(col).map(v => Math.min(255, v + 50)), 1)); gr.addColorStop(1, dark); g.fillStyle = gr; } else g.fillStyle = col;
        g.fill(); if (ol) { g.strokeStyle = C.line; g.lineWidth = ol; g.stroke(); }
        if (w === 2) { g.strokeStyle = g.fillStyle; g.lineWidth = 16 * k; g.stroke(); g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(X(pts[0][0] + 22), Y(pts[0][1] + 24), 12 * k, 30 * k, .3, 0, TAU); g.fill(); g.restore(); }
        if (w === 1) { g.save(); g.clip(); g.fillStyle = dark; g.fillRect(X(-80), Y(-300), 40 * k, 300 * k); g.restore(); if (ol) { g.strokeStyle = C.line; g.lineWidth = ol; g.stroke(); } }
      };
      if (w === 1) { g.strokeStyle = C.line; g.lineWidth = 24 * k + ol * 2; for (const L of [P.legL, P.legR]) { g.beginPath(); g.moveTo(X(L[0]), Y(L[1])); g.lineTo(X(L[2]), Y(L[3])); g.stroke(); } }
      leg(P.legL); leg(P.legR);
      // 背包
      const [bx, by, bw, bh] = P.pack;
      shape([[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]], C.pack, C.packD);
      // 雨衣
      shape(P.body, C.coat, C.coatD);
      // 头：帽兜 + 脸
      if (w === 2) { blob(g, X(P.hood[0]), Y(P.hood[1]), 50 * k, 50 * k, C.coat); blob(g, X(18), Y(-226), 30 * k, 30 * k, C.skin, false); }
      else {
        g.fillStyle = C.coat; g.beginPath(); g.arc(X(P.hood[0]), Y(P.hood[1]), 50 * k, 0, TAU); g.fill(); if (ol) { g.strokeStyle = C.line; g.lineWidth = ol; g.stroke(); }
        g.fillStyle = C.skin; g.beginPath(); g.arc(X(18), Y(-226), 30 * k, 0, TAU); g.fill(); if (ol) { g.lineWidth = ol * .7; g.stroke(); }
      }
      g.fillStyle = C.line; g.beginPath(); g.arc(X(32), Y(-232), 5 * k, 0, TAU); g.fill();
      // 手臂
      g.strokeStyle = w === 1 ? C.line : C.coatD; g.lineWidth = (w === 1 ? 26 : 20) * k; g.beginPath(); g.moveTo(X(P.arm[0]), Y(P.arm[1])); g.lineTo(X(P.arm[2]), Y(P.arm[3])); g.stroke();
      if (w === 1) { g.strokeStyle = C.coat; g.lineWidth = 18 * k; g.stroke(); }
      if (w === 0) {   // 油画：身上压几笔亮色和暗色短笔
        const R = mulberry32(5);
        for (let i = 0; i < 26; i++) { const a = -40 + R() * 90, b = -280 + R() * 220; g.strokeStyle = R() < .5 ? 'rgba(255,240,180,.5)' : 'rgba(150,90,30,.35)'; g.lineWidth = 8 * k; g.beginPath(); g.moveTo(X(a), Y(b)); g.lineTo(X(a + 14), Y(b + 6)); g.stroke(); }
      }
      g.restore();
    };
    // 当前在哪两个世界之间
    let cur = 0; for (let k = 0; k < 3; k++) if (t >= SW[k]) cur = k + 1;
    const from = cur - 1;
    if (cur === 0) world(ctx, 0);
    else {
      const ex = edge(cur - 1);
      world(ctx, from);
      const g = tmp.getContext('2d'); g.clearRect(0, 0, W, H); world(g, cur);
      ctx.save(); ctx.beginPath(); ctx.rect(ex, 0, W - ex + 2, H); ctx.clip(); ctx.drawImage(tmp, 0, 0); ctx.restore();
      if (ex > 0 && ex < W) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(ex - 3 * u, 0, 6 * u, H); const gl = ctx.createLinearGradient(ex - 60 * u, 0, ex + 60 * u, 0); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.5, 'rgba(255,255,255,.35)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(ex - 60 * u, 0, 120 * u, H); }
    }
    // 左上角的世界名
    const names = ['暖色街景', '动漫街道', '黏土村庄', '像素世界'];
    const k2 = cur === 0 ? smooth(.1, .4, t) : smooth(SW[cur - 1] + .4, SW[cur - 1] + .7, t);
    ctx.globalAlpha = k2; ctx.font = `900 ${Math.round(56 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
    const tx = 60 * u, ty = (LAND ? 110 : 200) * u;
    ctx.lineWidth = 10 * u; ctx.strokeStyle = 'rgba(20,16,30,.8)'; ctx.strokeText(names[cur], tx, ty); ctx.fillStyle = '#fff'; ctx.fillText(names[cur], tx, ty);
    ctx.font = `700 ${Math.round(28 * u)}px 'JetBrains Mono'`; ctx.lineWidth = 6 * u; ctx.strokeText(`WORLD ${cur + 1} / 4`, tx, ty + 46 * u); ctx.fillText(`WORLD ${cur + 1} / 4`, tx, ty + 46 * u);
    ctx.globalAlpha = 1;
  }
});
