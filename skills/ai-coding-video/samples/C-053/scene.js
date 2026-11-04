// C-053 像素平台：先在很小的画布上逐像素画（竖屏 180×320，横屏 384×216），再关掉平滑放大，限定调色板
// 由 opus40 的同名场景改写，横屏重新构图。
const PX_HERO = [
  '...KK....KK.', '..KOOK..KOOK', '..KOOOKKOOOK', '.KOOOOOOOOOK', '.KOWWOOOWWOK', '.KOWKOOOWKOK', '.KOOOOPPOOOK', '..KOOOOOOOK.',
  '..KBBBBBBBK.', '.KOBBYBBBBOK', '.KOBBBBBBBOK', '..KBBBBBBBK.'];
const PX_LEG = [['..KK...KK...', '..KK...KK...'], ['.KK.....KK..', '...KK.KK....']];
const PX_PAL = { K: '#1B1B2F', O: '#FF8C2B', W: '#FFFFFF', P: '#FF6FA0', B: '#2D6BE0', Y: '#FFE14D' };
scene({
  id: 'C-053', name: '像素平台', dur: 3, still: 2.6,
  fonts: ["30px 'Press Start 2P'"],
  init() { return { lo: LAND ? mk(384, 216) : mk(180, 320), X0: LAND ? 100 : 0 }; },
  draw(ctx, t, s, f) {
    const g = s.lo.getContext('2d'), cam = t * 34, LW = s.lo.width, X0 = s.X0;
    const bands = ['#5A8CFF', '#6F9CFF', '#86AEFF', '#A2C2FF'];
    bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 50, LW, 50); });
    g.fillStyle = '#A2C2FF'; g.fillRect(0, 200, LW, 120);
    g.save(); g.translate(X0, -56);
    // clouds
    const cloud = (x, y) => { g.fillStyle = '#fff'; g.fillRect(x + 4, y, 16, 4); g.fillRect(x, y + 4, 28, 6); g.fillRect(x + 2, y + 10, 24, 2); g.fillStyle = '#D5E3FF'; g.fillRect(x + 2, y + 10, 24, 2); };
    for (let i = 0; i < 4; i++) cloud(((i * 70 - cam * .2) % (LW + 100) + LW + 100) % (LW + 100) - 40 - X0, (LAND ? 74 : 40) + (i % 2) * 34);
    // hills
    for (let x = -X0; x < LW - X0; x++) { const wx = x + cam * .45; const h = 40 + Math.round(18 * Math.sin(wx * .04) + 10 * Math.sin(wx * .11)); g.fillStyle = '#2FA25A'; g.fillRect(x, 250 - h, 1, h); if ((Math.floor(wx) * 7 + h) % 13 === 0) { g.fillStyle = '#207A43'; g.fillRect(x, 256 - h + 6, 1, 2); } }
    // ground tiles
    const tile = (x, y, top) => { g.fillStyle = '#C8672C'; g.fillRect(x, y, 16, 16); g.fillStyle = '#7A3510'; g.fillRect(x, y + 7, 16, 1); g.fillRect(x + 7, y, 1, 7); g.fillRect(x + 3, y + 8, 1, 8); g.fillRect(x + 12, y + 8, 1, 8); g.fillStyle = '#E8955A'; g.fillRect(x, y, 16, 1); if (top) { g.fillStyle = '#5BD15B'; g.fillRect(x, y, 16, 3); g.fillStyle = '#2E9E3A'; g.fillRect(x, y + 3, 16, 1); } };
    for (let x = -((cam) % 16) - 16 - Math.ceil(X0 / 16) * 16; x < LW - X0; x += 16) { tile(Math.round(x), 256, true); tile(Math.round(x), 272); tile(Math.round(x), 288); tile(Math.round(x), 304); tile(Math.round(x), 320); tile(Math.round(x), 336); tile(Math.round(x), 352); tile(Math.round(x), 368); }
    const plats = [[90, 206, 3], [150, 170, 3], [215, 138, 2], [262, 186, 3]];
    plats.forEach(([wx, y, n]) => { for (let i = 0; i < n; i++) tile(Math.round(wx + i * 16 - cam), y, true); });
    // question block
    const qx = Math.round(200 - cam), qy = 70, bl = (f >> 3) % 2;
    g.fillStyle = '#7A3510'; g.fillRect(qx, qy, 16, 16); g.fillStyle = bl ? '#FFC21A' : '#FFD95A'; g.fillRect(qx + 1, qy + 1, 14, 14);
    g.fillStyle = '#7A3510'; g.fillRect(qx + 6, qy + 4, 4, 1); g.fillRect(qx + 9, qy + 5, 1, 3); g.fillRect(qx + 7, qy + 8, 2, 1); g.fillRect(qx + 7, qy + 11, 2, 2);
    // hero jump path (jumps on beats 1,3,5)
    const hx = 58; const jumps = [[.35, 256, 206], [1.1, 206, 170], [1.85, 170, 138]];
    let hy = 256, air = false;
    for (const [t0, y0, y1] of jumps) { if (t >= t0 && t < t0 + .55) { const k = (t - t0) / .55; hy = lerp(y0, y1, k) - Math.sin(k * Math.PI) * 44; air = true; } else if (t >= t0 + .55) hy = y1; }
    // coins
    const coins = [[112, 150, .62], [150, 118, 1.38], [196, 84, 2.1], [230, 100, 99], [250, 110, 99]];
    coins.forEach(([wx, y, tc], i) => {
      const x = Math.round(wx - cam); if (t > tc) { if (t < tc + .5) { g.fillStyle = '#fff'; g.font = '8px "Press Start 2P"'; g.fillText('100', x - 6, y - (t - tc) * 30); } return; }
      const w = Math.max(1, Math.round(Math.abs(Math.cos(t * 7 + i)) * 8)); g.fillStyle = '#7A3510'; g.fillRect(x - w / 2 - 1, y - 1, w + 2, 12); g.fillStyle = '#FFD21A'; g.fillRect(x - w / 2, y, w, 10); g.fillStyle = '#FFF3A0'; g.fillRect(x - w / 2, y + 1, 1, 6);
    });
    // flag
    const fx = Math.round(330 - cam); g.fillStyle = '#E0E0E0'; g.fillRect(fx, 60, 2, 196); g.fillStyle = '#2FD06A'; g.beginPath(); g.moveTo(fx + 2, 62 + Math.min(1, t / 3) * 20); g.lineTo(fx + 20, 70 + Math.min(1, t / 3) * 20); g.lineTo(fx + 2, 78 + Math.min(1, t / 3) * 20); g.fill();
    // hero
    const legs = air ? PX_LEG[0][0] : PX_LEG[1][(f >> 2) % 2];
    const spr = [...PX_HERO, legs];
    spr.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') { g.fillStyle = PX_PAL[c]; g.fillRect(hx - 6 + x, Math.round(hy) - spr.length + y, 1, 1); } }));
    g.restore();
    ctx.imageSmoothingEnabled = false; ctx.drawImage(s.lo, 0, 0, W, H); ctx.imageSmoothingEnabled = true;
    // HUD
    const coinsGot = coins.filter(c => t > c[2]).length;
    ctx.font = "30px 'Press Start 2P'"; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    const hy0 = LAND ? 90 : 360; ctx.fillText('SCORE ' + String(coinsGot * 100 + 4000).padStart(6, '0'), 60, hy0); ctx.textAlign = 'right'; ctx.fillText('x' + String(coinsGot + 12).padStart(2, '0'), W - 60, hy0); ctx.textAlign = 'left';
    const cl = inv(2.3, 2.5, t);
    if (cl > 0) {
      const y = (LAND ? 380 : 760) + Math.round((1 - eOutBack(cl, 3)) * -300 / 6) * 6;
      ctx.textAlign = 'center'; ctx.font = "66px 'Press Start 2P'";
      ctx.fillStyle = '#1B1B2F'; ctx.fillText('STAGE', W / 2 + 6, y + 6); ctx.fillText('CLEAR!', W / 2 + 6, y + 102);
      ctx.fillStyle = (f >> 2) % 2 ? '#FFE14D' : '#FFFFFF'; ctx.fillText('STAGE', W / 2, y); ctx.fillText('CLEAR!', W / 2, y + 96); ctx.textAlign = 'left';
    }
  }
});
