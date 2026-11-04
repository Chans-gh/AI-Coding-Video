// G-007 插画新闻解说：三张 AI 生成的扁平示意插画（发烫的城区、凉爽的郊外、绿化后的街区），代码排成新闻台版面：顶部栏目条、插画慢推、旁边的数据卡（温度计对比、白天吸热晚上放热、三条降温办法逐条打勾）、底部滚动标题和字幕，换要点时色块擦过画面；角落标明示意图由 AI 生成
// 素材：生图 ×3、语音合成；配乐 CC0。数据卡里的温度计只是示意，不是实测数据
scene({
  id: 'G-007', name: '插画新闻解说', dur: 14, still: 10.4,
  fonts: ["700 40px 'Noto Sans SC'", "900 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 40px 'JetBrains Mono'"],
  text: '资讯解读城市热岛效应城区郊外白天吸热晚上放热多种树屋顶绿化浅色屋面示意图生成不是实测数据降温办法旁白合成配乐柏油路混凝土夏天比周围的热上好几度',
  async init() {
    const A = await loadAssets(), T = k => cueTime(A, k, 99);
    return { A, hot: await loadImage('hot.jpg'), cool: await loadImage('cool.jpg'), green: await loadImage('green.jpg'),
      s2: T('这叫') - .15, s3: T('柏油') - .15, s4: T('多种树') - .15, k1: T('多种树'), k2: T('屋顶'), k3: T('浅色') };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, RED = '#e5322d', NAVY = '#0f1d3a';
    ctx.fillStyle = '#eef1f6'; ctx.fillRect(0, 0, W, H);
    const seg = t < s.s2 ? 0 : t < s.s3 ? 1 : t < s.s4 ? 2 : 3, st = [0, s.s2, s.s3, s.s4][seg];
    // 版面：插画窗口和数据卡
    const top = 110 * u, bot = (LAND ? 150 : 260) * u;
    const pic = LAND ? [40 * u, top, W * .6, H - top - bot] : [40 * u, top, W - 80 * u, H * .42];
    const card = LAND ? [W * .6 + 70 * u, top, W * .4 - 110 * u, H - top - bot] : [40 * u, top + H * .42 + 30 * u, W - 80 * u, H - top - bot - H * .42 - 30 * u];
    // 插画
    ctx.save(); rr(ctx, ...pic, 18 * u); ctx.clip();
    const lt = t - st;
    if (seg === 1) {                     // 城区和郊外左右对照
      const half = pic[2] / 2, k = eInOutCubic(inv(st, st + .6, t));
      drawCover(ctx, s.hot, pic[0], pic[1], pic[2], pic[3], { zoom: 1.1 });
      ctx.save(); ctx.beginPath(); ctx.rect(pic[0] + pic[2] - half * k, pic[1], half * k + 1, pic[3]); ctx.clip();
      drawCover(ctx, s.cool, pic[0] + half, pic[1], half, pic[3], { zoom: 1.05 }); ctx.restore();
      tag(ctx, '城区', pic[0] + 20 * u, pic[1] + 20 * u, RED, u); if (k > .9) tag(ctx, '郊外', pic[0] + half + 20 * u, pic[1] + 20 * u, '#1f7a8c', u);
    } else {
      const img = [s.hot, null, s.hot, s.green][seg];
      drawCover(ctx, img, ...pic, { zoom: seg === 2 ? lerp(1.3, 1.45, lt / 3.3) : lerp(1.05, 1.15, lt / 4.5), fy: seg === 2 ? .8 : .5 });
    }
    ctx.restore();
    ctx.save(); ctx.font = `700 ${18 * u}px 'Noto Sans SC'`; const lab = '示意图 · AI 生成', lw = ctx.measureText(lab).width + 24 * u;
    ctx.fillStyle = 'rgba(15,29,58,.75)'; rr(ctx, pic[0] + pic[2] - lw - 14 * u, pic[1] + pic[3] - 44 * u, lw, 32 * u, 6 * u); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(lab, pic[0] + pic[2] - lw - 2 * u, pic[1] + pic[3] - 28 * u); ctx.restore();
    // 数据卡
    ctx.save(); rr(ctx, ...card, 18 * u); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(15,29,58,.15)'; ctx.shadowBlur = 24 * u; ctx.fill(); ctx.restore();
    const [cx, cy, cw, ch] = card, a = smooth(st, st + .4, t);
    ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic';
    if (seg === 0) {                     // 两支温度计：城区高、郊外低（示意）
      head(ctx, '城区比郊外热', cx, cy, cw, u);
      const lv = eOutCubic(inv(.8, 2.8, t));
      thermo(ctx, cx + cw * .3, cy + ch * .25, ch * .55, .45 + .4 * lv, RED, '城区', u);
      thermo(ctx, cx + cw * .7, cy + ch * .25, ch * .55, .45 + .12 * lv, '#1f7a8c', '郊外', u);
      ctx.font = `400 ${18 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#7a8597'; ctx.textAlign = 'center'; ctx.fillText('示意，不是实测数据', cx + cw / 2, cy + ch - 24 * u);
    } else if (seg === 1) {
      ctx.textAlign = 'center'; ctx.fillStyle = RED; ctx.font = `900 ${(LAND ? 70 : 84) * u}px 'Noto Sans SC'`;
      const k = eOutBack(inv(st + .2, st + .6, t)); ctx.translate(cx + cw / 2, cy + ch / 2); ctx.scale(k, k);
      ctx.fillText('城市', 0, -20 * u); ctx.fillText('热岛效应', 0, (LAND ? 70 : 84) * u);
      ctx.font = `700 ${22 * u}px 'JetBrains Mono'`; ctx.fillStyle = '#7a8597'; ctx.fillText('URBAN HEAT ISLAND', 0, (LAND ? 130 : 150) * u);
    } else if (seg === 2) {              // 白天吸热、晚上放热：太阳和月亮，箭头进出地面
      head(ctx, '白天吸热，晚上放热', cx, cy, cw, u);
      const gy = cy + ch * .7, day = t < st + 1.9;
      ctx.fillStyle = '#3a3f4b'; ctx.fillRect(cx + 30 * u, gy, cw - 60 * u, 40 * u);
      ctx.fillStyle = '#9aa3b2'; ctx.font = `700 ${18 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText('柏油路 · 混凝土', cx + cw / 2, gy + 70 * u);
      const ix = cx + cw / 2, iy = cy + ch * .32;
      ctx.beginPath(); ctx.arc(ix, iy, 38 * u, 0, Math.PI * 2); ctx.fillStyle = day ? '#f7b538' : '#c9d3e6'; ctx.fill();
      if (!day) { ctx.beginPath(); ctx.arc(ix + 18 * u, iy - 10 * u, 34 * u, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); }
      for (let i = 0; i < 3; i++) {
        const x = ix + (i - 1) * 70 * u, p = ((t * 1.2 + i * .33) % 1);
        const y0 = day ? iy + 50 * u : gy - 10 * u, y1 = day ? gy - 10 * u : iy + 50 * u, y = lerp(y0, y1, p);
        ctx.strokeStyle = day ? 'rgba(229,50,45,.8)' : 'rgba(229,50,45,.5)'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.moveTo(x, y - (day ? 30 : -30) * u); ctx.lineTo(x, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 10 * u, y + (day ? -12 : 12) * u); ctx.lineTo(x, y); ctx.lineTo(x + 10 * u, y + (day ? -12 : 12) * u); ctx.stroke();
      }
      ctx.font = `900 ${30 * u}px 'Noto Sans SC'`; ctx.fillStyle = NAVY; ctx.fillText(day ? '白天：吸热' : '晚上：放热', ix, cy + ch * .55);
    } else {                             // 三条降温办法，旁白说到就打勾
      head(ctx, '怎么降温', cx, cy, cw, u);
      [[s.k1, '多种树'], [s.k2, '屋顶绿化'], [s.k3, '浅色屋面']].forEach(([kt, txt], i) => {
        const y = cy + ch * (.32 + i * .2), k = eOutBack(inv(kt, kt + .35, t));
        ctx.globalAlpha = a * (.35 + .65 * smooth(kt - .1, kt + .2, t));
        rr(ctx, cx + 30 * u, y - 30 * u, 52 * u, 52 * u, 10 * u); ctx.lineWidth = 3 * u; ctx.strokeStyle = '#2a9d5c'; ctx.stroke();
        if (k > 0) { ctx.save(); ctx.translate(cx + 56 * u, y - 4 * u); ctx.scale(k, k); ctx.strokeStyle = '#2a9d5c'; ctx.lineWidth = 7 * u; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-14 * u, 0); ctx.lineTo(-3 * u, 12 * u); ctx.lineTo(16 * u, -14 * u); ctx.stroke(); ctx.restore(); }
        ctx.font = `900 ${(LAND ? 40 : 44) * u}px 'Noto Sans SC'`; ctx.fillStyle = NAVY; ctx.textAlign = 'left'; ctx.fillText(txt, cx + 110 * u, y + 12 * u);
      });
    }
    ctx.restore();
    // 色块擦过：换要点时一红一深蓝两条斜块扫过
    for (const w0 of [s.s2, s.s3, s.s4]) {
      const p = inv(w0 - .35, w0 + .35, t);
      if (p > 0 && p < 1) [[RED, 0], [NAVY, .12]].forEach(([c, d]) => {
        const q = eInOutCubic(clamp((p - d) / .88, 0, 1)), x = lerp(-W * .6, W * 1.2, q);
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + W * .35, 0); ctx.lineTo(x + W * .2, H); ctx.lineTo(x - W * .15, H); ctx.fill();
      });
    }
    // 顶部栏目条
    ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, 80 * u); ctx.fillStyle = RED; ctx.fillRect(0, 0, 200 * u, 80 * u);
    ctx.fillStyle = '#fff'; ctx.font = `900 ${32 * u}px 'Noto Sans SC'`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillText('资讯解读', 100 * u, 41 * u);
    ctx.textAlign = 'left'; ctx.font = `700 ${30 * u}px 'Noto Sans SC'`; ctx.fillText('城市热岛效应', 230 * u, 41 * u);
    // 底部滚动条
    const ty = H - 50 * u; ctx.fillStyle = NAVY; ctx.fillRect(0, ty, W, 50 * u);
    ctx.save(); ctx.beginPath(); ctx.rect(0, ty, W, 50 * u); ctx.clip();
    ctx.font = `400 ${22 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#cfd6e4';
    const tick = '夏天的城区比郊外热上好几度　·　柏油路和混凝土白天吸热、晚上放热　·　多种树、做屋顶绿化、刷浅色屋面都能降温　·　示意图由 AI 生成　·　';
    const tw = ctx.measureText(tick).width, off = (t * 140 * u) % tw;
    ctx.fillText(tick, -off, ty + 27 * u); ctx.fillText(tick, tw - off, ty + 27 * u); ctx.restore();
    // 字幕、署名
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, { size: LAND ? 34 : 40, bg: 'rgba(15,29,58,.88)', y: ty - (LAND ? 20 : 30) * u, maxW: W * .9 });
    ctx.save(); ctx.font = `400 ${15 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(credits(s.A), W - 24 * u, 41 * u); ctx.restore();
  },
});

function head(ctx, text, x, y, w, u) {
  ctx.font = `900 ${34 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#0f1d3a'; ctx.textAlign = 'left'; ctx.fillText(text, x + 30 * u, y + 60 * u);
  ctx.fillStyle = '#e5322d'; ctx.fillRect(x + 30 * u, y + 76 * u, 60 * u, 6 * u);
}
function tag(ctx, text, x, y, c, u) {
  ctx.save(); ctx.font = `900 ${28 * u}px 'Noto Sans SC'`; const w = ctx.measureText(text).width + 30 * u;
  ctx.fillStyle = c; rr(ctx, x, y, w, 46 * u, 8 * u); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 15 * u, y + 24 * u); ctx.restore();
}
// 温度计：v 是 0–1 的液面高度
function thermo(ctx, x, y, h, v, c, label, u) {
  const w = 34 * u;
  rr(ctx, x - w / 2, y, w, h, w / 2); ctx.fillStyle = '#eef1f6'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y + h + 10 * u, w * .9, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
  const lh = (h - 10 * u) * v; rr(ctx, x - w / 2 + 7 * u, y + h - lh, w - 14 * u, lh + 10 * u, (w - 14 * u) / 2); ctx.fill();
  ctx.font = `900 ${30 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#0f1d3a'; ctx.textAlign = 'center'; ctx.fillText(label, x, y + h + 80 * u);
}
