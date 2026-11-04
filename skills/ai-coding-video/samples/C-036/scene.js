// C-036 动态文字排版：画面只有字，每拍换一个词并反色，冲击缩放，窄体大字配 HUD 式小字标注
// 由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-036', name: '动态文字排版', dur: 3, still: 1.95,
  fonts: ["900 150px 'Noto Sans SC'", "200px 'Bebas Neue'", "700 24px 'JetBrains Mono'"],
  text: '一句提示词→一段代码×30每秒成片',
  draw(ctx, t, s, f) {
    const words = ['一句', '提示词', '→', '一段', '代码', '×30', '每秒', '成片'];
    const b = Math.min(7, Math.floor(t / BEAT)), lt = t - b * BEAT, inv_ = b % 3 === 2 || b === 6;
    const bg = inv_ ? '#F2F2EE' : '#0A0A0A', fg = inv_ ? '#0A0A0A' : '#F2F2EE', acc = '#D4FF3A';
    ctx.fillStyle = b === 5 ? acc : bg; ctx.fillRect(0, 0, W, H);
    const col = b === 5 ? '#0A0A0A' : fg;
    // ghost repeats
    ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = col; ctx.font = "900 150px 'Noto Sans SC'";
    for (let k = 0; k < (LAND ? 7 : 9); k++) ctx.fillText(words[b].repeat(LAND ? 6 : 4), -200 + ((k % 2 ? 1 : -1) * t * 200) % 400, (LAND ? 100 : 330) + k * 160);
    ctx.restore();
    const w = words[b], punch = lerp(1.18, 1, eOutExpo(lt / .1));
    ctx.save(); ctx.translate(W / 2, LAND ? H / 2 : 820); ctx.scale(punch * .78, punch);
    const isLatin = /[×0-9＝]/.test(w);
    let size = 520; ctx.font = isLatin ? `${size * 1.3}px 'Bebas Neue'` : `900 ${size}px 'Noto Sans SC'`;
    while (ctx.measureText(w).width > (LAND ? 2100 : 1240) && size > 100) { size -= 10; ctx.font = isLatin ? `${size * 1.3}px 'Bebas Neue'` : `900 ${size}px 'Noto Sans SC'`; }
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(w, 0, 0); ctx.restore();
    // HUD annotations
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.font = "700 24px 'JetBrains Mono'"; ctx.textBaseline = 'alphabetic';
    const yT = LAND ? 90 : 350, yB = LAND ? H - 60 : 1200, xR = W - 60;
    ctx.fillText(`[ ${String(b + 1).padStart(2, '0')} / 08 ]`, 60, yT); ctx.textAlign = 'right'; ctx.fillText(`t=${(t).toFixed(3)}s`, xR, yT);
    ctx.fillText(`BPM 160 · BEAT ${b + 1}`, xR, yB); ctx.textAlign = 'left'; ctx.fillText('KINETIC TYPE', 60, yB);
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(60, yT + 30); ctx.lineTo(xR, yT + 30); ctx.moveTo(60, yB - 35); ctx.lineTo(xR, yB - 35); ctx.stroke();
    for (let x = 60; x <= xR; x += 24) { ctx.beginPath(); ctx.moveTo(x, yB - 35); ctx.lineTo(x, x % 120 === 60 ? yB - 55 : yB - 45); ctx.stroke(); }
    const cx = W / 2 + Math.sin(t * 7) * (LAND ? 600 : 300), cy = (LAND ? H / 2 : 820) + Math.cos(t * 5) * (LAND ? 260 : 200);
    ctx.beginPath(); ctx.moveTo(cx - 30, cy); ctx.lineTo(cx + 30, cy); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy + 30); ctx.stroke();
    ctx.font = "20px 'JetBrains Mono'"; ctx.fillText(`x:${Math.round(cx)} y:${Math.round(cy)}`, cx + 36, cy - 12);
    ctx.fillStyle = acc; if (b !== 5) ctx.fillRect(60, yT + 40, (xR - 60) * (lt / BEAT), 6);
  }
});
