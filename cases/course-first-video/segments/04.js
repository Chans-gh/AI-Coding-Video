// 第 4 段 讲义：Skill 自带的出样片指南（making.md）按文档页的样子排出来，原文从仓库读，不另写；
// 旁白说到「第一、第二、第三、第四」，荧光笔依次划过对应一条；最后叠一张 SKILL.md 里「提示词只定方向」那一句。
// 右下角一直挂讲师的圆形画中画（G 类生视频，讲师第 1 段来回慢放）。
const DOC = '../../skills/ai-coding-video/';
scene({
  id: 'course-first-video:4', name: '讲义',
  needs: ['common.js'],
  fonts: ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() {
    const md = await xhr(`${DIR}/${DOC}making.md`), sk = await xhr(`${DIR}/${DOC}SKILL.md`);
    const a = md.indexOf('**改的顺序**'), b = md.indexOf('**哪些照用');
    const items = md.slice(a, b).trim().split('\n').filter(Boolean);
    const tip = sk.split('\n').find(l => l.includes('提示词只定方向')).replace(/^- /, '');
    const clean = s => s.replace(/\*\*/g, '').replace(/`/g, '');
    await L.init(items.map(clean).join('') + clean(tip) + 'making.mdSKILL.md');
    return { V: await loadVideo('host1.mp4'), head: clean(items[0]), steps: items.slice(1).map(l => clean(l).replace(/^\d+\.\s*/, '')), tip: clean(tip).split('。')[0] + '。' };
  },
  async draw(ctx, t, s) {
    const { u, K, F } = L;
    L.bg(ctx);
    // 文档页：浏览器式外框 + 文件路径
    const scroll = 0, px = 160 * u, py = 110 * u, pw = W - 320 * u, ph = H - 240 * u;
    const inA = L.fadeIn(t - .1, .5);
    ctx.save(); ctx.globalAlpha = inA; ctx.translate(0, (1 - eOutCubic(inA)) * 40 * u);
    L.card(ctx, px, py, pw, ph, { r: 14 });
    ctx.fillStyle = '#EEF0F3'; rr(ctx, px, py, pw, 64 * u, 14 * u); ctx.fill(); ctx.fillRect(px, py + 40 * u, pw, 24 * u);
    [K.red, K.yellow, K.green].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px + 34 * u + i * 30 * u, py + 32 * u, 9 * u, 0, TAU); ctx.fill(); });
    ctx.fillStyle = K.soft; ctx.font = F(400, 24, L.MONO); ctx.textBaseline = 'middle'; ctx.fillText('skills/ai-coding-video/making.md · 1 级：样片', px + 140 * u, py + 33 * u);
    L.chip(ctx, 'T', px + pw - 330 * u, py + 9 * u, { label: '本仓库的讲义 · 原文', s: .9 });
    // 正文
    const x0 = px + 70 * u, mw = pw - 140 * u;
    ctx.fillStyle = K.ink; ctx.font = F(900, 48); ctx.textBaseline = 'alphabetic';
    ctx.fillText(s.head, x0, py + 150 * u - scroll);
    const at = ['第一', '第二', '第三', '第四'].map(k => L.cue(k));
    let y = py + 230 * u;
    s.steps.forEach((txt, i) => {
      ctx.font = F(400, 36);
      const lines = wrapCJK(ctx, txt, mw - 70 * u).slice(0, i === 3 ? 4 : 2), lh = 54 * u;
      const p = eOutCubic(clamp((t - at[i]) / .6)), past = t > (at[i + 1] ?? L.cue('提示词只定方向'));
      // 荧光笔：逐行划过
      if (p > 0) lines.forEach((l, j) => {
        const lw = ctx.measureText(l).width, q = clamp(p * lines.length - j);
        ctx.fillStyle = past ? 'rgba(255,224,102,.45)' : K.hi; ctx.fillRect(x0 + 60 * u - 6 * u, y + j * lh - 38 * u, (lw + 12 * u) * q, 50 * u);
      });
      ctx.fillStyle = p > 0 ? K.C : K.soft; ctx.font = F(900, 38); ctx.fillText(`${i + 1}.`, x0, y);
      ctx.fillStyle = K.ink; ctx.font = F(400, 36);
      lines.forEach((l, j) => ctx.fillText(l, x0 + 60 * u, y + j * lh));
      y += lines.length * lh + 34 * u;
    });
    ctx.restore();
    // SKILL.md 里的一句
    const tt = L.cue('提示词只定方向');
    if (t > tt - .2) {
      const e = L.pop(t - tt + .2);
      ctx.save(); ctx.globalAlpha = clamp((t - tt + .2) / .3); ctx.fillStyle = 'rgba(245,242,234,.6)'; ctx.fillRect(0, 0, W, H);
      ctx.translate(W / 2, H * .5); ctx.scale(lerp(.9, 1, e), lerp(.9, 1, e));
      L.card(ctx, -720 * u, -150 * u, 1440 * u, 300 * u, { edge: K.G });
      ctx.fillStyle = K.soft; ctx.font = F(400, 24, L.MONO); ctx.textBaseline = 'middle'; ctx.fillText('skills/ai-coding-video/SKILL.md', -660 * u, -100 * u);
      ctx.fillStyle = K.ink; ctx.font = F(900, 40);
      wrapCJK(ctx, s.tip, 1300 * u).slice(0, 2).forEach((l, j) => ctx.fillText(l, -660 * u, -30 * u + j * 60 * u));
      ctx.fillStyle = K.G; ctx.font = F(900, 40); ctx.fillText('要稳，就从样片代码改', -660 * u, 100 * u);
      ctx.restore();
    }
    // 讲师画中画：0.5 倍速来回放
    const d = s.V.dur - .05, q = (t * .5 + 2) % (2 * d), el = await s.V.at(q < d ? q : 2 * d - q);
    const e = L.pop(t - .6), r = 130 * u * lerp(.6, 1, e), cx = W - 150 * u, cy = H - 300 * u;
    if (t > .6) {
      ctx.save(); ctx.globalAlpha = clamp((t - .6) / .3);
      ctx.fillStyle = 'rgba(20,24,33,.18)'; ctx.beginPath(); ctx.arc(cx + 6 * u, cy + 10 * u, r + 8 * u, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, r + 8 * u, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip(); drawCover(ctx, el, cx - r, cy - r, 2 * r, 2 * r, { zoom: 1.5, fx: .55, fy: .3 }); ctx.restore();
      L.chip(ctx, 'G', cx - 120 * u, cy + r + 18 * u, { label: '讲师 · AI 生成', s: .8 });
      ctx.restore();
    }
    L.frame(ctx, t);
    L.sub(ctx, t);
  }
});
