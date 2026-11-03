// C-014 浮世绘：平涂色块加雕版墨线，普鲁士蓝分层，天空晕染渐变，纸纹用 multiply 压在最上层，镜头像展开画卷一样横移
// 由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-014', name: '浮世绘', dur: 3, still: 2.2,
  fonts: ["900 60px 'Noto Serif SC'"],
  text: '海上浪起',
  init() {
    const paper = makePaper('#EDE0C0', { seed: 51, blot: 8, fiber: 1 });
    const R = mulberry32(5), spray = [];
    for (let i = 0; i < 70; i++) spray.push({ x: 380 + R() * 620, y: 420 + R() * 260, r: 5 + R() * 9, v: .5 + R() });
    return { paper, spray };
  },
  draw(ctx, t, s) {
    const pan = -eInOutCubic(t / 3) * 380;
    ctx.drawImage(s.paper, 0, 0, W, H);
    const SK = LAND ? 520 : 900, sky = ctx.createLinearGradient(0, 0, 0, SK); sky.addColorStop(0, 'rgba(22,52,104,.95)'); sky.addColorStop(.45, 'rgba(60,90,140,.35)'); sky.addColorStop(1, 'rgba(236,224,192,0)');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, SK);
    ctx.save(); if (LAND) { ctx.translate(100, -240); ctx.scale(.8, .8); } ctx.translate(pan, 0);
    const ink = '#1A2238', blue = '#1E4A86', deep = '#123463', light = '#6E94C4', foam = '#F4EEDD';
    // Mt Fuji
    ctx.beginPath(); ctx.moveTo(900, 1060); ctx.quadraticCurveTo(1080, 900, 1130, 880); ctx.lineTo(1170, 880); ctx.quadraticCurveTo(1230, 900, 1420, 1060); ctx.closePath();
    ctx.fillStyle = '#35507E'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1080, 920); ctx.quadraticCurveTo(1110, 890, 1130, 880); ctx.lineTo(1170, 880); ctx.quadraticCurveTo(1200, 895, 1225, 920); for (let i = 0; i < 6; i++) ctx.lineTo(1215 - i * 26, 935 + (i % 2) * 18); ctx.closePath();
    ctx.fillStyle = foam; ctx.fill(); ctx.stroke();
    // sea base
    ctx.fillStyle = blue; ctx.fillRect(-100, 1060, LAND ? 2900 : 1800, 900);
    for (let y = 1080; y < 1900; y += 34) { ctx.beginPath(); for (let x = -100; x < (LAND ? 2800 : 1700); x += 20) ctx.lineTo(x, y + Math.sin(x * .02 + y + t * 2) * 6); ctx.strokeStyle = light; ctx.lineWidth = 3; ctx.stroke(); }
    // small foreground wave
    const sw = (ox, oy, sc) => {
      ctx.save(); ctx.translate(ox, oy); ctx.scale(sc, sc);
      ctx.beginPath(); ctx.moveTo(-260, 200); ctx.quadraticCurveTo(-120, -40, 40, -60); ctx.quadraticCurveTo(160, -60, 200, 20); ctx.quadraticCurveTo(120, -10, 90, 40); ctx.quadraticCurveTo(150, 120, 260, 200); ctx.closePath();
      ctx.fillStyle = deep; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 5; ctx.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 11; const x = lerp(-100, 190, a), y = -50 + Math.sin(a * 3) * 20 + a * 40; ctx.beginPath(); ctx.arc(x, y, 16, Math.PI * .1, Math.PI * 1.3); ctx.fillStyle = foam; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.restore();
    };
    sw(1250, 1130, 1.2);
    // big wave body
    const rise = eOutCubic(t / 2) * 40;
    ctx.save(); ctx.translate(0, 40 - rise);
    const body = new Path2D();
    body.moveTo(-120, 1500); body.lineTo(-120, 980);
    body.bezierCurveTo(40, 700, 260, 470, 560, 470);
    body.bezierCurveTo(780, 470, 920, 560, 960, 720);
    body.bezierCurveTo(900, 640, 790, 610, 720, 660);
    body.bezierCurveTo(600, 760, 580, 1000, 700, 1220);
    body.lineTo(820, 1500); body.closePath();
    ctx.fillStyle = blue; ctx.fill(body);
    ctx.save(); ctx.clip(body);
    for (let k = 1; k < 9; k++) { ctx.beginPath(); ctx.moveTo(-120, 980 + k * 60); ctx.bezierCurveTo(40, 700 + k * 60, 260, 470 + k * 45, 560, 470 + k * 40); ctx.bezierCurveTo(700, 470 + k * 36, 720, 560 + k * 30, 700, 700 + k * 40); ctx.strokeStyle = k % 2 ? light : deep; ctx.lineWidth = k % 2 ? 8 : 26; ctx.stroke(); }
    ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = ink; ctx.stroke(body);
    // foam crest with claws
    const crest = t2 => { // along top curve from x≈260 to tip
      const a = t2; const p0 = [260, 560], p1 = [400, 470], p2 = [760, 450], p3 = [960, 720];
      const u = 1 - a; return [u * u * u * p0[0] + 3 * u * u * a * p1[0] + 3 * u * a * a * p2[0] + a * a * a * p3[0], u * u * u * p0[1] + 3 * u * u * a * p1[1] + 3 * u * a * a * p2[1] + a * a * a * p3[1]];
    };
    ctx.lineCap = 'round';
    for (let i = 0; i <= 40; i++) {
      const a = i / 40, [x, y] = crest(a); const r = 20 + a * 20, ang = -Math.PI / 2 + a * 2.2 + Math.sin(t * 5 + i) * .15;
      ctx.beginPath(); ctx.arc(x, y, r, ang - 1.2, ang + 1.9); ctx.lineTo(x, y); ctx.fillStyle = foam; ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(x, y, r, ang - 1.2, ang + 1.9); ctx.stroke();
      if (a > .55) { // hanging claws
        for (let c = 0; c < 3; c++) { const ca = ang + 1.9 + c * .25; ctx.beginPath(); ctx.moveTo(x + Math.cos(ca) * r, y + Math.sin(ca) * r); ctx.quadraticCurveTo(x + Math.cos(ca) * (r + 26), y + Math.sin(ca) * (r + 26), x + Math.cos(ca + .5) * (r + 30), y + Math.sin(ca + .5) * (r + 30)); ctx.lineWidth = 7; ctx.strokeStyle = foam; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = ink; ctx.stroke(); }
      }
    }
    for (const p of s.spray) { const y = p.y - 60 + ((t * 60 * p.v) % 120); ctx.beginPath(); ctx.arc(p.x, y, p.r, 0, TAU); ctx.fillStyle = foam; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = ink; ctx.stroke(); }
    // boat
    ctx.save(); ctx.translate(560, 1180); ctx.rotate(-.35 + Math.sin(t * 2) * .05);
    ctx.beginPath(); ctx.moveTo(-230, 0); ctx.quadraticCurveTo(0, 40, 240, -20); ctx.lineTo(230, 6); ctx.quadraticCurveTo(0, 70, -220, 20); ctx.closePath();
    ctx.fillStyle = '#D8B878'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(-160 + i * 52, 8, 13, 17, 0, 0, TAU); ctx.fillStyle = '#2A2C3A'; ctx.fill(); }
    ctx.restore();
    ctx.restore(); ctx.restore();
    // cartouche (fixed)
    const CX = LAND ? 1740 : 70, CY = LAND ? 120 : 330;
    ctx.fillStyle = '#EFE4C6'; ctx.fillRect(CX, CY, 110, 330); ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.strokeRect(CX, CY, 110, 330); ctx.strokeRect(CX + 8, CY + 8, 94, 314);
    ctx.fillStyle = ink; ctx.font = "900 60px 'Noto Serif SC'"; ctx.textAlign = 'center';
    '海上浪起'.split('').forEach((c, i) => ctx.fillText(c, CX + 55, CY + 70 + i * 72));
    ctx.fillStyle = '#B03A2E'; ctx.fillRect(CX + 28, CY + 360, 54, 54); ctx.textAlign = 'left';
    // print texture over everything
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .55; ctx.drawImage(s.paper, 0, 0, W, H); ctx.restore();
  }
});
