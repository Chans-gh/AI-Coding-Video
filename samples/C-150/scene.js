// C-150 敦煌壁画：init 里在土红干泥壁上用石青、石绿、白和赭画出锯齿小山、被风吹弯的树和流云，叠 weathering 做褪色和剥落斑块，备好两面壁画；每帧飞天按 t 横向飞过，长飘带是沿正弦起伏的变宽带子，人物用流畅的深色长线勾边；2.6 秒起整面画切成不规则碎块，从中间往外一块块剥落、翻转掉下，露出下面的新画。
// 风格提示词：用敦煌壁画风格：土红色干泥壁作底，矿物色只有石青、石绿、白和赭，颜色褪淡、背景有剥落斑块，人物和走兽用流畅的长线勾出，飞天横向飞过、长飘带在身后起伏，锯齿形小山和被风吹弯的叶片点缀画面，转场是旧画面剥落掉下露出新画，配琵琶。
// 题材：东方传统 · 适合：佛教与丝路故事、文博科普、东方奇幻
scene({
  id: 'C-150', name: '敦煌壁画', dur: 5, still: 1.6,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    const C = { red: '#9A4630', red2: '#7E3424', blue: '#3F8296', green: '#5E9C7E', white: '#EDE2CC', ochre: '#C08A4A', line: '#3A1E16', skin: '#E2BC94', dark: '#5A3A30' };
    function mural(seed, bg, alt) {
      const c = mk(W, H), g = c.getContext('2d'), R = mulberry32(seed);
      g.drawImage(makePaper(bg, { grain: 10, fiber: .15, blot: 30, seed }), 0, 0, W, H);
      g.lineJoin = 'round'; g.lineCap = 'round';
      // 流云：带尾巴的卷
      const cloud = (x, y, s, col) => { g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.strokeStyle = C.line; g.lineWidth = 1.6 / s * u;
        g.beginPath(); g.moveTo(-120, 10); g.bezierCurveTo(-60, 20, -30, 10, 0, 0); for (let a = 0; a < 5.6; a += .2) g.lineTo(Math.cos(a + Math.PI) * (26 - a * 3.6) + 20, Math.sin(a + Math.PI) * (26 - a * 3.6) - 6);
        g.bezierCurveTo(30, 30, -40, 30, -120, 10); g.fill(); g.stroke();
        g.beginPath(); g.arc(42, -12, 16, 0, TAU); g.fill(); g.stroke(); g.restore(); };
      // 锯齿小山：几排三角，石青石绿相间，白线勾边，山顶点苔
      const hills = (y0, rows) => { for (let r = 0; r < rows; r++) { const y = y0 + r * 46 * u, n = Math.ceil(W / (90 * u)) + 2;
        for (let i = -1; i < n; i++) { const x = i * 90 * u + (r % 2) * 45 * u + (R() - .5) * 20 * u, h = (60 + R() * 70) * u, w = (70 + R() * 50) * u;
          g.fillStyle = (i + r) % 3 === 0 ? C.blue : (i + r) % 3 === 1 ? C.green : C.ochre;
          g.beginPath(); g.moveTo(x - w, y + 40 * u); g.lineTo(x - w * .3, y - h * .6); g.lineTo(x - w * .1, y - h * .5); g.lineTo(x, y - h); g.lineTo(x + w * .2, y - h * .7); g.lineTo(x + w, y + 40 * u); g.closePath(); g.fill();
          g.strokeStyle = C.white; g.lineWidth = 2.4 * u; g.stroke(); g.fillStyle = C.line; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + (k - 1) * 8 * u, y - h + 14 * u + k % 2 * 6 * u, 2.4 * u, 0, TAU); g.fill(); } } } };
      // 被风吹弯的树
      const tree = (x, y, h, dir) => { g.strokeStyle = C.line; g.lineWidth = 5 * u; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dir * h * .2, y - h * .5, x + dir * h * .1, y - h); g.stroke();
        for (let i = 0; i < 14; i++) { const q = .3 + i / 14 * .7, bx = x + dir * h * .2 * Math.sin(q * Math.PI) * .9, by = y - h * q, L = (40 + R() * 40) * u * (1.2 - q * .5);
          g.fillStyle = i % 3 ? C.green : C.blue; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + dir * L * .6, by - L * .5, bx + dir * L * 1.2, by + L * .2); g.quadraticCurveTo(bx + dir * L * .5, by - L * .1, bx, by); g.fill(); g.strokeStyle = C.line; g.lineWidth = 1.4 * u; g.stroke(); } };
      const gy = LAND ? H * .78 : H * .8;
      for (let i = 0; i < (LAND ? 7 : 6); i++) { const x = W * (.08 + R() * .84), y = H * (.08 + R() * (LAND ? .4 : .55)); cloud(x, y, (.9 + R() * .9) * u * (LAND ? 1.2 : 1.1), i % 2 ? C.green : C.white); }
      // 天花：散落的小花
      for (let i = 0; i < 30; i++) { const x = R() * W, y = R() * gy * .9; g.fillStyle = i % 2 ? C.white : C.blue; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + Math.cos(k * TAU / 4) * 5 * u, y + Math.sin(k * TAU / 4) * 5 * u, 4 * u, 2.4 * u, k * TAU / 4, 0, TAU); g.fill(); } g.fillStyle = C.red2; g.beginPath(); g.arc(x, y, 2 * u, 0, TAU); g.fill(); }
      hills(gy, Math.ceil((H - gy) / (46 * u)) + 1);
      tree(alt ? W * .82 : W * .14, gy + 20 * u, (LAND ? 300 : 360) * u, alt ? -1 : 1); tree(alt ? W * .2 : W * .9, gy + 40 * u, (LAND ? 220 : 260) * u, alt ? 1 : -1);
      if (alt) { // 一头鹿在山前走
        const x = W * .5, y = gy + 96 * u, k = (LAND ? 1.3 : 1.5) * u; g.save(); g.translate(x, y); g.scale(k, k); g.fillStyle = C.white; g.strokeStyle = C.line; g.lineWidth = 2;
        g.beginPath(); g.ellipse(0, -60, 50, 20, 0, 0, TAU); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(36, -70); g.quadraticCurveTo(50, -100, 60, -118); g.lineTo(76, -112); g.lineTo(70, -102); g.quadraticCurveTo(58, -88, 50, -58); g.fill(); g.stroke();
        for (const [a, b] of [[-36, 1], [-24, -1], [30, 1], [40, -1]]) { g.beginPath(); g.moveTo(a, -48); g.lineTo(a + b * 10, -24); g.lineTo(a + b * 4, 0); g.lineWidth = 6; g.stroke(); g.strokeStyle = C.white; g.lineWidth = 3.5; g.stroke(); g.strokeStyle = C.line; g.lineWidth = 2; }
        g.beginPath(); g.moveTo(62, -116); g.quadraticCurveTo(56, -140, 44, -150); g.moveTo(58, -128); g.lineTo(70, -142); g.moveTo(66, -118); g.quadraticCurveTo(76, -140, 90, -146); g.stroke();
        g.fillStyle = C.red2; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-30 + i * 12, -64 + (i % 2) * 8, 4, 0, TAU); g.fill(); }
        g.restore(); }
      // 褪色和剥落
      g.fillStyle = 'rgba(230,200,170,.16)'; g.fillRect(0, 0, W, H);
      g.drawImage(weathering({ flake: .08, flakeColor: '#D8BC98', stain: .35, stainColor: '#5A2A1A', cracks: 10, seed: seed + 2 }), 0, 0, W, H);
      return c;
    }
    const A = mural(3, C.red, false), B = mural(9, '#5E8E78', true);
    // 碎块：抖动网格，角点共用
    const cs = 110 * u, nx = Math.ceil(W / cs) + 1, ny = Math.ceil(H / cs) + 1, R = mulberry32(21), P = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) P.push([i * cs + (i && i < nx ? (R() - .5) * cs * .6 : 0), j * cs + (j && j < ny ? (R() - .5) * cs * .6 : 0)]);
    const pc = [], ox = W * .5, oy = H * .45;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const q = [P[j * (nx + 1) + i], P[j * (nx + 1) + i + 1], P[(j + 1) * (nx + 1) + i + 1], P[(j + 1) * (nx + 1) + i]];
      const cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4;
      pc.push({ q, cx, cy, t0: 2.5 + Math.hypot(cx - ox, (cy - oy) * 1.2) / LONG * 1.3 + R() * .25, vx: (R() - .5) * 120 * u, vr: (R() - .5) * 3, sk: .7 + R() * .3 }); }
    return { u, A, B, C, pc, tmp: mk(W, H) };
  },
  draw(ctx, t, s) {
    const { u, C } = s;
    // 飞天：身子横着飞，飘带在身后起伏
    const apsara = (g, x, y, k, dir, ph, col) => {
      // 飘带：两条，越往后越宽、起伏越大
      const ribbon = (len, amp, off, c1) => { const n = 40, up = [], dn = [];
        for (let i = 0; i <= n; i++) { const q = i / n, xx = -q * len, yy = Math.sin(q * 5 - t * 3.2 + ph + off) * amp * q + off * 12 - q * 20, w = 3 + q * 6;
          const q2 = Math.min(1, q + .02), dx = -len * .02, dy = Math.sin(q2 * 5 - t * 3.2 + ph + off) * amp * q2 - yy + off * 12 - q2 * 20, l = Math.hypot(dx, dy) || 1;
          up.push([xx - dy / l * w, yy + dx / l * w]); dn.push([xx + dy / l * w, yy - dx / l * w]); }
        g.beginPath(); up.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); dn.reverse().forEach(([a, b]) => g.lineTo(a, b)); g.closePath();
        g.fillStyle = c1; g.fill(); g.strokeStyle = C.line; g.lineWidth = 1.3; g.stroke(); };
      g.save(); g.translate(x, y); g.scale(k * dir, k); g.lineJoin = 'round'; g.lineCap = 'round';
      ribbon(330, 46, 0, col[0]); ribbon(260, 36, 2.2, col[1]);
      // 裙和腿：往后上方甩
      g.fillStyle = col[2]; g.strokeStyle = C.line; g.lineWidth = 1.8;
      g.beginPath(); g.moveTo(-6, -4); g.bezierCurveTo(-40, 8, -80, 0, -116, -26 + Math.sin(t * 2 + ph) * 4); g.lineTo(-104, -6); g.bezierCurveTo(-80, 18, -40, 26, 0, 14); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = C.skin; g.beginPath(); g.ellipse(-120, -22, 9, 5, -.5, 0, TAU); g.fill(); g.stroke();                       // 脚
      g.strokeStyle = C.line; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-14 - i * 6, 4 + i * 2); g.bezierCurveTo(-50, 12, -80, 4, -108, -16 + i * 4); g.stroke(); }
      // 身子
      g.fillStyle = C.skin; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-6, 12); g.bezierCurveTo(-8, -10, 8, -28, 26, -34); g.lineTo(34, -22); g.bezierCurveTo(20, -14, 10, 0, 6, 14); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = col[1]; g.beginPath(); g.moveTo(6, -14); g.bezierCurveTo(14, -24, 24, -30, 30, -28); g.lineTo(32, -22); g.bezierCurveTo(22, -18, 14, -10, 8, -4); g.fill(); g.stroke();   // 披巾
      // 手：一只往前托花，一只往后
      g.strokeStyle = C.line; g.lineWidth = 7; g.beginPath(); g.moveTo(26, -30); g.quadraticCurveTo(48, -40, 66, -52); g.stroke(); g.strokeStyle = C.skin; g.lineWidth = 4.6; g.stroke();
      g.strokeStyle = C.line; g.lineWidth = 7; g.beginPath(); g.moveTo(22, -26); g.quadraticCurveTo(4, -40, -14, -36); g.stroke(); g.strokeStyle = C.skin; g.lineWidth = 4.6; g.stroke();
      g.fillStyle = C.white; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .5; g.beginPath(); g.ellipse(70 + Math.cos(a) * 7, -58 + Math.sin(a) * 7, 6, 3, a, 0, TAU); g.fill(); g.strokeStyle = C.line; g.lineWidth = 1; g.stroke(); }
      g.fillStyle = C.red2; g.beginPath(); g.arc(70, -56, 3, 0, TAU); g.fill();
      // 头：发髻、脸
      g.fillStyle = C.skin; g.strokeStyle = C.line; g.lineWidth = 1.8; g.beginPath(); g.ellipse(40, -44, 11, 13, .3, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = C.line; g.beginPath(); g.ellipse(36, -55, 12, 6, .3, Math.PI, TAU); g.fill(); g.beginPath(); g.arc(32, -64, 6, 0, TAU); g.fill();
      g.lineWidth = 1; g.beginPath(); g.moveTo(44, -46); g.quadraticCurveTo(48, -47, 50, -45); g.stroke(); g.beginPath(); g.moveTo(46, -38); g.lineTo(49, -38); g.strokeStyle = C.red2; g.stroke();
      g.restore(); };
    const flyers = (g, set, lt) => {
      if (set === 0) { apsara(g, (LAND ? W * .05 : -W * .05) + lt * W * (LAND ? .14 : .16), LAND ? H * .3 : H * .26, (LAND ? 3.2 : 2.7) * u, 1, 0, [C.green, C.blue, C.white]);
        apsara(g, (LAND ? W * .45 : W * .4) + lt * W * .12, (LAND ? H * .56 : H * .52) + Math.sin(lt * 1.5) * 10 * u, (LAND ? 2.4 : 2.2) * u, 1, 1.7, [C.blue, C.white, C.green]); }
      else { apsara(g, W * (LAND ? .95 : 1.05) - lt * W * .16, LAND ? H * .3 : H * .3, (LAND ? 3 : 2.6) * u, -1, .6, [C.white, C.red, C.blue]); }
    };
    // 底下的新画
    ctx.drawImage(s.B, 0, 0); flyers(ctx, 1, Math.max(0, t - 2.5));
    if (t > 4.6) return;
    // 上面的旧画：合成一张，再按碎块剥落
    const g = s.tmp.getContext('2d'); g.drawImage(s.A, 0, 0); flyers(g, 0, t);
    if (t < 2.5) { ctx.drawImage(s.tmp, 0, 0); return; }
    for (const p of s.pc) {
      const dt = t - p.t0, path = c => { c.beginPath(); p.q.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); };
      if (dt > 1.4) continue;
      ctx.save();
      if (dt > 0) { const fy = 1400 * u * dt * dt, sc = 1 - dt * .25; ctx.translate(p.cx + p.vx * dt, p.cy + fy); ctx.rotate(p.vr * dt); ctx.scale(sc, sc * Math.cos(dt * p.vr * .8)); ctx.translate(-p.cx, -p.cy); }
      path(ctx); ctx.clip(); ctx.drawImage(s.tmp, 0, 0);
      const pre = smooth(-.25, 0, dt); if (pre > 0) { ctx.strokeStyle = `rgba(40,16,8,${.6 * pre})`; ctx.lineWidth = 3 * u; path(ctx); ctx.stroke(); }   // 剥落前先裂
      if (dt > 0) { ctx.fillStyle = `rgba(30,12,6,${Math.min(.5, dt * .6)})`; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
    }
  }
});
