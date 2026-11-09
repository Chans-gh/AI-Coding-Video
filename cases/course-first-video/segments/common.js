// 各段共用：课件包装（课名、段名、章节条、字幕）、卡片、类别色标、终端窗口（C-169 光标打字的做法）、代码高亮。
// 依赖 samples/lib/lib.js；播放器给的全局 SEG = {no, title, dur, vo, lines}、TIMING。
// 每帧只由本段时间 t 决定；跨段连续的东西（章节条）用整支时间 G = 本段起点 + t。
const L = (() => {
  const u = SHORT / 1080;
  const K = {
    bg: '#F5F2EA', paper: '#FFFFFF', ink: '#1D2433', soft: '#5B6475', line: '#E2DDD0',
    C: '#2F6BFF', T: '#11A37F', G: '#E8590C', hi: '#FFE066',
    term: '#151A23', termBar: '#232A36', green: '#7EE787', red: '#FF7B72', yellow: '#E3B341', blue: '#79C0FF', gray: '#8B949E',
  };
  const START = TIMING.segments.slice(0, SEG.no - 1).reduce((a, s) => a + s.dur, 0);
  const TOTAL = TIMING.segments.reduce((a, s) => a + s.dur, 0);
  const G = t => START + t;
  const say = i => SEG.vo[i].at;
  const sayEnd = i => SEG.vo[i].at + SEG.vo[i].t;
  const SUB = { items: [{ at: 0, lines: SEG.lines }] };
  const cue = (kw, f = Infinity) => cueTime(SUB, kw, f);
  const SANS = "'Noto Sans SC'", MONO = "'JetBrains Mono', 'Noto Sans SC'";
  const F = (w, px, fam = SANS) => `${w} ${Math.round(px * u)}px ${fam}`;
  const FONTS = ["900 64px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 24px 'JetBrains Mono'", "400 24px 'JetBrains Mono'"];
  const CLASS = { C: '代码画', T: '真实素材', G: 'AI 生成' };

  // 中文字体按字切成小文件，只载入用到的字：本段源码、本文件源码、字幕，再加 extra（读进来的文档）
  async function init(extra = '') {
    const src = await xhr(`${DIR}/segments/${String(SEG.no).padStart(2, '0')}.js`) + await xhr(`${DIR}/segments/common.js`);
    const txt = [...new Set(src + extra + SEG.lines.map(l => l.text).join('') + TIMING.segments.map(s => s.title).join(''))].join('');
    await Promise.all(FONTS.map(f => document.fonts.load(f, txt).catch(() => {})));
  }
  const pop = (t, d = .4) => eOutBack(clamp(t / d));
  const fadeIn = (t, d = .4) => clamp(t / d);

  function bg(ctx, col = K.bg) {
    ctx.fillStyle = col; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.035)';
    for (let y = 40 * u; y < H; y += 48 * u) for (let x = 40 * u; x < W; x += 48 * u) { ctx.beginPath(); ctx.arc(x, y, 2 * u, 0, TAU); ctx.fill(); }
  }
  function card(ctx, x, y, w, h, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.fillStyle = 'rgba(29,36,51,.10)'; rr(ctx, x + 6 * u, y + 10 * u, w, h, (o.r ?? 18) * u); ctx.fill();
    ctx.fillStyle = o.fill || K.paper; rr(ctx, x, y, w, h, (o.r ?? 18) * u); ctx.fill();
    if (o.edge) { ctx.fillStyle = o.edge; rr(ctx, x, y, 10 * u, h, 5 * u); ctx.fill(); }
    ctx.restore();
  }
  // 类别色标：C / T / G 的小圆角块
  function chip(ctx, k, x, y, o = {}) {
    const s = o.s || 1, label = o.label ?? `${k} ${CLASS[k]}`;
    ctx.save(); ctx.font = F(700, 26 * s); const w = ctx.measureText(label).width + 36 * u * s, h = 46 * u * s;
    ctx.globalAlpha *= o.alpha ?? 1; ctx.fillStyle = K[k]; rr(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(label, x + 18 * u * s, y + h / 2 + 1 * u);
    ctx.restore(); return w;
  }
  // 顶部：课名 + 本段段名；底部：9 段的章节条
  function frame(ctx, t, o = {}) {
    const a = o.alpha ?? 1;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = o.dark ? 'rgba(255,255,255,.75)' : K.soft; ctx.font = F(700, 26); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText('用 AI 做视频 · 第 1 课', 60 * u, 52 * u);
    ctx.textAlign = 'right'; ctx.fillStyle = o.dark ? '#fff' : K.ink; ctx.font = F(900, 30);
    ctx.fillText(`${SEG.no} ${SEG.title}`, W - 60 * u, 52 * u);
    const y = H - 18 * u, x0 = 60 * u, ww = W - 120 * u;
    let acc = 0;
    TIMING.segments.forEach((s, i) => {
      const x = x0 + ww * acc / TOTAL, w = ww * s.dur / TOTAL - 4 * u; acc += s.dur;
      ctx.fillStyle = o.dark ? 'rgba(255,255,255,.25)' : 'rgba(29,36,51,.12)'; ctx.fillRect(x, y, w, 6 * u);
      if (i + 1 < SEG.no) { ctx.fillStyle = o.dark ? 'rgba(255,255,255,.7)' : K.soft; ctx.fillRect(x, y, w, 6 * u); }
      if (i + 1 === SEG.no) { ctx.fillStyle = K.C; ctx.fillRect(x, y, w * clamp(t / SEG.dur), 6 * u); }
    });
    ctx.restore();
  }
  // 字幕：底部居中，深色半透明底
  function sub(ctx, t, o = {}) {
    const l = SEG.lines.find(l => t >= l.t0 && t < l.t1);
    if (!l) return;
    caption(ctx, l.text, { size: 40, y: H - (o.y ?? 56) * u, bg: 'rgba(20,24,33,.78)', color: '#fff', maxW: W * .7 });
  }

  // 终端窗口：rows = [{at 秒, text, k 种类（cmd 命令逐字打出 / out 输出 / ok / bad / say 对助手说的话 / tool 助手的动作 / code 代码）, cps 每秒几个字}]
  // 只画 at <= t 的行；行太多时整体往上滚，最后一行贴底。返回当前正在打字的行（给字幕、放大用）
  function term(ctx, t, x, y, w, h, rows, o = {}) {
    const lh = (o.lh || 40) * u, fs = o.fs || 26, pad = 28 * u, bar = 46 * u;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, x + 8 * u, y + 14 * u, w, h, 16 * u); ctx.fill();
    ctx.fillStyle = K.term; rr(ctx, x, y, w, h, 16 * u); ctx.fill();
    ctx.fillStyle = K.termBar; rr(ctx, x, y, w, bar, 16 * u); ctx.fill(); ctx.fillRect(x, y + bar - 16 * u, w, 16 * u);
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + (28 + i * 26) * u, y + bar / 2, 8 * u, 0, TAU); ctx.fill(); });
    ctx.fillStyle = K.gray; ctx.font = F(400, 20, MONO); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.title || '终端 — water-cycle', x + w / 2, y + bar / 2 + 1 * u);
    ctx.beginPath(); ctx.rect(x, y + bar, w, h - bar); ctx.clip();
    const vis = rows.filter(r => r.at <= t);
    const n = Math.floor((h - bar - pad * 1.5) / lh);
    // 滚动：按最后一行出现的时刻平滑过渡
    const k = Math.max(0, vis.length - n), last = vis[vis.length - 1];
    const sc = k > 0 ? (k - 1 + eOutCubic(clamp((t - last.at) / .25))) : 0;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    let typing = null;
    vis.forEach((r, i) => {
      const yy = y + bar + pad + (i - sc) * lh + lh / 2;
      if (yy < y + bar - lh || yy > y + h + lh) return;
      let txt = r.text, col = { cmd: '#E6EDF3', out: K.gray, ok: K.green, bad: K.red, say: '#fff', tool: K.blue, code: '#C9D1D9', warn: K.yellow }[r.k] || '#E6EDF3';
      let px = x + pad;
      ctx.font = F(r.k === 'cmd' || r.k === 'say' ? 700 : 400, fs, MONO);
      if (r.k === 'cmd') { ctx.fillStyle = K.green; ctx.fillText('$', px, yy); px += 30 * u; }
      if (r.k === 'say') { ctx.fillStyle = K.yellow; ctx.fillText('>', px, yy); px += 30 * u; }
      if (r.k === 'tool') { ctx.fillStyle = K.T; ctx.fillText('●', px, yy); px += 30 * u; }
      if (r.k === 'code') { ctx.fillStyle = '#4B5563'; ctx.fillText(String(r.n || '').padStart(3), px, yy); px += 70 * u; }
      if (r.k === 'cmd' || r.k === 'say') {
        const cps = r.cps || 22, nch = Math.floor((t - r.at) * cps);
        if (nch < txt.length) { typing = r; txt = txt.slice(0, nch); }
      }
      if (r.k === 'code') codeLine(ctx, txt, px, yy, fs);
      else { ctx.fillStyle = col; ctx.fillText(txt, px, yy); }
      if (r.hl && t > r.at + .3) {                                   // 重点：黄色荧光底
        const m = ctx.measureText(r.hl), i0 = txt.indexOf(r.hl);
        if (i0 >= 0) { const xx = px + ctx.measureText(txt.slice(0, i0)).width, p = eOutCubic(clamp((t - r.at - .3) / .5));
          ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(227,179,65,.45)'; ctx.fillRect(xx - 4 * u, yy - lh * .42, (m.width + 8 * u) * p, lh * .84); ctx.restore(); }
      }
      if (typing === r || (i === vis.length - 1 && (r.k === 'cmd' || r.k === 'say'))) {   // 光标
        if (typing === r || Math.floor(t * 2.2) % 2 === 0) { const cx = px + ctx.measureText(txt).width + 4 * u; ctx.fillStyle = '#E6EDF3'; ctx.fillRect(cx, yy - fs * .55 * u, 13 * u, fs * 1.1 * u); }
      }
    });
    ctx.restore();
    return typing;
  }
  // 极简 JS 高亮（C-044 的做法：关键字、字符串、数字、注释各一色）
  function codeLine(ctx, s, x, y, fs) {
    const re = /(\/\/.*$)|('[^']*'?)|(\b(?:const|let|for|if|return|async|await|function|new)\b)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*(?=\())|([^'\/\w]+|\w+|\/)/g;
    let m, xx = x;
    while ((m = re.exec(s))) {
      const col = m[1] ? '#8B949E' : m[2] ? '#A5D6FF' : m[3] ? '#FF7B72' : m[4] ? '#79C0FF' : m[5] ? '#D2A8FF' : '#C9D1D9';
      ctx.fillStyle = col; ctx.fillText(m[0], xx, y); xx += ctx.measureText(m[0]).width;
      if (!m[0]) break;
    }
  }
  // DeepSeek 写的线条图标（assets/icons.svg，6 个 <g id="iconN">，都画在 0–100 的格子里）：拆成 6 张图，col 换线条颜色
  async function icons(col) {
    const txt = await xhr(asset('icons.svg')), gs = txt.match(/<g id="icon\d"[\s\S]*?<\/g>/g);
    return Promise.all(gs.map(g => new Promise((ok, no) => {
      const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('图标载入失败'));
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 116 116" width="348" height="348">${col ? g.split('#1F2533').join(col) : g}</svg>`);
    })));
  }
  // 点击波纹（T-009 的做法）
  function ripple(ctx, x, y, p) {
    if (p <= 0 || p >= 1) return;
    ctx.save(); ctx.strokeStyle = `rgba(232,89,12,${1 - p})`; ctx.lineWidth = 5 * u;
    ctx.beginPath(); ctx.arc(x, y, (16 + 70 * eOutCubic(p)) * u, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function cursor(ctx, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * u * 1.6, s * u * 1.6);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(6, 17); ctx.lineTo(10, 26); ctx.lineTo(14, 24); ctx.lineTo(10, 16); ctx.lineTo(17, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // 大标题
  function title(ctx, text, x, y, px, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.fillStyle = o.color || K.ink; ctx.font = F(o.w || 900, px);
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x, y); ctx.restore();
  }
  return { u, K, G, START, TOTAL, say, sayEnd, cue, F, SANS, MONO, FONTS, init, pop, fadeIn, bg, card, chip, frame, sub, term, codeLine, ripple, cursor, title, CLASS, icons };
})();
