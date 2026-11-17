// C-119 电视购物：Canvas 2D 每 1.2 秒硬切一屏，切之前插一帧纯白；每屏满铺单色放射光芒（灰黑、金黄、警报红、电光蓝），漫画大字带粗黑描边和硬投影从放大砸到原大；圆滚滚的吉祥物按屏从垂头丧气（压扁、下垂眼、汗珠）变成神采飞扬（跳、星星眼）；底部卖点条一直按 t 滚动。
// 风格提示词：用电视购物风格：每一句卖点独占一屏，满屏单色放射光芒背景、颜色随段落从灰黑换到金黄、警报红、电光蓝，粗描边漫画大字砸进画面，底部滚动卖点条一直在跑，圆滚滚的吉祥物从垂头丧气变得神采飞扬，镜头不动、硬切前闪一帧白，配热闹的叫卖音效。
// 题材：卡通与动漫 · 适合：促销、带货、限时活动
scene({
  id: 'C-119', name: '电视购物', dur: 4.8, still: 3.0,
  fonts: ["400 80px 'ZCOOL KuaiLe'", "80px 'Bangers'", "900 40px 'Noto Sans SC'"],
  text: '还在为拖地烦恼？只要一按！地板亮晶晶限时五折立即下单今天下单包邮送拖把头全国包邮七天无理由',
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, INK = '#1A1A1A', SEG = 1.2;
    const si = Math.min(3, Math.floor(t / SEG)), lt = t - si * SEG;
    const P = [
      { bg: '#3A3A3E', ray: '#4A4A50', txt: ['还在为拖地', '烦恼？'], col: '#D9D9D9', mood: 0 },
      { bg: '#FFB800', ray: '#FFD03D', txt: ['只要一按！', '地板亮晶晶'], col: '#FFFFFF', mood: 1 },
      { bg: '#E8102E', ray: '#FF3B52', txt: ['限时', '5 折！'], col: '#FFE600', mood: 2 },
      { bg: '#0A5CFF', ray: '#2E7BFF', txt: ['立即下单', '包邮！'], col: '#FFFFFF', mood: 3 }][si];
    // 放射光芒：缓慢转
    const cx = W / 2, cy = LAND ? H * .45 : H * .42;
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = P.ray;
    for (let k = 0; k < 16; k++) { const a = k * TAU / 16 + t * .4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, LONG * 1.2, a, a + TAU / 32); ctx.closePath(); ctx.fill(); }
    // 吉祥物：圆海绵，心情 0–3
    const mx = LAND ? W * .74 : W * .5, my = LAND ? H * .56 : H * .66, R = (LAND ? 200 : 270) * u;
    const mood = P.mood, sq = mood === 0 ? .8 : 1, hop = mood >= 2 ? -Math.abs(Math.sin(t * 9)) * 50 * u : mood === 1 ? -Math.abs(Math.sin(t * 5)) * 20 * u : 0;
    ctx.save(); ctx.translate(mx, my + hop + (mood === 0 ? R * .2 : 0)); ctx.scale(1 / sq, sq);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(14 * u, R + 10 * u - hop / sq, R * .9, R * .18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(12 * u, 12 * u, R, 0, TAU); ctx.fill();
    ctx.fillStyle = mood === 0 ? '#B9C07A' : '#FFE14D'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.lineWidth = 12 * u; ctx.strokeStyle = INK; ctx.stroke();
    // 海绵孔
    ctx.fillStyle = mood === 0 ? '#9DA35E' : '#F2C230';
    [[-.5, -.55, .12], [.45, -.6, .09], [.6, .35, .13], [-.62, .4, .1], [.05, .7, .08]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * R, y * R, r * R, 0, TAU); ctx.fill(); });
    // 眼睛
    ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineCap = 'round';
    if (mood === 0) {
      [-1, 1].forEach(sd => { ctx.lineWidth = 10 * u; ctx.beginPath(); ctx.arc(sd * R * .3, -R * .1, R * .14, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sd * R * .18, -R * .4); ctx.lineTo(sd * R * .45, -R * .32); ctx.stroke(); });
      ctx.beginPath(); ctx.arc(0, R * .5, R * .2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      const dy = ((t * 1.5) % 1) * R * .5;
      ctx.fillStyle = '#7FD3FF'; ctx.beginPath(); ctx.moveTo(R * .72, -R * .5 + dy); ctx.quadraticCurveTo(R * .9, -R * .1 + dy, R * .72, -R * .05 + dy); ctx.quadraticCurveTo(R * .56, -R * .1 + dy, R * .72, -R * .5 + dy); ctx.fill();
    } else {
      [-1, 1].forEach(sd => {
        const ex = sd * R * .3, ey = -R * .15;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, R * .2, 0, TAU); ctx.fill(); ctx.lineWidth = 8 * u; ctx.stroke();
        if (mood >= 2) { ctx.fillStyle = mood === 2 ? '#E8102E' : '#0A5CFF'; ctx.save(); ctx.translate(ex, ey); ctx.rotate(t * 3); ctx.beginPath(); for (let j = 0; j < 10; j++) { const r = (j % 2 ? .06 : .15) * R, a = j / 10 * TAU; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.restore(); }
        else { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex, ey + R * .03, R * .09, 0, TAU); ctx.fill(); }
      });
      ctx.fillStyle = '#C2185B'; ctx.beginPath(); ctx.arc(0, R * .3, R * .3, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.lineWidth = 8 * u; ctx.stroke();
    }
    // 手臂：心情好时举起
    ctx.lineWidth = 14 * u; ctx.strokeStyle = INK;
    [-1, 1].forEach(sd => { const up = mood === 0 ? -.4 : mood === 1 ? .5 : 1.2 + .3 * Math.sin(t * 12 + sd); ctx.beginPath(); ctx.moveTo(sd * R * .95, R * .1); ctx.lineTo(sd * R * (1.25 + .1 * up), R * (.1 - .55 * up)); ctx.stroke(); });
    ctx.restore();
    // 漫画大字：从放大砸到原大，两行先后
    const zh = s => `400 ${Math.round(s)}px 'ZCOOL KuaiLe'`;
    const tx = LAND ? W * .36 : W / 2, ty = LAND ? H * .36 : H * .17;
    P.txt.forEach((ln, i) => {
      const p = clamp((lt - .05 - i * .2) / .14); if (p <= 0) return;
      const size = (i ? (LAND ? 190 : 250) : (LAND ? 150 : 190)) * u * (ln.length > 4 ? .9 : 1);
      const sc = lerp(2.4, 1, eOutCubic(p)) * (1 + .05 * Math.max(0, 1 - (lt - .2 - i * .2) * 6));
      ctx.save(); ctx.translate(tx, ty + i * (LAND ? 210 : 270) * u); ctx.rotate(i ? .04 : -.05); ctx.scale(sc, sc); ctx.globalAlpha = p;
      ctx.font = zh(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.fillStyle = INK; ctx.fillText(ln, 12 * u, 14 * u);
      ctx.lineWidth = 22 * u; ctx.strokeStyle = INK; ctx.strokeText(ln, 0, 0);
      ctx.fillStyle = i ? P.col : '#FFFFFF'; ctx.fillText(ln, 0, 0);
      ctx.restore();
    });
    // 价格爆炸贴（第 3 屏）
    if (si === 2) {
      const p = eOutBack(clamp((lt - .45) / .2), 3);
      ctx.save(); ctx.translate(LAND ? W * .58 : W * .8, LAND ? H * .2 : H * .44); ctx.rotate(.2 + Math.sin(t * 10) * .03); ctx.scale(p, p);
      ctx.beginPath(); for (let j = 0; j < 24; j++) { const r = (j % 2 ? 95 : 130) * u, a = j / 24 * TAU; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath();
      ctx.fillStyle = '#FFE600'; ctx.fill(); ctx.lineWidth = 8 * u; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = INK; ctx.font = `${Math.round(70 * u)}px 'Bangers'`; ctx.textAlign = 'center'; ctx.fillText('¥99', 0, 24 * u);
      ctx.restore();
    }
    // 卖点滚动条
    const by = H - 120 * u;
    ctx.fillStyle = INK; ctx.fillRect(0, by, W, 120 * u);
    ctx.fillStyle = '#FFE600'; ctx.fillRect(0, by + 8 * u, W, 104 * u);
    ctx.save(); ctx.beginPath(); ctx.rect(0, by, W, 120 * u); ctx.clip();
    ctx.fillStyle = INK; ctx.font = `900 ${Math.round(48 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'left';
    const msg = '★ 今天下单送拖把头 ★ 全国包邮 ★ 七天无理由 ';
    const mw = ctx.measureText(msg).width, off = (t * 420 * u) % mw;
    for (let k = 0; k < 4; k++) ctx.fillText(msg, -off + k * mw, by + 78 * u);
    ctx.restore();
    // 硬切前闪一帧白
    if (si < 3 && t > (si + 1) * SEG - 1 / 30) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H); }
  }
});
