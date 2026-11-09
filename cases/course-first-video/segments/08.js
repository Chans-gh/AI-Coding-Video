// 第 8 段 小结：三条要点卡跟着「一、二、三」逐张弹出，每张标出处；再是「最常见的错」和「课后练习」两张卡。
scene({
  id: 'course-first-video:8', name: '小结',
  needs: ['common.js'],
  fonts: L.FONTS,
  async init() { await L.init(); return {}; },
  draw(ctx, t) {
    const { u, K, F } = L;
    L.bg(ctx);
    L.title(ctx, '三条要点', 80 * u, 170 * u, 64, { alpha: L.fadeIn(t - .2) });
    const pts = [
      ['分清三类画面', '代码画的 C · 真实素材 T · AI 生成 G', 'SKILL.md「三类」', '一，'],
      ['先跑通样片，一次只改一处', '拷现成样片 → 原样跑通 → 换内容', 'making.md「改的顺序」', '二，'],
      ['细调最多三轮，先出完整的片子', '不停在半成品，还想改的列出来', 'making.md「改的顺序」第 4 条', '三，'],
    ];
    const tErr = L.cue('最常见的错'), tHw = L.cue('课后练习'), shrink = eInOutCubic(inv(tErr - .5, tErr + .2, t));
    pts.forEach(([a, b, src, kw], i) => {
      const p = t - L.cue(kw); if (p < 0) return;
      const w = lerp(1760, 560, shrink) * u, h = lerp(170, 300, shrink) * u;
      const x = lerp(80 * u, 80 * u + i * 600 * u, shrink), y = lerp(230 * u + i * 200 * u, 230 * u, shrink), e = L.pop(p);
      ctx.save(); ctx.globalAlpha = clamp(p / .25); ctx.translate(x, y + (1 - e) * 30 * u);
      L.card(ctx, 0, 0, w, h, { edge: [K.C, K.T, K.G][i] });
      ctx.fillStyle = [K.C, K.T, K.G][i]; ctx.font = F(900, 64); ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), 44 * u, 70 * u);
      ctx.fillStyle = K.ink; ctx.font = F(900, shrink > .5 ? 34 : 44);
      const lines = shrink > .5 ? wrapCJK(ctx, a, w - 150 * u) : [a];
      lines.forEach((l, j) => ctx.fillText(l, 120 * u, 62 * u + j * 46 * u));
      ctx.fillStyle = K.soft; ctx.font = F(400, 26);
      const by = shrink > .5 ? 80 * u + lines.length * 46 * u : 118 * u;
      (shrink > .5 ? wrapCJK(ctx, b, w - 150 * u) : [b]).forEach((l, j) => ctx.fillText(l, 120 * u, by + j * 36 * u));
      ctx.font = F(400, 22, L.MONO); ctx.fillStyle = K.gray; ctx.textAlign = 'right'; ctx.fillText('出处：' + src, w - 30 * u, h - 30 * u); ctx.textAlign = 'left';
      ctx.restore();
    });
    // 最常见的错
    if (t > tErr) {
      const e = L.pop(t - tErr);
      ctx.save(); ctx.globalAlpha = clamp((t - tErr) / .25); ctx.translate(80 * u, 580 * u + (1 - e) * 30 * u);
      L.card(ctx, 0, 0, 860 * u, 330 * u, { fill: '#FFF4E5', edge: K.G });
      ctx.fillStyle = K.G; ctx.font = F(900, 40); ctx.textBaseline = 'middle'; ctx.fillText('最常见的错', 50 * u, 60 * u);
      ctx.fillStyle = K.ink; ctx.font = F(700, 32); ctx.fillText('✗  第一次装依赖时没联网', 50 * u, 140 * u);
      ctx.fillStyle = K.soft; ctx.font = F(400, 28); ctx.fillText('npm install 要下载 317 个包', 100 * u, 188 * u);
      ctx.fillStyle = K.ink; ctx.font = F(700, 32); ctx.fillText('○  15 秒片子报「时长不在 3–5 秒」', 50 * u, 256 * u);
      ctx.fillStyle = K.soft; ctx.font = F(400, 28); ctx.fillText('样片的时长规矩，可以不管', 100 * u, 300 * u);
      ctx.restore();
    }
    // 课后练习
    if (t > tHw) {
      const e = L.pop(t - tHw);
      ctx.save(); ctx.globalAlpha = clamp((t - tHw) / .25); ctx.translate(980 * u, 580 * u + (1 - e) * 30 * u);
      L.card(ctx, 0, 0, 860 * u, 330 * u, { edge: K.C });
      ctx.fillStyle = K.C; ctx.font = F(900, 40); ctx.textBaseline = 'middle'; ctx.fillText('课后练习', 50 * u, 60 * u);
      ctx.fillStyle = K.ink; ctx.font = F(700, 32);
      ctx.fillText('把水循环短片', 50 * u, 140 * u);
      ctx.fillText('· 换一种风格，或', 80 * u, 200 * u);
      ctx.fillText('· 换一个主题', 80 * u, 256 * u);
      ctx.fillStyle = K.soft; ctx.font = F(400, 28); ctx.fillText('再出一次', 50 * u, 304 * u);
      ctx.restore();
    }
    L.frame(ctx, t);
    L.sub(ctx, t);
  }
});
