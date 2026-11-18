// C-157 粗描边贴纸科普：Canvas 2D 在一张比画面大好几倍的“世界”画布坐标里排好三个信息点，物件（地球、冰山、水滴）都是扁平矢量，先用很粗的白色描边加小投影画一遍当贴纸白边，再画本体；镜头按关键帧用 eInOutCubic 长缓动在三点之间平移缩放，每到一点有贴纸 eOutBack 弹出，柱状图按缓动长高、数字滚动，细线标注从物件引出。
// 风格提示词：用粗描边贴纸科普风格：米白或蓝灰底的超大画布上铺满带粗白边和小投影的“贴纸”，物件全部用代码画成扁平插画再加白边，旁边是精确的柱状图、滚动数字和细线标注，镜头用长缓动在画布上平移缩放、串起一个个信息点，每句解说都有新元素弹出，只用两三种克制的配色。
// 题材：信息讲解与产品发布 · 适合：硬核科普、财经知识、企业介绍
scene({
  id: 'C-157', name: '粗描边贴纸科普', dur: 5, still: 4.6,
  text: '地球上的水海淡水里冰川地下地表湖河能直接用的不到其中%总量',
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  init() { return { dots: Array.from({ length: 220 }, (_, i) => [(hash1(i) - .5) * 9000, (hash1(i + 500) - .5) * 9000]) }; },
  draw(ctx, t, s) {
    const u = SHORT / 1080, NAVY = '#1F2B47', ORG = '#EE6338', BG = '#DDE4EA', PALE = '#9DB3C9';
    // 三个信息点的世界坐标（单位 u）和镜头缩放
    const PTS = LAND ? [[0, 0, 1], [1700, 420, .95], [3200, -120, 1.1]] : [[0, 0, 1.4], [80, 1960, 1.12], [-60, 3700, 1.5]];
    const key = [[0, 0], [1.4, 0], [2.2, 1], [3.3, 1], [4.1, 2]];
    let a = 0, b = 0, q = 0; for (let i = 0; i < key.length - 1; i++) if (t >= key[i][0]) { a = key[i][1]; b = key[i + 1][1]; q = eInOutCubic(inv(key[i][0], key[i + 1][0], t)); }
    if (t >= key[key.length - 1][0]) { a = b = key[key.length - 1][1]; q = 0; }
    const camX = lerp(PTS[a][0], PTS[b][0], q) * u, camY = lerp(PTS[a][1], PTS[b][1], q) * u, z = lerp(PTS[a][2], PTS[b][2], q) * (1 - .08 * Math.sin(q * Math.PI)) * (1 + .02 * t);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-camX, -camY);
    ctx.fillStyle = 'rgba(31,43,71,.12)'; for (const [x, y] of s.dots) { ctx.beginPath(); ctx.arc(x * u, y * u, 4 * u, 0, TAU); ctx.fill(); }   // 底纹点阵
    // 贴纸：白色粗描边 + 小投影，再画本体
    const sticker = (x, y, t0, path, body) => {
      const p = eOutBack(inv(t0, t0 + .35, t), 2); if (p <= 0) return;
      ctx.save(); ctx.translate(x * u, y * u); ctx.scale(p, p); ctx.rotate((1 - p) * .3);
      ctx.shadowColor = 'rgba(20,30,50,.3)'; ctx.shadowBlur = 10 * u; ctx.shadowOffsetY = 8 * u;
      ctx.lineJoin = 'round'; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 34 * u; ctx.beginPath(); path(); ctx.stroke(); ctx.fillStyle = '#FFF'; ctx.fill();
      ctx.shadowColor = 'transparent'; body(); ctx.restore();
    };
    const label = (x, y, txt, size, col, t0, align = 'left', font = '900') => { const p = inv(t0, t0 + .25, t); if (p <= 0) return; ctx.globalAlpha = p; ctx.fillStyle = col; ctx.font = `${font} ${size * u}px 'Noto Sans SC'`; ctx.textAlign = align; ctx.fillText(txt, x * u, (y + (1 - p) * 20) * u); ctx.globalAlpha = 1; };
    const leader = (x0, y0, x1, y1, t0) => { const p = eOutCubic(inv(t0, t0 + .3, t)); if (p <= 0) return; ctx.strokeStyle = NAVY; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(x0 * u, y0 * u); ctx.lineTo(lerp(x0, x1, p) * u, lerp(y0, y1, p) * u); ctx.stroke(); ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(x0 * u, y0 * u, 7 * u, 0, TAU); ctx.fill(); };
    const roll = (v, t0, t1, dec = 1) => (v * eOutCubic(inv(t0, t1, t))).toFixed(dec);
    // ① 地球：97.5% 是海水
    const [x1, y1] = PTS[0], gx = x1 + (LAND ? -280 : 0), gy = y1 + (LAND ? 0 : -200);
    sticker(gx, gy, .05, () => ctx.arc(0, 0, 230 * u, 0, TAU), () => {
      ctx.fillStyle = NAVY; ctx.beginPath(); ctx.arc(0, 0, 230 * u, 0, TAU); ctx.fill(); ctx.save(); ctx.clip();
      ctx.fillStyle = ORG; for (const [bx, by, r] of [[-60, -80, 90], [90, 40, 70], [-120, 120, 50], [160, -130, 40]]) { const xx = ((bx + t * 40 + 400) % 560) - 280; ctx.beginPath(); ctx.ellipse(xx * u, by * u, r * u, r * .7 * u, .4, 0, TAU); ctx.fill(); }
      ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 10 * u; ctx.beginPath(); ctx.arc(0, 0, 200 * u, 3.6, 4.4); ctx.stroke();
    });
    const tx = LAND ? x1 + 40 : x1 - 330, ty = LAND ? y1 - 60 : y1 + 160;
    label(tx, ty - 60, '地球上的水', 54, NAVY, .3);
    const p1 = inv(.5, .7, t); if (p1 > 0) { ctx.globalAlpha = p1; ctx.fillStyle = ORG; ctx.font = `${230 * u}px 'Bebas Neue'`; ctx.textAlign = 'left'; ctx.fillText(roll(97.5, .5, 1.3) + '%', tx * u, (ty + 160) * u); ctx.globalAlpha = 1; }
    label(tx + 6, ty + 220, '是海水，淡水只占 2.5%', 40, NAVY, .9, 'left', '700');
    // ② 淡水里：冰川、地下水、地表水 —— 柱状图
    const [x2, y2] = PTS[1], data = [['冰川', 68.7], ['地下水', 30.1], ['地表水', 1.2]], bw = 150, gap = 90, bh = 520, ox = x2 - (bw * 3 + gap * 2) / 2, base = y2 + 260;
    label(x2, y2 - 330, '这 2.5% 的淡水里', 54, NAVY, 1.9, 'center');
    ctx.strokeStyle = NAVY; ctx.lineWidth = 3 * u; const axp = eOutCubic(inv(2.0, 2.3, t)); if (axp > 0) { ctx.beginPath(); ctx.moveTo((ox - 40) * u, base * u); ctx.lineTo(lerp(ox - 40, ox + bw * 3 + gap * 2 + 40, axp) * u, base * u); ctx.stroke(); }
    data.forEach(([name, v], i) => {
      const t0 = 2.2 + i * .18, g = eOutCubic(inv(t0, t0 + .7, t)), h = bh * v / 70 * g, x = ox + i * (bw + gap);
      if (g <= 0) return;
      ctx.fillStyle = i === 0 ? ORG : NAVY; rr(ctx, x * u, (base - h) * u, bw * u, h * u, [12 * u, 12 * u, 0, 0]); ctx.fill();
      ctx.fillStyle = NAVY; ctx.font = `${74 * u}px 'Bebas Neue'`; ctx.textAlign = 'center'; ctx.fillText(roll(v, t0, t0 + .7) + '%', (x + bw / 2) * u, (base - h - 18) * u);
      ctx.font = `700 ${36 * u}px 'Noto Sans SC'`; ctx.fillText(name, (x + bw / 2) * u, (base + 52) * u);
    });
    sticker(LAND ? ox + bw * 3 + gap * 2 + 120 : x2, LAND ? base - 380 : base + 230, 2.5, () => { ctx.moveTo(-90 * u, 50 * u); ctx.lineTo(-40 * u, -70 * u); ctx.lineTo(10 * u, -30 * u); ctx.lineTo(50 * u, -90 * u); ctx.lineTo(100 * u, 50 * u); ctx.closePath(); }, () => {
      ctx.fillStyle = '#EAF2F8'; ctx.beginPath(); ctx.moveTo(-90 * u, 50 * u); ctx.lineTo(-40 * u, -70 * u); ctx.lineTo(10 * u, -30 * u); ctx.lineTo(50 * u, -90 * u); ctx.lineTo(100 * u, 50 * u); ctx.closePath(); ctx.fill();
      ctx.fillStyle = PALE; ctx.beginPath(); ctx.moveTo(10 * u, -30 * u); ctx.lineTo(50 * u, -90 * u); ctx.lineTo(100 * u, 50 * u); ctx.lineTo(30 * u, 50 * u); ctx.fill();
      ctx.fillStyle = NAVY; ctx.fillRect(-110 * u, 40 * u, 230 * u, 22 * u);
    });
    // ③ 能直接用的：不到 1%
    const [x3, y3] = PTS[2], dx = x3 + (LAND ? -260 : 0), dy = y3 + (LAND ? 0 : -230);
    const drop = () => { ctx.moveTo(0, -170 * u); ctx.bezierCurveTo(60 * u, -80 * u, 130 * u, -10 * u, 130 * u, 60 * u); ctx.arc(0, 60 * u, 130 * u, 0, Math.PI); ctx.bezierCurveTo(-130 * u, -10 * u, -60 * u, -80 * u, 0, -170 * u); };
    sticker(dx, dy, 3.9, drop, () => { ctx.fillStyle = ORG; ctx.beginPath(); drop(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(-55 * u, 50 * u, 22 * u, 40 * u, .3, 0, TAU); ctx.fill(); });
    const lx = LAND ? x3 + 20 : x3 - 300, ly = LAND ? y3 - 40 : y3 + 120;
    leader(dx + (LAND ? 140 : 100), dy + (LAND ? -20 : 120), lx - 10, ly - 70, 4.1);
    label(lx, ly - 80, '湖泊和河流里', 48, NAVY, 4.15, 'left', '700');
    label(lx, ly + 70, '能直接用的', 72, NAVY, 4.25);
    const p3 = inv(4.35, 4.55, t); if (p3 > 0) { ctx.globalAlpha = p3; ctx.fillStyle = ORG; ctx.font = `900 ${100 * u}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.fillText('不到总量 1%', lx * u, (ly + 200) * u); ctx.globalAlpha = 1; }
    ctx.restore();
    // 进度点：第几个信息点
    for (let i = 0; i < 3; i++) { const on = Math.round(lerp(a, b, q)) === i; ctx.fillStyle = on ? NAVY : 'rgba(31,43,71,.25)'; ctx.beginPath(); ctx.arc(W / 2 + (i - 1) * 34 * u, H - 50 * u, (on ? 10 : 7) * u, 0, TAU); ctx.fill(); }
  }
});
