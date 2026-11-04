// C-004 油画厚涂：画面铺满几千个圆角短笔触，每笔画一层暗边、一层本色、一道高光做出颜料的厚度；
// 天空笔触沿噪声流场和两个漩涡转向，太阳的笔触绕圈。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-004', name: '油画厚涂', dur: 3, still: 2.4,
  fonts: [],
  init() {
    // 构图：竖屏铺满全幅（原版只画中段），树在左、太阳在右上；横屏铺满全幅，地平线压低，漩涡移到画面中间
    const P = LAND ? { y0: -10, y1: H + 10, tx: 380, tt: 230, tb: 1010, tk: .2, sun: [1420, 300], hz: 640, sw: [880, 360] }
                   : { y0: -10, y1: H + 10, tx: 210, tt: 620, tb: 1500, tk: .17, sun: [760, 560], hz: 1050, sw: [480, 700] };
    const R = mulberry32(31), st = [], sp = 17;
    const pick = (a) => a[Math.floor(R() * a.length)];
    for (let y = P.y0; y < P.y1; y += sp) for (let x = -20; x < W + 20; x += sp) {
      const px = x + (R() - .5) * sp, py = y + (R() - .5) * sp;
      let region, col;
      const inTree = Math.abs(px - P.tx - (py - P.tt - 30) * .02) < (py - P.tt) * P.tk && py > P.tt && py < P.tb;
      const dsun = Math.hypot(px - P.sun[0], py - P.sun[1]);
      if (inTree) { region = 2; col = pick(['#1C3526', '#27472F', '#355C3A', '#1A2A22', '#3E6B45']); }
      else if (dsun < 95) { region = 3; col = pick(['#F6D65A', '#F2C23A', '#FBE68C', '#E8A92E']); }
      else if (py < P.hz) { region = 0; col = dsun < 190 ? pick(['#F2D36B', '#9CC0D8', '#E8C35A']) : pick(['#1F3D7A', '#2C56A0', '#3F6FB5', '#6F9ED1', '#9CC0D8', '#1A2F63']); }
      else { region = 1; col = pick(['#D9A441', '#E8C35A', '#B5762A', '#C98E34', '#8E6A2A', '#6F8A3A']); }
      st.push({ x: px, y: py, c: col, rgb: hex2rgb(col), r: region, l: 24 + R() * 18, w: 9 + R() * 5, j: R() });
    }
    return { P, st, bg: makePaper('#2A3E6A', { seed: 311, blot: 20 }) };
  },
  draw(ctx, t, s) {
    ctx.drawImage(s.bg, 0, 0, W, H);
    const P = s.P, [sx, sy] = P.sun, [wx, wy] = P.sw;
    ctx.fillStyle = '#9E7430'; ctx.fillRect(0, P.hz, W, P.y1 - P.hz);
    const shade = (c, k) => `rgb(${c.map(v => clamp(Math.round(v * k), 0, 255)).join(',')})`;
    for (const q of s.st) {
      let a;
      if (q.r === 0) { const v1 = Math.atan2(q.y - wy, q.x - wx) + Math.PI / 2, v2 = Math.atan2(q.y - sy, q.x - sx) + Math.PI / 2; const d1 = Math.hypot(q.x - wx, q.y - wy), d2 = Math.hypot(q.x - sx, q.y - sy); const w1 = Math.exp(-d1 / 220), w2 = Math.exp(-d2 / 200); a = (fbm(q.x * .003, q.y * .003 + t * .15, 3) - .5) * 3 + .1; a = (a * (1 - w1 - w2) + v1 * w1 + v2 * w2 * 1.0) + t * .25 * (w1 + w2); }
      else if (q.r === 1) a = Math.sin(q.x * .01 + q.y * .02 + t * .8) * .35;
      else if (q.r === 2) a = -Math.PI / 2 + Math.sin(q.y * .02 + t * 1.2) * .3;
      else a = Math.atan2(q.y - sy, q.x - sx) + Math.PI / 2 + t * .5;
      const drift = q.r === 0 ? t * 10 : 0;
      ctx.save(); ctx.translate(q.x + Math.cos(a) * drift, q.y + Math.sin(a) * drift); ctx.rotate(a);
      ctx.fillStyle = shade(q.rgb, .62); ctx.beginPath(); ctx.roundRect(-q.l / 2 + 1.5, -q.w / 2 + 2, q.l, q.w, q.w / 2); ctx.fill();
      ctx.fillStyle = q.c; ctx.beginPath(); ctx.roundRect(-q.l / 2, -q.w / 2, q.l, q.w, q.w / 2); ctx.fill();
      ctx.fillStyle = shade(q.rgb, 1.35); ctx.fillRect(-q.l / 2 + 4, -q.w / 2 + 1.5, q.l - 10, 2.2);
      ctx.restore();
    }
    const gl = ctx.createRadialGradient(sx, sy, 60, sx, sy, 320); gl.addColorStop(0, 'rgba(255,230,140,.25)'); gl.addColorStop(1, 'rgba(255,230,140,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
  }
});
