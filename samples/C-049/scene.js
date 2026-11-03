// C-049 80 年代赛璐璐：夜色渐变天空、两层楼群按不同速度视差卷动，车身只用亮暗两色平涂加一道高光（赛璐璐上色），
// 动作按每秒 8 格走（有限动画），外面套一层录像带扫描线、跟踪噪声条和 PLAY 字样。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-049', name: '80 年代赛璐璐动画', dur: 3, still: 2.4,
  fonts: ["40px 'Noto Serif SC'", "40px 'Press Start 2P'"],
  text: 'PLAY▶SEP.27 1987夜',
  init() {
    const R = mulberry32(34), bl = [];
    for (let L = 0; L < 2; L++) { let x = -100; while (x < 3200) { const w = 70 + R() * 120, h = (L ? 260 : 420) + R() * (L ? 220 : 380); const win = []; for (let yy = 30; yy < h - 20; yy += 26) for (let xx = 14; xx < w - 14; xx += 22) if (R() < .35) win.push([xx, yy, R() < .2]); bl.push({ L, x, w, h, win }); x += w + R() * 20; } }
    return { bl };
  },
  draw(ctx, t, s, f) {
    const tt = stepT(t, 8), st = Math.floor(t * 8);
    // 构图：竖屏沿用原版；横屏地平线（公路）压到画面下 1/3，月亮去右上，路面和车流按宽幅铺开
    const P = LAND ? { dy: -290, moon: [1420, 280], car: 960, play: [70, 110], date: [1400, 1030], nd: 20, wr: 2400, sw: W + 320 }
                   : { dy: 0, moon: [760, 560], car: 540, play: [70, 380], date: [600, 1210], nd: 14, wr: 1680, sw: 1400 };
    const dy = P.dy, base = 1010 + dy;
    const sky = ctx.createLinearGradient(0, 250 + dy, 0, 1100 + dy); sky.addColorStop(0, '#12062E'); sky.addColorStop(.5, '#5A1768'); sky.addColorStop(.85, '#E8517A'); sky.addColorStop(1, '#FFA46B'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.shadowColor = '#FFE7B0'; ctx.shadowBlur = 90; ctx.fillStyle = '#FFF0CC'; ctx.beginPath(); ctx.arc(...P.moon, 150, 0, TAU); ctx.fill(); ctx.restore();
    for (const b of s.bl) {
      const sp = b.L ? 260 : 120, x = b.x - t * sp - (b.L ? 0 : 100); if (x > W || x + b.w < 0) continue;
      ctx.fillStyle = b.L ? '#1A0A2E' : '#35164F'; ctx.fillRect(x, base - b.h, b.w, b.h);
      ctx.fillStyle = b.L ? '#2B1146' : '#4A2168'; ctx.fillRect(x + b.w - 14, base - b.h, 14, b.h);
      for (const [wx, wy, c] of b.win) { ctx.fillStyle = c ? '#6FF3FF' : '#FFD46B'; ctx.fillRect(x + wx, base - b.h + wy, 10, 12); }
    }
    // neon sign
    ctx.save(); ctx.shadowColor = '#FF4F9A'; ctx.shadowBlur = 30; ctx.fillStyle = (st % 6) ? '#FF8CC6' : '#6B2A4F'; ctx.font = "140px 'Noto Serif SC'"; ctx.fillText('夜', 120 - t * 120, 700 + dy);
    ctx.shadowColor = '#4FF0FF'; ctx.strokeStyle = '#9FFBFF'; ctx.lineWidth = 6; ctx.strokeRect(95 - t * 120, 560 + dy, 190, 170); ctx.restore();
    // highway
    ctx.fillStyle = '#1B0B26'; ctx.fillRect(0, base, W, H - base); ctx.fillStyle = '#FF4F9A'; ctx.fillRect(0, base, W, 6);
    for (let k = 0; k < P.nd; k++) { const x = ((k * 120 - t * 900) % P.wr + P.wr) % P.wr - 120; ctx.fillStyle = '#FFE49B'; ctx.fillRect(x, base + 30, 60, 6); ctx.save(); ctx.shadowColor = '#FFE49B'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(x + 30, base - 10, 6, 0, TAU); ctx.fill(); ctx.restore(); }
    for (let k = 0; k < (LAND ? 12 : 6); k++) { ctx.fillStyle = 'rgba(255,200,230,.35)'; const y = base + 50 + k * 22; const x = ((k * 330 - t * 1500) % P.sw + P.sw) % P.sw - 200; ctx.fillRect(x, y, 260, 3); }
    // car (two-tone cel, limited animation)
    const bob = (st % 2) * 4;
    ctx.save(); ctx.translate(P.car, base - 10 - bob);
    ctx.save(); ctx.shadowColor = '#FF2A4A'; ctx.shadowBlur = 40; ctx.fillStyle = '#FF3355'; ctx.fillRect(-300, -70, 18, 16); ctx.restore();
    ctx.fillStyle = '#E23B4A'; ctx.beginPath(); ctx.moveTo(-300, -40); ctx.lineTo(-290, -86); ctx.lineTo(-130, -100); ctx.lineTo(-70, -160); ctx.lineTo(90, -160); ctx.lineTo(170, -104); ctx.lineTo(300, -86); ctx.lineTo(310, -40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9E1F33'; ctx.beginPath(); ctx.moveTo(-300, -40); ctx.lineTo(-296, -66); ctx.lineTo(306, -62); ctx.lineTo(310, -40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1D2A5C'; ctx.beginPath(); ctx.moveTo(-110, -104); ctx.lineTo(-60, -150); ctx.lineTo(80, -150); ctx.lineTo(150, -104); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6FD6FF'; ctx.beginPath(); ctx.moveTo(-30, -150); ctx.lineTo(0, -150); ctx.lineTo(-40, -104); ctx.lineTo(-70, -104); ctx.fill();
    ctx.fillStyle = '#0B0B1A'; ctx.beginPath(); ctx.arc(40, -126, 20, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(20, -130); ctx.quadraticCurveTo(-10, -110 + Math.sin(tt * 6) * 5, -40, -112); ctx.lineTo(24, -118); ctx.fill();
    ctx.fillStyle = '#FFE9A8'; ctx.fillRect(284, -86, 20, 10);
    [[-190, 0], [190, 0]].forEach(([x]) => { ctx.fillStyle = '#0B0B1A'; ctx.beginPath(); ctx.arc(x, -30, 50, 0, TAU); ctx.fill(); ctx.fillStyle = '#B9C0D6'; ctx.beginPath(); ctx.arc(x, -30, 28, 0, TAU); ctx.fill(); ctx.strokeStyle = '#555C77'; ctx.lineWidth = 5; for (let k = 0; k < 3; k++) { const a = st * .9 + k * TAU / 3; ctx.beginPath(); ctx.moveTo(x, -30); ctx.lineTo(x + Math.cos(a) * 26, -30 + Math.sin(a) * 26); ctx.stroke(); } });
    ctx.strokeStyle = '#FF9DB8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-285, -88); ctx.lineTo(-130, -101); ctx.lineTo(-70, -161); ctx.lineTo(90, -161); ctx.stroke();
    ctx.restore();
    // VHS overlay
    ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
    const ty = ((t * 380) % (H + 300)) - 150; ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, ty, W, 26);
    const R = mulberry32(f); for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(255,255,255,${R() * .5})`; ctx.fillRect(R() * W, ty + R() * 26, 20 + R() * 80, 2); }
    ctx.fillStyle = '#fff'; ctx.font = "44px 'Press Start 2P'"; ctx.shadowColor = '#000'; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;
    if (f % 30 < 22) ctx.fillText('PLAY ▶', ...P.play); ctx.font = "32px 'Press Start 2P'"; ctx.fillText('SEP.27 1987', ...P.date); ctx.shadowColor = 'transparent';
    vignette(ctx, .55, .35);
  }
});
