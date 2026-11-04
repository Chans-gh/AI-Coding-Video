// C-061 1920 年代默片：先在一块小画布上画好画面（灰阶街景、踩香蕉皮滑倒的绅士、字幕卡），每秒 16 格抖动，
// 叠上泛黄、颗粒、划痕、尘点、暗角和亮度闪烁，再放进红丝绒幕布中间的银幕。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-061', name: '1920 年代默片', dur: 3, still: 2.4,
  fonts: ["900 40px 'Noto Serif SC'", "700 40px 'Noto Serif SC'"],
  text: '片刻之后……他再也不碰香蕉了',
  init() { return { scr: mk(880, 660) }; },
  draw(ctx, t, s, f) {
    const fr = Math.floor(t * 16), tt = fr / 16;
    ctx.fillStyle = '#0A0505'; ctx.fillRect(0, 0, W, H);
    // 构图：竖屏沿用原版（银幕在中间、上下是黑场）；横屏幕布帷幔上移，银幕放大到 1.15 倍居中，两侧幕布加宽
    const sw = 880, sh = 660, g = s.scr.getContext('2d');
    const P = LAND ? { k: 1.15, sx: (W - 880 * 1.15) / 2, sy: 225, vy: 60, cw: 300, cb: H } : { k: 1, sx: 100, sy: 580, vy: 420, cw: 150, cb: 1380 };
    g.save(); g.translate((hash1(fr) - .5) * 6, (hash1(fr + 50) - .5) * 6);
    if (t < 1.7) {
      const sk = g.createLinearGradient(0, 0, 0, sh); sk.addColorStop(0, '#D8D2C4'); sk.addColorStop(1, '#A8A294'); g.fillStyle = sk; g.fillRect(-10, -10, sw + 20, sh + 20);
      g.fillStyle = '#6E6A60'; [[40, 180, 140, 330], [200, 120, 120, 390], [340, 220, 160, 290], [560, 150, 130, 360], [700, 200, 170, 310]].forEach(([x, y, w, h]) => { g.fillRect(x, y, w, h); g.fillStyle = '#8E8A80'; for (let yy = y + 20; yy < y + h - 40; yy += 50) for (let xx = x + 16; xx < x + w - 20; xx += 36) g.fillRect(xx, yy, 18, 26); g.fillStyle = '#6E6A60'; });
      g.fillStyle = '#4A463E'; g.fillRect(0, 510, sw, 150);
      g.fillStyle = '#2A2824'; g.fillRect(700, 250, 10, 270); g.beginPath(); g.moveTo(680, 250); g.lineTo(730, 250); g.lineTo(720, 225); g.lineTo(690, 225); g.fill();
      // banana peel
      g.fillStyle = '#E8E2D0'; g.beginPath(); g.ellipse(520, 530, 26, 8, 0, 0, TAU); g.fill();
      // the gentleman
      const slip = eOutCubic(inv(1.1, 1.35, tt)), mx = Math.min(lerp(120, 560, tt / 1.1), 520 + slip * 60);
      g.save(); g.translate(mx, 520 - slip * 60 + Math.abs(Math.sin(tt * 12)) * 6 * (1 - slip)); g.rotate(-slip * 1.9); g.fillStyle = '#141210'; g.strokeStyle = '#141210'; g.lineCap = 'round';
      const lg = Math.sin(tt * 12) * .5 * (1 - slip);
      g.lineWidth = 14; g.beginPath(); g.moveTo(0, -80); g.lineTo(Math.sin(lg) * 70, 0); g.moveTo(0, -80); g.lineTo(-Math.sin(lg) * 70, 0); g.stroke();
      g.beginPath(); g.moveTo(-26, -200); g.lineTo(26, -200); g.lineTo(34, -70); g.lineTo(-34, -70); g.closePath(); g.fill();
      g.fillStyle = '#E4DED0'; g.beginPath(); g.arc(0, -226, 24, 0, TAU); g.fill(); g.fillStyle = '#141210'; g.fillRect(-30, -252, 60, 8); g.beginPath(); g.ellipse(0, -258, 22, 16, 0, Math.PI, TAU); g.fill();
      g.lineWidth = 6; g.beginPath(); g.moveTo(24, -150); g.lineTo(60, -40 + slip * -80); g.stroke(); g.restore();
      if (slip > .3) { g.fillStyle = '#141210'; for (let k = 0; k < 3; k++) g.fillRect(560 + k * 30 - 30, 400 - k * 20, 6, 30); }
    } else {
      g.fillStyle = '#0B0A09'; g.fillRect(-10, -10, sw + 20, sh + 20); g.strokeStyle = '#E8E0CC'; g.lineWidth = 4; g.strokeRect(40, 40, sw - 80, sh - 80); g.lineWidth = 1.5; g.strokeRect(56, 56, sw - 112, sh - 112);
      [[40, 40], [sw - 40, 40], [40, sh - 40], [sw - 40, sh - 40]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 18, 0, TAU); g.stroke(); });
      g.fillStyle = '#EDE6D2'; g.textAlign = 'center'; g.font = "900 84px 'Noto Serif SC'"; g.fillText('片刻之后……', sw / 2, sh / 2 + 10);
      g.font = "700 36px 'Noto Serif SC'"; g.fillText('— 他再也不碰香蕉了 —', sw / 2, sh / 2 + 90); g.textAlign = 'left';
    }
    g.restore();
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#EADBB8'; g.fillRect(0, 0, sw, sh); g.restore();
    g.save(); g.globalAlpha = .6; g.drawImage(GRAINS.length ? GRAINS[fr % 6] : makeGrain(10, 10, .1, 1), 0, 0, sw, sh); g.restore();
    const R = mulberry32(fr * 31); for (let k = 0; k < 2; k++) if (R() < .7) { g.fillStyle = 'rgba(250,245,230,.5)'; g.fillRect(R() * sw, 0, 2, sh); }
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(0,0,0,.7)'; g.beginPath(); g.arc(R() * sw, R() * sh, 1 + R() * 4, 0, TAU); g.fill(); }
    const vg = g.createRadialGradient(sw / 2, sh / 2, 200, sw / 2, sh / 2, 560); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = vg; g.fillRect(0, 0, sw, sh);
    g.fillStyle = `rgba(255,250,235,${hash1(fr * 3) * .1})`; g.fillRect(0, 0, sw, sh);
    ctx.drawImage(s.scr, P.sx, P.sy, sw * P.k, sh * P.k);
    // velvet curtains
    const curtain = (x0, w, dir) => { const cg = ctx.createLinearGradient(x0, 0, x0 + w, 0); for (let k = 0; k <= 8; k++) cg.addColorStop(k / 8, k % 2 ? '#5E0A12' : '#9E1A24'); ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(x0, P.vy + 10); ctx.lineTo(x0 + w, P.vy + 10); ctx.quadraticCurveTo(x0 + w - dir * 40, (P.vy + P.cb) / 2, x0 + w + dir * 20, P.cb); ctx.lineTo(x0, P.cb); ctx.fill(); };
    ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); curtain(0, P.cw, 1); ctx.restore(); curtain(0, P.cw, 1);
    ctx.fillStyle = '#7A121B'; ctx.fillRect(0, P.vy, W, 110); ctx.fillStyle = '#9E1A24'; for (let x = 0; x < W; x += 90) { ctx.beginPath(); ctx.arc(x + 45, P.vy + 110, 45, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = '#D4A94A'; ctx.fillRect(0, P.vy, W, 10);
    for (let x = 0; x < W; x += 30) { ctx.fillStyle = '#D4A94A'; ctx.fillRect(x + 12, P.vy + 155, 6, 16); }
  }
});
