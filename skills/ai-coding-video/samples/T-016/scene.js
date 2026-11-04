// T-016 访谈金句竖屏：一段 54 秒的 NASA 横屏访谈，edit.py 用 Whisper 出逐词时间，按句打分挑出 3 句、删掉口头禅；片头在文字稿上划掉要删的词、标出挑中的句子和分数，之后按剪辑表跳着播原片，竖屏裁切框跟着人脸检测的轨迹走，字幕逐词点亮；横屏版左边是原片和移动的裁切框，右边是手机里的竖屏成品
// 素材：录像（NASA 影像库的宇航员访谈）、数据（edit.py 算出的逐词时间、句子打分、剪辑表、人脸轨迹）；配乐 CC0
const ZH = ['我想，回头看，这会是太空探索的新纪元。', '现在当宇航员，正是好时候。', '这真是个超酷的时代。'];
const T0 = 2.8;                 // 成品从这里开始播
const Y = '#ffd23f', R = '#ff5a5f', C = '#7fd8ff';
const UI = '本仓库计算（）文字稿剪辑从秒访谈里挑句删掉口头禅高光打分原片横屏竖屏成品裁切框跟着人脸走自动改画幅删去句剪辑表合计宇航员年发射前访谈录像原声配乐金句';
scene({
  id: 'T-016', name: '访谈金句竖屏', dur: 12.8, still: 5.2,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "700 40px 'JetBrains Mono'", "400 40px 'JetBrains Mono'"],
  text: ZH.join('') + UI,
  async init() {
    const A = await loadAssets(), E = JSON.parse(await loadText('edit.json')), v = await loadVideo('talk.mp4');
    // 成品时间轴：每段剪辑 [源起, 源止] 依次接上；记下每段属于哪一句
    const picks = E.sentences.filter(s => s.pick);
    let at = 0;
    const segs = E.cuts.map(([a, b]) => {
      const k = picks.findIndex(s => a >= E.words[s.w[0]][1] - .2 && b <= E.words[s.w[1]][2] + .2);
      const g = { a, b, o: at, k }; at += b - a; return g;
    });
    const drop = new Set(picks.flatMap(s => s.drop));
    return { A, E, v, picks, segs, total: at, drop };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    const end = T0 + s.total;
    if (t < T0 + .35) transcript(ctx, t, s, u, 1 - smooth(T0, T0 + .35, t));
    if (t >= T0) await output(ctx, Math.min(t, end), t, s, u, smooth(T0, T0 + .35, t) * (1 - smooth(end + .1, end + .5, t)));
    if (t > end + .1) outro(ctx, t - end, s, u);
    ctx.save(); ctx.font = `400 ${15 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), W - 22 * u, H - 16 * u); ctx.restore();
  },
});

// 成品 t → 源素材里的秒数、第几段
function srcAt(s, to) {
  let g = s.segs[0];
  for (const x of s.segs) if (to >= x.o) g = x;
  return { g, src: Math.min(g.b, g.a + (to - g.o)) };
}
function faceAt(E, src) {
  const f = E.face, k = clamp(src / f.hop, 0, f.x.length - 1), i = Math.floor(k), j = Math.min(i + 1, f.x.length - 1), p = k - i;
  return { x: lerp(f.x[i], f.x[j], p), y: lerp(f.y[i], f.y[j], p), size: lerp(f.size[i], f.size[j], p) };
}

// ---------- 片头：文字稿 ----------
function transcript(ctx, t, s, u, a) {
  const E = s.E;
  ctx.save(); ctx.globalAlpha = a;
  // 原片缩略：横屏在左，竖屏在上
  const vx = LAND ? 60 * u : 60 * u, vy = LAND ? 150 * u : 230 * u, vw = LAND ? W * .36 : W - 120 * u, vh = vw * 9 / 16;
  ctx.fillStyle = '#000'; ctx.fillRect(vx, vy, vw, vh);
  drawCover(ctx, s.v.el, vx, vy, vw, vh);
  ctx.font = `700 ${20 * u}px 'JetBrains Mono'`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText('SOURCE 16:9 · 54.0 s', vx, vy + vh + 14 * u);
  // 标题
  ctx.font = `900 ${(LAND ? 46 : 58) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff';
  ctx.fillText('文字稿剪辑', 60 * u, (LAND ? 56 : 100) * u);
  ctx.font = `400 ${(LAND ? 22 : 28) * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillText('从 54 秒访谈里挑 3 句 · 删掉口头禅', (LAND ? 340 : 60) * u, (LAND ? 74 : 176) * u);
  // 文字稿：逐词排版
  const tx = LAND ? vx + vw + 50 * u : 60 * u, ty = LAND ? 150 * u : vy + vh + 80 * u, tw = W - tx - 60 * u;
  const fs = (LAND ? 24 : 30) * u, lh = fs * 1.62;
  ctx.font = `400 ${fs}px 'JetBrains Mono'`;
  const sp = ctx.measureText(' ').width;
  let x = tx, y = ty;
  const sIdx = w => E.sentences.findIndex(q => w >= q.w[0] && w <= q.w[1]);
  const pIdx = w => s.picks.findIndex(q => w >= q.w[0] && w <= q.w[1]);
  E.words.forEach(([word], i) => {
    const ww = ctx.measureText(word).width;
    if (x + ww > tx + tw) { x = tx; y += lh; }
    const k = pIdx(i), p = k < 0 ? 0 : eOutCubic(inv(.5 + k * .45, .95 + k * .45, t));
    if (k >= 0 && p > 0) { ctx.fillStyle = rgba([255, 210, 63], .85); ctx.fillRect(x - sp * .5, y - fs * .1, (ww + sp) * p, fs * 1.3); }
    const dropped = s.drop.has(i);
    ctx.fillStyle = k >= 0 && p > .5 ? '#111' : dropped ? 'rgba(255,90,95,.9)' : 'rgba(230,237,243,.55)';
    ctx.fillText(word, x, y);
    if (dropped) {
      const q = eOutCubic(inv(1.6, 2.0, t));
      if (q > 0) { ctx.strokeStyle = R; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(x, y + fs * .55); ctx.lineTo(x + ww * q, y + fs * .55); ctx.stroke(); }
    }
    // 句子打分：挑中的句子首词前标出分数
    const si = sIdx(i);
    if (i === E.sentences[si].w[0] && k >= 0 && p > .3) {
      ctx.save(); ctx.font = `700 ${fs * .8}px 'JetBrains Mono'`; ctx.fillStyle = Y; ctx.textAlign = 'right';
      ctx.fillText(`★${E.sentences[si].score.toFixed(1)}`, tx - 10 * u, y + fs * .1);
      ctx.restore(); ctx.font = `400 ${fs}px 'JetBrains Mono'`;
    }
    x += ww + sp;
  });
  // 剪辑表摘要
  const q = smooth(2.0, 2.4, t);
  if (q > 0) {
    ctx.globalAlpha = a * q;
    ctx.font = `700 ${(LAND ? 22 : 28) * u}px 'Noto Sans SC'`; ctx.fillStyle = Y;
    ctx.fillText(`剪辑表 ${s.segs.length} 段 · 合计 ${s.total.toFixed(1)} 秒`, tx, y + lh * 1.6);
  }
  ctx.restore();
}

// ---------- 成品：竖屏裁切 + 逐词字幕 ----------
async function output(ctx, tc, t, s, u, a) {
  const to = tc - T0, { g, src } = srcAt(s, to), el = await s.v.at(src);
  const f = faceAt(s.E, src), vw = s.v.w, vh = s.v.h;
  // 裁切框：高取满，宽按竖屏成品里视频区的比例（上下另放标题和字幕，接近方形），中心跟着脸；跳切的段落交替推近一点，接缝不明显
  const zoom = g.k >= 0 && s.segs.indexOf(g) % 2 ? 1.12 : 1;
  const ch = vh / zoom, cw = ch * (LAND ? 1080 / 1075 : W / (H * .56));
  const cx = clamp(f.x * vw, cw / 2, vw - cw / 2), cy = clamp(f.y * vh + ch * .12, ch / 2, vh - ch / 2);
  const crop = [cx - cw / 2, cy - ch / 2, cw, ch];
  ctx.save(); ctx.globalAlpha = a;
  let ph;   // 竖屏成品画在哪
  if (LAND) {
    // 左：原片 + 移动的裁切框
    const sx = 60 * u, sw = W * .52, sh = sw * vh / vw, sy = (H - sh) / 2 - 20 * u;
    ctx.drawImage(el, sx, sy, sw, sh);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    const k = sw / vw, bx = sx + crop[0] * k, bw = crop[2] * k, by = sy + crop[1] * k, bh = crop[3] * k;
    ctx.fillRect(sx, sy, bx - sx, sh); ctx.fillRect(bx + bw, sy, sx + sw - bx - bw, sh);
    ctx.fillRect(bx, sy, bw, by - sy); ctx.fillRect(bx, by + bh, bw, sy + sh - by - bh);
    ctx.strokeStyle = Y; ctx.lineWidth = 3 * u; ctx.strokeRect(bx, by, bw, bh);
    const fz = f.size * vh * k;
    ctx.strokeStyle = C; ctx.lineWidth = 2 * u; ctx.setLineDash([8 * u, 6 * u]);
    ctx.strokeRect(sx + f.x * sw - fz / 2, sy + f.y * sh - fz / 2, fz, fz); ctx.setLineDash([]);
    ctx.font = `700 ${18 * u}px 'JetBrains Mono'`; ctx.fillStyle = C; ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
    ctx.fillText(`FACE ${f.x.toFixed(2)}, ${f.y.toFixed(2)}`, sx + f.x * sw - fz / 2, sy + f.y * sh - fz / 2 - 6 * u);
    ctx.font = `700 ${22 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff'; ctx.textBaseline = 'top';
    ctx.fillText('原片 16:9 · 裁切框跟着人脸走', sx, sy + sh + 18 * u);
    ctx.font = `400 ${18 * u}px 'JetBrains Mono'`; ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.fillText(`SRC ${src.toFixed(2)} s  ·  CUT ${s.segs.indexOf(g) + 1}/${s.segs.length}`, sx, sy + sh + 54 * u);
    // 右：手机
    const pw = H * .78 * 9 / 16, phh = H * .78, px = W - pw - 90 * u, py = (H - phh) / 2;
    ctx.fillStyle = '#000'; rr(ctx, px - 12 * u, py - 12 * u, pw + 24 * u, phh + 24 * u, 36 * u); ctx.fill();
    ctx.strokeStyle = '#30363d'; ctx.lineWidth = 3 * u; ctx.stroke();
    ph = [px, py, pw, phh];
  } else ph = [0, 0, W, H];
  await vertical(ctx, el, crop, ph, to, g, s, u);
  ctx.restore();
}

async function vertical(ctx, el, crop, [px, py, pw, ph], to, g, s, u) {
  const k = pw / 1080;          // 竖屏成品按 1080 宽排版
  ctx.save(); rr(ctx, px, py, pw, ph, LAND ? 26 * u : 0); ctx.clip();
  ctx.fillStyle = '#111'; ctx.fillRect(px, py, pw, ph);
  const vh = ph * .56, vy = py + ph * .17;
  ctx.drawImage(el, crop[0], crop[1], crop[2], crop[3], px, vy, pw, vh);
  // 跳切处闪一下
  const fl = 1 - smooth(g.o, g.o + .1, to);
  if (fl > 0 && g.o > 0) { ctx.fillStyle = `rgba(255,255,255,${fl * .35})`; ctx.fillRect(px, vy, pw, vh); }
  // 顶部标题
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = Y; ctx.font = `900 ${64 * k}px 'Noto Sans SC'`;
  ctx.fillText('宇航员金句', px + pw / 2, py + ph * .075);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `400 ${30 * k}px 'Noto Sans SC'`;
  ctx.fillText('Bob Behnken · 2020 年发射前访谈', px + pw / 2, py + ph * .13);
  // 逐词字幕：这一句的词，说到的点亮
  const sent = s.picks[g.k], E = s.E;
  const ws = [];
  for (let i = sent.w[0]; i <= sent.w[1]; i++) if (!s.drop.has(i)) ws.push(i);
  const src = g.a + (to - g.o);
  const fs = 56 * k;
  ctx.font = `900 ${fs}px 'Noto Sans SC'`;
  const lines = [[]], maxW = pw * .86;
  let lw = 0;
  for (const i of ws) {
    const wd = E.words[i][0].replace(/^./, c => c.toUpperCase() === c ? c : c) + ' ';
    const w = ctx.measureText(wd).width;
    if (lw + w > maxW && lines.at(-1).length) { lines.push([]); lw = 0; }
    lines.at(-1).push([i, wd, w]); lw += w;
  }
  const cy0 = vy + vh + 70 * k;
  lines.forEach((ln, r) => {
    const tw = ln.reduce((a, b) => a + b[2], 0);
    let x = px + (pw - tw) / 2;
    for (const [i, wd, w] of ln) {
      const said = segOf(s, i) && E.words[i][1] <= src + .02 && (segOf(s, i).o <= to);
      const now = said && E.words[i][2] > src;
      ctx.textAlign = 'left';
      ctx.lineWidth = 10 * k; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
      const yy = cy0 + r * fs * 1.25 - (now ? 6 * k : 0);
      ctx.strokeText(wd, x, yy);
      ctx.fillStyle = now ? Y : said ? '#fff' : 'rgba(255,255,255,.35)';
      ctx.fillText(wd, x, yy);
      x += w;
    }
  });
  ctx.textAlign = 'center';
  ctx.font = `700 ${40 * k}px 'Noto Sans SC'`; ctx.fillStyle = C;
  ctx.fillText(ZH[g.k], px + pw / 2, cy0 + lines.length * fs * 1.25 + 30 * k);
  // 删字提示：这一段前面删掉的词
  const prev = s.segs[s.segs.indexOf(g) - 1];
  if (prev && prev.k === g.k) {
    const gone = [];
    for (let i = sent.w[0]; i <= sent.w[1]; i++) if (s.drop.has(i) && E.words[i][1] >= prev.b - .1 && E.words[i][2] <= g.a + .1) gone.push(E.words[i][0]);
    const q = 1 - smooth(g.o + .5, g.o + .9, to);
    if (gone.length && q > 0) {
      ctx.globalAlpha *= q;
      const txt = '✂ 删去 “' + gone.join(' ') + '”';
      ctx.font = `700 ${34 * k}px 'Noto Sans SC'`;
      const w = ctx.measureText(txt).width + 40 * k;
      ctx.fillStyle = R; rr(ctx, px + pw / 2 - w / 2, vy + 30 * k, w, 60 * k, 30 * k); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(txt, px + pw / 2, vy + 60 * k);
    }
  }
  // 进度条
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(px, py + ph - 8 * k, pw, 8 * k);
  ctx.fillStyle = Y; ctx.fillRect(px, py + ph - 8 * k, pw * to / s.total, 8 * k);
  ctx.restore();
}
function segOf(s, i) {
  const [w, a, b] = s.E.words[i];
  return s.segs.find(g => a >= g.a - .05 && b <= g.b + .05);
}

// ---------- 结尾：金句卡 ----------
function outro(ctx, t, s, u) {
  const a = smooth(.1, .5, t);
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = Y; ctx.font = `900 ${(LAND ? 140 : 160) * u}px 'Noto Sans SC'`;
  ctx.fillText('“', W / 2, H * .3);
  const en = s.picks[0].text.replace(/^And so /, '').replace(' kind of a', '');
  ctx.font = `900 ${(LAND ? 50 : 56) * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff';
  const lines = wrapWords(ctx, en, W * (LAND ? .7 : .84));
  lines.forEach((l, i) => ctx.fillText(l, W / 2, H * .42 + i * 66 * u));
  ctx.font = `700 ${(LAND ? 36 : 40) * u}px 'Noto Sans SC'`; ctx.fillStyle = C;
  ctx.fillText(ZH[0], W / 2, H * .42 + lines.length * 66 * u + 30 * u);
  ctx.font = `400 ${26 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillText(`— Bob Behnken · NASA 宇航员 · 2020 年发射前访谈`, W / 2, H * .42 + lines.length * 66 * u + 110 * u);
  ctx.font = `700 ${22 * u}px 'JetBrains Mono'`; ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.fillText(`54.0 s → ${s.total.toFixed(1)} s · ${s.picks.length} 句 · ${s.segs.length} 段`, W / 2, H * .42 + lines.length * 66 * u + 160 * u);
  ctx.restore();
}

// 英文按词折行
function wrapWords(ctx, text, maxW) {
  const out = [''];
  for (const w of text.split(' ')) {
    const t = out.at(-1) ? out.at(-1) + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && out.at(-1)) out.push(w); else out[out.length - 1] = t;
  }
  return out;
}
