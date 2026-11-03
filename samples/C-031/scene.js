// C-031 包豪斯：只用圆、方、三角和红黄蓝黑，按网格定位；每个形状从画外用指数缓动猛冲进来、急停在格线上，
// 叠在一起的部分正片叠底出第三种颜色，最后标题从裁切框里升起。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-031', name: '包豪斯', dur: 3, still: 2.4,
  fonts: ["900 40px 'Noto Sans SC'", "40px 'Bebas Neue'"],
  text: '形式追随功能BAUHAUS',
  init() { return { paper: makePaper('#EEE6D3', { seed: 111, blot: 8, grain: 12 }) }; },
  draw(ctx, t, s) {
    ctx.drawImage(s.paper, 0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2;
    for (let x = 60; x < W; x += 160) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 40; y < H; y += 160) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const ein = (d, dur = .5) => eOutExpo(inv(d, d + dur, t));
    const red = '#DD3326', blue = '#1D4E9E', yel = '#F2C230', blk = '#161616';
    // 构图：竖屏沿用原版；横屏图形块排在左半和中间，竖条居中偏左，标题和副标题放到右下，红线贯穿底部
    const P = LAND ? { ci: [400, 400], bar: [880, 60], sq: [1240, 380], tri: [600, 740], dot: [1580, 210], ln: [80, 1010, 1840], hd: [1010, 880], sub: [1016, 955] }
                   : { ci: [380, 640], bar: [700, 300], sq: [860, 900], tri: [330, 1060], dot: [900, 470], ln: [80, 1180, 1000], hd: [70, 1140], sub: [76, 1215] };
    // red/black split circle
    let e = ein(0); ctx.save(); ctx.translate(lerp(-400, P.ci[0], e), P.ci[1]); ctx.rotate(eInOutCubic(inv(1.5, 1.9, t)) * Math.PI / 2);
    ctx.beginPath(); ctx.arc(0, 0, 240, 0, TAU); ctx.fillStyle = red; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 240, -Math.PI / 2, Math.PI / 2); ctx.fillStyle = blk; ctx.fill(); ctx.restore();
    // black bar
    e = ein(.15); ctx.fillStyle = blk; ctx.fillRect(P.bar[0], lerp(-1000, P.bar[1], e), 70, 960);
    ctx.save(); ctx.translate(P.bar[0] + 35, lerp(-1000, P.bar[1], e) + 40); ctx.rotate(Math.PI / 2); ctx.fillStyle = '#EEE6D3'; ctx.font = "900 46px 'Noto Sans SC'"; ctx.fillText('形式追随功能', 0, 16); ctx.restore();
    // blue square
    e = ein(.3); ctx.save(); ctx.translate(lerp(W + 420, P.sq[0], e), P.sq[1]); ctx.rotate((1 - e) * Math.PI / 4 + eInOutCubic(inv(2.25, 2.6, t)) * Math.PI / 2); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = blue; ctx.fillRect(-160, -160, 320, 320); ctx.restore();
    // yellow triangle
    e = ein(.45); ctx.save(); ctx.translate(P.tri[0], lerp(H + 380, P.tri[1], e)); ctx.globalCompositeOperation = 'multiply';
    ctx.beginPath(); ctx.moveTo(0, -230); ctx.lineTo(250, 190); ctx.lineTo(-250, 190); ctx.closePath(); ctx.fillStyle = yel; ctx.fill(); ctx.restore();
    // small black circle and red line
    e = ein(.6); ctx.beginPath(); ctx.arc(P.dot[0], lerp(-100, P.dot[1], e), 62, 0, TAU); ctx.fillStyle = blk; ctx.fill();
    e = ein(.7); ctx.strokeStyle = red; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(P.ln[0], P.ln[1]); ctx.lineTo(lerp(P.ln[0], P.ln[2], e), P.ln[1]); ctx.stroke();
    // headline
    e = ein(.9, .45); ctx.fillStyle = blk; ctx.font = "250px 'Bebas Neue'";
    ctx.save(); ctx.beginPath(); ctx.rect(P.hd[0] - 10, P.hd[1] - 240, 1000, 260); ctx.clip(); ctx.fillText('BAUHAUS', P.hd[0], lerp(P.hd[1] + 280, P.hd[1], e)); ctx.restore();
    ctx.font = "44px 'Bebas Neue'"; ctx.fillStyle = red; ctx.globalAlpha = ein(1.2); ctx.fillText('1919 — WEIMAR — FORM · COLOUR · GRID', ...P.sub); ctx.globalAlpha = 1;
  }
});
