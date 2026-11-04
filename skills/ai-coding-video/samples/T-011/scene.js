// T-011 体育战术板：把 1878 年迈布里奇《奔马》照片版上的 11 格切出来当动画播，像体育转播的慢动作回放——先正常速度，再放慢、定格在四蹄离地的那一格，用白板笔画地面线、圈和箭头，最后排成一条胶片对比
// 素材：照片（国会图书馆藏迈布里奇 1878 年照片版一张）；配乐 CC0。每格的位置按照片版的版式切
scene({
  id: 'T-011', name: '体育战术板', dur: 15, still: 8.4,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'", "400 40px 'JetBrains Mono'"],
  text: '马跑起来会四蹄离地吗慢动作回放四蹄全部离地地面第帧格每格间隔约米曝光秒时速约公里年照片配乐',
  async init() {
    return { A: await loadAssets(), img: await loadImage('horse.jpg') };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, img = s.img, [iw, ih] = srcSize(img), Y = '#ffe14d', G = '#0f3d2e';
    // 11 格的位置（照片版上 3 行 4 列，第 12 格是静止站立，不用）
    const COL = [[.067, .268], [.287, .492], [.513, .718], [.740, .943]], ROW = [[.077, .274], [.328, .522], [.580, .776]];
    const cell = k => { const [a, b] = COL[k % 4], [c, d] = ROW[Math.floor(k / 4)]; return [a * iw, c * ih, (b - a) * iw, (d - c) * ih]; };
    const drawCell = (k, x, y, w, h) => { const [sx, sy, sw, sh] = cell(k); ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h); };
    // 战术板底色和网格
    ctx.fillStyle = G; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const FREEZE = 2;                                   // 第 3 格：四条腿都收在肚子下面
    const bigW = LAND ? W * .62 : W * .92, bigH = bigW * (cell(0)[3] / cell(0)[2]), bx = LAND ? W * .06 : W * .04, by = LAND ? H * .2 : H * .3;
    let k = 0, label = '';
    if (t < 1.4) {
      // 开场：整张照片版
      const a = smooth(0, .5, t), z = lerp(1, 1.08, t / 1.4);
      ctx.save(); ctx.globalAlpha = a; drawContain(ctx, img, W * .05, H * .12, W * .9, H * .76, { zoom: z }); ctx.restore();
    } else {
      if (t < 5.6) { k = Math.floor((t - 1.4) * 12) % 11; label = '正常速度'; }
      else if (t < 7.8) { k = Math.min(FREEZE, Math.floor((t - 5.6) * 3)) ; label = '慢动作 ×¼'; }
      else { k = FREEZE; label = '定格'; }
      const zoomIn = eOutCubic(inv(1.4, 2.0, t));
      ctx.save(); ctx.globalAlpha = zoomIn;
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30 * u; ctx.fillStyle = '#e9dcc0'; ctx.fillRect(bx - 10 * u, by - 10 * u, bigW + 20 * u, bigH + 20 * u);
      ctx.shadowColor = 'transparent'; drawCell(k, bx, by, bigW, bigH);
      ctx.restore();
      // 角标：模式、帧号
      ctx.save(); ctx.textBaseline = 'middle';
      ctx.fillStyle = t >= 5.6 ? '#e8443a' : '#111'; rr(ctx, bx, by - 80 * u, 230 * u, 54 * u, 8 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `900 ${28 * u}px 'Noto Sans SC'`; ctx.fillText(label, bx + 18 * u, by - 53 * u);
      ctx.font = `400 ${30 * u}px 'JetBrains Mono'`; ctx.fillStyle = '#fff'; ctx.textAlign = 'right';
      ctx.fillText(`第 ${String(k + 1).padStart(2, '0')} / 11 格`, bx + bigW, by - 53 * u); ctx.restore();
      // 白板笔：定格后画地面线、圈住四条腿、箭头和字
      if (t >= 7.8) {
        const p = q => inv(7.9 + q * .5, 8.4 + q * .5, t);
        ctx.save(); ctx.strokeStyle = Y; ctx.fillStyle = Y; ctx.lineWidth = 6 * u; ctx.lineCap = 'round'; ctx.setLineDash([]);
        const gy = by + bigH * .80;
        ctx.setLineDash([18 * u, 12 * u]); ctx.beginPath(); ctx.moveTo(bx + bigW * .05, gy); ctx.lineTo(bx + bigW * lerp(.05, .95, p(0)), gy); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = `700 ${26 * u}px 'Noto Sans SC'`; ctx.globalAlpha = clamp(p(0) * 2); ctx.fillText('地面', bx + bigW * .06, gy + 34 * u); ctx.globalAlpha = 1;
        const ex = bx + bigW * .44, ey = by + bigH * .6;
        ctx.beginPath(); ctx.ellipse(ex, ey, bigW * .16, bigH * .13, -.1, 0, Math.PI * 2 * eOutCubic(p(1))); ctx.stroke();
        if (p(2) > 0) {
          const q = eOutCubic(p(2)), ax = ex + bigW * .2, ay = gy - 6 * u;
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, lerp(ay, ey + bigH * .02, q)); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ax - 14 * u, ay - 10 * u - (ay - ey) * q * .9); ctx.lineTo(ax, ay - 24 * u - (ay - ey) * q * .9); ctx.lineTo(ax + 14 * u, ay - 10 * u - (ay - ey) * q * .9); ctx.stroke();
        }
        ctx.restore();
      }
      // 右侧（竖屏下方）解说板
      const px = LAND ? W * .72 : W * .06, py = LAND ? H * .2 : by + bigH + 90 * u;
      ctx.save(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'top';
      ctx.font = `900 ${(LAND ? 54 : 60) * u}px 'Noto Sans SC'`;
      const q1 = smooth(2, 2.5, t), q2 = smooth(9.0, 9.5, t);
      ctx.globalAlpha = q1 * (1 - q2); ctx.fillText('马跑起来，', px, py); ctx.fillText('会四蹄离地吗？', px, py + 70 * u);
      ctx.globalAlpha = q2; ctx.fillStyle = Y; ctx.fillText('会！', px, py); ctx.fillStyle = '#fff'; ctx.fillText('四蹄全部离地', px, py + 70 * u);
      ctx.globalAlpha = smooth(10, 10.5, t); ctx.font = `400 ${28 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.85)';
      ['每格间隔约 0.69 米', '每张曝光 1/2000 秒', '时速约 58 公里'].forEach((l, i) => ctx.fillText(l, px, py + (170 + i * 46) * u));
      ctx.restore();
    }
    // 最后：11 格排成一条胶片，第 3 格高亮
    const st = smooth(11.6, 12.3, t);
    if (st > 0) {
      const n = 11, sw = (W - 80 * u) / n, sh = sw * (cell(0)[3] / cell(0)[2]), sy = LAND ? H - sh - 90 * u : H - sh - 200 * u;
      ctx.save(); ctx.globalAlpha = st; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, sy - 20 * u, W, sh + 40 * u);
      for (let i = 0; i < n; i++) {
        const x = 40 * u + i * sw, a = eOutCubic(inv(11.6 + i * .06, 12.0 + i * .06, t));
        ctx.globalAlpha = st * a; drawCell(i, x + 3 * u, sy + (1 - a) * 30 * u, sw - 6 * u, sh);
        if (i === FREEZE) { ctx.strokeStyle = Y; ctx.lineWidth = 5 * u; ctx.strokeRect(x + 1 * u, sy - 2 * u, sw - 2 * u, sh + 4 * u); }
      }
      ctx.restore();
    }
    // 顶部比分条式的标题
    ctx.save(); ctx.textBaseline = 'middle'; const ty = (LAND ? 50 : 110) * u;
    ctx.fillStyle = '#111'; rr(ctx, 40 * u, ty - 28 * u, 520 * u, 56 * u, 8 * u); ctx.fill();
    ctx.fillStyle = Y; ctx.fillRect(40 * u, ty - 28 * u, 12 * u, 56 * u);
    ctx.fillStyle = '#fff'; ctx.font = `400 ${36 * u}px 'Bebas Neue'`; ctx.fillText('PALO ALTO · 1878.06.19', 70 * u, ty + 2 * u);
    ctx.restore();
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 24 * u, H - 18 * u); ctx.restore();
  },
});
