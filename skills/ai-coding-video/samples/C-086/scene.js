// C-086 无缝循环科普插画：Canvas 2D 分层平涂山、海、森林和云，所有运动都写成 t/时长 的周期函数（水汽上升、雨滴下落、河水流动都取 (相位 + i/n) 的小数部分，波浪平移正好一个波长），4 个阶段的中英标签按相位轮流亮起，最后一帧和第一帧完全相同。
// 风格提示词：用扁平分层插画的无缝循环风格：柔和低饱和配色的风景（海、雪山、森林、河流），云和雨是分层平涂而非写实体积，过程按阶段出现中英小标签，所有运动都是周期函数，最后一帧与第一帧完全一致可无限循环。
// 题材：信息讲解与产品发布 · 适合：科普素材、网站背景、展厅屏幕
scene({
  id: 'C-086', name: '无缝循环科普插画', dur: 4, still: 1.2,
  text: '水循环蒸发凝结降水径流',
  fonts: ["700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'"],
  init() {
    const R = mulberry32(86), trees = [];
    for (let i = 0; i < 46; i++) trees.push([R(), R(), .6 + R() * .6, R()]);
    return { trees };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, P = 4, ph = (t % P) / P, A = ph * TAU;
    const gy = H * (LAND ? .66 : .64);                         // 地平线
    const X = f => f * W, Y = f => f * H;
    const poly = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.fill(); };
    // 天空：三条色带
    [['#DCE6E2', 0], ['#E7E8DA', .3], ['#EFE6D2', .52]].forEach(([c, f]) => { ctx.fillStyle = c; ctx.fillRect(0, f * gy, W, gy); });
    // 太阳：12 道光，一个周期转 1/12 圈，首尾一致
    const sx = X(LAND ? .8 : .78), sy = Y(LAND ? .17 : .13);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(A / 12);
    ctx.fillStyle = '#F2D59A';
    for (let k = 0; k < 12; k++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(-10 * u, 95 * u); ctx.lineTo(10 * u, 95 * u); ctx.lineTo(0, 135 * u); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#EDC27A'; ctx.beginPath(); ctx.arc(sx, sy, 78 * u, 0, TAU); ctx.fill();
    ctx.fillStyle = '#F5D79B'; ctx.beginPath(); ctx.arc(sx - 10 * u, sy - 10 * u, 56 * u, 0, TAU); ctx.fill();
    // 远山、雪山
    const pk = [X(LAND ? .22 : .3), gy - 470 * u];
    poly([[0, gy], [X(.02), gy - 260 * u], [X(LAND ? .1 : .12), gy - 330 * u], [X(LAND ? .44 : .7), gy]], '#A9BCC0');
    poly([[X(-.05), gy], [pk[0], pk[1]], [X(LAND ? .5 : .78), gy]], '#7E99A0');
    poly([[pk[0] - 0, gy], [pk[0], pk[1]], [X(LAND ? .5 : .78), gy]], '#6A858D');
    const sc = 120 * u, sl = (pk[0] - X(-.05)) / (gy - pk[1]), sr = (X(LAND ? .5 : .78) - pk[0]) / (gy - pk[1]);
    poly([[pk[0] - sc * sl, pk[1] + sc], [pk[0], pk[1]], [pk[0] + sc * sr, pk[1] + sc], [pk[0] + sc * sr * .5, pk[1] + sc * .78], [pk[0] + sc * sr * .1, pk[1] + sc * 1.02], [pk[0] - sc * sl * .4, pk[1] + sc * .8]], '#F4F2EA');
    // 地面、海
    const sea0 = X(LAND ? .56 : .5);
    ctx.fillStyle = '#B7C79A'; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = '#9FB386'; ctx.fillRect(0, gy + (H - gy) * .45, W, H);
    ctx.fillStyle = '#7FA7B0'; ctx.beginPath(); ctx.moveTo(sea0 - 120 * u, H); ctx.quadraticCurveTo(sea0 - 40 * u, gy + 20 * u, sea0 + 80 * u, gy); ctx.lineTo(W, gy); ctx.lineTo(W, H); ctx.fill();
    // 波浪线：每周期平移一个波长
    const wl = 120 * u; ctx.strokeStyle = 'rgba(240,244,236,.75)'; ctx.lineWidth = 5 * u; ctx.lineCap = 'round';
    for (let r = 0; r < 5; r++) {
      const yy = gy + 40 * u + r * (H - gy) / 5.5, x0 = sea0 + 40 * u + r * 30 * u, dir = r % 2 ? 1 : -1;
      ctx.save(); ctx.beginPath(); ctx.rect(x0, yy - 20 * u, W - x0, 40 * u); ctx.clip(); ctx.beginPath();
      for (let x = x0 - wl * 2; x < W + wl; x += wl) { const ox = x + dir * ph * wl; ctx.moveTo(ox, yy); ctx.quadraticCurveTo(ox + wl * .25, yy - 10 * u, ox + wl * .5, yy); }
      ctx.stroke(); ctx.restore();
    }
    // 河：从山脚蜿蜒入海，流动的短划
    const river = []; for (let i = 0; i <= 40; i++) { const q = i / 40; river.push([lerp(pk[0] + 40 * u, sea0 + 20 * u, q), gy + 6 * u + q * q * (H - gy) * .55 + Math.sin(q * 7) * 40 * u]); }
    ctx.strokeStyle = '#8DB3B8'; ctx.lineWidth = 34 * u; ctx.beginPath(); river.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    ctx.strokeStyle = '#E6EFE8'; ctx.lineWidth = 5 * u;
    for (let i = 0; i < 7; i++) { const q = (ph + i / 7) % 1, a = Math.floor(q * 38); ctx.globalAlpha = Math.sin(q * Math.PI); ctx.beginPath(); ctx.moveTo(...river[a]); ctx.lineTo(...river[a + 2]); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // 森林：三角树，轻摆（整数倍频率）
    for (const [fx, fy, sz, p] of s.trees) {
      const x = lerp(X(.0), sea0 - 160 * u, fx), y = gy + 18 * u + fy * (H - gy) * .5, h = 70 * u * sz, sw = Math.sin(A + p * TAU) * 4 * u;
      if (Math.abs(x - river[Math.round(fx * 40)][0]) < 30 * u && fy > .2) continue;
      poly([[x - h * .3, y], [x + sw, y - h], [x + h * .3, y]], p > .5 ? '#6E8C6B' : '#5D7B5E');
      poly([[x, y], [x + sw, y - h], [x + h * .3, y]], 'rgba(30,50,35,.18)');
    }
    // 蒸发：海面升起的水汽，周期上升、两头淡出
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 6 * u;
    for (let i = 0; i < 9; i++) {
      const q = (ph + i / 9) % 1, x = sea0 + 140 * u + (i % 3) * 110 * u + Math.floor(i / 3) * 40 * u, y = gy - q * 300 * u;
      ctx.globalAlpha = Math.sin(q * Math.PI) * .9; ctx.beginPath();
      for (let k = 0; k <= 8; k++) ctx.lineTo(x + Math.sin(k * .9 + q * 6) * 10 * u, y - k * 9 * u);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // 云：分层平涂椭圆，左右周期漂移；山上的云下雨
    const cloud = (cx, cy, k, c1, c2) => {
      [[-70, 10, 70, 44], [0, -20, 90, 60], [80, 8, 70, 46], [20, 24, 120, 36]].forEach(([dx, dy, rx, ry]) => { ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(cx + dx * k * u, cy + dy * k * u, rx * k * u, ry * k * u, 0, 0, TAU); ctx.fill(); });
      ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(cx + 10 * k * u, cy + 40 * k * u, 140 * k * u, 16 * k * u, 0, 0, TAU); ctx.fill();
    };
    const cA = [X(LAND ? .62 : .66) + Math.sin(A) * 30 * u, Y(LAND ? .3 : .27)];
    const cB = [pk[0] + 90 * u + Math.sin(A + 1) * 18 * u, pk[1] - 40 * u + Math.cos(A) * 6 * u];
    cloud(cA[0], cA[1], 1, '#F7F5EE', '#D8DDD6');
    // 雨：两倍频率下落
    ctx.strokeStyle = '#7E9CB0'; ctx.lineWidth = 4 * u;
    for (let i = 0; i < 16; i++) {
      const q = (ph * 2 + hash1(i) ) % 1, x = cB[0] - 120 * u + (i / 15) * 240 * u, y = cB[1] + 50 * u + q * 230 * u;
      ctx.globalAlpha = Math.sin(q * Math.PI); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6 * u, y + 24 * u); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    cloud(cB[0], cB[1], 1.15, '#C9D3D6', '#A9B6BC');
    cloud(X(LAND ? .4 : .2) - Math.sin(A) * 22 * u, Y(LAND ? .12 : .1), .6, '#F2F1EA', '#DDE0D9');
    // 阶段标签：按相位轮流亮起（圆周距离，首尾一致）
    const tag = (c, x, y, zh, en) => {
      const d = Math.min(Math.abs(ph - c), 1 - Math.abs(ph - c)), a = smooth(.2, .08, d);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y + (1 - a) * 14 * u);
      ctx.font = `700 ${34 * u}px 'Noto Sans SC'`; const w1 = ctx.measureText(zh).width;
      ctx.font = `400 ${24 * u}px 'Noto Sans SC'`; const w2 = ctx.measureText(en).width, w = Math.max(w1, w2) + 44 * u;
      ctx.fillStyle = '#3F5B63'; rr(ctx, -w / 2, -44 * u, w, 88 * u, 44 * u); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-10 * u, 42 * u); ctx.lineTo(10 * u, 42 * u); ctx.lineTo(0, 58 * u); ctx.fill();
      ctx.fillStyle = '#F4EFE3'; ctx.textAlign = 'center';
      ctx.font = `700 ${34 * u}px 'Noto Sans SC'`; ctx.fillText(zh, 0, -2 * u);
      ctx.fillStyle = '#C9D9D6'; ctx.font = `400 ${24 * u}px 'Noto Sans SC'`; ctx.fillText(en, 0, 30 * u);
      ctx.restore();
    };
    tag(.125, sea0 + 230 * u, gy - 360 * u, '蒸发', 'Evaporation');
    tag(.375, cA[0], cA[1] - 120 * u, '凝结', 'Condensation');
    tag(.625, cB[0] + (LAND ? 270 : 210) * u, cB[1] + 120 * u, '降水', 'Precipitation');
    tag(.875, river[24][0], river[24][1] - 90 * u, '径流', 'Runoff');
    // 标题
    ctx.textAlign = 'left'; ctx.fillStyle = '#3F5B63'; ctx.font = `700 ${46 * u}px 'Noto Sans SC'`;
    ctx.fillText('水循环', 60 * u, 96 * u);
    ctx.fillStyle = '#7C9398'; ctx.font = `400 ${26 * u}px 'Noto Sans SC'`; ctx.fillText('The Water Cycle', 62 * u, 136 * u);
    // 循环进度：一圈四段
    ctx.strokeStyle = 'rgba(63,91,99,.25)'; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.arc(W - 70 * u, H - 70 * u, 28 * u, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#3F5B63'; ctx.beginPath(); ctx.arc(W - 70 * u, H - 70 * u, 28 * u, -Math.PI / 2 + A - .5, -Math.PI / 2 + A); ctx.stroke();
  }
});
