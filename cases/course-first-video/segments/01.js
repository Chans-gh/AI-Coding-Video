// 第 1 段 先看成品：先放国际空间站拍的真实云海（T 类录像），按旁白标出「蒸发、凝成云、落成雨」；
// 第 3 句开口时斜切进课上做的 15 秒水循环短片（C 类，C-038）；说到「写代码的」左右分屏对照「真实录像 / 代码算出」，说到「五分钟后」压暗出字卡（短片在底下接着放）。
// 短片的起点 = 第 3 句旁白的起点前 0.3 秒，sound.py 用同一个算法摆短片原声。
scene({
  id: 'course-first-video:1', name: '先看成品',
  needs: ['common.js'],
  fonts: ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() { await L.init(); return { V: await loadVideo('C-038-16x9.mp4'), R: await loadVideo('iss.mp4') }; },
  async draw(ctx, t, s) {
    const { u, K, F } = L;
    const tS = SEG.vo[2].at - .3, tSp = L.cue('写代码的') - .3, tC = L.cue('五分钟后') - .3;   // 短片起点、分屏、字卡
    const wipe = eInOutCubic(inv(tS, tS + .8, t)), split = eInOutCubic(inv(tSp, tSp + .8, t)), card = smooth(tC, tC + .6, t);
    const real = await s.R.at(t % (s.R.dur - .05));
    const code = await s.V.at(clamp(t - tS, 0, s.V.dur - .05));
    // 底层：真实录像，慢推
    if (wipe < 1 || split > 0) {
      const z = 1.06 + .04 * Math.min(t, tS) / tS;
      if (split > 0) {                                                  // 分屏：左边真实录像
        const w = lerp(W, W / 2, split);
        drawCover(ctx, real, 0, 0, w, H, { zoom: z });
      } else drawCover(ctx, real, 0, 0, W, H, { zoom: z });
    }
    // 上层：短片，从右上角斜切进来
    if (wipe > 0) {
      ctx.save();
      if (wipe < 1) { const d = wipe * (W + H) * 1.05; ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W - d, 0); ctx.lineTo(W - d + H, H); ctx.lineTo(W, H); ctx.closePath(); ctx.clip(); }
      const x = split > 0 ? lerp(0, W / 2, split) : 0;
      drawCover(ctx, code, x, 0, W - x, H);
      ctx.restore();
      if (split > 0) { ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - 3 * u, 0, 6 * u, H * split); }
    }
    // 角标
    const tag = (k, label, x, a) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; L.chip(ctx, k, x, 90 * u, { label }); ctx.restore(); };
    tag('T', '真实录像 · NASA 国际空间站 · 2025 年飓风 Erin', 60 * u, smooth(.3, .9, t) * (1 - wipe) + split * (1 - card));
    tag('C', '代码算出 · 课上做的成片 · C-038 科普扁平', split > 0 ? W / 2 + 60 * u : 60 * u, smooth(tS + .6, tS + 1.2, t) * (1 - smooth(tS + 5, tS + 5.6, t)) + split * (1 - card));
    // 录像上按旁白标出三步
    if (wipe < 1) {
      [['蒸发', '蒸发', .30, .62], ['凝成云', '凝成云', .52, .34], ['落成雨', '落成雨', .74, .55]].forEach(([key, txt, fx, fy]) => {
        const a = L.cue(key), p = t - a; if (p < 0) return;
        ctx.save(); ctx.globalAlpha = clamp(p / .3) * (1 - wipe); const x = fx * W, y = fy * H;
        L.ripple(ctx, x, y, p);
        ctx.font = F(700, 40); const w = ctx.measureText(txt).width + 56 * u;
        ctx.fillStyle = 'rgba(255,255,255,.92)'; rr(ctx, x + 24 * u, y - 34 * u, w, 68 * u, 34 * u); ctx.fill();
        ctx.fillStyle = K.ink; ctx.textBaseline = 'middle'; ctx.fillText(txt, x + 52 * u, y + 2 * u); ctx.restore();
      });
    }
    // 结尾字卡
    if (card > 0) {
      ctx.fillStyle = `rgba(16,20,30,${.7 * card})`; ctx.fillRect(0, 0, W, H);
      const a = t - tC - .3;
      L.title(ctx, '5 分钟后', W / 2, H * .42, 120, { align: 'center', color: '#fff', alpha: L.pop(a) });
      L.title(ctx, '你也能做一条', W / 2, H * .42 + 150 * u, 120, { align: 'center', color: K.hi, alpha: L.pop(a - .35) });
      ctx.save(); ctx.globalAlpha = L.fadeIn(a - .9, .5); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = F(400, 32); ctx.textAlign = 'center';
      ctx.fillText('每一帧都由代码算出 · 代码由 AI 编程助手来写', W / 2, H * .42 + 240 * u); ctx.restore();
    }
    L.frame(ctx, t, { dark: true, alpha: smooth(1, 2, t) });
    L.sub(ctx, t);
  }
});
