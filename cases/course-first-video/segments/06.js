// 第 6 段 写场景、出片：一个终端从头走到尾，命令和输出都是本次在新目录里实测的原样（时间按旁白对齐）；
// 「给助手的话」是示意，场景由本次会话充当助手写出（见 log.md）。最后右下角小窗放出好的片子。
const CODE = [
  "const P = {",
  "  sky: ['#7FD4FF', '#DFF6FF'],      // 天空：上、下",
  "  sea: ['#2E86DE', '#1B4F9C'],      // 海：近、远",
  "  hill: '#3BB273', sun: '#FFC93C',",
  "  title: '水循环', steps: ['蒸发', '凝结', '降水', '汇流'],",
  "};",
];
const ASK = '用 C-038 科普扁平，做一条 15 秒的横屏短片，讲水循环的四步：蒸发、凝结、降水、汇流，每步一个中文标签';
scene({
  id: 'course-first-video:6', name: '写场景、出片',
  needs: ['common.js'],
  fonts: ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() { await L.init(); return { V: await loadVideo('C-038-16x9.mp4') }; },
  async draw(ctx, t, s) {
    const { u, K, F } = L;
    L.bg(ctx);
    const c = k => L.cue(k);
    const a0 = .3, aRun = c('先原样跑'), aAsk = c('现在跟助手'), aRead = c('助手先读'), aQuick = c('快速预览'), aFull = c('横竖两版'), aTime = c('一分半钟'), aX = c('检查会打'), aDone = c('片子已经出好了');
    const rows = [
      { at: a0, k: 'cmd', text: 'mkdir water-cycle && cd water-cycle' },
      { at: a0 + 2.2, k: 'cmd', text: 'cp -R "$SKILL/samples" video && cd video     # $SKILL：Skill 装在哪' },
      { at: c('npm install') - .8, k: 'cmd', text: 'npm install' },
      { at: c('npm install') + .9, k: 'out', text: 'added 317 packages, and audited 318 packages in 12s' },
      { at: c('npm install') + 1.1, k: 'out', text: 'found 0 vulnerabilities' },
      { at: aRun, k: 'cmd', text: 'python3 batch.py C-031 --quick' },
      { at: c('两行对勾'), k: 'ok', text: '✓ C-031 9x16  3s  动 1.5  声 -14 dB  6s' },
      { at: c('两行对勾') + .3, k: 'ok', text: '✓ C-031 16x9  3s  动 1.8  声 -14 dB  6s' },
      { at: c('通过'), k: 'out', text: '2/2 通过，用时 6s；总览图 → out/sheet.jpg', hl: '2/2 通过' },
      { at: aAsk + .6, k: 'say', text: ASK, cps: 16 },
      { at: aRead, k: 'tool', text: 'Read  C-038/scene.js' },
      { at: aRead + 1.2, k: 'tool', text: 'Write C-038/scene.js   （水循环，85 行）' },
      ...CODE.map((l, i) => ({ at: aRead + 1.6 + i * .3, k: 'code', n: i + 3, text: l })),
      { at: aQuick, k: 'tool', text: 'Bash  python3 batch.py C-038 --quick' },
      { at: aQuick + 1.5, k: 'out', text: '截图：out/C-038-16x9.jpg  out/C-038-9x16.jpg' },
      { at: aFull, k: 'tool', text: 'Bash  python3 batch.py C-038' },
      { at: aX, k: 'bad', text: '✗ C-038 16x9  15s  1.4 MB  动 0.6  声 -17 dB  149s  时长 15s 不在 3–5 秒', hl: '时长 15s 不在 3–5 秒' },
      { at: aX + .3, k: 'bad', text: '✗ C-038 9x16  15s  1.4 MB  动 0.7  声 -17 dB  149s  时长 15s 不在 3–5 秒', hl: '时长 15s 不在 3–5 秒' },
      { at: aX + .6, k: 'out', text: '0/2 通过，用时 149s；总览图 → out/sheet.jpg' },
    ];
    L.term(ctx, t, 80 * u, 100 * u, W - 160 * u, 790 * u, rows, { fs: 26, lh: 44, title: '终端 — water-cycle/video' });
    // 出片进度条（示意：按旁白时长走，不代表真实进度）
    if (t > aFull + .4 && t < aX) {
      const p = inv(aFull + .4, aX, t);
      ctx.fillStyle = K.gray; ctx.font = F(400, 24, L.MONO); ctx.textBaseline = 'middle';
      ctx.fillStyle = K.ink; ctx.fillText('出片中…', 90 * u, 935 * u); ctx.fillStyle = K.line; rr(ctx, 240 * u, 923 * u, 900 * u, 24 * u, 12 * u); ctx.fill();
      ctx.fillStyle = K.T; rr(ctx, 240 * u, 923 * u, 900 * u * p, 24 * u, 12 * u); ctx.fill();
    }
    // 用时卡：两版一起出 149 秒，单出一版 93 秒
    if (t > aTime - .2 && t < aDone) {
      ctx.save(); ctx.globalAlpha = L.fadeIn(t - aTime + .2) * (1 - smooth(aDone - .4, aDone, t));
      L.card(ctx, W - 700 * u, 140 * u, 600 * u, 150 * u, { edge: K.C });
      ctx.fillStyle = K.ink; ctx.font = F(900, 40); ctx.textBaseline = 'middle'; ctx.fillText('单出一版：93 秒', W - 660 * u, 195 * u);
      ctx.fillStyle = K.soft; ctx.font = F(400, 26); ctx.fillText('两版一起出 149 秒 · 本次实测', W - 660 * u, 248 * u);
      ctx.restore();
    }
    // 这个叉可以不管
    if (t > aDone - .3) {
      const e = L.pop(t - aDone + .3);
      ctx.save(); ctx.globalAlpha = clamp((t - aDone + .3) / .3);
      const mw = 640 * u, mh = mw * 9 / 16, mx = W - mw - 110 * u, my = 230 * u - (1 - e) * 40 * u;
      L.card(ctx, mx - 14 * u, my - 70 * u, mw + 28 * u, mh + 84 * u);
      const el = await s.V.at((t - aDone + .3) % (s.V.dur - .05));
      ctx.save(); rr(ctx, mx, my, mw, mh, 10 * u); ctx.clip(); drawCover(ctx, el, mx, my, mw, mh); ctx.restore();
      ctx.fillStyle = K.ink; ctx.font = F(900, 32); ctx.textBaseline = 'middle'; ctx.fillText('片子已经出好了', mx, my - 36 * u);
      L.chip(ctx, 'C', mx + mw - 210 * u, my - 58 * u, { label: '时长叉可不管', s: .85 });
      ctx.restore();
    }
    L.frame(ctx, t);
    L.sub(ctx, t);
  }
});
