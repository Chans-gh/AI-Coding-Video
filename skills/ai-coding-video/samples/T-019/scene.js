// T-019 营养成分对比：三张 CC0 的食物照片各占一栏、各自缓慢推近；下面套同一套条形图，读 USDA FoodData Central 每 100 克的营养成分表，7 项逐行长出来，每行最高的那一栏亮起；最后由数据算出一句结论
// 素材：照片 Wikimedia Commons（CC0）、数据 USDA FoodData Central SR Legacy（CC0，fdc.py 取出）；配乐 CC0
scene({
  id: 'T-019', name: '营养成分对比', dur: 13, still: 9.6,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'"],
  text: '营养成分对比同样克差多少苹果香蕉牛油果热量脂肪碳水糖膳食纤维蛋白质钾每可食部分数据来源照片配乐的倍但和也最高是',
  async init() {
    const A = await loadAssets();
    const rows = parseCSV(await loadText('nutrients.csv'));
    const imgs = await Promise.all(['apple.jpg', 'banana.jpg', 'avocado.jpg'].map(loadImage));
    const keys = Object.keys(rows[0]).filter(k => k.includes('('));
    const M = keys.map(k => ({ name: k.split('(')[0], unit: k.split('(')[1].replace(')', ''), v: rows.map(r => +r[k]) }));
    return { A, rows, imgs, M };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, { M, rows } = s;
    const BG = '#f6f1e7', INK = '#2a2420', SUB = '#8a7d6e';
    const COL = ['#d8453b', '#e3b21e', '#5c8a2e'], FOC = [[.5, .5], [.55, .5], [.45, .5]];
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    const pad = (LAND ? 70 : 40) * u, gap = (LAND ? 40 : 18) * u;
    const top = (LAND ? 150 : 250) * u, cw = (W - 2 * pad - 2 * gap) / 3;
    const ph = LAND ? H * .34 : cw * 1.3;
    // 标题
    ctx.textAlign = LAND ? 'left' : 'center';
    ctx.font = `900 ${(LAND ? 56 : 64) * u}px 'Noto Sans SC'`; ctx.fillStyle = INK;
    const tx = LAND ? pad : W / 2;
    ctx.fillText('同样 100 克，差多少？', tx, (LAND ? 92 : 150) * u);
    ctx.font = `400 ${(LAND ? 22 : 26) * u}px 'Noto Sans SC'`; ctx.fillStyle = SUB;
    ctx.fillText('每 100 克可食部分 · USDA FoodData Central', tx, (LAND ? 128 : 196) * u);
    // 每行出现的时刻：1.4 秒起，每 1.2 秒一行
    const T0 = 1.4, STEP = 1.2, cur = Math.floor((t - T0) / STEP);
    const rowH = (LAND ? 48 : 112) * u, listY = top + ph + (LAND ? 50 : 120) * u;
    for (let c = 0; c < 3; c++) {
      const x = pad + c * (cw + gap), a = eOutCubic(inv(.1 + c * .15, .8 + c * .15, t));
      ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 40 * u);
      // 照片卡：缓慢推近
      ctx.save(); rr(ctx, x, top, cw, ph, 18 * u); ctx.shadowColor = 'rgba(60,40,20,.18)'; ctx.shadowBlur = 24 * u; ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
      drawCover(ctx, s.imgs[c], x, top, cw, ph, { zoom: 1.04 + .16 * eInOutCubic(inv(0, 13, t)), fx: FOC[c][0], fy: FOC[c][1] });
      ctx.restore();
      ctx.fillStyle = COL[c]; rr(ctx, x + 16 * u, top + ph - 62 * u, (LAND ? 120 : 112) * u, 46 * u, 23 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${(LAND ? 26 : 26) * u}px 'Noto Sans SC'`; ctx.textAlign = 'center';
      ctx.fillText(rows[c].food, x + 16 * u + (LAND ? 60 : 56) * u, top + ph - 30 * u);
      ctx.restore();
    }
    // 条形图：每项一行，三栏各一条，长度按这一项三者里的最大值
    M.forEach((m, i) => {
      const t1 = T0 + i * STEP, p = eOutCubic(inv(t1, t1 + .7, t));
      if (p <= 0) return;
      const y = listY + i * rowH, mx = Math.max(...m.v), win = m.v.indexOf(mx), on = i === cur && t < T0 + M.length * STEP + .3;
      for (let c = 0; c < 3; c++) {
        const x = pad + c * (cw + gap), lw = (LAND ? 130 : 0) * u;
        const bx = x + lw, bw = cw - lw - (LAND ? 100 : 0) * u, w = bw * m.v[c] / mx * p;
        ctx.globalAlpha = inv(t1, t1 + .3, t);
        if (LAND || c === 0) {
          ctx.font = `${on ? 700 : 400} ${(LAND ? 24 : 26) * u}px 'Noto Sans SC'`; ctx.fillStyle = on ? INK : SUB; ctx.textAlign = 'left';
          if (LAND) ctx.fillText(m.name, x, y + 8 * u);
        }
        const by = LAND ? y - 12 * u : y + 6 * u, bh = (LAND ? 22 : 18) * u;
        ctx.fillStyle = 'rgba(42,36,32,.07)'; rr(ctx, bx, by, bw, bh, bh / 2); ctx.fill();
        ctx.fillStyle = c === win ? COL[c] : rgba(hex2rgb(COL[c]), .35); rr(ctx, bx, by, Math.max(bh, w), bh, bh / 2); ctx.fill();
        if (c === win && on) { ctx.strokeStyle = COL[c]; ctx.lineWidth = 3 * u; rr(ctx, bx - 5 * u, by - 5 * u, bw + 10 * u, bh + 10 * u, bh); ctx.stroke(); }
        const val = m.v[c] * p, txt = (m.v[c] >= 10 ? Math.round(val) : val.toFixed(1)) + (LAND ? ' ' + m.unit : '');
        ctx.font = `400 ${(LAND ? 30 : 34) * u}px 'Bebas Neue'`; ctx.fillStyle = c === win ? INK : SUB;
        if (LAND) { ctx.textAlign = 'right'; ctx.fillText(txt, x + cw, y + 10 * u); }
        else { ctx.textAlign = 'left'; ctx.fillText(txt, bx, by - 8 * u); }
        ctx.globalAlpha = 1;
      }
    });
    if (!LAND) {                                            // 竖屏行名：放在每行左侧的窄标签里（叠在条上方）
      M.forEach((m, i) => {
        const t1 = T0 + i * STEP; if (t < t1) return;
        const y = listY + i * rowH;
        ctx.globalAlpha = inv(t1, t1 + .3, t); ctx.font = `700 ${22 * u}px 'Noto Sans SC'`; ctx.fillStyle = i === cur ? INK : SUB;
        ctx.textAlign = 'center'; ctx.font = `700 ${26 * u}px 'Noto Sans SC'`; ctx.fillText(`${m.name}（${m.unit}）`, W / 2, y - 52 * u);
        ctx.globalAlpha = 1;
      });
    }
    // 结论：由数据算出
    const ct = T0 + M.length * STEP + .4, cp = eOutCubic(inv(ct, ct + .6, t));
    if (cp > 0) {
      const kcal = M.find(m => m.name === '热量').v, fat = M.find(m => m.name === '脂肪').v, k = M.find(m => m.name === '钾').v;
      const line = `牛油果的热量是苹果的 ${(kcal[2] / kcal[0]).toFixed(1)} 倍、脂肪多 ${Math.round(fat[2] / fat[0])} 倍，但钾和膳食纤维也最高`;
      const y = LAND ? H - 92 * u : listY + M.length * rowH + 90 * u;
      ctx.globalAlpha = cp;
      ctx.font = `700 ${(LAND ? 34 : 36) * u}px 'Noto Sans SC'`;
      const lines = wrapCJK(ctx, line, W - 2 * pad - 60 * u), lh = 50 * u, bh = lines.length * lh + 34 * u;
      ctx.fillStyle = INK; rr(ctx, pad, y - bh + 20 * u + (1 - cp) * 20 * u, W - 2 * pad, bh, 16 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      lines.forEach((l, i) => ctx.fillText(l, W / 2, y - bh + 20 * u + (1 - cp) * 20 * u + 52 * u + i * lh));
      ctx.globalAlpha = 1;
    }
    ctx.font = `400 ${(LAND ? 17 : 14) * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(42,36,32,.5)'; ctx.textAlign = LAND ? 'right' : 'center';
    ctx.fillText(credits(s.A), LAND ? W - 24 * u : W / 2, H - 18 * u);
  }
});
