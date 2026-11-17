// C-125 机密档案袋：init 里用正弦扭曲的条纹加分形噪声生成木纹桌面；牛皮纸档案夹上压一张米色备忘纸，打字机字按一张时刻表逐字敲出（每个字落下时轻微上下错位）；之后黑色涂抹条从左往右盖住敏感词、荧光笔刷过代号、红铅笔圈出时间并画箭头，“机密”旧橡皮章砸下；回形针和地图图钉是平涂小道具，台灯光圈压暗四周。
// 风格提示词：用机密档案袋风格：台灯光圈下的深色木桌，牛皮纸档案夹和米色备忘纸，打字机字随旁白逐词敲出，旧橡皮章在关键词上重重砸下，红铅笔箭头和勾、荧光笔划痕、黑色涂抹条、回形针和地图图钉，配打字机、纸张和盖章音效。
// 题材：印刷、版画与装饰 · 适合：揭秘、内幕、案件和历史档案
scene({
  id: 'C-125', name: '机密档案袋', dur: 5, still: 4.3,
  fonts: ["700 40px 'Noto Serif SC'", "700 40px 'JetBrains Mono'", "900 80px 'Noto Sans SC'"],
  text: '绝密行动代号夜莺地点东港码头号仓库时间凌晨点接头人穿灰大衣读后销毁机密档案编号TOPSECRET',
  init() {
    const wood = mk(Math.round(W / 2), Math.round(H / 2)), g = wood.getContext('2d');
    const img = g.createImageData(wood.width, wood.height), d = img.data;
    for (let y = 0; y < wood.height; y++) for (let x = 0; x < wood.width; x++) {
      const n = fbm(x * .006, y * .05, 4), ring = .5 + .5 * Math.sin((y * .09 + n * 9 + Math.sin(x * .004) * 3)), v = .55 + .3 * ring + .15 * n, i = (y * wood.width + x) * 4;
      d[i] = 92 * v; d[i + 1] = 56 * v; d[i + 2] = 34 * v; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return { wood, paper: makePaper('#F1E8D2', { w: 600, h: 800, seed: 125, blot: 8, grain: 14 }) };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#26221E', RED = '#C3262B';
    ctx.drawImage(s.wood, 0, 0, W, H);
    // 档案夹
    const fw = (LAND ? 1280 : 960) * u, fh = (LAND ? 860 : 1400) * u, fx = (W - fw) / 2 + (LAND ? 60 * u : 0), fy = (H - fh) / 2 + 30 * u;
    ctx.save(); ctx.translate(fx + fw / 2, fy + fh / 2); ctx.rotate(-.015 + t * .004); ctx.scale(1 + t * .025, 1 + t * .025);   // 镜头缓推 ctx.translate(-fw / 2, -fh / 2);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(16 * u, 22 * u, fw, fh);
    ctx.fillStyle = '#C49A5E'; rr(ctx, fw * .06, -50 * u, 300 * u, 80 * u, 12 * u); ctx.fill();
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(30 * u)}px 'JetBrains Mono'`; ctx.textAlign = 'left'; ctx.fillText('TOP SECRET', fw * .06 + 30 * u, -2 * u);
    ctx.fillStyle = '#C9A066'; ctx.fillRect(0, 0, fw, fh);
    ctx.strokeStyle = 'rgba(80,50,20,.25)'; ctx.lineWidth = 2 * u; ctx.strokeRect(14 * u, 14 * u, fw - 28 * u, fh - 28 * u);
    ctx.fillStyle = 'rgba(80,50,20,.5)'; ctx.font = `700 ${Math.round(26 * u)}px 'JetBrains Mono'`; ctx.textAlign = 'right'; ctx.fillText('档案编号 0125-B', fw - 40 * u, fh - 40 * u);
    // 备忘纸
    const pw = (LAND ? 820 : 820) * u, ph = (LAND ? 760 : 1100) * u, px = LAND ? 70 * u : (fw - pw) / 2, py = LAND ? 50 * u : 90 * u;
    ctx.save(); ctx.translate(px, py); ctx.rotate(.012);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(8 * u, 10 * u, pw, ph);
    ctx.drawImage(s.paper, 0, 0, pw, ph);
    ctx.fillStyle = INK; ctx.font = `700 ${Math.round(46 * u)}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.fillText('绝 密 备 忘', pw / 2, 90 * u);
    ctx.fillRect(60 * u, 116 * u, pw - 120 * u, 3 * u);
    // 打字：一行一行，每字 0.05 秒
    const LINES = ['行动代号：夜莺', '地点：东港码头 7 号仓库', '时间：凌晨 3 点', '接头人：穿灰大衣', '读后销毁。'];
    const lh = (LAND ? 104 : 150) * u, x0 = 50 * u, y0 = (LAND ? 210 : 250) * u, fs = Math.round((LAND ? 44 : 58) * u);
    ctx.font = `700 ${fs}px 'Noto Serif SC'`; ctx.textAlign = 'left';
    let tc = .3; const pos = {};
    LINES.forEach((ln, i) => {
      let x = x0; const y = y0 + i * lh;
      [...ln].forEach((ch, k) => {
        const w = ctx.measureText(ch).width;
        if (t >= tc) { const jit = (hash2(i, k) - .5) * 4 * u, fresh = clamp((t - tc) / .05); ctx.globalAlpha = .75 + .25 * hash2(k, i + 9); ctx.fillStyle = INK; ctx.fillText(ch, x, y + jit - (1 - fresh) * 6 * u); ctx.globalAlpha = 1; }
        pos[`${i}:${k}`] = [x, y, w];
        x += w; tc += ch === ' ' ? .02 : .05;
      });
      tc += .12;
    });
    const span = (i, a, b) => { const p0 = pos[`${i}:${a}`], p1 = pos[`${i}:${b}`]; return [p0[0], p0[1], p1[0] + p1[2] - p0[0]]; };
    // 荧光笔：代号“夜莺”
    let p = clamp((t - 3.0) / .25);
    if (p > 0) { const [x, y, w] = span(0, 5, 6); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,228,40,.85)'; ctx.fillRect(x - 6 * u, y - fs * .8, (w + 12 * u) * eOutCubic(p), fs * 1.05); ctx.globalCompositeOperation = 'source-over'; }
    // 涂抹条：码头名、接头人
    [[1, 3, 6, 2.6], [3, 4, 7, 2.8]].forEach(([i, a, b, t0]) => {
      const q = clamp((t - t0) / .22); if (q <= 0) return;
      const [x, y, w] = span(i, a, b);
      ctx.fillStyle = '#111'; ctx.beginPath();
      const ww = (w + 14 * u) * eOutCubic(q);
      ctx.moveTo(x - 7 * u, y - fs * .82); ctx.lineTo(x - 7 * u + ww, y - fs * .86); ctx.lineTo(x - 7 * u + ww, y + fs * .22); ctx.lineTo(x - 7 * u, y + fs * .18); ctx.fill();
    });
    // 红铅笔：圈出“凌晨 3 点”、打勾、画箭头
    p = clamp((t - 3.25) / .35);
    if (p > 0) {
      const [x, y, w] = span(2, 3, 8), cx = x + w / 2, cy = y - fs * .3;
      ctx.strokeStyle = RED; ctx.lineWidth = 5 * u; ctx.lineCap = 'round';
      const ring = circlePts(cx, cy, w * .62, 50, -2.6, -2.6 + TAU * 1.08, .12, 9).map(([a, b]) => [a, cy + (b - cy) * .5]);
      ctx.beginPath(); drawPartial(ctx, ring, eOutCubic(p)); ctx.stroke();
      const q = clamp((t - 3.55) / .25);
      if (q > 0) {
        const ax = cx + w * .65, ay = cy + 10 * u, bx = ax + 150 * u, by = ay + 110 * u;
        ctx.beginPath(); drawPartial(ctx, linePts(bx, by, ax + 10 * u, ay + 6 * u, 10, 3 * u, 4), eOutCubic(q)); ctx.stroke();
        if (q >= 1) { ctx.beginPath(); ctx.moveTo(ax + 40 * u, ay + 2 * u); ctx.lineTo(ax + 10 * u, ay + 6 * u); ctx.lineTo(ax + 26 * u, ay + 32 * u); ctx.stroke(); }
      }
      const c = clamp((t - 3.75) / .15);
      if (c > 0) { const [lx, ly] = pos['4:0']; ctx.beginPath(); drawPartial(ctx, [[lx - 46 * u, ly - 20 * u], [lx - 32 * u, ly - 4 * u], [lx - 8 * u, ly - 40 * u]], c); ctx.stroke(); }
    }
    ctx.restore();
    // 回形针
    ctx.save(); ctx.translate(px + 60 * u, py - 20 * u); ctx.rotate(-.2);
    ctx.strokeStyle = '#B8BEC6'; ctx.lineWidth = 7 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 90 * u); ctx.lineTo(0, 10 * u); ctx.arc(18 * u, 10 * u, 18 * u, Math.PI, 0); ctx.lineTo(36 * u, 110 * u); ctx.arc(22 * u, 110 * u, 14 * u, 0, Math.PI); ctx.lineTo(8 * u, 30 * u); ctx.stroke();
    ctx.restore();
    // 小地图卡 + 图钉
    const mx = LAND ? fw - 340 * u : fw - 330 * u, my = LAND ? 120 * u : fh - 330 * u;
    ctx.save(); ctx.translate(mx, my); ctx.rotate(.08);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(8 * u, 10 * u, 280 * u, 220 * u);
    ctx.fillStyle = '#E4DCC4'; ctx.fillRect(0, 0, 280 * u, 220 * u);
    ctx.fillStyle = '#9FC2D8'; ctx.beginPath(); ctx.moveTo(0, 140 * u); ctx.bezierCurveTo(80 * u, 120 * u, 140 * u, 180 * u, 280 * u, 150 * u); ctx.lineTo(280 * u, 220 * u); ctx.lineTo(0, 220 * u); ctx.fill();
    ctx.strokeStyle = '#8A7A5A'; ctx.lineWidth = 3 * u; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(20 * u + k * 60 * u, 0); ctx.lineTo(40 * u + k * 55 * u, 130 * u); ctx.stroke(); }
    const pp = eOutBack(clamp((t - 2.2) / .2), 3);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(176 * u, 132 * u, 14 * u * pp, 0, TAU); ctx.fill();
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(170 * u, 124 * u - (1 - pp) * 40 * u, 16 * u, 0, TAU); ctx.fill();
    ctx.restore();
    // 机密章
    const sp = clamp((t - 4.0) / .12);
    if (sp > 0) {
      const sc = lerp(2.2, 1, eOutCubic(sp));
      ctx.save(); ctx.translate(LAND ? fw * .78 : fw * .55, LAND ? fh * .7 : fh * .66); ctx.rotate(-.3); ctx.scale(sc, sc); ctx.globalAlpha = .85 * sp; ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = ctx.fillStyle = RED; ctx.lineWidth = 10 * u; rr(ctx, -170 * u, -80 * u, 340 * u, 160 * u, 12 * u); ctx.stroke();
      ctx.lineWidth = 3 * u; rr(ctx, -155 * u, -65 * u, 310 * u, 130 * u, 8 * u); ctx.stroke();
      ctx.font = `900 ${Math.round(100 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText('机密', 0, 36 * u);
      ctx.restore();
    }
    ctx.restore();
    // 台灯光圈
    const lg = ctx.createRadialGradient(W * .45, H * .4, SHORT * .2, W * .45, H * .45, LONG * .7);
    lg.addColorStop(0, 'rgba(255,200,120,.08)'); lg.addColorStop(.6, 'rgba(10,5,0,.35)'); lg.addColorStop(1, 'rgba(0,0,0,.88)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    // 落章震一下
    if (t > 4.0 && t < 4.15) { const k = (4.15 - t) / .15 * 8 * u; ctx.drawImage(ctx.canvas, 0, Math.sin(t * 140) * k); }
  }
});
