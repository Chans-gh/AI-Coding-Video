// C-154 逐帧沸腾线：Canvas 2D 的每一笔都是“中心线 + 沿法线左右偏移的宽度”围成的多边形，宽度两头细中间粗，模拟手的压力；每笔按「线稿版本号 × 笔画号」取哈希抖动顶点，版本号每 2 帧在 3 个之间轮换，所以静止时也在呼吸；动作时间按 15 格/秒取整（一拍二），只有冲刺那 0.2 秒按帧走，并且只插一帧拉长的拖影；水花、烟团、速度线和拟声字都同样逐格画。
// 风格提示词：用逐帧沸腾线风格：米白纸纹底上用粗细随压力变化的手绘线勾出形象，每张线稿准备三四个细微不同的版本、每两帧轮换一次，让静止画面也像在呼吸，动作以一拍二为主、快动作切一拍一，快速位移时只插一帧拉长的拖影，烟雾、水花和速度线逐帧手绘叠在主体上。
// 题材：卡通与动漫 · 适合：品牌短片、手作感片头、角色小剧场
scene({
  id: 'C-154', name: '逐帧沸腾线', dur: 5, still: 2.1,
  fonts: ["400 80px 'Ma Shan Zheng'"],
  text: '啪嗒！抖抖抖',
  init() { return { paper: makePaper('#F6F0E2', { seed: 154, blot: 3, grain: 12, fiber: .35 }) }; },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, INK = '#1E1A16', ver = (f >> 1) % 3;
    const dash = t >= 1.6 && t < 1.8, tt = dash ? t : stepT(t, 15);   // 一拍二；冲刺时一拍一
    ctx.drawImage(s.paper, 0, 0, W, H);
    let sid = 0;
    // 一笔：中心线 → 带压力的多边形
    const ink = (pts, w, closed = false, col = INK) => {
      const id = sid++, n = Math.max(8, Math.round(polyLen(pts) / (6 * u))), P = resample(pts, n - 1).map(q => [q.x, q.y]);
      const J = P.map(([x, y], i) => [x + (hash2(i * 31 + id * 977, ver * 7 + id * 13) - .5) * 4.5 * u, y + (hash2(i * 17 + id * 593, ver * 5 + 11) - .5) * 4.5 * u]);
      const L = [], Rr = [];
      J.forEach((p, i) => {
        const a = J[Math.max(0, i - 1)], b = J[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        const k = i / (n - 1), pr = closed ? .65 + .35 * Math.sin(k * TAU * 2 + id + ver) : Math.pow(Math.sin(k * Math.PI), .6);
        const hw = w * 1.5 * u * (.15 + .85 * pr) * (.85 + .3 * hash1(i * 9 + id * 101 + ver * 3001)) / 2;
        L.push([p[0] - dy / l * hw, p[1] + dx / l * hw]); Rr.push([p[0] + dy / l * hw, p[1] - dx / l * hw]);
      });
      ctx.fillStyle = col; ctx.beginPath(); [...L, ...Rr.reverse()].forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
    };
    const tone = (pts, col) => { const o = (ver - 1) * 3 * u; ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x + o, y - o) : ctx.moveTo(x + o, y - o)); ctx.closePath(); ctx.fill(); };
    const ell = (x, y, rx, ry, a0 = 0, a1 = TAU, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [x + Math.cos(a) * rx, y + Math.sin(a) * ry]; });
    // 场景：地面线、水洼
    const gy = LAND ? H * .74 : H * .68, x0 = W * (LAND ? .2 : .24), x1 = W * (LAND ? .66 : .6), R = (LAND ? 190 : 210) * u;
    ink([[W * .04, gy + 8 * u], [W * .5, gy - 4 * u], [W * .96, gy + 6 * u]], 9);
    tone(ell(x1, gy + 34 * u, 300 * u, 46 * u), 'rgba(110,170,220,.45)');
    ink(ell(x1, gy + 34 * u, 300 * u, 46 * u, Math.PI * 1.05, Math.PI * 2.85), 7);
    for (let k = 0; k < 4; k++) ink([[x1 - 200 * u + k * 100 * u, gy + 40 * u], [x1 - 150 * u + k * 100 * u, gy + 40 * u]], 4);
    // 角色位置与形变
    const dk = clamp((tt - 1.6) / .2), ant = tt > 1.15 && tt < 1.6 ? Math.sin((tt - 1.15) / .45 * Math.PI) : 0;
    let cx = lerp(x0, x1, eInOutCubic(dk)) - ant * 30 * u, sx = 1 + ant * .15, sy = 1 - ant * .18;
    const land = tt - 1.8; if (land >= 0 && land < .35) { const q = Math.sin(land / .35 * Math.PI); sx = 1 + q * .25; sy = 1 - q * .25; }
    const shake = tt > 3.0 && tt < 3.7; if (shake) { const w = ((f >> 1) % 2 ? 1 : -1); sx = 1 + w * .08; cx += w * 12 * u; }
    if (tt < 1.15) { const br = Math.sin(tt * 4) * .03; sx = 1 - br; sy = 1 + br; }
    const smear = f === Math.round(1.7 * 30);
    // 烟团：起跑处
    const sm = tt - 1.62; if (sm > 0 && sm < .9) for (let k = 0; k < 4; k++) { const r = (30 + k * 12 + sm * 90) * u, a = 1 - sm / .9; ctx.globalAlpha = a; tone(ell(x0 - 40 * u - k * 45 * u, gy - r * .7 - k * 6 * u, r, r * .8, 0, TAU, 24), '#E9E1D2'); ink(ell(x0 - 40 * u - k * 45 * u, gy - r * .7 - k * 6 * u, r, r * .8, .3 + k, 5.6 + k, 24), 5); ctx.globalAlpha = 1; }
    // 速度线
    if (tt > 1.6 && tt < 1.95) for (let k = 0; k < 5; k++) { const y = gy - R * (.4 + k * .35), len = (180 + hash1(k * 91 + 7) * 160) * u; ink([[cx - R - len - 40 * u, y], [cx - R - 40 * u, y]], 6); }
    if (smear) {
      // 只插一帧：拉长的拖影
      const pts = [[cx + R, gy - R], [cx + R * .7, gy - R * 1.9], [cx - R * 3.4, gy - R * 1.1], [cx - R * 3.6, gy - R * .8], [cx + R * .6, gy - R * .1]];
      tone(pts, '#F3B65C'); ink([...pts, pts[0]], 10);
      for (let k = 0; k < 4; k++) ink([[cx - R * (1 + k * .6), gy - R * (1.6 - k * .15)], [cx - R * (1.3 + k * .6), gy - R * (.4 + k * .1)]], 5);
    } else {
      // 身体：豆子形 + 一只大眼 + 小脚
      const by = gy - R * sy, rx = R * sx, ry = R * sy;
      const body = ell(cx, by, rx, ry, 0, TAU, 44).map(([x, y]) => [x + (y < by ? (x - cx) * -.08 : 0), y]);
      const wet = tt > 1.85;
      tone(body, wet && !(tt > 3.7) ? '#E9A653' : '#F3B65C');
      ink(body, 10, true);
      const ex = cx + rx * .32, ey = by - ry * .2, blink = tt > 4.2 && tt < 4.33;
      if (blink) ink([[ex - 24 * u, ey], [ex + 24 * u, ey]], 7);
      else { ink(ell(ex, ey, 38 * u, 44 * u, 0, TAU, 20), 6, true); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + 9 * u, ey + 6 * u, 18 * u, 0, TAU); ctx.fill(); }
      ink([[ex - 44 * u, ey - 70 * u], [ex + 30 * u, ey - (wet && tt < 3 ? 58 : 84) * u]], 7);
      ink(wet && tt < 3 ? [[cx + rx * .1, by + ry * .4], [cx + rx * .35, by + ry * .32]] : [[cx + rx * .05, by + ry * .35], [cx + rx * .25, by + ry * .45], [cx + rx * .45, by + ry * .32]], 6);
      const fstep = (f >> 1) % 2;
      [-1, 1].forEach(sd => ink([[cx + sd * rx * .35, gy - 6 * u], [cx + sd * rx * .35 + (dash ? (fstep ? 40 : -40) * sd : 18) * u, gy + 4 * u]], 9));
      // 招手（最后）
      if (tt > 4.0) { const wv = (Math.floor(tt * 6) % 2) ? -1 : 1; ink([[cx - rx * .8, by], [cx - rx * 1.25, by - ry * .6 + wv * 10 * u], [cx - rx * 1.2 + wv * 25 * u, by - ry * 1.0]], 8); }
      else ink([[cx - rx * .85, by + ry * .1], [cx - rx * 1.15, by + ry * .4]], 8);
      if (wet && tt < 3.7) for (let k = 0; k < 3; k++) { const dy = ((tt * 1.2 + k * .33) % 1) * ry; ink([[cx - rx * .5 + k * rx * .45, by - ry * .3 + dy], [cx - rx * .5 + k * rx * .45, by - ry * .3 + dy + 22 * u]], 6, false, '#4A8BC2'); }
    }
    // 水花：落地后的皇冠 + 飞溅水滴
    const sp = tt - 1.8;
    if (sp >= 0 && sp < .8) {
      const g = sp / .8, n = 9;
      for (let k = 0; k < n; k++) { const a = Math.PI * (1.08 + k / (n - 1) * .84), r = (250 + g * 160) * u, h = Math.sin(g * Math.PI) * (1 - k % 2 * .3); ink([[x1 + Math.cos(a) * r * .8, gy + 20 * u], [x1 + Math.cos(a) * r, gy + 20 * u - h * (120 + (k % 3) * 40) * u]], 9, false, '#2C6FA8'); }
      for (let k = 0; k < 8; k++) { const vx = (hash1(k * 33 + 1) - .5) * 900 * u, vy = -(500 + hash1(k * 71 + 2) * 500) * u, x = x1 + Math.sign(vx) * R * 1.15 + vx * sp, y = gy - R * .3 + vy * sp + 1400 * u * sp * sp; if (y < gy + 20 * u) { tone(ell(x, y, 12 * u, 16 * u, 0, TAU, 12), 'rgba(110,170,220,.7)'); ink(ell(x, y, 12 * u, 16 * u, 0, TAU, 12), 4, true, '#2C6FA8'); } }
    }
    // 抖水
    if (shake) for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + hash1(k + 5) * .4, d = (R * 1.2 + ((tt - 3.0) % .35) / .35 * 160 * u), x = cx + Math.cos(a) * d, y = gy - R + Math.sin(a) * d * .8; ink([[x, y], [x + Math.cos(a) * 26 * u, y + Math.sin(a) * 26 * u]], 7, false, '#2C6FA8'); }
    // 拟声字：也每 2 帧换一个微小角度
    const sfx = (txt, x, y, sz, a0, a1, col) => { if (tt < a0 || tt > a1) return; const p = eOutBack(clamp((tt - a0) / .2), 2.5); ctx.save(); ctx.translate(x, y); ctx.rotate(-.12 + (ver - 1) * .03); ctx.scale(p, p); ctx.font = `400 ${Math.round(sz)}px 'Ma Shan Zheng'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 14 * u; ctx.strokeStyle = INK; ctx.strokeText(txt, 0, 0); ctx.fillStyle = col; ctx.fillText(txt, 0, 0); ctx.restore(); };
    sfx('啪嗒！', x1 + (LAND ? 60 : -60) * u, gy - R * (LAND ? 2.6 : 2.8), (LAND ? 220 : 240) * u, 1.82, 2.9, '#F6F0E2');
    sfx('抖抖抖', LAND ? cx : W / 2, gy - R * (LAND ? 2.7 : 2.9), (LAND ? 170 : 190) * u, 3.0, 3.9, '#9FD0F2');
  }
});
