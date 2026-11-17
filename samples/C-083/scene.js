// C-083 玻璃拟态极光：背景在 1/4 尺寸的离屏画布上画三条随时间漂移的青、紫、玫红极光带和星点，放大即得柔边；前景面板把这张背景再用 Canvas 的 blur 滤镜糊一遍、裁进圆角矩形，叠一层白雾、1px 渐变高光描边和颗粒，就是毛玻璃；面板里的呼吸球按 4 秒一轮的吸、停、呼缩放发光。
// 风格提示词：用玻璃拟态极光风格：深午夜蓝背景（#070b1f）上三条缓慢漂移的青、紫、玫红极光带和微弱星点，前景是毛玻璃面板（背景模糊、1px 内高光描边、细颗粒），大号细体无衬线标题，核心元素（如呼吸球）柔和地缩放发光，整体安静高级。
// 题材：信息讲解与产品发布 · 适合：消费类 App、冥想健康、氛围感首屏
scene({
  id: 'C-083', name: '玻璃拟态极光', dur: 5, still: 3.4,
  fonts: ["400 80px 'Noto Sans SC'", "400 40px 'JetBrains Mono'"],
  text: '慢下来呼吸吸气屏住呼气今天第三次练习分钟',
  init() {
    const R = mulberry32(83), stars = [];
    for (let i = 0; i < 140; i++) stars.push([R() * W, R() * H, R() * 1.6 + .4, R() * TAU]);
    const lw = Math.round(W / 4), lh = Math.round(H / 4);
    return { stars, lo: mk(lw, lh), bg: mk(W, H), blur: mk(Math.round(W / 2), Math.round(H / 2)), grainC: makeGrain(512, 512, 18, 83) };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080;
    // —— 背景：极光带（低分辨率画，放大即柔）
    const g = s.lo.getContext('2d'), lw = s.lo.width, lh = s.lo.height;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#070B1F'; g.fillRect(0, 0, lw, lh);
    g.globalCompositeOperation = 'lighter';
    const bands = [[[60, 220, 210], .18, .0], [[140, 90, 255], .42, 2.1], [[255, 70, 160], .66, 4.2]];
    bands.forEach(([c, yy, ph], bi) => {
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        for (let i = 0; i <= 40; i++) {
          const x = i / 40 * lw * 1.2 - lw * .1;
          const y = lh * (yy + (LAND ? 0 : .05)) + Math.sin(i * .22 + t * .35 + ph) * lh * .08 + Math.sin(i * .09 - t * .22 + ph * 2) * lh * .06 + k * lh * .02;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.strokeStyle = rgba(c, .14 - k * .03); g.lineWidth = lh * (.12 - k * .03) * (1 + .15 * Math.sin(t * .8 + bi)); g.lineCap = 'round';
        g.filter = `blur(${Math.round(lh * .04)}px)`; g.stroke(); g.filter = 'none';
      }
    });
    g.globalCompositeOperation = 'source-over';
    const b = s.bg.getContext('2d');
    b.imageSmoothingQuality = 'high'; b.drawImage(s.lo, 0, 0, W, H);
    s.stars.forEach(([x, y, r, ph]) => { b.fillStyle = `rgba(255,255,255,${.25 + .35 * Math.sin(t * 1.5 + ph) ** 2})`; b.beginPath(); b.arc(x, y, r * u, 0, TAU); b.fill(); });
    ctx.drawImage(s.bg, 0, 0);
    // —— 呼吸节奏：4 秒一循环（吸 2 秒、停 .6 秒、呼 1.4 秒），从 0.6 秒开始
    const bt = ((t - .6) % 4 + 4) % 4, breath = t < .6 ? 0 : bt < 2 ? eInOutCubic(bt / 2) : bt < 2.6 ? 1 : 1 - eInOutCubic((bt - 2.6) / 1.4);
    const label = t < .6 ? '' : bt < 2 ? '吸气' : bt < 2.6 ? '屏住' : '呼气';
    // —— 玻璃面板
    const enter = eOutCubic(clamp(t / .9));
    const pw = (LAND ? 1180 : 860) * u, ph = (LAND ? 700 : 1240) * u;
    const px = (W - pw) / 2, py = (H - ph) / 2 + (1 - enter) * 60 * u, rad = 48 * u;
    const bl = s.blur.getContext('2d');
    bl.filter = 'blur(18px)'; bl.drawImage(s.bg, 0, 0, s.blur.width, s.blur.height); bl.filter = 'none';
    ctx.save(); ctx.globalAlpha = enter;
    // 投影
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 80 * u; ctx.shadowOffsetY = 30 * u;
    rr(ctx, px, py, pw, ph, rad); ctx.fillStyle = 'rgba(10,14,40,.4)'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.save(); rr(ctx, px, py, pw, ph, rad); ctx.clip();
    ctx.drawImage(s.blur, 0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(px, py, pw, ph);
    const sheen = ctx.createLinearGradient(px, py, px + pw, py + ph);
    sheen.addColorStop(0, 'rgba(255,255,255,.12)'); sheen.addColorStop(.5, 'rgba(255,255,255,0)'); sheen.addColorStop(1, 'rgba(255,255,255,.04)');
    ctx.fillStyle = sheen; ctx.fillRect(px, py, pw, ph);
    ctx.globalAlpha = enter * .35; ctx.globalCompositeOperation = 'overlay';
    for (let y = py; y < py + ph; y += 512) for (let x = px; x < px + pw; x += 512) ctx.drawImage(s.grainC, x, y);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = enter;
    // 呼吸球
    const ox = LAND ? px + pw * .7 : W / 2, oy = LAND ? py + ph / 2 : py + ph * .42;
    const R0 = (LAND ? 150 : 170) * u, R = R0 * (.72 + .38 * breath);
    const glow = ctx.createRadialGradient(ox, oy, R * .2, ox, oy, R * 2.2);
    glow.addColorStop(0, `rgba(150,220,255,${.35 + .25 * breath})`); glow.addColorStop(.45, `rgba(170,120,255,${.15 + .15 * breath})`); glow.addColorStop(1, 'rgba(170,120,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(ox - R * 2.2, oy - R * 2.2, R * 4.4, R * 4.4);
    const orb = ctx.createRadialGradient(ox - R * .35, oy - R * .4, R * .1, ox, oy, R);
    orb.addColorStop(0, 'rgba(255,255,255,.95)'); orb.addColorStop(.35, 'rgba(140,230,240,.75)'); orb.addColorStop(.8, 'rgba(150,110,255,.55)'); orb.addColorStop(1, 'rgba(255,90,170,.35)');
    ctx.fillStyle = orb; ctx.beginPath(); ctx.arc(ox, oy, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2 * u; ctx.beginPath(); ctx.arc(ox, oy, R0 * 1.15, 0, TAU); ctx.stroke();
    // 进度弧
    if (t > .6) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ox, oy, R0 * 1.15, -Math.PI / 2, -Math.PI / 2 + TAU * bt / 4); ctx.stroke(); }
    // 文字
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.textAlign = LAND ? 'left' : 'center';
    const tx = LAND ? px + 90 * u : W / 2, ty = LAND ? py + ph * .42 : py + ph * .77;
    ctx.font = `400 ${Math.round((LAND ? 104 : 96) * u)}px 'Noto Sans SC'`;
    ctx.fillText('慢下来', tx, ty);
    ctx.font = `400 ${Math.round(34 * u)}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.fillText('今天的第 3 次练习 · 4 分钟', tx, ty + 66 * u);
    // 状态胶囊
    const cw = 200 * u, chh = 64 * u, cx = LAND ? tx : W / 2 - cw / 2, cy = ty + 120 * u;
    rr(ctx, cx, cy, cw, chh, chh / 2); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1 * u; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(32 * u)}px 'Noto Sans SC'`;
    ctx.globalAlpha = enter * (label ? .5 + .5 * Math.min(1, (bt % 2) * 4) : 0);
    ctx.fillText(label, cx + cw / 2, cy + chh / 2 + 11 * u);
    ctx.restore();
    // 1px 高光描边：上亮下暗
    const edge = ctx.createLinearGradient(0, py, 0, py + ph);
    edge.addColorStop(0, 'rgba(255,255,255,.55)'); edge.addColorStop(.5, 'rgba(255,255,255,.12)'); edge.addColorStop(1, 'rgba(255,255,255,.25)');
    ctx.strokeStyle = edge; ctx.lineWidth = 1.5 * u; rr(ctx, px + .5, py + .5, pw - 1, ph - 1, rad); ctx.stroke();
    ctx.restore();
  }
});
