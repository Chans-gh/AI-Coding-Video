// C-139 新印象派点彩：湖边公园先画成色块底图，strokePlan 的 dot 模式排满同样大小的圆点，每点的颜色换成调色板里最近的两种纯色之一，再掺一成补色点；暗处多补一层冷色点、亮处随机空掉一些，点从上到下“结晶”出来，之后一部分点在原位轻轻明灭。
// 风格提示词：用新印象派点彩风格：画面全部由同样大小的纯色圆点并排组成，不在调色盘上混色，橙点旁放蓝点、绿点旁放红点让眼睛自己去混，阴影处的点更冷更密、亮处更暖更稀，点在原位轻轻明灭像在呼吸，人物轮廓安静而几何，转场是旧画面结晶成圆点再重新组合。
// 题材：绘画流派 · 适合：公园与假日、科学色彩讲解、安静的风景
scene({
  id: 'C-139', name: '新印象派点彩', dur: 5, still: 4.4,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    // 构图：横屏湖在后、树在左、人在右；竖屏树在上半、人站在中下
    const hz = LAND ? H * .42 : H * .38, shore = LAND ? H * .56 : H * .5;
    const tx = LAND ? W * .2 : W * .25, fx = LAND ? W * .7 : W * .62, fy = LAND ? H * .86 : H * .82, fs = (LAND ? 1 : 1.3) * u;
    const M = paintMap(g => {
      const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#7FA6D6'); sky.addColorStop(1, '#E9E2C4');
      g.fillStyle = sky; g.fillRect(0, 0, W, hz);
      g.fillStyle = '#6F8FB8'; g.fillRect(0, hz - 30 * u, W, 34 * u);                              // 远岸
      const lake = g.createLinearGradient(0, hz, 0, shore); lake.addColorStop(0, '#9CC0DC'); lake.addColorStop(1, '#4F86B8');
      g.fillStyle = lake; g.fillRect(0, hz, W, shore - hz);
      g.fillStyle = '#F4EFE2'; g.beginPath(); g.moveTo(W * .55, hz - 100 * u); g.lineTo(W * .55, hz + 4 * u); g.lineTo(W * .62, hz + 4 * u); g.closePath(); g.fill();   // 帆
      const lawn = g.createLinearGradient(0, shore, 0, H); lawn.addColorStop(0, '#9CC25A'); lawn.addColorStop(1, '#5C9A40');
      g.fillStyle = lawn; g.fillRect(0, shore, W, H - shore);
      g.fillStyle = '#2F5B3A'; g.beginPath(); g.ellipse(tx + 140 * u, shore + 150 * u, 420 * u, 70 * u, 0, 0, TAU); g.fill();     // 树荫
      g.fillStyle = '#4B3A2E'; g.fillRect(tx - 22 * u, shore - 200 * u, 44 * u, 350 * u);                                         // 树
      g.fillStyle = '#2E6A3C'; g.beginPath(); g.ellipse(tx, shore - 330 * u, 250 * u, 220 * u, 0, 0, TAU); g.fill();
      g.fillStyle = '#5E9A48'; g.beginPath(); g.ellipse(tx - 70 * u, shore - 400 * u, 140 * u, 110 * u, 0, 0, TAU); g.fill();
      // 打伞的人：侧影，几何形
      const P = (x, y) => [fx + x * fs, fy + y * fs];
      g.fillStyle = 'rgba(30,50,40,.5)'; g.beginPath(); g.ellipse(...P(-60, 4), 120 * fs, 16 * fs, 0, 0, TAU); g.fill();
      g.fillStyle = '#2C2B44'; g.beginPath(); g.moveTo(...P(-70, 0)); g.quadraticCurveTo(...P(-60, -220), ...P(-24, -300)); g.lineTo(...P(24, -300)); g.quadraticCurveTo(...P(70, -180), ...P(90, 0)); g.fill();
      g.fillStyle = '#B5524A'; g.fillRect(...P(-26, -380), 52 * fs, 90 * fs);
      g.fillStyle = '#E7B48E'; g.beginPath(); g.arc(...P(0, -420), 32 * fs, 0, TAU); g.fill();
      g.fillStyle = '#2C2B44'; g.beginPath(); g.ellipse(...P(0, -446), 46 * fs, 12 * fs, 0, 0, TAU); g.fill();
      g.strokeStyle = '#3A2E26'; g.lineWidth = 6 * fs; g.beginPath(); g.moveTo(...P(30, -340)); g.lineTo(...P(60, -520)); g.stroke();
      g.fillStyle = '#E8873A'; g.beginPath(); g.moveTo(...P(-110, -480)); g.quadraticCurveTo(...P(60, -640), ...P(230, -480)); g.closePath(); g.fill();
    }, { res: 3, blur: 2 * u });
    const F = flowField({ angle: 0, res: 40 });
    // 纯色调色板：每个点只能用这里的颜色
    const PAL = ['#F2E4B8', '#F6B04A', '#E8742E', '#D23E3A', '#C25A9A', '#6B4FA0', '#2E4FA8', '#3E8CD0', '#7CC4D8', '#3E9A4A', '#8CC84A', '#E9D84A', '#F7F2E6', '#2A2A3A'].map(hex2rgb);
    const comp = c => { const k = [255 - c[0], 255 - c[1], 255 - c[2]], l0 = c[0] + c[1] + c[2] + 1, l1 = k[0] + k[1] + k[2] + 1; return k.map(v => clamp(v * l0 / l1, 0, 255)); };   // 补色，但亮度不变
    const tint = (x, y, c, R) => {
      if (R() < .1) c = comp(c);                                                                // 一成补色点
      const d = PAL.map((p, i) => [Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]), i]).sort((a, b) => a[0] - b[0]);
      const [d0, i0] = d[0], [d1, i1] = d[1];
      return PAL[R() < d1 / (d0 + d1) ? i0 : i1].slice();
    };
    const dot = 10 * u, base = { len: [1, 1], width: [dot, dot], jitter: .06, tint, order: (x, y) => y / H + hash2(Math.floor(x / 30), Math.floor(y / 30)) * .25 };
    const S = strokePlan(M, F, { ...base, gap: 8.5 * u, seed: 3, mask: (x, y) => M.lum(x, y) < .72 || hash2(Math.floor(x), Math.floor(y)) > .3 });   // 亮处空掉一些
    const cool = strokePlan(M, F, { ...base, gap: 11 * u, seed: 4, mask: (x, y) => M.lum(x, y) < .4,                                                    // 暗处再补一层冷色
      tint: (x, y, c, R) => PAL[[6, 5, 7, 9][Math.floor(R() * 4)]].slice() });
    const all = [...S, ...cool].sort((a, b) => a.y - b.y);
    all.forEach((q, i) => q.k = i / (all.length - 1));
    const tw = all.filter((q, i) => hash1(i * 7 + 1) < .12).map((q, i) => [q.x, q.y, q.c, hash1(i * 13) * TAU]);
    return { u, dot, all, tw };
  },
  draw(ctx, t, s) {
    ctx.fillStyle = '#F3EEE2'; ctx.fillRect(0, 0, W, H);
    drawStrokes(ctx, s.all, eOutCubic(inv(.1, 3.2, t)), { style: 'dot' });
    // 呼吸：一成多的点在原位忽明忽暗（盖一层底色或加大一点）
    const bp = smooth(2.6, 3.4, t);
    if (bp > 0) { ctx.save();
      for (const [x, y, c, ph] of s.tw) { const v = Math.sin(t * 3 + ph); if (y > H * eOutCubic(inv(.1, 3.2, t)) * 1.05) continue;
        if (v > .3) { ctx.globalAlpha = bp * (v - .3); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, s.dot * .62, 0, TAU); ctx.fill(); }
        else if (v < -.3) { ctx.globalAlpha = bp * (-v - .3) * .8; ctx.fillStyle = '#F3EEE2'; ctx.beginPath(); ctx.arc(x, y, s.dot * .5, 0, TAU); ctx.fill(); } }
      ctx.restore(); }
  }
});
