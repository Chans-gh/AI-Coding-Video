// 第 2 段 讲师开场：生成的讲师视频铺右侧（先正放，再来回慢放），左侧三个学习目标跟着旁白「第一、第二、第三」逐条弹出。
scene({
  id: 'course-first-video:2', name: '讲师开场',
  needs: ['common.js'],
  fonts: ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() { await L.init(); return { V: await loadVideo('host1.mp4') }; },
  async draw(ctx, t, s) {
    const { u, K, F } = L, d = s.V.dur - .05;
    // 讲师：正放一遍，之后以 0.5 倍速来回放（每帧只由 t 决定）
    const m = t < d ? t : (() => { const q = ((t - d) * .5) % (2 * d); return q < d ? d - q : q - d; })();
    const el = await s.V.at(m);
    L.bg(ctx);
    const slide = eInOutCubic(inv(L.say(2) - .6, L.say(2) + .4, t));
    const vx = lerp(0, W * .42, slide), vw = lerp(W, W * .58, slide);
    drawCover(ctx, el, vx, 0, vw, H, { fx: .5 });
    ctx.save(); ctx.globalAlpha = smooth(.6, 1.2, t);
    L.chip(ctx, 'G', vx + vw - 380 * u, 92 * u, { label: 'AI 生成的虚拟讲师' }); ctx.restore();
    // 学习目标
    if (slide > 0) {
      ctx.save(); ctx.globalAlpha = slide;
      L.title(ctx, '这节课学三件事', 80 * u, 250 * u, 64);
      const goals = [['装上 Skill', 'AI Coding Video'], ['选一种风格', '在介绍页按题材找'], ['让 AI 助手写代码出片', '你的第一条 15 秒短片']];
      const at = [L.cue('第一'), L.cue('第二'), L.cue('第三')];
      goals.forEach(([a, b], i) => {
        const p = t - at[i]; if (p < 0) return;
        const y = 330 * u + i * 190 * u, e = L.pop(p);
        ctx.save(); ctx.translate(80 * u, y); ctx.scale(lerp(.85, 1, e), lerp(.85, 1, e)); ctx.globalAlpha *= clamp(p / .25);
        L.card(ctx, 0, 0, 700 * u, 160 * u, { edge: K.C });
        ctx.fillStyle = K.C; ctx.font = F(900, 64); ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), 44 * u, 80 * u);
        ctx.fillStyle = K.ink; ctx.font = F(900, 44); ctx.fillText(a, 120 * u, 62 * u);
        ctx.fillStyle = K.soft; ctx.font = F(400, 30); ctx.fillText(b, 120 * u, 112 * u);
        ctx.restore();
      });
      ctx.restore();
    }
    L.frame(ctx, t, { dark: slide < .5 });
    L.sub(ctx, t);
  }
});
