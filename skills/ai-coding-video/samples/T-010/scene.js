// T-010 延时城市交响：空间站延时拍的夜间城市灯火开场，切到 1900 年时代广场的夜景老照片，最后用 Natural Earth 的城市数据在黑底上一颗颗点亮世界最大的 60 座城市，按人口决定亮度和大小
// 素材：录像（NASA Expedition 65 地球 4K 合集里的夜景段）、照片（国会图书馆 Detroit Publishing 约 1900 年）、数据（Natural Earth 城市点）；配乐 CC0
scene({
  id: 'T-010', name: '延时城市交响', dur: 15, still: 13.2,
  fonts: ["900 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'", "400 40px 'JetBrains Mono'"],
  text: '城市的夜从公里高处看年纽约时代广场座城市合计亿人人口估算录像照片数据配乐',
  async init() {
    const A = await loadAssets();
    const cities = parseCSV(await loadText('cities.csv'));
    return { A, cities, v: await loadVideo('night.mp4'), bw: await loadImage('broadway.jpg') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.fillStyle = '#03040a'; ctx.fillRect(0, 0, W, H);
    const title = (big, small, a, y) => {
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 20 * u;
      ctx.fillStyle = '#fff'; ctx.font = `900 ${(LAND ? 76 : 80) * u}px 'Noto Sans SC'`; ctx.fillText(big, W / 2, y);
      ctx.font = `400 ${34 * u}px 'Bebas Neue'`; ctx.fillStyle = '#ffc56b'; ctx.fillText(small, W / 2, y + 56 * u); ctx.restore();
    };
    if (t < 5.4) {
      await s.v.at(t * 2.4);                                       // 2.4 倍速：灯火流得更快
      drawCover(ctx, s.v.el, 0, 0, W, H, { zoom: 1.15, fy: .45 });
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .5; ctx.filter = 'blur(12px)';
      drawCover(ctx, s.v.el, 0, 0, W, H, { zoom: 1.15, fy: .45 }); ctx.restore();       // 灯光泛一层光晕
      title('城市的夜', 'FROM 400 KM UP · ISS TIME-LAPSE', smooth(.4, 1, t) * (1 - smooth(4.6, 5.2, t)), H * .2);
      ctx.save(); ctx.font = `400 ${22 * u}px 'JetBrains Mono'`; ctx.fillStyle = 'rgba(255,197,107,.85)';
      ctx.fillText(`×2.4  ${(t * 2.4).toFixed(1).padStart(4, '0')}s`, 40 * u, H - 40 * u); ctx.restore();
    } else if (t < 9.8) {
      const k = inv(5.4, 9.8, t);
      ctx.save(); ctx.filter = 'sepia(.6) contrast(1.1)';
      drawCover(ctx, s.bw, 0, 0, W, H, { zoom: lerp(1.35, 1.1, eInOutCubic(k)), fx: lerp(.3, .6, k), fy: .55 });
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = 'rgba(255,170,60,.35)'; ctx.fillRect(0, 0, W, H); ctx.restore();
      title('1900 年 · 时代广场', 'BROADWAY AT NIGHT · NEW YORK', smooth(5.8, 6.4, t) * (1 - smooth(9.2, 9.7, t)), H * .2);
    } else {
      // 世界城市灯点：等距圆柱投影，按人口从大到小依次亮起
      const k = inv(9.8, 13.0, t), n = Math.floor(k * s.cities.length);
      const mw = LAND ? W * .9 : W * .96, mh = mw / 2, ox = (W - mw) / 2, oy = LAND ? H * .5 - mh / 2 + 30 * u : H * .5 - mh / 2;
      const P = (lon, lat) => [ox + (lon + 180) / 360 * mw, oy + (90 - lat) / 180 * mh];
      ctx.strokeStyle = 'rgba(255,197,107,.08)'; ctx.lineWidth = 1;
      for (let lo = -180; lo <= 180; lo += 30) { ctx.beginPath(); ctx.moveTo(...P(lo, 90)); ctx.lineTo(...P(lo, -90)); ctx.stroke(); }
      for (let la = -60; la <= 90; la += 30) { ctx.beginPath(); ctx.moveTo(...P(-180, la)); ctx.lineTo(...P(180, la)); ctx.stroke(); }
      let total = 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      s.cities.forEach((c, i) => {
        if (i > n) return;
        const a = clamp(k * s.cities.length - i), [x, y] = P(c.lon, c.lat), r = Math.sqrt(c.pop_max / 1e6) * 5 * u * (LAND ? 1 : .8);
        total += c.pop_max * a;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, `rgba(255,214,140,${.9 * a})`); g.addColorStop(.25, `rgba(255,160,60,${.45 * a})`); g.addColorStop(1, 'rgba(255,120,30,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 7); ctx.fill();
        const tw = .7 + .3 * noise1(t * 3 + i);
        ctx.fillStyle = `rgba(255,248,230,${a * tw})`; ctx.beginPath(); ctx.arc(x, y, 2.2 * u, 0, 7); ctx.fill();
      });
      ctx.restore();
      ctx.save(); ctx.font = `400 ${(LAND ? 18 : 16) * u}px 'Bebas Neue'`; ctx.fillStyle = 'rgba(255,230,190,.85)';
      s.cities.slice(0, 8).forEach((c, i) => { if (i <= n) { const [x, y] = P(c.lon, c.lat); ctx.globalAlpha = clamp(k * s.cities.length - i); ctx.fillText(c.name.toUpperCase(), x + 8 * u, y - 8 * u); } });
      ctx.restore();
      const e = smooth(9.9, 10.4, t);
      ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.font = `900 ${(LAND ? 60 : 64) * u}px 'Noto Sans SC'`; ctx.fillText(`${Math.min(n + 1, s.cities.length)} 座城市`, W / 2, LAND ? H * .14 : H * .25);
      const ny = LAND ? H * .88 : H * .74, num = (total / 1e8).toFixed(1);
      ctx.font = `400 ${72 * u}px 'Bebas Neue'`; const nw = ctx.measureText(num).width;
      ctx.font = `900 ${40 * u}px 'Noto Sans SC'`; const lw = ctx.measureText(' 亿人').width;
      ctx.textAlign = 'left'; ctx.fillStyle = '#ffc56b';
      ctx.font = `400 ${72 * u}px 'Bebas Neue'`; ctx.fillText(num, W / 2 - (nw + lw) / 2, ny);
      ctx.font = `900 ${40 * u}px 'Noto Sans SC'`; ctx.fillText(' 亿人', W / 2 - (nw + lw) / 2 + nw, ny);
      ctx.font = `400 ${18 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.textAlign = 'center';
      ctx.fillText('都市区人口，Natural Earth 估算', W / 2, (LAND ? H * .88 : H * .74) + 36 * u);
      ctx.restore();
    }
    // 镜头之间的光带扫过
    for (const c of [5.4, 9.8]) {
      const p = inv(c - .25, c + .25, t);
      if (p > 0 && p < 1) {
        const x = lerp(-W * .3, W * 1.3, p), g = ctx.createLinearGradient(x - W * .2, 0, x + W * .2, 0);
        g.addColorStop(0, 'rgba(255,200,120,0)'); g.addColorStop(.5, 'rgba(255,220,160,.85)'); g.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    }
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 24 * u, H - 18 * u); ctx.restore();
  },
});
