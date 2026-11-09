// 第 6 段 写场景、出片：编辑器式分屏（C-044 的代码高亮）——左边文件树，中间 scene.js 逐行写出、关键值高亮，
// 右边先是和助手的对话，跑完快速预览后换成实时预览（课上成片按时间走）；底部小终端里是本次在新目录里实测的命令和输出原样。
// 「给助手的话」是示意，场景由本次会话充当助手写出（见 log.md）。最后切成横竖两版并排：横版一张卡，竖版放进手机样机。
// 课上助手写出的 C-038/scene.js 开头几行（原样，长行在编辑器边上截断）
const CODE = [
  "// 水循环（C-038 科普扁平改写）：平涂渐变的海、山、云，长投影和边缘高光；蒸发、凝结、降水、汇流四步按时间依次亮起",
  "// 改 P 里的一个值，重跑一次，就是新的一版。",
  "const P = {",
  "  sky: ['#7FD4FF', '#DFF6FF'],      // 天空：上、下",
  "  sea: ['#2E86DE', '#1B4F9C'],      // 海：近、远",
  "  hill: '#3BB273', sun: '#FFC93C',",
  "  title: '水循环', steps: ['蒸发', '凝结', '降水', '汇流'],",
  "};",
  "scene({",
  "  id: 'C-038', name: '水循环', dur: 15, still: 13.5,",
  "  draw(ctx, t, s) {",
  "    const u = SHORT / 1080;",
  "    const step = Math.min(3, Math.floor(t / 3.4)), sp = (t % 3.4) / 3.4, allOn = t > 13.6;",
  "    const on = k => allOn || step === k;"
];
const ASK = '用 C-038 科普扁平，做一条 15 秒的横屏短片，讲水循环的四步：蒸发、凝结、降水、汇流，每步一个中文标签';
// 简单的语法高亮：注释、字符串、键名、数字
function hlLine(ctx, txt, x, y, K) {
  const parts = txt.split(/(\/\/.*$|'[^']*'|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_]+(?=\s*:)|\b(?:const|if|return)\b)/);
  let px = x;
  for (const p of parts) {
    if (!p) continue;
    ctx.fillStyle = p.startsWith('//') ? '#6A9955' : p.startsWith("'") ? '#CE9178' : /^\d/.test(p) ? '#B5CEA8' : /^(const|if|return)$/.test(p) ? '#C586C0' : /^[a-zA-Z_]+$/.test(p) && txt.includes(p + ':') ? '#9CDCFE' : '#D4D4D4';
    ctx.fillText(p, px, y); px += ctx.measureText(p).width;
  }
}
scene({
  id: 'course-first-video:6', name: '写场景、出片',
  needs: ['common.js'],
  fonts: ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"],
  async init() { await L.init(ASK + CODE.join('')); return { V: await loadVideo('C-038-16x9.mp4'), P: await loadVideo('C-038-9x16.mp4') }; },
  async draw(ctx, t, s) {
    const { u, K, F } = L;
    L.bg(ctx);
    const c = k => L.cue(k);
    const a0 = .3, aRun = c('先原样跑'), aAsk = c('现在跟助手'), aRead = c('助手先读'), aQuick = c('快速预览'), aFull = c('横竖两版'), aTime = c('一分半钟'), aX = c('检查会打'), aDone = c('片子已经出好了');
    const out = smooth(aDone - .6, aDone + .4, t);                       // 结尾：编辑器让位给横竖两版
    // ---- 编辑器窗口 ----
    if (out < 1) {
      ctx.save(); ctx.globalAlpha = 1 - out;
      const x = 80 * u, y = 100 * u, w = W - 160 * u, h = 800 * u, bar = 46 * u;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, x + 8 * u, y + 14 * u, w, h, 16 * u); ctx.fill();
      ctx.fillStyle = '#1E1E1E'; rr(ctx, x, y, w, h, 16 * u); ctx.fill();
      ctx.fillStyle = '#2D2D30'; rr(ctx, x, y, w, bar, 16 * u); ctx.fill(); ctx.fillRect(x, y + bar - 16 * u, w, 16 * u);
      ['#FF5F57', '#FEBC2E', '#28C840'].forEach((cc, i) => { ctx.fillStyle = cc; ctx.beginPath(); ctx.arc(x + (28 + i * 26) * u, y + bar / 2, 8 * u, 0, TAU); ctx.fill(); });
      ctx.fillStyle = K.gray; ctx.font = F(400, 20, L.MONO); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('water-cycle — 编辑器', x + w / 2, y + bar / 2 + 1 * u); ctx.textAlign = 'left';
      // 文件树
      const tx = x, tw = 250 * u, ty = y + bar;
      ctx.fillStyle = '#252526'; ctx.fillRect(tx, ty, tw, h - bar - 16 * u);
      const files = [['▾ video', 0, a0 + 2.2], ['▸ node_modules', 1, c('npm install') + .9], ['▾ C-031', 1, a0 + 2.2], ['▾ C-038', 1, aRead + 1.2], ['scene.js', 2, aRead + 1.2], ['sound.py', 2, aRead + 1.2], ['▸ out', 1, aRun + 1]];
      ctx.font = F(400, 22, L.MONO);
      files.filter(f => t > f[2]).forEach(([n, d], i) => {
        const yy = ty + 34 * u + i * 36 * u, on = n === 'scene.js' && t > aRead + 1.2;
        if (on) { ctx.fillStyle = '#37373D'; ctx.fillRect(tx, yy - 17 * u, tw, 34 * u); }
        ctx.fillStyle = on ? '#fff' : '#C5C5C5'; ctx.fillText(n, tx + (18 + d * 22) * u, yy);
      });
      // 中间：scene.js
      const ex = tx + tw, ew = 860 * u, eh = 500 * u;
      ctx.fillStyle = '#2D2D30'; ctx.fillRect(ex, ty, ew, 40 * u);
      ctx.fillStyle = '#1E1E1E'; ctx.fillRect(ex, ty, 200 * u, 40 * u);
      ctx.fillStyle = t > aRead + 1.2 ? '#fff' : '#888'; ctx.font = F(400, 20, L.MONO); ctx.fillText(t > aRead + 1.2 ? 'C-038/scene.js ●' : '（还没有打开文件）', ex + 18 * u, ty + 21 * u);
      ctx.save(); ctx.beginPath(); ctx.rect(ex, ty + 40 * u, ew, eh - 40 * u); ctx.clip();
      const lh = 29 * u, t0 = aRead + 1.4, per = Math.max(.12, (aQuick - .4 - t0) / CODE.length);
      ctx.font = F(400, 22, L.MONO);
      CODE.forEach((line, i) => {
        const at = t0 + i * per; if (t < at) return;
        const yy = ty + 62 * u + i * lh, n = Math.floor((t - at) * 60), txt = line.slice(0, n);
        ctx.fillStyle = '#5A5A5A'; ctx.fillText(String(i + 1).padStart(2), ex + 14 * u, yy);
        hlLine(ctx, txt, ex + 56 * u, yy, K);
        if (n < line.length) { ctx.fillStyle = '#AEAFAD'; ctx.fillRect(ex + 56 * u + ctx.measureText(txt).width + 2 * u, yy - 11 * u, 2 * u, 22 * u); }
      });
      // 关键值高亮：说到「出横竖两版」之前，四个步骤名那一行一直亮着
      if (t > t0 + 6 * per + .3) { ctx.fillStyle = 'rgba(255,212,59,.13)'; ctx.fillRect(ex + 50 * u, ty + 62 * u + 6 * lh - 15 * u, ew - 60 * u, 30 * u); }
      ctx.restore();
      // 底部：小终端（实测的命令和输出）
      const rows = [
        { at: a0, k: 'cmd', text: 'mkdir water-cycle && cd water-cycle' },
        { at: a0 + 2.2, k: 'cmd', text: 'cp -R "$SKILL/samples" video && cd video' },
        { at: c('npm install') - .8, k: 'cmd', text: 'npm install' },
        { at: c('npm install') + .9, k: 'out', text: 'added 317 packages, and audited 318 packages in 12s' },
        { at: aRun, k: 'cmd', text: 'python3 batch.py C-031 --quick' },
        { at: c('两行对勾'), k: 'ok', text: '✓ C-031 9x16  3s  动 1.5  声 -14 dB  6s' },
        { at: c('两行对勾') + .3, k: 'ok', text: '✓ C-031 16x9  3s  动 1.8  声 -14 dB  6s' },
        { at: c('通过'), k: 'out', text: '2/2 通过，用时 6s；总览图 → out/sheet.jpg', hl: '2/2 通过' },
        { at: aQuick, k: 'cmd', text: 'python3 batch.py C-038 --quick' },
        { at: aQuick + 1.5, k: 'out', text: '截图：out/C-038-16x9.jpg  out/C-038-9x16.jpg' },
        { at: aFull, k: 'cmd', text: 'python3 batch.py C-038' },
        { at: aX, k: 'bad', text: '✗ C-038 16x9  15s  1.4 MB  149s  时长 15s 不在 3–5 秒', hl: '时长 15s 不在 3–5 秒' },
        { at: aX + .3, k: 'bad', text: '✗ C-038 9x16  15s  1.4 MB  149s  时长 15s 不在 3–5 秒', hl: '时长 15s 不在 3–5 秒' },
      ];
      L.term(ctx, t, ex, ty + eh, ew, h - bar - eh, rows, { fs: 20, lh: 32, title: '终端' });
      // 右边：先是和助手的对话，快速预览后换成预览
      const rx = ex + ew + 16 * u, rw = x + w - rx - 16 * u, ry = ty + 16 * u, rh = h - bar - 32 * u;
      const prev = smooth(aQuick + 1.2, aQuick + 1.8, t);
      ctx.fillStyle = '#252526'; rr(ctx, rx, ry, rw, rh, 12 * u); ctx.fill();
      ctx.fillStyle = '#C5C5C5'; ctx.font = F(700, 22); ctx.fillText(prev > .5 ? '预览 · out/C-038-16x9' : '助手', rx + 20 * u, ry + 30 * u);
      if (prev < 1 && t > aAsk) {
        ctx.save(); ctx.globalAlpha *= 1 - prev;
        const n = Math.floor((t - aAsk - .3) * 16), ask = ASK.slice(0, Math.max(0, n));
        ctx.font = F(400, 24); const ls = wrapCJK(ctx, ask, rw - 80 * u);
        const bh = Math.max(1, ls.length) * 36 * u + 28 * u;
        ctx.fillStyle = '#0E639C'; rr(ctx, rx + 20 * u, ry + 60 * u, rw - 40 * u, bh, 12 * u); ctx.fill();
        ctx.fillStyle = '#fff'; ls.forEach((l, i) => ctx.fillText(l, rx + 40 * u, ry + 88 * u + i * 36 * u));
        const tools = [[aRead, 'Read  C-038/scene.js'], [aRead + 1.2, 'Write C-038/scene.js（水循环）'], [aQuick, 'Bash  batch.py C-038 --quick']];
        ctx.font = F(400, 22, L.MONO);
        tools.filter(([a]) => t > a).forEach(([, txt], i) => { const yy = ry + 100 * u + bh + i * 44 * u; ctx.fillStyle = K.T; ctx.fillText('●', rx + 24 * u, yy); ctx.fillStyle = '#9CDCFE'; ctx.fillText(txt, rx + 54 * u, yy); });
        ctx.restore();
      }
      if (prev > 0) {                                                   // 预览：成片按时间走
        ctx.save(); ctx.globalAlpha *= prev;
        const el = await s.V.at((t - aQuick - 1.2) % (s.V.dur - .05)), pw = rw - 40 * u, ph = pw * 9 / 16;
        ctx.save(); rr(ctx, rx + 20 * u, ry + 56 * u, pw, ph, 8 * u); ctx.clip(); drawCover(ctx, el, rx + 20 * u, ry + 56 * u, pw, ph); ctx.restore();
        ctx.fillStyle = '#888'; ctx.font = F(400, 20, L.MONO); ctx.fillText('改一行，重跑，这里就是新的一帧', rx + 20 * u, ry + 90 * u + ph);
        // 出片中（示意：按旁白时长走，不代表真实进度）
        if (t > aFull + .4 && t < aX + .5) {
          const p = inv(aFull + .4, aX, t), by = ry + 140 * u + ph;
          ctx.fillStyle = '#C5C5C5'; ctx.font = F(400, 22); ctx.fillText('出片中（示意）', rx + 20 * u, by);
          ctx.fillStyle = '#3C3C3C'; rr(ctx, rx + 20 * u, by + 24 * u, pw, 18 * u, 9 * u); ctx.fill();
          ctx.fillStyle = K.T; rr(ctx, rx + 20 * u, by + 24 * u, pw * p, 18 * u, 9 * u); ctx.fill();
        }
        if (t > aTime - .2) {                                           // 用时：两版一起出 149 秒，单出一版 93 秒
          ctx.globalAlpha *= L.fadeIn(t - aTime + .2); const by = ry + 230 * u + ph;
          ctx.fillStyle = '#fff'; ctx.font = F(900, 34); ctx.fillText('单出一版：93 秒', rx + 20 * u, by);
          ctx.fillStyle = '#AAA'; ctx.font = F(400, 22); ctx.fillText('两版一起出 149 秒 · 本次实测', rx + 20 * u, by + 42 * u);
        }
        ctx.restore();
      }
      ctx.restore();
    }
    // ---- 结尾：横竖两版并排，竖版放进手机样机 ----
    if (out > 0) {
      ctx.save(); ctx.globalAlpha = out;
      const q = (t - aDone + .6) % (s.V.dur - .05);
      const lw = 1000 * u, lh2 = lw * 9 / 16, lx = 120 * u, ly = 250 * u - (1 - out) * 30 * u;
      L.card(ctx, lx - 14 * u, ly - 14 * u, lw + 28 * u, lh2 + 28 * u);
      const el = await s.V.at(q); ctx.save(); rr(ctx, lx, ly, lw, lh2, 10 * u); ctx.clip(); drawCover(ctx, el, lx, ly, lw, lh2); ctx.restore();
      const pw = 330 * u, ph = pw * 16 / 9 + 40 * u, px = 1320 * u, py = 120 * u + (1 - out) * 30 * u;     // 手机样机
      ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, px + 10 * u, py + 16 * u, pw + 36 * u, ph + 36 * u, 56 * u); ctx.fill();
      ctx.fillStyle = '#16181D'; rr(ctx, px, py, pw + 36 * u, ph + 36 * u, 56 * u); ctx.fill();
      const ev = await s.P.at(q); ctx.save(); rr(ctx, px + 18 * u, py + 38 * u, pw, ph - 40 * u, 30 * u); ctx.clip(); drawCover(ctx, ev, px + 18 * u, py + 38 * u, pw, ph - 40 * u); ctx.restore();
      ctx.fillStyle = '#16181D'; rr(ctx, px + pw / 2 - 40 * u, py + 14 * u, 116 * u, 26 * u, 13 * u); ctx.fill();
      ctx.fillStyle = K.ink; ctx.font = F(900, 40); ctx.textBaseline = 'middle'; ctx.fillText('片子已经出好了：横竖两版', lx, 170 * u);
      L.chip(ctx, 'C', lx, ly + lh2 + 40 * u, { label: '横版 16:9' }); L.chip(ctx, 'C', px + 90 * u, py + ph + 70 * u, { label: '竖版 9:16' });
      L.chip(ctx, 'G', lx + 220 * u, ly + lh2 + 40 * u, { label: '时长叉可不管：是样片的规矩' });
      ctx.restore();
    }
    L.frame(ctx, t);
    L.sub(ctx, t);
  }
});
