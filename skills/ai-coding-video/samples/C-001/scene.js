// C-001 水墨：宣纸纹理、三层远近不同浓淡的山（噪声生成的山脊 + 向下渐淡的墨），
// 墨晕从中心化开揭出画面，竖排书法逐字浮现，最后盖朱印。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-001', name: '水墨', dur: 3, still: 2.4, text: '山高水长墨',
  fonts: ["108px 'Ma Shan Zheng'"],
  init() {
    const paper = makePaper('#EDE3CC', { seed: 11, blot: 12, fiber: .8 });
    // 构图参数：竖屏沿用原版；横屏把山峦纹理改成横幅，题字移到右侧
    const Lo = LAND
      ? { lw: 1100, lh: 560, bases: [250, 325, 410], amps: [125, 110, 80], dx: -40, dy: -40, dw: 2200, dh: 1120,
          boat: [800, 840], bird: [300, 250], bloom: [860, 500], col: [1680, 300], seal: 790 }
      : { lw: 700, lh: 960, bases: [330, 430, 540], amps: [190, 170, 120], dx: -40, dy: 60, dw: 1400, dh: 1920,
          boat: [600, 1135], bird: [180, 470], bloom: [540, 820], col: [940, 430], seal: 930 };
    const lw = Lo.lw, lh = Lo.lh, land = mk(lw, lh), g = land.getContext('2d'), id = g.createImageData(lw, lh), d = id.data;
    const layers = [
      { base: Lo.bases[0], amp: Lo.amps[0], f: .0055, s: 3.1, dark: .30, fall: 70 },
      { base: Lo.bases[1], amp: Lo.amps[1], f: .0070, s: 7.7, dark: .50, fall: 55 },
      { base: Lo.bases[2], amp: Lo.amps[2], f: .0085, s: 1.3, dark: .78, fall: 40 },
    ];
    const ridges = layers.map(L => { const a = new Float32Array(lw); for (let x = 0; x < lw; x++) a[x] = L.base - L.amp * Math.pow(fbm(x * L.f + L.s, L.s, 5), 1.8) * 2.2; return a; });
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
      let keep = 1;
      layers.forEach((L, i) => {
        const dd = y - ridges[i][x]; if (dd < 0) return;
        const tex = .65 + .7 * (fbm(x * .05 + i * 9, y * .012, 3) - .5) + .35 * (fbm(x * .3, y * .02, 2) - .5);
        let a = L.dark * (Math.exp(-dd / L.fall) * .9 + .1 * Math.exp(-dd / (L.fall * 5))) * clamp(tex, .2, 1.3);
        if (dd < 1.6) a = Math.max(a, L.dark * .95);
        keep *= 1 - clamp(a);
      });
      const i4 = (y * lw + x) * 4; d[i4] = 22; d[i4 + 1] = 20; d[i4 + 2] = 24; d[i4 + 3] = (1 - keep) * 255;
    }
    g.putImageData(id, 0, 0);
    return { paper, land, layer: mk(W, H), Lo };
  },
  draw(ctx, t, s, f) {
    ctx.drawImage(s.paper, 0, 0, W, H);
    const pan = -t * 70;
    const Lo = s.Lo, L = s.layer, g = L.getContext('2d'); g.clearRect(0, 0, W, H);
    g.drawImage(s.land, pan + Lo.dx, Lo.dy, Lo.dw, Lo.dh);
    // 小船和水纹
    const bx = Lo.boat[0] + pan * .6, by = Lo.boat[1];
    g.strokeStyle = 'rgba(20,20,24,.9)'; g.lineCap = 'round';
    g.lineWidth = 7; g.beginPath(); g.moveTo(bx - 70, by); g.quadraticCurveTo(bx, by + 22, bx + 80, by - 8); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(bx + 10, by - 4); g.lineTo(bx + 16, by - 48); g.stroke();
    g.beginPath(); g.arc(bx + 18, by - 56, 9, 0, TAU); g.fillStyle = 'rgba(20,20,24,.9)'; g.fill();
    g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx + 20, by - 40); g.lineTo(bx + 110, by - 110); g.stroke();
    g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.globalAlpha = .5 - k * .1; g.beginPath(); g.moveTo(bx - 120 - k * 30, by + 20 + k * 14); g.lineTo(bx + 60 + k * 40, by + 20 + k * 14); g.stroke(); }
    g.globalAlpha = 1;
    // 飞鸟
    for (let k = 0; k < 3; k++) {
      const x = Lo.bird[0] + t * 110 + k * 70, y = Lo.bird[1] + k * 34 + Math.sin(t * 6 + k) * 6, w = 22 - k * 3, fl = Math.sin(t * 14 + k * 2) * 8;
      g.lineWidth = 3.5; g.beginPath(); g.moveTo(x - w, y - fl); g.quadraticCurveTo(x - w / 2, y - 10, x, y); g.quadraticCurveTo(x + w / 2, y - 10, x + w, y - fl); g.stroke();
    }
    // 墨晕揭开画面
    const R = eOutCubic(t / 1.1) * 1500;
    g.globalCompositeOperation = 'destination-in'; g.beginPath();
    for (let i = 0; i <= 90; i++) { const a = i / 90 * TAU; const r = R * (1 + .22 * (fbm(Math.cos(a) * 2 + 5, Math.sin(a) * 2 + t * .5, 3) - .5)); g.lineTo(Lo.bloom[0] + Math.cos(a) * r, Lo.bloom[1] + Math.sin(a) * r); }
    g.fill(); g.globalCompositeOperation = 'source-over';
    ctx.drawImage(L, 0, 0);
    if (t < 1.2) { // 湿墨边缘
      ctx.save(); ctx.filter = 'blur(10px)'; ctx.globalAlpha = .35 * (1 - t / 1.2); ctx.strokeStyle = '#141418'; ctx.lineWidth = 26; ctx.beginPath();
      for (let i = 0; i <= 90; i++) { const a = i / 90 * TAU; const r = R * (1 + .22 * (fbm(Math.cos(a) * 2 + 5, Math.sin(a) * 2 + t * .5, 3) - .5)); ctx.lineTo(Lo.bloom[0] + Math.cos(a) * r, Lo.bloom[1] + Math.sin(a) * r); }
      ctx.stroke(); ctx.restore();
    }
    // 竖排题字
    ctx.font = "108px 'Ma Shan Zheng'"; ctx.textAlign = 'center';
    '山高水长'.split('').forEach((c, k) => {
      const a = smooth(.45 + k * .22, .75 + k * .22, t); ctx.fillStyle = `rgba(18,16,20,${a * .92})`;
      ctx.save(); ctx.translate(Lo.col[0], Lo.col[1] + k * 112); ctx.scale(1, lerp(.85, 1, a)); ctx.fillText(c, 0, 0); ctx.restore();
    });
    // 朱印
    const st = inv(1.75, 1.95, t);
    if (st > 0) {
      const sc = lerp(1.8, 1, eOutCubic(st)); ctx.save(); ctx.translate(Lo.col[0], Lo.seal); ctx.scale(sc, sc); ctx.globalAlpha = st;
      ctx.fillStyle = '#B3261E'; ctx.beginPath(); ctx.roundRect(-46, -46, 92, 92, 8); ctx.fill();
      ctx.strokeStyle = '#EDE3CC'; ctx.lineWidth = 4; ctx.strokeRect(-36, -36, 72, 72);
      ctx.fillStyle = '#EDE3CC'; ctx.font = "62px 'Ma Shan Zheng'"; ctx.fillText('墨', 0, 22); ctx.restore();
    }
    ctx.textAlign = 'left';
  }
});
