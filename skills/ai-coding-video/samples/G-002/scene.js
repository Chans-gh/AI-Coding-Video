// G-002 虚拟主播口播：AI 生成的原创卡通主播定妆照当首帧，生成一段说话的视频；代码排成演播室版面——主播一侧，另一侧随旁白逐条弹出问题卡和要点卡、关键词高亮，底部字幕，角落节目名牌。视频只有 10 秒，后半段跳切回前面并推近一档
// 素材：生图、生视频、语音合成；配乐 CC0。要点卡的时刻用 cueTime 从旁白的逐字时间里取
scene({
  id: 'G-002', name: '虚拟主播口播', dur: 15, still: 11.5,
  fonts: ["700 40px 'Noto Sans SC'", "900 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'Bebas Neue'"],
  text: '小蓝一分钟为什么起降时要打开遮光板眼睛提前适应外面的光线乘务员第一时间看清窗外大家好我是两个原因画面生成旁白合成配乐',
  async init() {
    const A = await loadAssets();
    const T = k => cueTime(A, k, 99);
    return { A, v: await loadVideo('talk.mp4'), tq: T('为什么'), t1: T('一是'), t2: T('二是'), tr: T('两个原因') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, BLUE = '#2f7cf6', INK = '#10213f';
    // 视频时间：9.8 秒后跳回 2.5 秒接着放（像口播剪掉一口气），同时推近一档
    const jump = t >= 9.8, vt = jump ? t - 9.8 + 2.5 : t;
    await s.v.at(Math.min(vt, s.v.dur - .05));
    ctx.fillStyle = '#e9f1ff'; ctx.fillRect(0, 0, W, H);
    const zoom = jump ? 1.18 : 1.0;
    let card;                                       // 要点卡放在哪
    if (LAND) {
      // 背景：浅色网格
      ctx.strokeStyle = 'rgba(47,124,246,.12)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 48 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 48 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      const fx = W * .58, fy = H * .07, fw = W * .36, fh = H * .86;
      ctx.save(); rr(ctx, fx, fy, fw, fh, 28 * u); ctx.shadowColor = 'rgba(16,33,63,.25)'; ctx.shadowBlur = 40 * u; ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
      drawCover(ctx, s.v.el, fx, fy, fw, fh, { zoom, fy: .35 }); ctx.restore();
      card = { x: W * .06, y: H * .3, w: W * .46 };
    } else {
      drawCover(ctx, s.v.el, 0, 0, W, H, { zoom, fy: .3 });
      const g = ctx.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(10,20,40,0)'); g.addColorStop(1, 'rgba(10,20,40,.75)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      card = { x: W * .07, y: H * .5, w: W * .86 };
    }
    // 节目名牌
    const nb = eOutCubic(inv(.1, .7, t));
    ctx.save(); ctx.translate(lerp(-300 * u, 0, nb), 0);
    rr(ctx, 40 * u, 40 * u, 290 * u, 70 * u, 35 * u); ctx.fillStyle = BLUE; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `900 ${34 * u}px 'Noto Sans SC'`; ctx.textBaseline = 'middle'; ctx.fillText('小蓝一分钟', 70 * u, 76 * u);
    ctx.beginPath(); ctx.arc(300 * u, 75 * u, 8 * u, 0, Math.PI * 2); ctx.fillStyle = (t * 2 % 1) < .5 ? '#ff5a5a' : '#fff'; ctx.fill();
    ctx.restore();
    // 问题卡
    const q = eOutBack(inv(s.tq, s.tq + .5, t));
    let y = card.y;
    if (q > 0) {
      ctx.save(); ctx.translate(card.x, y); ctx.scale(1, q);
      ctx.font = `900 ${(LAND ? 60 : 64) * u}px 'Noto Sans SC'`;
      const lines = wrapCJK(ctx, '为什么起降时要打开遮光板？', card.w - 60 * u), lh = (LAND ? 78 : 84) * u, h = lines.length * lh + 50 * u;
      rr(ctx, 0, 0, card.w, h, 24 * u); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(16,33,63,.2)'; ctx.shadowBlur = 24 * u; ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.fillStyle = INK; ctx.textBaseline = 'top';
      lines.forEach((l, i) => ctx.fillText(l, 30 * u, 28 * u + i * lh));
      // 高亮「遮光板」
      const hl = smooth(s.tq + .8, s.tq + 1.3, t);
      if (hl > 0) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,214,0,.8)';
        const last = lines[lines.length - 1], i0 = last.indexOf('遮光板');
        if (i0 >= 0) { const x0 = 30 * u + ctx.measureText(last.slice(0, i0)).width, w0 = ctx.measureText('遮光板').width;
          ctx.fillRect(x0, 28 * u + (lines.length - 1) * lh + lh * .45, w0 * hl, lh * .4); } }
      ctx.restore();
      y += h + 30 * u;
    }
    // 要点卡
    [[s.t1, '1', '让眼睛提前适应外面的光线'], [s.t2, '2', '有情况时，乘务员能第一时间看清窗外']].forEach(([tt, n, txt]) => {
      const k = eOutCubic(inv(tt, tt + .45, t));
      if (k <= 0) return;
      ctx.save(); ctx.globalAlpha = k; ctx.translate(lerp(-60 * u, 0, k), 0);
      ctx.font = `700 ${(LAND ? 40 : 44) * u}px 'Noto Sans SC'`;
      const lines = wrapCJK(ctx, txt, card.w - 140 * u), lh = 56 * u, h = Math.max(100 * u, lines.length * lh + 40 * u);
      rr(ctx, card.x, y, card.w, h, 20 * u); ctx.fillStyle = INK; ctx.fill();
      ctx.beginPath(); ctx.arc(card.x + 56 * u, y + h / 2, 32 * u, 0, Math.PI * 2); ctx.fillStyle = BLUE; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `400 ${46 * u}px 'Bebas Neue'`; ctx.fillText(n, card.x + 56 * u, y + h / 2 + 2 * u);
      ctx.textAlign = 'left'; ctx.font = `700 ${(LAND ? 40 : 44) * u}px 'Noto Sans SC'`;
      lines.forEach((l, i) => ctx.fillText(l, card.x + 110 * u, y + h / 2 + (i - (lines.length - 1) / 2) * lh));
      ctx.restore();
      y += h + 20 * u;
    });
    // 字幕、署名
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, LAND ? { size: 34, bg: 'rgba(16,33,63,.85)', x: W * .29, maxW: W * .5, y: H - 70 * u } : { size: 42, bg: 'rgba(16,33,63,.85)', y: H - 120 * u });
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = LAND ? 'rgba(16,33,63,.55)' : 'rgba(255,255,255,.6)'; ctx.textAlign = 'right';
    ctx.fillText('原创卡通形象 · ' + credits(s.A), W - 28 * u, H - 20 * u); ctx.restore();
  },
});
