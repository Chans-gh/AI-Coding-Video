// C-052 连环漫画：四格依次弹出，网点用错位圆点阵铺、集中线从中心放射、对白气泡带尾巴，
// 拟声字加粗黑描边、斜切变形、落下时抖几下。由 opus40 的同名场景改写，横屏改成两行两列。
function toneFill(ctx, x, y, w, h, step = 12, r = 3, col = '#111') { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = col; for (let yy = y; yy < y + h; yy += step) for (let xx = x + ((yy - y) / step % 2) * step / 2; xx < x + w; xx += step) { ctx.beginPath(); ctx.arc(xx, yy, r, 0, TAU); ctx.fill(); } ctx.restore(); }
function bubble(ctx, x, y, w, h, tx, ty, txt, size = 42) {
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, TAU); ctx.moveTo(x - 20, y + h * .8); ctx.lineTo(tx, ty); ctx.lineTo(x + 20, y + h * .85);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, w - 3, h - 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#111'; ctx.font = `900 ${size}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText(txt, x, y + size * .36); ctx.restore();
}
scene({
  id: 'C-052', name: '连环漫画 / 漫画分格', dur: 3, still: 2.4,
  fonts: ["900 40px 'Noto Sans SC'", "40px 'Bangers'"],
  text: '只写了一句提示词……咦？！！砰40种画风',
  draw(ctx, t, s, f) {
    ctx.fillStyle = '#FAFAF7'; ctx.fillRect(0, 0, W, H);
    // 整页从头到尾极慢地推近一点，分格之间不会完全静止
    const push = 1 + .03 * t / 3; ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);
    // 构图：竖屏四格竖排、拉高到铺满画面；横屏排成两行两列，第一、四格里按竖屏坐标画的内容平移到新格子中间
    const PP = [[60, 320, 960, 290], [60, 630, 450, 380], [530, 630, 490, 380], [60, 1030, 960, 210]];
    const panels = LAND ? [[60, 60, 1100, 470], [1180, 60, 680, 470], [60, 550, 700, 470], [780, 550, 1080, 470]]
                         : [[60, 160, 960, 460], [60, 650, 450, 600], [530, 650, 490, 600], [60, 1280, 960, 480]];
    panels.forEach(([x, y, w, h]) => { ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.strokeRect(x, y, w, h); });
    const show = (i, fn, abs) => {
      const a = inv(i * .6, i * .6 + .15, t); if (a <= 0) return; const [x, y, w, h] = panels[i]; const sc = lerp(1.12, 1, eOutCubic(a));
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-x - w / 2, -y - h / 2);
      ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h);
      if (abs) { const [px, py, pw, ph] = PP[i]; ctx.translate(x + w / 2 - px - pw / 2, y + h / 2 - py - ph / 2); fn(px - (w - pw) / 2, py - (h - ph) / 2, w, h); } else fn(x, y, w, h);
      ctx.restore(); ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.strokeRect(x, y, w, h);
    };
    // P1 — at the desk
    show(0, (x, y, w, h) => {
      toneFill(ctx, x, y, w, h, 14, 2.6, '#bbb');
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(300, 520, 80, 90, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(210, 500); for (let k = 0; k < 7; k++) ctx.lineTo(220 + k * 26, 420 - (k % 2) * 40); ctx.lineTo(390, 490); ctx.quadraticCurveTo(300, 450, 210, 500); ctx.fill();
      ctx.beginPath(); ctx.ellipse(340, 525, 8, 14, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(220, 610); ctx.lineTo(380, 610); ctx.lineTo(420, 640); ctx.lineTo(180, 640); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(480, 600); ctx.lineTo(560, 420); ctx.lineTo(760, 420); ctx.lineTo(700, 600); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#111'; ctx.fillRect(450, 598, 330, 12);
      bubble(ctx, 760, 395, 220, 60, 620, 450, '只写了一句提示词……', 36);
    }, true);
    // P2 — shocked eyes, speed lines
    show(1, (x, y, w, h) => {
      ctx.strokeStyle = '#111'; ctx.lineWidth = 3; const c = [x + w / 2, y + h / 2];
      for (let k = 0; k < 70; k++) { const a = k / 70 * TAU + hash1(k) * .05; ctx.beginPath(); ctx.moveTo(c[0] + Math.cos(a) * 150, c[1] + Math.sin(a) * 120); ctx.lineTo(c[0] + Math.cos(a) * 500, c[1] + Math.sin(a) * 500); ctx.stroke(); }
      [-95, 95].forEach(dx => {
        ctx.save(); ctx.translate(c[0] + dx, c[1] + 10); ctx.fillStyle = '#fff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(0, 0, 70, 82, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 6, 22 + Math.sin(t * 40) * 2, 26, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-8, -4, 8, 0, TAU); ctx.fill();
        ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-60, -110); ctx.lineTo(60, -100 - dx * .1); ctx.stroke(); ctx.restore();
      });
      ctx.fillStyle = '#9ED8F5'; ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + w - 90, y + 80); ctx.quadraticCurveTo(x + w - 60, y + 140, x + w - 90, y + 150); ctx.quadraticCurveTo(x + w - 120, y + 140, x + w - 90, y + 80); ctx.fill(); ctx.stroke();
      bubble(ctx, x + 110, y + 300, 80, 46, x + 170, y + 250, '咦？', 44);
    });
    // P3 — screen burst
    show(2, (x, y, w, h) => {
      toneFill(ctx, x, y, w, h, 10, 3.4, '#222'); const c = [x + w / 2, y + h / 2 + 10];
      ctx.fillStyle = '#fff'; ctx.beginPath(); for (let k = 0; k < 32; k++) { const a = k / 32 * TAU, r = k % 2 ? 110 : 250 + hash1(k) * 60; ctx.lineTo(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * .8); } ctx.closePath(); ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.stroke();
      ctx.save(); ctx.translate(c[0], c[1] + 30); ctx.rotate(-.1); ctx.font = "150px 'Bangers'"; ctx.textAlign = 'center'; ctx.lineWidth = 12; ctx.strokeStyle = '#111'; ctx.strokeText('!!', 0, 0); ctx.fillStyle = '#FFD400'; ctx.fillText('!!', 0, 0); ctx.restore();
    });
    // P4 — SFX
    show(3, (x, y, w, h) => {
      ctx.strokeStyle = '#111'; ctx.lineWidth = 4; for (let k = 0; k < 40; k++) { const yy = y + hash1(k) * h; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 200 + hash1(k + 9) * 300, yy); ctx.stroke(); }
      const p = eOutBack(inv(1.8, 2.05, t), 3), sh = t > 2.05 && t < 2.35 ? Math.sin(t * 90) * 8 : 0;
      ctx.save(); ctx.translate(360 + sh, y + h / 2 + 50); ctx.rotate(-.12); ctx.scale(p, p); ctx.transform(1, 0, -.2, 1, 0, 0);
      ctx.font = "900 190px 'Noto Sans SC'"; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = '#111'; ctx.strokeText('砰！', 0, 0); ctx.fillStyle = '#FF3B3B'; ctx.fillText('砰！', 0, 0); ctx.restore();
      if (t > 2.3) bubble(ctx, 800, y + h / 2, 190, 70, 640, y + h / 2 + 20, '40 种画风？！', 48);
    }, true);
    ctx.restore();
  }
});
