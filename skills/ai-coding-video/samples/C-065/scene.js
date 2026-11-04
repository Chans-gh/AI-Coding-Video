// C-065 科幻 HUD：冷青色线框，几圈刻度环和虚线环按不同速度反向旋转，雷达用锥形渐变做扫描尾迹，
// 目标锁定框从大到小旋转收紧、锁定后变橙闪字，周围是跳动的读数、电平和波形。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-065', name: '科幻 HUD 界面', dur: 3, still: 2.4,
  fonts: ["700 40px 'JetBrains Mono'"],
  init() { const R = mulberry32(14), bl = []; for (let i = 0; i < 9; i++) bl.push([R() * TAU, 30 + R() * 110]); return { bl }; },
  draw(ctx, t, s, f) {
    ctx.fillStyle = '#03101C'; ctx.fillRect(0, 0, W, H);
    // 构图：竖屏沿用原版；横屏刻度环和雷达居中，读数放左上，波形放左下，柱状电平放右下
    const P = LAND ? { c: [W / 2, H / 2], rd: [80, 220], bars: [1500, 960], wv: [80, 660, 900] } : { c: [540, 900], rd: [60, 420], bars: [760, 1420], wv: [60, 700, 1370] };
    const [cx0, cy0] = P.c, C = '#52E8FF', Ca = a => `rgba(82,232,255,${a})`, OR = '#FF7A45';
    ctx.strokeStyle = Ca(.06); ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 52) for (let x = (y / 52 % 2) * 30; x < W; x += 60) { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.lineTo(x + Math.cos(a) * 28, y + Math.sin(a) * 28); } ctx.closePath(); ctx.stroke(); }
    ctx.shadowColor = C; ctx.shadowBlur = 14; ctx.strokeStyle = C; ctx.fillStyle = C;
    const boot = eOutCubic(t / .6);
    ctx.save(); ctx.translate(cx0, cy0); ctx.scale(boot, boot);
    ctx.lineWidth = 2; ctx.rotate(t * .4);
    for (let k = 0; k < 72; k++) { const a = k / 72 * TAU, l = k % 6 ? 12 : 26; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 360, Math.sin(a) * 360); ctx.lineTo(Math.cos(a) * (360 - l), Math.sin(a) * (360 - l)); ctx.stroke(); }
    ctx.rotate(-t * 1.1); ctx.lineWidth = 4; ctx.setLineDash([40, 18]); ctx.beginPath(); ctx.arc(0, 0, 300, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.rotate(t * 2); ctx.lineWidth = 12; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, 0, 245, k * TAU / 3, k * TAU / 3 + 1.2); ctx.stroke(); }
    ctx.restore();
    // radar
    ctx.save(); ctx.translate(cx0, cy0); const sa = t * 3;
    const cg = ctx.createConicGradient(sa - 1.2, 0, 0); cg.addColorStop(0, Ca(0)); cg.addColorStop(.19, Ca(.45)); cg.addColorStop(.191, Ca(0)); cg.addColorStop(1, Ca(0));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, 190 * boot, 0, TAU); ctx.fill();
    ctx.lineWidth = 2; [190, 130, 70].forEach(r => { ctx.beginPath(); ctx.arc(0, 0, r * boot, 0, TAU); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(200, 0); ctx.moveTo(0, -200); ctx.lineTo(0, 200); ctx.globalAlpha = .4; ctx.stroke(); ctx.globalAlpha = 1;
    for (const [a, r] of s.bl) { const d = ((sa - a) % TAU + TAU) % TAU; const al = Math.exp(-d * 1.2); ctx.globalAlpha = al; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 7, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.restore();
    // lock-on
    const tx = cx0 + 150 + Math.sin(t * 1.3) * 20, ty = cy0 - 120 + Math.cos(t * 1.1) * 14; const lk = eInOutCubic(inv(.4, 1.8, t)), sz = lerp(260, 70, lk);
    ctx.strokeStyle = lk >= 1 ? OR : C; ctx.shadowColor = ctx.strokeStyle; ctx.lineWidth = 5;
    for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(tx, ty); ctx.rotate(k * Math.PI / 2 + (1 - lk) * 1.5); ctx.beginPath(); ctx.moveTo(-sz, -sz + 36); ctx.lineTo(-sz, -sz); ctx.lineTo(-sz + 36, -sz); ctx.stroke(); ctx.restore(); }
    if (lk >= 1 && (f >> 2) % 2 === 0) { ctx.fillStyle = OR; ctx.font = "700 40px 'JetBrains Mono'"; ctx.fillText('TARGET LOCKED', tx - 150, ty - 110); }
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 150, ty - 170); ctx.lineTo(tx + 300, ty - 170); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle; ctx.font = "700 26px 'JetBrains Mono'"; ctx.fillText(`ID-${(4096 + Math.floor(t * 30) * 7).toString(16).toUpperCase()}`, tx + 160, ty - 182);
    // side readouts
    ctx.fillStyle = C; ctx.shadowColor = C; ctx.font = "700 26px 'JetBrains Mono'";
    const rows = ['ALT', 'VEL', 'HDG', 'TMP', 'PWR', 'SIG'];
    rows.forEach((r, i) => { const v = (Math.floor(1000 + 8000 * hash2(i, Math.floor(t * 10)))).toString(); ctx.globalAlpha = .9; ctx.fillText(`${r}  ${v.padStart(5, '0')}`, P.rd[0], P.rd[1] + i * 40); });
    for (let i = 0; i < 12; i++) { const h = 20 + 120 * Math.abs(Math.sin(t * 3 + i * .7)); ctx.globalAlpha = .7; ctx.fillRect(P.bars[0] + i * 22, P.bars[1] - h, 14, h); }
    ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = P.wv[0]; x < P.wv[1]; x += 4) ctx.lineTo(x, P.wv[2] + Math.sin(x * .05 - t * 10) * 30 * Math.sin(x * .007 + t));
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = Ca(.08); ctx.fillRect(0, (t * 900) % H, W, 6);
    vignette(ctx, .7, .35);
  }
});
