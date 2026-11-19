// C-128 史前洞穴岩画：岩壁是半分辨率的分形噪声高度图，算出法线和裂缝后存成底色；野牛、鹿每种先画好三个姿态（赭红、土黄的色块加木炭黑的轮廓，模糊一下再用纸齿遮罩让颜料渗进岩面颗粒），手印是围着手形撒一圈红点、手形本身留空；每帧按时间轮换姿态，再按火把的位置逐像素算一张光照图（法线点乘光的方向、随距离衰减、带闪烁）用正片叠底压上去，火把照不到的地方就是黑的。
// 风格提示词：用史前洞穴岩画风格：凹凸不平的石灰岩壁由噪声生成浮雕和裂缝，形象只用赭红、土黄和木炭黑，炭笔边缘起毛并渗进岩面颗粒，手印用喷吹法留下负形，野牛和鹿在两三个姿态之间交替奔跑，一支摇曳的火把照到哪里哪里才看得见，配低沉的鼓声。
// 题材：手绘与绘画 · 适合：人类起源、狩猎故事、远古历史
function beast(kind, pose, sz) {
  const c = mk(Math.ceil(sz * 1.4), Math.ceil(sz * 1), ), g = c.getContext('2d'), u = sz;
  g.translate(c.width / 2, c.height * .45); g.lineCap = 'round';
  const legs = kind === 'bison' ? [[-.3, .14], [-.2, .15], [.28, .12], [.38, .1]] : [[-.22, .05], [-.15, .06], [.22, .04], [.29, .03]];
  const A = [[-.6, -.3, .45, .65], [.35, .55, -.35, -.15], [-.1, .15, .1, .25]][pose], ll = kind === 'bison' ? .25 : .3;
  const body = kind === 'bison' ? '#9A3B22' : '#B98A3C';
  g.fillStyle = body; g.strokeStyle = body;
  legs.forEach(([x, y], i) => { g.lineWidth = (kind === 'bison' ? .05 : .025) * u; g.beginPath(); g.moveTo(x * u, y * u); const a = A[i]; const kx = x + Math.sin(a) * ll * .5, ky = y + Math.cos(a) * ll * .5; g.quadraticCurveTo(kx * u, ky * u, (kx + Math.sin(a * .4) * ll * .5) * u, (ky + ll * .5) * u); g.stroke(); });
  const OB = [[-.58, .12], [-.61, .01], [-.53, -.12], [-.36, -.3], [-.18, -.37], [.04, -.24], [.34, -.19], [.46, -.1], [.47, .08], [.3, .18], [0, .2], [-.3, .2], [-.44, .28], [-.53, .2]];
  const OD = [[-.28, .06], [-.36, -.1], [-.38, -.2], [-.5, -.22], [-.44, -.31], [-.33, -.25], [-.22, -.1], [0, -.11], [.3, -.09], [.37, -.14], [.35, .04], [0, .1], [-.24, .1]];
  const O = kind === 'bison' ? OB : OD, sm = (pts, a, b, close) => {
    const P = pts.map(([x, y]) => [x * u, y * u]), n = P.length; g.beginPath();
    const M = k => [(P[k % n][0] + P[(k + 1) % n][0]) / 2, (P[k % n][1] + P[(k + 1) % n][1]) / 2];
    g.moveTo(...M(a)); for (let k = a + 1; k <= b; k++) g.quadraticCurveTo(...P[k % n], ...M(k)); if (close) g.closePath();
  };
  sm(O, 0, O.length, true); g.fill();
  g.filter = `blur(${u * .006}px)`;
  g.strokeStyle = '#1C1410'; g.lineWidth = .026 * u;
  if (kind === 'bison') {
    sm(O, 0, 8); g.stroke(); sm(O, 9, 13); g.stroke();
    g.fillStyle = '#1C1410'; g.globalAlpha = .7; g.beginPath(); g.ellipse(-.3 * u, -.17 * u, .2 * u, .12 * u, -.5, 0, TAU); g.fill(); g.globalAlpha = .85; g.beginPath(); g.ellipse(-.52 * u, .05 * u, .09 * u, .14 * u, .2, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-.46 * u, .22 * u, .06 * u, .07 * u, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
    g.lineWidth = .022 * u; g.beginPath(); g.moveTo(-.5 * u, -.1 * u); g.quadraticCurveTo(-.6 * u, -.2 * u, -.47 * u, -.25 * u); g.stroke();
    g.beginPath(); g.moveTo(.46 * u, -.08 * u); g.quadraticCurveTo(.56 * u, 0, .53 * u, .16 * u); g.stroke();
  } else {
    sm(O, 0, 10); g.stroke(); g.lineWidth = .016 * u;
    for (const s of [-1, 1]) { const bx = -.42, by = -.3; g.beginPath(); g.moveTo(bx * u, by * u); g.lineTo((bx + s * .06) * u, (by - .16) * u); g.lineTo((bx + s * .14) * u, (by - .26) * u); g.moveTo((bx + s * .04) * u, (by - .1) * u); g.lineTo((bx + s * .13) * u, (by - .12) * u); g.moveTo((bx + s * .09) * u, (by - .2) * u); g.lineTo((bx + s * .06) * u, (by - .32) * u); g.stroke(); }
  }
  g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none';
  g.globalCompositeOperation = 'destination-in'; g.drawImage(toothMask(c.width, c.height, { cut: .3, soft: .15, scale: 2.5, seed: pose + 3 }), 0, 0);
  return c;
}
scene({
  id: 'C-128', name: '史前洞穴岩画', dur: 5, still: 3.2,
  fonts: [],
  init() {
    const u = SHORT / 1080, w = W / 2 | 0, h = H / 2 | 0;
    // 岩壁：高度图 → 底色、法线
    const hm = new Float32Array(w * h), alb = mk(w, h), ag = alb.getContext('2d'), id = ag.createImageData(w, h), d = id.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) hm[y * w + x] = fbm(x * .007, y * .007, 5) + .25 * fbm(x * .05 + 9, y * .05, 3);
    const N = new Float32Array(w * h * 3), str = 9;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, hx = hm[y * w + Math.min(w - 1, x + 1)] - hm[y * w + Math.max(0, x - 1)], hy = hm[Math.min(h - 1, y + 1) * w + x] - hm[Math.max(0, y - 1) * w + x];
      let nx = -hx * str, ny = -hy * str, nz = 1; const l = Math.hypot(nx, ny, nz); N[i * 3] = nx / l; N[i * 3 + 1] = ny / l; N[i * 3 + 2] = nz / l;
      const cr = Math.abs(fbm(x * .012 + 40, y * .012, 4) - .5), st = fbm(x * .004 + 7, y * .004, 3), v = .75 + hm[i] * .35 + (hash2(x, y) - .5) * .1;
      let r = 196 * v, gg = 176 * v, b = 142 * v;
      r = lerp(r, 170, clamp((st - .55) * 3)); gg = lerp(gg, 120, clamp((st - .55) * 3)); b = lerp(b, 80, clamp((st - .55) * 3));
      if (cr < .0035) { const k = .7 + cr * 80; r *= k; gg *= k; b *= k; }
      d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
    }
    ag.putImageData(id, 0, 0);
    // 手印：围着手撒红点
    const hands = mk(W, H), hg = hands.getContext('2d'), Rh = mulberry32(2);
    const HP = LAND ? [[W * .1, H * .28, -.3], [W * .9, H * .68, .4], [W * .16, H * .78, .1]] : [[W * .18, H * .1, -.2], [W * .82, H * .66, .4], [W * .2, H * .8, .1]];
    for (const [hx, hy, a] of HP) {
      const s = 90 * u, path = new Path2D(), m = new DOMMatrix().translate(hx, hy).rotate(a * 57.3);
      const shape = new Path2D(); shape.ellipse(0, s * .35, s * .42, s * .48, 0, 0, TAU);
      [[-.42, -.1, -.5, .55], [-.2, -.45, -.12, .8], [0, -.5, 0, .9], [.2, -.45, .1, .85], [.38, -.3, .2, .65]].forEach(([fx, fy, fa, fl]) => { const p = new Path2D(); p.roundRect(-s * .09, -s * fl, s * .18, s * fl, s * .09); shape.addPath(p, new DOMMatrix().translate(fx * s, fy * s + s * .2).rotate(fa * 57.3)); });
      path.addPath(shape, m);
      for (let i = 0; i < 9000; i++) {
        const r = Math.abs((Rh() + Rh() + Rh() - 1.5)) * s * 1.6, t = Rh() * TAU, x = hx + Math.cos(t) * r, y = hy + Math.sin(t) * r * 1.1;
        if (hg.isPointInPath(path, x, y)) continue; hg.fillStyle = `rgba(160,45,25,${.35 + Rh() * .45})`; const q = (1 + Rh() * 2.5) * u; hg.fillRect(x, y, q, q);
      }
    }
    hg.globalCompositeOperation = 'destination-in'; hg.drawImage(toothMask(W, H, { cut: .32, scale: 2.5, seed: 9 }), 0, 0);
    const BS = (LAND ? 760 : 820) * u, DS = (LAND ? 470 : 500) * u;
    return { alb, N, w, h, hands, bison: [0, 1, 2].map(p => beast('bison', p, BS)), deer: [0, 1, 2].map(p => beast('deer', p, DS)), BS, DS, lm: mk(w, h), lid: null };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    ctx.imageSmoothingEnabled = true; ctx.drawImage(s.alb, 0, 0, W, H);
    // 岩画
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(s.hands, 0, 0);
    const pb = Math.floor(t * 6) % 3, pd = (Math.floor(t * 6) + 1) % 3, bx = LAND ? W * .4 : W * .5, by = LAND ? H * .5 : H * .5, dx = LAND ? W * .74 : W * .58, dy = LAND ? H * .3 : H * .27;
    const B = s.bison[pb], D = s.deer[pd], drift = -t * 6 * u;
    ctx.globalAlpha = .9; ctx.drawImage(B, bx - B.width / 2 + drift, by - B.height * .45); ctx.drawImage(D, dx - D.width / 2 + drift * 1.4, dy - D.height * .45); ctx.globalAlpha = 1;
    // 火把：从左下进来，走到中间偏右
    const q = eInOutCubic(inv(0, 4.6, t)), fx = W * lerp(LAND ? .08 : .15, LAND ? .62 : .7, q) + 30 * u * Math.sin(t * 1.7), fy = H * (LAND ? .82 : .86) - 40 * u * Math.sin(t * 1.3);
    const fl = .82 + .18 * noise1(t * 9) + .06 * Math.sin(t * 31), R = SHORT * .85 * fl;
    const w = s.w, h = s.h, g = s.lm.getContext('2d'); if (!s.lid) s.lid = g.createImageData(w, h);
    const d = s.lid.data, N = s.N, lx = fx / 2, ly = fy / 2, lz = 160 * u, rr2 = (R / 2) * (R / 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, vx = lx - x, vy = ly - y, dd = vx * vx + vy * vy, l = Math.sqrt(dd + lz * lz);
      const df = Math.max(0, (N[i * 3] * vx + N[i * 3 + 1] * vy + N[i * 3 + 2] * lz) / l), fo = 1 / (1 + dd / rr2 * 2.2), v = Math.min(1.25, (.12 + 1.15 * df) * fo * fl + .03);
      d[i * 4] = Math.min(255, 255 * v * 1.08); d[i * 4 + 1] = 230 * v; d[i * 4 + 2] = 190 * v; d[i * 4 + 3] = 255;
    }
    g.putImageData(s.lid, 0, 0); ctx.drawImage(s.lm, 0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createRadialGradient(fx, fy, 0, fx, fy, R * .7); gl.addColorStop(0, `rgba(255,150,60,${.28 * fl})`); gl.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    // 火焰和火星
    for (let k = 0; k < 4; k++) {   // 火焰：几层抖动的水滴形
      const fh = (170 - k * 35) * u * fl, fw = fh * .32, ox = 6 * u * Math.sin(t * 13 + k), top = [fx + ox + 18 * u * (noise1(t * 6 + k) - .5) * 2, fy - fh];
      ctx.fillStyle = ['rgba(200,60,10,.35)', 'rgba(255,130,30,.45)', 'rgba(255,200,80,.6)', 'rgba(255,245,210,.8)'][k];
      ctx.beginPath(); ctx.moveTo(fx - fw, fy - fh * .15); ctx.quadraticCurveTo(fx - fw * .9, fy - fh * .6, top[0], top[1]); ctx.quadraticCurveTo(fx + fw * .9, fy - fh * .6, fx + fw, fy - fh * .15); ctx.quadraticCurveTo(fx, fy + fh * .12, fx - fw, fy - fh * .15); ctx.fill();
    }
    for (let k = 0; k < 14; k++) { const ph = (t * .9 + hash1(k)) % 1, sx = fx + (hash1(k + 9) - .5) * 80 * u + Math.sin(ph * 6 + k) * 15 * u, sy = fy - 40 * u - ph * 300 * u; ctx.fillStyle = `rgba(255,190,90,${(1 - ph) * .8})`; ctx.fillRect(sx, sy, 3 * u, 3 * u); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(.25); const tg = ctx.createLinearGradient(-20 * u, 0, 20 * u, 0); tg.addColorStop(0, '#120A06'); tg.addColorStop(.4, '#4A2E18'); tg.addColorStop(1, '#0E0805'); ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-24 * u, -10 * u); ctx.lineTo(24 * u, -10 * u); ctx.lineTo(14 * u, H * .3); ctx.lineTo(-14 * u, H * .3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 3 * u; for (const y of [20, 50]) { ctx.beginPath(); ctx.moveTo(-22 * u, y * u); ctx.lineTo(22 * u, (y + 8) * u); ctx.stroke(); } ctx.restore();
    vignette(ctx, .6, .35); grain(ctx, f, .12);
  }
});