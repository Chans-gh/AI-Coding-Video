// C-010 黑板粉笔：板书和示意图按笔顺逐笔写出，整层再用一张固定的随机点阵抠掉一部分像素，做出粉笔的颗粒和断笔；
// 粉笔头跟着正在写的那一笔走，底下是擦过的粉迹和粉笔槽。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-010', name: '黑板粉笔', dur: 3, still: 2.4,
  fonts: ["40px 'Ma Shan Zheng'", "700 40px 'Noto Sans SC'"],
  text: '光合作用光→CO₂H₂OO₂6C₆H₁₂',
  init() {
    const board = makePaper('#23392E', { seed: 8, grain: 10, blot: 22, fiber: .2 });
    const smudge = mk(W / 2, H / 2), sg = smudge.getContext('2d'), R = mulberry32(8);
    for (let i = 0; i < 26; i++) { const x = R() * W / 2, y = R() * H / 2, w = 60 + R() * 200; sg.fillStyle = `rgba(255,255,255,${.02 + R() * .04})`; sg.beginPath(); sg.ellipse(x, y, w, w * .3, R() * 3, 0, TAU); sg.fill(); }
    const spk = mk(W, H), kg = spk.getContext('2d'), id = kg.createImageData(W, H), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const v = R(); d[i + 3] = v < .38 ? 255 : v < .5 ? 120 : 0; }
    kg.putImageData(id, 0, 0);
    return { board, smudge, spk, layer: mk(W, H) };
  },
  draw(ctx, t, s) {
    ctx.drawImage(s.board, 0, 0, W, H); ctx.drawImage(s.smudge, 0, 0, W, H);
    const g = s.layer.getContext('2d'); g.clearRect(0, 0, W, H);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const white = 'rgba(244,242,232,.95)', yel = '#F4E27A', pink = '#F6A9BD';
    // 构图：竖屏沿用原版（标题在上、示意图在下）；横屏标题移到左边，示意图整体平移到右边
    const TO = LAND ? [110, 120] : [0, 120], DO = LAND ? [760, -300] : [0, 260];
    let tip = null; const at = o => p => { if (p) tip = [p[0] + o[0], p[1] + o[1]]; };
    const setT = at(TO), setD = at(DO);
    g.save(); g.translate(...TO);
    g.fillStyle = white; g.font = "118px 'Ma Shan Zheng'";
    const p0 = inv(0, .55, t); if (p0 > 0) { const x = textReveal(g, '光合作用', 90, 440, p0); if (p0 < 1) setT([x, 400]); }
    g.strokeStyle = white; g.lineWidth = 7;
    const ul = drawPartial(g, linePts(90, 470, 560, 478, 20, 8, 1), inv(.5, .7, t)); if (t < .7 && t > .5) setT(ul);
    g.restore(); g.save(); g.translate(...DO);
    // sun
    g.strokeStyle = yel; g.lineWidth = 8;
    const sp = inv(.6, .95, t); const st = drawPartial(g, circlePts(230, 700, 72, 60, 0, TAU, .06, 3), sp); if (sp > 0 && sp < 1) setD(st);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; const q = inv(.9 + k * .03, .98 + k * .03, t); drawPartial(g, [[230 + Math.cos(a) * 95, 700 + Math.sin(a) * 95], [230 + Math.cos(a) * 135, 700 + Math.sin(a) * 135]], q); }
    // leaf
    g.strokeStyle = white; g.lineWidth = 8;
    const leaf = []; for (let i = 0; i <= 30; i++) { const a = i / 30; leaf.push([lerp(520, 880, a), lerp(1020, 760, a) - Math.sin(a * Math.PI) * 120]); }
    for (let i = 30; i >= 0; i--) { const a = i / 30; leaf.push([lerp(520, 880, a), lerp(1020, 760, a) + Math.sin(a * Math.PI) * 110]); }
    const lp = inv(1.0, 1.45, t); const lt = drawPartial(g, leaf, lp); if (lp > 0 && lp < 1) setD(lt);
    drawPartial(g, linePts(520, 1020, 860, 775, 10, 6, 4), inv(1.4, 1.55, t));
    for (let k = 1; k < 5; k++) { const x = lerp(540, 830, k / 5), y = lerp(1005, 790, k / 5); drawPartial(g, [[x, y], [x + 30, y - 60]], inv(1.5 + k * .03, 1.58 + k * .03, t)); drawPartial(g, [[x, y], [x + 60, y + 20]], inv(1.5 + k * .03, 1.58 + k * .03, t)); }
    // light arrow
    g.strokeStyle = yel; g.lineWidth = 7; const wav = []; for (let i = 0; i <= 30; i++) { const a = i / 30; wav.push([lerp(330, 560, a), lerp(760, 860, a) + Math.sin(a * 18) * 12]); }
    const ap = inv(1.1, 1.35, t); const aw = drawPartial(g, wav, ap); if (ap > 0 && ap < 1) setD(aw);
    if (ap >= 1) { drawPartial(g, [[530, 830], [562, 862], [522, 876]], 1); }
    g.font = "56px 'Ma Shan Zheng'"; g.fillStyle = yel; textReveal(g, '光', 420, 760, inv(1.3, 1.4, t));
    // labels
    g.fillStyle = white; g.font = "700 56px 'Noto Sans SC'";
    const lab = (txt, x, y, a, b, arrow) => { const p = inv(a, b, t); if (p <= 0) return; const e = textReveal(g, txt, x, y, p); if (p < 1) setD([e, y - 20]); if (arrow) drawPartial(g, arrow, inv(b, b + .15, t)); };
    lab('CO₂', 110, 1000, 1.6, 1.8, [[250, 985], [480, 950]]);
    lab('H₂O', 520, 1200, 1.8, 2.0, [[620, 1150], [650, 1060]]);
    lab('O₂', 900, 640, 2.0, 2.15, null);
    g.strokeStyle = white; drawPartial(g, [[860, 760], [920, 670]], inv(2.1, 2.2, t));
    g.strokeStyle = pink; g.lineWidth = 7; const cp = inv(2.25, 2.55, t); const ct = drawPartial(g, circlePts(935, 625, 85, 50, -1, TAU + .3, .1, 9), cp); if (cp > 0 && cp < 1) setD(ct);
    g.fillStyle = pink; g.font = "52px 'Ma Shan Zheng'"; textReveal(g, '考点！', 820, 520, inv(2.5, 2.75, t));
    g.restore();
    g.globalCompositeOperation = 'destination-out'; g.drawImage(s.spk, 0, 0); g.globalCompositeOperation = 'source-over';
    ctx.drawImage(s.layer, 0, 0);
    ctx.save(); ctx.filter = 'blur(6px)'; ctx.globalAlpha = .25; ctx.drawImage(s.layer, 0, 0); ctx.restore();
    if (tip && t < 2.9) { ctx.save(); ctx.translate(tip[0], tip[1]); ctx.rotate(-.7); ctx.fillStyle = '#F2EFE6'; ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 8; ctx.fillRect(-8, -12, 110, 24); ctx.restore(); }
    // tray
    ctx.fillStyle = '#6B4B2E'; ctx.fillRect(0, H - 60, W, 60); ctx.fillStyle = '#8A6440'; ctx.fillRect(0, H - 60, W, 10);
  }
});
