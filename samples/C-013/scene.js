// C-013 皮影戏：半透明兽皮人偶按部件和关节层层画出，镂空花纹用 destination-out，multiply 叠到油灯照亮的布幕上
// 由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-013', name: '皮影戏', dur: 3, still: 1.4,
  fonts: [],
  init() { return { cloth: makePaper('#808080', { seed: 211, grain: 20, blot: 6, fiber: 1.2 }), L: mk(W, H) }; },
  draw(ctx, t, s, f) {
    const fl = .9 + .1 * noise1(t * 9) + .04 * Math.sin(t * 23);
    const g = ctx.createRadialGradient(W / 2, H * .4, 60, W / 2, H * .42, LONG * .6);
    g.addColorStop(0, `rgb(${255 * fl},${238 * fl},${190 * fl})`); g.addColorStop(.45, `rgb(${236 * fl},${170 * fl},${90 * fl})`); g.addColorStop(1, '#3E1A08');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .35; ctx.drawImage(s.cloth, 0, 0, W, H); ctx.restore();
    const L = s.L, p = L.getContext('2d'); p.clearRect(0, 0, W, H);
    const edge = 'rgba(40,12,4,.95)';
    const part = (fn, fill, holes) => { p.beginPath(); fn(); p.fillStyle = fill; p.fill(); p.lineWidth = 5; p.strokeStyle = edge; p.stroke(); if (holes) { p.save(); p.globalCompositeOperation = 'destination-out'; holes(); p.restore(); } };
    const dots = (x0, y0, x1, y1, st, r) => { for (let y = y0; y < y1; y += st) for (let x = x0 + ((y - y0) / st % 2) * st / 2; x < x1; x += st) { p.beginPath(); p.arc(x, y, r, 0, TAU); p.fill(); } };
    // warrior
    const beat = t / BEAT, hop = Math.abs(Math.sin(beat * Math.PI)) * 18;
    const k = LAND ? .66 : 1, bx = (LAND ? W / 2 - 60 : 470) + Math.sin(t * 1.1) * 40, by = (LAND ? 560 : 820) - hop;
    const slash = eInOutCubic(inv(1.2, 1.5, t)) - eInOutCubic(inv(2.2, 2.6, t)) * .5;
    p.save(); p.translate(bx, by); p.scale(k, k);
    // back arm
    p.save(); p.translate(40, -110); p.rotate(-.6 + Math.sin(t * 2) * .2);
    part(() => { p.roundRect(-18, 0, 36, 150, 16); }, 'rgba(160,40,30,.85)'); p.restore();
    // robe / legs
    part(() => { p.moveTo(-90, 20); p.lineTo(90, 20); p.lineTo(150, 380); p.lineTo(-130, 380); p.closePath(); }, 'rgba(160,40,30,.82)', () => {
      for (let r = 0; r < 5; r++) for (let k = 0; k < 5; k++) { const x = -100 + k * 52 + r * 6, y = 70 + r * 62; p.beginPath(); p.arc(x, y, 16, Math.PI * .1, Math.PI * .9); p.arc(x, y - 8, 12, Math.PI * .8, Math.PI * .2, true); p.fill(); }
    });
    part(() => { p.moveTo(-110, 380); p.lineTo(-30, 380); p.lineTo(-40, 420); p.lineTo(-140, 420); p.closePath(); p.moveTo(40, 380); p.lineTo(130, 380); p.lineTo(170, 420); p.lineTo(40, 420); p.closePath(); }, 'rgba(30,30,30,.9)');
    // torso armour
    part(() => { p.moveTo(-80, -150); p.lineTo(80, -150); p.lineTo(100, 40); p.lineTo(-100, 40); p.closePath(); }, 'rgba(40,110,80,.82)', () => { dots(-70, -130, 80, 30, 26, 8); });
    // head in profile + crown
    p.save(); p.translate(10, -170); p.rotate(Math.sin(beat * Math.PI) * .06);
    part(() => { p.moveTo(-40, 0); p.lineTo(-44, -70); p.quadraticCurveTo(-10, -110, 40, -90); p.lineTo(62, -60); p.lineTo(52, -50); p.lineTo(64, -34); p.lineTo(44, -20); p.lineTo(40, 0); p.closePath(); }, 'rgba(230,190,140,.75)', () => { p.beginPath(); p.ellipse(28, -62, 14, 5, -.2, 0, TAU); p.fill(); });
    part(() => { p.moveTo(-54, -80); p.lineTo(-40, -150); p.lineTo(0, -130); p.lineTo(20, -170); p.lineTo(46, -96); p.closePath(); }, 'rgba(200,150,30,.85)', () => dots(-30, -140, 30, -100, 18, 5));
    p.strokeStyle = edge; p.lineWidth = 6; p.beginPath(); p.moveTo(-40, -150); p.quadraticCurveTo(-160, -260 + Math.sin(t * 5) * 20, -60, -330); p.stroke();
    p.restore();
    // sword arm (front): shoulder -> elbow -> hand
    p.save(); p.translate(-30, -120); const a1 = lerp(.9, -2.2, slash); p.rotate(a1);
    part(() => p.roundRect(-18, 0, 36, 110, 16), 'rgba(40,110,80,.85)');
    p.translate(0, 100); p.rotate(lerp(-.6, -.2, slash));
    part(() => p.roundRect(-16, 0, 32, 100, 14), 'rgba(230,190,140,.75)');
    p.translate(0, 100); p.rotate(1.3);
    part(() => { p.moveTo(-8, 0); p.lineTo(8, 0); p.lineTo(6, 260); p.lineTo(0, 290); p.lineTo(-6, 260); p.closePath(); }, 'rgba(200,210,220,.7)');
    part(() => p.rect(-30, -10, 60, 14), 'rgba(200,150,30,.9)');
    const hand = p.getTransform();
    p.restore(); p.restore();
    // rods
    p.strokeStyle = 'rgba(30,15,5,.75)'; p.lineWidth = 5;
    p.beginPath(); p.moveTo(bx + 10 * k, by - 100 * k); p.lineTo(bx + 60 * k, H); p.stroke();
    p.beginPath(); p.moveTo(hand.e, hand.f); p.lineTo(hand.e - 120 * k, H); p.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.filter = 'blur(1.4px)'; ctx.drawImage(L, 0, 0); ctx.restore();
    vignette(ctx, .6, .3, '30,10,0');
  }
});
