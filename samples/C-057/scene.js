// C-057 综艺节奏扁平：Canvas 2D 按 150 BPM（一拍 0.4 秒）排一张动作表，前 4 拍老师豆子出题、后 4 拍玩家豆子照做，每个动作只在拍点上切换并带一次挤压回弹；放射光背景每拍转一格、糖果条纹地板每拍平移一格，全部平涂、8 像素墨线描边加不模糊的硬投影，最后弹出 Perfect!。
// 风格提示词：用综艺节奏游戏扁平风格：豆子形吉祥物带 8px 墨色描边和硬投影，糖果色条纹和放射光背景，无渐变无纹理，每个动作卡在 150 BPM 的节拍上，一问一答式表演，每关结尾弹出“Perfect!”。
// 题材：卡通与动漫 · 适合：儿童、轻娱乐、节奏感强的内容
scene({
  id: 'C-057', name: '综艺节奏扁平', dur: 4.8, still: 4.15,
  fonts: ["80px 'Bangers'", "400 60px 'ZCOOL KuaiLe'"],
  text: '跟我做举手跳一跳转个圈Perfect!123',
  draw(ctx, t, s) {
    const u = SHORT / 1080, BT = .4, INK = '#2B1D2E';
    const b = Math.floor(t / BT), lt = t - b * BT, bp = lt / BT;
    // 放射光：每拍转一格
    const cx = W / 2, cy = LAND ? H * .42 : H * .38;
    ctx.fillStyle = '#FFD84D'; ctx.fillRect(0, 0, W, H);
    const rot = (b + eOutCubic(clamp(bp / .3))) * TAU / 24;
    ctx.fillStyle = '#FFC233';
    for (let k = 0; k < 12; k++) { const a = rot + k * TAU / 12; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, LONG, a, a + TAU / 24); ctx.closePath(); ctx.fill(); }
    // 糖果条纹地板
    const fy = LAND ? H * .72 : H * .66, sw = 90 * u, off = ((b + eOutCubic(clamp(bp / .3))) * sw) % (sw * 2);
    ctx.save(); ctx.beginPath(); ctx.rect(0, fy, W, H - fy); ctx.clip();
    ctx.fillStyle = '#FF7AB6'; ctx.fillRect(0, fy, W, H);
    ctx.fillStyle = '#7FE0F0';
    for (let x = -sw * 4 + off; x < W + H; x += sw * 2) { ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x + sw, fy); ctx.lineTo(x + sw - (H - fy), H); ctx.lineTo(x - (H - fy), H); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = INK; ctx.fillRect(0, fy - 4 * u, W, 8 * u);
    // 动作表：0 站 1 举手 2 跳 3 转；老师 0–3 拍，玩家 4–7 拍，第 8 拍以后一起庆祝
    const SEQ = [1, 2, 1, 3];
    const pose = who => {
      if (b >= 9) return 4;
      if (who === 0) return b < 4 ? SEQ[b] : 0;
      return b >= 4 && b < 8 ? SEQ[b - 4] : 0;
    };
    const bean = (x, y, sc, col, who) => {
      const p = pose(who), sq = 1 - Math.sin(clamp(bp / .35) * Math.PI) * .12 * (p ? 1 : .4);
      let jy = 0, spin = 0, arms = [.6, -.6];
      if (p === 1) arms = [2.6, -.6];
      if (p === 2) { jy = -Math.sin(clamp(bp / .8) * Math.PI) * 120 * u; arms = [2.3, -2.3]; }
      if (p === 3) spin = eInOutCubic(clamp(bp / .7)) * TAU;
      if (p === 4) { jy = -Math.abs(Math.sin(t * 7.85)) * 60 * u; arms = [2.5, -2.5]; }
      const R = 130 * u * sc;
      // 硬投影
      ctx.fillStyle = 'rgba(43,29,46,.35)'; ctx.beginPath(); ctx.ellipse(x + 18 * u, y + 8 * u, R * .9, R * .22, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(x, y + jy); ctx.scale(Math.cos(spin) * (2 - sq), sq);
      ctx.lineWidth = 8 * u; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // 手臂
      arms.forEach((a, k) => { const sx = (k ? 1 : -1) * R * .75, sy = -R * 1.1; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineWidth = 14 * u; ctx.lineTo(sx + (k ? 1 : -1) * Math.sin(Math.abs(a)) * R * .7, sy + Math.cos(a) * R * .7); ctx.stroke(); ctx.lineWidth = 8 * u; });
      // 豆子身体：硬投影 + 平涂 + 描边
      const shape = () => { ctx.beginPath(); ctx.ellipse(0, -R * 1.05, R * .82, R * 1.05, 0, 0, TAU); };
      ctx.save(); ctx.translate(10 * u, 10 * u); shape(); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
      shape(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      // 脸（转身时只在朝前的半圈画）
      if (Math.cos(spin) > 0) {
        ctx.fillStyle = INK;
        [-1, 1].forEach(sd => { ctx.beginPath(); ctx.ellipse(sd * R * .28, -R * 1.35, R * .09, R * (p === 4 ? .05 : .14), 0, 0, TAU); ctx.fill(); });
        ctx.beginPath(); ctx.arc(0, -R * 1.05, R * (p ? .22 : .14), .15 * Math.PI, .85 * Math.PI); ctx.stroke();
        ctx.fillStyle = '#FF8FB8'; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.ellipse(sd * R * .5, -R * 1.08, R * .1, R * .06, 0, 0, TAU); ctx.fill(); });
      }
      ctx.restore();
    };
    const tx = LAND ? W * .3 : W * .27, px = LAND ? W * .7 : W * .73;
    bean(tx, fy + 30 * u, LAND ? 1.45 : 1.75, '#6FD36A', 0);
    bean(px, fy + 30 * u, LAND ? 1.45 : 1.75, '#59B7FF', 1);
    // 对话气泡：谁在做就在谁头上，显示动作名和拍号
    const NAMES = { 1: '举手', 2: '跳一跳', 3: '转个圈' };
    const bubble = (x, txt, col) => {
      const y = fy - (LAND ? 600 : 720) * u, pop = eOutBack(clamp(bp / .25), 3);
      ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop);
      ctx.font = `400 ${Math.round(60 * u)}px 'ZCOOL KuaiLe'`; const w = ctx.measureText(txt).width + 70 * u, h = 100 * u;
      ctx.fillStyle = INK; rr(ctx, -w / 2 + 8 * u, -h / 2 + 8 * u, w, h, 30 * u); ctx.fill();
      ctx.fillStyle = col; rr(ctx, -w / 2, -h / 2, w, h, 30 * u); ctx.fill(); ctx.lineWidth = 8 * u; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(txt, 0, 20 * u);
      ctx.restore();
    };
    if (b < 4) bubble(tx, NAMES[SEQ[b]], '#FFFFFF');
    else if (b < 8) bubble(px, NAMES[SEQ[b - 4]], '#FFFFFF');
    // 拍点灯：8 格，老师绿、玩家蓝
    const dy = LAND ? 70 * u : 150 * u;
    for (let k = 0; k < 8; k++) {
      const x = W / 2 + (k - 3.5) * 70 * u, on = k <= b;
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 5 * u, dy + 5 * u, 22 * u, 0, TAU); ctx.fill();
      ctx.fillStyle = on ? (k < 4 ? '#6FD36A' : '#59B7FF') : '#FFF3C4'; ctx.beginPath(); ctx.arc(x, dy, 22 * u, 0, TAU); ctx.fill();
      ctx.lineWidth = 6 * u; ctx.strokeStyle = INK; ctx.stroke();
    }
    // Perfect!
    const pp = clamp((t - 8 * BT) / .3);
    if (pp > 0) {
      const sc = eOutElastic(pp) * (1 + .04 * Math.sin(t * 15.7));
      ctx.save(); ctx.translate(W / 2, LAND ? H * .3 : H * .3); ctx.rotate(-.08); ctx.scale(sc, sc);
      ctx.font = `${Math.round((LAND ? 230 : 220) * u)}px 'Bangers'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = 26 * u; ctx.strokeStyle = INK;
      ctx.fillStyle = INK; ctx.fillText('Perfect!', 14 * u, 14 * u);
      ctx.strokeText('Perfect!', 0, 0); ctx.fillStyle = '#FF4F8B'; ctx.fillText('Perfect!', 0, 0);
      ctx.restore();
      // 星星
      for (let k = 0; k < 10; k++) {
        const a = k / 10 * TAU + .3, r = eOutCubic(pp) * (LAND ? 520 : 460) * u, x = W / 2 + Math.cos(a) * r, y = (LAND ? H * .3 : H * .3) + Math.sin(a) * r * .6;
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 4 + k); ctx.fillStyle = k % 2 ? '#FFFFFF' : '#59B7FF'; ctx.strokeStyle = INK; ctx.lineWidth = 5 * u;
        ctx.beginPath(); for (let j = 0; j < 10; j++) { const rr_ = (j % 2 ? 12 : 30) * u, aa = j / 10 * TAU; ctx.lineTo(Math.cos(aa) * rr_, Math.sin(aa) * rr_); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    }
  }
});
