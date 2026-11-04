// T-007 卫星地图新闻简报：Natural Earth 海岸线画底图，NOAA 最佳路径一点点画出飓风伊恩的轨迹（按强度上色），信息卡跟着读数；后半段空间站拍的两张照片滑进来，新闻条和字幕跟旁白走
// 素材：照片（NASA 空间站拍的伊恩两张）、数据（NOAA HURDAT2 路径、Natural Earth 海岸线）；旁白用语音合成的公开音色；配乐 CC0
scene({
  id: 'T-007', name: '卫星地图简报', dur: 15, still: 8.0,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 40px 'JetBrains Mono'"],
  text: '新闻简报飓风伊恩登陆佛罗里达热带低压风暴级最大风速公里小时卫星视角国际空间站路径海岸线加勒比海古巴墨西哥湾月日照片数据旁白配乐',
  async init() {
    const A = await loadAssets();
    const track = parseCSV(await loadText('ian_track.csv'));
    const coast = JSON.parse(await loadText('coast.json'));
    return { A, track, coast, i1: await loadImage('ian1.jpg'), i2: await loadImage('ian2.jpg') };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, RED = '#d7263d', { track, coast } = s;
    ctx.fillStyle = '#0b1622'; ctx.fillRect(0, 0, W, H);
    // 地图框：横屏左侧、竖屏上部；等距圆柱投影，经度按中纬度压缩
    const MB = LAND ? [40 * u, 120 * u, W * .52, H - 240 * u] : [30 * u, 230 * u, W - 60 * u, H * .5];
    const [x0, y0, x1, y1] = coast.bbox, kx = Math.cos(23 * Math.PI / 180);
    const sc = Math.min(MB[2] / ((x1 - x0) * kx), MB[3] / (y1 - y0)) * lerp(1, 1.12, smooth(0, 15, t));
    const cx = MB[0] + MB[2] / 2, cy = MB[1] + MB[3] / 2, mx = (x0 + x1) / 2 - 1.5, my = (y0 + y1) / 2;
    const P = (lon, lat) => [cx + (lon - mx) * kx * sc, cy - (lat - my) * sc];
    ctx.save(); rr(ctx, ...MB, 14 * u); ctx.clip();
    ctx.fillStyle = '#0f2233'; ctx.fillRect(...MB);
    ctx.strokeStyle = 'rgba(120,170,210,.12)'; ctx.lineWidth = 1;
    for (let lo = -90; lo <= -66; lo += 5) { ctx.beginPath(); ctx.moveTo(...P(lo, 8)); ctx.lineTo(...P(lo, 38)); ctx.stroke(); }
    for (let la = 10; la <= 38; la += 5) { ctx.beginPath(); ctx.moveTo(...P(-92, la)); ctx.lineTo(...P(-66, la)); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(170,210,235,.75)'; ctx.lineWidth = 1.6 * u; ctx.lineJoin = 'round';
    for (const l of coast.lines) { ctx.beginPath(); l.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](...P(...p))); ctx.stroke(); }
    ctx.font = `400 ${18 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(170,210,235,.55)'; ctx.textAlign = 'center';
    for (const [n, lo, la] of [['墨西哥湾', -88, 25.5], ['加勒比海', -76, 15], ['古巴', -79, 21.9], ['佛罗里达', -81.4, 28.8], ['大西洋', -70, 30]]) ctx.fillText(n, ...P(lo, la));
    // 路径：0.5–9.7 秒按记录逐点画出，颜色按风速分级
    const cat = kt => kt < 34 ? ['热带低压', '#5ab4e5'] : kt < 64 ? ['热带风暴', '#5fd38d'] : kt < 83 ? ['1 级', '#ffe066'] : kt < 96 ? ['2 级', '#ffb347'] : kt < 113 ? ['3 级', '#ff7b39'] : kt < 137 ? ['4 级', '#ff3b3b'] : ['5 级', '#d63bff'];
    // 分两段走：0.5–6 秒走到佛罗里达登陆那一点（旁白正说到登陆），之后走完
    const iL = track.findIndex(r => r.record === 'L' && r.lat > 25);
    const prog = t < 6 ? inv(.5, 6, t) * iL : iL + inv(6, 9.7, t) * (track.length - 1 - iL), n = Math.floor(prog);
    ctx.lineCap = 'round';
    for (let i = 0; i < Math.min(n, track.length - 1); i++) {
      const a = P(track[i].lon, track[i].lat), b = P(track[i + 1].lon, track[i + 1].lat), k = i + 1 > prog ? prog - i : 1;
      ctx.strokeStyle = cat(track[i + 1].wind_kt)[1]; ctx.lineWidth = (3 + track[i + 1].wind_kt / 30) * u;
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(lerp(a[0], b[0], k), lerp(a[1], b[1], k)); ctx.stroke();
    }
    const cur = track[Math.min(track.length - 1, Math.round(prog))], cp = P(cur.lon, cur.lat);
    // 当前位置：旋转的风眼符号
    ctx.save(); ctx.translate(...cp); ctx.rotate(-t * 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * u;
    for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(0, 0, 16 * u, k * Math.PI, k * Math.PI + 2); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 5 * u, 0, 7); ctx.fill(); ctx.restore();
    // 登陆点：佛罗里达那次 L 记录
    const lf = track[iL], lt = iL;
    if (prog >= lt) {
      const [lx, ly] = P(lf.lon, lf.lat), pulse = (t * 1.2) % 1;
      ctx.strokeStyle = `rgba(215,38,61,${1 - pulse})`; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(lx, ly, (14 + 40 * pulse) * u, 0, 7); ctx.stroke();
      ctx.fillStyle = RED; ctx.font = `900 ${24 * u}px 'Noto Sans SC'`; ctx.textAlign = 'right'; ctx.fillText('登陆', lx - 22 * u, ly + 8 * u);
    }
    ctx.restore();
    // 右侧（竖屏下方）：前半段是读数卡，后半段换成空间站照片
    const RB = LAND ? [W * .52 + 70 * u, 120 * u, W * .48 - 110 * u, H - 240 * u] : [30 * u, 230 * u + H * .5 + 30 * u, W - 60 * u, H * .5 - 600 * u];
    const ph = smooth(9.6, 10.2, t);
    if (ph < 1) {
      ctx.save(); ctx.globalAlpha = 1 - ph; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const [cn, cc] = cat(cur.wind_kt), d = String(cur.date), tm = String(cur.time).padStart(4, '0');
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `400 ${26 * u}px 'Noto Sans SC'`; ctx.fillText('协调世界时', RB[0], RB[1] + 10 * u);
      ctx.fillStyle = '#fff'; ctx.font = `700 ${54 * u}px 'JetBrains Mono'`; ctx.fillText(`${+d.slice(4, 6)}/${+d.slice(6)} ${tm.slice(0, 2)}:${tm.slice(2)}`, RB[0], RB[1] + 50 * u);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = `400 ${26 * u}px 'Noto Sans SC'`; ctx.fillText('最大持续风速', RB[0], RB[1] + 150 * u);
      ctx.fillStyle = cc; ctx.font = `700 ${110 * u}px 'JetBrains Mono'`; ctx.fillText(String(Math.round(cur.wind_kt * 1.852)), RB[0], RB[1] + 186 * u);
      const kw = ctx.measureText(String(Math.round(cur.wind_kt * 1.852))).width;
      ctx.font = `700 ${30 * u}px 'Noto Sans SC'`; ctx.fillText('公里/小时', RB[0] + kw + 16 * u, RB[1] + 250 * u);
      ctx.fillStyle = cc; rr(ctx, RB[0], RB[1] + 320 * u, 220 * u, 64 * u, 32 * u); ctx.fill();
      ctx.fillStyle = '#0b1622'; ctx.font = `900 ${32 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText(cn, RB[0] + 110 * u, RB[1] + 333 * u);
      ctx.restore();
    }
    if (ph > 0) {
      const img = t < 12.4 ? s.i1 : s.i2, k = t < 12.4 ? inv(9.6, 12.4, t) : inv(12.4, 15, t);
      const box = LAND ? RB : [30 * u, 230 * u + H * .5 + 30 * u, W - 60 * u, 520 * u];
      ctx.save(); ctx.globalAlpha = ph; ctx.translate((1 - ph) * 60 * u, 0); rr(ctx, ...box, 14 * u); ctx.clip();
      drawCover(ctx, img, ...box, { zoom: lerp(1.05, 1.2, k) });
      ctx.fillStyle = RED; ctx.fillRect(box[0], box[1], 260 * u, 50 * u);
      ctx.fillStyle = '#fff'; ctx.font = `700 ${24 * u}px 'Noto Sans SC'`; ctx.textBaseline = 'middle'; ctx.fillText('卫星视角 · 国际空间站', box[0] + 16 * u, box[1] + 25 * u);
      ctx.restore();
    }
    // 新闻台的外框：顶部标签、标题条、底部跑马灯
    ctx.save(); ctx.textBaseline = 'middle';
    const ty = LAND ? 60 * u : 120 * u;
    ctx.fillStyle = RED; ctx.fillRect(40 * u, ty - 30 * u, 170 * u, 60 * u);
    ctx.fillStyle = '#fff'; ctx.font = `900 ${30 * u}px 'Noto Sans SC'`; ctx.fillText('新闻简报', 58 * u, ty);
    ctx.font = `900 ${(LAND ? 38 : 40) * u}px 'Noto Sans SC'`; ctx.fillText('飓风伊恩登陆佛罗里达', 230 * u, ty);
    const bh = 56 * u; ctx.fillStyle = '#e9edf2'; ctx.fillRect(0, H - bh, W, bh);
    ctx.fillStyle = RED; ctx.fillRect(0, H - bh, 130 * u, bh); ctx.fillStyle = '#fff'; ctx.font = `900 ${26 * u}px 'Noto Sans SC'`; ctx.fillText('数据', 36 * u, H - bh / 2);
    ctx.save(); ctx.beginPath(); ctx.rect(130 * u, H - bh, W, bh); ctx.clip();
    ctx.fillStyle = '#0b1622'; ctx.font = `400 ${22 * u}px 'Noto Sans SC'`;
    const msg = `  路径 NOAA 国家飓风中心 HURDAT2 · 海岸线 Natural Earth · 照片 NASA 国际空间站 · ${credits(s.A)}  ·`, mw = ctx.measureText(msg).width;
    for (let x = 140 * u - (t * 120 * u) % mw; x < W; x += mw) ctx.fillText(msg, x, H - bh / 2);
    ctx.restore(); ctx.restore();
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, { size: LAND ? 34 : 40, y: H - bh - (LAND ? 22 : 60) * u, bg: 'rgba(11,22,34,.85)' });
  },
});
