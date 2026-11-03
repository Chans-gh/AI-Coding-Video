// C-034 60 年代间谍片头：每拍换一个底色和一种平面构成（条纹、同心圆、竖条、钥匙、圆点阵、放大镜），
// 剪影小人按每秒 12 格的顿挫奔跑，最后字母从两侧冲进来拼出片名。由 opus40 的同名场景改写，横屏重新构图，片名改成原创。
function spyRunner(ctx, x, y, s, ph, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
  const a = Math.sin(ph) * .9, b = Math.sin(ph + Math.PI) * .9;
  ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * 80, Math.cos(a) * 80); ctx.lineTo(Math.sin(a) * 80 - 40, Math.cos(a) * 80 + 60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(b) * 80, Math.cos(b) * 80); ctx.lineTo(Math.sin(b) * 80 - 30, Math.cos(b) * 80 + 70); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(20, -130); ctx.lineWidth = 46; ctx.stroke();
  ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(20, -110); ctx.lineTo(20 + Math.sin(b) * 70, -60); ctx.lineTo(60 + Math.sin(b) * 60, -80); ctx.stroke();
  ctx.beginPath(); ctx.arc(30, -170, 30, 0, TAU); ctx.fill(); ctx.fillRect(-10, -196, 80, 10); ctx.beginPath(); ctx.ellipse(30, -200, 28, 18, 0, Math.PI, TAU); ctx.fill();
  ctx.restore();
}
scene({
  id: 'C-034', name: '60 年代间谍片头', dur: 3, still: 2.4,
  fonts: ["900 40px 'Noto Sans SC'", "40px 'Bebas Neue'"],
  text: '一句提示词 出品STARRING CODE 30',
  draw(ctx, t, s, f) {
    const O = '#E4572E', T = '#17998B', C = '#F3E9D2', K = '#141414';
    const b = Math.floor(t / BEAT), lt = t % BEAT, ph = stepT(t, 12) * 14;
    const bgc = [O, T, C, K, O, T, C, C][b]; ctx.fillStyle = bgc; ctx.fillRect(0, 0, W, H);
    // 构图：竖屏沿用原版；横屏居中的拍（同心圆、钥匙、放大镜、片名）整体平移到画面中心，条纹、柱子、圆点按宽幅重排
    const [dx, dy] = LAND ? [(W - 1080) / 2, -240] : [0, 0], mid = fn => { ctx.save(); ctx.translate(dx, dy); fn(); ctx.restore(); };
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 8; ctx.shadowOffsetY = 8;
    if (b === 0) { for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? T : C; ctx.fillRect(0, (LAND ? 130 : 380) + k * 170, W * eOutExpo(lt / .2 - k * .1), 80); } spyRunner(ctx, lerp(LAND ? 250 : 100, LAND ? 1600 : 800, lt / BEAT), LAND ? 660 : 980, 2.3, ph, K); }
    if (b === 1) mid(() => { for (let k = 6; k > 0; k--) { ctx.fillStyle = k % 2 ? C : O; ctx.beginPath(); ctx.arc(540, 780, k * 75 * eOutBack(lt / .2), 0, TAU); ctx.fill(); } ctx.fillStyle = K; ctx.beginPath(); ctx.moveTo(420, 1250); ctx.bezierCurveTo(430, 1000, 460, 900, 500, 760); ctx.lineTo(470, 700); ctx.bezierCurveTo(470, 560, 640, 540, 650, 680); ctx.lineTo(690, 740); ctx.lineTo(650, 760); ctx.bezierCurveTo(660, 900, 700, 1050, 720, 1250); ctx.fill(); });
    if (b === 2) { const n = LAND ? 15 : 9, y0 = LAND ? 90 : 320; for (let k = 0; k < n; k++) { ctx.fillStyle = k % 3 === 0 ? O : K; const h = 900 * eOutExpo(lt / .15 - k * .03); ctx.fillRect(60 + k * (LAND ? 126 : 110), y0 + (k % 2 ? 0 : 900 - h), 60, h); } ctx.shadowColor = 'transparent'; ctx.fillStyle = C; ctx.fillRect(W / 2 - 400, y0 + 380, 800, 150); ctx.fillStyle = K; ctx.font = "900 76px 'Noto Sans SC'"; ctx.textAlign = 'center'; ctx.fillText('一句提示词 出品', W / 2, y0 + 480); }
    if (b === 3) mid(() => { ctx.save(); ctx.translate(540, 760); ctx.rotate(lt * 6); ctx.fillStyle = C; ctx.beginPath(); ctx.arc(0, -120, 90, 0, TAU); ctx.fill(); ctx.fillRect(-20, -40, 40, 300); ctx.fillRect(20, 160, 60, 30); ctx.fillRect(20, 220, 44, 30); ctx.fillStyle = K; ctx.beginPath(); ctx.arc(0, -120, 40, 0, TAU); ctx.fill(); ctx.restore(); ctx.shadowColor = 'transparent'; ctx.fillStyle = O; ctx.font = "120px 'Bebas Neue'"; ctx.textAlign = 'center'; ctx.fillText('STARRING', 540, 1150); });
    if (b === 4) { const c = LAND ? 6 : 4; for (let k = 0; k < c * 3; k++) { ctx.fillStyle = T; ctx.beginPath(); ctx.arc((k % c) * 300 + (LAND ? 210 : 90), (LAND ? 240 : 400) + Math.floor(k / c) * 300, 110, 0, TAU); ctx.fill(); } spyRunner(ctx, lerp(LAND ? 1650 : 900, LAND ? 300 : 200, lt / BEAT), (LAND ? 810 : 1050) - Math.sin(lt / BEAT * Math.PI) * 200, 1.8, ph, K); }
    if (b === 5) mid(() => { ctx.save(); ctx.translate(540 + Math.sin(lt * 10) * 20, 760); ctx.rotate(-.5); ctx.strokeStyle = C; ctx.lineWidth = 40; ctx.beginPath(); ctx.arc(0, -80, 170, 0, TAU); ctx.stroke(); ctx.fillStyle = K; ctx.fillRect(-28, 100, 56, 280); ctx.restore(); ctx.shadowColor = 'transparent'; ctx.fillStyle = C; ctx.font = "120px 'Bebas Neue'"; ctx.textAlign = 'center'; ctx.fillText('CODE', 520, 720); });
    if (b >= 6) {
      const u = t - 6 * BEAT; ctx.fillStyle = O; ctx.fillRect(0, lerp(-600, 360 + dy, eOutExpo(u / .2)), W, 260); ctx.fillStyle = T; ctx.fillRect(lerp(W, 0, eOutExpo((u - .1) / .2)), 980 + dy, W, 200);
      ctx.save(); ctx.translate(dx, dy);
      ctx.shadowColor = 'transparent'; ctx.font = "330px 'Bebas Neue'"; ctx.textAlign = 'left';
      const letters = [['C', 120], ['O', 300], ['D', 480], ['E', 650]];
      letters.forEach(([c, x], i) => { const e = eOutExpo(inv(i * .06, i * .06 + .25, u)); ctx.fillStyle = K; ctx.fillText(c, x + (1 - e) * (i % 2 ? 900 : -900), 880); });
      const e = eOutBack(inv(.35, .6, u)); ctx.save(); ctx.translate(900, 830); ctx.scale(e, e); ctx.fillStyle = O; ctx.beginPath(); ctx.arc(0, -100, 130, 0, TAU); ctx.fill(); ctx.fillStyle = C; ctx.font = "170px 'Bebas Neue'"; ctx.textAlign = 'center'; ctx.fillText('30', 0, -40); ctx.restore();
      ctx.fillStyle = C; ctx.font = "54px 'Bebas Neue'"; ctx.textAlign = 'center'; ctx.globalAlpha = smooth(.4, .6, u); ctx.fillText('IN  ·  ONE  ·  PROMPT', 540, 1100); ctx.globalAlpha = 1; ctx.restore();
    }
    ctx.restore(); ctx.textAlign = 'left';
    grain(ctx, Math.floor(t * 12), .3);
  }
});
