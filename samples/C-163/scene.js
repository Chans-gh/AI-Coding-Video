// C-163 夜色平涂海报：Canvas 2D 先把同一个街角（楼、路灯、硬边几何阴影、只用轮廓线勾出的人）按 19 点、23 点、3 点三套灯光画进三格，格与格之间是弧形接缝；收尾时每格的边界点和楼面上一扇窗的边界点一一对应插值，画面跟着缩放，三格一起收拢成一栋楼上的三扇窗，再盖上琥珀色的灯光。
// 风格提示词：用夜色平涂海报风格：靛蓝夜色里只有窗口和路灯的琥珀色光，阴影是硬边几何色块，人物只用轮廓线勾出，画面被弧形接缝分成几格，同一个街角在不同时刻各占一格，结尾所有格子收拢成一栋楼，每格变成一扇亮灯的窗。
// 题材：平面设计与动态排版 · 适合：城市日常、多线并行故事、温情 MV
scene({
  id: 'C-163', name: '夜色平涂海报', dur: 4, still: 1.8,
  text: '同一个街角',
  fonts: ["900 40px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  draw(ctx, t, s) {
    const u = SHORT / 1080, AMB = '#F5B342', N = 20;
    const MODES = [['19:00', '#2B2F6E', .5], ['23:00', '#1C1F4D', .8], ['03:00', '#10122F', .1]];
    // 街角：在 1000×1000 的设计空间里画，重要内容放中间 600×600
    const corner = (m, tt) => {
      const [lab, sky, lit] = MODES[m];
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 1000, 1000);
      ctx.fillStyle = '#E9E4D0'; ctx.beginPath(); ctx.arc(780, 330, 34, 0, TAU); ctx.fill(); ctx.fillStyle = sky; ctx.beginPath(); ctx.arc(796, 320, 30, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1A1D44'; ctx.fillRect(620, 380, 300, 320);
      ctx.fillStyle = '#262B5E'; ctx.fillRect(0, 700, 1000, 300);
      ctx.fillStyle = '#2E347A'; ctx.fillRect(170, 200, 360, 500);
      ctx.fillStyle = '#23285F'; ctx.fillRect(470, 200, 60, 500);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = hash1(i * 7 + j * 13 + 3) < lit ? AMB : '#161A40'; ctx.fillRect(205 + i * 95, 240 + j * 110, 55, 70); }
      ctx.fillStyle = '#151938'; ctx.beginPath(); ctx.moveTo(530, 700); ctx.lineTo(1000, 700); ctx.lineTo(1000, 860); ctx.lineTo(700, 860); ctx.closePath(); ctx.fill();   // 硬边阴影
      ctx.fillStyle = 'rgba(245,179,66,.22)'; ctx.beginPath(); ctx.moveTo(610, 360); ctx.lineTo(480, 700); ctx.lineTo(740, 700); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(610, 700, 130, 22, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#0E1130'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(650, 700); ctx.lineTo(650, 340); ctx.lineTo(610, 340); ctx.stroke();
      ctx.fillStyle = AMB; ctx.beginPath(); ctx.moveTo(588, 340); ctx.lineTo(632, 340); ctx.lineTo(622, 362); ctx.lineTo(598, 362); ctx.fill();
      // 轮廓线小人
      const man = (x, ph, tilt) => { ctx.save(); ctx.translate(x, 700); ctx.strokeStyle = '#F2E6C4'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const sw = Math.sin(ph) * 16; ctx.beginPath(); ctx.moveTo(-sw - 10, 0); ctx.lineTo(0, -60); ctx.lineTo(sw + 10, 0); ctx.moveTo(0, -60); ctx.lineTo(0, -120); ctx.moveTo(-sw * .8 - 14, -66); ctx.lineTo(0, -112); ctx.lineTo(sw * .8 + 14, -66); ctx.stroke();
        ctx.beginPath(); ctx.arc(tilt, -142, 18, 0, TAU); ctx.stroke(); ctx.restore(); };
      if (m === 0) man(300 + tt * 70, tt * 6, 0);
      if (m === 1) { man(560, 0, 4); man(640, 0, -4); }
      if (m === 2) man(600, 0, 6 * Math.sin(tt * 1.5));
      ctx.fillStyle = '#F2E6C4'; ctx.font = "80px 'Bebas Neue'"; ctx.textAlign = 'center'; ctx.fillText(lab, LAND ? 560 : 800, LAND ? 320 : 470);
    };
    // 三格：弧形接缝；横屏左右分，竖屏上下分
    const bnd = (k, v) => { if (k === 0) return -12; if (k === 3) return (LAND ? W : H) + 12; return (LAND ? W : H) * k / 3 + (k === 1 ? 1 : -1) * 70 * u * Math.sin(Math.PI * v / (LAND ? H : W)); };
    const slice = i => { const P = [], E = LAND ? H : W, pt = (a, b) => LAND ? [a, b] : [b, a];
      for (let j = 0; j < N; j++) { const v = -12 + (E + 24) * j / N; P.push(pt(bnd(i + 1, v), v)); }
      for (let j = 0; j < N; j++) { const v = E + 12 - (E + 24) * j / N; P.push(pt(bnd(i, v), v)); }
      return LAND ? P : P.reverse(); };
    // 楼和窗
    const bx0 = LAND ? W * .5 : W * .14, bx1 = LAND ? W * .9 : W * .86, by0 = LAND ? H * .12 : H * .3, cols = 4, rows = LAND ? 4 : 5;
    const cw = (bx1 - bx0) / cols, ch = ((LAND ? H : H * .95) - by0) / rows, win = (c, r) => [bx0 + c * cw + cw * .2, by0 + r * ch + ch * .18, cw * .6, ch * .6];
    const target = [win(0, 1), win(2, 0), win(1, 2)];
    const rectPoly = ([x, y, w, h]) => { const P = []; for (let j = 0; j < N; j++) P.push([x + w, y + h * j / N]); for (let j = 0; j < N; j++) P.push([x, y + h - h * j / N]); return P; };
    const rectPolyP = ([x, y, w, h]) => { const P = []; for (let j = 0; j < N; j++) P.push([x + w * j / N, y]); for (let j = 0; j < N; j++) P.push([x + w - w * j / N, y + h]); return P; };
    // 背景：夜空和楼（收拢时露出来）
    ctx.fillStyle = '#12153A'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2E347A'; ctx.fillRect(bx0, by0, bx1 - bx0, H - by0); ctx.fillStyle = '#23285F'; ctx.fillRect(bx1 - cw * .25, by0, cw * .25, H - by0);
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) { const [x, y, w, h] = win(c, r); ctx.fillStyle = hash1(c * 11 + r * 5) < .25 ? '#C98A2E' : '#161A40'; ctx.fillRect(x, y, w, h); }
    const tp = clamp(inv(3.2, 3.7, t)); ctx.globalAlpha = tp; ctx.fillStyle = '#F2E6C4'; ctx.font = `900 ${(LAND ? 120 : 110) * u}px 'Noto Sans SC'`; ctx.textAlign = 'center';
    ctx.fillText('同一个街角', LAND ? W * .26 : W / 2, LAND ? H * .55 : H * .17); ctx.globalAlpha = 1;
    const p = eInOutCubic(inv(2.3, 3.2, t));
    for (let i = 0; i < 3; i++) {
      const A = slice(i), B = (LAND ? rectPoly : rectPolyP)(target[i]), Q = A.map((a, j) => [lerp(a[0], B[j][0], p), lerp(a[1], B[j][1], p)]);
      const xs = Q.map(q => q[0]), ys = Q.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      ctx.save(); ctx.beginPath(); Q.forEach((q, j) => j ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath(); ctx.clip();
      const sc = Math.max(x1 - x0, y1 - y0) / (LAND ? 960 : 1000) * (1 + .4 * p);
      ctx.save(); ctx.translate((x0 + x1) / 2, (y0 + y1) / 2); ctx.scale(sc, sc); ctx.translate(-500, LAND ? -500 : -540); corner(i, t); ctx.restore();
      if (p > 0) { ctx.fillStyle = `rgba(245,179,66,${.72 * p * p})`; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
      ctx.restore();
      if (p < 1) { ctx.strokeStyle = '#0A0C24'; ctx.lineWidth = 12 * u * (1 - p); ctx.beginPath(); Q.forEach((q, j) => j ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath(); ctx.stroke(); }
    }
  }
});
