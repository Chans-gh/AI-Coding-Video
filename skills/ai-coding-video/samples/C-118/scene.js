// C-118 电视天气预报：Canvas 2D 画藏青渐变底；开场 300 个发光圆点按对数螺线排开、整体旋转成一团风暴云，之后用一条斜向色带快速擦过切到圆角预报卡（温度计、风速表盘、多日预报条），天气图标都是平涂几何加软投影；角标、日期徽标和底部快讯条始终在，快讯条按 t 匀速滚动。
// 风格提示词：用电视天气预报风格：上浅下深的藏青渐变底，开场是一团由发光圆点组成的旋转风暴云，随后切到一张张圆角预报卡：温度图、温度计、风速表盘、多日预报条，图标是带软阴影的扁平天气图标，角上有台标和日期徽标，底部滚动快讯条，场景间斜向快速擦除。
// 题材：电影年代与屏幕科技 · 适合：数据播报、日程预告、周报
scene({
  id: 'C-118', name: '电视天气预报', dur: 5, still: 2.1,
  fonts: ["900 80px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  text: '天气台风过境明天多云转晴最高温风速级周一二三四五快讯：沿海地区注意防风今日穿衣建议薄外套天气频道11月17日°C',
  init() {
    const R = mulberry32(118), dots = [];
    for (let i = 0; i < 300; i++) { const a = R() * TAU * 1.5, arm = Math.floor(R() * 3); dots.push([a, arm, R(), R()]); }
    return { dots };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, WH = '#FFFFFF';
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3C6FB4'); bg.addColorStop(1, '#0C1E45');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const shadow = (on) => { ctx.shadowColor = on ? 'rgba(0,10,40,.45)' : 'transparent'; ctx.shadowBlur = on ? 24 * u : 0; ctx.shadowOffsetY = on ? 10 * u : 0; };
    // —— 图标
    const sun = (x, y, r) => { ctx.fillStyle = '#FFC93C'; for (let k = 0; k < 8; k++) { ctx.save(); ctx.translate(x, y); ctx.rotate(k / 8 * TAU + t * .5); rr(ctx, r * 1.15, -r * .12, r * .45, r * .24, r * .12); ctx.fill(); ctx.restore(); } ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
    const cloud = (x, y, r, c = '#F2F6FF') => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x - r * .6, y, r * .55, 0, TAU); ctx.arc(x, y - r * .3, r * .75, 0, TAU); ctx.arc(x + r * .7, y + r * .05, r * .5, 0, TAU); ctx.fill(); rr(ctx, x - r * 1.15, y, r * 2.35, r * .55, r * .27); ctx.fill(); };
    const rain = (x, y, r) => { cloud(x, y, r, '#C9D6EE'); ctx.strokeStyle = '#59B5FF'; ctx.lineWidth = r * .14; ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { const ph = (t * 2 + k * .33) % 1; ctx.beginPath(); ctx.moveTo(x - r * .6 + k * r * .6, y + r * .75 + ph * r * .4); ctx.lineTo(x - r * .75 + k * r * .6, y + r * 1.0 + ph * r * .4); ctx.stroke(); } };
    const storm = (x, y, r) => { cloud(x, y, r, '#9AA8C2'); ctx.fillStyle = '#FFD23C'; ctx.beginPath(); ctx.moveTo(x, y + r * .3); ctx.lineTo(x - r * .3, y + r * 1.0); ctx.lineTo(x, y + r * .95); ctx.lineTo(x - r * .15, y + r * 1.45); ctx.lineTo(x + r * .35, y + r * .7); ctx.lineTo(x + r * .05, y + r * .75); ctx.lineTo(x + r * .2, y + r * .3); ctx.fill(); };
    const partly = (x, y, r) => { sun(x + r * .4, y - r * .4, r * .6); cloud(x - r * .1, y + r * .1, r * .8); };
    const SC = [0, 1.3, 2.9];
    const sc = t < SC[1] ? 0 : t < SC[2] ? 1 : 2, lt = t - SC[sc];
    if (sc === 0) {
      // 风暴云：三条对数螺线臂上的发光点，整体转
      const cx = W / 2, cy = H * .46, R0 = (LAND ? 420 : 460) * u, rot = t * 1.4;
      ctx.globalCompositeOperation = 'lighter';
      s.dots.forEach(([a, arm, r1, r2]) => {
        const rr_ = R0 * Math.exp(-a * .28) * (1 + r1 * .2), an = a + arm * TAU / 3 + rot + r2 * .25;
        const x = cx + Math.cos(an) * rr_, y = cy + Math.sin(an) * rr_ * .78, sz = (4 + r1 * 10) * u * (1 + clamp(1 - rr_ / R0));
        const g = ctx.createRadialGradient(x, y, 0, x, y, sz * 2.5);
        g.addColorStop(0, `rgba(220,240,255,${.3 + r2 * .4})`); g.addColorStop(1, 'rgba(120,180,255,0)');
        ctx.fillStyle = g; ctx.fillRect(x - sz * 2.5, y - sz * 2.5, sz * 5, sz * 5);
      });
      ctx.globalCompositeOperation = 'source-over';
      const tp = eOutCubic(clamp((t - .3) / .4));
      ctx.globalAlpha = tp; ctx.fillStyle = WH; ctx.textAlign = 'center';
      ctx.font = `900 ${Math.round(110 * u)}px 'Noto Sans SC'`; shadow(true); ctx.fillText('台风过境', W / 2, H * (LAND ? .86 : .78)); shadow(false);
      ctx.globalAlpha = 1;
    } else if (sc === 1) {
      // 卡 1：温度计 + 大温度 + 风速表盘
      const cw = (LAND ? 1500 : 940) * u, ch = (LAND ? 640 : 1100) * u, x0 = (W - cw) / 2, y0 = LAND ? 170 * u : 330 * u;
      shadow(true); ctx.fillStyle = 'rgba(255,255,255,.14)'; rr(ctx, x0, y0, cw, ch, 40 * u); ctx.fill(); shadow(false);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2 * u; rr(ctx, x0, y0, cw, ch, 40 * u); ctx.stroke();
      const temp = Math.round(lerp(12, 26, eOutCubic(clamp(lt / .8))));
      const tx = x0 + (LAND ? 130 : 110) * u, ty = y0 + (LAND ? 90 : 120) * u, th = (LAND ? 440 : 520) * u;
      ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(ctx, tx, ty, 60 * u, th, 30 * u); ctx.fill();
      ctx.beginPath(); ctx.arc(tx + 30 * u, ty + th + 20 * u, 56 * u, 0, TAU); ctx.fill();
      const lvl = (temp - 0) / 40;
      ctx.fillStyle = '#FF5A3C'; rr(ctx, tx + 14 * u, ty + th - th * lvl, 32 * u, th * lvl + 20 * u, 16 * u); ctx.fill();
      ctx.beginPath(); ctx.arc(tx + 30 * u, ty + th + 20 * u, 42 * u, 0, TAU); ctx.fill();
      for (let k = 0; k <= 8; k++) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(tx + 72 * u, ty + 20 * u + k * (th - 40 * u) / 8, (k % 2 ? 16 : 28) * u, 3 * u); }
      ctx.fillStyle = WH; ctx.textAlign = 'left'; shadow(true);
      ctx.font = `${Math.round(300 * u)}px 'Bebas Neue'`; ctx.fillText(`${temp}°`, tx + 160 * u, ty + 300 * u);
      ctx.font = `700 ${Math.round(48 * u)}px 'Noto Sans SC'`; ctx.fillText('明天 多云转晴', tx + 170 * u, ty + 390 * u); shadow(false);
      partly(tx + (LAND ? 600 : 560) * u, ty + 130 * u, 80 * u);
      // 风速表盘
      const dx = LAND ? x0 + cw - 300 * u : W / 2, dy = LAND ? y0 + ch / 2 : y0 + ch - 260 * u, dr = 190 * u;
      ctx.lineWidth = 26 * u; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.2)';
      ctx.beginPath(); ctx.arc(dx, dy, dr, Math.PI * .75, Math.PI * 2.25); ctx.stroke();
      const wv = eOutCubic(clamp((lt - .3) / .9)) * .62 + .02 * Math.sin(t * 9);
      ctx.strokeStyle = '#7CE0FF'; ctx.beginPath(); ctx.arc(dx, dy, dr, Math.PI * .75, Math.PI * .75 + Math.PI * 1.5 * wv); ctx.stroke();
      const na = Math.PI * .75 + Math.PI * 1.5 * wv;
      ctx.strokeStyle = WH; ctx.lineWidth = 8 * u; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + Math.cos(na) * dr * .75, dy + Math.sin(na) * dr * .75); ctx.stroke();
      ctx.fillStyle = WH; ctx.beginPath(); ctx.arc(dx, dy, 16 * u, 0, TAU); ctx.fill();
      ctx.textAlign = 'center'; ctx.font = `${Math.round(84 * u)}px 'Bebas Neue'`; ctx.fillText(`${Math.round(wv * 12)}`, dx, dy + 110 * u);
      ctx.font = `700 ${Math.round(32 * u)}px 'Noto Sans SC'`; ctx.fillText('风速（级）', dx, dy + 160 * u);
    } else {
      // 卡 2：五日预报条
      const days = [['周一', storm, 22, 17], ['周二', rain, 20, 15], ['周三', partly, 24, 16], ['周四', sun, 27, 18], ['周五', sun, 26, 17]];
      const n = days.length, gap = 24 * u;
      const cw = LAND ? (W - 200 * u - gap * (n - 1)) / n : W - 160 * u, ch = LAND ? 560 * u : (H - 640 * u - gap * (n - 1)) / n;
      days.forEach(([d, icon, hi, lo], i) => {
        const p = eOutBack(clamp((lt - i * .1) / .35), 1.6); if (p <= 0) return;
        const x = LAND ? 100 * u + i * (cw + gap) : 80 * u, y = LAND ? 200 * u : 260 * u + i * (ch + gap);
        ctx.save(); ctx.translate(x + cw / 2, y + ch / 2); ctx.scale(p, p); ctx.translate(-cw / 2, -ch / 2);
        shadow(true); ctx.fillStyle = i === 2 ? 'rgba(255,255,255,.26)' : 'rgba(255,255,255,.14)'; rr(ctx, 0, 0, cw, ch, 32 * u); ctx.fill(); shadow(false);
        ctx.fillStyle = WH; ctx.textAlign = 'center';
        if (LAND) {
          ctx.font = `700 ${Math.round(44 * u)}px 'Noto Sans SC'`; ctx.fillText(d, cw / 2, 80 * u);
          shadow(true); icon(cw / 2, 220 * u, 64 * u); shadow(false);
          ctx.fillStyle = WH; ctx.font = `${Math.round(96 * u)}px 'Bebas Neue'`; ctx.fillText(`${hi}°`, cw / 2, 420 * u);
          ctx.globalAlpha = .65; ctx.font = `${Math.round(60 * u)}px 'Bebas Neue'`; ctx.fillText(`${lo}°`, cw / 2, 490 * u); ctx.globalAlpha = 1;
        } else {
          ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(46 * u)}px 'Noto Sans SC'`; ctx.fillText(d, 50 * u, ch / 2 + 16 * u);
          shadow(true); icon(cw * .42, ch / 2 - 6 * u, 46 * u); shadow(false);
          ctx.fillStyle = WH; ctx.textAlign = 'right'; ctx.font = `${Math.round(84 * u)}px 'Bebas Neue'`; ctx.fillText(`${hi}°`, cw - 160 * u, ch / 2 + 30 * u);
          ctx.globalAlpha = .65; ctx.font = `${Math.round(60 * u)}px 'Bebas Neue'`; ctx.fillText(`${lo}°`, cw - 50 * u, ch / 2 + 24 * u); ctx.globalAlpha = 1;
        }
        ctx.restore();
      });
    }
    // 斜向擦除：切换时一条亮色斜带扫过
    SC.slice(1).forEach(t0 => {
      const p = (t - t0 + .18) / .36; if (p < 0 || p > 1) return;
      const x = lerp(-W * .6, W * 1.4, eInOutCubic(p));
      ctx.fillStyle = '#FFC93C'; ctx.beginPath(); ctx.moveTo(x - 260 * u, 0); ctx.lineTo(x + 120 * u, 0); ctx.lineTo(x - 260 * u + 120 * u - H * .5, H); ctx.lineTo(x - 260 * u - H * .5, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1E3F7A'; ctx.beginPath(); ctx.moveTo(x + 120 * u, 0); ctx.lineTo(x + 700 * u, 0); ctx.lineTo(x + 700 * u - H * .5, H); ctx.lineTo(x + 120 * u - H * .5, H); ctx.closePath(); ctx.fill();
    });
    // 台标、日期徽标
    shadow(true);
    ctx.fillStyle = '#FFC93C'; rr(ctx, 50 * u, 40 * u, 220 * u, 74 * u, 37 * u); ctx.fill();
    shadow(false);
    ctx.fillStyle = '#0C1E45'; ctx.font = `900 ${Math.round(40 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText('天气频道', 160 * u, 92 * u);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(ctx, W - 250 * u, 40 * u, 200 * u, 74 * u, 14 * u); ctx.fill();
    ctx.fillStyle = '#0C1E45'; ctx.font = `${Math.round(48 * u)}px 'Bebas Neue'`; ctx.fillText('11 / 17', W - 150 * u, 94 * u);
    // 快讯条
    const by = H - 90 * u;
    ctx.fillStyle = '#E8343A'; ctx.fillRect(0, by, 170 * u, 90 * u);
    ctx.fillStyle = 'rgba(8,20,50,.92)'; ctx.fillRect(170 * u, by, W, 90 * u);
    ctx.fillStyle = WH; ctx.font = `900 ${Math.round(38 * u)}px 'Noto Sans SC'`; ctx.fillText('快讯', 85 * u, by + 58 * u);
    ctx.save(); ctx.beginPath(); ctx.rect(170 * u, by, W, 90 * u); ctx.clip();
    ctx.font = `700 ${Math.round(36 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'left';
    const msg = '沿海地区注意防风 · 明早有雾，出行减速慢行 · 今日穿衣建议：薄外套 · ';
    const mw = ctx.measureText(msg).width, off = (t * 220 * u) % mw;
    for (let k = 0; k < 3; k++) ctx.fillText(msg, 200 * u - off + k * mw, by + 57 * u);
    ctx.restore();
  }
});
