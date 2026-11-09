// G-017 情景安全演练：生成的办公室插画当底图，代码按旁白的逐字时间逐个圈出隐患、拉出编号标签，再弹一道选择题——先选错的变红轻抖，再亮出正确答案打勾；最后用滑块把同一间办公室整改后的图（以第一张为参考图生成）划进来对比
// 素材：生图 2 张（隐患版、整改版）、语音合成旁白；配乐 CC0。圈、标签、题卡、滑块都是 Canvas 2D 画的，时刻用 cueTime 从旁白里取
scene({
  id: 'G-017', name: '情景安全演练', dur: 14.5, still: 10.6,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'"],
  text: '情景安全演练第课找隐患这间办公室藏着两处电线横穿过道纸箱堵住了安全出口横在上直接跨过去不对先报告再用线槽收好怎么办整改完成前后插画生成旁白合成配乐正确答案选择题',
  async init() {
    const A = await loadAssets();
    const [a, b] = await Promise.all([loadImage('office.jpg'), loadImage('fixed.jpg')]);
    const T = (k, f) => cueTime(A, k, f);
    return { A, a, b, h1: T('电线横穿', 3.3), h2: T('纸箱', 5), q: T('电线横在', 7), x: T('跨过去', 8.3), no: T('不对', 9.2), ok: T('先报告', 10.4) };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, INK = '#1d2733', RED = '#e5484d', GREEN = '#2fa36b', AMB = '#f5a524';
    ctx.fillStyle = '#e8ecf1'; ctx.fillRect(0, 0, W, H);
    // 底图区域：横屏铺满；竖屏放上半部，取景框住两处隐患
    const IX = 0, IY = LAND ? 0 : H * .1, IW = W, IH = LAND ? H : H * .52, FX = LAND ? .5 : .55;
    const zoom = 1.02 + .05 * eInOutCubic(inv(0, 12, t));
    const [sw, sh] = srcSize(s.a), k = Math.max(IW / sw, IH / sh) * zoom, dw = sw * k, dh = sh * k;
    const ox = IX + (IW - dw) * FX, oy = IY + (IH - dh) * .5;
    const P = (fx, fy) => [ox + fx * dw, oy + fy * dh];          // 图上的位置（0–1）→ 屏幕坐标
    drawCover(ctx, s.a, IX, IY, IW, IH, { zoom, fx: FX });
    // 整改后：滑块从右往左划过
    const wp = eInOutCubic(inv(12.3, 13.4, t)), wx = lerp(IX + IW, IX, wp);
    if (wp > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(wx, IY, IW, IH); ctx.clip();
      drawCover(ctx, s.b, IX, IY, IW, IH, { zoom, fx: FX }); ctx.restore();
    }
    // 隐患：圈 + 编号标签；整改图划过时一起擦掉
    const HZ = [[.33, .82, .2, .07, '隐患 1：电线横穿过道', s.h1], [.73, .71, .1, .13, '隐患 2：纸箱堵住安全出口', s.h2]];
    ctx.save(); ctx.beginPath(); ctx.rect(IX, IY, wx - IX, IH); ctx.clip();
    HZ.forEach(([fx, fy, rx, ry, label, t0], i) => {
      const p = eOutCubic(inv(t0, t0 + .7, t)); if (p <= 0) return;
      const [cx, cy] = P(fx, fy), RX = rx * dw, RY = ry * dh;
      const pts = circlePts(0, 0, 1, 60, -1.2, -1.2 + TAU * 1.06, .06, i * 7).map(([x, y]) => [cx + x * RX, cy + y * RY]);
      ctx.strokeStyle = RED; ctx.lineWidth = 7 * u; ctx.lineCap = 'round';
      drawPartial(ctx, pts, p); ctx.stroke();
      const lp = eOutBack(inv(t0 + .4, t0 + .8, t));
      if (lp > 0) {
        ctx.font = `700 ${(LAND ? 28 : 30) * u}px 'Noto Sans SC'`;
        const tw = ctx.measureText(label).width + 40 * u, th = 54 * u;
        let tx = clamp(cx - tw / 2, IX + 20 * u, IX + IW - tw - 20 * u), ty = cy - RY - th - 18 * u;
        ctx.save(); ctx.translate(tx + tw / 2, ty + th / 2); ctx.scale(lp, lp);
        ctx.fillStyle = RED; rr(ctx, -tw / 2, -th / 2, tw, th, 12 * u); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 2 * u);
        ctx.restore();
      }
    });
    ctx.restore();
    // 开场标题
    const tp = eOutCubic(inv(.1, .7, t)) * (1 - inv(s.h1 - .4, s.h1, t));
    if (tp > 0) {
      ctx.globalAlpha = tp;
      const bx = LAND ? 70 * u : W / 2, by = LAND ? 120 * u : IY + IH * .2;
      ctx.textAlign = LAND ? 'left' : 'center'; ctx.fillStyle = INK;
      ctx.font = `400 ${(LAND ? 30 : 34) * u}px 'Bebas Neue'`; ctx.fillText('SAFETY DRILL · 03', bx, by - 70 * u);
      ctx.font = `900 ${(LAND ? 72 : 80) * u}px 'Noto Sans SC'`; ctx.fillText('找一找：两处隐患', bx, by + 10 * u);
      ctx.globalAlpha = 1;
    }
    // 选择题卡
    const qp = eOutCubic(inv(s.q - .2, s.q + .4, t)) * (1 - inv(12.2, 12.6, t));
    if (qp > 0) {
      const cw = LAND ? W * .4 : W - 100 * u, cx = LAND ? 60 * u : 50 * u, cy = LAND ? 60 * u : IY + IH + 60 * u;
      const ch = (LAND ? 330 : 400) * u;
      ctx.save(); ctx.globalAlpha = qp; ctx.translate(0, (1 - qp) * 30 * u);
      ctx.shadowColor = 'rgba(20,30,45,.25)'; ctx.shadowBlur = 30 * u; ctx.fillStyle = '#fff'; rr(ctx, cx, cy, cw, ch, 20 * u); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = AMB; rr(ctx, cx + 28 * u, cy + 26 * u, 110 * u, 40 * u, 20 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${22 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText('选择题', cx + 83 * u, cy + 54 * u);
      ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.font = `700 ${(LAND ? 34 : 40) * u}px 'Noto Sans SC'`;
      ctx.fillText('电线横在过道上，怎么办？', cx + 28 * u, cy + (LAND ? 118 : 128) * u);
      const opts = [['A', '直接跨过去'], ['B', '报告行政，用线槽收好']];
      opts.forEach(([key, txt], i) => {
        const oy = cy + (LAND ? 150 : 170) * u + i * (LAND ? 80 : 100) * u, oh = (LAND ? 64 : 80) * u;
        const pick = i === 0 ? inv(s.x, s.x + .2, t) : 0, wrong = i === 0 && t >= s.no, right = i === 1 && t >= s.ok;
        const shake = wrong ? Math.sin((t - s.no) * 50) * 10 * u * Math.max(0, 1 - (t - s.no) / .5) : 0;
        ctx.save(); ctx.translate(shake, 0);
        ctx.fillStyle = right ? 'rgba(47,163,107,.14)' : wrong ? 'rgba(229,72,77,.12)' : pick ? 'rgba(245,165,36,.14)' : '#f1f4f8';
        rr(ctx, cx + 28 * u, oy, cw - 56 * u, oh, 14 * u); ctx.fill();
        ctx.strokeStyle = right ? GREEN : wrong ? RED : pick ? AMB : 'rgba(0,0,0,0)'; ctx.lineWidth = 4 * u; ctx.stroke();
        ctx.fillStyle = right ? GREEN : wrong ? RED : INK; ctx.font = `700 ${(LAND ? 28 : 32) * u}px 'Noto Sans SC'`;
        ctx.fillText(`${key}  ${txt}`, cx + 54 * u, oy + oh / 2 + 11 * u);
        const mx = cx + cw - 80 * u, my = oy + oh / 2;
        if (wrong) {                                       // 叉
          const d = 13 * u; ctx.strokeStyle = RED; ctx.lineWidth = 6 * u; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(mx - d, my - d); ctx.lineTo(mx + d, my + d); ctx.moveTo(mx + d, my - d); ctx.lineTo(mx - d, my + d); ctx.stroke();
        }
        if (right) {                                       // 勾，一笔画出
          ctx.strokeStyle = GREEN; ctx.lineWidth = 7 * u; ctx.lineCap = ctx.lineJoin = 'round';
          drawPartial(ctx, [[mx - 16 * u, my], [mx - 4 * u, my + 12 * u], [mx + 18 * u, my - 14 * u]], eOutCubic(inv(s.ok, s.ok + .35, t))); ctx.stroke();
        }
        ctx.restore();
      });
      ctx.restore();
    }
    // 滑块和落版
    if (wp > 0 && wp < 1) {
      ctx.fillStyle = '#fff'; ctx.fillRect(wx - 3 * u, IY, 6 * u, IH);
      ctx.beginPath(); ctx.arc(wx, IY + IH / 2, 24 * u, 0, TAU); ctx.fill();
    }
    const fp = eOutBack(inv(13.2, 13.7, t));
    if (fp > 0) {
      const bx = LAND ? W / 2 : W / 2, by = LAND ? H * .16 : IY + IH + 200 * u;
      ctx.save(); ctx.translate(bx, by); ctx.scale(fp, fp);
      ctx.font = `900 ${(LAND ? 56 : 64) * u}px 'Noto Sans SC'`;
      const tw = ctx.measureText('整改完成').width + 120 * u, th = 100 * u;
      ctx.fillStyle = GREEN; rr(ctx, -tw / 2, -th / 2, tw, th, 50 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓ 整改完成', 0, 4 * u);
      ctx.restore();
    }
    // 字幕
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, { size: LAND ? 38 : 42, y: LAND ? H - 60 * u : H - 150 * u, bg: 'rgba(20,28,40,.78)' });
    ctx.font = `400 ${(LAND ? 17 : 15) * u}px 'Noto Sans SC'`; ctx.fillStyle = LAND ? 'rgba(255,255,255,.75)' : 'rgba(29,39,51,.5)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 24 * u, H - 18 * u);
  }
});
