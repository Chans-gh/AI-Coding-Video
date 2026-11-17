// C-115 热敏小票：Canvas 2D 画一台深色小票机，纸从机口往上长：每打一行纸就往上送一行高，已经打好的行跟着纸一起上移，纸上的字、虚线、条形码都按“第几行”排；打完后清单逐项打勾，盖红章，最后整张纸带着锯齿撕边被抽走。
// 风格提示词：用热敏小票风格：青绿色桌面底部摆着一台深色小票打印机，每一场打出一张米白热敏纸，从机口一行行往上长出来，等宽字、虚线分隔、底部条形码、锯齿撕边，步骤是逐个打勾的清单，数字印在“合计”一行，结尾盖红章再撕下，配打印机走纸声。
// 题材：平面设计与动态排版 · 适合：清单总结、价格说明、年度账单
scene({
  id: 'C-115', name: '热敏小票', dur: 5, still: 3.95,
  fonts: ["700 40px 'JetBrains Mono'", "400 40px 'JetBrains Mono'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 40px 'Noto Sans SC'"],
  text: '年度账单写完支样片读完本书跑步公里学会做饭合计项耗时天谢谢光临明年见已完成',
  init() {
    const R = mulberry32(115), bars = [];
    for (let i = 0; i < 46; i++) bars.push(1 + Math.floor(R() * 3));
    return { bars };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, INK = '#2B2A28', MONO = "'JetBrains Mono', 'Noto Sans SC'";
    // 桌面
    const bg = ctx.createRadialGradient(W / 2, H * .55, 0, W / 2, H * .55, LONG * .7);
    bg.addColorStop(0, '#2BA59E'); bg.addColorStop(1, '#13706C');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // 小票内容：[类型, 文字]
    const L = [['h', '★ 年度账单 ★'], ['c', '2026-12-31  23:59'], ['-'], ['k', '写完 12 支样片'], ['k', '读完 24 本书'], ['k', '跑步 520 公里'], ['k', '学会做饭'], ['-'],
      ['r', '合计', '4 / 4 项'], ['r', '耗时', '365 天'], ['='], ['bar'], ['bar2'], ['c', '谢谢光临 · 明年见'], ['sp']];
    const lh = (LAND ? 46 : 68) * u, pw = (LAND ? 520 : 800) * u, pad = 34 * u;
    const prW = pw + 110 * u, prH = (LAND ? 210 : 300) * u, slotY = H - prH - (LAND ? 30 : 160) * u, cx = W / 2;
    const T0 = .3, DL = .17;                                   // 每行打印用时
    const printed = clamp((t - T0) / DL, 0, L.length);
    const lineDone = Math.floor(printed), fr = printed - lineDone;
    const feed = (lineDone + eOutCubic(fr)) * lh + 30 * u;      // 送出的纸长
    // 撕下：纸整体往上飞走、微微转
    const tear = eInCubic(clamp((t - 4.35) / .55));
    const paperTop = slotY - feed;
    ctx.save();
    ctx.translate(cx, slotY); ctx.rotate(-tear * .25); ctx.translate(-cx, -slotY - tear * (H * 1.1));
    // 纸：阴影 + 本体 + 上沿锯齿
    const zig = (y, dir) => { const n = Math.round(pw / (16 * u)); for (let i = 0; i <= n; i++) ctx.lineTo(cx + pw / 2 - i * pw / n, y + (i % 2 ? dir * 9 * u : 0)); };
    const bottom = slotY + (tear > 0 ? 0 : 6 * u);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(cx - pw / 2 + 14 * u, paperTop + 14 * u, pw, bottom - paperTop - 14 * u);
    const pg = ctx.createLinearGradient(cx - pw / 2, 0, cx + pw / 2, 0);
    pg.addColorStop(0, '#E9E4D8'); pg.addColorStop(.12, '#F7F3EA'); pg.addColorStop(.88, '#F7F3EA'); pg.addColorStop(1, '#E6E1D4');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.moveTo(cx - pw / 2, bottom);
    { const n = Math.round(pw / (16 * u)); for (let i = 0; i <= n; i++) ctx.lineTo(cx - pw / 2 + i * pw / n, paperTop + (i % 2 ? 9 * u : 0)); }
    if (tear > 0) zig(bottom, -1); else ctx.lineTo(cx + pw / 2, bottom);
    ctx.closePath(); ctx.fill();
    // 每一行
    ctx.save(); ctx.beginPath(); ctx.rect(cx - pw, paperTop, pw * 2, slotY - paperTop + (tear > 0 ? 40 * u : 0)); ctx.clip();
    const x0 = cx - pw / 2 + pad, x1 = cx + pw / 2 - pad;
    for (let i = 0; i < Math.min(L.length, lineDone + 1); i++) {
      const y = paperTop + 30 * u + i * lh + lh * .72, [k, a, b] = L[i];
      // 正在打的那一行：从左往右露出
      const rev = i < lineDone ? 1 : fr;
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - 10 * u, y - lh, (x1 - x0 + 20 * u) * rev, lh * 1.4); ctx.clip();
      ctx.fillStyle = INK; ctx.strokeStyle = INK;
      const fs = Math.round(lh * .56);
      if (k === 'h') { ctx.font = `900 ${Math.round(lh * .7)}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText(a, cx, y); }
      else if (k === 'c') { ctx.font = `400 ${fs}px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText(a, cx, y); }
      else if (k === '-' || k === '=') { ctx.lineWidth = 2 * u; ctx.setLineDash(k === '-' ? [10 * u, 8 * u] : [3 * u, 4 * u]); for (let d = 0; d < (k === '=' ? 2 : 1); d++) { ctx.beginPath(); ctx.moveTo(x0, y - fs * .35 + d * 7 * u); ctx.lineTo(x1, y - fs * .35 + d * 7 * u); ctx.stroke(); } ctx.setLineDash([]); }
      else if (k === 'k') {
        ctx.font = `400 ${fs}px ${MONO}`; ctx.textAlign = 'left';
        ctx.lineWidth = 2 * u; ctx.strokeRect(x0, y - fs * .85, fs * .9, fs * .9);
        ctx.fillText(a, x0 + fs * 1.4, y);
      } else if (k === 'r') {
        ctx.font = `700 ${Math.round(lh * .6)}px ${MONO}`; ctx.textAlign = 'left'; ctx.fillText(a, x0, y);
        ctx.textAlign = 'right'; ctx.fillText(b, x1, y);
      } else if (k === 'bar' || k === 'bar2') {
        if (k === 'bar') { let x = x0 + 20 * u; const bw0 = (x1 - x0 - 40 * u) / s.bars.reduce((a, b) => a + b + 1, 0); s.bars.forEach(w => { ctx.fillRect(x, y - lh * .8, w * bw0, lh * 1.5); x += (w + 1) * bw0; }); }
        else { ctx.font = `400 ${Math.round(fs * .8)}px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText('6 920260 123115', cx, y + lh * .1); }
      }
      ctx.restore();
    }
    // 打勾：纸打完后逐项画上
    [3, 4, 5, 6].forEach((li, j) => {
      const p = clamp((t - 3.0 - j * .17) / .14); if (p <= 0) return;
      const y = paperTop + 30 * u + li * lh + lh * .72, fs = lh * .56;
      ctx.strokeStyle = '#1B1B1B'; ctx.lineWidth = 4 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); drawPartial(ctx, [[x0 + fs * .12, y - fs * .45], [x0 + fs * .4, y - fs * .15], [x0 + fs * 1.0, y - fs * 1.05]], p); ctx.stroke();
    });
    // 红章
    const sp = clamp((t - 3.8) / .16);
    if (sp > 0) {
      const sx = cx + pw * .14, sy = paperTop + 30 * u + 11.9 * lh, sc = lerp(1.6, 1, eOutCubic(sp));
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-.22); ctx.scale(sc, sc); ctx.globalAlpha = .82 * sp;
      ctx.strokeStyle = '#D3262E'; ctx.fillStyle = '#D3262E'; ctx.lineWidth = 6 * u;
      rr(ctx, -120 * u, -50 * u, 240 * u, 100 * u, 12 * u); ctx.stroke();
      ctx.lineWidth = 2 * u; rr(ctx, -110 * u, -40 * u, 220 * u, 80 * u, 8 * u); ctx.stroke();
      ctx.font = `900 ${Math.round(54 * u)}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText('已完成', 0, 19 * u);
      ctx.restore();
    }
    ctx.restore(); ctx.restore();
    // 打印机（压在纸下端上面）
    const px = cx - prW / 2;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, px + 16 * u, slotY + 22 * u, prW, prH, 30 * u); ctx.fill();
    const body = ctx.createLinearGradient(0, slotY, 0, slotY + prH);
    body.addColorStop(0, '#3A3E47'); body.addColorStop(1, '#22252B');
    ctx.fillStyle = body; rr(ctx, px, slotY - 6 * u, prW, prH, 30 * u); ctx.fill();
    ctx.fillStyle = '#121418'; rr(ctx, cx - pw / 2 - 16 * u, slotY - 4 * u, pw + 32 * u, 18 * u, 8 * u); ctx.fill();
    ctx.fillStyle = '#4B505B'; ctx.fillRect(cx - pw / 2 - 16 * u, slotY + 14 * u, pw + 32 * u, 3 * u);
    const busy = t > T0 && t < T0 + L.length * DL;
    ctx.fillStyle = busy ? ((f >> 2) % 2 ? '#3BE07A' : '#1F8A4A') : '#3BE07A';
    ctx.beginPath(); ctx.arc(px + 60 * u, slotY + prH * .55, 10 * u, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8D93A0'; ctx.font = `700 ${Math.round(26 * u)}px 'JetBrains Mono'`; ctx.textAlign = 'right';
    ctx.fillText('TP-58', px + prW - 50 * u, slotY + prH * .58);
    ctx.fillStyle = '#2E323A'; rr(ctx, px + 90 * u, slotY + prH * .45, 120 * u, 22 * u, 11 * u); ctx.fill();
  }
});
