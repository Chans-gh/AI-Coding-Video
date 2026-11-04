// T-009 活体录屏教程：本仓库介绍页的操作录屏放进浏览器窗口，镜头跟着鼠标在点击前后自动推近、拉回；鼠标由代码按录下的轨迹重画，点击处有涟漪，左上角标第几步，底部字幕跟旁白
// 素材：录屏（Playwright 按脚本操作本仓库的介绍页并录制，鼠标轨迹写在 assets.json）；旁白青水公开音色；配乐 CC0
scene({
  id: 'T-009', name: '活体录屏', dur: 14, still: 6.4,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'JetBrains Mono'"],
  text: '打开介绍页滚到样片区先点实拍素材再选一个内容类型比如新闻资讯点开一支样片放大看看完关掉就行第步录屏旁白配乐',
  async init() {
    const A = await loadAssets();
    const rec = A.items.find(i => i.kind === '录屏');
    const clicks = rec.cursor.filter(p => p[3]).map(p => p[0]);
    return { A, cur: rec.cursor, clicks, v: await loadVideo('screen.mp4') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, OFF = -2.3, rt = clamp(t - OFF, 0, s.v.dur - .05);
    await s.v.at(rt);
    // 背景
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#dfe6ff'); bg.addColorStop(1, '#f4e8ff');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // 鼠标位置：在轨迹里插值
    const tr = s.cur; let i = tr.findIndex(p => p[0] > rt); if (i < 1) i = i < 0 ? tr.length - 1 : 1;
    const a = tr[i - 1], b = tr[i], k = clamp((rt - a[0]) / Math.max(1e-3, b[0] - a[0]));
    const mx = lerp(a[1], b[1], k), my = lerp(a[2], b[2], k);
    // 推近：离最近一次点击 1 秒以内放大到 1.7 倍，中心跟着鼠标（平滑）
    const near = Math.max(0, ...s.clicks.map(c => 1 - smooth(.25, 1.1, Math.abs(rt - c))));
    const z = 1 + .7 * near;
    // 浏览器窗口
    const ww = LAND ? W * .86 : W * .94, wh = ww * 9 / 16, bar = 44 * u;
    const wx = (W - ww) / 2, wy = LAND ? (H - wh - bar) / 2 - 20 * u : H * .3;
    ctx.save(); ctx.shadowColor = 'rgba(40,40,90,.25)'; ctx.shadowBlur = 50 * u; ctx.shadowOffsetY = 20 * u;
    ctx.fillStyle = '#fff'; rr(ctx, wx, wy, ww, wh + bar, 14 * u); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#eceef3'; rr(ctx, wx, wy, ww, bar + 12 * u, 14 * u); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(wx, wy + bar, ww, 12 * u);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, j) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(wx + (24 + j * 22) * u, wy + bar / 2, 7 * u, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#fff'; rr(ctx, wx + ww * .25, wy + 9 * u, ww * .5, bar - 18 * u, 8 * u); ctx.fill();
    ctx.fillStyle = '#6b7280'; ctx.font = `400 ${16 * u}px 'JetBrains Mono'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('chans-gh.github.io/AI-Coding-Video', wx + ww / 2, wy + bar / 2);
    // 录屏画面（推近时裁一部分）
    const vx = wx, vy = wy + bar, vw = ww, vh = wh;
    const cx = clamp(mx, .5 / z, 1 - .5 / z), cy = clamp(my, .5 / z, 1 - .5 / z);
    ctx.save(); rr(ctx, vx, vy, vw, vh, 0); ctx.clip();
    const sw = s.v.w / z, sh = s.v.h / z;
    ctx.drawImage(s.v.el, (cx - .5 / z) * s.v.w, (cy - .5 / z) * s.v.h, sw, sh, vx, vy, vw, vh);
    // 鼠标和点击涟漪（坐标换到推近后的画面里）
    const px = vx + ((mx - cx) * z + .5) * vw, py = vy + ((my - cy) * z + .5) * vh;
    for (const c of s.clicks) {
      const d = rt - c;
      if (d >= 0 && d < .6) { ctx.strokeStyle = `rgba(42,65,201,${1 - d / .6})`; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.arc(px, py, (10 + 60 * d) * u, 0, 7); ctx.stroke(); }
    }
    ctx.save(); ctx.translate(px, py); ctx.scale(1.4 * u * 1.3, 1.4 * u * 1.3);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(6, 17); ctx.lineTo(10, 26); ctx.lineTo(14, 24); ctx.lineTo(10, 16); ctx.lineTo(17, 16); ctx.closePath();
    ctx.fillStyle = '#111'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
    ctx.restore();
    // 第几步：按点击切换
    const STEPS = ['滚到样片区', '点「实拍素材」', '选内容类型', '点开一支样片', '看完关掉'];
    const n = s.clicks.filter(c => rt >= c - .6).length;
    const step = rt < 1.0 ? -1 : Math.min(STEPS.length - 1, n);
    if (step >= 0) {
      const sx = LAND ? wx : 40 * u, sy = LAND ? wy - 80 * u : wy - 200 * u;
      ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = '#2a41c9'; ctx.beginPath(); ctx.arc(sx + 28 * u, sy + 28 * u, 28 * u, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `900 ${30 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText(String(step + 1), sx + 28 * u, sy + 29 * u);
      ctx.fillStyle = '#131922'; ctx.textAlign = 'left'; ctx.font = `900 ${(LAND ? 40 : 46) * u}px 'Noto Sans SC'`; ctx.fillText(STEPS[step], sx + 72 * u, sy + 28 * u);
      ctx.restore();
    }
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, { size: LAND ? 34 : 42, y: LAND ? H - 24 * u : wy + wh + bar + 240 * u, bg: 'rgba(19,25,34,.82)' });
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(19,25,34,.55)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 24 * u, LAND ? 26 * u : H - 18 * u); ctx.restore();
  },
});
