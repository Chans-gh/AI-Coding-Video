// C-120 体育直播包装：Canvas 2D 先画夜场：用“lighter”叠加的楔形渐变当探照灯光束、按 t 来回扫，看台是一格格点阵灯（亮灭由哈希和 t 决定），右下一角绿茵和白线；1.4 秒后深藏青数据卡带球衣斜纹从右滑入，比分数字滚动、两队对比条填满；3.6 秒进球，角标比分翻成 2–1，彩纸按抛物线（位置只由 t 算）撒下。
// 风格提示词：用体育直播包装风格：开场是夜场体育馆，交叉的探照光束、点阵灯组成的看台和一角绿茵，之后是带球衣斜纹的深藏青数据卡，左上比分角标、右上红色“直播”徽章、底部来源滚动条始终不动，双方用橙和灰蓝区分，数字滚动、对比条填满，高潮撒彩纸。
// 题材：电影年代与屏幕科技 · 适合：赛事战报、数据对比、业绩冲刺
scene({
  id: 'C-120', name: '体育直播包装', dur: 5, still: 3.95,
  fonts: ["900 80px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  text: '东港西岭直播控球率射门传球成功率进球数据来源：赛事技术统计第分钟半场LIVE',
  init() {
    const R = mulberry32(120), conf = [];
    for (let i = 0; i < 140; i++) conf.push([R() * 2 - 1, R(), R(), R(), Math.floor(R() * 4)]);
    return { conf };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, OR = '#FF7A1A', BL = '#7D93B5', NAVY = '#0B1530';
    // —— 夜场
    ctx.fillStyle = '#05070F'; ctx.fillRect(0, 0, W, H);
    const standTop = H * (LAND ? .38 : .4), standBot = H * (LAND ? .72 : .7), dot = 14 * u;
    for (let y = standTop; y < standBot; y += dot) for (let x = 0; x < W; x += dot) {
      const i = Math.floor(x / dot), j = Math.floor(y / dot), h = hash2(i, j);
      const wave = .5 + .5 * Math.sin(i * .18 - t * 6);
      const on = h > .55 ? .25 + .5 * h * (t > 3.6 ? wave : .6) : .06;
      ctx.fillStyle = h > .92 ? `rgba(255,122,26,${on})` : h < .08 ? `rgba(125,147,181,${on})` : `rgba(230,236,255,${on})`;
      ctx.beginPath(); ctx.arc(x + dot / 2, y + dot / 2, dot * .3, 0, TAU); ctx.fill();
    }
    // 一角绿茵
    ctx.save(); ctx.beginPath(); ctx.moveTo(W * .35, H); ctx.lineTo(W, standBot - 20 * u); ctx.lineTo(W, H); ctx.closePath(); ctx.clip();
    for (let k = 0; k < 12; k++) { ctx.fillStyle = k % 2 ? '#1F7A3A' : '#24893F'; ctx.fillRect(W * .3 + k * 90 * u, standBot - 40 * u, 90 * u, H); }
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.arc(W * .95, H * 1.02, 260 * u, Math.PI, Math.PI * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W * .35, H * .98); ctx.lineTo(W, standBot - 10 * u); ctx.stroke();
    ctx.restore();
    // 探照光束
    ctx.globalCompositeOperation = 'lighter';
    [[.08, 1, 0], [.92, -1, 1.7], [.3, 1, 3.1], [.7, -1, 4.4]].forEach(([fx, dir, ph]) => {
      const ox = W * fx, oy = H * .02, a = Math.PI / 2 + dir * (.35 + .25 * Math.sin(t * 1.3 + ph)), L = LONG * 1.1, sp = .07;
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, L);
      g.addColorStop(0, 'rgba(200,220,255,.5)'); g.addColorStop(1, 'rgba(200,220,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, L, a - sp, a + sp); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(ox, oy, 16 * u, 0, TAU); ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    // —— 数据卡
    const cin = eOutExpo(clamp((t - 1.4) / .45));
    if (cin > 0) {
      const cw = (LAND ? 1100 : 920) * u, ch = (LAND ? 620 : 1000) * u;
      const x0 = lerp(W + 40 * u, (W - cw) / 2, cin), y0 = LAND ? 220 * u : 420 * u;
      ctx.save(); ctx.beginPath(); ctx.moveTo(x0 + 40 * u, y0); ctx.lineTo(x0 + cw, y0); ctx.lineTo(x0 + cw - 40 * u, y0 + ch); ctx.lineTo(x0, y0 + ch); ctx.closePath();
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40 * u; ctx.fillStyle = NAVY; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.clip();
      // 球衣斜纹
      ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 30 * u;
      for (let k = -20; k < 40; k++) { ctx.beginPath(); ctx.moveTo(x0 + k * 70 * u, y0); ctx.lineTo(x0 + k * 70 * u - ch * .6, y0 + ch); ctx.stroke(); }
      ctx.fillStyle = OR; ctx.fillRect(x0, y0, cw / 2, 10 * u); ctx.fillStyle = BL; ctx.fillRect(x0 + cw / 2, y0, cw / 2, 10 * u);
      // 队名
      const pad = 70 * u;
      ctx.font = `900 ${Math.round(56 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.fillStyle = OR; ctx.fillText('东港', x0 + pad, y0 + 100 * u);
      ctx.textAlign = 'right'; ctx.fillStyle = BL; ctx.fillText('西岭', x0 + cw - pad, y0 + 100 * u);
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(30 * u)}px 'Noto Sans SC'`; ctx.fillText('半场数据', x0 + cw / 2, y0 + 92 * u);
      // 三行对比
      const ROWS = [['控球率', 58, 42, '%'], ['射门', 14, 9, ''], ['传球成功率', 87, 79, '%']];
      const rh = (ch - 170 * u) / 3;
      ROWS.forEach(([name, a, b, unit], i) => {
        const p = eOutCubic(clamp((t - 1.8 - i * .25) / .7));
        const y = y0 + 170 * u + i * rh, bw = cw - 2 * pad, mid = x0 + cw / 2;
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(34 * u)}px 'Noto Sans SC'`; ctx.fillText(name, mid, y + 40 * u);
        ctx.font = `${Math.round(78 * u)}px 'Bebas Neue'`;
        ctx.textAlign = 'left'; ctx.fillStyle = OR; ctx.fillText(Math.round(a * p) + unit, x0 + pad, y + 56 * u);
        ctx.textAlign = 'right'; ctx.fillStyle = BL; ctx.fillText(Math.round(b * p) + unit, x0 + cw - pad, y + 56 * u);
        const by = y + 82 * u, bh = 22 * u, tot = a + b;
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x0 + pad, by, bw, bh);
        const la = bw * (a / tot) * p, lb = bw * (b / tot) * p;
        ctx.fillStyle = OR; ctx.fillRect(x0 + pad + bw * (a / tot) - la, by, la, bh);
        ctx.fillStyle = BL; ctx.fillRect(x0 + pad + bw * (a / tot), by, lb, bh);
      });
      ctx.restore();
    }
    // —— 进球大字
    const gp = clamp((t - 3.6) / .2);
    if (gp > 0 && t < 4.5) {
      const sc = lerp(3, 1, eOutExpo(gp)), al = 1 - smooth(4.2, 4.5, t);
      ctx.save(); ctx.translate(W / 2, H * (LAND ? .5 : .46)); ctx.rotate(-.06); ctx.scale(sc, sc); ctx.globalAlpha = al;
      ctx.fillStyle = OR; ctx.fillRect(-W, -90 * u, W * 2, 180 * u);
      ctx.fillStyle = '#fff'; ctx.font = `${Math.round(200 * u)}px 'Bebas Neue'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GOAL!  东港', 0, 8 * u);
      ctx.restore();
    }
    // —— 彩纸：位置只由 t 算（抛射 + 下落 + 摆动）
    if (t > 3.6) {
      const tt = t - 3.6;
      s.conf.forEach(([vx, vy, sp, ph, c], i) => {
        const x = W / 2 + vx * W * .6 * Math.min(1, tt * 2) + Math.sin(tt * 4 + ph * 9) * 30 * u;
        const y = H * .5 - (1 - vy * .3) * H * .6 * Math.sin(Math.min(1, tt * 1.6) * Math.PI / 2) + Math.max(0, tt - .3) ** 2 * H * .7 * (.5 + sp);
        ctx.save(); ctx.translate(x, y); ctx.rotate(tt * (4 + sp * 6) + ph * 6); ctx.scale(1, Math.cos(tt * 8 + ph * 7));
        ctx.fillStyle = [OR, BL, '#FFFFFF', '#FFD23C'][c]; ctx.fillRect(-9 * u, -5 * u, 18 * u, 10 * u); ctx.restore();
      });
    }
    // —— 常驻包装：比分角标、直播徽章、来源条
    const bp = eOutCubic(clamp((t - .4) / .4));
    ctx.save(); ctx.globalAlpha = bp;
    const sx = 50 * u, sy = 50 * u;
    ctx.fillStyle = NAVY; ctx.fillRect(sx, sy, 470 * u, 80 * u);
    ctx.fillStyle = OR; ctx.fillRect(sx, sy, 12 * u, 80 * u); ctx.fillStyle = BL; ctx.fillRect(sx + 458 * u, sy, 12 * u, 80 * u);
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(34 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.fillText('东港', sx + 30 * u, sy + 52 * u);
    ctx.textAlign = 'right'; ctx.fillText('西岭', sx + 440 * u, sy + 52 * u);
    // 比分翻牌
    const fl = clamp((t - 3.7) / .25), score = fl < .5 ? '1 – 1' : '2 – 1';
    ctx.save(); ctx.translate(sx + 235 * u, sy + 40 * u); ctx.scale(1, Math.abs(Math.cos(fl * Math.PI)));
    ctx.fillStyle = '#fff'; rr(ctx, -80 * u, -32 * u, 160 * u, 64 * u, 8 * u); ctx.fill();
    ctx.fillStyle = NAVY; ctx.font = `${Math.round(58 * u)}px 'Bebas Neue'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(score, 0, 4 * u);
    ctx.restore();
    ctx.fillStyle = 'rgba(11,21,48,.9)'; ctx.fillRect(sx, sy + 80 * u, 160 * u, 44 * u);
    ctx.fillStyle = '#fff'; ctx.font = `${Math.round(36 * u)}px 'Bebas Neue'`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${String(44 + Math.floor(t / 5)).padStart(2, '0')}:${String(12 + Math.floor(t)).padStart(2, '0')}`, sx + 22 * u, sy + 114 * u);
    // 直播徽章
    ctx.fillStyle = '#E3132C'; rr(ctx, W - 230 * u, sy, 180 * u, 66 * u, 8 * u); ctx.fill();
    ctx.fillStyle = (f >> 3) % 2 ? '#fff' : 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(W - 196 * u, sy + 33 * u, 10 * u, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `${Math.round(48 * u)}px 'Bebas Neue'`; ctx.fillText('LIVE', W - 172 * u, sy + 50 * u);
    ctx.font = `700 ${Math.round(28 * u)}px 'Noto Sans SC'`; ctx.fillText('直播', W - 104 * u, sy + 45 * u);
    // 来源条
    const by = H - 70 * u;
    ctx.fillStyle = 'rgba(11,21,48,.92)'; ctx.fillRect(0, by, W, 70 * u);
    ctx.fillStyle = OR; ctx.fillRect(0, by, W * .25, 4 * u); ctx.fillStyle = BL; ctx.fillRect(W * .25, by, W * .75, 4 * u);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = `700 ${Math.round(28 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'left';
    ctx.fillText('数据来源：赛事技术统计', 50 * u, by + 46 * u);
    ctx.restore();
  }
});
