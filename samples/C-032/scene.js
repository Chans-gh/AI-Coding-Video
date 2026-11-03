// C-032 孟菲斯：撞色几何块（波点圆、三角、波浪线、锯齿条、条纹半圆、格子方块）加粗黑描边，
// 按顺序弹性放大入场，之后每拍整体轻轻一跳；标题错位叠一层黑影。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-032', name: '孟菲斯', dur: 3, still: 2.4,
  fonts: ["40px 'ZCOOL KuaiLe'"],
  text: '嗨！新品上线',
  init() {
    const R = mulberry32(33), conf = [];
    for (let i = 0; i < 46; i++) conf.push({ x: R() * W, y: LAND ? 60 + R() * 960 : 320 + R() * 1400, k: Math.floor(R() * 4), c: ['#FFD23F', '#3BCEAC', '#2E86DE', '#111', '#FF5D8F'][Math.floor(R() * 5)], r: R() * TAU, s: 14 + R() * 18, d: R() * .9 });
    return { conf };
  },
  draw(ctx, t, s) {
    ctx.fillStyle = '#FBC4D4'; ctx.fillRect(0, 0, W, H);
    // background dots grid
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    for (let y = 0; y < H; y += 40) for (let x = (y / 40 % 2) * 20; x < W; x += 40) { ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); }
    const bt = t % BEAT, pulse = 1 + .07 * Math.exp(-bt / .09);
    const pop = d => eOutElastic(inv(d, d + .6, t));
    const put = (x, y, d, rot, fn) => { const s = pop(d) * pulse; if (s <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); fn(); ctx.restore(); };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // 构图：竖屏沿用原版；横屏标题居中，几何块分到四角，波浪线在正上方、锯齿条在标题下面
    const P = LAND ? { ci: [330, 400], tri: [1580, 330], sq: [960, 220], zz: [960, 830], hc: [1620, 840], gr: [300, 840], hd: [960, 580] }
                   : { ci: [320, 760], tri: [800, 560], sq: [560, 420], zz: [560, 1300], hc: [850, 1060], gr: [230, 1350], hd: [540, 990] };
    // teal circle with dots
    put(...P.ci, 0, t * .3, () => {
      ctx.beginPath(); ctx.arc(0, 0, 220, 0, TAU); ctx.fillStyle = '#3BCEAC'; ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = '#111'; ctx.stroke();
      ctx.save(); ctx.clip(); ctx.fillStyle = '#111';
      for (let y = -220; y < 220; y += 44) for (let x = -220; x < 220; x += 44) { ctx.beginPath(); ctx.arc(x + (y / 44 % 2) * 22, y, 7, 0, TAU); ctx.fill(); }
      ctx.restore();
    });
    // yellow triangle
    put(...P.tri, .12, -.2 + Math.sin(t * 4) * .1, () => {
      ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(140, 110); ctx.lineTo(-140, 110); ctx.closePath();
      ctx.fillStyle = '#FFD23F'; ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = '#111'; ctx.stroke();
    });
    // blue squiggle
    put(...P.sq, .24, 0, () => {
      ctx.beginPath(); for (let x = -260; x <= 260; x += 6) ctx.lineTo(x, Math.sin(x * .045 + t * 8) * 34);
      ctx.lineWidth = 26; ctx.strokeStyle = '#2E86DE'; ctx.stroke();
    });
    // zigzag band
    put(...P.zz, .36, -.08, () => {
      ctx.fillStyle = '#111'; ctx.fillRect(-380, -46, 760, 92);
      ctx.beginPath(); for (let i = 0; i <= 19; i++) ctx.lineTo(-380 + i * 40, i % 2 ? -26 : 26);
      ctx.lineWidth = 12; ctx.strokeStyle = '#FFD23F'; ctx.stroke();
    });
    // striped half circle
    put(...P.hc, .48, Math.sin(t * 3) * .2, () => {
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 150, Math.PI, 0); ctx.closePath(); ctx.clip();
      for (let i = -160; i < 160; i += 28) { ctx.fillStyle = (i / 28) % 2 ? '#FF5D8F' : '#fff'; ctx.fillRect(i, -160, 14, 170); }
      ctx.restore(); ctx.beginPath(); ctx.arc(0, 0, 150, Math.PI, 0); ctx.closePath(); ctx.lineWidth = 12; ctx.strokeStyle = '#111'; ctx.stroke();
    });
    // grid square
    put(...P.gr, .6, .3 + t * .2, () => {
      ctx.fillStyle = '#fff'; ctx.fillRect(-110, -110, 220, 220); ctx.strokeStyle = '#111'; ctx.lineWidth = 5;
      for (let i = -110; i <= 110; i += 36.6) { ctx.beginPath(); ctx.moveTo(i, -110); ctx.lineTo(i, 110); ctx.moveTo(-110, i); ctx.lineTo(110, i); ctx.stroke(); }
      ctx.lineWidth = 12; ctx.strokeRect(-110, -110, 220, 220);
    });
    // confetti
    s_conf(ctx, s.conf, t, pop, pulse);
    // headline
    const hs = eOutBack(inv(1.05, 1.35, t), 2.5) * (1 + .05 * Math.exp(-bt / .08));
    if (hs > 0) {
      ctx.save(); ctx.translate(...P.hd); ctx.rotate(-.06); ctx.scale(hs, hs); ctx.textAlign = 'center';
      ctx.font = "150px 'ZCOOL KuaiLe'"; ctx.lineJoin = 'round';
      ctx.fillStyle = '#111'; ctx.fillText('嗨！新品上线', 12, 12);
      ctx.lineWidth = 14; ctx.strokeStyle = '#111'; ctx.strokeText('嗨！新品上线', 0, 0);
      ctx.fillStyle = '#FFF'; ctx.fillText('嗨！新品上线', 0, 0); ctx.restore();
    }
  }
});
function s_conf(ctx, conf, t, pop, pulse) {
  for (const c of conf) {
    const s = pop(c.d) * pulse; if (s <= 0) continue;
    ctx.save(); ctx.translate(c.x, c.y + Math.sin(t * 3 + c.r) * 8); ctx.rotate(c.r + t * 1.5); ctx.scale(s, s);
    ctx.fillStyle = c.c; ctx.strokeStyle = '#111'; ctx.lineWidth = 4;
    if (c.k === 0) { ctx.beginPath(); ctx.arc(0, 0, c.s * .6, 0, TAU); ctx.fill(); ctx.stroke(); }
    else if (c.k === 1) { ctx.beginPath(); ctx.moveTo(0, -c.s); ctx.lineTo(c.s, c.s * .7); ctx.lineTo(-c.s, c.s * .7); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (c.k === 2) { ctx.fillRect(-c.s, -5, c.s * 2, 10); ctx.strokeRect(-c.s, -5, c.s * 2, 10); }
    else { ctx.beginPath(); for (let i = 0; i < 5; i++) ctx.lineTo(-c.s + i * c.s / 2, i % 2 ? -8 : 8); ctx.strokeStyle = c.c; ctx.lineWidth = 6; ctx.stroke(); }
    ctx.restore();
  }
}
