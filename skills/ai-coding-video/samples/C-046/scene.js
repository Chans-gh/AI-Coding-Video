// C-046 UI 形变循环：一个圆角矩形用临界阻尼弹簧在按钮、进度卡、视频卡三种尺寸之间形变，
// 内容层交叉淡入淡出，鼠标点两下，最后一帧和第一帧完全一样可以无缝循环。由 opus40 的同名场景改写，横屏重新构图。
function spring(x) { const w = 13; x = Math.max(0, x); return 1 - (1 + w * x) * Math.exp(-w * x); }
scene({
  id: 'C-046', name: 'UI 形变循环', dur: 3, still: 2.4,
  fonts: ["700 40px 'Noto Sans SC'", "700 40px 'JetBrains Mono'"],
  text: '生成视频渲染中完成·00:03',
  draw(ctx, t) {
    ctx.fillStyle = '#E9E6E1'; ctx.fillRect(0, 0, W, H);
    const S = [[360, 116, 58], [680, 230, 40], [680, 520, 40], [360, 116, 58]], ts = [.55, 1.35, 2.2];
    let cur = S[0]; let k = 0;
    for (let i = 0; i < 3; i++) { const e = spring(t - ts[i]); if (t >= ts[i]) { cur = S[i].map((v, j) => lerp(cur[j], S[i + 1][j], e)); k = i + 1; } }
    // 构图：竖屏沿用原版；横屏控件和鼠标轨迹整体移到画面中心
    const [dx, dy] = LAND ? [W / 2 - 540, H / 2 - 760] : [0, 160];
    const [w, h, r] = cur, cx = 540 + dx, cy = 760 + dy;
    const press = (tc) => 1 - .04 * Math.exp(-Math.pow((t - tc) / .06, 2));
    const pr = press(.5) * press(2.05);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pr, pr);
    ctx.shadowColor = 'rgba(40,30,20,.18)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
    const dark = t < .55 || t > 2.2; const mix = t < .55 ? 1 : t > 2.2 ? spring(t - 2.2) : 1 - spring(t - .55);
    ctx.fillStyle = `rgb(${lerp(255, 28, mix)},${lerp(255, 28, mix)},${lerp(255, 30, mix)})`; rr(ctx, -w / 2, -h / 2, w, h, r); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, r); ctx.clip();
    // content layers crossfade
    const aBtn = mix, aProg = t > .55 && t < 1.6 ? clamp((t - .7) / .2) * (1 - clamp((t - 1.35) / .15)) : 0, aVid = t > 1.35 && t < 2.35 ? clamp((t - 1.5) / .2) * (1 - clamp((t - 2.2) / .12)) : 0;
    ctx.textAlign = 'center';
    if (aBtn > .02) { ctx.globalAlpha = aBtn; ctx.fillStyle = '#fff'; ctx.font = "700 42px 'Noto Sans SC'"; ctx.fillText('生成视频', 0, 15); }
    if (aProg > .02) {
      ctx.globalAlpha = aProg; ctx.fillStyle = '#1C1C1E'; ctx.textAlign = 'left'; ctx.font = "700 34px 'Noto Sans SC'"; const pc = Math.round(clamp((t - .7) / .6) * 100);
      ctx.fillText('渲染中', -290, -30); ctx.textAlign = 'right'; ctx.font = "700 34px 'JetBrains Mono'"; ctx.fillText(pc + '%', 290, -30);
      ctx.fillStyle = '#E4E1DC'; rr(ctx, -290, 20, 580, 18, 9); ctx.fill(); ctx.fillStyle = '#1C1C1E'; rr(ctx, -290, 20, 580 * pc / 100, 18, 9); ctx.fill();
    }
    if (aVid > .02) {
      ctx.globalAlpha = aVid; const g = ctx.createLinearGradient(0, -260, 0, 180); g.addColorStop(0, '#2B3A67'); g.addColorStop(.6, '#E8836B'); g.addColorStop(1, '#F6C27A'); ctx.fillStyle = g; ctx.fillRect(-340, -260, 680, 420);
      ctx.fillStyle = 'rgba(255,245,220,.9)'; ctx.beginPath(); ctx.arc(120, 20, 60, 0, TAU); ctx.fill(); ctx.fillStyle = '#1F2440'; ctx.beginPath(); ctx.moveTo(-340, 160); ctx.lineTo(-120, 0); ctx.lineTo(60, 160); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.arc(0, -40, 56, 0, TAU); ctx.fill(); ctx.fillStyle = '#1C1C1E'; ctx.beginPath(); ctx.moveTo(-14, -66); ctx.lineTo(26, -40); ctx.lineTo(-14, -14); ctx.fill();
      ctx.fillStyle = '#1C1C1E'; ctx.textAlign = 'left'; ctx.font = "700 32px 'Noto Sans SC'"; ctx.fillText('完成 · 00:03', -300, 225);
    }
    ctx.restore(); ctx.restore();
    // cursor path (start == end)
    const keys = [[0, 860, 1120], [.45, 600, 790], [1.4, 640, 800], [1.95, 548, 740], [2.4, 600, 800], [3, 860, 1120]].map(([k, x, y]) => [k, x + dx, y + dy]);
    let px = keys[0][1], py = keys[0][2];
    for (let i = 0; i < keys.length - 1; i++) { const [t0, x0, y0] = keys[i], [t1, x1, y1] = keys[i + 1]; if (t >= t0 && t <= t1) { const e = eInOutCubic((t - t0) / (t1 - t0)); px = lerp(x0, x1, e); py = lerp(y0, y1, e); } }
    [.5, 2.05].forEach(tc => { const d = t - tc; if (d > 0 && d < .4) { ctx.strokeStyle = `rgba(28,28,30,${.35 * (1 - d / .4)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 20 + d * 120, 0, TAU); ctx.stroke(); } });
    ctx.save(); ctx.translate(px, py); ctx.scale(1.6, 1.6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(8, 23); ctx.lineTo(14, 36); ctx.lineTo(19, 34); ctx.lineTo(13, 21); ctx.lineTo(23, 21); ctx.closePath();
    ctx.fillStyle = '#111'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    ctx.textAlign = 'left';
  }
});
