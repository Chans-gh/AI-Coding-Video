// C-041 公式推导：用 Canvas 照 Manim 的样子画（深底、蓝黄配色、斜体公式），不是真的 Manim；
// 每拍多加一项正弦，本轮圆串起来转，笔尖描出的波形一拍比一拍更接近方波，公式同步加项。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-041', name: '公式推导讲解（Manim）', dur: 3, still: 2.4,
  fonts: ["italic 40px 'Playfair Display'", "700 40px 'Noto Sans SC'", "900 40px 'Noto Sans SC'"],
  text: '每多一项，就更接近方波傅里叶级数',
  draw(ctx, t) {
    ctx.fillStyle = '#0E0E10'; ctx.fillRect(0, 0, W, H);
    const blue = '#58C4DD', yel = '#F7D96F', wht = '#ECECEC', A = 95;
    // 构图：竖屏沿用原版；横屏标题和公式放在上方，本轮圆在左、描出的波形向右拉长到画面右侧，结论在底部
    const P = LAND ? { cx: 330, cy: 610, OX: 620, LEN: 1080, FY: 280, F0: 330, ti: [160, 160], n: [160, 900], cap: [960, 1000] }
                   : { cx: 250, cy: 990, OX: 490, LEN: 540, FY: 670, F0: 250, ti: [80, 570], n: [80, 1260], cap: [540, 1375] };
    const { cx, cy, OX, LEN, FY, F0 } = P;
    const nT = Math.min(8, 1 + Math.floor(t / BEAT)), grow = eOutCubic((t % BEAT) / .2);
    // axes
    ctx.strokeStyle = 'rgba(236,236,236,.7)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(OX - 20, cy); ctx.lineTo(OX + LEN + 10, cy); ctx.moveTo(OX, cy - 190); ctx.lineTo(OX, cy + 190); ctx.stroke();
    for (let x = OX + 40; x < OX + LEN + 10; x += 60) { ctx.beginPath(); ctx.moveTo(x, cy - 8); ctx.lineTo(x, cy + 8); ctx.stroke(); }
    // square-wave target (dashed)
    ctx.save(); ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(236,236,236,.35)'; ctx.beginPath();
    const th0 = t * 2.4; for (let x = 0; x <= LEN; x += 2) { const ph = th0 - x * .02; ctx.lineTo(OX + x, cy - Math.sign(Math.sin(ph)) * A * 1.0); } ctx.stroke(); ctx.restore();
    // epicycles
    let x = cx, y = cy;
    for (let k = 0; k < nT; k++) {
      const n = 2 * k + 1, r = 4 / (n * Math.PI) * A * (k === nT - 1 ? grow : 1), a = n * th0;
      ctx.strokeStyle = `rgba(88,196,221,${k === 0 ? .9 : .55})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, Math.abs(r), 0, TAU); ctx.stroke();
      const nx = x + Math.cos(a) * r, ny = y - Math.sin(a) * r; ctx.strokeStyle = wht; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke(); x = nx; y = ny;
    }
    ctx.fillStyle = yel; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(247,217,111,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(OX, y); ctx.stroke();
    // traced wave
    ctx.strokeStyle = yel; ctx.lineWidth = 4.5; ctx.beginPath();
    for (let px = 0; px <= LEN; px += 2) {
      const ph = th0 - px * .02; let v = 0; for (let k = 0; k < nT; k++) { const n = 2 * k + 1; v += 4 / (n * Math.PI) * Math.sin(n * ph) * (k === nT - 1 ? grow : 1); }
      ctx.lineTo(OX + px, cy - v * A);
    }
    ctx.stroke();
    // formula
    ctx.fillStyle = wht; ctx.textAlign = 'center';
    ctx.font = "italic 64px 'Playfair Display'"; ctx.fillText('f(x) = ', F0, FY);
    ctx.font = "italic 60px 'Playfair Display'"; ctx.fillText('4', F0 + 145, FY - 30); ctx.fillText('π', F0 + 145, FY + 40); ctx.fillRect(F0 + 120, FY - 15, 50, 3);
    const terms = ['sin x', 'sin 3x', 'sin 5x', 'sin 7x'];
    let fx = F0 + 200; ctx.textAlign = 'left';
    for (let k = 0; k < Math.min(nT, 4); k++) {
      const a = k === nT - 1 ? grow : 1; ctx.globalAlpha = a; ctx.fillStyle = k === nT - 1 ? yel : wht;
      const n = 2 * k + 1, txt = (k ? '+ ' : '( ') + (n === 1 ? terms[0] : `${terms[k]}/${n}`); ctx.font = "italic 44px 'Playfair Display'";
      const w = ctx.measureText(txt).width; if (fx + w > OX + LEN) break; ctx.fillText(txt, fx, FY + (1 - a) * 20); fx += w + 12;
    }
    ctx.globalAlpha = 1; ctx.fillStyle = wht; if (nT > 4) { ctx.font = "italic 44px 'Playfair Display'"; ctx.fillText('+ … )', Math.min(fx, OX + LEN - 120), FY); }
    ctx.font = "italic 40px 'Playfair Display'"; ctx.fillStyle = blue; ctx.fillText(`n = ${nT}`, ...P.n);
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(236,236,236,.9)'; ctx.font = "700 40px 'Noto Sans SC'"; ctx.fillText('每多一项，就更接近方波', ...P.cap); ctx.textAlign = 'left';
    ctx.fillStyle = wht; ctx.font = "900 44px 'Noto Sans SC'"; ctx.fillText('傅里叶级数', ...P.ti);
  }
});
