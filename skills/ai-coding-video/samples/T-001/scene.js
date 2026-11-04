// T-001 数据实体化：阿波罗 17 号拍的地球照片慢慢推近、退到一侧，NOAA 莫纳罗亚 1959–2025 年的二氧化碳年均值逐年长成一排立体方柱，计数跟着旁白走
// 素材：照片（NASA AS17-148-22727）、数据（NOAA GML 年均值 CSV）；旁白、字幕时刻读 assets.json
scene({
  id: 'T-001', name: '数据实体化', dur: 15, still: 13.6,
  fonts: ["700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 40px 'JetBrains Mono'"],
  text: '地球的空气变了多少年均二氧化碳浓度莫纳罗亚观测站照片数据配乐ppm',
  async init() {
    const A = await loadAssets();
    const earth = await loadImage('earth.jpg');
    const rows = parseCSV(await loadText('co2_annmean_mlo.csv')).filter(r => r.year >= 1959 && r.year <= 2025);
    return { A, earth, rows };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, { rows } = s;
    ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H);
    // 地球：0–4.3 秒铺满慢推，4.3–5.3 秒退到一侧（横屏左边、竖屏上面）
    const k = eInOutCubic(inv(4.3, 5.4, t));
    const full = [0, 0, W, H], side = LAND ? [0, 0, W * .42, H] : [0, 0, W, H * .4];
    const box = full.map((v, i) => lerp(v, side[i], k));
    drawCover(ctx, s.earth, ...box, { zoom: lerp(1.22, 1.0, inv(0, 15, t)) * lerp(1, 1.08, k), fy: .5 });
    const g = LAND ? ctx.createLinearGradient(box[2] - 260 * u, 0, box[2], 0) : ctx.createLinearGradient(0, box[3] - 260 * u, 0, box[3]);
    g.addColorStop(0, 'rgba(5,7,13,0)'); g.addColorStop(1, 'rgba(5,7,13,1)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 标题
    ctx.save(); ctx.globalAlpha = smooth(.2, 1.0, t);
    ctx.fillStyle = '#e9eef7'; ctx.font = `700 ${46 * u}px 'Noto Sans SC'`; ctx.textAlign = 'left';
    ctx.fillText('地球的空气变了多少', 64 * u, 104 * u);
    ctx.font = `400 ${24 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(233,238,247,.7)';
    ctx.fillText('莫纳罗亚观测站 · 年均二氧化碳浓度', 64 * u, 146 * u);
    ctx.restore();
    // 方柱区域
    const area = LAND ? { x: W * .47, y: H * .2, w: W * .48, h: H * .58 } : { x: W * .08, y: H * .45, w: W * .84, h: H * .3 };
    const n = rows.length, gw = area.w / n, lo = 300, hi = 432;
    const grow = inv(5.2, 12.0, t), shown = grow * n;          // 12 秒时（旁白说到 427）长完
    const vis = smooth(4.8, 5.6, t);
    ctx.save(); ctx.globalAlpha = vis;
    // 刻度线
    ctx.font = `400 ${18 * u}px 'JetBrains Mono'`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let v = 320; v <= 420; v += 50) {
      const y = area.y + area.h - (v - lo) / (hi - lo) * area.h;
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(area.x, y); ctx.lineTo(area.x + area.w, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillText(String(v), area.x - 10 * u, y);
    }
    // 每年一根立体方柱：正面 + 顶面 + 侧面，按年份逐根落下长高
    const dep = gw * .55;
    for (let i = 0; i < n; i++) {
      const p = clamp(shown - i, 0, 1);
      if (p <= 0) break;
      const r = rows[i], hgt = (r.mean - lo) / (hi - lo) * area.h * eOutCubic(p);
      const x = area.x + i * gw, y = area.y + area.h - hgt, bw = gw * .78;
      const c = (r.mean - 315) / 112;
      const col = [lerp(70, 255, c), lerp(150, 120, c), lerp(230, 60, c)];
      ctx.fillStyle = rgba(col.map(v => v * .55), 1);           // 侧面
      ctx.beginPath(); ctx.moveTo(x + bw, y); ctx.lineTo(x + bw + dep * .5, y - dep * .4); ctx.lineTo(x + bw + dep * .5, area.y + area.h - dep * .4); ctx.lineTo(x + bw, area.y + area.h); ctx.fill();
      ctx.fillStyle = rgba(col.map(v => Math.min(255, v * 1.25)), 1);   // 顶面
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dep * .5, y - dep * .4); ctx.lineTo(x + bw + dep * .5, y - dep * .4); ctx.lineTo(x + bw, y); ctx.fill();
      ctx.fillStyle = rgba(col, 1); ctx.fillRect(x, y, bw, hgt);           // 正面
    }
    // 年份轴
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const yr of [1959, 1980, 2000, 2025]) ctx.fillText(String(yr), area.x + (yr - 1959 + .4) * gw, area.y + area.h + 12 * u);
    ctx.restore();
    // 计数：当前长到的那一年和浓度
    if (t > 5.2) {
      const i = Math.min(n - 1, Math.floor(shown)), r = rows[i];
      const cx = LAND ? area.x : area.x, cy = LAND ? area.y - 40 * u : area.y - 70 * u;
      ctx.save(); ctx.globalAlpha = vis; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#ffb36b'; ctx.font = `700 ${88 * u}px 'JetBrains Mono'`;
      ctx.fillText(r.mean.toFixed(1), cx, cy);
      const w1 = ctx.measureText(r.mean.toFixed(1)).width;
      ctx.font = `700 ${30 * u}px 'JetBrains Mono'`; ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.fillText('ppm  ' + r.year, cx + w1 + 16 * u, cy);
      ctx.restore();
    }
    // 结尾：比 1959 年多了多少
    const e = smooth(12.6, 13.4, t);
    if (e > 0) {
      const pct = Math.round((rows[n - 1].mean / rows[0].mean - 1) * 100);
      ctx.save(); ctx.globalAlpha = e;
      ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = `700 ${LAND ? 120 : 110}px 'JetBrains Mono'`.replace(/\d+px/, m => parseInt(m) * u + 'px');
      const ex = area.x + area.w, ey = LAND ? area.y + 110 * u : area.y - 160 * u;
      ctx.fillText('+' + pct + '%', ex, ey);
      ctx.font = `400 ${26 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fillText('比 1959 年', ex, ey + 44 * u);
      ctx.restore();
    }
    // 字幕和署名
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, { size: LAND ? 38 : 44, bg: 'rgba(0,0,0,.5)' });
    ctx.save(); ctx.font = `400 ${17 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 32 * u, H - 22 * u); ctx.restore();
  },
});
