// 分镜换画风风格包（由 G-016 沉淀）：同一段分镜、同一套提示词结构，只换「风格段」就换一种画风；剪辑代码只有一份。
// 提示词 = 镜头段（每个镜头一段，画风之间共用）+ 风格段（只有这一段随画风换）+ 约束段（全片共用），数据在 demo/prompts.json。
// 这里的部件把这条公式放到画面上：片头摆出三段、风格段高亮；每个镜头角上一条提示词条；片尾三种画风并排，当前这种亮着。
// 依赖 samples/lib/lib.js 的 W H LAND SHORT、inv/lerp/clamp/smooth、缓动、rr()、wrapCJK()、mk()、cueAt()、caption()。
// 部件签名都是 (ctx, K, t, …)：K 是 theme() 的结果，t 是部件自己的本地时间（秒，可以为负）。每帧只由 t 决定。
const SW = (() => {
  // 主题：颜色固定，三种画风共用（画风的差别全在图里，包装不跟着变，才看得出换的只有风格段）
  function theme(o = {}) {
    return {
      bg: '#0D0F12', ink: '#F7F4EE', muted: 'rgba(247,244,238,.66)', faint: 'rgba(247,244,238,.18)',
      hot: o.hot || '#FFB547', chip: 'rgba(20,22,27,.82)',
      head: o.head || "'Noto Sans SC'", mono: o.mono || "'JetBrains Mono'", u: SHORT / 1080, beat: o.beat || .375,
    };
  }
  const F = (K, w, px, fam = K.head) => `${w} ${Math.round(px * K.u)}px ${fam}`;
  const pop = (t, d = .5) => eOutCubic(clamp(t / d));

  // 画面区：横屏铺满；竖屏把 16:9 的图整张放在上半部（不裁），背后垫一层放大压暗的同一张图，下面留给提示词条和字幕
  function stage() {
    const u = SHORT / 1080;
    return LAND ? { img: [0, 0, W, H], strip: [70 * u, H - 300 * u, W * .62, 120 * u] }
      : { img: [0, 300 * u, W, W * 9 / 16], strip: [50 * u, 300 * u + W * 9 / 16 + 50 * u, W - 100 * u, 300 * u] };
  }
  function cover(ctx, img, [x, y, w, h], z = 1, fx = .5, fy = .5, alpha = 1) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k = Math.max(w / iw, h / ih) * z;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalAlpha *= alpha;
    ctx.drawImage(img, x + (w - iw * k) * fx, y + (h - ih * k) * fy, iw * k, ih * k); ctx.restore();
  }
  let BLUR = null;
  // 一个镜头：慢推或慢拉（move：{ z: [起, 止], fx, fy 各 [起, 止] }），d 是这个镜头的长度
  function shot(ctx, K, t, d, img, move) {
    const p = smooth(0, d + .5, t), z = lerp(...move.z, p), fx = lerp(...move.fx, p), fy = lerp(...move.fy, p), S = stage();
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    if (!LAND) {
      BLUR = BLUR || mk(W / 4, H / 4); const b = BLUR.getContext('2d');
      b.filter = 'blur(10px)'; b.clearRect(0, 0, W / 4, H / 4); cover(b, img, [0, 0, W / 4, H / 4], 1.1); b.filter = 'none';
      ctx.save(); ctx.globalAlpha = .55; ctx.drawImage(BLUR, 0, 0, W, H); ctx.restore();
      ctx.fillStyle = 'rgba(13,15,18,.45)'; ctx.fillRect(0, 0, W, H);
    }
    cover(ctx, img, S.img, z, fx, fy);
    if (LAND) {                                            // 底部压暗，提示词条和字幕看得清
      const g = ctx.createLinearGradient(0, H * .55, 0, H); g.addColorStop(0, 'rgba(13,15,18,0)'); g.addColorStop(1, 'rgba(13,15,18,.78)');
      ctx.fillStyle = g; ctx.fillRect(0, H * .55, W, H * .45);
    }
  }

  // 一段提示词的小牌子：上面一行段名，下面一行内容；hot 的那块（风格段）用强调色描边
  function chip(ctx, K, x, y, w, h, name, text, hot, e = 1, glow = 0) {
    ctx.save(); ctx.globalAlpha *= e; ctx.textAlign = 'left';
    ctx.fillStyle = K.chip; rr(ctx, x, y, w, h, 14 * K.u); ctx.fill();
    ctx.lineWidth = (hot ? 3 : 1.5) * K.u; ctx.strokeStyle = hot ? K.hot : K.faint; ctx.stroke();
    if (hot && glow > 0) { ctx.shadowColor = K.hot; ctx.shadowBlur = 30 * K.u * glow; ctx.stroke(); ctx.shadowBlur = 0; }
    const pad = 18 * K.u;
    ctx.fillStyle = hot ? K.hot : K.muted; ctx.font = F(K, 700, 22); ctx.textBaseline = 'top'; ctx.fillText(name, x + pad, y + pad);
    ctx.fillStyle = K.ink; ctx.font = F(K, hot ? 700 : 400, 26);
    const lines = wrapCJK(ctx, text, w - pad * 2), lh = 36 * K.u, max = Math.max(1, Math.floor((h - pad * 2 - 34 * K.u) / lh));
    lines.slice(0, max).forEach((l, i) => ctx.fillText(i === max - 1 && lines.length > max ? l.slice(0, -1) + '…' : l, x + pad, y + pad + 36 * K.u + i * lh));
    ctx.restore();
  }

  // 片头：一行公式「镜头段 ＋ 风格段 ＋ 约束段」，三块依次落下，风格段最后亮起，下面写这次用的是哪种画风
  // o：{ title, shot 镜头段（示例）, style 风格段, styleName, rules 约束段 }
  function formula(ctx, K, t, o, bgImg) {
    const u = K.u;
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    if (bgImg) { cover(ctx, bgImg, [0, 0, W, H], 1.15, .5, .5, .22); }
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const x0 = (LAND ? 120 : 60) * u, yT = (LAND ? 250 : 420) * u;
    ctx.globalAlpha = pop(t, .5); ctx.fillStyle = K.muted; ctx.font = F(K, 700, 30, K.mono); ctx.fillText('PROMPT =', x0, yT - (LAND ? 90 : 100) * u);
    ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 72 : 76); ctx.fillText(o.title, x0, yT);
    ctx.restore();
    const gap = 26 * u, n = 3, plus = 48 * u;
    const parts = [['镜头段 · 每个镜头一段', o.shot, false], ['风格段 · 只换这一段', o.style, true], ['约束段 · 全片共用', o.rules, false]];
    parts.forEach(([name, text, hot], i) => {
      const e = pop(t - .35 - i * K.beat, .5), lift = (1 - e) * 40 * u;
      let x, y, w, h;
      if (LAND) { w = (W - x0 * 2 - plus * 2) / n; h = 300 * u; x = x0 + i * (w + plus); y = yT + 70 * u; }
      else { w = W - x0 * 2; h = 180 * u; x = x0; y = yT + 70 * u + i * (h + plus); }
      const glow = hot ? .5 + .5 * Math.sin(TAU * inv(1.4, 3, t) * 2) * smooth(1.3, 1.6, t) : 0;
      chip(ctx, K, x, y + lift, w, h, name, text, hot && t > 1.3, e, glow);
      if (i < n - 1) {
        ctx.save(); ctx.globalAlpha = pop(t - .5 - i * K.beat, .4); ctx.fillStyle = K.muted; ctx.font = F(K, 300, 54); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('+', LAND ? x + w + plus / 2 : W / 2, LAND ? y + h / 2 : y + h + plus / 2); ctx.restore();
      }
    });
    // 这次的画风
    const e = pop(t - 1.4, .5), yS = LAND ? yT + 70 * u + 300 * u + 100 * u : yT + 70 * u + 3 * 180 * u + 2 * plus + 110 * u;
    ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'left'; ctx.fillStyle = K.hot; ctx.font = F(K, 900, 52);
    ctx.fillText('画风：' + o.styleName, x0, yS); ctx.restore();
  }

  // 每个镜头角上的提示词条：镜头段 ＋ 风格段（高亮）＋ 约束段，告诉观众这一格是怎么写出来的
  function strip(ctx, K, t, o) {
    const S = stage(), [x, y, w, h] = S.strip, u = K.u, e = pop(t - .3, .5);
    ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const items = [[o.shotName, false], ['＋', null], ['风格段：' + o.styleName, true], ['＋', null], ['约束段', false]];
    ctx.font = F(K, 700, LAND ? 28 : 30);
    let cx = x; const ch = 60 * u, cy = y + (LAND ? h - ch : 0);
    for (const [txt, hot] of items) {
      const tw = ctx.measureText(txt).width;
      if (hot === null) { ctx.fillStyle = K.muted; ctx.fillText(txt, cx, cy + ch / 2); cx += tw + 10 * u; continue; }
      const bw = tw + 32 * u; ctx.fillStyle = hot ? K.hot : K.chip; rr(ctx, cx, cy, bw, ch, 10 * u); ctx.fill();
      if (!hot) { ctx.strokeStyle = K.faint; ctx.lineWidth = 1.5 * u; ctx.stroke(); }
      ctx.fillStyle = hot ? '#14110B' : K.ink; ctx.fillText(txt, cx + 16 * u, cy + ch / 2 + 1); cx += bw + 10 * u;
    }
    if (!LAND && o.styleText) {                            // 竖屏下面空间大：把风格段原文也写出来
      ctx.fillStyle = K.muted; ctx.font = F(K, 400, 28); ctx.textBaseline = 'top';
      wrapCJK(ctx, o.styleText, w).slice(0, 3).forEach((l, i) => ctx.fillText(l, x, cy + ch + 26 * u + i * 42 * u));
    }
    ctx.restore();
  }

  // 片尾：同一个镜头的几种画风并排，当前这一种放大亮起；o：{ title, items: [{ img, name, on }] }
  function lineup(ctx, K, t, o) {
    const u = K.u, n = o.items.length;
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = pop(t, .5);
    ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 60 : 64); ctx.fillText(o.title, W / 2, (LAND ? 200 : 380) * u);
    ctx.fillStyle = K.muted; ctx.font = F(K, 400, 30); ctx.fillText(o.sub, W / 2, (LAND ? 260 : 450) * u); ctx.restore();
    o.items.forEach((it, i) => {
      const e = pop(t - .2 - i * K.beat * .7, .5);
      let w, h, x, y;
      if (LAND) { w = (W - 240 * u - 2 * 40 * u) / n; h = w * 9 / 16; x = 120 * u + i * (w + 40 * u); y = H * .36; }
      else { w = W - 200 * u; h = w * 9 / 16; x = 100 * u; y = 540 * u + i * (h + 70 * u); }
      const on = it.on, k = on ? lerp(1, 1.06, eOutBack(clamp((t - 1) / .6))) : 1, cx = x + w / 2, cy = y + h / 2;
      ctx.save(); ctx.globalAlpha = e * (on ? 1 : lerp(1, .45, smooth(.9, 1.4, t)));
      ctx.translate(cx, cy + (1 - e) * 40 * u); ctx.scale(k, k); ctx.translate(-cx, -cy);
      cover(ctx, it.img, [x, y, w, h]);
      ctx.lineWidth = (on ? 5 : 1.5) * u; ctx.strokeStyle = on ? K.hot : K.faint; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = on ? K.hot : K.ink; ctx.font = F(K, on ? 900 : 700, 32); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(it.name, cx, y + h + 18 * u);
      ctx.restore();
    });
  }

  // 字幕：跟语音合成的逐句时间（assets.json 的 lines）
  function subtitle(ctx, K, t, A) {
    const c = cueAt(A, t); if (!c) return;
    caption(ctx, c.text, { size: LAND ? 42 : 46, y: H - (LAND ? 70 : 230) * K.u, bg: 'rgba(13,15,18,.6)' });
  }
  // 转场：叠化，后一段从 1.04 倍缩回来
  let OFF = null;
  function transition(ctx, K, p, drawA, drawB) {
    OFF = OFF || mk(W, H); const o = OFF.getContext('2d'), e = eInOutCubic(clamp(p));
    drawA(ctx);
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); drawB(o);
    const z = lerp(1.04, 1, e);
    ctx.save(); ctx.globalAlpha = e; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.drawImage(OFF, -W / 2, -H / 2); ctx.restore();
  }

  return { theme, stage, shot, chip, formula, strip, lineup, subtitle, transition, pop };
})();
