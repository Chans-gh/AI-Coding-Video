// 第 9 段 讲师收尾：生成的讲师视频（正放一遍再来回慢放）；说到「我是 AI 生成的虚拟讲师」时讲师移到左边，右边出片尾署名。
const CREDITS = [
  ['讲师', 'AI 生成的虚构形象（生图 + 生视频）'],
  ['旁白', 'AI 语音合成 · 公开音色'],
  ['配乐', 'Chill Lofi Inspired · omfgdude · CC0（OpenGameArt）'],
  ['换画风图', 'AI 生成'],
  ['录屏、讲义、代码画面', '本仓库 · MIT'],
  ['水循环四步', '依据 NASA GPM 的水循环介绍'],
];
scene({
  id: 'course-first-video:9', name: '讲师收尾',
  needs: ['common.js'],
  fonts: ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() { await L.init(); return { V: await loadVideo('host2.mp4') }; },
  async draw(ctx, t, s) {
    const { u, K, F } = L, d = s.V.dur - .05;
    const m = t < d ? t : (() => { const q = ((t - d) * .5) % (2 * d); return q < d ? d - q : q - d; })();
    const el = await s.V.at(m);
    L.bg(ctx);
    const tC = L.cue('我是 AI'), slide = eInOutCubic(inv(tC - .6, tC + .3, t));
    const vw = lerp(W, W * .52, slide);
    drawCover(ctx, el, 0, 0, vw, H, { fx: .5 });
    ctx.save(); ctx.globalAlpha = smooth(.4, 1, t); L.chip(ctx, 'G', 60 * u, 92 * u, { label: 'AI 生成的虚拟讲师' }); ctx.restore();
    const tN = L.cue('下一节');
    if (t > tN && slide < 1) {
      ctx.save(); ctx.globalAlpha = L.fadeIn(t - tN) * (1 - slide);
      L.card(ctx, W - 760 * u, 760 * u, 680 * u, 130 * u, { edge: K.T });
      ctx.fillStyle = K.soft; ctx.font = F(400, 28); ctx.textBaseline = 'middle'; ctx.fillText('下一节', W - 710 * u, 800 * u);
      ctx.fillStyle = K.ink; ctx.font = F(900, 40); ctx.fillText('用真实素材做一条 T 类的片子', W - 710 * u, 850 * u);
      ctx.restore();
    }
    if (slide > 0) {
      ctx.save(); ctx.globalAlpha = slide;
      const x = W * .52 + 80 * u;
      L.title(ctx, '零基础用 AI 编程助手做第一条短片', x, 200 * u, 40);
      L.title(ctx, '下节课见', x, 300 * u, 80, { color: K.C });
      CREDITS.forEach(([a, b], i) => {
        const p = t - tC - .4 - i * .15; if (p < 0) return;
        const y = 400 * u + i * 86 * u;
        ctx.save(); ctx.globalAlpha *= clamp(p / .3);
        ctx.fillStyle = K.soft; ctx.font = F(700, 24); ctx.textBaseline = 'middle'; ctx.fillText(a, x, y);
        ctx.fillStyle = K.ink; ctx.font = F(400, 28); ctx.fillText(b, x, y + 36 * u);
        ctx.restore();
      });
      ctx.restore();
    }
    L.frame(ctx, t, { dark: slide < .5 });
    L.sub(ctx, t);
  }
});
