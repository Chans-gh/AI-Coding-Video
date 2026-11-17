// C-020 复古半调案卷：Canvas 2D 在米色纸纹上用“正片叠底”叠印四种平涂油墨，色块内部按旋转网格画圆点、点的大小随明暗变，就是半调网点；标题黑字下压一层错位的红字，胖吉祥物“嫌疑人”粗黑描边、身上填网点，三件证物卡按拍子逐条出示，最后橡皮章砸下。
// 风格提示词：用复古半调案卷风格：米色档案纸，四种平涂油墨叠印出半调网点，超大粗体标题带错位阴影，橡皮图章重重砸下，一个粗描边的胖吉祥物当“嫌疑人”，内容像调查报告一样按“证物”逐条出示。
// 题材：印刷、版画与装饰 · 适合：揭秘、调查报告、“谁干的”类科普
scene({
  id: 'C-020', name: '复古半调案卷', dur: 5, still: 3.95,
  fonts: ["900 80px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  text: '案卷嫌疑人谁偷吃了蛋糕证物奶油爪印半块饼干在逃抓到了CASEFILENo.020ABC',
  init() {
    // 橡皮章先画在一张小画布上，缺墨的地方挖空，再叠到纸上
    const u = SHORT / 1080, st = mk(Math.round(560 * u), Math.round(220 * u)), g = st.getContext('2d');
    g.translate(st.width / 2, st.height / 2); g.strokeStyle = g.fillStyle = '#D42A2A'; g.lineWidth = 14 * u;
    rr(g, -260 * u, -90 * u, 520 * u, 180 * u, 20 * u); g.stroke();
    g.font = `900 ${Math.round(120 * u)}px 'Noto Sans SC'`; g.textAlign = 'center'; g.fillText('抓到了', 0, 44 * u);
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = .7;
    for (let i = 0; i < 90; i++) { g.beginPath(); g.arc((hash1(i * 3) - .5) * 520 * u, (hash1(i * 7) - .5) * 180 * u, (2 + hash2(i, 20) * 7) * u, 0, TAU); g.fill(); }
    return { paper: makePaper('#EADBB8', { seed: 20, blot: 14, grain: 20, fiber: .4 }), stamp: st };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    const CY = '#1FA3C9', MG = '#E8417A', YE = '#F4C430', BK = '#231F20';
    ctx.drawImage(s.paper, 0, 0, W, H);
    // 半调网点：在 path 画出的形状里按 angle 旋转的网格画点，tone(x, y) 给 0–1 的浓度
    const halftone = (path, color, angle, cell, tone) => {
      ctx.save(); path(); ctx.clip(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = color;
      const ca = Math.cos(angle), sa = Math.sin(angle), R = LONG;
      for (let gy = -R; gy < R; gy += cell) for (let gx = -R; gx < R; gx += cell) {
        const x = W / 2 + gx * ca - gy * sa, y = H / 2 + gx * sa + gy * ca;
        if (x < -cell || y < -cell || x > W + cell || y > H + cell) continue;
        const r = cell * .55 * Math.sqrt(clamp(tone(x, y)));
        if (r > .4) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
    };
    const slam = (t0, d = .14) => clamp((t - t0) / d);
    // —— 背景大色块：两种油墨错位叠印
    const bp = eOutExpo(slam(.1, .3));
    const rect = (x, y, w, h) => () => { ctx.beginPath(); ctx.rect(x, y, w, h); };
    halftone(rect(0, 0, W * (LAND ? .52 : 1) * bp, LAND ? H : H * .42), YE, .3, 22 * u, (x, y) => .55 + .35 * Math.sin(x * .004 + y * .003));
    halftone(rect(W * (LAND ? .3 : 0), H * (LAND ? .55 : .3) , W * (LAND ? .7 : 1) * bp, H * .2), CY, .9, 16 * u, (x) => .3 + .5 * (x / W));
    // —— 标题：黑字 + 错位的红字阴影
    const tp = eOutBack(slam(.35, .25), 2);
    const tx = LAND ? 80 * u : 70 * u, ty = LAND ? 250 * u : 330 * u, ts = (LAND ? 200 : 210) * u;
    ctx.save(); ctx.translate(tx, ty); ctx.scale(tp, tp);
    ctx.font = `900 ${ts}px 'Noto Sans SC'`; ctx.textAlign = 'left';
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = MG; ctx.fillText('案卷', 12 * u, 12 * u);
    ctx.fillStyle = BK; ctx.fillText('案卷', 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = `${Math.round(64 * u)}px 'Bebas Neue'`; ctx.fillStyle = BK;
    ctx.fillText('CASE FILE  No.020', 8 * u, 72 * u);
    ctx.font = `700 ${Math.round(46 * u)}px 'Noto Sans SC'`; ctx.fillText('谁偷吃了蛋糕？', 8 * u, 140 * u);
    ctx.restore();
    // —— 嫌疑人：胖吉祥物，粗描边，身上填网点
    const mx = LAND ? W * .72 : W * .5, my = LAND ? H * .5 : H * .45, ms = (LAND ? 250 : 320) * u;
    const mp = eOutBack(slam(.6, .3), 1.8), bob = Math.sin(t * 5) * 6 * u;
    if (mp > 0) {
      ctx.save(); ctx.translate(mx, my + bob); ctx.scale(mp, mp);
      const body = () => { ctx.beginPath(); ctx.ellipse(0, 0, ms * .85, ms, 0, 0, TAU); };
      // 耳朵
      [-1, 1].forEach(sd => { ctx.beginPath(); ctx.moveTo(sd * ms * .35, -ms * .82); ctx.lineTo(sd * ms * .7, -ms * 1.15); ctx.lineTo(sd * ms * .75, -ms * .55); ctx.closePath(); ctx.fillStyle = '#F2A65A'; ctx.fill(); ctx.lineWidth = 12 * u; ctx.strokeStyle = BK; ctx.lineJoin = 'round'; ctx.stroke(); });
      body(); ctx.fillStyle = '#F2A65A'; ctx.fill();
      ctx.restore();
      halftone(() => { ctx.beginPath(); ctx.ellipse(mx, my + bob, ms * .85 * mp, ms * mp, 0, 0, TAU); }, MG, .26, 14 * u, (x, y) => .15 + .55 * clamp((x - mx + ms * .3) / (ms * 1.4)) + .3 * clamp((y - my) / ms));
      ctx.save(); ctx.translate(mx, my + bob); ctx.scale(mp, mp);
      body(); ctx.lineWidth = 14 * u; ctx.strokeStyle = BK; ctx.stroke();
      // 肚皮、眼睛（往两边瞟）、嘴边奶油
      ctx.fillStyle = '#FFF4DC'; ctx.beginPath(); ctx.ellipse(0, ms * .35, ms * .5, ms * .5, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 8 * u; ctx.stroke();
      const look = Math.sin(t * 2.2) * ms * .06;
      [-1, 1].forEach(sd => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(sd * ms * .3, -ms * .35, ms * .15, ms * .19, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 7 * u; ctx.stroke(); ctx.fillStyle = BK; ctx.beginPath(); ctx.arc(sd * ms * .3 + look, -ms * .32, ms * .07, 0, TAU); ctx.fill(); });
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ms * .18, -ms * .05, ms * .14, ms * .08, .3, 0, TAU); ctx.fill(); ctx.lineWidth = 6 * u; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-ms * .15, -ms * .08); ctx.quadraticCurveTo(0, ms * .02, ms * .12, -ms * .06); ctx.stroke();
      // 号码牌
      ctx.fillStyle = BK; ctx.fillRect(-ms * .55, ms * .78, ms * 1.1, ms * .32);
      ctx.fillStyle = '#EADBB8'; ctx.font = `${Math.round(ms * .26)}px 'Bebas Neue'`; ctx.textAlign = 'center'; ctx.fillText('SUSPECT 07', 0, ms * 1.03);
      ctx.restore();
    }
    // —— 证物卡：逐条出示
    const EV = [['A', '奶油爪印', CY], ['B', '半块饼干', YE], ['C', '一撮橘毛', MG]];
    EV.forEach(([k, txt, col], i) => {
      const p = eOutBack(slam(1.4 + i * .55, .22), 2.5); if (p <= 0) return;
      const cw = (LAND ? 420 : 460) * u, chh = 120 * u;
      const kk = LAND ? 1 : 1.3, x = LAND ? 80 * u : 70 * u, y = (LAND ? 470 : 1290) * u + i * (chh + 26 * u) * kk;
      ctx.save(); ctx.translate(x + cw / 2 * kk, y + chh / 2 * kk); ctx.scale(kk, kk); ctx.rotate((i - 1) * .025); ctx.scale(p, p); ctx.translate(-cw / 2, -chh / 2);
      ctx.fillStyle = 'rgba(35,31,32,.9)'; ctx.fillRect(8 * u, 8 * u, cw, chh);
      ctx.fillStyle = '#F7EED9'; ctx.fillRect(0, 0, cw, chh); ctx.strokeStyle = BK; ctx.lineWidth = 5 * u; ctx.strokeRect(0, 0, cw, chh);
      ctx.fillStyle = col; ctx.globalCompositeOperation = 'multiply'; ctx.fillRect(0, 0, chh, chh); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = BK; ctx.font = `${Math.round(90 * u)}px 'Bebas Neue'`; ctx.textAlign = 'center'; ctx.fillText(k, chh / 2, chh * .78);
      ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(28 * u)}px 'Noto Sans SC'`; ctx.fillText(`证物 ${k}`, chh + 24 * u, 46 * u);
      ctx.font = `900 ${Math.round(44 * u)}px 'Noto Sans SC'`; ctx.fillText(txt, chh + 24 * u, 98 * u);
      ctx.restore();
    });
    // —— 橡皮章：砸下来，带一点缺墨
    const sp = slam(3.6, .12);
    if (sp > 0) {
      const sx = mx, sy = my + (LAND ? 0 : 60) * u, sc = lerp(2.2, 1, eOutCubic(sp));
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-.18); ctx.scale(sc, sc); ctx.globalAlpha = sp;
      ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(s.stamp, -s.stamp.width / 2, -s.stamp.height / 2);
      ctx.restore();
    }
    // 落章时整页一震
    if (t > 3.6 && t < 3.8) { const k = (3.8 - t) / .2 * 10 * u; ctx.drawImage(ctx.canvas, Math.sin(t * 120) * k, 0); }
  }
});
