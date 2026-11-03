// C-021 蓝图：深蓝底上画两层网格，火箭的每个零件是一条折线，按顺序描出，描线的笔尖发光；
// 再依次长出尺寸线、箭头和引线标注，最后盖上修订章。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-021', name: '蓝图 / 工程制图', dur: 3, still: 2.4,
  fonts: ["700 40px 'JetBrains Mono'", "900 40px 'Noto Sans SC'"],
  text: '整流罩一级发动机尾翼×运载火箭总装图',
  init() { return { paper: makePaper('#123F72', { seed: 161, blot: 14, grain: 10, fiber: .8 }) }; },
  draw(ctx, t, s) {
    ctx.drawImage(s.paper, 0, 0, W, H);
    ctx.strokeStyle = 'rgba(200,225,255,.08)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(200,225,255,.18)'; ctx.lineWidth = 1.5;
    for (let x = 0; x < W; x += 150) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 150) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // 构图：竖屏整张图下移到画面中部；横屏把整张火箭图缩到 0.9 放在中间偏右，齿轮移到左上；两版右下角都有图框标题栏
    const G = LAND ? { k: .9, tx: 1000 - 540 * .9, ty: 540 - 770 * .9 } : { k: 1, tx: 0, ty: 150 };
    const into = () => { ctx.translate(G.tx, G.ty); ctx.scale(G.k, G.k); };
    ctx.save(); into();
    const Wc = 'rgba(235,245,255,.93)'; ctx.strokeStyle = Wc; ctx.fillStyle = Wc; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
    const cone = []; for (let i = 0; i <= 30; i++) { const a = i / 30; cone.push([lerp(455, 540, Math.sin(a * Math.PI / 2)), lerp(560, 340, Math.pow(a, .8))]); }
    for (let i = 30; i >= 0; i--) { const a = i / 30; cone.push([1080 - (lerp(455, 540, Math.sin(a * Math.PI / 2))), lerp(560, 340, Math.pow(a, .8))]); }
    const parts = [
      [cone, 0, .35], [[[455, 560], [455, 1060], [625, 1060], [625, 560]], .3, .7], [[[455, 720], [625, 720]], .65, .72], [[[455, 880], [625, 880]], .7, .77],
      [[[455, 950], [350, 1120], [455, 1080]], .75, .95], [[[625, 950], [730, 1120], [625, 1080]], .8, 1.0],
      [[[495, 1060], [470, 1150], [610, 1150], [585, 1060]], .95, 1.15], [circlePts(540, 640, 34, 40), 1.1, 1.3], [circlePts(540, 640, 22, 40), 1.2, 1.35]];
    let tip = null;
    for (const [p, a, b] of parts) { const q = inv(a, b, t); const tp = drawPartial(ctx, p, q); if (q > 0 && q < 1) tip = tp; }
    // centre line
    ctx.save(); ctx.setLineDash([30, 8, 4, 8]); ctx.lineWidth = 1.5; drawPartial(ctx, [[540, 300], [540, 1200]], inv(1.2, 1.5, t)); ctx.restore();
    // dimensions
    const arrow = (x, y, a) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a + .35) * 18, y + Math.sin(a + .35) * 18); ctx.lineTo(x + Math.cos(a - .35) * 18, y + Math.sin(a - .35) * 18); ctx.closePath(); ctx.fill(); };
    ctx.lineWidth = 2;
    const d1 = inv(1.35, 1.75, t); if (d1 > 0) {
      drawPartial(ctx, [[340, 340], [300, 340]], 1); drawPartial(ctx, [[340, 1150], [300, 1150]], 1);
      const y = lerp(745, 340, d1), y2 = lerp(745, 1150, d1); ctx.beginPath(); ctx.moveTo(320, y); ctx.lineTo(320, y2); ctx.stroke(); arrow(320, y, Math.PI / 2); arrow(320, y2, -Math.PI / 2);
      ctx.save(); ctx.translate(305, 745); ctx.rotate(-Math.PI / 2); ctx.globalAlpha = d1; ctx.font = "700 32px 'JetBrains Mono'"; ctx.textAlign = 'center'; ctx.fillText('70.00 m', 0, 0); ctx.restore();
    }
    const d2 = inv(1.6, 1.9, t); if (d2 > 0) {
      const x0 = lerp(540, 455, d2), x1 = lerp(540, 625, d2); ctx.beginPath(); ctx.moveTo(x0, 1195); ctx.lineTo(x1, 1195); ctx.stroke(); arrow(x0, 1195, 0); arrow(x1, 1195, Math.PI);
      ctx.globalAlpha = d2; ctx.font = "700 28px 'JetBrains Mono'"; ctx.textAlign = 'center'; ctx.fillText('Ø 3.66', 540, 1236); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
    const callout = (x0, y0, x1, y1, txt, sub, a) => { const p = inv(a, a + .3, t); if (p <= 0) return; ctx.beginPath(); ctx.arc(x0, y0, 5, 0, TAU); ctx.fill(); drawPartial(ctx, [[x0, y0], [x1, y1], [x1 + 200, y1]], p); ctx.globalAlpha = smooth(.5, 1, p); ctx.font = "900 34px 'Noto Sans SC'"; ctx.fillText(txt, x1 + 6, y1 - 12); ctx.font = "700 20px 'JetBrains Mono'"; ctx.fillText(sub, x1 + 6, y1 + 28); ctx.globalAlpha = 1; };
    callout(560, 460, 740, 400, '整流罩', 'FAIRING  A-01', 1.8);
    callout(625, 800, 760, 760, '一级', 'STAGE-1  B-02', 2.0);
    callout(700, 1090, 790, 1010, '尾翼 ×4', 'FIN  C-03', 2.2);
    ctx.restore();
    // gear
    ctx.save(); ctx.translate(...(LAND ? [300, 260] : [180, 620])); ctx.rotate(t * .8); ctx.lineWidth = 2.5; ctx.beginPath();
    for (let k = 0; k < 48; k++) { const a = k / 48 * TAU, r = k % 4 < 2 ? 78 : 64; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.globalAlpha = smooth(0, .6, t); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
    ctx.font = "700 22px 'JetBrains Mono'"; ctx.fillText('SCALE 1:200   SHEET 01/04', 60, H - 60);
    {
      const [bx, by] = LAND ? [1400, 860] : [560, 1680];
      const a = smooth(.3, .9, t); ctx.globalAlpha = a; ctx.lineWidth = 2.5; ctx.strokeRect(bx, by, 460, 160); ctx.beginPath(); ctx.moveTo(bx, by + 70); ctx.lineTo(bx + 460, by + 70); ctx.moveTo(bx + 240, by + 70); ctx.lineTo(bx + 240, by + 160); ctx.stroke();
      ctx.font = "900 40px 'Noto Sans SC'"; ctx.fillText('运载火箭总装图', bx + 20, by + 52); ctx.font = "700 20px 'JetBrains Mono'"; ctx.fillText('DWG  LV-3', bx + 20, by + 125); ctx.fillText('REV  A', bx + 260, by + 125); ctx.globalAlpha = 1;
    }
    ctx.save(); into();
    if (tip) { ctx.beginPath(); ctx.arc(tip[0], tip[1], 8, 0, TAU); ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 20; ctx.fill(); ctx.shadowBlur = 0; }
    ctx.save(); ctx.translate(900, 380); ctx.rotate(-.12); ctx.globalAlpha = smooth(2.4, 2.6, t) * .9; ctx.strokeStyle = '#FF8F8F'; ctx.lineWidth = 4; ctx.strokeRect(-90, -36, 180, 72); ctx.fillStyle = '#FF8F8F'; ctx.font = "700 36px 'JetBrains Mono'"; ctx.textAlign = 'center'; ctx.fillText('REV. A', 0, 13); ctx.restore();
    ctx.restore();
  }
});
