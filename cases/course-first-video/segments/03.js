// 第 3 段 概念：包豪斯式三栏（圆、方、三角对应 C、T、G），每栏两个样片小窗，跟着旁白逐栏亮起；
// 「都由代码排进时间线」三栏收成一条时间线；后半段讲「每一帧只由时间 t 决定」：时间轴上的游标拖到哪，上面就画出那一帧。
const MINI = { C: ['C-031', 'C-044'], T: ['T-009', 'T-015'], G: ['G-002', 'G-016'] };
scene({
  id: 'course-first-video:3', name: '概念',
  needs: ['common.js'],
  fonts: L.FONTS,
  async init() {
    await L.init();
    const V = {};
    for (const k in MINI) for (const id of MINI[k]) V[id] = await loadVideo(`mini/${id}.mp4`);
    return { V, S: await loadVideo('C-038-16x9.mp4') };
  },
  async draw(ctx, t, s) {
    const { u, K, F } = L;
    L.bg(ctx);
    const tC = L.cue('C 类'), tT = L.cue('T 类'), tG = L.cue('G 类'), tLine = L.cue('不管哪一类'), tRule = L.cue('有一条规矩'), tSame = L.cue('同一个'), tJump = L.cue('第 7 秒');
    const part2 = eInOutCubic(inv(tRule - .8, tRule, t));
    // ---- 前半：三栏 ----
    if (part2 < 1) {
      ctx.save(); ctx.globalAlpha = 1 - part2;
      L.title(ctx, '画面从哪来', 80 * u, 170 * u, 64, { alpha: L.fadeIn(t - .3) });
      const cols = [['C', tC, '代码算出', '图形 · 文字 · 动画'], ['T', tT, '真实素材', '录像 · 录屏 · 照片 · 数据'], ['G', tG, 'AI 生成', '生图 · 生视频 · 语音合成']];
      const gather = eInOutCubic(inv(tLine, tLine + 1, t));
      for (let i = 0; i < 3; i++) {
        const [k, at, name, sub] = cols[i], p = t - at; if (p < -.2) continue;
        const x = 80 * u + i * 600 * u, y = 230 * u, w = 560 * u, h = 640 * u;
        const e = L.pop(p + .2);
        ctx.save(); ctx.globalAlpha *= clamp((p + .2) / .3); ctx.translate(x + w / 2, y + h / 2); ctx.scale(lerp(.9, 1, e) * lerp(1, .9, gather), lerp(.9, 1, e) * lerp(1, .9, gather)); ctx.translate(-w / 2, -h / 2);
        L.card(ctx, 0, 0, w, h);
        ctx.fillStyle = K[k];                                           // 包豪斯：圆 / 方 / 三角
        if (i === 0) { ctx.beginPath(); ctx.arc(70 * u, 70 * u, 40 * u, 0, TAU); ctx.fill(); }
        if (i === 1) ctx.fillRect(32 * u, 32 * u, 76 * u, 76 * u);
        if (i === 2) { ctx.beginPath(); ctx.moveTo(70 * u, 26 * u); ctx.lineTo(114 * u, 110 * u); ctx.lineTo(26 * u, 110 * u); ctx.fill(); }
        ctx.fillStyle = '#fff'; ctx.font = F(900, 40); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(k, 70 * u, i === 2 ? 82 * u : 72 * u);
        ctx.textAlign = 'left'; ctx.fillStyle = K.ink; ctx.font = F(900, 48); ctx.fillText(name, 140 * u, 60 * u);
        ctx.fillStyle = K.soft; ctx.font = F(400, 28); ctx.fillText(sub, 140 * u, 108 * u);
        for (let j = 0; j < 2; j++) {
          const id = MINI[k][j], v = s.V[id], el = await v.at((Math.max(0, t - at) + j * 1.3) % (v.dur - .05));
          const mx = 30 * u, my = 160 * u + j * 235 * u, mw = w - 60 * u, mh = 215 * u;
          ctx.save(); rr(ctx, mx, my, mw, mh, 12 * u); ctx.clip(); drawCover(ctx, el, mx, my, mw, mh); ctx.restore();
          ctx.fillStyle = 'rgba(20,24,33,.75)'; rr(ctx, mx + 12 * u, my + 12 * u, 120 * u, 40 * u, 8 * u); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = F(700, 22, L.MONO); ctx.fillText(id, mx + 26 * u, my + 33 * u);
        }
        ctx.restore();
      }
      // 「写实人脸、真人口播」：C 栏打叉，指向 T、G
      const tFace = L.cue('写实的人脸');
      if (t > tFace && gather < 1) {
        ctx.save(); ctx.globalAlpha *= L.fadeIn(t - tFace) * (1 - gather);
        L.card(ctx, 140 * u, 880 * u, 1640 * u, 90 * u, { fill: '#FFF4E5' });
        ctx.fillStyle = K.G; ctx.font = F(700, 34); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillText('写实人脸、真人口播 → 代码画不出来，交给 T 类或 G 类', W / 2, 926 * u); ctx.restore();
      }
      // 三栏收成一条时间线
      if (gather > 0) {
        ctx.save(); ctx.globalAlpha *= gather;
        const y = 920 * u; L.card(ctx, 140 * u, y - 30 * u, 1640 * u, 90 * u, { fill: K.ink });
        ['C', 'T', 'G', 'C', 'G', 'T', 'C'].forEach((k, i) => { ctx.fillStyle = K[k]; rr(ctx, 170 * u + i * 175 * u, y - 10 * u, 160 * u, 50 * u, 8 * u); ctx.fill(); });
        ctx.fillStyle = '#fff'; ctx.font = F(900, 34); ctx.textBaseline = 'middle'; ctx.fillText('→ 一条片子', 1420 * u, y + 15 * u);
        ctx.restore();
      }
      ctx.restore();
    }
    // ---- 后半：每一帧只由时间 t 决定 ----
    if (part2 > 0) {
      ctx.save(); ctx.globalAlpha = part2;
      L.title(ctx, '每一帧只由时间 t 决定', 80 * u, 170 * u, 64);
      ctx.fillStyle = K.soft; ctx.font = F(400, 32, L.MONO); ctx.fillText('draw(ctx, t)  →  这一帧', 80 * u, 230 * u);
      // 游标：先匀速扫，说到「第七秒」跳到 7.0，说到「同一个 t」并排画两遍
      const lt = t - tRule, sweep = (lt * 2.2) % 15;
      const tv = t > tJump ? 7 : t > tSame ? 4.5 : sweep;
      const twin = smooth(tSame, tSame + .6, t) * (1 - smooth(tJump - .3, tJump, t));
      const fx = 80 * u, fy = 280 * u, fh = 540 * u, fw = fh * 16 / 9;
      const el = await s.S.at(tv);
      const drawF = (x, lab) => { ctx.save(); rr(ctx, x, fy, fw, fh, 14 * u); ctx.clip(); drawCover(ctx, el, x, fy, fw, fh); ctx.restore();
        ctx.fillStyle = 'rgba(20,24,33,.78)'; rr(ctx, x + 16 * u, fy + 16 * u, 320 * u, 52 * u, 10 * u); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = F(700, 28, L.MONO); ctx.textBaseline = 'middle'; ctx.fillText(lab, x + 32 * u, fy + 43 * u); };
      drawF(fx + lerp(0, -40 * u, twin), `t = ${tv.toFixed(2)} 秒`);
      if (twin > 0) { ctx.save(); ctx.globalAlpha *= twin; drawF(fx + fw + 60 * u, `t = ${tv.toFixed(2)} 秒 · 再画一次`); ctx.restore(); }
      // 时间轴
      const ax = 80 * u, ay = 900 * u, aw = W - 160 * u;
      ctx.strokeStyle = K.ink; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + aw, ay); ctx.stroke();
      ctx.font = F(400, 24, L.MONO); ctx.fillStyle = K.soft; ctx.textAlign = 'center';
      for (let k = 0; k <= 15; k++) { const x = ax + aw * k / 15; ctx.fillRect(x - 1 * u, ay - 10 * u, 2 * u, 20 * u); if (k % 3 === 0) ctx.fillText(`${k}s`, x, ay + 40 * u); }
      const cx = ax + aw * tv / 15;
      ctx.fillStyle = K.G; ctx.beginPath(); ctx.moveTo(cx, ay - 14 * u); ctx.lineTo(cx - 16 * u, ay - 40 * u); ctx.lineTo(cx + 16 * u, ay - 40 * u); ctx.fill(); ctx.fillRect(cx - 2 * u, ay - 14 * u, 4 * u, 28 * u);
      if (t > tJump) L.ripple(ctx, cx, ay, (t - tJump) / .7);
      ctx.restore();
    }
    L.frame(ctx, t);
    L.sub(ctx, t);
  }
});
