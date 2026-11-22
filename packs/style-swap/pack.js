// 分镜换画风风格包（由 G-016 沉淀）：同一组分镜、同一套提示词结构，只换「风格段」就换一种画风；剪辑代码只有一份。
// 提示词 = 镜头段（每个镜头一段，画风之间共用）+ 风格段（只有这一段随画风换）+ 约束段（全片共用），数据在 demo/prompts.json。
// 包装（颜色、字体、版式、动效、声音）固定，画风的差别全在生成的图里：每个镜头都用当前画风的图，纯代码镜头（数据、讲述）后面铺当前画风的底纹，
// 所以换 v（photo / watercolor / clay）每个镜头都跟着变。数据镜头用的是这套图真实的生成记录（demo/genlog.json）和图本身的像素。
// 依赖 samples/lib/lib.js 的 W H LAND SHORT、inv/lerp/clamp/smooth、缓动、rr()、wrapCJK()、mk()、hash1()、caption()、cueAt()。
// 部件签名都是 (ctx, K, t, o)：K 是 theme() 的结果，场景在 init 里往 K 上挂 K.I（当前画风的图，键是镜头号 s1…s16 和底纹 tex）、
// K.ALL（每种画风的图）、K.v（当前画风）、K.names（画风的中文名）、K.Pr（prompts.json）、K.G（genlog.json）。
// t 是部件自己的本地时间（秒，可以为负），o 是内容。每帧只由 t 决定。要被叠加的部件返回 { box: [x, y, w, h], pt: [x, y] }。
const SW = (() => {
  // ══ 主题和零件 ══════════════════════════════════════════════════════════════
  // 颜色固定，三种画风共用（包装不跟着变，才看得出换的只有风格段）
  function theme(o = {}) {
    return {
      bg: '#0D0F12', ink: '#F7F4EE', muted: 'rgba(247,244,238,.66)', faint: 'rgba(247,244,238,.18)',
      hot: o.hot || '#FFB547', cool: '#7FA7C9', chip: 'rgba(20,22,27,.82)', paper: '#F1EADB',
      head: o.head || "'Noto Sans SC'", mono: o.mono || "'JetBrains Mono'", num: o.num || "'Bebas Neue'",
      u: SHORT / 1080, beat: o.beat || .6,
    };
  }
  const F = (K, w, px, fam = K.head) => `${w} ${Math.round(px * K.u)}px ${fam}`;
  const pop = (t, d = .5) => eOutCubic(clamp(t / d));
  const img = (K, id) => (typeof id === 'string' ? K.I[id] : id);
  // 正文区：横屏避开左上角标和底部字幕；竖屏上下各多留一些
  function area(K) {
    const u = K.u;
    return LAND ? [130 * u, 150 * u, W - 260 * u, H - 330 * u] : [60 * u, 270 * u, W - 120 * u, H - 760 * u];
  }
  // 铺满框 r（可放大 z、焦点 fx fy），返回图上 (a, b)（0–1）→ 屏幕坐标
  function cover(ctx, im, r, z = 1, fx = .5, fy = .5, alpha = 1) {
    const [x, y, w, h] = r, iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, k = Math.max(w / iw, h / ih) * z;
    const dx = x + (w - iw * k) * fx, dy = y + (h - ih * k) * fy;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalAlpha *= alpha;
    ctx.drawImage(im, dx, dy, iw * k, ih * k); ctx.restore();
    return (a, b) => [dx + a * iw * k, dy + b * ih * k];
  }
  function glass(ctx, K, x, y, w, h, a = 1, hot = false) {
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = K.chip; rr(ctx, x, y, w, h, 14 * K.u); ctx.fill();
    ctx.lineWidth = (hot ? 3 : 1.5) * K.u; ctx.strokeStyle = hot ? K.hot : K.faint; ctx.stroke(); ctx.restore();
  }
  // 镜头抬头：眉题（等宽小字）+ 标题 + 一道强调色短条；返回正文从哪里开始
  function header(ctx, K, t, o, A) {
    const [x, y, w] = A, u = K.u; let yy = y;
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (o.kicker) { const e = pop(t, .35); ctx.globalAlpha = e; ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.hot; ctx.fillText(o.kicker, x + (1 - e) * 30 * u, yy + 26 * u); yy += 46 * u; ctx.globalAlpha = 1; }
    if (o.title) {
      ctx.font = F(K, 900, LAND ? 56 : 60); ctx.fillStyle = K.ink; const lh = (LAND ? 68 : 74) * u, ls = wrapCJK(ctx, o.title, w);
      ls.forEach((l, i) => { const e = pop(t - .08 - i * .08, .45); ctx.globalAlpha = e; ctx.fillText(l, x, yy + lh * (i + .85) + (1 - e) * 24 * u); });
      ctx.globalAlpha = 1; yy += ls.length * lh; ctx.fillStyle = K.hot; ctx.fillRect(x, yy + 10 * u, 110 * u * pop(t - .2, .4), 6 * u); yy += 46 * u;
    }
    ctx.restore(); return yy;
  }
  // 一段提示词的小牌子（片头公式、15 秒片段用）：上面一行段名，下面一行内容；hot 的那块（风格段）用强调色描边
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
  // 一行小标签（强调色底或深底）
  function tagAt(ctx, K, x, y, text, hot = true, a = 1, size = 24) {
    ctx.save(); ctx.globalAlpha *= a; ctx.font = F(K, 700, size, K.mono); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const u = K.u, w = ctx.measureText(text).width + 24 * u, h = size * 1.7 * u;
    ctx.fillStyle = hot ? K.hot : K.chip; rr(ctx, x, y, w, h, 8 * u); ctx.fill();
    ctx.fillStyle = hot ? '#14110B' : K.ink; ctx.fillText(text, x + 12 * u, y + h / 2 + 1); ctx.restore();
    return w;
  }
  // 当前画风的提示词（和 demo/compose.py 拼法一致）
  function promptOf(K, id, style = K.v) {
    const s = K.Pr.shots.find(q => q.id === id), parts = { shot: s.prompt, style: K.Pr.styles[style], rules: K.Pr.rules };
    return K.Pr.join.map(j => j.replace(/\{(\w+)\}/g, (_, k) => parts[k]));
  }
  // 生成记录的统计（只算一次）
  function stats(K) {
    if (K._st) return K._st;
    const G = K.G.items, by = st => G.filter(g => g.style === st), mean = a => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
    const styles = Object.keys(K.Pr.styles);
    return (K._st = {
      n: G.length, calls: G.reduce((s, g) => s + g.tries, 0), fails: G.reduce((s, g) => s + g.fails, 0),
      sec: mean(G.map(g => g.sec)), kb: G.reduce((s, g) => s + g.kb, 0), end: Math.max(...G.map(g => g.end || 0)),
      styles, bySec: styles.map(st => mean(by(st).map(g => g.sec))), byKb: styles.map(st => by(st).reduce((s, g) => s + g.kb, 0)),
    });
  }
  // 一张图的主色：缩到 24 × 16，按亮度排序后分 n 段取平均（只由像素决定）
  const PAL = {};
  function palette(im, n = 6) {
    const key = im.src + n; if (PAL[key]) return PAL[key];
    const c = mk(24, 16), g = c.getContext('2d'); g.drawImage(im, 0, 0, 24, 16);
    const d = g.getImageData(0, 0, 24, 16).data, px = [];
    for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
    px.sort((a, b) => (a[0] * .3 + a[1] * .59 + a[2] * .11) - (b[0] * .3 + b[1] * .59 + b[2] * .11));
    const out = [];
    for (let k = 0; k < n; k++) {
      const seg = px.slice(Math.floor(k * px.length / n), Math.floor((k + 1) * px.length / n)), m = [0, 1, 2].map(j => Math.round(seg.reduce((s, p) => s + p[j], 0) / seg.length));
      out.push(m);
    }
    return (PAL[key] = out);
  }
  const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();

  // ══ 层 ══════════════════════════════════════════════════════════════════════
  // 背景：当前画风的底纹铺满、慢慢漂，压暗并加暗角（数据、讲述镜头后面都是它，所以换画风它也换）
  function backdrop(ctx, K, t, seed = 0) {
    const T = K.I.tex;
    cover(ctx, T, [0, 0, W, H], 1.12 + .04 * Math.sin(t * .2 + seed), .5 + .08 * Math.sin(t * .11 + seed), .5 + .06 * Math.cos(t * .09));
    ctx.fillStyle = 'rgba(13,15,18,.62)'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, SHORT * .25, W / 2, H / 2, Math.max(W, H) * .75);
    g.addColorStop(0, 'rgba(13,15,18,0)'); g.addColorStop(1, 'rgba(13,15,18,.75)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // 粒子：面粉一样的细颗粒，慢慢往上飘
  function grain(ctx, K, t) {
    ctx.save(); ctx.fillStyle = K.paper;
    for (let i = 0; i < 46; i++) {
      const x = ((hash1(i) * W + Math.sin(t * .5 + i) * 30 * K.u + t * 8 * K.u) % W + W) % W, y = ((hash1(i + 70) * H - t * (10 + 18 * hash1(i + 5)) * K.u) % H + H) % H;
      ctx.globalAlpha = (.1 + .28 * hash1(i + 3)) * (.55 + .45 * Math.sin(t * 1.1 + i * 2));
      ctx.beginPath(); ctx.arc(x, y, (.8 + 2 * hash1(i + 9)) * K.u, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  // 角标：左上包名 + 当前画风，右上章名和镜头数，拍点；al 控制显隐（开场、章节卡、片尾不显示）
  function corner(ctx, K, t, o) {
    if (!(o.al > 0)) return;
    const u = K.u, x = (LAND ? 56 : 40) * u, y = (LAND ? 44 : 90) * u;
    ctx.save(); ctx.globalAlpha = o.al; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = F(K, 900, 26); ctx.fillStyle = K.ink; ctx.fillText(o.brand, x, y + 18 * u);
    let xx = x + ctx.measureText(o.brand).width + 16 * u;
    ctx.font = F(K, 700, 18, K.mono); ctx.fillStyle = K.muted; ctx.fillText(o.en, xx, y + 19 * u); xx += ctx.measureText(o.en).width + 16 * u;
    xx += tagAt(ctx, K, xx, y + 2 * u, '画风 · ' + K.names[K.v], true, 1, 20) + 14 * u;
    if (o.beat) {                                          // 节拍：每拍亮一下
      const ph = ((t % o.beat) + o.beat) % o.beat / o.beat;
      ctx.fillStyle = K.hot; ctx.globalAlpha = o.al * (.3 + .7 * (1 - ph)); ctx.beginPath(); ctx.arc(xx + 8 * u, y + 18 * u, 7 * u * (1 + .5 * (1 - ph)), 0, TAU); ctx.fill(); ctx.globalAlpha = o.al;
    }
    if (o.ch) {
      ctx.textAlign = 'right'; ctx.font = F(K, 700, 20, K.mono); ctx.fillStyle = K.muted;
      ctx.fillText(`${String(o.ch.n).padStart(2, '0')} / ${String(o.ch.of).padStart(2, '0')}  ${o.ch.title}`, W - x, y + 18 * u);
    }
    ctx.restore();
  }
  // 字幕：每章一句，可以跨好几个镜头
  function captions(ctx, K, t, cues) {
    const c = cues.find(q => t >= q.a && t < q.b); if (!c) return;
    ctx.save(); ctx.globalAlpha = smooth(c.a, c.a + .15, t) * (1 - smooth(c.b - .15, c.b, t));
    caption(ctx, c.text, { size: LAND ? 40 : 44, y: H - (LAND ? 52 : 230) * K.u, bg: 'rgba(13,15,18,.72)', maxW: W * (LAND ? .7 : .86) });
    ctx.restore();
  }

  // ══ 开场 ════════════════════════════════════════════════════════════════════
  // 冷开场：黑场里一张图从噪点「显影」——像素块从大到小、噪点越来越少，最后落一行字。o：{ img, title, sub }
  let PIX = null;
  function coldOpen(ctx, K, t, o) {
    const u = K.u, im = img(K, o.img), p = eInOutCubic(clamp(t / 1.15));
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const s = Math.max(1, Math.round(lerp(64, 1, p))), cw = Math.ceil(W / s), chh = Math.ceil(H / s);
    PIX = PIX || mk(W, H); const g = PIX.getContext('2d'); g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = true;
    cover(g, im, [0, 0, cw, chh], 1.05);
    ctx.save(); ctx.imageSmoothingEnabled = s < 2; ctx.globalAlpha = smooth(0, .3, t); ctx.drawImage(PIX, 0, 0, cw, chh, 0, 0, W, H); ctx.restore();
    const f = Math.floor(t * 15), n = Math.round(900 * (1 - p)), sz = 10 * u;      // 噪点：每 1/15 秒换一批
    ctx.save();
    for (let i = 0; i < n; i++) { const v = hash1(i * 7 + f * 131) * 255 | 0; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.globalAlpha = .55; ctx.fillRect(hash1(i + f * 977) * W, hash1(i * 3 + f * 51) * H, sz, sz); }
    ctx.restore();
    ctx.fillStyle = `rgba(0,0,0,${.45 * smooth(1, 1.4, t)})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const e = pop(t - 1.05, .4);
    ctx.globalAlpha = e; ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.hot; ctx.fillText(o.sub, W / 2, H / 2 - 70 * u);
    ctx.font = F(K, 900, LAND ? 92 : 80); ctx.fillStyle = K.ink; ctx.fillText(o.title, W / 2, H / 2 + 20 * u + (1 - e) * 30 * u);
    ctx.restore();
  }
  // 砸字：一拍砸一个词，从大砸到原大；o：{ words, sub, every }
  function slam(ctx, K, t, o) {
    const u = K.u, ev = o.every || K.beat, n = o.words.length;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = F(K, 900, LAND ? 120 : 110);
    const ws = o.words.map(w => ctx.measureText(w).width), gap = 40 * u, tot = ws.reduce((a, b) => a + b, 0) + gap * (n - 1);
    let x = W / 2 - tot / 2;
    o.words.forEach((w, i) => {
      const lt = t - i * ev; if (lt < 0) return;
      const e = clamp(lt / .22), k = lerp(2.4, 1, eOutCubic(e)), shake = lt < .3 ? Math.sin(lt * 90) * (1 - lt / .3) * 8 * u : 0;
      const cx = LAND ? x + ws[i] / 2 : W / 2, cy = LAND ? H / 2 - 20 * u : H / 2 - (n - 1) * 80 * u + i * 160 * u;
      ctx.save(); ctx.translate(cx + shake, cy); ctx.scale(k, k); ctx.globalAlpha = e;
      ctx.fillStyle = i === n - 1 ? K.hot : K.ink; ctx.fillText(w, 0, 0); ctx.restore();
      x += ws[i] + gap;
    });
    const e = pop(t - n * ev + .2, .35); ctx.globalAlpha = e; ctx.font = F(K, 400, 34); ctx.fillStyle = K.muted;
    ctx.fillText(o.sub, W / 2, LAND ? H / 2 + 120 * u : H / 2 + n * 80 * u + 40 * u);
    ctx.restore();
  }
  // 快闪：一拍换一张图，图上一个词；o：{ imgs, words, every }
  function flash(ctx, K, t, o) {
    const u = K.u, ev = o.every || K.beat / 2, k = clamp(Math.floor(t / ev), 0, o.imgs.length - 1), lt = t - k * ev;
    cover(ctx, img(K, o.imgs[k]), [0, 0, W, H], 1.08 - .05 * clamp(lt / ev));
    ctx.fillStyle = 'rgba(13,15,18,.35)'; ctx.fillRect(0, 0, W, H);
    if (lt < .06) { ctx.fillStyle = `rgba(255,255,255,${.35 * (1 - lt / .06)})`; ctx.fillRect(0, 0, W, H); }
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = F(K, 900, LAND ? 110 : 96);
    ctx.fillStyle = K.ink; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 30 * u; ctx.fillText(o.words[k], W / 2, H / 2);
    ctx.shadowBlur = 0; ctx.font = F(K, 700, 24, K.mono); ctx.fillStyle = K.hot; ctx.fillText(`${String(k + 1).padStart(2, '0')} / ${String(o.imgs.length).padStart(2, '0')}`, W / 2, H / 2 + (LAND ? 100 : 110) * u);
    ctx.restore();
  }
  // 提示词字带：三行提示词原文反向滚动，中间一行是当前画风的风格段（强调色）；o：{ shots: [镜头号…] }
  function marquee(ctx, K, t, o) {
    const u = K.u, rows = [K.Pr.shots.find(s => s.id === o.shots[0]).prompt, '画风：' + K.Pr.styles[K.v], K.Pr.rules];
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.06); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    rows.forEach((r, i) => {
      const hot = i === 1, size = hot ? (LAND ? 64 : 58) : (LAND ? 44 : 40), y = (i - 1) * (LAND ? 150 : 140) * u, txt = r + '　·　';
      ctx.font = F(K, hot ? 900 : 700, size); const tw = ctx.measureText(txt).width, sp = (i % 2 ? -1 : 1) * (hot ? 260 : 180) * u;
      const bh = size * 1.6 * u; ctx.fillStyle = hot ? K.hot : 'rgba(20,22,27,.85)'; ctx.fillRect(-W, y - bh / 2, W * 2, bh);
      ctx.fillStyle = hot ? '#14110B' : K.ink; let x = -W + (((t * sp) % tw) + tw) % tw - tw;
      for (; x < W; x += tw) ctx.fillText(txt, x, y + 2);
    });
    ctx.restore();
    ctx.save(); ctx.globalAlpha = pop(t, .3); ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.muted; ctx.textAlign = 'center';
    ctx.fillText('PROMPT = 镜头段 + 风格段 + 约束段', W / 2, (LAND ? 110 : 330) * u); ctx.restore();
  }

  // ══ 章节 ════════════════════════════════════════════════════════════════════
  // 章节闪卡：一条图带横穿（这一章用到的图），大号章号和章名；o：{ n, of, title, en, imgs }
  function chapter(ctx, K, t, o) {
    const u = K.u, e = eOutCubic(clamp(t / .3));
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    const bh = LAND ? H * .36 : H * .22, by = H / 2 - bh / 2, n = o.imgs.length, bw = bh * 1.5;
    for (let i = 0; i < n + 2; i++) {
      const x = W - (t * 900 * u + i * (bw + 12 * u)) % ((bw + 12 * u) * (n + 2)) - bw * .2;
      cover(ctx, img(K, o.imgs[i % n]), [x, by, bw, bh], 1.05, .5, .5, .55);
    }
    ctx.fillStyle = 'rgba(13,15,18,.4)'; ctx.fillRect(0, by, W, bh);
    ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = LAND ? 'left' : 'center';
    const x0 = LAND ? 140 * u : W / 2;
    ctx.globalAlpha = e; ctx.font = `${Math.round((LAND ? 260 : 220) * u)}px ${K.num}`; ctx.fillStyle = K.hot;
    ctx.fillText(String(o.n).padStart(2, '0'), x0 + (1 - e) * -60 * u, H / 2 + 8 * u);
    ctx.font = F(K, 900, LAND ? 96 : 84); ctx.fillStyle = K.ink; ctx.textAlign = LAND ? 'left' : 'center';
    ctx.fillText(o.title, LAND ? x0 + 260 * u : W / 2, LAND ? H / 2 - 10 * u : H / 2 + bh / 2 + 90 * u);
    ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.muted;
    ctx.fillText(`${o.en} · ${o.n}/${o.of}`, LAND ? x0 + 264 * u : W / 2, LAND ? H / 2 + 62 * u : H / 2 + bh / 2 + 160 * u);
    ctx.restore();
  }

  // ══ 素材：生成的图怎么上屏 ════════════════════════════════════════════════════
  // 整屏镜头：图铺满、慢推，左下一排提示词条（镜头段 ＋ 风格段 ＋ 约束段）；o：{ img, move: { z, fx, fy }, n, size }
  function shot(ctx, K, t, o) {
    const u = K.u, m = o.move || { z: [1.02, 1.12], fx: [.5, .5], fy: [.45, .55] }, p = smooth(0, o.d || 2, t);
    cover(ctx, img(K, o.img), [0, 0, W, H], lerp(...m.z, p), lerp(...m.fx, p), lerp(...m.fy, p));
    const g = ctx.createLinearGradient(0, H * .55, 0, H); g.addColorStop(0, 'rgba(13,15,18,0)'); g.addColorStop(1, 'rgba(13,15,18,.8)'); ctx.fillStyle = g; ctx.fillRect(0, H * .55, W, H * .45);
    promptStrip(ctx, K, t, { shotName: `镜头 ${o.n} · ${o.size}`, styleName: K.names[K.v] });
    return { box: LAND ? [W * .3, H * .12, W * .4, H * .5] : [W * .1, H * .25, W * .8, H * .35], pt: [W / 2, H * .4] };
  }
  // 提示词条（整屏镜头和 15 秒片段用）：镜头段 ＋ 风格段（高亮）＋ 约束段
  function promptStrip(ctx, K, t, o) {
    const u = K.u, e = pop(t - .3, .5), x = (LAND ? 70 : 50) * u, cy = LAND ? H - 210 * u : H - 520 * u, ch = 60 * u;
    ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const items = [[o.shotName, false], ['＋', null], ['风格段：' + o.styleName, true], ['＋', null], ['约束段', false]];
    ctx.font = F(K, 700, LAND ? 28 : 30); let cx = x + (1 - e) * -30 * u;
    for (const [txt, hot] of items) {
      const tw = ctx.measureText(txt).width;
      if (hot === null) { ctx.fillStyle = K.muted; ctx.fillText(txt, cx, cy + ch / 2); cx += tw + 10 * u; continue; }
      const bw = tw + 32 * u; ctx.fillStyle = hot ? K.hot : K.chip; rr(ctx, cx, cy, bw, ch, 10 * u); ctx.fill();
      if (!hot) { ctx.strokeStyle = K.faint; ctx.lineWidth = 1.5 * u; ctx.stroke(); }
      ctx.fillStyle = hot ? '#14110B' : K.ink; ctx.fillText(txt, cx + 16 * u, cy + ch / 2 + 1); cx += bw + 10 * u;
    }
    if (!LAND && o.styleText) { ctx.fillStyle = K.muted; ctx.font = F(K, 400, 28); ctx.textBaseline = 'top'; wrapCJK(ctx, o.styleText, W - 100 * u).slice(0, 3).forEach((l, i) => ctx.fillText(l, x, cy + ch + 26 * u + i * 42 * u)); }
    ctx.restore();
  }
  // 镜头卡：分镜表里的一格——图 + 镜头号、景别、时长、镜头段原文；o：{ img, n, size, dur }
  function shotCard(ctx, K, t, o) {
    const u = K.u, A = area(K), e = pop(t, .45), s = K.Pr.shots.find(q => q.id === o.img);
    const cw = LAND ? A[2] * .9 : A[2], chh = LAND ? A[3] * .86 : A[3] * .9, cx = A[0] + (A[2] - cw) / 2, cy = A[1] + (A[3] - chh) / 2 + (1 - e) * 40 * u;
    ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.paper; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40 * u; rr(ctx, cx, cy, cw, chh, 10 * u); ctx.fill(); ctx.restore();
    const pad = 28 * u, ir = LAND ? [cx + pad, cy + pad, cw * .56, chh - pad * 2] : [cx + pad, cy + pad, cw - pad * 2, (cw - pad * 2) * .66];
    cover(ctx, img(K, o.img), ir, 1.04 + .04 * smooth(0, 2, t), .5, .5, e);
    const tx = LAND ? ir[0] + ir[2] + pad : cx + pad, ty = LAND ? cy + pad : ir[1] + ir[3] + pad, tw = LAND ? cw - ir[2] - pad * 3 : cw - pad * 2;
    ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#1A1612';
    ctx.font = `${Math.round(110 * u)}px ${K.num}`; ctx.fillText('SHOT ' + String(o.n).padStart(2, '0'), tx, ty);
    const fields = [['景别', o.size], ['时长', o.dur], ['画风', K.names[K.v]]];
    fields.forEach(([k, v], i) => {
      const yy = ty + 120 * u + i * 46 * u, q = pop(t - .25 - i * .12, .35); ctx.globalAlpha = e * q;
      ctx.font = F(K, 700, 22, K.mono); ctx.fillStyle = 'rgba(26,22,18,.55)'; ctx.fillText(k, tx, yy + 4 * u);
      ctx.font = F(K, 900, 30); ctx.fillStyle = i === 2 ? '#B9700E' : '#1A1612'; ctx.fillText(v, tx + 80 * u, yy);
    });
    ctx.globalAlpha = e * pop(t - .6, .4); ctx.font = F(K, 400, 24); ctx.fillStyle = 'rgba(26,22,18,.8)';
    const body = s.prompt.replace(/^镜头 \d+，[^：]*：/, '');
    wrapCJK(ctx, body, tw).slice(0, LAND ? 5 : 3).forEach((l, i) => ctx.fillText(l, tx, ty + 270 * u + i * 36 * u));
    ctx.restore();
    return { box: ir, pt: [ir[0] + ir[2] * .7, ir[1] + ir[3] * .4] };
  }
  // 分屏：两张图左右（竖屏上下）对开，中间一道线；o：{ imgs: [a, b], labels }
  function split(ctx, K, t, o) {
    const u = K.u, e = eInOutCubic(clamp(t / .6)), g = 8 * u;
    const r = LAND ? [[0, 0, W / 2 - g / 2, H], [W / 2 + g / 2, 0, W / 2 - g / 2, H]] : [[0, 0, W, H / 2 - g / 2], [0, H / 2 + g / 2, W, H / 2 - g / 2]];
    r.forEach((q, i) => {
      const off = (1 - e) * (i ? 1 : -1) * (LAND ? W / 2 : H / 2), qq = LAND ? [q[0] + off, q[1], q[2], q[3]] : [q[0], q[1] + off, q[2], q[3]];
      cover(ctx, img(K, o.imgs[i]), qq, 1.06 + .04 * smooth(0, 2, t), .5, .5);
      tagAt(ctx, K, qq[0] + 30 * u, qq[1] + qq[3] - (LAND ? 160 : 90) * u, o.labels[i], i === 1, pop(t - .5 - i * .15, .3), 26);
    });
    ctx.fillStyle = K.hot; if (LAND) ctx.fillRect(W / 2 - 2 * u, H * (1 - e) / 2, 4 * u, H * e); else ctx.fillRect(W * (1 - e) / 2, H / 2 - 2 * u, W * e, 4 * u);
  }
  // 胶片条：一条带齿孔的胶片横穿画面（竖屏竖穿），每格一张图、标镜头号；o：{ imgs, labels }
  function filmstrip(ctx, K, t, o) {
    const u = K.u, n = o.imgs.length, fh = LAND ? H * .42 : W * .5, fw = fh * 1.5, gap = 18 * u, len = n * (fw + gap);
    ctx.save();
    if (!LAND) { ctx.translate(W / 2, H / 2); ctx.rotate(Math.PI / 2); ctx.translate(-H / 2, -W / 2); }
    const SW_ = LAND ? W : H, SH_ = LAND ? H : W, y = SH_ / 2 - fh / 2, off = lerp(SW_ * .15, SW_ - len - SW_ * .1, eInOutCubic(clamp(t / 1.7)));
    ctx.fillStyle = '#08090B'; ctx.fillRect(0, y - 56 * u, SW_, fh + 112 * u);
    for (let x = ((off % (34 * u)) + 34 * u) % (34 * u) - 34 * u; x < SW_; x += 34 * u) { ctx.fillStyle = 'rgba(241,234,219,.75)'; rr(ctx, x, y - 42 * u, 18 * u, 24 * u, 4 * u); ctx.fill(); rr(ctx, x, y + fh + 18 * u, 18 * u, 24 * u, 4 * u); ctx.fill(); }
    o.imgs.forEach((id, i) => {
      const x = off + i * (fw + gap); if (x > SW_ || x + fw < 0) return;
      ctx.save(); ctx.translate(x + fw / 2, y + fh / 2); if (!LAND) ctx.rotate(-Math.PI / 2);
      const ww = LAND ? fw : fh, hh = LAND ? fh : fw;
      cover(ctx, img(K, id), [-ww / 2, -hh / 2, ww, hh], 1.05);
      ctx.font = F(K, 700, 22, K.mono); ctx.fillStyle = K.hot; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(o.labels[i], -ww / 2 + 14 * u, -hh / 2 + 12 * u);
      ctx.restore();
    });
    ctx.restore();
  }
  // 宫格：一张联系表，一拍点亮一格，最后一格描强调色；o：{ imgs, kicker, title }
  function grid(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), n = o.imgs.length, cols = LAND ? 4 : 2, rows = Math.ceil(n / cols), g = 16 * u;
    const ch = Math.min((A[1] + A[3] - y0 - g * (rows - 1)) / rows, (A[2] - g * (cols - 1)) / cols / 1.5), cw = ch * 1.5, x0 = A[0] + (A[2] - cols * cw - (cols - 1) * g) / 2;
    o.imgs.forEach((id, i) => {
      const e = pop(t - .25 - i * .09, .35), x = x0 + (i % cols) * (cw + g), y = y0 + Math.floor(i / cols) * (ch + g);
      ctx.save(); ctx.globalAlpha = e; ctx.translate(0, (1 - e) * 30 * u);
      cover(ctx, img(K, id), [x, y, cw, ch], 1.04);
      const on = i === (o.hot ?? n - 1) && t > .25 + n * .09;
      ctx.lineWidth = (on ? 5 : 1.5) * u; ctx.strokeStyle = on ? K.hot : K.faint; ctx.strokeRect(x, y, cw, ch);
      ctx.font = F(K, 700, 18, K.mono); ctx.fillStyle = K.ink; ctx.textBaseline = 'top'; ctx.fillText(id.toUpperCase(), x + 8 * u, y + 6 * u);
      ctx.restore();
    });
  }
  // 放大镜：整张图上一个圆形放大镜移到细节处；o：{ img, from: [a, b], at: [a, b], zoom, label }
  function loupe(ctx, K, t, o) {
    const u = K.u, map = cover(ctx, img(K, o.img), [0, 0, W, H], 1.04);
    ctx.fillStyle = 'rgba(13,15,18,.35)'; ctx.fillRect(0, 0, W, H);
    const p = eInOutCubic(clamp((t - .2) / .9)), a = lerp(o.from[0], o.at[0], p), b = lerp(o.from[1], o.at[1], p), [cx, cy] = map(a, b), R = (LAND ? 230 : 210) * u * pop(t, .4), z = o.zoom || 2.6;
    if (R < 2) return;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); cover(ctx, img(K, o.img), [0, 0, W, H], 1.04); ctx.restore();
    ctx.lineWidth = 8 * u; ctx.strokeStyle = K.ink; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.lineWidth = 16 * u; ctx.strokeStyle = '#2A2520'; ctx.beginPath(); ctx.moveTo(cx + R * .72, cy + R * .72); ctx.lineTo(cx + R * 1.2, cy + R * 1.2); ctx.stroke();
    tagAt(ctx, K, cx - R, cy - R - 60 * u, o.label + ' ×' + z, true, pop(t - 1, .3), 24);
    return { box: [cx - R, cy - R, R * 2, R * 2], pt: [cx, cy] };
  }
  // 笔刷显影：几道斜的宽笔刷依次扫过，扫过的地方露出图（底下是当前画风的底纹）；o：{ img, label }
  function reveal(ctx, K, t, o) {
    const u = K.u, n = 6, bh = Math.hypot(W, H) / n * 1.15;
    ctx.save(); ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = eInOutCubic(clamp((t - i * .14) / .5)); if (p <= 0) continue;
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.35); const L = Math.hypot(W, H) * 1.2, y = -Math.hypot(W, H) / 2 + i * bh * .9;
      ctx.rect(i % 2 ? L / 2 - L * p : -L / 2, y, L * p, bh); ctx.restore();
    }
    ctx.clip(); cover(ctx, img(K, o.img), [0, 0, W, H], 1.06 + .03 * smooth(0, 2, t)); ctx.restore();
    tagAt(ctx, K, (LAND ? 70 : 50) * u, H - (LAND ? 210 : 520) * u, o.label, true, pop(t - 1, .3), 26);
  }
  // 照片堆：几张冲印出来的图依次落到桌上，微微转角，最后一张压在最上面；o：{ imgs }
  function stack(ctx, K, t, o) {
    const u = K.u, n = o.imgs.length, pw = (LAND ? 620 : 640) * u, ph = pw * .72;
    o.imgs.forEach((id, i) => {
      const lt = t - i * .28, e = eOutCubic(clamp(lt / .4)); if (lt < 0) return;
      const ang = (hash1(i + 3) - .5) * .32, cx = W / 2 + (i - (n - 1) / 2) * (LAND ? 300 : 120) * u, cy = H / 2 + (LAND ? 0 : (i - (n - 1) / 2) * 240 * u) - (1 - e) * H * .6;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang * e + (1 - e) * .6); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30 * u; ctx.shadowOffsetY = 14 * u;
      ctx.fillStyle = K.paper; ctx.fillRect(-pw / 2 - 18 * u, -ph / 2 - 18 * u, pw + 36 * u, ph + 80 * u); ctx.shadowColor = 'transparent';
      cover(ctx, img(K, id), [-pw / 2, -ph / 2, pw, ph], 1.03);
      ctx.font = F(K, 700, 22, K.mono); ctx.fillStyle = 'rgba(26,22,18,.7)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(`${id.toUpperCase()} · ${K.names[K.v]}`, -pw / 2, ph / 2 + 32 * u); ctx.restore();
    });
  }
  // 画风并排：同一个镜头的几种画风并排，当前这一种放大亮起；o：{ img, title, sub }
  function lineup(ctx, K, t, o) {
    const u = K.u, ks = Object.keys(K.ALL), n = ks.length;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = pop(t, .5);
    ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 60 : 62); ctx.fillText(o.title, W / 2, (LAND ? 210 : 380) * u);
    ctx.fillStyle = K.muted; ctx.font = F(K, 400, 30); ctx.fillText(o.sub, W / 2, (LAND ? 270 : 450) * u); ctx.restore();
    ks.forEach((k, i) => {
      const e = pop(t - .2 - i * K.beat * .4, .5);
      let w, h, x, y;
      if (LAND) { w = (W - 240 * u - 2 * 40 * u) / n; h = w * .66; x = 120 * u + i * (w + 40 * u); y = H * .36; }
      else { w = W - 280 * u; h = w * .62; x = 140 * u; y = 540 * u + i * (h + 76 * u); }
      const on = k === K.v, z = on ? lerp(1, 1.06, eOutBack(clamp((t - .9) / .5))) : 1, cx = x + w / 2, cy = y + h / 2;
      ctx.save(); ctx.globalAlpha = e * (on ? 1 : lerp(1, .45, smooth(.8, 1.2, t)));
      ctx.translate(cx, cy + (1 - e) * 40 * u); ctx.scale(z, z); ctx.translate(-cx, -cy);
      cover(ctx, K.ALL[k][o.img], [x, y, w, h]);
      ctx.lineWidth = (on ? 5 : 1.5) * u; ctx.strokeStyle = on ? K.hot : K.faint; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = on ? K.hot : K.ink; ctx.font = F(K, on ? 900 : 700, 32); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(K.names[k], cx, y + h + 16 * u); ctx.restore();
    });
  }
  // 画风滑杆：同一个镜头，左边当前画风、右边另一种，竖滑杆来回扫；o：{ img }
  function swap(ctx, K, t, o) {
    const u = K.u, ks = Object.keys(K.ALL), other = ks[(ks.indexOf(K.v) + 1) % ks.length];
    const p = .5 + .32 * Math.sin(eInOutCubic(clamp(t / 1.7)) * TAU * .75 + Math.PI / 2) * smooth(0, .4, t), x = W * p;
    cover(ctx, K.ALL[other][o.img], [0, 0, W, H], 1.04);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, x, H); ctx.clip(); cover(ctx, K.I[o.img], [0, 0, W, H], 1.04); ctx.restore();
    ctx.fillStyle = K.ink; ctx.fillRect(x - 3 * u, 0, 6 * u, H);
    ctx.beginPath(); ctx.arc(x, H / 2, 34 * u, 0, TAU); ctx.fill(); ctx.fillStyle = K.bg; ctx.font = F(K, 900, 30); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⇆', x, H / 2 + 2);
    tagAt(ctx, K, 40 * u, (LAND ? 120 : 260) * u, K.names[K.v], true, 1, 26);
    ctx.font = F(K, 700, 26, K.mono); const ow = ctx.measureText(K.names[other]).width + 24 * u; tagAt(ctx, K, W - 40 * u - ow, (LAND ? 120 : 260) * u, K.names[other], false, 1, 26);
    return { box: [x - 120 * u, H * .2, 240 * u, H * .6], pt: [x, H / 2] };
  }
  // 构图取景：三分线一条条画上来，下方三分之一压暗、标「留白」（约束段写的构图）；o：{ img, label }
  function crop(ctx, K, t, o) {
    const u = K.u; cover(ctx, img(K, o.img), [0, 0, W, H], 1.03);
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2 * u;
    [[1 / 3, 0], [2 / 3, 0], [1 / 3, 1], [2 / 3, 1]].forEach(([f, horiz], i) => {
      const p = eInOutCubic(clamp((t - i * .12) / .45)); ctx.beginPath();
      if (horiz) { ctx.moveTo(0, H * f); ctx.lineTo(W * p, H * f); } else { ctx.moveTo(W * f, 0); ctx.lineTo(W * f, H * p); }
      ctx.stroke();
    });
    const e = smooth(.6, 1, t); ctx.fillStyle = `rgba(13,15,18,${.55 * e})`; ctx.fillRect(0, H * 2 / 3, W, H / 3);
    ctx.strokeStyle = K.hot; ctx.lineWidth = 4 * u; ctx.globalAlpha = e; ctx.strokeRect(6 * u, 6 * u, W - 12 * u, H * 2 / 3 - 12 * u);
    ctx.restore();
    tagAt(ctx, K, 30 * u, H * 2 / 3 + 30 * u, o.label, true, e, 26);
    return { box: [W * .2, H * .12, W * .6, H * .45], pt: [W / 2, H / 3] };
  }

  // ══ 数据：这套图真实的生成记录（K.G）和图的像素 ══════════════════════════════════
  // 大数字：数到总张数，下面一条按画风分段的条；o：{ kicker, title, label }
  function bigNumber(ctx, K, t, o) {
    const u = K.u, A = area(K), S = stats(K), y0 = header(ctx, K, t, o, A), v = Math.round(S.n * eOutCubic(clamp((t - .2) / .9)));
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = `${Math.round((LAND ? 300 : 280) * u)}px ${K.num}`; ctx.fillStyle = K.hot;
    const yN = y0 + (LAND ? 250 : 260) * u; ctx.fillText(v, A[0], yN); const nw = ctx.measureText(String(S.n)).width;
    ctx.font = F(K, 900, 56); ctx.fillStyle = K.ink; ctx.fillText('张图', A[0] + nw + 20 * u, yN - 10 * u);
    ctx.font = F(K, 400, 28); ctx.fillStyle = K.muted; ctx.fillText(o.label, A[0], yN + 60 * u);
    const bw = LAND ? A[2] * .9 : A[2], by = yN + 100 * u, per = S.styles.map(st => K.G.items.filter(g => g.style === st).length);
    let x = A[0]; per.forEach((c, i) => {
      const w = bw * c / S.n * smooth(.3 + i * .15, .8 + i * .15, t), on = S.styles[i] === K.v;
      ctx.fillStyle = on ? K.hot : 'rgba(247,244,238,.3)'; ctx.fillRect(x, by, Math.max(0, w - 6 * u), 20 * u);
      ctx.font = F(K, 700, 22, K.mono); ctx.fillStyle = on ? K.hot : K.muted; ctx.fillText(`${K.names[S.styles[i]]} ${c}`, x, by + 54 * u); x += bw * c / S.n;
    });
    ctx.restore();
  }
  // 翻牌：每张平均几秒，三位数字逐位翻到；o：{ kicker, title, unit, label }
  function flip(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), S = stats(K), val = String(Math.round(S.sec)), n = val.length;
    const cw = (LAND ? 170 : 180) * u, ch = cw * 1.45, gap = 20 * u, x0 = LAND ? A[0] : W / 2 - (n * cw + (n - 1) * gap) / 2, y = y0 + 20 * u;
    for (let i = 0; i < n; i++) {
      const target = +val[i], st = .2 + i * .18, k = clamp((t - st) / .7), cur = Math.floor(k * (target + 10)) % 10, ph = (k * (target + 10)) % 1;
      const x = x0 + i * (cw + gap), dg = k >= 1 ? target : cur;
      ctx.fillStyle = '#1B1D22'; rr(ctx, x, y, cw, ch, 12 * u); ctx.fill();
      ctx.save(); ctx.beginPath(); rr(ctx, x, y, cw, ch, 12 * u); ctx.clip();
      ctx.font = `${Math.round(ch * .9)}px ${K.num}`; ctx.fillStyle = K.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const sq = k >= 1 ? 1 : Math.abs(Math.cos(ph * Math.PI)); ctx.translate(x + cw / 2, y + ch / 2); ctx.scale(1, Math.max(.05, sq)); ctx.fillText(dg, 0, 6 * u); ctx.restore();
      ctx.fillStyle = K.bg; ctx.fillRect(x, y + ch / 2 - 2 * u, cw, 4 * u);
    }
    ctx.save(); ctx.font = F(K, 900, 56); ctx.fillStyle = K.hot; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(o.unit, x0 + n * (cw + gap), y + ch - 16 * u); ctx.font = F(K, 400, 28); ctx.fillStyle = K.muted; ctx.globalAlpha = pop(t - .9, .3);
    ctx.fillText(o.label, LAND ? x0 : A[0], y + ch + 56 * u); ctx.restore();
  }
  // 柱状图：三种画风平均每张用时，当前画风的柱子是强调色；o：{ kicker, title, unit }
  function bars(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), S = stats(K), max = Math.max(...S.bySec) * 1.15, n = S.styles.length;
    const base = A[1] + A[3] - 50 * u, top = y0 + 50 * u, bw = Math.min(200 * u, A[2] / n * .5), gap = (A[2] - bw * n) / (n + 1);
    ctx.strokeStyle = K.faint; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(A[0], base); ctx.lineTo(A[0] + A[2], base); ctx.stroke();
    S.styles.forEach((st, i) => {
      const e = eOutCubic(clamp((t - .2 - i * .12) / .55)), h = (base - top) * S.bySec[i] / max * e, x = A[0] + gap + i * (bw + gap), on = st === K.v;
      ctx.fillStyle = on ? K.hot : 'rgba(247,244,238,.35)'; ctx.fillRect(x, base - h, bw, h);
      ctx.font = `${Math.round(54 * u)}px ${K.num}`; ctx.fillStyle = on ? K.hot : K.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText((S.bySec[i] * e).toFixed(0) + o.unit, x + bw / 2, base - h - 12 * u);
      ctx.font = F(K, 700, 28); ctx.fillStyle = on ? K.hot : K.muted; ctx.textBaseline = 'top'; ctx.fillText(K.names[st], x + bw / 2, base + 12 * u);
    });
  }
  // 折线：从开始批量生成算起，完成的张数怎么涨上去；当前画风的那些点是强调色；o：{ kicker, title }
  function progress(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), S = stats(K), G = [...K.G.items].filter(g => g.end != null).sort((a, b) => a.end - b.end);
    const x0 = A[0] + 70 * u, x1 = A[0] + A[2], yb = A[1] + A[3] - 40 * u, yt = y0 + 20 * u, tm = Math.ceil(S.end / 300) * 300, p = eInOutCubic(clamp((t - .15) / 1.1));
    const X = s => lerp(x0, x1, s / tm), Y = k => lerp(yb, yt, k / S.n);
    ctx.save(); ctx.strokeStyle = K.faint; ctx.lineWidth = 1.5 * u; ctx.font = F(K, 400, 20, K.mono); ctx.fillStyle = K.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let m = 0; m <= tm; m += 300) { ctx.beginPath(); ctx.moveTo(X(m), yt); ctx.lineTo(X(m), yb); ctx.stroke(); ctx.fillText(`${m / 60} 分`, X(m), yb + 10 * u); }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; [0, 25, 50].forEach(k => ctx.fillText(k, x0 - 14 * u, Y(k)));
    ctx.beginPath(); ctx.rect(x0 - 10 * u, yt - 20 * u, (x1 - x0) * p + 20 * u, yb - yt + 40 * u); ctx.clip();
    ctx.strokeStyle = K.ink; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.moveTo(X(0), Y(0));
    G.forEach((g, i) => { ctx.lineTo(X(g.end), Y(i)); ctx.lineTo(X(g.end), Y(i + 1)); }); ctx.stroke();
    G.forEach((g, i) => { if (g.style !== K.v) return; ctx.fillStyle = K.hot; ctx.beginPath(); ctx.arc(X(g.end), Y(i + 1), 7 * u, 0, TAU); ctx.fill(); });
    ctx.restore();
    const q = pop(t - 1.1, .3); ctx.save(); ctx.globalAlpha = q; ctx.font = `${Math.round(64 * u)}px ${K.num}`; ctx.fillStyle = K.hot; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${S.n} 张 · ${(S.end / 60).toFixed(0)} 分钟`, x0 + 24 * u, yt + 50 * u); ctx.restore();
  }
  // 占比环：51 张图进仓库的体积按画风分，当前画风一段弹出；o：{ kicker, title }
  function ring(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), S = stats(K), tot = S.byKb.reduce((a, b) => a + b, 0);
    const R = Math.min(A[2] * (LAND ? .2 : .36), (A[1] + A[3] - y0) * .42), cx = LAND ? A[0] + R + 20 * u : W / 2, cy = y0 + R + 20 * u, p = eInOutCubic(clamp((t - .15) / .8));
    let a0 = -Math.PI / 2;
    S.styles.forEach((st, i) => {
      const a = TAU * S.byKb[i] / tot * p, on = st === K.v, mid = a0 + a / 2, off = on ? 18 * u * smooth(.9, 1.2, t) : 0;
      ctx.strokeStyle = on ? K.hot : ['rgba(247,244,238,.55)', 'rgba(247,244,238,.3)', 'rgba(247,244,238,.18)'][i % 3]; ctx.lineWidth = R * .34;
      ctx.beginPath(); ctx.arc(cx + Math.cos(mid) * off, cy + Math.sin(mid) * off, R, a0 + .01, a0 + a - .01); ctx.stroke(); a0 += a;
    });
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${Math.round(R * .42)}px ${K.num}`; ctx.fillStyle = K.ink; ctx.fillText((tot / 1024 * p).toFixed(1), cx, cy - 6 * u);
    ctx.font = F(K, 700, 22, K.mono); ctx.fillStyle = K.muted; ctx.fillText('MB', cx, cy + R * .26); ctx.restore();
    const lx = LAND ? cx + R * 1.6 : A[0], ly = LAND ? cy - 80 * u : cy + R * 1.35;
    S.styles.forEach((st, i) => {
      const on = st === K.v, y = ly + i * 70 * u; ctx.save(); ctx.globalAlpha = pop(t - .6 - i * .1, .3);
      ctx.fillStyle = on ? K.hot : K.ink; ctx.font = F(K, on ? 900 : 700, 34); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(`${K.names[st]}  ${(S.byKb[i] / 1024).toFixed(2)} MB · ${Math.round(S.byKb[i] / tot * 100)}%`, lx, y); ctx.restore();
    });
  }
  // 排名：用时最长的 5 张，一条条滑进来；当前画风的行是强调色；o：{ kicker, title, top }
  function rank(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), top = [...K.G.items].sort((a, b) => b.sec - a.sec).slice(0, o.top || 5), max = top[0].sec;
    const rh = Math.min(84 * u, (A[1] + A[3] - y0) / top.length), lw = (LAND ? 300 : 260) * u;
    top.forEach((g, i) => {
      const e = eOutCubic(clamp((t - .2 - i * .1) / .45)), y = y0 + i * rh, on = g.style === K.v, bw = (A[2] - lw - 150 * u) * g.sec / max * e;
      ctx.save(); ctx.globalAlpha = e; ctx.translate((1 - e) * -40 * u, 0);
      ctx.font = `${Math.round(44 * u)}px ${K.num}`; ctx.fillStyle = on ? K.hot : K.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(i + 1, A[0], y + rh / 2);
      ctx.font = F(K, 700, 28); ctx.fillStyle = on ? K.hot : K.ink; ctx.fillText(`${K.names[g.style]} · ${g.shot.toUpperCase()}`, A[0] + 50 * u, y + rh / 2);
      ctx.fillStyle = on ? K.hot : 'rgba(247,244,238,.35)'; ctx.fillRect(A[0] + lw, y + rh * .28, bw, rh * .44);
      ctx.font = F(K, 700, 24, K.mono); ctx.fillStyle = K.ink; ctx.fillText(`${g.sec.toFixed(0)} 秒`, A[0] + lw + bw + 12 * u, y + rh / 2); ctx.restore();
    });
  }
  // 热力格：16 个镜头 × 3 种画风，每格的颜色深浅是那张图的用时；当前画风那一行描边；o：{ kicker, title }
  function heat(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), S = stats(K), shots = K.Pr.shots.map(s => s.id), max = Math.max(...K.G.items.map(g => g.sec));
    const rowsN = LAND ? S.styles.length : shots.length, colsN = LAND ? shots.length : S.styles.length, lw = LAND ? 150 * u : 0, th = LAND ? 0 : 44 * u;
    const cw = (A[2] - lw) / colsN, chh = Math.min(LAND ? 120 * u : 54 * u, (A[1] + A[3] - y0 - th) / rowsN), g2 = 4 * u;
    S.styles.forEach((st, si) => shots.forEach((sh, hi) => {
      const g = K.G.items.find(q => q.style === st && q.shot === sh); if (!g) return;
      const r = LAND ? si : hi, c = LAND ? hi : si, e = pop(t - .15 - (r + c) * .035, .3), k = g.sec / max;
      ctx.fillStyle = `rgba(255,181,71,${(.12 + .88 * k) * e})`; ctx.fillRect(A[0] + lw + c * cw + g2 / 2, y0 + th + r * chh + g2 / 2, cw - g2, chh - g2);
    }));
    ctx.save(); ctx.font = F(K, 700, LAND ? 26 : 22); ctx.textBaseline = 'middle';
    S.styles.forEach((st, si) => {
      const on = st === K.v; ctx.fillStyle = on ? K.hot : K.muted;
      if (LAND) { ctx.textAlign = 'left'; ctx.fillText(K.names[st], A[0], y0 + (si + .5) * chh); if (on) { ctx.strokeStyle = K.ink; ctx.lineWidth = 3 * u; ctx.strokeRect(A[0] + lw, y0 + si * chh, cw * colsN, chh); } }
      else { ctx.textAlign = 'center'; ctx.fillText(K.names[st], A[0] + (si + .5) * cw, y0 + th / 2); if (on) { ctx.strokeStyle = K.ink; ctx.lineWidth = 3 * u; ctx.strokeRect(A[0] + si * cw, y0 + th, cw, chh * rowsN); } }
    });
    ctx.globalAlpha = pop(t - .9, .3); ctx.font = F(K, 400, 22, K.mono); ctx.fillStyle = K.muted; ctx.textAlign = 'left';
    ctx.fillText(`颜色越深用时越长 · 最长 ${max.toFixed(0)} 秒`, A[0] + lw, y0 + th + rowsN * chh + 30 * u); ctx.restore();
  }
  // 仪表盘：素材合计用掉 10 MB 上限的多少；o：{ kicker, title, limit, label }
  function gauge(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), S = stats(K), mb = S.kb / 1024, lim = o.limit || 10, p = eInOutCubic(clamp((t - .2) / .9)) * mb / lim;
    const R = Math.min(A[2] * (LAND ? .26 : .42), (A[1] + A[3] - y0) * .7), cx = W / 2, cy = y0 + R + 10 * u;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 28 * u; ctx.strokeStyle = K.faint; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, TAU); ctx.stroke();
    ctx.strokeStyle = K.hot; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * p); ctx.stroke();
    const a = Math.PI + Math.PI * p; ctx.strokeStyle = K.ink; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * .8, cy + Math.sin(a) * R * .8); ctx.stroke();
    ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(cx, cy, 14 * u, 0, TAU); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = `${Math.round(R * .38)}px ${K.num}`; ctx.fillText((p * lim).toFixed(1) + ' / ' + lim + ' MB', cx, cy + R * .42);
    ctx.font = F(K, 400, 26); ctx.fillStyle = K.muted; ctx.fillText(o.label, cx, cy + R * .42 + 50 * u); ctx.restore();
  }
  // 对比：两个数并排，中间一道线分开；o：{ kicker, title, a: { v, label }, b: { v, label } } 不写 v 时取生成记录（一次就成 / 重试才成）
  function versus(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), S = stats(K);
    const items = [{ v: S.n - S.fails, label: o.a.label }, { v: S.fails, label: o.b.label }];
    items.forEach((it, i) => {
      const e = eOutCubic(clamp((t - .2 - i * .2) / .6)), cx = LAND ? A[0] + A[2] * (i ? .75 : .25) : W / 2, cy = LAND ? y0 + (A[1] + A[3] - y0) * .45 : y0 + (i ? .72 : .26) * (A[1] + A[3] - y0);
      ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.font = `${Math.round((LAND ? 240 : 220) * u)}px ${K.num}`; ctx.fillStyle = i ? K.hot : K.ink; ctx.fillText(Math.round(it.v * e), cx, cy + 60 * u);
      ctx.font = F(K, 700, 32); ctx.fillStyle = K.muted; ctx.fillText(it.label, cx, cy + 120 * u); ctx.restore();
    });
    ctx.save(); ctx.globalAlpha = pop(t - .4, .3); ctx.font = F(K, 900, 46); ctx.fillStyle = K.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('VS', W / 2, LAND ? y0 + (A[1] + A[3] - y0) * .38 : y0 + .5 * (A[1] + A[3] - y0)); ctx.restore();
    ctx.save(); ctx.globalAlpha = pop(t - 1, .3); ctx.font = F(K, 400, 24, K.mono); ctx.fillStyle = K.muted; ctx.textAlign = 'center';
    ctx.fillText(`${S.calls} 次调用 · 失败 ${S.fails} 次，重试都成了`, W / 2, A[1] + A[3]); ctx.restore();
  }
  // 散点：每张图的提示词字数（横）和用时（纵），当前画风的点是强调色；o：{ kicker, title }
  function scatter(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), G = K.G.items.filter(g => g.shot !== 'tex');   // 底纹的提示词另一种写法，不放一起比
    const len = g => promptOf(K, g.shot, g.style).join('').length;
    const xs = G.map(len), lo = Math.min(...xs) - 10, hi = Math.max(...xs) + 10, my = Math.max(...G.map(g => g.sec)) * 1.1;
    const x0 = A[0] + 60 * u, x1 = A[0] + A[2], yb = A[1] + A[3] - 40 * u, yt = y0 + 10 * u, X = v => lerp(x0, x1, (v - lo) / (hi - lo)), Y = v => lerp(yb, yt, v / my);
    ctx.save(); ctx.strokeStyle = K.faint; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(x0, yt); ctx.lineTo(x0, yb); ctx.lineTo(x1, yb); ctx.stroke();
    ctx.font = F(K, 400, 20, K.mono); ctx.fillStyle = K.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('提示词字数 →', x1, yb + 8 * u);
    ctx.textAlign = 'left'; ctx.fillText('↑ 用时（秒）', x0 + 8 * u, yt);
    G.forEach((g, i) => {
      const e = pop(t - .2 - hash1(i) * .7, .25), on = g.style === K.v; if (e <= 0) return;
      ctx.globalAlpha = e; ctx.fillStyle = on ? K.hot : 'rgba(247,244,238,.45)'; ctx.beginPath(); ctx.arc(X(xs[i]), Y(g.sec), (on ? 9 : 6) * u * e, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  // 色板：从当前画风这张图的像素里取 6 个主色，一格格亮出来并写色值；o：{ img, kicker, title }
  function palColors(ctx, K, t, o) {
    const u = K.u, A = area(K), im = img(K, o.img), cols = palette(im);
    const ir = LAND ? [A[0], A[1] + 20 * u, A[2] * .45, A[2] * .45 * .66] : [A[0], A[1], A[2], A[2] * .6];
    cover(ctx, im, ir, 1.02, .5, .5, pop(t, .3));
    const hx = LAND ? A[0] + A[2] * .5 : A[0], hy = LAND ? A[1] : ir[1] + ir[3] + 40 * u, hw = LAND ? A[2] * .5 : A[2];
    const yy = header(ctx, K, t, o, [hx, hy, hw]), n = cols.length, sw = LAND ? hw / 3 - 12 * u : hw / 3 - 12 * u, sh = LAND ? 110 * u : 120 * u;
    cols.forEach((c, i) => {
      const e = pop(t - .3 - i * .08, .3), x = hx + (i % 3) * (sw + 12 * u), y = yy + Math.floor(i / 3) * (sh + 56 * u);
      ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = rgba(c, 1); rr(ctx, x, y + (1 - e) * 20 * u, sw, sh, 10 * u); ctx.fill();
      ctx.font = F(K, 700, 22, K.mono); ctx.fillStyle = K.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(hex(c), x, y + sh + 10 * u); ctx.restore();
    });
  }

  // ══ 讲述 ════════════════════════════════════════════════════════════════════
  // 提示词公式：「镜头段 ＋ 风格段 ＋ 约束段」三块依次落下，风格段亮起；o：{ title, img, styleName? }
  function formula(ctx, K, t, o) {
    const u = K.u, im = o.img ? img(K, o.img) : null;
    if (im) { ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H); cover(ctx, im, [0, 0, W, H], 1.15, .5, .5, .22); }
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const x0 = (LAND ? 120 : 60) * u, yT = (LAND ? 250 : 420) * u;
    ctx.globalAlpha = pop(t, .5); ctx.fillStyle = K.muted; ctx.font = F(K, 700, 30, K.mono); ctx.fillText('PROMPT =', x0, yT - (LAND ? 90 : 100) * u);
    ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 72 : 76); ctx.fillText(o.title, x0, yT);
    ctx.restore();
    const plus = 48 * u, n = 3, sid = o.shot || 's1', shotText = K.Pr.shots.find(s => s.id === sid).prompt;
    const parts = [['镜头段 · 每个镜头一段', shotText, false], ['风格段 · 只换这一段', K.Pr.styles[K.v], true], ['约束段 · 全片共用', K.Pr.rules, false]];
    const sp = o.every || K.beat * .5, hotAt = .35 + 2 * sp + .3;
    parts.forEach(([name, text, hot], i) => {
      const e = pop(t - .35 - i * sp, .45), lift = (1 - e) * 40 * u;
      let x, y, w, h;
      if (LAND) { w = (W - x0 * 2 - plus * 2) / n; h = 300 * u; x = x0 + i * (w + plus); y = yT + 70 * u; }
      else { w = W - x0 * 2; h = 180 * u; x = x0; y = yT + 70 * u + i * (h + plus); }
      const glow = hot ? .5 + .5 * Math.sin(TAU * (t - hotAt) * 1.5) * smooth(hotAt, hotAt + .2, t) : 0;
      chip(ctx, K, x, y + lift, w, h, name, text, hot && t > hotAt, e, glow);
      if (i < n - 1) { ctx.save(); ctx.globalAlpha = pop(t - .5 - i * sp, .4); ctx.fillStyle = K.muted; ctx.font = F(K, 300, 54); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+', LAND ? x + w + plus / 2 : W / 2, LAND ? y + h / 2 : y + h + plus / 2); ctx.restore(); }
    });
    const e = pop(t - hotAt, .4), yS = LAND ? yT + 70 * u + 300 * u + 90 * u : yT + 70 * u + 3 * 180 * u + 2 * plus + 110 * u;
    ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'left'; ctx.fillStyle = K.hot; ctx.font = F(K, 900, 52); ctx.fillText('画风：' + (o.styleName || K.names[K.v]), x0, yS); ctx.restore();
  }
  // 一句话：当前画风的风格段原文做成大字引用；o：{ who }
  function quote(ctx, K, t, o) {
    const u = K.u, A = area(K), text = K.Pr.styles[K.v];
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = `${Math.round(220 * u)}px Georgia, serif`; ctx.fillStyle = K.hot; ctx.globalAlpha = pop(t, .3); ctx.fillText('“', A[0] - 10 * u, A[1] + 150 * u);
    ctx.font = F(K, 900, LAND ? 58 : 56); ctx.fillStyle = K.ink; const lh = (LAND ? 82 : 80) * u, ls = wrapCJK(ctx, text, A[2] * (LAND ? .86 : 1));
    const y0 = A[1] + 140 * u + (LAND ? 0 : 60 * u);
    ls.forEach((l, i) => { const e = pop(t - .15 - i * .12, .4); ctx.globalAlpha = e; ctx.fillText(l, A[0] + (1 - e) * 30 * u, y0 + i * lh + lh); });
    ctx.globalAlpha = pop(t - .7, .3); ctx.font = F(K, 700, 28, K.mono); ctx.fillStyle = K.hot; ctx.fillText(`—— ${o.who} · ${K.names[K.v]}`, A[0], y0 + ls.length * lh + lh + 60 * u);
    ctx.restore();
  }
  // 提示词打字：一个镜头的完整提示词逐字打出，三段三种颜色，打完右边（竖屏下面）出图，旁边一个「生成」键；o：{ img, cps }
  function typing(ctx, K, t, o) {
    const u = K.u, A = area(K), segs = promptOf(K, o.img), cps = o.cps || 70, n = Math.floor(Math.max(0, t - .1) * cps);
    const tw = LAND ? A[2] * .52 : A[2], ir = LAND ? [A[0] + A[2] * .58, A[1] + 30 * u, A[2] * .42, A[2] * .42 * .66] : [A[0], A[1] + A[3] - A[2] * .62, A[2], A[2] * .62];
    glass(ctx, K, A[0] - 20 * u, A[1] - 10 * u, tw + 40 * u, LAND ? A[3] : ir[1] - A[1] - 30 * u, pop(t, .3));
    ctx.save(); ctx.font = F(K, 400, 34); ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    const colors = [K.ink, K.hot, K.muted]; let k = 0, x = A[0], y = A[1] + 10 * u; const lh = 50 * u;
    segs.forEach((s, si) => {
      for (const c of s) {
        if (k >= n) break; const w = ctx.measureText(c).width;
        if (x + w > A[0] + tw) { x = A[0]; y += lh; }
        ctx.fillStyle = colors[si]; if (si === 1) ctx.font = F(K, 700, 34); else ctx.font = F(K, 400, 34);
        ctx.fillText(c, x, y); x += w; k++;
      }
    });
    if (Math.floor(t * 4) % 2 === 0 || k < n) { ctx.fillStyle = K.hot; ctx.fillRect(x + 2 * u, y, 3 * u, 38 * u); }
    ctx.restore();
    const done = n >= segs.join('').length, bx = LAND ? ir[0] : ir[0] + ir[2] - 200 * u, by = LAND ? ir[1] + ir[3] + 40 * u : ir[1] - 80 * u;
    ctx.save(); ctx.fillStyle = done ? K.hot : K.chip; rr(ctx, bx, by, 180 * u, 60 * u, 30 * u); ctx.fill(); ctx.font = F(K, 900, 28); ctx.fillStyle = done ? '#14110B' : K.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('生成', bx + 90 * u, by + 31 * u); ctx.restore();
    const e = smooth(.5, .9, t); if (e > 0) cover(ctx, img(K, o.img), ir, 1.02, .5, .5, e);
    return { box: ir, pt: [bx + 90 * u, by + 30 * u] };
  }
  // 名词解释：一个词、英文、一句释义，下面一条示例；o：{ term, en, def, line }
  function glossary(ctx, K, t, o) {
    const u = K.u, A = area(K), e = pop(t, .4);
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = e;
    ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.hot; ctx.fillText('名词 · TERM', A[0], A[1] + 30 * u);
    ctx.font = F(K, 900, LAND ? 120 : 110); ctx.fillStyle = K.ink; ctx.fillText(o.term, A[0] + (1 - e) * -30 * u, A[1] + 170 * u);
    const tw = ctx.measureText(o.term).width; ctx.font = F(K, 400, 34, K.mono); ctx.fillStyle = K.muted; ctx.fillText(o.en, LAND ? A[0] + tw + 30 * u : A[0], LAND ? A[1] + 170 * u : A[1] + 230 * u);
    ctx.fillStyle = K.hot; ctx.fillRect(A[0], A[1] + (LAND ? 210 : 270) * u, A[2] * .9 * pop(t - .2, .5), 4 * u);
    ctx.globalAlpha = pop(t - .35, .4); ctx.font = F(K, 700, 40); ctx.fillStyle = K.ink; const ls = wrapCJK(ctx, o.def, A[2] * .9);
    ls.forEach((l, i) => ctx.fillText(l, A[0], A[1] + (LAND ? 280 : 350) * u + i * 56 * u));
    ctx.globalAlpha = pop(t - .7, .4); ctx.font = F(K, 400, 28); ctx.fillStyle = K.muted;
    wrapCJK(ctx, '例：' + (o.line || K.Pr.styles[K.v]), A[2] * .9).slice(0, 2).forEach((l, i) => ctx.fillText(l, A[0], A[1] + (LAND ? 300 : 370) * u + ls.length * 56 * u + 30 * u + i * 40 * u));
    ctx.restore();
  }
  // 问答翻卡：问题卡翻过去是答案；o：{ q, a, at }
  function qa(ctx, K, t, o) {
    const u = K.u, A = area(K), at = o.at ?? .8, p = clamp((t - at) / .35), back = p > .5, sx = Math.abs(Math.cos(p * Math.PI));
    const cw = LAND ? A[2] * .8 : A[2], chh = LAND ? A[3] * .75 : A[3] * .6, cx = W / 2, cy = A[1] + A[3] / 2, e = pop(t, .35);
    ctx.save(); ctx.translate(cx, cy + (1 - e) * 40 * u); ctx.scale(Math.max(.02, sx), 1); ctx.globalAlpha = e;
    ctx.fillStyle = back ? K.paper : K.chip; rr(ctx, -cw / 2, -chh / 2, cw, chh, 18 * u); ctx.fill(); if (!back) { ctx.strokeStyle = K.hot; ctx.lineWidth = 3 * u; ctx.stroke(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(90 * u)}px ${K.num}`; ctx.fillStyle = back ? '#B9700E' : K.hot; ctx.fillText(back ? 'A' : 'Q', 0, -chh / 2 + 80 * u);
    ctx.font = F(K, 900, back ? 44 : 52); ctx.fillStyle = back ? '#1A1612' : K.ink;
    const ls = wrapCJK(ctx, back ? o.a : o.q, cw * .84), lh = (back ? 60 : 70) * u; ls.forEach((l, i) => ctx.fillText(l, 0, 20 * u + (i - (ls.length - 1) / 2) * lh));
    ctx.restore();
  }
  // 对比表：三种画风在几个维度上怎么写，当前画风那一列亮起；o：{ title, kicker, rows: [[维度, photo, watercolor, clay]] }
  function styleTable(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), ks = Object.keys(K.ALL), nc = ks.length + 1;
    const c0 = LAND ? 170 * u : 130 * u, cw = (A[2] - c0) / ks.length, rh = Math.min(LAND ? 92 * u : 100 * u, (A[1] + A[3] - y0) / (o.rows.length + 1));
    const ci = ks.indexOf(K.v); ctx.save();
    ctx.fillStyle = `rgba(255,181,71,${.14 * smooth(.6, 1, t)})`; ctx.fillRect(A[0] + c0 + ci * cw, y0, cw, rh * (o.rows.length + 1));
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ks.forEach((k, i) => { ctx.font = F(K, 900, LAND ? 36 : 30); ctx.fillStyle = k === K.v ? K.hot : K.ink; ctx.globalAlpha = pop(t - .1, .3); ctx.fillText(K.names[k], A[0] + c0 + i * cw + 14 * u, y0 + rh / 2); });
    o.rows.forEach((r, j) => {
      const e = pop(t - .25 - j * .12, .35), y = y0 + (j + 1) * rh; ctx.globalAlpha = e;
      ctx.strokeStyle = K.faint; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(A[0], y); ctx.lineTo(A[0] + A[2], y); ctx.stroke();
      ctx.font = F(K, 700, 28, K.mono); ctx.fillStyle = K.muted; ctx.fillText(r[0], A[0], y + rh / 2);
      r.slice(1).forEach((c, i) => { ctx.font = F(K, ks[i] === K.v ? 700 : 400, LAND ? 32 : 26); ctx.fillStyle = ks[i] === K.v ? K.ink : K.muted; wrapCJK(ctx, c, cw - 20 * u).slice(0, 2).forEach((l, q, all) => ctx.fillText(l, A[0] + c0 + i * cw + 14 * u, y + rh / 2 + (q - (all.length - 1) / 2) * 36 * u)); });
    });
    ctx.restore();
  }
  // 清单：约束段里的禁止项一条条打勾；o：{ kicker, title, items }
  function checklist(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), rh = Math.min(86 * u, (A[1] + A[3] - y0) / o.items.length);
    o.items.forEach((it, i) => {
      const e = pop(t - .25 - i * .2, .3), y = y0 + i * rh, ck = smooth(.15, .35, t - .25 - i * .2);
      ctx.save(); ctx.globalAlpha = e; ctx.strokeStyle = K.hot; ctx.lineWidth = 4 * u; rr(ctx, A[0], y + rh * .2, rh * .56, rh * .56, 8 * u); ctx.stroke();
      if (ck > 0) { ctx.beginPath(); const s = rh * .56, x = A[0], yy = y + rh * .2; ctx.moveTo(x + s * .2, yy + s * .55); ctx.lineTo(x + s * .42, yy + s * .55 + s * .22 * Math.min(1, ck * 2)); if (ck > .5) ctx.lineTo(x + s * .42 + s * .4 * (ck - .5) * 2, yy + s * .77 - s * .55 * (ck - .5) * 2); ctx.stroke(); }
      ctx.font = F(K, 700, LAND ? 40 : 38); ctx.fillStyle = K.ink; ctx.textBaseline = 'middle'; ctx.fillText(it, A[0] + rh * .8, y + rh * .48 + (1 - e) * 20 * u); ctx.restore();
    });
  }
  // 结构树：提示词 → 三段 → 每段下面有几条，当前画风那一条亮起；o：{ title, kicker }
  function tree(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), ks = Object.keys(K.ALL);
    const root = LAND ? [A[0] + 120 * u, (y0 + A[1] + A[3]) / 2] : [W / 2, y0 + 50 * u];
    const kids = [['镜头段', `${K.Pr.shots.length} 条`, []], ['风格段', `${ks.length} 种`, ks.map(k => K.names[k])], ['约束段', '1 条', []]];
    const node = (x, y, text, hot, e, big) => { ctx.save(); ctx.globalAlpha = e; ctx.font = F(K, big ? 900 : 700, big ? 42 : 34); const w = ctx.measureText(text).width + 40 * u, h = (big ? 80 : 64) * u; ctx.fillStyle = hot ? K.hot : K.chip; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); if (!hot) { ctx.strokeStyle = K.faint; ctx.lineWidth = 1.5 * u; ctx.stroke(); } ctx.fillStyle = hot ? '#14110B' : K.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1); ctx.restore(); return w; };
    const link = (a, b, e) => { ctx.save(); ctx.strokeStyle = K.faint; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(lerp(a[0], b[0], e), lerp(a[1], b[1], e)); ctx.stroke(); ctx.restore(); };
    kids.forEach(([name, cnt, sub], i) => {
      const e = pop(t - .2 - i * .12, .35), p = LAND ? [A[0] + A[2] * .45, root[1] + (i - 1) * 170 * u] : [A[0] + A[2] * (i + .5) / 3, root[1] + 200 * u];
      link(root, p, e); node(p[0], p[1], `${name} · ${cnt}`, false, e);
      sub.forEach((s, j) => {
        const q = pop(t - .6 - j * .1, .3), on = ks[j] === K.v, c = LAND ? [A[0] + A[2] * .82, p[1] + (j - 1) * 80 * u] : [A[0] + A[2] * .5 + (j - 1) * 300 * u, p[1] + 220 * u];
        link(p, c, q); node(c[0], c[1], s, on && t > 1, q);
      });
    });
    node(root[0], root[1], '提示词', true, pop(t, .3), true);
  }
  // 角色卡：从图里裁出主角（圆框）+ 名字 + 几条设定，跨镜头保持一致；o：{ imgs: [a, b], at: [[fx, fy, z]…], name, traits }
  function character(ctx, K, t, o) {
    const u = K.u, A = area(K), R = LAND ? A[3] * .34 : A[2] * .28;
    o.imgs.forEach((id, i) => {
      const e = pop(t - i * .25, .45), cx = LAND ? A[0] + R + i * R * 1.25 : W / 2 + (i - .5) * R * 1.3, cy = LAND ? A[1] + A[3] * .45 + (i ? R * .5 : -R * .2) : A[1] + R + (i ? R * .4 : 0), r = R * (i ? .75 : 1);
      const [fx, fy, z] = o.at[i];
      ctx.save(); ctx.globalAlpha = e; ctx.beginPath(); ctx.arc(cx, cy, r * (.8 + .2 * e), 0, TAU); ctx.clip(); cover(ctx, img(K, id), [cx - r, cy - r, r * 2, r * 2], z, fx, fy); ctx.restore();
      ctx.save(); ctx.globalAlpha = e; ctx.strokeStyle = i ? K.faint : K.hot; ctx.lineWidth = (i ? 3 : 6) * u; ctx.beginPath(); ctx.arc(cx, cy, r * (.8 + .2 * e), 0, TAU); ctx.stroke(); ctx.restore();
    });
    const tx = LAND ? A[0] + A[2] * .5 : A[0], ty = LAND ? A[1] + 40 * u : A[1] + R * 2.6;
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = pop(t - .2, .3);
    ctx.font = F(K, 700, 24, K.mono); ctx.fillStyle = K.hot; ctx.fillText('角色卡 · CHARACTER', tx, ty);
    ctx.font = F(K, 900, LAND ? 84 : 76); ctx.fillStyle = K.ink; ctx.fillText(o.name, tx, ty + 100 * u);
    o.traits.forEach((s, i) => { ctx.globalAlpha = pop(t - .45 - i * .12, .3); ctx.font = F(K, 400, 32); ctx.fillStyle = K.ink; ctx.fillStyle = K.hot; ctx.fillRect(tx, ty + 150 * u + i * 58 * u, 8 * u, 32 * u); ctx.fillStyle = K.ink; ctx.fillText(s, tx + 26 * u, ty + 178 * u + i * 58 * u); });
    ctx.restore();
  }

  // ══ 收尾 ════════════════════════════════════════════════════════════════════
  // 时间线：清晨几点到几点，一格一个时刻，带缩略图；o：{ kicker, title, items: [{ time, text, img }] }
  function timeline(ctx, K, t, o) {
    const u = K.u, A = area(K), y0 = header(ctx, K, t, o, A), n = o.items.length, p = eInOutCubic(clamp((t - .1) / .9));
    if (LAND) {
      const y = y0 + (A[1] + A[3] - y0) * .32, step = A[2] / n;
      ctx.strokeStyle = K.hot; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.moveTo(A[0], y); ctx.lineTo(A[0] + A[2] * p, y); ctx.stroke();
      o.items.forEach((it, i) => {
        const e = pop(t - .15 - i * .12, .35), x = A[0] + step * (i + .5), w = step * .86, h = w * .62;
        ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.hot; ctx.beginPath(); ctx.arc(x, y, 10 * u, 0, TAU); ctx.fill();
        ctx.font = `${Math.round(48 * u)}px ${K.num}`; ctx.fillStyle = K.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(it.time, x, y - 26 * u);
        cover(ctx, img(K, it.img), [x - w / 2, y + 30 * u, w, h], 1.04); ctx.font = F(K, 700, 26); ctx.textBaseline = 'top'; ctx.fillText(it.text, x, y + 44 * u + h); ctx.restore();
      });
    } else {
      const x = A[0] + 30 * u, step = (A[1] + A[3] - y0) / n;
      ctx.strokeStyle = K.hot; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + (A[1] + A[3] - y0) * p); ctx.stroke();
      o.items.forEach((it, i) => {
        const e = pop(t - .15 - i * .12, .35), y = y0 + step * (i + .5), h = step * .8, w = h * 1.5;
        ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.hot; ctx.beginPath(); ctx.arc(x, y, 10 * u, 0, TAU); ctx.fill();
        ctx.font = `${Math.round(48 * u)}px ${K.num}`; ctx.fillStyle = K.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(it.time, x + 30 * u, y - 22 * u);
        ctx.font = F(K, 700, 26); ctx.fillText(it.text, x + 30 * u, y + 24 * u); cover(ctx, img(K, it.img), [A[0] + A[2] - w, y - h / 2, w, h], 1.04); ctx.restore();
      });
    }
  }
  // 生成信息：模型、参数、张数、声音出处一行行滚上来，底下压暗一张图；o：{ img, kicker, title, items: [[键, 值]] }
  function credits(ctx, K, t, o) {
    const u = K.u, A = area(K); cover(ctx, img(K, o.img), [0, 0, W, H], 1.1 + .04 * smooth(0, 2, t), .5, .5, .35);
    const y0 = header(ctx, K, t, o, A), rh = Math.min(84 * u, (A[1] + A[3] - y0) / o.items.length);
    o.items.forEach(([k, v], i) => {
      const e = pop(t - .2 - i * .08, .3), y = y0 + i * rh; ctx.save(); ctx.globalAlpha = e; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.font = F(K, 700, 28, K.mono); ctx.fillStyle = K.hot; ctx.fillText(k, A[0], y + rh / 2 + (1 - e) * 16 * u);
      ctx.font = F(K, 400, LAND ? 36 : 30); ctx.fillStyle = K.ink; ctx.fillText(v, A[0] + (LAND ? 240 : 190) * u, y + rh / 2 + (1 - e) * 16 * u); ctx.restore();
    });
  }
  // 片尾：最后一张图慢推，标题和三种画风的小牌子，当前画风亮着；o：{ img, title, sub }
  function outro(ctx, K, t, o) {
    const u = K.u; cover(ctx, img(K, o.img), [0, 0, W, H], 1.04 + .06 * smooth(0, 3, t));
    ctx.fillStyle = `rgba(13,15,18,${.35 + .3 * smooth(.3, 1, t)})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const e = pop(t - .3, .5); ctx.globalAlpha = e; ctx.font = F(K, 900, LAND ? 84 : 72); ctx.fillStyle = K.ink; ctx.fillText(o.title, W / 2, H / 2 - 50 * u + (1 - e) * 30 * u);
    ctx.font = F(K, 400, 32); ctx.fillStyle = K.muted; ctx.fillText(o.sub, W / 2, H / 2 + 30 * u);
    const ks = Object.keys(K.ALL); ctx.font = F(K, 700, 28, K.mono);
    const ws = ks.map(k => ctx.measureText(K.names[k]).width + 24 * u), tot = ws.reduce((a, b) => a + b, 0) + 20 * u * (ks.length - 1); let x = W / 2 - tot / 2;
    ks.forEach((k, i) => { tagAt(ctx, K, x, H / 2 + 100 * u, K.names[k], k === K.v, pop(t - .7 - i * .1, .3), 28); x += ws[i] + 20 * u; });
    ctx.globalAlpha = 1 - smooth(2.4, 3, t); ctx.restore();
    ctx.fillStyle = `rgba(0,0,0,${smooth(2.5, 3, t)})`; ctx.fillRect(0, 0, W, H);
  }

  // ══ 叠加：位置取宿主返回的 box / pt ═════════════════════════════════════════════
  // 镜头号标签：贴在框的左上角；o：{ box, text }
  function tag(ctx, K, t, o) { if (t < 0 || !o.box) return; tagAt(ctx, K, o.box[0], o.box[1] - 56 * K.u, o.text, true, pop(t, .25), 24); }
  // 取景角：四个角从外往里收到框上；o：{ box }
  function corners(ctx, K, t, o) {
    if (t < 0 || !o.box) return; const u = K.u, [x, y, w, h] = o.box, e = eOutCubic(clamp(t / .4)), off = (1 - e) * 60 * u, L = 50 * u;
    ctx.save(); ctx.strokeStyle = K.hot; ctx.lineWidth = 6 * u; ctx.globalAlpha = e;
    [[x - off, y - off, 1, 1], [x + w + off, y - off, -1, 1], [x - off, y + h + off, 1, -1], [x + w + off, y + h + off, -1, -1]].forEach(([cx, cy, sx, sy]) => { ctx.beginPath(); ctx.moveTo(cx, cy + sy * L); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * L, cy); ctx.stroke(); });
    if (o.text) { ctx.font = F(K, 700, 22, K.mono); ctx.fillStyle = K.hot; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(o.text, x, y + h + 14 * u); }
    ctx.restore();
  }
  // 手绘圈注：围着一点画一个不太圆的圈，带一句话；o：{ pt, r, text }
  function circle(ctx, K, t, o) {
    if (t < 0 || !o.pt) return; const u = K.u, [cx, cy] = o.pt, r = (o.r || 120) * u, p = eInOutCubic(clamp(t / .5)), n = 60;
    ctx.save(); ctx.strokeStyle = K.hot; ctx.lineWidth = 6 * u; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i = 0; i <= n * p * 1.08; i++) { const a = -2 + i / n * TAU, rr_ = r * (1 + .08 * Math.sin(i * .3) + i / n * .06); const x = cx + Math.cos(a) * rr_ * 1.25, y = cy + Math.sin(a) * rr_; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    if (o.text) { ctx.globalAlpha = pop(t - .4, .3); ctx.font = F(K, 900, 34); ctx.fillStyle = K.hot; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(o.text, cx + r * 1.4, cy - r * .9); }
    ctx.restore();
  }
  // 印章：「AI 生成」章转着盖下来；o：{ box, text }
  function stamp(ctx, K, t, o) {
    if (t < 0 || !o.box) return; const u = K.u, [x, y, w, h] = o.box, e = clamp(t / .18), k = lerp(2.2, 1, eOutCubic(e)), cx = x + w - 120 * u, cy = y + h - 90 * u;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.2); ctx.scale(k, k); ctx.globalAlpha = e * .92;
    ctx.strokeStyle = '#E0442B'; ctx.lineWidth = 6 * u; rr(ctx, -110 * u, -44 * u, 220 * u, 88 * u, 10 * u); ctx.stroke();
    ctx.font = F(K, 900, 44); ctx.fillStyle = '#E0442B'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.text || 'AI 生成', 0, 2 * u); ctx.restore();
  }
  // 光标点击：箭头从角落移到点上，按下时一圈波纹；o：{ pt }
  function cursor(ctx, K, t, o) {
    if (t < 0 || !o.pt) return; const u = K.u, [px, py] = o.pt, p = eInOutCubic(clamp(t / .45)), x = lerp(W * .9, px, p), y = lerp(H * .95, py, p);
    if (t > .5) { const q = clamp((t - .5) / .4); ctx.save(); ctx.strokeStyle = K.hot; ctx.globalAlpha = 1 - q; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.arc(px, py, 20 * u + 60 * u * q, 0, TAU); ctx.stroke(); ctx.restore(); }
    const s = t > .5 && t < .62 ? .85 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * u * 1.6, s * u * 1.6); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 26); ctx.lineTo(7, 20); ctx.lineTo(12, 31); ctx.lineTo(16, 29); ctx.lineTo(11, 18); ctx.lineTo(20, 18); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }

  // ══ 转场：七种，画出来两两分得出（samples/tools/trcheck.py 查过）。签名 (ctx, K, p, drawA, drawB)，p 从 0 到 1 ══
  let OFF = null;
  const off = drawB => { OFF = OFF || mk(W, H); const o = OFF.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); drawB(o); return OFF; };
  // 叠化：后一段从 1.04 倍缩回来、渐显
  function dissolve(ctx, K, p, drawA, drawB) {
    const B = off(drawB), e = eInOutCubic(clamp(p)), z = lerp(1.04, 1, e);
    drawA(ctx); ctx.save(); ctx.globalAlpha = e; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.drawImage(B, -W / 2, -H / 2); ctx.restore();
  }
  // 推：新镜头从右边（竖屏从下面）把旧镜头推出去
  function push(ctx, K, p, drawA, drawB) {
    const B = off(drawB), e = eInOutCubic(clamp(p)), dx = LAND ? W * e : 0, dy = LAND ? 0 : H * e;
    ctx.save(); ctx.translate(-dx, -dy); drawA(ctx); ctx.restore(); ctx.drawImage(B, LAND ? W - dx : 0, LAND ? 0 : H - dy);
  }
  // 光圈：从中心开一个圆，圆里是新镜头，圆边一道强调色
  function iris(ctx, K, p, drawA, drawB) {
    const B = off(drawB), e = eInOutCubic(clamp(p)), R = Math.hypot(W, H) / 2 * e;
    drawA(ctx); ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, R, 0, TAU); ctx.clip(); ctx.drawImage(B, 0, 0); ctx.restore();
    ctx.strokeStyle = K.hot; ctx.lineWidth = 10 * K.u; ctx.beginPath(); ctx.arc(W / 2, H / 2, R, 0, TAU); ctx.stroke();
  }
  // 闪白：前一半旧镜头变白，后一半白里显出新镜头
  function flashT(ctx, K, p, drawA, drawB) {
    const e = clamp(p); if (e < .5) { drawA(ctx); ctx.fillStyle = `rgba(255,255,255,${e * 2})`; } else { drawB(ctx); ctx.fillStyle = `rgba(255,255,255,${2 - e * 2})`; } ctx.fillRect(0, 0, W, H);
  }
  // 百叶切片：画面切成横条，单双条从左右两边交错滑进新镜头
  function slice(ctx, K, p, drawA, drawB) {
    const B = off(drawB), e = eInOutCubic(clamp(p)), n = 8, sh = H / n;
    drawA(ctx);
    for (let i = 0; i < n; i++) { const x = (i % 2 ? 1 : -1) * W * (1 - e); ctx.drawImage(B, 0, i * sh, W, sh, x, i * sh, W, sh); }
  }
  // 暗场：旧镜头压黑，再从黑里亮出新镜头
  function dip(ctx, K, p, drawA, drawB) {
    const e = clamp(p); if (e < .5) { drawA(ctx); ctx.fillStyle = `rgba(0,0,0,${e * 2})`; } else { drawB(ctx); ctx.fillStyle = `rgba(0,0,0,${2 - e * 2})`; } ctx.fillRect(0, 0, W, H);
  }
  // 斜擦：一道斜边从左上扫到右下，斜边后面是新镜头，边上一道强调色
  function diag(ctx, K, p, drawA, drawB) {
    const B = off(drawB), e = eInOutCubic(clamp(p)), L = (W + H) * e;
    drawA(ctx); ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L, 0); ctx.lineTo(0, L); ctx.closePath(); ctx.clip(); ctx.drawImage(B, 0, 0); ctx.restore();
    ctx.strokeStyle = K.hot; ctx.lineWidth = 14 * K.u; ctx.beginPath(); ctx.moveTo(L, 0); ctx.lineTo(0, L); ctx.stroke();
  }
  const TRANS = { dissolve, push, iris, flash: flashT, slice, dip, diag };
  const transition = dissolve;                               // 15 秒片段用的叠化

  // ══ 15 秒片段用的旧接口 ═══════════════════════════════════════════════════════
  // 画面区：横屏铺满；竖屏把图整张放在上半部，背后垫一层放大压暗的同一张图
  function stage() {
    const u = SHORT / 1080;
    return LAND ? { img: [0, 0, W, H], strip: [70 * u, H - 300 * u, W * .62, 120 * u] } : { img: [0, 300 * u, W, W * 9 / 16], strip: [50 * u, 300 * u + W * 9 / 16 + 50 * u, W - 100 * u, 300 * u] };
  }
  // 一个镜头：慢推或慢拉（move：{ z: [起, 止], fx, fy 各 [起, 止] }），d 是这个镜头的长度
  function clipShot(ctx, K, t, d, im, move) {
    const p = smooth(0, d + .5, t);
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    cover(ctx, im, stage().img, lerp(...move.z, p), lerp(...move.fx, p), lerp(...move.fy, p));
    const g = ctx.createLinearGradient(0, H * .55, 0, H); g.addColorStop(0, 'rgba(13,15,18,0)'); g.addColorStop(1, 'rgba(13,15,18,.78)'); ctx.fillStyle = g; ctx.fillRect(0, H * .55, W, H * .45);
  }
  // 片尾：同一个镜头的几种画风并排（片段用，图直接传）；o：{ title, sub, items: [{ img, name, on }] }
  function clipLineup(ctx, K, t, o) {
    const u = K.u, n = o.items.length;
    ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.textAlign = 'center'; ctx.globalAlpha = pop(t, .5); ctx.fillStyle = K.ink; ctx.font = F(K, 900, 60); ctx.fillText(o.title, W / 2, 200 * u);
    ctx.fillStyle = K.muted; ctx.font = F(K, 400, 30); ctx.fillText(o.sub, W / 2, 260 * u); ctx.restore();
    o.items.forEach((it, i) => {
      const e = pop(t - .2 - i * K.beat * .7, .5), w = (W - 240 * u - 80 * u) / n, h = w * 9 / 16, x = 120 * u + i * (w + 40 * u), y = H * .36;
      const k = it.on ? lerp(1, 1.06, eOutBack(clamp((t - 1) / .6))) : 1, cx = x + w / 2, cy = y + h / 2;
      ctx.save(); ctx.globalAlpha = e * (it.on ? 1 : lerp(1, .45, smooth(.9, 1.4, t))); ctx.translate(cx, cy + (1 - e) * 40 * u); ctx.scale(k, k); ctx.translate(-cx, -cy);
      cover(ctx, it.img, [x, y, w, h]); ctx.lineWidth = (it.on ? 5 : 1.5) * u; ctx.strokeStyle = it.on ? K.hot : K.faint; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = it.on ? K.hot : K.ink; ctx.font = F(K, it.on ? 900 : 700, 32); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(it.name, cx, y + h + 18 * u); ctx.restore();
    });
  }
  // 字幕：跟语音合成的逐句时间（assets.json 的 lines）
  function subtitle(ctx, K, t, A) {
    const c = cueAt(A, t); if (!c) return;
    caption(ctx, c.text, { size: LAND ? 42 : 46, y: H - (LAND ? 70 : 230) * K.u, bg: 'rgba(13,15,18,.6)' });
  }

  return {
    theme, cover, area, pop, chip, glass, tagAt, promptOf, stats, palette, TRANS, transition,
    backdrop, grain, corner, captions,
    coldOpen, slam, flash, marquee, chapter,
    shot, shotCard, split, filmstrip, grid, loupe, reveal, stack, lineup, swap, crop,
    bigNumber, flip, bars, progress, ring, rank, heat, gauge, versus, scatter, palColors,
    formula, quote, typing, glossary, qa, styleTable, checklist, tree, character,
    timeline, credits, outro,
    tag, corners, circle, stamp, cursor,
    stage, clipShot, clipLineup, promptStrip, subtitle,
  };
})();
