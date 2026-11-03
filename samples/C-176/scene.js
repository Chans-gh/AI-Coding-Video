// C-176 老胶片（褪色彩色）：海边放风筝的画面按 18 格每秒画在四分之一大小的画布上，逐像素调色（整体偏洋红暖黄、暗部发青、黑位抬起）并加逐帧变化的颗粒，再放大成柔和的画面；外面叠圆角片门、上下晃动、橙色漏光、划痕和灰尘，结尾是过曝白帧和片孔滑过的换卷
// 风格提示词：用老胶片风格：像七十年代超 8 毫米家庭影片，颜色整体偏洋红和暖黄、阴影发青，粗颗粒逐帧跳动，画面四角是圆角片门，偶尔闪过橙色漏光，片子轻微上下晃动，换卷处出现打孔和过曝白帧，配放映机的嗒嗒声。
// 题材：电影年代与屏幕科技 · 适合：家庭回忆、复古广告、年代感 MV
scene({
  id: 'C-176', name: '老胶片（褪色彩色）', dur: 3.6, still: 1.25,
  init() {
    const w = W / 4, h = H / 4, R = mulberry32(76), noise = new Int8Array(w * h * 2);
    for (let i = 0; i < noise.length; i++) noise[i] = Math.round((R() + R() + R() - 1.5) * 40);
    return { lo: mk(w, h), w, h, noise };
  },
  draw(ctx, t, s, f) {
    const { w, h } = s, ts = stepT(t, 18), fr = Math.floor(t * 18), u = Math.min(w, h) / 270;
    const g = s.lo.getContext('2d');
    // ---- 拍到的画面：海边、放风筝的孩子；手持镜头轻微晃 ----
    const hx = (vnoise(ts * .8, 1) - .5) * 14 * u, hy = (vnoise(ts * .8, 5) - .5) * 10 * u;
    g.save(); g.translate(hx, hy);
    const hor = h * (LAND ? .52 : .5);
    const sky = g.createLinearGradient(0, 0, 0, hor); sky.addColorStop(0, '#5f9fd4'); sky.addColorStop(1, '#cfe3ea');
    g.fillStyle = sky; g.fillRect(-20, -20, w + 40, hor + 20);
    g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(w * .82, h * .16, 16 * u, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)';
    for (const [cx, cy, k] of [[.2, .14, 1], [.55, .1, .8], [.75, .3, .6]]) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(w * cx + (j - 1.5) * 12 * u * k - ts * 4 * u, h * cy + Math.sin(j * 2) * 4 * u, (9 + j % 2 * 5) * u * k, 0, TAU); g.fill(); }
    g.fillStyle = '#2f6f8f'; g.fillRect(-20, hor, w + 40, h * .14);
    for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(255,255,240,.7)'; g.fillRect((hash1(k) * w + ts * 9 * (1 + hash1(k + 5))) % w, hor + hash1(k * 3) * h * .13, 6 * u, 1.2 * u); }
    const sandY = hor + h * .14;
    g.fillStyle = '#e8d2a2'; g.fillRect(-20, sandY, w + 40, h);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.moveTo(-20, sandY);
    for (let x = -20; x <= w + 20; x += 6) g.lineTo(x, sandY + 4 * u + Math.sin(x * .05 + ts * 2) * 2.5 * u); g.lineTo(w + 20, sandY); g.fill();
    // 孩子
    const kx = w * (LAND ? .32 : .36), ky = h * .86, bob = Math.sin(ts * 9) * 1.5 * u;
    g.fillStyle = '#d23a2c'; g.beginPath(); g.moveTo(kx - 11 * u, ky - 8 * u); g.lineTo(kx + 11 * u, ky - 8 * u); g.lineTo(kx + 8 * u, ky - 40 * u + bob); g.lineTo(kx - 8 * u, ky - 40 * u + bob); g.fill();
    g.fillStyle = '#f0c9a0'; g.beginPath(); g.arc(kx, ky - 50 * u + bob, 9 * u, 0, TAU); g.fill();
    g.fillStyle = '#5a3a22'; g.beginPath(); g.arc(kx, ky - 53 * u + bob, 9 * u, Math.PI, TAU); g.fill();
    g.strokeStyle = '#f0c9a0'; g.lineWidth = 4 * u; g.lineCap = 'round';
    const hand = [kx + 18 * u, ky - 58 * u + bob];
    g.beginPath(); g.moveTo(kx + 6 * u, ky - 36 * u + bob); g.lineTo(...hand); g.stroke();
    g.strokeStyle = '#2b3550'; g.lineWidth = 5 * u; g.beginPath(); g.moveTo(kx - 5 * u, ky - 9 * u); g.lineTo(kx - 7 * u, ky + 6 * u); g.moveTo(kx + 5 * u, ky - 9 * u); g.lineTo(kx + 7 * u, ky + 6 * u); g.stroke();
    // 风筝：随风摇摆，尾巴飘
    const fx = w * (LAND ? .66 : .62) + Math.sin(ts * 1.7) * 12 * u, fy = h * (LAND ? .22 : .25) + Math.sin(ts * 2.3) * 8 * u, fa = Math.sin(ts * 2.1) * .25;
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1 * u; g.beginPath(); g.moveTo(...hand); g.quadraticCurveTo((hand[0] + fx) / 2, (hand[1] + fy) / 2 + 30 * u, fx, fy + 18 * u); g.stroke();
    g.save(); g.translate(fx, fy); g.rotate(fa);
    const kite = [[0, -26], [18, 0], [0, 22], [-18, 0]].map(([x, y]) => [x * u, y * u]);
    [['#f2c230', 0, 1], ['#d8342a', 1, 2], ['#f2c230', 2, 3], ['#d8342a', 3, 0]].forEach(([c, a, b]) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.lineTo(...kite[a]); g.lineTo(...kite[b]); g.fill(); });
    g.strokeStyle = '#3a2a20'; g.lineWidth = 1.2 * u; g.beginPath(); g.moveTo(0, 22 * u);
    for (let k = 1; k <= 12; k++) g.lineTo(Math.sin(k * .8 - ts * 6) * 6 * u * k / 12 - k * 1.5 * u, 22 * u + k * 5 * u);
    g.stroke(); g.restore(); g.restore();
    // ---- 逐像素调色：偏洋红暖黄、暗部发青、黑位抬起、颗粒逐帧跳 ----
    const id = g.getImageData(0, 0, w, h), d = id.data, off = (fr * 7919) % (w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      let r = d[i], gg = d[i + 1], b = d[i + 2];
      const l = (r * .3 + gg * .59 + b * .11) / 255, sh = Math.max(0, .45 - l);
      const n = s.noise[p + off];
      r = 26 + r * .9 + 14 - sh * 50 + n; gg = 20 + gg * .8 + sh * 30 + n; b = 24 + b * .72 + sh * 45 + n;
      d[i] = r; d[i + 1] = gg; d[i + 2] = b;
    }
    g.putImageData(id, 0, 0);
    // ---- 放映：上下晃、闪烁 ----
    const end = inv(3.0, 3.6, t);                                          // 换卷
    const weave = (hash1(fr * 3) - .5) * 8 * SHORT / 1080 + Math.sin(t * 6) * 3 * SHORT / 1080 + (end > 0 ? end * end * H * .6 : 0);
    ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(s.lo, 0, weave, W, H);
    if (end > 0) ctx.drawImage(s.lo, 0, weave - H - 30 * SHORT / 1080, W, H);
    ctx.fillStyle = `rgba(0,0,0,${.03 + .07 * hash1(fr * 11)})`; ctx.fillRect(0, 0, W, H);
    // 漏光：1.0 秒和 2.3 秒各闪一次
    for (const [t0, side] of [[1.0, 1], [2.3, -1]]) {
      const a = Math.sin(Math.PI * inv(t0, t0 + .45, t)); if (a <= 0) continue;
      const lx = side > 0 ? W * 1.05 : -W * .05, gl = ctx.createRadialGradient(lx, H * .4, 0, lx, H * .4, LONG * .7);
      gl.addColorStop(0, `rgba(255,140,40,${.85 * a})`); gl.addColorStop(.5, `rgba(255,70,20,${.35 * a})`); gl.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    // 划痕和灰尘（每帧不同）
    const R = mulberry32(fr + 1), uu = SHORT / 1080;
    ctx.fillStyle = 'rgba(255,250,235,.35)'; ctx.fillRect(W * (.3 + .05 * Math.sin(t * 2)), 0, 1.5 * uu, H);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = R() < .5 ? 'rgba(20,12,8,.7)' : 'rgba(255,250,235,.5)'; ctx.beginPath(); ctx.arc(R() * W, R() * H, (1 + 4 * R()) * uu, 0, TAU); ctx.fill(); }
    if (fr % 23 < 2) { ctx.strokeStyle = 'rgba(20,12,8,.6)'; ctx.lineWidth = 2 * uu; const x = R() * W, y = R() * H; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 40 * uu, y - 30 * uu, x + 20 * uu, y + 60 * uu, x + 70 * uu, y + 50 * uu); ctx.stroke(); }
    // 换卷：过曝白帧闪烁，片孔从左边滑过
    if (end > 0) {
      ctx.fillStyle = `rgba(255,248,230,${fr % 2 ? .85 : .45})`; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0a0806';
      for (let k = -1; k < 6; k++) { rr(ctx, W * .04, weave + k * H * .3 - H * .1, SHORT * .07, SHORT * .1, SHORT * .015); ctx.fill(); }
    }
    // 圆角片门 + 暗角
    ctx.fillStyle = '#0a0806'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.roundRect(SHORT * .03, SHORT * .03, W - SHORT * .06, H - SHORT * .06, SHORT * .09); ctx.fill('evenodd');
    vignette(ctx, .55, .35, '30,10,5');
  }
});
