// T-015 年度数据回顾：一个模板函数 card() 加一张三行的数据表（2023、2024、2025），每行出一条年度回顾：空间站拍的地平线做底，年份翻进来，NASA GISTEMP 的全球气温距平数字滚到位、算出「有记录以来第几热」，1880 年以来的柱状图点亮这一年，旁边是 NOAA 的 CO₂ 年均值；三条依次播完，最后把同一模板出的三条排成一排、配上数据表
// 素材：数据（NASA GISS GISTEMP v4 年均温距平、NOAA Mauna Loa CO₂ 年均值）、照片（NASA 空间站照片）；配乐 CC0
const ROWS = [{ year: 2023, accent: '#ffb347' }, { year: 2024, accent: '#ff5e3a' }, { year: 2025, accent: '#ff8a3d' }];  // 数据表：一行出一条
const LEN = 3.8;                                                                                                   // 每条的长度
scene({
  id: 'T-015', name: '年度数据回顾', dur: 14, still: 6.6,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'", "700 40px 'JetBrains Mono'"],
  text: '年度回顾地球全球平均气温比年平均高有记录以来第热二氧化碳浓度比上一年同一模板行数据条气温距平排名数据照片配乐',
  async init() {
    const A = await loadAssets(), img = await loadImage('limb.jpg');
    const T = parseCSV(await loadText('gistemp.csv')).map(r => ({ y: r.Year, v: r['J-D'] }));
    const C = Object.fromEntries(parseCSV(await loadText('co2_annmean_mlo.csv')).map(r => [r.year, r.mean]));
    // 模板要的字段，全部从数据里算：距平、排名（截至这一年）、CO₂ 和它比上一年多多少
    const rows = ROWS.map(r => {
      const upto = T.filter(d => d.y <= r.year), v = upto[upto.length - 1].v;
      return { ...r, v, rank: 1 + upto.filter(d => d.v > v).length, n: upto.length, co2: C[r.year], dco2: C[r.year] - C[r.year - 1], hist: upto };
    });
    return { A, img, rows, thumbs: rows.map(() => mk(Math.round(W / 2), Math.round(H / 2))) };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
    const i = Math.min(2, Math.floor(t / LEN));
    if (t < LEN * 3) {
      const lt = t - i * LEN;
      card(ctx, W, H, lt, s.rows[i], s.img, i);
      // 换下一条：白闪
      const fl = 1 - smooth(0, .15, lt); if (i > 0 && fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl * .6})`; ctx.fillRect(0, 0, W, H); }
      ctx.save(); ctx.font = `700 ${22 * u}px 'JetBrains Mono'`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText(`模板 × 数据第 ${i + 1}/3 行`, W - 40 * u, (LAND ? 36 : 110) * u); ctx.restore();
    } else {
      // 收尾：三条排一排（竖屏排一列），下面是数据表
      s.rows.forEach((r, k) => card(s.thumbs[k].getContext('2d'), s.thumbs[k].width, s.thumbs[k].height, 3.2, r, s.img, k));
      const n = 3, gap = 24 * u;
      const tw = (W - 160 * u - gap * 2) / n, th = tw * H / W, gy = LAND ? H * .2 : 560 * u;
      s.thumbs.forEach((c, k) => {
        const x = 80 * u + k * (tw + gap), y = gy;
        const d = eOutCubic(inv(LEN * 3 + k * .12, LEN * 3 + .5 + k * .12, t));
        ctx.save(); ctx.globalAlpha = d; ctx.translate(0, (1 - d) * 60 * u);
        rr(ctx, x, y, tw, th, 12 * u); ctx.save(); ctx.clip(); ctx.drawImage(c, x, y, tw, th); ctx.restore();
        ctx.strokeStyle = s.rows[k].accent; ctx.lineWidth = 3 * u; ctx.stroke(); ctx.restore();
      });
      ctx.save(); ctx.globalAlpha = smooth(LEN * 3 + .5, LEN * 3 + .9, t); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      const lx = 80 * u, ly = gy - 40 * u;
      ctx.font = `900 ${(LAND ? 46 : 52) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.fillText('同一模板，3 行数据', lx, ly);
      // 数据表
      const tx = 80 * u, ty = gy + th + 80 * u;
      const cols = ['年份', '距平 °C', '排名', 'CO₂ ppm'], cw = (W - 160 * u) / 4;
      ctx.font = `400 ${22 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.55)';
      cols.forEach((c, j) => ctx.fillText(c, tx + j * cw, ty));
      s.rows.forEach((r, k) => {
        const y = ty + (k + 1) * 44 * u; ctx.font = `400 ${36 * u}px 'Bebas Neue'`; ctx.fillStyle = '#fff';
        [r.year, `+${r.v.toFixed(2)}`, `#${r.rank}`, r.co2.toFixed(1)].forEach((v, j) => { ctx.fillStyle = j === 2 ? r.accent : '#fff'; ctx.fillText(v, tx + j * cw, y); });
      });
      ctx.restore();
    }
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), W - 24 * u, H - 18 * u); ctx.restore();
  },
});

// 模板：在 w×h 的画布上画一条年度回顾（lt 是这一条里的秒数，r 是数据表的一行）。尺寸全部按 w、h 算，缩小了也能直接画
function card(ctx, w, h, lt, r, img, idx) {
  const land = w > h, u = Math.min(w, h) / 1080, F = "'Noto Sans SC'", B = "'Bebas Neue'";
  ctx.save();
  ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, w, h);
  drawCover(ctx, img, 0, 0, w, h, { zoom: 1.15 + .04 * lt + idx * .05, fy: land ? .55 : .6, fx: .3 + idx * .2 });
  const g = ctx.createLinearGradient(0, 0, land ? w : 0, land ? 0 : h);
  g.addColorStop(0, 'rgba(4,6,14,.88)'); g.addColorStop(.6, 'rgba(4,6,14,.55)'); g.addColorStop(1, 'rgba(4,6,14,.2)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const L = (land ? 90 : 70) * u, top = (land ? 150 : 300) * u;
  ctx.font = `700 ${28 * u}px ${F}`; ctx.fillStyle = r.accent; ctx.fillText('年度回顾 · 地球', L, top);
  // 年份：一位一位翻进来
  const ys = String(r.year);
  ctx.font = `400 ${(land ? 220 : 260) * u}px ${B}`;
  let x = L;
  for (let k = 0; k < 4; k++) {
    const a = eOutBack(inv(.05 + k * .07, .4 + k * .07, lt));
    ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = '#fff';
    ctx.translate(0, (1 - a) * 80 * u); ctx.fillText(ys[k], x, top + (land ? 200 : 240) * u); ctx.restore();
    x += ctx.measureText(ys[k]).width;
  }
  // 气温距平：数字滚到位
  const vy = top + (land ? 330 : 420) * u, cnt = r.v * eOutCubic(inv(.45, 1.5, lt));
  ctx.font = `400 ${(land ? 120 : 140) * u}px ${B}`; ctx.fillStyle = r.accent; ctx.globalAlpha = smooth(.4, .6, lt);
  const vt = `+${cnt.toFixed(2)}°C`; ctx.fillText(vt, L, vy);
  ctx.font = `400 ${26 * u}px ${F}`; ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.fillText('全球平均气温，比 1951–1980 年平均高', L, vy + 46 * u);
  // 排名徽章
  const ra = eOutBack(inv(1.3, 1.7, lt));
  if (ra > 0) {
    ctx.save(); ctx.globalAlpha = clamp(ra);
    const bx = L, by = vy + 80 * u, txt = `有记录以来第 ${r.rank} 热`;
    ctx.font = `900 ${34 * u}px ${F}`; const bw = ctx.measureText(txt).width + 48 * u;
    ctx.translate(bx, by); ctx.scale(ra, ra);
    ctx.fillStyle = r.accent; rr(ctx, 0, 0, bw, 58 * u, 29 * u); ctx.fill();
    ctx.fillStyle = '#111'; ctx.fillText(txt, 24 * u, 41 * u); ctx.restore();
    ctx.font = `400 ${18 * u}px ${F}`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.globalAlpha = clamp(ra);
    ctx.fillText(`1880–${r.year} 年共 ${r.n} 年里排第 ${r.rank}`, L, by + 90 * u);
  }
  ctx.globalAlpha = 1;
  // 柱状图：1880 年以来，这一年点亮
  const cx = land ? w * .5 : L, cy = land ? h * .78 : h * .8, cw = land ? w * .44 : w - 2 * L, ch = (land ? 300 : 300) * u;
  const n = r.hist.length, bw = cw / n, grow = eOutCubic(inv(.3, 1.5, lt)), sc = ch / 1.5;
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(cx, cy, cw, 1.5 * u);
  r.hist.forEach((d, k) => {
    const on = k === n - 1, hh = d.v * sc * grow, x = cx + k * bw;
    ctx.fillStyle = on ? '#fff' : d.v < 0 ? 'rgba(98,170,255,.75)' : `rgba(255,${Math.round(200 - d.v * 120)},80,.8)`;
    ctx.fillRect(x, d.v < 0 ? cy : cy - hh, Math.max(1, bw * .7), Math.abs(hh));
  });
  ctx.font = `400 ${22 * u}px ${B}`; ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.fillText('1880', cx, cy + 30 * u); ctx.textAlign = 'right'; ctx.fillText(String(r.year), cx + cw, cy + 30 * u); ctx.textAlign = 'left';
  // CO₂
  const ca = smooth(1.7, 2.1, lt);
  if (ca > 0) {
    ctx.globalAlpha = ca;
    const qx = land ? w * .5 : L, qy = land ? top + 60 * u : cy - ch - 150 * u;
    ctx.font = `400 ${22 * u}px ${F}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('大气二氧化碳（夏威夷 Mauna Loa 年均值）', qx, qy);
    ctx.font = `400 ${(land ? 96 : 104) * u}px ${B}`; ctx.fillStyle = '#fff';
    const ct = (r.co2 * eOutCubic(inv(1.7, 2.6, lt)) + r.co2 * (1 - eOutCubic(inv(1.7, 2.6, lt))) * .98).toFixed(1);
    ctx.fillText(ct, qx, qy + 96 * u); const cw2 = ctx.measureText(ct).width;
    ctx.font = `400 ${34 * u}px ${B}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('PPM', qx + cw2 + 12 * u, qy + 96 * u);
    ctx.font = `700 ${26 * u}px ${F}`; ctx.fillStyle = r.accent; ctx.fillText(`比上一年 +${r.dco2.toFixed(2)}`, qx, qy + 136 * u);
  }
  ctx.restore();
}
