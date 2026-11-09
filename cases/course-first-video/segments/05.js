// 第 5 段 装 Skill、选风格：先是动手前的清单；再是终端里两行安装命令，输出是本次实测的原样；
// 最后放介绍页的录屏（本仓库的介绍页，实录），镜头跟着鼠标放大，点击处出波纹；录屏的时间按旁白对齐（分段线性映射）。
const OUT1 = '√ Successfully added marketplace: ai-coding-video (declared in user settings)';
const OUT2 = '√ Successfully installed plugin: ai-coding-video@ai-coding-video (scope: user)';
scene({
  id: 'course-first-video:5', name: '装 Skill、选风格',
  needs: ['common.js'],
  fonts: L.FONTS,
  async init() {
    await L.init();
    return { R: await loadVideo('rec.mp4'), track: JSON.parse(await xhr(asset('rec-track.json'))) };
  },
  async draw(ctx, t, s) {
    const { u, K, F } = L;
    L.bg(ctx);
    const tTerm = L.cue('以 Claude Code'), tRec = L.cue('接着打开介绍页'), tPick = L.cue('C-038');
    // ---- 清单 ----
    const outA = 1 - smooth(tTerm - .4, tTerm, t);
    if (outA > 0) {
      ctx.save(); ctx.globalAlpha = outA;
      L.title(ctx, '动手之前', 160 * u, 240 * u, 64);
      const need = [['Node.js 18 以上', 'node -v'], ['Python 3', 'python3 --version'], ['ffmpeg', 'ffmpeg -version'], ['第一次安装依赖要联网', 'npm install']];
      const at = [L.cue('Node.js'), L.cue('Python'), L.cue('ffmpeg'), L.cue('联网')];
      need.forEach(([a, b], i) => {
        const p = t - at[i] + .2; if (p < 0) return;
        const y = 300 * u + i * 150 * u;
        ctx.save(); ctx.globalAlpha *= clamp(p / .3);
        L.card(ctx, 160 * u, y, 1000 * u, 120 * u, { edge: i === 3 ? K.G : K.C });
        ctx.strokeStyle = i === 3 ? K.G : K.T; ctx.lineWidth = 8 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const q = clamp((p - .2) / .3); ctx.beginPath(); ctx.moveTo(210 * u, y + 62 * u); ctx.lineTo(210 * u + 16 * u * Math.min(1, q * 2), y + 62 * u + 16 * u * Math.min(1, q * 2));
        if (q > .5) ctx.lineTo(226 * u + 30 * u * (q - .5) * 2, y + 78 * u - 34 * u * (q - .5) * 2); ctx.stroke();
        ctx.fillStyle = K.ink; ctx.font = F(900, 42); ctx.textBaseline = 'middle'; ctx.fillText(a, 290 * u, y + 62 * u);
        ctx.fillStyle = K.soft; ctx.font = F(400, 28, L.MONO); ctx.textAlign = 'right'; ctx.fillText(b, 1120 * u, y + 62 * u); ctx.textAlign = 'left';
        ctx.restore();
      });
      ctx.restore();
    }
    // ---- 终端 ----
    const termA = smooth(tTerm - .4, tTerm, t) * (1 - smooth(tRec - .5, tRec, t));
    if (termA > 0) {
      const c1 = L.cue('第一行'), c2 = L.cue('第二行'), ok = L.cue('Successfully');
      const rows = [
        { at: tTerm + .2, k: 'out', text: '# 以 Claude Code 为例' },
        { at: c1, k: 'cmd', text: 'claude plugin marketplace add chans-gh/AI-Coding-Video', cps: 34 },
        { at: c1 + 1.9, k: 'out', text: 'Adding marketplace…' },
        { at: c1 + 2.4, k: 'ok', text: OUT1 },
        { at: c2, k: 'cmd', text: 'claude plugin install ai-coding-video@ai-coding-video', cps: 34 },
        { at: c2 + 1.8, k: 'out', text: 'Installing plugin "ai-coding-video@ai-coding-video"...' },
        { at: Math.max(c2 + 2.4, ok - .2), k: 'ok', text: OUT2, hl: 'Successfully installed plugin' },
      ];
      ctx.save(); ctx.globalAlpha = termA;
      L.term(ctx, t, 120 * u, 140 * u, W - 240 * u, 640 * u, rows, { fs: 28, lh: 52 });
      const tOther = L.cue('用 Codex');
      if (t > tOther) { ctx.globalAlpha *= L.fadeIn(t - tOther);
        L.card(ctx, 120 * u, 830 * u, W - 240 * u, 100 * u);
        ctx.fillStyle = K.ink; ctx.font = F(700, 34); ctx.textBaseline = 'middle'; ctx.fillText('用 Codex 或别的助手：装法见仓库 README 的「安装」', 170 * u, 880 * u); }
      ctx.restore();
    }
    // ---- 介绍页录屏 ----
    const recA = smooth(tRec - .5, tRec, t);
    if (recA > 0) {
      // 录屏时间按旁白对齐：说到「纯代码」点纯代码，说到「信息讲解」点题材，说到「C-038」点开样片
      const key = [[tRec, 1.2], [L.cue('纯代码'), 8.13], [L.cue('信息讲解'), 10.63], [tPick, 19.93], [tPick + 30, 49.93]];
      let rt = key[0][1];
      for (let i = 0; i < key.length - 1; i++) if (t >= key[i][0]) rt = lerp(key[i][1], key[i + 1][1], inv(key[i][0], key[i + 1][0], t));
      rt = Math.min(rt, s.R.dur - .05);
      const at = q => { const tr = s.track; let i = 0; while (i < tr.length - 1 && tr[i + 1][0] <= q) i++; return tr[i]; };
      let fx = 0, fy = 0, n = 0;                                   // 镜头焦点：前后 1 秒的鼠标平均位置
      for (let d = -1; d <= 1; d += .1) { const p = at(rt + d); fx += p[1]; fy += p[2]; n++; }
      fx /= n; fy /= n;
      const el = await s.R.at(rt), cur = at(rt);
      const x = 120 * u, y = 110 * u, w = W - 240 * u, h = w * 9 / 16 > H - 190 * u ? H - 190 * u : w * 9 / 16, ww = h * 16 / 9, xx = (W - ww) / 2;
      const z = lerp(1, 1.45, smooth(tRec + .8, tRec + 2, t));
      ctx.save(); ctx.globalAlpha = recA;
      L.card(ctx, xx, y, ww, h, { r: 12 });
      ctx.save(); rr(ctx, xx, y, ww, h, 12 * u); ctx.clip(); drawCover(ctx, el, xx, y, ww, h, { zoom: z, fx, fy }); ctx.restore();
      const dw = ww * z, dh = h * z, cx = xx + (ww - dw) * fx + dw * cur[1], cy = y + (h - dh) * fy + dh * cur[2];
      for (const c of s.track) if (c[3] && rt >= c[0] && rt < c[0] + .8) L.ripple(ctx, cx, cy, (rt - c[0]) / .8);
      if (rt > 1.8) L.cursor(ctx, cx, cy);
      L.chip(ctx, 'T', xx + 20 * u, y + 20 * u, { label: '录屏 · 本仓库的介绍页', s: .9 });
      ctx.restore();
    }
    L.frame(ctx, t);
    L.sub(ctx, t);
  }
});
