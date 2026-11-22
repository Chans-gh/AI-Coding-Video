// 新闻资讯解说风格包（由 T-007 沉淀）：公共领域照片 + 公开数据，做成电视新闻式的解说短片。
// 切换的维度是「画面组织」（照片怎么上屏），不是颜色：同一张分镜表、同一套栏目包装和数据图，换一个 layout 参数——
//   kenburns 单图推拉：照片铺满、慢推慢移；纯代码的镜头（数据、讲述）后面铺一张调暗的照片当底
//   parallax 2.5D 视差分层：照片按深度图切成远、中、近三层，镜头横移时各层速度不同；纯代码镜头后面是几张前后错开、各自漂移的照片卡
//   collage  多图拼贴分屏：几张照片同时上屏，按拍点一格格滑进来；纯代码镜头后面是一面照片网格，照片框里另有一格全图小窗
// 每种画面组织是一个对象：draw() 画整屏照片镜头（标题、对比），frame() 把一张照片放进一个框，backdrop() 画纯代码镜头的底，
// 所以三种画面组织共用同一套部件，每个镜头都看得出换了哪种。
// 依赖 samples/lib/lib.js 的 W H LAND SHORT、inv/lerp/clamp/smooth、缓动、rr()、wrapCJK()、mk()、cueAt()、circlePts()、drawPartial()。
// 部件签名都是 (ctx, K, t, o)：K 是 theme() 的结果（场景在 init 里往 K 上挂 K.P 照片、K.L 画面组织、K.geo 地图、K.D 数据），
// t 是部件自己的本地时间（秒，可以为负），o 是内容。每帧只由 t 决定。要被叠加的部件返回可标注的位置。
const NB = (() => {
  // 主题：颜色固定（新闻红 + 深蓝），不随画面组织变
  function theme(o = {}) {
    return {
      red: o.red || '#E0313B', navy: '#0E2238', bg: '#070B10', ink: '#F5F7FA', muted: 'rgba(245,247,250,.72)',
      glass: 'rgba(8,14,22,.78)', line: 'rgba(255,255,255,.18)', gold: '#FFC94A', green: '#35C27A', blue: '#4FA3E0', paper: '#EFE8D8',
      head: o.head || "'Noto Sans SC'", num: o.num || "'Bebas Neue'", mono: o.mono || "'JetBrains Mono'",
      u: SHORT / 1080, beat: o.beat || .4,
    };
  }
  const F = (K, w, px, fam = K.head) => `${w} ${Math.round(px * K.u)}px ${fam}`;
  const pop = (t, d = .5) => eOutCubic(clamp(t / d));
  const fmt = (v, d = 0) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  // 正文区：横屏避开左上栏目条和底部字幕、滚动条；竖屏上下各留出更多
  function area(K) {
    const u = K.u;
    return LAND ? [120 * u, 150 * u, W - 240 * u, H - 400 * u] : [60 * u, 250 * u, W - 120 * u, H - 720 * u];
  }
  // 一行字从下往上冒出来（裁在行框里）
  function rise(ctx, text, x, y, lh, p) {
    ctx.save(); ctx.beginPath(); ctx.rect(x - 4 * SHORT / 1080, y - lh * .95, W, lh * 1.25); ctx.clip();
    ctx.fillText(text, x, y + (1 - p) * lh); ctx.restore();
  }
  // 镜头抬头：眉题（金色等宽）+ 标题 + 红短条；返回正文从哪里开始
  function header(ctx, K, t, o, A) {
    const [x, y, w] = A, u = K.u; let yy = y;
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (o.kicker) {
      const e = pop(t, .35); ctx.globalAlpha = e; ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.gold;
      ctx.fillText(o.kicker, x + (1 - e) * 30 * u, yy + 26 * u); yy += 44 * u; ctx.globalAlpha = 1;
    }
    if (o.title) {
      ctx.font = F(K, 900, LAND ? 58 : 62); ctx.fillStyle = K.ink;
      const lh = (LAND ? 70 : 76) * u, ls = wrapCJK(ctx, o.title, w);
      ls.forEach((l, i) => rise(ctx, l, x, yy + lh * (i + .85), lh, pop(t - .08 - i * .08, .45)));
      yy += ls.length * lh;
      ctx.fillStyle = K.red; ctx.fillRect(x, yy + 10 * u, 120 * u * pop(t - .2, .4), 7 * u); yy += 44 * u;
    }
    ctx.restore(); return yy;
  }
  function glass(ctx, K, x, y, w, h, a = 1) {
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = K.glass; rr(ctx, x, y, w, h, 16 * K.u); ctx.fill();
    ctx.strokeStyle = K.line; ctx.lineWidth = 1.5 * K.u; ctx.stroke(); ctx.restore();
  }
  // 字号自动缩到放得下
  function fit(ctx, K, text, maxW, px, w = 900, fam = K.head) {
    let s = px; ctx.font = F(K, w, s, fam);
    while (s > 12 && ctx.measureText(text).width > maxW) { s -= 2; ctx.font = F(K, w, s, fam); }
    return s;
  }
  const series = (K, o) => typeof o === 'string' ? K.D[o] : o;
  // 换行：中文逐字断，英文按词断（wrapCJK 会把英文单词拆开）
  function wrap(ctx, text, maxW) {
    const toks = text.match(/[A-Za-z0-9'’“”".,:;!?()\/\-]+\s*|\s+|./g) || [], out = []; let cur = '';
    for (const k of toks) {
      if (cur && ctx.measureText((cur + k).trimEnd()).width > maxW) { out.push(cur.trimEnd()); cur = k.trimStart(); }
      else cur += k;
    }
    if (cur.trim()) out.push(cur.trimEnd());
    return out;
  }
  // ── 照片准备（init 里做一次）：有深度图就切成三层，层下被挡住的地方用周围颜色补上，视差移动时不露出重影 ──
  function photo(img, depth, cuts = [.35, .72]) {
    const P = { img, w: img.naturalWidth || img.width, h: img.naturalHeight || img.height, layers: null };
    if (!depth) return P;
    const w = P.w, h = P.h, c = mk(w, h), g = c.getContext('2d');
    g.drawImage(img, 0, 0); const src = g.getImageData(0, 0, w, h).data;
    g.drawImage(depth, 0, 0, w, h); const dep = g.getImageData(0, 0, w, h).data;
    // 补洞：把「被挡住的部分」挖掉后做归一化模糊（模糊颜色 ÷ 模糊遮罩），挖掉的地方就填上了四周的颜色
    const fill = (t) => {
      const s = 1 / 8, sw = Math.ceil(w * s), sh = Math.ceil(h * s), a = mk(sw, sh), ag = a.getContext('2d');
      const cut = mk(w, h), cg = cut.getContext('2d'), id = cg.createImageData(w, h);
      for (let i = 0; i < w * h; i++) {
        const keep = 1 - smooth(t - .05, t + .02, dep[i * 4] / 255);
        id.data[i * 4] = src[i * 4]; id.data[i * 4 + 1] = src[i * 4 + 1]; id.data[i * 4 + 2] = src[i * 4 + 2]; id.data[i * 4 + 3] = keep * 255;
      }
      cg.putImageData(id, 0, 0);
      let cur = cut;
      for (const r of [3, 6, 12]) {                        // 多次放大模糊半径，大块空洞也能填满
        ag.clearRect(0, 0, sw, sh); ag.filter = `blur(${r}px)`; ag.drawImage(cur, 0, 0, sw, sh); ag.filter = 'none';
        const b = ag.getImageData(0, 0, sw, sh), d = b.data;
        for (let i = 0; i < sw * sh; i++) { const al = d[i * 4 + 3]; if (al > 0) { const k = 255 / al; d[i * 4] *= k; d[i * 4 + 1] *= k; d[i * 4 + 2] *= k; d[i * 4 + 3] = 255; } }
        ag.putImageData(b, 0, 0);
        const nx = mk(w, h), ng = nx.getContext('2d'); ng.drawImage(a, 0, 0, w, h); ng.drawImage(cut, 0, 0); cur = nx;
      }
      return cur;
    };
    const mask = (base, t) => {                            // base 里只留深度 ≥ t 的像素（边缘羽化）
      const o = mk(w, h), og = o.getContext('2d'); og.drawImage(base, 0, 0);
      const id = og.getImageData(0, 0, w, h);
      for (let i = 0; i < w * h; i++) id.data[i * 4 + 3] *= smooth(t - .04, t + .02, dep[i * 4] / 255);
      og.putImageData(id, 0, 0); return o;
    };
    P.layers = [fill(cuts[0]), mask(fill(cuts[1]), cuts[0]), mask(img, cuts[1])];
    return P;
  }

  // 「铺满」画进矩形 r，返回照片坐标 (u,v)（0–1）→ 屏幕坐标的映射；ox、oy 是额外的平移（像素）
  function cover(ctx, src, P, r, z = 1, fx = .5, fy = .5, ox = 0, oy = 0, alpha = 1) {
    const [x, y, w, h] = r, k = Math.max(w / P.w, h / P.h) * z, dw = P.w * k, dh = P.h * k;
    const dx = x + (w - dw) * fx + ox, dy = y + (h - dh) * fy + oy;
    if (src && alpha > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalAlpha *= alpha;
      ctx.drawImage(src, dx, dy, dw, dh); ctx.restore();
    }
    return (u, v) => [dx + u * dw, dy + v * dh];
  }
  const FULL = () => [0, 0, W, H];
  const mv = (m, p) => ({ z: lerp(m.z[0], m.z[1], p), fx: lerp(m.fx[0], m.fx[1], p), fy: lerp(m.fy[0], m.fy[1], p) });
  const MOVE = { z: [1.04, 1.16], fx: [.5, .5], fy: [.5, .5] };
  // 全屏铺照片的两种组织方式，留给文字卡的位置一样
  const fullBox = kind => {
    const u = SHORT / 1080;
    if (kind === 'chart') return LAND ? [W * .53, 150 * u, W * .47 - 90 * u, H - 420 * u] : [50 * u, H * .36, W - 100 * u, H * .36];
    if (kind === 'note') return LAND ? [W * .5, 130 * u, W * .5 - 60 * u, 190 * u] : [50 * u, 190 * u, W - 100 * u, 280 * u];
    return LAND ? [90 * u, H * .5, W * .75, H * .3] : [60 * u, H * .64, W - 120 * u, H * .2];     // headline
  };

  // ── 三种画面组织。draw(ctx, K, t, d, shot, P) 画出这一段的照片，返回 { box: 文字卡的位置, pin(i, u, v) → 第 i 张照片上某点的屏幕坐标 } ──
  // shot：{ photos: ['名字', …], kind: 'headline' | 'chart' | 'note' | 'compare', move: { z, fx, fy 各 [起, 止] }, labels: [第 i 张的标签] }
  const kenburns = {
    draw(ctx, K, t, d, shot, P) {
      const p = smooth(0, d + .6, t), A = P[shot.photos[0]];
      if (shot.kind === 'compare') {                       // 两张同一取景的照片：一根竖线从右往左扫，线右边是新的
        const B = P[shot.photos[1]], c = mv(shot.move || MOVE, p);
        const map = cover(ctx, A.img, A, FULL(), c.z, c.fx, c.fy);
        const sx = W * lerp(1.02, .5, eInOutCubic(inv(.5, 1.6, t))) - W * .5 * eInOutCubic(inv(2.4, 3.3, t));
        ctx.save(); ctx.beginPath(); ctx.rect(sx, 0, W - sx, H); ctx.clip(); cover(ctx, B.img, B, FULL(), c.z, c.fx, c.fy); ctx.restore();
        ctx.fillStyle = '#fff'; ctx.fillRect(sx - 2 * K.u, 0, 4 * K.u, H);
        ctx.save(); ctx.fillStyle = K.red; ctx.beginPath(); ctx.arc(sx, H / 2, 22 * K.u, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = F(K, 900, 22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('‹ ›', sx, H / 2 + 1); ctx.restore();
        tag(ctx, K, t - .2, [W * .04 + 0, H * (LAND ? .2 : .16)], shot.labels[0], 'left', sx > W * .25 ? 1 : 0);
        tag(ctx, K, t - 1.2, [W * .96, H * (LAND ? .2 : .16)], shot.labels[1], 'right', 1);
        return { box: null, pin: () => [0, 0] };
      }
      const c = mv(shot.move || MOVE, p), map = cover(ctx, A.img, A, FULL(), c.z, c.fx, c.fy);
      return { box: fullBox(shot.kind), pin: (i, u, v) => map(u, v) };
    },
  };

  const parallax = {
    DEPTH: [.25, .7, 1.6],                                 // 远、中、近三层的横移倍数
    draw(ctx, K, t, d, shot, P) {
      const p = smooth(0, d + .6, t), m = shot.move || MOVE, c = mv(m, p);
      const amp = (LAND ? 70 : 55) * K.u, dx = lerp(1, -1, p) * amp, dy = lerp(-.3, .3, p) * amp * .4;
      if (shot.kind === 'compare') {                       // 卫星图没有深度：两张当成前后两张卡片，后面一张远、前面一张近
        const A = P[shot.photos[0]], B = P[shot.photos[1]];
        const r0 = LAND ? [W * .06, H * .14, W * .5, H * .66] : [W * .06, H * .12, W * .88, H * .4];
        const r1 = LAND ? [W * .44, H * .24, W * .5, H * .66] : [W * .06, H * .46, W * .88, H * .4];
        ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
        cover(ctx, A.img, A, FULL(), 1.2 + p * .05, .5, .5, dx * .2, 0, .35);    // 远景：模糊的底
        ctx.fillStyle = 'rgba(7,11,16,.55)'; ctx.fillRect(0, 0, W, H);
        const card = (Q, r, k, enter, lab, al) => {
          const e = pop(t - enter, .7), z = lerp(.92, 1, e), ox = dx * k + (1 - e) * (LAND ? 120 : 0) * K.u, oy = dy * k + (1 - e) * (LAND ? 0 : 120) * K.u;
          const [x, y, w, h] = r, cx = x + w / 2, cy = y + h / 2;
          ctx.save(); ctx.globalAlpha = e; ctx.translate(cx + ox, cy + oy); ctx.scale(z, z); ctx.translate(-cx, -cy);
          ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 50 * K.u * k; ctx.shadowOffsetY = 20 * K.u * k;
          ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h); ctx.shadowColor = 'transparent';
          cover(ctx, Q.img, Q, r, 1.15 + p * .08, .5, .5);
          ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3 * K.u; ctx.strokeRect(x, y, w, h);
          tag(ctx, K, t - enter - .3, [x + 24 * K.u, y + 24 * K.u], lab, 'left', 1, true);
          ctx.restore();
        };
        card(A, r0, .55, 0, shot.labels[0]);
        card(B, r1, 1.25, 1.1, shot.labels[1]);
        return { box: null, pin: () => [0, 0] };
      }
      const A = P[shot.photos[0]];
      if (!A.layers) { const map = cover(ctx, A.img, A, FULL(), c.z, c.fx, c.fy, dx, dy); return { box: fullBox(shot.kind), pin: (i, u, v) => map(u, v) }; }
      let mid = null;
      A.layers.forEach((L, k) => {                         // 近处的层多推一点、多挪一点
        const f = this.DEPTH[k], z = c.z * (1 + (f - .7) * .05 * p);
        const map = cover(ctx, L, A, FULL(), z, c.fx, c.fy, dx * f, dy * f);
        if (k === 1) mid = map;
      });
      return { box: fullBox(shot.kind), pin: (i, u, v) => mid(u, v) };
    },
  };

  const collage = {
    // 每种镜头的格子：横屏左右分、竖屏上下分；照片格在前，最后一格（如果有）留给文字卡
    cells(shot) {
      const u = SHORT / 1080, g = 14 * u, top = (LAND ? 120 : 200) * u, bot = (LAND ? 190 : 330) * u;
      const X = g * 2, Y = top, Wd = W - g * 4, Hd = H - top - bot;
      const n = shot.photos.length, text = shot.kind !== 'compare';
      if (LAND) {
        if (!text) return [[X, Y, Wd / 2 - g / 2, Hd], [X + Wd / 2 + g / 2, Y, Wd / 2 - g / 2, Hd]];
        if (n === 1) return [[X, Y, Wd * .58 - g / 2, Hd], [X + Wd * .58 + g / 2, Y, Wd * .42 - g / 2, Hd]];
        return [[X, Y, Wd * .4 - g / 2, Hd], [X + Wd * .4 + g / 2, Y, Wd * .25 - g, Hd], [X + Wd * .65 + g / 2, Y, Wd * .35 - g / 2, Hd]];
      }
      if (!text) return [[X, Y, Wd, Hd / 2 - g / 2], [X, Y + Hd / 2 + g / 2, Wd, Hd / 2 - g / 2]];
      if (n === 1) return [[X, Y, Wd, Hd * .5 - g / 2], [X, Y + Hd * .5 + g / 2, Wd, Hd * .5 - g / 2]];
      return [[X, Y, Wd / 2 - g / 2, Hd * .44], [X + Wd / 2 + g / 2, Y, Wd / 2 - g / 2, Hd * .44], [X, Y + Hd * .44 + g, Wd, Hd * .56 - g]];
    },
    draw(ctx, K, t, d, shot, P) {
      const cs = this.cells(shot), p = smooth(0, d + .6, t), maps = [];
      ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
      const cellIn = k => pop(t - k * K.beat, .55);
      shot.photos.forEach((n, k) => {
        const A = P[n], [x, y, w, h] = cs[k], e = cellIn(k), dir = LAND ? [0, 1] : [1, 0];
        const ox = dir[0] * (1 - e) * w * .3 * (k % 2 ? 1 : -1), oy = dir[1] * (1 - e) * h * .3 * (k % 2 ? -1 : 1);
        ctx.save(); ctx.globalAlpha = e; ctx.translate(ox, oy);
        const mm = shot.move || MOVE, c = mv(mm, p);
        maps[k] = cover(ctx, A.img, A, cs[k], 1 + (c.z - 1) * .5 + .04 * k, c.fx, c.fy);
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2 * K.u; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        if (shot.labels && shot.labels[k]) tag(ctx, K, t - k * K.beat - .2, [x + 22 * K.u, y + 22 * K.u], shot.labels[k], 'left', 1, true);
        ctx.restore();
        ctx.fillStyle = K.red; ctx.fillRect(x, y + h - 6 * K.u, w * eOutCubic(inv(.1, .7, t - k * K.beat)), 6 * K.u);
      });
      const box = shot.kind === 'compare' ? null : cs[cs.length - 1];
      if (box) {
        const e = cellIn(shot.photos.length);
        ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.navy; ctx.fillRect(...box); ctx.restore();
      }
      return { box, pin: (i, u, v) => maps[i] ? maps[i](u, v) : [0, 0], panel: true };
    },
  };
  // ── 三种画面组织的另外两样：frame() 把一张照片放进框 r，backdrop() 画纯代码镜头后面的底 ──
  // frame(ctx, K, t, A, r, v) 的 v：{ z 放大, fx, fy 取景焦点, ox, oy 平移（像素）, pan 横移方向 ±1 }，返回照片 (u, v) → 屏幕坐标
  // backdrop(ctx, K, t, names, seed)：names 是这一章用到的几张照片
  const dim = (ctx, a) => { ctx.fillStyle = `rgba(7,11,16,${a})`; ctx.fillRect(0, 0, W, H); };
  const edge = (ctx, K, r, c = 'rgba(255,255,255,.85)', lw = 2) => { ctx.strokeStyle = c; ctx.lineWidth = lw * K.u; ctx.strokeRect(r[0] + .5, r[1] + .5, r[2] - 1, r[3] - 1); };
  Object.assign(kenburns, {
    frame(ctx, K, t, A, r, v = {}) {
      const p = smooth(0, 3, t), z = (v.z || 1) * (1.04 + .1 * p);
      const map = cover(ctx, A.img, A, r, z, v.fx ?? .5, v.fy ?? .5, (v.ox || 0) + (v.pan || 1) * lerp(-1, 1, p) * r[2] * .015, v.oy || 0);
      edge(ctx, K, r, 'rgba(255,255,255,.35)', 1.5); return map;
    },
    backdrop(ctx, K, t, names, seed = 0) {
      const A = K.P[names[0]];
      cover(ctx, A.img, A, FULL(), 1.08 + .06 * Math.sin(t * .15 + seed), .5 + .04 * Math.sin(t * .1), .5);
      dim(ctx, .6);
      const g = ctx.createRadialGradient(W / 2, H / 2, SHORT * .2, W / 2, H / 2, LONG * .7);
      g.addColorStop(0, 'rgba(7,11,16,0)'); g.addColorStop(1, 'rgba(7,11,16,.7)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  });
  Object.assign(parallax, {
    frame(ctx, K, t, A, r, v = {}) {
      const [x, y, w, h] = r, p = smooth(0, 3, t), fl = Math.sin(t * 1.3 + x * .01) * 6 * K.u;
      ctx.save(); ctx.translate(0, fl);
      ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 40 * K.u; ctx.shadowOffsetY = 18 * K.u; ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h); ctx.shadowColor = 'transparent';
      let map, amp = w * .035 * (v.pan || 1), dx = lerp(1, -1, p) * amp, z = (v.z || 1) * 1.1;
      if (A.layers) A.layers.forEach((L, k) => { const m = cover(ctx, L, A, r, z * (1 + k * .02 * p), v.fx ?? .5, v.fy ?? .5, (v.ox || 0) + dx * this.DEPTH[k], v.oy || 0); if (k === 1) map = m; });
      else map = cover(ctx, A.img, A, r, z, v.fx ?? .5, v.fy ?? .5, (v.ox || 0) + dx, v.oy || 0);
      edge(ctx, K, r, 'rgba(255,255,255,.9)', 3); ctx.restore();
      return (a, b) => { const q = map(a, b); return [q[0], q[1] + fl]; };
    },
    backdrop(ctx, K, t, names, seed = 0) {
      ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
      const u = K.u, cards = [[.08, .1, .5, 1, .25], [.55, .18, .42, .8, .6], [.22, .58, .36, .7, 1.1], [.7, .62, .3, .6, 1.5]];
      cards.forEach(([cx, cy, s, dep, sp], k) => {
        const A = K.P[names[k % names.length]], w = (LAND ? W : W * 1.6) * s * .62, h = w * .66;
        const x = cx * W - (LAND ? 0 : w * .3) + Math.sin(t * .2 * sp + k) * 40 * u * sp - t * 14 * u * sp, y = cy * H + Math.cos(t * .17 * sp + k) * 22 * u * sp;
        ctx.save(); ctx.globalAlpha = .6 + .3 * dep; ctx.translate(x + w / 2, y + h / 2); ctx.rotate((k % 2 ? 1 : -1) * .04); ctx.translate(-w / 2, -h / 2);
        ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 50 * u; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); ctx.shadowColor = 'transparent';
        cover(ctx, A.img, A, [0, 0, w, h], 1.05); edge(ctx, K, [0, 0, w, h], 'rgba(255,255,255,.6)', 2); ctx.restore();
      });
      dim(ctx, .5);
    },
  });
  Object.assign(collage, {
    frame(ctx, K, t, A, r, v = {}) {
      const [x, y, w, h] = r, p = smooth(0, 3, t), u = K.u;
      const map = cover(ctx, A.img, A, r, (v.z || 1) * (1.02 + .05 * p), v.fx ?? .5, v.fy ?? .5, v.ox || 0, v.oy || 0);
      edge(ctx, K, r, '#fff', 3);
      const e = pop(t - .35, .4), iw = Math.min(w, h) * .42, ih = iw * .7, ix = x + w - iw - 14 * u, iy = y + 14 * u;   // 全图小窗：同一张照片完整的样子
      if (e > 0) {
        ctx.save(); ctx.globalAlpha = e; ctx.translate(0, (1 - e) * -20 * u); ctx.fillStyle = K.navy; ctx.fillRect(ix - 4 * u, iy - 4 * u, iw + 8 * u, ih + 8 * u);
        cover(ctx, A.img, A, [ix, iy, iw, ih], 1); edge(ctx, K, [ix, iy, iw, ih], '#fff', 2);
        ctx.fillStyle = K.red; ctx.fillRect(ix, iy + ih - 5 * u, iw * e, 5 * u); ctx.restore();
      }
      return map;
    },
    backdrop(ctx, K, t, names, seed = 0) {
      ctx.fillStyle = K.navy; ctx.fillRect(0, 0, W, H);
      const cols = LAND ? 4 : 2, rows = LAND ? 3 : 4, g = 10 * K.u, cw = (W - g * (cols + 1)) / cols, ch = (H - g * (rows + 1)) / rows;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = j * cols + i, A = K.P[names[k % names.length]], drift = ((i + j) % 2 ? 1 : -1) * t * 6 * K.u;
        cover(ctx, A.img, A, [g + i * (cw + g), g + j * (ch + g), cw, ch], 1.15 + .03 * hash1(k), hash1(k + 9), .5, drift, 0);
      }
      dim(ctx, .64);
    },
  });
  // ── 栏目包装（三种画面组织共用）──
  // 日期、地点标签：红底白字的小牌子
  function tag(ctx, K, t, [x, y], text, align = 'left', alpha = 1, small = false) {
    if (!text || t < 0) return;
    const e = pop(t, .4); ctx.save(); ctx.globalAlpha *= e * alpha;
    ctx.font = F(K, 900, small ? 30 : 38); const w = ctx.measureText(text).width + 36 * K.u, h = (small ? 50 : 62) * K.u;
    const x0 = align === 'right' ? x - w : x;
    ctx.fillStyle = K.red; ctx.fillRect(x0, y, w * e, h);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y, w * e, h); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(text, x0 + 18 * K.u, y + h / 2 + 1);
    ctx.restore(); ctx.restore();
  }
  // 台标位：左上角栏目名，右上角日期
  function bug(ctx, K, t, o) {
    const u = K.u, e = pop(t, .5), x = (LAND ? 60 : 40) * u, y = (LAND ? 46 : 90) * u;
    ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'left';
    ctx.font = F(K, 900, 30); const w1 = ctx.measureText(o.show).width + 34 * u;
    ctx.fillStyle = K.red; ctx.fillRect(x, y, w1, 52 * u);
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(o.show, x + 17 * u, y + 27 * u);
    ctx.font = F(K, 700, 22, K.mono); const w2 = ctx.measureText(o.en).width + 28 * u;
    ctx.fillStyle = K.navy; ctx.fillRect(x + w1, y, w2, 52 * u);
    ctx.fillStyle = K.ink; ctx.fillText(o.en, x + w1 + 14 * u, y + 27 * u);
    if (o.date) { ctx.textAlign = 'right'; ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.ink; ctx.fillText(o.date, W - x, y + 27 * u); }
    ctx.restore();
  }
  // 标题：小引题 + 大标题 + 红条，盖在照片暗部；box 由画面组织给
  function headline(ctx, K, t, box, o, panel) {
    const [x, y, w, h] = box, u = K.u;
    if (!panel) {                                          // 全屏照片：从下往上压暗，保证字看得清
      const g = ctx.createLinearGradient(0, y - 120 * u, 0, H); g.addColorStop(0, 'rgba(7,11,16,0)'); g.addColorStop(1, 'rgba(7,11,16,.85)');
      ctx.fillStyle = g; ctx.fillRect(0, y - 120 * u, W, H - y + 120 * u);
    }
    const pad = panel ? 40 * u : 0, e1 = pop(t - .2, .5), e2 = pop(t - .45, .6);
    ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.fillStyle = K.gold; ctx.font = F(K, 700, 32); ctx.globalAlpha = e1; ctx.fillText(o.kicker, x + pad, y + pad + 40 * u);
    ctx.globalAlpha = 1; ctx.fillStyle = K.red; ctx.fillRect(x + pad, y + pad + 62 * u, (panel ? w - pad * 2 : 140 * u) * e1, 8 * u);
    ctx.font = F(K, 900, LAND ? (panel ? 76 : 96) : 84); ctx.fillStyle = K.ink;
    const lines = wrapCJK(ctx, o.title, w - pad * 2), lh = (LAND ? (panel ? 92 : 112) : 102) * u;
    lines.forEach((l, i) => {
      const yy = y + pad + 160 * u + i * lh, k = pop(t - .45 - i * .15, .6);
      ctx.save(); ctx.beginPath(); ctx.rect(x, yy - lh, W, lh * 1.15); ctx.clip();
      ctx.fillText(l, x + pad, yy + (1 - k) * lh); ctx.restore();
    });
    if (o.sub) { ctx.globalAlpha = e2; ctx.font = F(K, 400, 34); ctx.fillStyle = K.muted; ctx.fillText(o.sub, x + pad, y + pad + 160 * u + lines.length * lh + 6 * u); }
    ctx.restore();
  }
  // 数据卡：折线一点点画出，标出两个时刻，大数字报差值。rows: [{x 年份小数, y 数值}]
  function chart(ctx, K, t, box, o, panel) {
    const [bx, by, bw, bh] = box, u = K.u, e = pop(t, .5);
    ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'left';
    if (!panel) { ctx.fillStyle = K.glass; rr(ctx, bx, by, bw, bh, 18 * u); ctx.fill(); ctx.strokeStyle = K.line; ctx.lineWidth = 1.5 * u; ctx.stroke(); }
    const pad = 36 * u;
    ctx.fillStyle = K.gold; ctx.font = F(K, 700, 28); ctx.textBaseline = 'top'; ctx.fillText(o.title, bx + pad, by + pad);
    // 大数字
    const bigH = (LAND ? 150 : 130) * u, k = eOutCubic(inv(.9, 1.9, t)), val = lerp(0, o.big.value, k);
    ctx.font = F(K, 400, LAND ? 150 : 130, K.num); ctx.fillStyle = K.ink;
    const num = (val < 0 ? '−' : '') + Math.abs(val).toFixed(o.big.digits || 0);
    ctx.fillText(num, bx + pad, by + pad + 44 * u);
    const nw = ctx.measureText(num).width;
    ctx.font = F(K, 900, 44); ctx.fillStyle = K.red; ctx.fillText(o.big.unit, bx + pad + nw + 12 * u, by + pad + 44 * u + bigH * .42);
    ctx.font = F(K, 400, 26); ctx.fillStyle = K.muted; ctx.fillText(o.big.label, bx + pad, by + pad + 44 * u + bigH + 4 * u);
    // 折线
    const cx = bx + pad + 70 * u, cy = by + pad + 44 * u + bigH + 60 * u, cw = bw - pad * 2 - 70 * u, ch = by + bh - pad - 40 * u - cy;
    const R = o.rows, x0 = R[0].x, x1 = R[R.length - 1].x, y0 = o.ymin, y1 = o.ymax;
    const X = v => cx + (v - x0) / (x1 - x0) * cw, Y = v => cy + ch - (v - y0) / (y1 - y0) * ch;
    ctx.strokeStyle = K.line; ctx.lineWidth = 1; ctx.font = F(K, 400, 20, K.mono); ctx.fillStyle = K.muted; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
    for (const g of o.yticks) { ctx.beginPath(); ctx.moveTo(cx, Y(g) + .5); ctx.lineTo(cx + cw, Y(g) + .5); ctx.stroke(); ctx.fillText(g, cx - 12 * u, Y(g)); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const g of o.xticks) ctx.fillText(g, X(g), cy + ch + 12 * u);
    const pr = eInOutCubic(inv(.3, 2.2, t)), xe = lerp(x0, x1, pr);
    ctx.strokeStyle = K.ink; ctx.lineWidth = 3.5 * u; ctx.lineJoin = 'round'; ctx.beginPath();
    let last = null;
    for (const r of R) { if (r.x > xe) break; ctx[last ? 'lineTo' : 'moveTo'](X(r.x), Y(r.y)); last = r; }
    ctx.stroke();
    for (const m of o.marks) {                             // 两个对比时刻：线画到那里才出现
      if (xe < m.x) continue;
      const kk = pop((xe - m.x) * 3, .4), px = X(m.x), py = Y(m.y);
      ctx.fillStyle = m.hot ? K.red : K.ink; ctx.beginPath(); ctx.arc(px, py, 9 * u * kk, 0, TAU); ctx.fill();
      ctx.font = F(K, 700, 24); ctx.textAlign = m.align || 'left'; ctx.textBaseline = 'bottom'; ctx.globalAlpha = e * kk;
      ctx.fillStyle = m.hot ? K.red : K.ink; ctx.fillText(m.label, px + (m.align === 'right' ? -14 : 14) * u, py - 12 * u); ctx.globalAlpha = e;
    }
    if (last) { ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(X(last.x), Y(last.y), 5 * u, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // 照片上的标注：一道竖括号框住某段，加一句说明；a、b 是括号两端的屏幕坐标
  function note(ctx, K, t, box, o, a, b, panel) {
    const u = K.u, e = pop(t, .5), d = eOutCubic(inv(.2, .9, t));
    ctx.save(); ctx.textAlign = 'left';
    ctx.strokeStyle = K.gold; ctx.lineWidth = 5 * u; ctx.lineCap = 'round';
    const ym = lerp(a[1], b[1], .5);
    ctx.beginPath(); ctx.moveTo(a[0] - 16 * u, a[1]); ctx.lineTo(a[0], a[1]); ctx.lineTo(a[0], lerp(a[1], b[1], d)); ctx.stroke();
    if (d > .99) { ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - 16 * u, b[1]); ctx.stroke(); }
    ctx.setLineDash([10 * u, 10 * u]); ctx.lineWidth = 2.5 * u; ctx.globalAlpha = smooth(.6, 1, t) * .9;
    ctx.beginPath(); ctx.moveTo(a[0] - 16 * u, a[1]); ctx.lineTo(lerp(a[0], o.lineTo, eOutCubic(inv(.6, 1.6, t))), a[1]); ctx.stroke();
    ctx.restore();
    if (!box) return;
    const [x, y, w, h] = box, pad = 34 * u;
    ctx.save(); ctx.globalAlpha = e;
    if (!panel) { ctx.fillStyle = K.glass; rr(ctx, x, y, w, h, 18 * u); ctx.fill(); }
    ctx.fillStyle = K.gold; ctx.font = F(K, 700, 28); ctx.textBaseline = 'top'; ctx.fillText(o.kicker, x + pad, y + pad);
    ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 54 : 58);
    wrapCJK(ctx, o.title, w - pad * 2).forEach((l, i) => ctx.fillText(l, x + pad, y + pad + 50 * u + i * 70 * u));
    ctx.restore();
  }
  // 底部滚动条：出处一直在走
  function ticker(ctx, K, t, text) {
    const u = K.u, h = 54 * u, y = H - h - (LAND ? 26 : 120) * u;
    ctx.save(); ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(7,11,16,.86)'; ctx.fillRect(0, y, W, h);
    ctx.font = F(K, 900, 26); const lab = '来源'; const lw = ctx.measureText(lab).width + 40 * u;
    ctx.font = F(K, 400, 24); ctx.fillStyle = K.muted; ctx.textBaseline = 'middle';
    const s = text + '　　', sw = ctx.measureText(s).width, off = (t * 90 * u) % sw;
    ctx.beginPath(); ctx.rect(lw, y, W - lw, h); ctx.clip();
    for (let x = lw - off; x < W; x += sw) ctx.fillText(s, x + 20 * u, y + h / 2 + 1);
    ctx.restore();
    ctx.save(); ctx.textAlign = 'left'; ctx.fillStyle = K.red; ctx.fillRect(0, y, lw, h); ctx.fillStyle = '#fff'; ctx.font = F(K, 900, 26); ctx.textBaseline = 'middle';
    ctx.fillText(lab, 20 * u, y + h / 2 + 1); ctx.restore();
    return y;
  }
  // 字幕：跟旁白的逐句时间（assets.json 的 lines），放在滚动条上面
  function subtitle(ctx, K, t, A, above) {
    const c = cueAt(A, t); if (!c) return;
    caption(ctx, c.text, { size: LAND ? 40 : 46, y: above - 22 * K.u, bg: 'rgba(7,11,16,.72)', maxW: W * (LAND ? .7 : .86) });
  }
  // ══ 整屏部件 ══════════════════════════════════════════════════════════════════
  // ── 开场 ──
  // 快讯冷开场：红条从左边砸进来，条里斜纹在走，「快讯」闪两下，下面逐字打出一句
  function coldOpen(ctx, K, t, o) {
    const u = K.u, bh = (LAND ? 130 : 150) * u, y = H * (LAND ? .36 : .38), e = eOutExpo(clamp((t - .05) / .35)), x0 = (LAND ? 90 : 50) * u;
    dim(ctx, .3);
    ctx.save(); ctx.fillStyle = K.red; ctx.fillRect(0, y, W * e, bh);
    ctx.beginPath(); ctx.rect(0, y, W * e, bh); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.09)';
    for (let x = -bh + (t * 260 * u) % (70 * u); x < W; x += 70 * u) { ctx.beginPath(); ctx.moveTo(x, y + bh); ctx.lineTo(x + 32 * u, y + bh); ctx.lineTo(x + 32 * u + bh * .5, y); ctx.lineTo(x + bh * .5, y); ctx.fill(); }
    const on = t > .9 || Math.floor(t / .15) % 2 === 0;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = F(K, 900, LAND ? 96 : 92);
    if (on) ctx.fillText(o.flag, x0, y + bh / 2 + 4 * u);
    const fw = ctx.measureText(o.flag).width; ctx.font = F(K, 700, LAND ? 40 : 34, K.mono); ctx.fillText(o.en, x0 + fw + 30 * u, y + bh / 2 + 4 * u);
    ctx.beginPath(); ctx.arc(W - x0, y + bh / 2, 14 * u * (.6 + .4 * Math.abs(Math.sin(t * 8))), 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.fillStyle = K.navy; ctx.fillRect(0, y + bh, W * eOutExpo(clamp((t - .2) / .35)), 10 * u);
    const ch = [...o.line], n = Math.floor(clamp((t - .5) / .8) * ch.length);
    ctx.font = F(K, 900, LAND ? 60 : 58); ctx.fillStyle = K.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    wrapCJK(ctx, ch.slice(0, n).join(''), W - x0 * 2).forEach((l, i) => ctx.fillText(l, x0, y + bh + (110 + i * 76) * u));
    if (o.sub) { ctx.globalAlpha = pop(t - 1.3, .3); ctx.font = F(K, 700, 28, K.mono); ctx.fillStyle = K.gold; ctx.fillText(o.sub, x0, y - 34 * u); }
    ctx.restore(); return { box: [0, y, W, bh] };
  }
  // 头条砸字：几个词按拍一个个从大砸到原大，砸下时画面抖一下
  function slam(ctx, K, t, o) {
    const u = K.u, every = o.every || K.beat, ws = o.words, px = LAND ? 170 : 150, lh = px * 1.12 * u;
    dim(ctx, .2);
    const y0 = H / 2 - (ws.length * lh) / 2 + lh * .8;
    ws.forEach((w, i) => {
      const t0 = .05 + i * every, k = clamp((t - t0) / .2); if (k <= 0) return;
      const s = 1 + 1.4 * (1 - eOutExpo(k)), sh = t - t0 < .35 ? (hash1(Math.floor(t * 60)) - .5) * 18 * u * (1 - (t - t0) / .35) : 0;
      ctx.save(); ctx.translate(W / 2 + sh, y0 + i * lh); ctx.scale(s, s); ctx.globalAlpha = k;
      ctx.font = F(K, 900, px); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = i === ws.length - 1 ? K.red : K.ink; fit(ctx, K, w, W - 120 * u, px); ctx.fillText(w, 0, 0); ctx.restore();
    });
    const e = pop(t - .1 - ws.length * every, .3);
    ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.gold; ctx.font = F(K, 700, LAND ? 34 : 32); ctx.textAlign = 'center';
    if (o.sub) ctx.fillText(o.sub, W / 2, y0 + (ws.length - .4) * lh + 40 * u); ctx.restore();
    return { x: W / 2, y: H / 2 };
  }
  // 今日要点快闪：每拍换一条，大字铺满，左边红色序号，下面一排进度格
  function points(ctx, K, t, o) {
    const u = K.u, ev = o.every || K.beat, n = o.items.length, k = clamp(Math.floor(t / ev), 0, n - 1), lt = t - k * ev;
    dim(ctx, .35);
    const x = (LAND ? 160 : 70) * u, y = H * (LAND ? .52 : .5), s = 1 + .25 * (1 - eOutExpo(clamp(lt / .18)));
    ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.font = F(K, 700, 28, K.mono); ctx.fillStyle = K.gold; ctx.fillText(o.kicker, x, y - (LAND ? 190 : 230) * u);
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.font = F(K, 400, LAND ? 230 : 200, K.num); ctx.fillStyle = K.red; ctx.fillText(String(k + 1).padStart(2, '0'), 0, 0);
    const nw = (LAND ? 190 : 0) * u;
    ctx.fillStyle = K.ink; const px = fit(ctx, K, o.items[k], W - x * 2 - nw - 20 * u, LAND ? 110 : 96);
    ctx.fillText(o.items[k], nw + (LAND ? 20 : 0) * u, LAND ? -20 * u : (px + 40) * u);
    ctx.restore();
    for (let i = 0; i < n; i++) { ctx.fillStyle = i <= k ? K.red : 'rgba(255,255,255,.25)'; ctx.fillRect(x + i * 70 * u, y + (LAND ? 90 : 230) * u, 56 * u, 8 * u); }
    return { x, y };
  }
  // 滚动快讯带：三条斜着的字带往不同方向走，红、深蓝、白三色
  function crawl(ctx, K, t, o) {
    const u = K.u, rows = o.rows, bh = (LAND ? 118 : 104) * u;
    dim(ctx, .25);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.06); ctx.translate(-W / 2, -H / 2);
    rows.forEach((s, i) => {
      const y = H / 2 + (i - (rows.length - 1) / 2) * (bh + 18 * u) - bh / 2, e = eOutExpo(clamp((t - i * .1) / .4));
      const bg = [K.red, K.navy, K.ink][i % 3], fg = i % 3 === 2 ? K.bg : '#fff', dir = i % 2 ? 1 : -1;
      ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = bg; ctx.fillRect(-W * .2, y, W * 1.4, bh);
      ctx.beginPath(); ctx.rect(-W * .2, y, W * 1.4, bh); ctx.clip();
      ctx.font = F(K, 900, LAND ? 70 : 60); ctx.fillStyle = fg; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      const txt = s + '　●　', tw = ctx.measureText(txt).width, off = ((t * (240 + 80 * i) * u * dir) % tw + tw) % tw;
      for (let x = -W * .2 - off; x < W * 1.2; x += tw) ctx.fillText(txt, x + (1 - e) * 300 * u * dir, y + bh / 2 + 3 * u);
      ctx.restore();
    });
    ctx.restore(); return { x: W / 2, y: H / 2 };
  }
  // ── 章节 ──
  // 栏目闪卡：红块从左扫过，露出大号章号和章名；底下一排小格标出第几章
  function chapter(ctx, K, t, o) {
    const u = K.u, e = eOutExpo(clamp(t / .3)), x = (LAND ? 160 : 70) * u, y = H * (LAND ? .58 : .55);
    dim(ctx, .5);
    ctx.save(); ctx.fillStyle = K.red; ctx.fillRect(0, y - (LAND ? 260 : 300) * u, W * e, (LAND ? 300 : 340) * u);
    ctx.beginPath(); ctx.rect(0, y - (LAND ? 260 : 300) * u, W * e, (LAND ? 300 : 340) * u); ctx.clip();
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.font = F(K, 400, LAND ? 300 : 260, K.num); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillText(String(o.n).padStart(2, '0'), W - (LAND ? 470 : 330) * u, y + 10 * u);
    ctx.fillStyle = '#fff'; ctx.font = F(K, 900, LAND ? 130 : 116); ctx.fillText(o.title, x + (1 - e) * -80 * u, y - 60 * u);
    ctx.font = F(K, 700, 34, K.mono); ctx.fillText(o.en, x, y - (LAND ? 200 : 236) * u);
    ctx.restore();
    for (let i = 0; i < o.of; i++) { ctx.fillStyle = i < o.n ? K.ink : 'rgba(255,255,255,.25)'; ctx.fillRect(x + i * 64 * u, y + 70 * u, 50 * u, 8 * u); }
    return { x, y };
  }
  // ── 素材 ──
  // 单图加标题：画面组织决定照片怎么上屏；返回 mark 指的两点（给标注叠加）
  function story(ctx, K, t, o) {
    const m = (!LAND && o.moveP) || o.move, r = K.L.draw(ctx, K, t, o.d || 2, { photos: [o.photo], kind: 'headline', move: m }, K.P);
    headline(ctx, K, t, r.box, o, r.panel);
    const mk2 = o.mark || [[.85, .495], [.85, .59]];
    return { a: r.pin(0, ...mk2[0]), b: r.pin(0, ...mk2[1]), box: r.box };
  }
  // 前后对比：同一取景的两张图，单图推拉用滑杆、视差用前后两张卡、拼贴用左右分屏
  function compare(ctx, K, t, o) {
    K.L.draw(ctx, K, t, o.d || 2, { photos: o.photos, kind: 'compare', labels: o.labels, move: o.move }, K.P);
    return { box: [W * .04, H * (LAND ? .66 : .6), W * .5, 80 * K.u] };
  }
  // 卫星图放大：框里先看全图，一个取景框缩小到目标点，再放大到 zoom 倍；右边（竖屏在下）写放大倍数和说明
  function satZoom(ctx, K, t, o) {
    const u = K.u, A = K.P[o.photo], ar = area(K);
    const fr = LAND ? [ar[0], ar[1], ar[2] * .62, ar[3]] : [ar[0], ar[1], ar[2], ar[3] * .6];
    const [x, y, w, h] = fr, zt = o.zoom || 3, e = eInOutCubic(inv(.35, 1.2, t)), z = lerp(1, zt, e), [pu, pv] = o.at;
    const k = Math.max(w / A.w, h / A.h) * z * 1.04, dw = A.w * k, dh = A.h * k;
    const dx = clamp(x + w / 2 - pu * dw, x + w - dw, x), dy = clamp(y + h / 2 - pv * dh, y + h - dh, y);
    const ox = dx - (x + (w - dw) * .5), oy = dy - (y + (h - dh) * .5);
    ctx.save(); ctx.globalAlpha = pop(t, .3);
    const map = K.L.frame(ctx, K, t, A, fr, { z: z * 1.04 / ((K.L === collage ? 1.02 : K.L === parallax ? 1.1 : 1.04)), ox, oy });
    const [px, py] = map(pu, pv), bs = Math.min(w, h) / zt * z * .5;          // 取景框：落在目标点上，放大到填满
    ctx.strokeStyle = K.gold; ctx.lineWidth = 4 * u; const c = 26 * u;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath(); ctx.moveTo(px + sx * bs, py + sy * (bs - c)); ctx.lineTo(px + sx * bs, py + sy * bs); ctx.lineTo(px + sx * (bs - c), py + sy * bs); ctx.stroke();
    }
    ctx.restore();
    const ix = LAND ? x + w + 50 * u : x, iy = LAND ? y + 20 * u : y + h + 50 * u, iw = LAND ? ar[2] - w - 50 * u : w;
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = pop(t - .2, .4);
    ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.gold; ctx.fillText(o.kicker, ix, iy + 26 * u);
    ctx.font = F(K, 400, LAND ? 170 : 150, K.num); ctx.fillStyle = K.ink; ctx.fillText('×' + z.toFixed(1), ix, iy + (LAND ? 190 : 170) * u);
    ctx.font = F(K, 900, LAND ? 44 : 46); wrapCJK(ctx, o.title, iw).forEach((l, i) => rise(ctx, l, ix, iy + (LAND ? 260 : 240) * u + i * 56 * u, 56 * u, pop(t - .5 - i * .1, .4)));
    ctx.font = F(K, 400, 24, K.mono); ctx.fillStyle = K.muted; ctx.globalAlpha = pop(t - .9, .3);
    (o.info || []).forEach((l, i) => ctx.fillText(l, ix, iy + (LAND ? 420 : 380) * u + i * 34 * u));
    ctx.restore();
    return { box: fr, x: px, y: py };
  }
  // 档案扫描页：旧报纸斜放在桌上，镜头推到要看的那一行，荧光笔划过；返回那一行的位置（给圈注）
  function archive(ctx, K, t, o) {
    const u = K.u, A = K.P[o.photo], ar = area(K), ph = LAND ? ar[3] + 60 * u : ar[3] * .92, pw = ph * A.w / A.h;
    const px = LAND ? ar[0] + ar[2] * .3 - pw / 2 : W / 2 - pw / 2, py = LAND ? ar[1] - 20 * u : ar[1];
    const [hx, hy, hw, hh] = o.hl, hc = [px + (hx + hw / 2) * pw, py + (hy + hh / 2) * ph];
    const e = eInOutCubic(inv(.3, 1.1, t)), Z = o.zoom || 2.3, s = lerp(1, Z, e), tgt = LAND ? [ar[0] + ar[2] * .36, ar[1] + ar[3] * .42] : [W / 2, ar[1] + ar[3] * .35];
    const T = (x, y) => [(x - hc[0]) * s + lerp(hc[0], tgt[0], e), (y - hc[1]) * s + lerp(hc[1], tgt[1], e)];
    ctx.save(); const [ox, oy] = T(px, py); ctx.translate(ox, oy); ctx.scale(s, s); ctx.rotate(-.02 * (1 - e));
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40 * u / s; ctx.fillStyle = K.paper; ctx.fillRect(0, 0, pw, ph); ctx.shadowColor = 'transparent';
    K.L.frame(ctx, K, t, A, [0, 0, pw, ph], { z: 1 / (K.L === parallax ? 1.1 : K.L === collage ? 1.02 : 1.04) });
    const hp = eInOutCubic(inv(1.0, 1.45, t));                                  // 荧光笔
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,214,0,.75)';
    ctx.fillRect(hx * pw - 6 * u / s, hy * ph, (hw * pw + 12 * u / s) * hp, hh * ph);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = pop(t - .4, .4); const lx = LAND ? ar[0] + ar[2] * .68 : ar[0], ly = LAND ? ar[1] + 40 * u : ar[1] + ar[3] * .62;
    ctx.fillStyle = K.bg; ctx.fillRect(lx - 24 * u, ly - 10 * u, (LAND ? ar[2] * .34 : ar[2]) + 48 * u, (LAND ? 330 : 300) * u);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.gold; ctx.fillText(o.kicker, lx, ly + 30 * u);
    ctx.font = F(K, 400, LAND ? 120 : 110, K.num); ctx.fillStyle = K.ink; ctx.fillText(o.date, lx, ly + 150 * u);
    ctx.font = F(K, 700, LAND ? 36 : 38); wrapCJK(ctx, o.title, LAND ? ar[2] * .32 : ar[2]).forEach((l, i) => ctx.fillText(l, lx, ly + (210 + i * 48) * u));
    ctx.restore();
    const [cx, cy] = T(hc[0], hc[1]);
    return { x: cx, y: cy, rx: hw * pw * s * .6, ry: hh * ph * s * .95 };
  }
  // 经纬度 → 屏幕：等距圆柱投影（横向乘纬度余弦），整块地图缩放进框 r
  function proj(K, ids, r, pad = .06) {
    const sh = K.geo.shapes, c = Math.cos(37 * Math.PI / 180);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    ids.forEach(id => sh[id].forEach(ring => ring.forEach(([lo, la]) => { x0 = Math.min(x0, lo * c); x1 = Math.max(x1, lo * c); y0 = Math.min(y0, -la); y1 = Math.max(y1, -la); })));
    const [x, y, w, h] = r, s = Math.min(w / (x1 - x0), h / (y1 - y0)) * (1 - pad), mx = x + w / 2 - (x0 + x1) / 2 * s, my = y + h / 2 - (y0 + y1) / 2 * s;
    return (lo, la) => [mx + lo * c * s, my - la * s];
  }
  const WEST = ['OR', 'ID', 'MT', 'WY', 'SD', 'NE', 'KS', 'OK', 'TX', 'NM', 'CO', 'UT', 'NV', 'CA', 'AZ'];
  function states(ctx, K, P, ids, p, fill) {
    ids.forEach((id, k) => K.geo.shapes[id].forEach(ring => {
      ctx.beginPath(); ring.forEach(([lo, la], i) => { const [x, y] = P(lo, la); ctx[i ? 'lineTo' : 'moveTo'](x, y); }); ctx.closePath();
      const f = fill && fill(id, k); if (f) { ctx.fillStyle = f; ctx.fill(); }
      ctx.save(); ctx.setLineDash([2000 * K.u * p, 4000 * K.u]); ctx.stroke(); ctx.restore();
    }));
  }
  // 地图定位：西部各州的轮廓画出来，科罗拉多河一路流下，图钉按拍落在湖上，涟漪扩散
  function mapPin(ctx, K, t, o) {
    const u = K.u, ar = area(K), r = LAND ? [ar[0] + ar[2] * .3, ar[1] - 40 * u, ar[2] * .7, ar[3] + 80 * u] : [ar[0], ar[1] + 190 * u, ar[2], ar[3] - 190 * u];
    const P = proj(K, o.view || ['CA', 'NV', 'AZ', 'UT', 'CO', 'NM', 'WY'], r), basin = o.basin || [];
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5 * u; ctx.lineJoin = 'round';
    states(ctx, K, P, WEST, eOutCubic(inv(0, .9, t)), id => basin.includes(id) ? 'rgba(79,163,224,.16)' : 'rgba(255,255,255,.04)');
    ctx.strokeStyle = K.blue; ctx.lineWidth = 5 * u; ctx.lineCap = 'round';
    const rp = eInOutCubic(inv(.2, 1.1, t));
    K.geo.rivers.forEach(l => drawPartial(ctx, l.map(([lo, la]) => P(lo, la)), rp));
    ctx.restore();
    const out = o.pins.map((q, i) => {
      const [x, y] = P(q.lon, q.lat), t0 = .5 + i * K.beat, e = clamp((t - t0) / .25); if (e <= 0) return [x, y];
      const yy = y - (1 - eOutCubic(e)) * 120 * u, c = q.hot ? K.red : K.gold;
      ctx.save();
      for (let k = 0; k < 2; k++) { const rr2 = ((t - t0 - .25 - k * .3) % .9 + .9) % .9; if (t - t0 > .25) { ctx.strokeStyle = c; ctx.globalAlpha = 1 - rr2 / .9; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(x, y, rr2 * 90 * u, 0, TAU); ctx.stroke(); } }
      ctx.globalAlpha = 1; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, yy - 34 * u, 18 * u, Math.PI * .8, Math.PI * .2); ctx.lineTo(x, yy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = K.bg; ctx.beginPath(); ctx.arc(x, yy - 36 * u, 7 * u, 0, TAU); ctx.fill();
      ctx.globalAlpha = pop(t - t0 - .2, .3); ctx.font = F(K, 900, LAND ? 36 : 38); ctx.textAlign = q.left ? 'right' : 'left'; ctx.textBaseline = 'middle';
      const tx = x + (q.left ? -36 : 36) * u, tw = ctx.measureText(q.label).width;
      ctx.fillStyle = 'rgba(7,11,16,.8)'; ctx.fillRect(q.left ? tx - tw - 12 * u : tx - 12 * u, y - 60 * u, tw + 24 * u, 52 * u);
      ctx.fillStyle = K.ink; ctx.fillText(q.label, tx, y - 33 * u); ctx.restore();
      return [x, y];
    });
    const hb = LAND ? [ar[0], ar[1], ar[2] * .36] : [ar[0], ar[1], ar[2]];
    header(ctx, K, t, o, hb);
    return { pins: out, x: out[0][0], y: out[0][1] };
  }
  // 带出处条的素材框：照片放进一个框，左上角红牌（资料 / 现场），底边一条出处，右下角计时在走
  function sourceFrame(ctx, K, t, o) {
    const u = K.u, ar = area(K), w = LAND ? ar[2] * .78 : ar[2], h = LAND ? Math.min(ar[3], w * 9 / 16) : w * 1.15;
    const x = W / 2 - w / 2, y = LAND ? ar[1] : ar[1] + 60 * u, fr = [x, y, w, h], e = pop(t, .35);
    ctx.save(); ctx.globalAlpha = e; ctx.translate(0, (1 - e) * 40 * u);
    K.L.frame(ctx, K, t, K.P[o.photo], fr, o.move || {});
    const sh = 58 * u; ctx.fillStyle = 'rgba(7,11,16,.86)'; ctx.fillRect(x, y + h - sh, w, sh);
    ctx.fillStyle = K.red; ctx.fillRect(x, y + h - sh, 8 * u, sh);
    ctx.font = F(K, 400, 24, K.mono); ctx.fillStyle = K.muted; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(o.src, x + 26 * u, y + h - sh / 2);
    ctx.textAlign = 'right'; ctx.fillStyle = K.ink; ctx.fillText(o.place || '', x + w - 24 * u, y + h - sh / 2);
    ctx.restore();
    tag(ctx, K, t - .25, [x + 22 * u, y + 22 * u], o.tag, 'left', 1, true);
    if (o.caption) { ctx.save(); ctx.globalAlpha = pop(t - .5, .4); ctx.font = F(K, 900, LAND ? 46 : 50); ctx.fillStyle = K.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      wrapCJK(ctx, o.caption, w).forEach((l, i) => ctx.fillText(l, x, y + h + (66 + i * 60) * u)); ctx.restore(); }
    return { box: fr, x: x + 30 * u, y: y + h - sh - 30 * u };
  }
  // 分屏：两张照片并排（竖屏上下），中缝一道红线和箭头，各自一条说明
  function split(ctx, K, t, o) {
    const u = K.u, ar = area(K), g = 16 * u, out = [];
    const hb = header(ctx, K, t, o, ar), top = hb, h = ar[1] + ar[3] - top;
    const rs = LAND ? [[ar[0], top, ar[2] / 2 - g / 2, h], [ar[0] + ar[2] / 2 + g / 2, top, ar[2] / 2 - g / 2, h]]
      : [[ar[0], top, ar[2], h / 2 - g / 2], [ar[0], top + h / 2 + g / 2, ar[2], h / 2 - g / 2]];
    o.photos.forEach((n, i) => {
      const e = pop(t - .15 - i * .25, .45), r = rs[i];
      ctx.save(); ctx.globalAlpha = e; ctx.translate(LAND ? (1 - e) * (i ? 80 : -80) * u : 0, LAND ? 0 : (1 - e) * (i ? 80 : -80) * u);
      K.L.frame(ctx, K, t, K.P[n], r, { pan: i ? -1 : 1 });
      const [a, b] = o.labels[i], lh = 96 * u;
      ctx.fillStyle = 'rgba(7,11,16,.82)'; ctx.fillRect(r[0], r[1] + r[3] - lh, r[2], lh);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = F(K, 700, 24, K.mono); ctx.fillStyle = K.gold; ctx.fillText(a, r[0] + 22 * u, r[1] + r[3] - lh + 34 * u);
      ctx.font = F(K, 900, 36); ctx.fillStyle = K.ink; ctx.fillText(b, r[0] + 22 * u, r[1] + r[3] - 22 * u);
      ctx.restore(); out.push(r);
    });
    const e = pop(t - .6, .3), cx = LAND ? ar[0] + ar[2] / 2 : ar[0] + ar[2] / 2, cy = LAND ? top + h / 2 : top + h / 2;
    ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.red; ctx.beginPath(); ctx.arc(cx, cy, 34 * u, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = F(K, 900, 34); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LAND ? '→' : '↓', cx, cy + 2 * u); ctx.restore();
    return { boxes: out, box: out[0] };
  }
  // 图集条：四张照片按拍从下面依次滑上来，横屏一排，竖屏两两一行，每张一个编号和说明
  function strip(ctx, K, t, o) {
    const u = K.u, ar = area(K), n = o.photos.length, g = 18 * u;
    const top = header(ctx, K, t, o, ar), h = ar[1] + ar[3] - top, cols = LAND ? n : 2, rows = Math.ceil(n / cols);
    const cw = (ar[2] - g * (cols - 1)) / cols, ch = (h - g * (rows - 1)) / rows, out = [];
    o.photos.forEach((p, i) => {
      const r = [ar[0] + (i % cols) * (cw + g), top + Math.floor(i / cols) * (ch + g), cw, ch], e = pop(t - .1 - i * .16, .4);
      ctx.save(); ctx.globalAlpha = e; ctx.translate(0, (1 - e) * 120 * u);
      K.L.frame(ctx, K, t, K.P[p], r, { pan: i % 2 ? -1 : 1 });
      ctx.fillStyle = K.red; ctx.fillRect(r[0], r[1], 64 * u, 64 * u);
      ctx.fillStyle = '#fff'; ctx.font = F(K, 400, 50, K.num); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i + 1, r[0] + 32 * u, r[1] + 35 * u);
      ctx.fillStyle = 'rgba(7,11,16,.82)'; ctx.fillRect(r[0], r[1] + r[3] - 60 * u, r[2], 60 * u);
      ctx.fillStyle = K.ink; ctx.font = F(K, 700, 28); ctx.textAlign = 'left'; ctx.fillText(o.labels[i], r[0] + 18 * u, r[1] + r[3] - 29 * u);
      ctx.restore(); out.push(r);
    });
    return { boxes: out, box: out[0] };
  }
  // ── 数据 ──
  // 大数字：从 from 数到 to，单位红色，下面一行说明和一根进度刻度
  function bigNumber(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), k = eOutExpo(clamp((t - (o.start ?? .3)) / .9));
    const v = lerp(o.from || 0, o.to, k), s = fmt(v, o.digits || 0), px = LAND ? 300 : 250;
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = F(K, 400, px, K.num); ctx.fillStyle = K.ink; const y = top + px * .82 * u; ctx.fillText(s, ar[0], y);
    const nw = ctx.measureText(s).width; ctx.font = F(K, 900, LAND ? 80 : 70); ctx.fillStyle = K.red; ctx.fillText(o.unit, ar[0] + nw + 20 * u, y);
    ctx.font = F(K, 400, LAND ? 34 : 36); ctx.fillStyle = K.muted; ctx.globalAlpha = pop(t - .8, .4); ctx.fillText(o.label, ar[0], y + 70 * u);
    ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(ar[0], y + 110 * u, ar[2] * .7, 10 * u);
    ctx.fillStyle = K.red; ctx.fillRect(ar[0], y + 110 * u, ar[2] * .7 * k * (o.bar ?? .6), 10 * u);
    ctx.restore(); return { x: ar[0] + nw / 2, y: y - px * .4 * u };
  }
  // 柱状图：柱子按顺序长出来，每根顶上写数值，hot 的那根红色
  function bars(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), n = o.bars.length;
    const x0 = ar[0] + 60 * u, cw = ar[2] - 60 * u, y1 = ar[1] + ar[3] - 50 * u, ch = y1 - top - 60 * u, bw = cw / n * .62;
    const lo = o.min ?? 0, hi = o.max ?? Math.max(...o.bars.map(b => b.v));
    ctx.save(); ctx.strokeStyle = K.line; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(x0, y1 + .5); ctx.lineTo(x0 + cw, y1 + .5); ctx.stroke();
    const out = o.bars.map((b, i) => {
      const k = eOutCubic(clamp((t - .25 - i * .12) / .5)), bh = (b.v - lo) / (hi - lo) * ch * k, x = x0 + (i + .5) * cw / n - bw / 2;
      ctx.fillStyle = b.hot ? K.red : 'rgba(245,247,250,.85)'; ctx.fillRect(x, y1 - bh, bw, bh);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = k;
      ctx.font = F(K, 400, LAND ? 56 : 50, K.num); ctx.fillStyle = b.hot ? K.red : K.ink; ctx.fillText(fmt(lerp(lo, b.v, k), o.digits || 0), x + bw / 2, y1 - bh - 14 * u);
      ctx.globalAlpha = 1; ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.muted; ctx.fillText(b.label, x + bw / 2, y1 + 38 * u);
      return [x + bw / 2, y1 - bh];
    });
    ctx.font = F(K, 400, 22, K.mono); ctx.fillStyle = K.muted; ctx.textAlign = 'right'; ctx.fillText(o.unit || '', ar[0] + ar[2], top - 10 * u);
    ctx.restore(); return { pts: out, x: out[out.length - 1][0], y: out[out.length - 1][1] };
  }
  // 折线：画面组织只换底，折线和大数字用旧的数据卡画（chart）
  function line(ctx, K, t, o) {
    const ar = area(K); chart(ctx, K, t, ar, { ...o, rows: series(K, o.rows) }, false);
    return { box: ar };
  }
  // 占比环：每段按顺序扫出来，中间写总数；图例在右（竖屏在下）
  function ring(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), h = ar[1] + ar[3] - top;
    const R = LAND ? Math.min(h, ar[2] * .4) * .46 : Math.min(ar[2], h * .55) * .42, cx = LAND ? ar[0] + R + 20 * u : W / 2, cy = LAND ? top + h / 2 : top + R + 20 * u;
    const tot = o.items.reduce((s, x) => s + x.v, 0), cols = [K.red, K.gold, K.blue, K.green, K.ink];
    let a = -Math.PI / 2;
    ctx.save(); ctx.lineWidth = R * .32;
    o.items.forEach((it, i) => {
      const k = eInOutCubic(clamp((t - .2 - i * .3) / .45)), da = it.v / tot * TAU;
      ctx.strokeStyle = cols[i % cols.length]; ctx.beginPath(); ctx.arc(cx, cy, R, a, a + da * k - .015); if (k > 0) ctx.stroke();
      const lx = LAND ? ar[0] + R * 2 + 90 * u : ar[0], ly = LAND ? top + 40 * u + i * 110 * u : cy + R * 1.35 + i * 96 * u;
      ctx.globalAlpha = pop(t - .3 - i * .3, .3); ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(lx, ly, 26 * u, 26 * u);
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = K.ink; ctx.font = F(K, 700, 36); ctx.fillText(it.label, lx + 44 * u, ly - 8 * u);
      ctx.font = F(K, 400, 64, K.num); ctx.fillStyle = cols[i % cols.length]; ctx.textAlign = 'right'; ctx.fillText(fmt(it.v, o.digits || 1), LAND ? ar[0] + ar[2] : ar[0] + ar[2], ly - 22 * u);
      ctx.globalAlpha = 1; a += da;
    });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = K.ink; ctx.font = F(K, 400, R * .55 / u, K.num); ctx.fillText(fmt(tot, o.digits || 1), cx, cy - R * .08);
    ctx.font = F(K, 400, 22, K.mono); ctx.fillStyle = K.muted; ctx.fillText(o.unit, cx, cy + R * .28);
    ctx.restore(); return { x: cx, y: cy, r: R };
  }
  // 排名：横条按名次一条条推出来，左边大号名次
  function rank(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), n = o.items.length, rh = Math.min(110 * u, (ar[1] + ar[3] - top) / n);
    const lo = o.min ?? 0, hi = o.max ?? Math.max(...o.items.map(x => x.v)), bx = ar[0] + (LAND ? 300 : 230) * u, bw = ar[2] - (bx - ar[0]) - 150 * u;
    ctx.save(); const out = o.items.map((it, i) => {
      const y = top + i * rh, k = eOutCubic(clamp((t - .2 - i * .14) / .5)), w = (it.v - lo) / (hi - lo) * bw * k;
      ctx.globalAlpha = pop(t - .15 - i * .14, .3); ctx.textBaseline = 'middle';
      ctx.font = F(K, 400, 64, K.num); ctx.textAlign = 'left'; ctx.fillStyle = i === 0 ? K.red : K.muted; ctx.fillText(i + 1, ar[0], y + rh * .45);
      ctx.font = F(K, 900, LAND ? 40 : 36); ctx.fillStyle = K.ink; ctx.fillText(it.label, ar[0] + 70 * u, y + rh * .45);
      ctx.fillStyle = i === 0 ? K.red : 'rgba(245,247,250,.8)'; ctx.fillRect(bx, y + rh * .2, w, rh * .5);
      ctx.font = F(K, 400, 50, K.num); ctx.fillStyle = K.ink; ctx.fillText(fmt(lerp(lo, it.v, k), o.digits || 0), bx + w + 16 * u, y + rh * .47);
      return [bx + w, y + rh * .45];
    });
    ctx.font = F(K, 400, 22, K.mono); ctx.fillStyle = K.muted; ctx.textAlign = 'right'; ctx.globalAlpha = 1; ctx.fillText(o.unit || '', ar[0] + ar[2], top - 14 * u);
    ctx.restore(); return { pts: out, x: out[0][0], y: out[0][1] };
  }
  // 地图热区：各州按数值填深浅不同的红，州上写数，右下一条图例
  function heatMap(ctx, K, t, o) {
    const u = K.u, ar = area(K), hb = LAND ? [ar[0], ar[1], ar[2] * .34] : ar, top = header(ctx, K, t, o, hb);
    const r = LAND ? [ar[0] + ar[2] * .36, ar[1] - 30 * u, ar[2] * .64, ar[3] + 60 * u] : [ar[0], top, ar[2], ar[1] + ar[3] - top];
    const ids = Object.keys(o.values), P = proj(K, o.view || ids, r), mx = o.max ?? Math.max(...Object.values(o.values));
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5 * u; ctx.lineJoin = 'round';
    states(ctx, K, P, WEST, 1, id => {
      if (!(id in o.values)) return 'rgba(255,255,255,.04)';
      const k = clamp((t - .2 - ids.indexOf(id) * .12) / .4), v = o.values[id] / mx * k;
      return `rgba(224,49,59,${.15 + .8 * v})`;
    });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const out = ids.map((id, i) => {
      const ring2 = K.geo.shapes[id][0]; let sx = 0, sy = 0; ring2.forEach(([lo, la]) => { sx += lo; sy += la; });
      const [x, y] = P(sx / ring2.length + ((o.nudge || {})[id] || [0, 0])[0], sy / ring2.length + ((o.nudge || {})[id] || [0, 0])[1]);
      ctx.globalAlpha = pop(t - .35 - i * .12, .3); ctx.font = F(K, 900, 30); ctx.fillStyle = '#fff'; ctx.fillText(id, x, y - 30 * u);
      ctx.font = F(K, 400, 56, K.num); ctx.fillText(fmt(o.values[id], o.digits ?? 2) + (o.suffix || ''), x, y + 14 * u);
      return [x, y];
    });
    ctx.globalAlpha = pop(t - .8, .3); const lx = LAND ? ar[0] : ar[0], ly = LAND ? ar[1] + ar[3] - 40 * u : top - 10 * u;
    const g = ctx.createLinearGradient(lx, 0, lx + 260 * u, 0); g.addColorStop(0, 'rgba(224,49,59,.15)'); g.addColorStop(1, 'rgba(224,49,59,.95)');
    if (LAND) { ctx.fillStyle = g; ctx.fillRect(lx, ly, 260 * u, 16 * u); ctx.font = F(K, 400, 22, K.mono); ctx.fillStyle = K.muted; ctx.textAlign = 'left'; ctx.fillText(o.unit, lx, ly - 22 * u); }
    ctx.restore(); return { pts: out, x: out[0][0], y: out[0][1] };
  }
  // 翻牌：每一位像车站翻牌一样翻过几张再停在目标数字上，从左到右依次停
  function flip(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), ch = [...o.value], n = ch.length;
    const cw = Math.min(LAND ? 150 * u : 150 * u, (ar[2] - 20 * u * n) / n), h = cw * 1.45, x0 = ar[0], y = top + 10 * u;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ch.forEach((c, i) => {
      const x = x0 + i * (cw + 16 * u), st = .2 + i * .1, spins = 6, k = clamp((t - st) / .7), j = Math.floor(k * spins), fr = k * spins - j;
      const dig = /\d/.test(c), cur = dig ? (Number(c) + j - spins + 20) % 10 : c, nxt = dig ? (Number(c) + j + 1 - spins + 20) % 10 : c;
      const showC = k >= 1 ? c : String(cur), showN = String(nxt);
      ctx.fillStyle = '#16202C'; rr(ctx, x, y, cw, h, 10 * u); ctx.fill();
      ctx.font = F(K, 400, cw / u * 1.05, K.num); ctx.fillStyle = K.ink;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, cw, h); ctx.clip(); ctx.fillText(k >= 1 || !dig ? c : showN, x + cw / 2, y + h / 2 + 6 * u); ctx.restore();
      if (dig && k < 1) {                                                  // 上半张往下翻
        const s = Math.cos(fr * Math.PI); ctx.save(); ctx.beginPath(); ctx.rect(x, y, cw, h / 2); ctx.clip();
        ctx.translate(0, y + h / 2); ctx.scale(1, Math.max(.02, Math.abs(s))); ctx.translate(0, -(y + h / 2));
        ctx.fillStyle = '#1D2937'; ctx.fillRect(x, y, cw, h); ctx.fillStyle = K.ink; ctx.fillText(showC, x + cw / 2, y + h / 2 + 6 * u); ctx.restore();
      }
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y + h / 2 - 1.5 * u, cw, 3 * u);
    });
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = F(K, 900, LAND ? 60 : 56); ctx.fillStyle = K.red;
    const ux = LAND ? x0 + n * (cw + 16 * u) + 10 * u : x0, uy = LAND ? y + h - 16 * u : y + h + 80 * u;
    ctx.globalAlpha = pop(t - .9, .3); ctx.fillText(o.unit, ux, uy);
    ctx.font = F(K, 400, LAND ? 34 : 36); ctx.fillStyle = K.muted; ctx.fillText(o.label, x0, (LAND ? y + h : uy) + 70 * u);
    ctx.restore(); return { x: x0 + n * (cw + 16 * u) / 2, y: y + h / 2, box: [x0, y, n * (cw + 16 * u), h] };
  }
  // 统计表：表头先到，行一行行刷出来，hot 那行红底
  function table(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), nc = o.cols.length, rh = Math.min(84 * u, (ar[1] + ar[3] - top) / (o.rows.length + 1));
    const cw = ar[2] / nc, out = [];
    ctx.save(); ctx.textBaseline = 'middle';
    const row = (cells, y, hd, i) => cells.forEach((c, j) => {
      ctx.textAlign = j ? 'right' : 'left'; const x = j ? ar[0] + (j + 1) * cw - 20 * u : ar[0] + 20 * u;
      ctx.font = hd ? F(K, 700, 26, K.mono) : j ? F(K, 400, 50, K.num) : F(K, 700, 36);
      ctx.fillStyle = hd ? K.gold : (o.hot === i ? '#fff' : (typeof c === 'string' && c.startsWith('−') ? '#FF8A8F' : K.ink)); ctx.fillText(c, x, y + rh / 2 + (j && !hd ? 3 * u : 0));
    });
    ctx.globalAlpha = pop(t - .1, .3); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(ar[0], top, ar[2], rh); row(o.cols, top, true);
    o.rows.forEach((r, i) => {
      const y = top + (i + 1) * rh, e = pop(t - .3 - i * .1, .3); ctx.globalAlpha = e;
      ctx.save(); ctx.translate((1 - e) * 60 * u, 0);
      ctx.fillStyle = o.hot === i ? K.red : i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.2)'; ctx.fillRect(ar[0], y, ar[2], rh - 2 * u);
      row(r, y, false, i); ctx.restore(); out.push([ar[0] + ar[2] / 2, y + rh / 2]);
    });
    ctx.restore(); return { rows: out, x: out[o.hot ?? 0][0], y: out[o.hot ?? 0][1] };
  }
  // 增减箭头：每行一个年份，箭头按涨跌向上（绿）或向下（红）弹出，后面跟带符号的数
  function delta(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), n = o.items.length, rh = Math.min(120 * u, (ar[1] + ar[3] - top) / n);
    ctx.save(); ctx.textBaseline = 'middle'; const out = [];
    o.items.forEach((it, i) => {
      const y = top + i * rh + rh / 2, e = pop(t - .2 - i * .14, .35), up = it.v >= 0, c = up ? K.green : K.red;
      ctx.globalAlpha = e; ctx.textAlign = 'left'; ctx.font = F(K, 700, 34, K.mono); ctx.fillStyle = K.muted; ctx.fillText(it.label, ar[0], y);
      const ax = ar[0] + (LAND ? 320 : 280) * u, s = 30 * u, dy = (1 - e) * (up ? 30 : -30) * u;
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(ax, y + dy + (up ? -s : s)); ctx.lineTo(ax + s, y + dy + (up ? s * .6 : -s * .6)); ctx.lineTo(ax - s, y + dy + (up ? s * .6 : -s * .6)); ctx.fill();
      ctx.font = F(K, 400, LAND ? 84 : 76, K.num); ctx.fillText((up ? '+' : '−') + Math.abs(it.v).toFixed(o.digits ?? 1), ax + 60 * u, y + 6 * u);
      const vw = ctx.measureText('+00.0').width; ctx.font = F(K, 700, 30); ctx.fillStyle = K.ink; ctx.fillText(o.unit, ax + 80 * u + vw, y + 4 * u);
      if (it.note) { ctx.font = F(K, 400, 28); ctx.fillStyle = K.muted; ctx.textAlign = 'right'; ctx.fillText(it.note, ar[0] + ar[2], y); }
      out.push([ax, y]);
    });
    ctx.restore(); return { pts: out, x: out[0][0], y: out[0][1] };
  }
  // 时间对比：左右（竖屏上下）两栏，年份大号，数值各自数到位，中间一根落差线写差值
  function versus(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), h = ar[1] + ar[3] - top, k = eOutExpo(clamp((t - .3) / .8));
    const col = (s, i) => {
      const x = LAND ? ar[0] + i * ar[2] * .55 : ar[0], y = LAND ? top : top + i * h * .52, e = pop(t - .1 - i * .3, .35);
      ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.font = F(K, 400, LAND ? 90 : 80, K.num); ctx.fillStyle = i ? K.red : K.muted; ctx.fillText(s.label, x, y + 80 * u);
      ctx.font = F(K, 400, LAND ? 210 : 180, K.num); ctx.fillStyle = K.ink; const v = fmt(lerp(o.base ?? 0, s.v, k), o.digits || 0); ctx.fillText(v, x, y + (LAND ? 290 : 250) * u);
      const vw = ctx.measureText(v).width; ctx.font = F(K, 900, 48); ctx.fillStyle = i ? K.red : K.ink; ctx.fillText(o.unit, x + vw + 14 * u, y + (LAND ? 290 : 250) * u);
      ctx.font = F(K, 400, 30); ctx.fillStyle = K.muted; ctx.fillText(s.note || '', x, y + (LAND ? 350 : 310) * u);
      ctx.restore(); return [x + vw / 2, y + 200 * u];
    };
    const a = col(o.a, 0), b = col(o.b, 1), e = pop(t - 1, .35);
    ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.red; ctx.font = F(K, 900, LAND ? 54 : 50); ctx.textBaseline = 'middle';
    if (LAND) { const mx = ar[0] + ar[2] * .45; ctx.textAlign = 'center'; ctx.fillText('→', mx, top + 200 * u); ctx.font = F(K, 400, 70, K.num); ctx.fillText(o.diff, mx, top + 300 * u); }
    else { ctx.textAlign = 'right'; ctx.font = F(K, 400, 80, K.num); ctx.fillText(o.diff, ar[0] + ar[2], top + h * .46); }
    ctx.restore(); return { x: b[0], y: b[1], a, b };
  }
  // 门槛线：一根竖着的水位尺，水面从 from 降到 value，碰到的门槛线变红、说明亮起来
  function thresholds(ctx, K, t, o) {
    const u = K.u, ar = area(K), hb = LAND ? [ar[0], ar[1], ar[2] * .45] : ar, top = header(ctx, K, t, o, hb);
    const gx = LAND ? ar[0] + ar[2] * .55 : ar[0] + 40 * u, gw = LAND ? 170 * u : 150 * u, gy = LAND ? ar[1] : top + 10 * u, gh = LAND ? ar[3] : ar[1] + ar[3] - top - 10 * u;
    const Y = v => gy + gh - (v - o.min) / (o.max - o.min) * gh, k = eInOutCubic(clamp((t - .2) / 1)), v = lerp(o.from, o.value, k);
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(gx, gy, gw, gh);
    const wy = Y(v), g = ctx.createLinearGradient(0, wy, 0, gy + gh); g.addColorStop(0, 'rgba(79,163,224,.95)'); g.addColorStop(1, 'rgba(20,60,110,.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(gx, gy + gh); for (let x = 0; x <= gw; x += 6 * u) ctx.lineTo(gx + x, wy + Math.sin(x / (18 * u) + t * 6) * 4 * u); ctx.lineTo(gx + gw, gy + gh); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2 * u; ctx.strokeRect(gx, gy, gw, gh);
    o.levels.forEach((L, i) => {
      const y = Y(L.v), hit = v <= L.v, c = hit ? K.red : 'rgba(255,255,255,.6)';
      ctx.strokeStyle = c; ctx.setLineDash([12 * u, 8 * u]); ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(gx - 20 * u, y); ctx.lineTo(gx + gw + 40 * u, y); ctx.stroke(); ctx.setLineDash([]);
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = F(K, 400, 44, K.num); ctx.fillStyle = c; ctx.fillText(L.v.toLocaleString('en-US'), gx + gw + 56 * u, y);
      ctx.font = F(K, 700, 30); ctx.fillStyle = hit ? K.ink : K.muted; ctx.fillText(L.label, gx + gw + 56 * u + 110 * u, y + 2 * u);
    });
    ctx.fillStyle = K.ink; ctx.font = F(K, 400, 70, K.num); ctx.textAlign = LAND ? 'right' : 'left'; ctx.textBaseline = 'alphabetic';
    const lx = LAND ? gx - 40 * u : gx + gw + 56 * u, ly = LAND ? wy + 24 * u : gy + 60 * u;
    ctx.fillText(Math.round(v).toLocaleString('en-US'), lx, ly); ctx.font = F(K, 400, 22, K.mono); ctx.fillStyle = K.muted; ctx.fillText(o.unit, lx, ly + 34 * u);
    ctx.restore(); return { x: gx + gw / 2, y: wy, box: [gx, gy, gw, gh] };
  }
  // ── 讲述 ──
  // 原句引用：大引号，中文逐字显出，下面原文（等宽小字）和出处
  function quote(ctx, K, t, o) {
    const u = K.u, ar = area(K), x = ar[0] + (LAND ? 140 : 0) * u, w = ar[2] - (LAND ? 140 : 0) * u;
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = pop(t, .3); ctx.font = F(K, 900, LAND ? 260 : 220); ctx.fillStyle = K.red; ctx.fillText('“', ar[0] - 10 * u, ar[1] + (LAND ? 200 : 170) * u);
    ctx.globalAlpha = 1; ctx.font = F(K, 900, LAND ? 72 : 62); ctx.fillStyle = K.ink;
    const ch = [...o.text], n = Math.floor(clamp((t - .15) / .8) * ch.length), ls = wrapCJK(ctx, o.text, w), lh = (LAND ? 96 : 84) * u;
    let c = 0, y = ar[1] + (LAND ? 170 : 230) * u;
    ls.forEach((l, i) => { const k = clamp(n - c, 0, [...l].length); ctx.fillText([...l].slice(0, k).join(''), x, y + i * lh); c += [...l].length; });
    y += ls.length * lh + 20 * u;
    ctx.globalAlpha = pop(t - .8, .4); ctx.font = F(K, 400, LAND ? 26 : 25, K.mono); ctx.fillStyle = K.muted;
    const el = wrap(ctx, o.en, w); el.forEach((l, i) => ctx.fillText(l, x, y + i * 36 * u)); y += el.length * 36 * u + 40 * u;
    ctx.fillStyle = K.red; ctx.fillRect(x, y - 20 * u, 60 * u, 5 * u);
    ctx.font = F(K, 700, 32); ctx.fillStyle = K.gold; wrapCJK(ctx, '—— ' + o.who, w).forEach((l, i) => ctx.fillText(l, x, y + 26 * u + i * 42 * u));
    ctx.restore(); return { x: x + w / 2, y: ar[1] + 100 * u };
  }
  // 事件时间线：一根线画过去（竖屏往下），节点按顺序弹出，年份大号
  function timeline(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), n = o.items.length, p = eInOutCubic(clamp((t - .1) / 1));
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 4 * u;
    const pts = o.items.map((_, i) => LAND ? [ar[0] + 40 * u + i * (ar[2] - 80 * u) / (n - 1), top + 120 * u] : [ar[0] + 30 * u, top + 30 * u + i * (ar[1] + ar[3] - top - 80 * u) / (n - 1)]);
    const a = pts[0], b = pts[n - 1]; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(lerp(a[0], b[0], p), lerp(a[1], b[1], p)); ctx.stroke();
    o.items.forEach((it, i) => {
      const [x, y] = pts[i], e = pop(t - .15 - i * (1 / n), .3); if (e <= 0) return;
      ctx.globalAlpha = e; ctx.fillStyle = it.hot ? K.red : K.ink; ctx.beginPath(); ctx.arc(x, y, 14 * u * (.6 + .4 * e), 0, TAU); ctx.fill();
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = LAND ? 'center' : 'left';
      const tx = LAND ? x : x + 50 * u, ty = LAND ? y - 40 * u : y + 14 * u;
      ctx.font = F(K, 400, LAND ? 80 : 70, K.num); ctx.fillStyle = it.hot ? K.red : K.gold; ctx.fillText(it.y, tx, ty);
      ctx.font = F(K, 700, LAND ? 30 : 34); ctx.fillStyle = K.ink;
      if (LAND) wrapCJK(ctx, it.text, (ar[2] / n) * .9).forEach((l, j) => ctx.fillText(l, x, y + (64 + j * 40) * u));
      else ctx.fillText(it.text, tx + 170 * u, ty);
    });
    ctx.restore(); return { pts, x: pts[n - 1][0], y: pts[n - 1][1] };
  }
  // 要点清单：方框一个个打勾，勾到哪条哪条变亮
  function checklist(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), n = o.items.length, rh = Math.min(118 * u, (ar[1] + ar[3] - top) / n);
    ctx.save(); const out = [];
    o.items.forEach((it, i) => {
      const y = top + i * rh, e = pop(t - .1 - i * .1, .3), ck = clamp((t - .45 - i * .22) / .2), s = 54 * u;
      ctx.globalAlpha = e; ctx.strokeStyle = ck > 0 ? K.green : 'rgba(255,255,255,.6)'; ctx.lineWidth = 4 * u; ctx.strokeRect(ar[0], y + 8 * u, s, s);
      if (ck > 0) { ctx.strokeStyle = K.green; ctx.lineWidth = 8 * u; ctx.lineCap = 'round'; drawPartial(ctx, [[ar[0] + 10 * u, y + 36 * u], [ar[0] + 24 * u, y + 52 * u], [ar[0] + 50 * u, y + 16 * u]], ck); }
      ctx.font = F(K, ck >= 1 ? 900 : 700, LAND ? 44 : 40); ctx.fillStyle = ck >= 1 ? K.ink : K.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(it, ar[0] + s + 30 * u, y + 36 * u); out.push([ar[0] + s / 2, y + 36 * u]);
    });
    ctx.restore(); return { pts: out, x: out[0][0], y: out[0][1] };
  }
  // 问答：问题卡先到，过一会儿答案卡从下面顶上来
  function qa(ctx, K, t, o) {
    const u = K.u, ar = area(K), at = o.at ?? .7;
    const card = (lab, txt, y, e, c, px) => {
      ctx.save(); ctx.globalAlpha = e; ctx.translate(0, (1 - e) * 60 * u);
      ctx.font = F(K, 900, px); const ls = wrapCJK(ctx, txt, ar[2] - 150 * u), h = Math.max(130 * u, ls.length * px * 1.3 * u + 60 * u);
      glass(ctx, K, ar[0], y, ar[2], h); ctx.fillStyle = c; ctx.fillRect(ar[0], y, 110 * u, h);
      ctx.fillStyle = '#fff'; ctx.font = F(K, 400, 90, K.num); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, ar[0] + 55 * u, y + h / 2 + 4 * u);
      ctx.font = F(K, 900, px); ctx.fillStyle = K.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ls.forEach((l, i) => ctx.fillText(l, ar[0] + 140 * u, y + 30 * u + (i + .85) * px * 1.3 * u));
      ctx.restore(); return h;
    };
    const h1 = card('Q', o.q, ar[1] + 20 * u, pop(t, .35), K.red, LAND ? 50 : 50);
    card('A', o.a, ar[1] + 20 * u + h1 + 40 * u, pop(t - at, .4), K.navy, LAND ? 42 : 42);
    return { x: ar[0] + ar[2] / 2, y: ar[1] + h1 / 2 };
  }
  // 关系图：中心一个节点，连线一根根画出去，四周节点依次弹出
  function relation(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), h = ar[1] + ar[3] - top, n = o.nodes.length;
    const cx = ar[0] + ar[2] / 2, cy = top + h / 2, rx = ar[2] * (LAND ? .38 : .36), ry = h * (LAND ? .38 : .4);
    const pts = o.nodes.map((_, i) => { const a = -Math.PI / 2 + i / n * TAU + (o.rot || 0); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
    ctx.save(); ctx.lineWidth = 3 * u;
    pts.forEach(([x, y], i) => { const k = eOutCubic(clamp((t - .25 - i * .1) / .35)); ctx.strokeStyle = o.nodes[i].hot ? K.red : 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(lerp(cx, x, k), lerp(cy, y, k)); ctx.stroke(); });
    const node = (x, y, lab, sub, e, c, big) => {
      ctx.save(); ctx.globalAlpha = e; ctx.font = F(K, 900, big ? 46 : 34); const w = Math.max(ctx.measureText(lab).width, sub ? (ctx.font = F(K, 400, 24), ctx.measureText(sub).width) : 0) + 50 * u, hh = (sub ? 100 : 70) * u * (big ? 1.2 : 1);
      ctx.translate(x, y); ctx.scale(.7 + .3 * e, .7 + .3 * e); ctx.fillStyle = c; rr(ctx, -w / 2, -hh / 2, w, hh, 14 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = F(K, 900, big ? 46 : 34); ctx.fillText(lab, 0, sub ? -14 * u : 2 * u);
      if (sub) { ctx.font = F(K, 400, 24); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(sub, 0, 26 * u); }
      ctx.restore();
    };
    node(cx, cy, o.center, o.sub, pop(t - .05, .3), K.red, true);
    o.nodes.forEach((nd, i) => node(...pts[i], nd.label, nd.sub, pop(t - .45 - i * .1, .3), nd.hot ? K.red : K.navy));
    ctx.restore(); return { pts, x: cx, y: cy };
  }
  // 名词解释：像词典的一条——词、英文、释义；右边（竖屏在下）一张小剖面图标出这条线在哪
  function glossary(ctx, K, t, o) {
    const u = K.u, ar = area(K), w = LAND ? ar[2] * .55 : ar[2], e = pop(t, .35);
    ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.gold; ctx.fillText(o.kicker, ar[0], ar[1] + 26 * u);
    ctx.font = F(K, 900, LAND ? 130 : 120); ctx.fillStyle = K.ink; ctx.fillText(o.term, ar[0], ar[1] + 170 * u);
    ctx.font = F(K, 400, 34, K.mono); ctx.fillStyle = K.muted; ctx.fillText(o.en, ar[0], ar[1] + 225 * u);
    ctx.fillStyle = K.red; ctx.fillRect(ar[0], ar[1] + 255 * u, w * pop(t - .2, .4), 4 * u);
    ctx.font = F(K, 700, LAND ? 40 : 40); ctx.fillStyle = K.ink;
    wrapCJK(ctx, o.def, w).forEach((l, i) => rise(ctx, l, ar[0], ar[1] + (320 + i * 56) * u, 56 * u, pop(t - .35 - i * .1, .4)));
    ctx.restore();
    // 剖面：坝体 + 水位 + 这条线
    const bx = LAND ? ar[0] + ar[2] * .62 : ar[0], by = LAND ? ar[1] + 40 * u : ar[1] + ar[3] * .58, bw = LAND ? ar[2] * .38 : ar[2], bh = LAND ? ar[3] - 80 * u : ar[3] * .42, k = eInOutCubic(clamp((t - .5) / .8));
    ctx.save(); ctx.globalAlpha = pop(t - .3, .4);
    const ly = by + bh * (o.at ?? .78), wy = lerp(by + bh * .25, ly + 10 * u, k);
    ctx.fillStyle = 'rgba(79,163,224,.75)'; ctx.beginPath(); ctx.moveTo(bx, by + bh); ctx.lineTo(bx, wy); ctx.lineTo(bx + bw * .62, wy); ctx.lineTo(bx + bw * .62, by + bh); ctx.fill();
    ctx.fillStyle = '#9AA3AE'; ctx.beginPath(); ctx.moveTo(bx + bw * .62, by); ctx.lineTo(bx + bw * .7, by); ctx.lineTo(bx + bw * .92, by + bh); ctx.lineTo(bx + bw * .62, by + bh); ctx.fill();
    ctx.strokeStyle = K.red; ctx.lineWidth = 4 * u; ctx.setLineDash([14 * u, 8 * u]); ctx.beginPath(); ctx.moveTo(bx, ly); ctx.lineTo(bx + bw, ly); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = F(K, 900, 30); ctx.fillStyle = K.red; ctx.textAlign = 'left'; ctx.fillText(o.line, bx + 10 * u, ly - 14 * u);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2 * u; ctx.strokeRect(bx, by, bw, bh); ctx.restore();
    return { x: bx + bw / 2, y: ly, box: [bx, by, bw, bh] };
  }
  // 事实核查：先出一张「网传」说法卡，再砸下一枚圆章，下面补上核查到的事实
  function factCheck(ctx, K, t, o) {
    const u = K.u, ar = area(K), at = o.at ?? .7, e = pop(t, .35);
    ctx.save(); ctx.globalAlpha = e; ctx.font = F(K, 900, LAND ? 54 : 52);
    const cw = LAND ? ar[2] * .72 : ar[2], ls = wrapCJK(ctx, '“' + o.claim + '”', cw - 80 * u), ch = ls.length * 70 * u + 130 * u;
    glass(ctx, K, ar[0], ar[1], cw, ch); ctx.font = F(K, 700, 26, K.mono); ctx.fillStyle = K.gold; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(o.kicker, ar[0] + 40 * u, ar[1] + 56 * u); ctx.font = F(K, 900, LAND ? 54 : 52); ctx.fillStyle = K.ink;
    ls.forEach((l, i) => ctx.fillText(l, ar[0] + 40 * u, ar[1] + (126 + i * 70) * u));
    ctx.restore();
    const k = clamp((t - at) / .18), sx = LAND ? ar[0] + cw - 20 * u : ar[0] + ar[2] - 170 * u, sy = ar[1] + ch - 10 * u, R = (LAND ? 130 : 120) * u;
    if (k > 0) {
      const s = 1 + 1.5 * (1 - eOutExpo(k));
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-.22); ctx.scale(s, s); ctx.globalAlpha = k * .92; ctx.strokeStyle = K.red; ctx.fillStyle = K.red;
      ctx.lineWidth = 9 * u; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke(); ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(0, 0, R - 16 * u, 0, TAU); ctx.stroke();
      ctx.font = F(K, 900, LAND ? 66 : 60); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.verdict, 0, 4 * u);
      ctx.font = F(K, 700, 18, K.mono); ctx.fillText('FACT CHECK', 0, -R * .58); ctx.restore();
    }
    ctx.save(); ctx.globalAlpha = pop(t - at - .25, .35); ctx.font = F(K, 700, LAND ? 40 : 40); ctx.fillStyle = K.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = K.green; ctx.fillRect(ar[0], ar[1] + ch + 50 * u, 8 * u, 120 * u); ctx.fillStyle = K.ink;
    wrap(ctx, o.fact, (LAND ? ar[2] * .72 : ar[2]) - 40 * u).forEach((l, i) => ctx.fillText(l, ar[0] + 36 * u, ar[1] + ch + (95 + i * 54) * u));
    ctx.restore(); return { x: sx, y: sy };
  }
  // 两面看：左绿右红（竖屏上绿下红）两栏，条目交替出现
  function proCon(ctx, K, t, o) {
    const u = K.u, ar = area(K), g = 30 * u, n = Math.max(o.left.items.length, o.right.items.length), cw = LAND ? (ar[2] - g) / 2 : ar[2], chh = Math.min(LAND ? ar[3] : (ar[3] - g) / 2, (190 + n * 130) * u);
    ctx.save(); const out = [];
    [o.left, o.right].forEach((s, i) => {
      const x = LAND ? ar[0] + i * (cw + g) : ar[0], y = LAND ? ar[1] : ar[1] + i * (chh + g), c = i ? K.red : K.green, e = pop(t - i * .15, .35);
      ctx.globalAlpha = e; glass(ctx, K, x, y, cw, chh); ctx.fillStyle = c; ctx.fillRect(x, y, cw, 90 * u);
      ctx.fillStyle = '#fff'; ctx.font = F(K, 900, 44); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText((i ? '▼ ' : '▲ ') + s.title, x + 30 * u, y + 47 * u);
      s.items.forEach((it, j) => {
        ctx.globalAlpha = pop(t - .3 - (j * 2 + i) * .15, .3); ctx.fillStyle = K.ink; ctx.font = F(K, 700, LAND ? 36 : 36); ctx.textBaseline = 'alphabetic';
        wrapCJK(ctx, it, cw - 70 * u).forEach((l, k) => ctx.fillText(l, x + 30 * u, y + (160 + j * 130 + k * 46) * u));
      });
      out.push([x + cw / 2, y + 45 * u]);
    });
    ctx.restore(); return { pts: out, x: out[0][0], y: out[0][1] };
  }
  // ── 收尾 ──
  // 出处汇总：素材按类别一行行推进来，左边一个类别牌
  function sources(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), n = o.items.length, rh = Math.min(92 * u, (ar[1] + ar[3] - top) / n);
    ctx.save(); o.items.forEach(([k, s], i) => {
      const y = top + i * rh, e = pop(t - .15 - i * .08, .3); ctx.globalAlpha = e; ctx.translate((1 - e) * 40 * u, 0);
      ctx.font = F(K, 900, 26); const kw = ctx.measureText(k).width + 30 * u; ctx.fillStyle = K.red; ctx.fillRect(ar[0], y + 10 * u, kw, 46 * u);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(k, ar[0] + 15 * u, y + 34 * u);
      ctx.font = F(K, 400, LAND ? 30 : 28); ctx.fillStyle = K.ink; ctx.fillText(s, ar[0] + kw + 24 * u, y + 34 * u);
      ctx.translate(-(1 - e) * 40 * u, 0);
    });
    ctx.restore(); return { x: ar[0], y: top };
  }
  // 延伸阅读：几张链接卡依次翻上来，卡上写标题和网址
  function reading(ctx, K, t, o) {
    const u = K.u, ar = area(K), top = header(ctx, K, t, o, ar), n = o.items.length, g = 22 * u;
    const cw = LAND ? (ar[2] - g * (n - 1)) / n : ar[2], chh = LAND ? Math.min(ar[1] + ar[3] - top, 330 * u) : (ar[1] + ar[3] - top - g * (n - 1)) / n;
    ctx.save(); o.items.forEach((it, i) => {
      const x = LAND ? ar[0] + i * (cw + g) : ar[0], y = LAND ? top : top + i * (chh + g), e = pop(t - .15 - i * .15, .4);
      ctx.save(); ctx.globalAlpha = e; ctx.translate(x + cw / 2, y + chh); ctx.scale(1, .6 + .4 * e); ctx.translate(-(x + cw / 2), -(y + chh));
      glass(ctx, K, x, y, cw, chh); ctx.fillStyle = K.red; ctx.fillRect(x, y, cw, 8 * u);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = F(K, 700, 24, K.mono); ctx.fillStyle = K.gold; ctx.fillText(it.k, x + 26 * u, y + 56 * u);
      ctx.font = F(K, 900, LAND ? 38 : 38); ctx.fillStyle = K.ink; wrap(ctx, it.title, cw - 52 * u).forEach((l, j) => ctx.fillText(l, x + 26 * u, y + (110 + j * 48) * u));
      ctx.font = F(K, 400, 20, K.mono); ctx.fillStyle = K.muted; wrapCJK(ctx, it.url, cw - 90 * u).slice(0, 2).forEach((l, j) => ctx.fillText(l, x + 26 * u, y + chh - (LAND ? 60 : 50) * u + j * 26 * u));
      ctx.font = F(K, 900, 40); ctx.fillStyle = K.red; ctx.textAlign = 'right'; ctx.fillText('↗', x + cw - 22 * u, y + chh - 26 * u);
      ctx.restore();
    });
    ctx.restore(); return { x: ar[0], y: top };
  }
  // 片尾：栏目条放大到中间，下面一排本期关键词按拍亮起，最后「感谢收看」
  function outro(ctx, K, t, o) {
    const u = K.u, e = eOutExpo(clamp(t / .45)), cy = H * (LAND ? .42 : .4);
    dim(ctx, .4);
    ctx.save(); ctx.translate(W / 2, cy); ctx.scale(.8 + .2 * e, .8 + .2 * e); ctx.globalAlpha = e;
    ctx.font = F(K, 900, LAND ? 120 : 104); const w1 = ctx.measureText(o.show).width + 70 * u; ctx.font = F(K, 700, LAND ? 50 : 44, K.mono); const w2 = ctx.measureText(o.en).width + 60 * u;
    const bh = (LAND ? 170 : 150) * u, x0 = -(w1 + w2) / 2;
    if (!LAND) { ctx.translate(0, 0); }
    ctx.fillStyle = K.red; ctx.fillRect(x0, -bh / 2, w1, bh); ctx.fillStyle = K.navy; ctx.fillRect(x0 + w1, -bh / 2, w2, bh);
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = F(K, 900, LAND ? 120 : 104); ctx.fillText(o.show, x0 + 35 * u, 6 * u);
    ctx.font = F(K, 700, LAND ? 50 : 44, K.mono); ctx.fillStyle = K.ink; ctx.fillText(o.en, x0 + w1 + 30 * u, 6 * u);
    ctx.restore();
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = F(K, 700, LAND ? 36 : 34);
    const ev = o.every || K.beat; let tw = 0; const ws = o.recap.map(s => ctx.measureText(s).width + 60 * u); tw = ws.reduce((a, b) => a + b, 0) + 20 * u * (ws.length - 1);
    const perRow = LAND ? ws.length : 2; let x = W / 2 - (LAND ? tw / 2 : (ws[0] + ws[1] + 20 * u) / 2), y = cy + (LAND ? 170 : 170) * u;
    o.recap.forEach((s, i) => {
      if (!LAND && i && i % perRow === 0) { y += 80 * u; x = W / 2 - ((ws[i] + (ws[i + 1] || 0) + (ws[i + 1] ? 20 * u : 0)) / 2); }
      const k = pop(t - .5 - i * ev, .25); ctx.globalAlpha = .25 + .75 * k; ctx.strokeStyle = k > .5 ? K.red : 'rgba(255,255,255,.4)'; ctx.lineWidth = 3 * u;
      rr(ctx, x, y - 30 * u, ws[i], 60 * u, 30 * u); ctx.stroke(); ctx.fillStyle = K.ink; ctx.fillText(s, x + ws[i] / 2, y + 2 * u); x += ws[i] + 20 * u;
    });
    ctx.globalAlpha = pop(t - .6 - o.recap.length * ev, .4); ctx.font = F(K, 900, LAND ? 56 : 52); ctx.fillStyle = K.ink; ctx.fillText(o.bye, W / 2, y + 140 * u);
    ctx.font = F(K, 400, 22, K.mono); ctx.fillStyle = K.muted; ctx.fillText(o.sub, W / 2, y + 200 * u);
    ctx.restore(); return { x: W / 2, y: cy };
  }

  // ══ 叠加部件：叠在别的镜头上，位置取宿主的返回值 ══════════════════════════════
  // 标注：一道竖括号框住照片上的一段，旁边一句说明（a、b 是括号两端）
  function bracket(ctx, K, t, o) {
    if (t < 0 || !o.a) return; const u = K.u, a = o.a, b = o.b, d = eOutCubic(inv(0, .5, t));
    ctx.save(); ctx.strokeStyle = K.gold; ctx.lineWidth = 5 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a[0] - 16 * u, a[1]); ctx.lineTo(a[0], a[1]); ctx.lineTo(a[0], lerp(a[1], b[1], d)); if (d >= 1) ctx.lineTo(b[0] - 16 * u, b[1]); ctx.stroke();
    if (o.label) {
      const e = pop(t - .4, .3), ym = (a[1] + b[1]) / 2, right = (o.side || (a[0] > W * .6 ? -1 : 1)) > 0;
      ctx.globalAlpha = e; ctx.font = F(K, 900, LAND ? 36 : 34); const w = ctx.measureText(o.label).width + 36 * u, x = right ? a[0] + 30 * u : a[0] - 40 * u - w;
      ctx.setLineDash([8 * u, 8 * u]); ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(a[0], ym); ctx.lineTo(right ? x : x + w, ym); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = K.gold; ctx.fillRect(x, ym - 30 * u, w, 60 * u); ctx.fillStyle = K.bg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(o.label, x + 18 * u, ym + 2 * u);
    }
    ctx.restore();
  }
  // 圈注：一圈手绘的红椭圆画出来，收笔处写一句
  function circle(ctx, K, t, o) {
    if (t < 0 || o.x == null) return; const u = K.u, rx = o.rx || o.r || 80 * u, ry = o.ry || o.r || 80 * u;
    const pts = circlePts(0, 0, 1, 64, -2.2, -2.2 + TAU * 1.08, .04, 3).map(([x, y]) => [o.x + x * rx, o.y + y * ry]);
    ctx.save(); ctx.strokeStyle = K.red; ctx.lineWidth = 7 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    drawPartial(ctx, pts, eInOutCubic(clamp(t / .45)));
    if (o.label) { ctx.globalAlpha = pop(t - .45, .3); ctx.font = F(K, 900, 34); ctx.fillStyle = K.red; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const w = ctx.measureText(o.label).width + 30 * u; ctx.fillRect(o.x - w / 2, o.y + ry + 16 * u, w, 52 * u); ctx.fillStyle = '#fff'; ctx.fillText(o.label, o.x, o.y + ry + 24 * u); }
    ctx.restore();
  }
  // 人名条：红块 + 白条从左边滑进来，上行名字、下行身份
  function nameplate(ctx, K, t, o) {
    if (t < 0) return; const u = K.u, e = eOutExpo(clamp(t / .35)), x = o.x ?? 120 * u, y = o.y ?? H * .6;
    ctx.save(); ctx.font = F(K, 900, 40); const w = Math.max(ctx.measureText(o.name).width, (ctx.font = F(K, 400, 26), ctx.measureText(o.role).width)) + 60 * u;
    ctx.beginPath(); ctx.rect(x, y - 10 * u, (w + 14 * u) * e, 130 * u); ctx.clip();
    ctx.fillStyle = K.red; ctx.fillRect(x, y, 14 * u, 110 * u); ctx.fillStyle = 'rgba(245,247,250,.96)'; ctx.fillRect(x + 14 * u, y, w, 64 * u);
    ctx.fillStyle = K.navy; ctx.fillRect(x + 14 * u, y + 64 * u, w, 46 * u);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = F(K, 900, 40); ctx.fillStyle = K.bg; ctx.fillText(o.name, x + 40 * u, y + 34 * u);
    ctx.font = F(K, 400, 26); ctx.fillStyle = K.ink; ctx.fillText(o.role, x + 40 * u, y + 88 * u); ctx.restore();
  }
  // 「资料」「现场」标签：红牌，现场的带一个闪的圆点；放在宿主 box 的左上角
  function label(ctx, K, t, o) {
    if (t < 0 || !o.box) return; const u = K.u, [x, y] = o.box, e = pop(t, .25);
    ctx.save(); ctx.globalAlpha = e; ctx.font = F(K, 900, 32); const live = o.live, w = ctx.measureText(o.text).width + (live ? 70 : 40) * u;
    ctx.fillStyle = live ? K.red : 'rgba(245,247,250,.95)'; ctx.fillRect(x, y, w * e, 56 * u);
    ctx.fillStyle = live ? '#fff' : K.bg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    if (live && Math.floor(t / .4) % 2 === 0) { ctx.beginPath(); ctx.arc(x + 26 * u, y + 28 * u, 9 * u, 0, TAU); ctx.fill(); }
    ctx.fillText(o.text, x + (live ? 48 : 20) * u, y + 30 * u); ctx.restore();
  }
  // 出处角标：宿主 box 右下角一行小字
  function credit(ctx, K, t, o) {
    if (t < 0 || !o.box) return; const u = K.u, [x, y, w, h] = o.box, e = pop(t, .3);
    ctx.save(); ctx.globalAlpha = e; ctx.font = F(K, 400, 20, K.mono); const tw = ctx.measureText(o.text).width + 24 * u;
    ctx.fillStyle = 'rgba(7,11,16,.8)'; ctx.fillRect(x + w - tw - 12 * u, y + h - 50 * u, tw, 38 * u);
    ctx.fillStyle = K.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(o.text, x + w - tw, y + h - 30 * u); ctx.restore();
  }

  // ══ 层 ══════════════════════════════════════════════════════════════════════
  // 粒子：稀疏的光点慢慢飘（像新闻演播室屏幕前的浮尘），每帧只由 t 决定
  function dust(ctx, K, t) {
    ctx.save();
    for (let i = 0; i < 40; i++) {
      const x = ((hash1(i) * W + t * (12 + 24 * hash1(i + 50)) * K.u) % W + W) % W, y = ((hash1(i + 99) * H - t * (6 + 12 * hash1(i + 7)) * K.u) % H + H) % H;
      ctx.globalAlpha = (.12 + .3 * hash1(i + 3)) * (.5 + .5 * Math.sin(t * 1.3 + i));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, (1 + 2.2 * hash1(i + 11)) * K.u, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  // 角标：左上栏目条 + 右上日期 + 底部滚动出处，al 控制显隐（开场、章节卡、片尾不显示）；返回滚动条顶边
  function corner(ctx, K, t, o) {
    const u = K.u, y = H - 54 * u - (LAND ? 26 : 120) * u;
    if (o.al <= 0) return y;
    ctx.save(); ctx.globalAlpha = o.al; bug(ctx, K, 1, o);
    if (o.ch && o.ch.n) { ctx.font = F(K, 700, 22, K.mono); ctx.fillStyle = K.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(`${String(o.ch.n).padStart(2, '0')} ${o.ch.title}`, (LAND ? 60 : 40) * u, (LAND ? 46 : 90) * u + 80 * u); }
    if (o.beat) {                                          // 节拍：栏目条右边一个红点，每拍亮一下
      ctx.font = F(K, 900, 30); const bx = (LAND ? 60 : 40) * u + ctx.measureText(o.show).width + 34 * u; ctx.font = F(K, 700, 22, K.mono);
      const ph = ((t % o.beat) + o.beat) % o.beat / o.beat, x = bx + ctx.measureText(o.en).width + 28 * u + 22 * u, yy = (LAND ? 46 : 90) * u + 26 * u;
      ctx.fillStyle = K.red; ctx.globalAlpha = o.al * (.35 + .65 * (1 - ph)); ctx.beginPath(); ctx.arc(x, yy, 8 * u * (1 + .4 * (1 - ph)), 0, TAU); ctx.fill(); ctx.globalAlpha = o.al;
    }
    ticker(ctx, K, t, o.src); ctx.restore();
    return y;
  }
  // 字幕：每章一句，放在滚动条上面
  function captions(ctx, K, t, cues, above) {
    const c = cues.find(q => t >= q.a && t < q.b); if (!c) return;
    const a = smooth(c.a, c.a + .15, t) * (1 - smooth(c.b - .15, c.b, t));
    ctx.save(); ctx.globalAlpha = a;
    caption(ctx, c.text, { size: LAND ? 40 : 44, y: above - 22 * K.u, bg: 'rgba(7,11,16,.78)', maxW: W * (LAND ? .7 : .86) });
    ctx.restore();
  }

  // ══ 转场：七种，每种看起来都不一样（samples/tools/trcheck.py 查过）。签名 (ctx, K, p, drawA, drawB)，p 从 0 到 1 ══
  let OFF = null;
  const off = drawB => { OFF = OFF || mk(W, H); const o = OFF.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); drawB(o); return OFF; };
  // 红条擦：一道红条从左扫到右，条左边是新镜头
  function bar(ctx, K, p, drawA, drawB) {
    const B = off(drawB), e = eInOutCubic(clamp(p)), x = lerp(-.15, 1.15, e) * W, bw = 40 * K.u;
    drawA(ctx);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.max(0, x - bw), H); ctx.clip(); ctx.drawImage(B, 0, 0); ctx.restore();
    ctx.fillStyle = K.red; ctx.fillRect(x - bw, 0, bw, H); ctx.fillStyle = '#fff'; ctx.fillRect(x, 0, 6 * K.u, H);
  }
  // 推：新镜头从下面（竖屏从右边）整个把旧镜头顶出去
  function push(ctx, K, p, drawA, drawB) {
    const B = off(drawB), e = eInOutCubic(clamp(p)), dx = LAND ? 0 : W * e, dy = LAND ? H * e : 0;
    ctx.save(); ctx.translate(-dx, -dy); drawA(ctx); ctx.restore();
    ctx.drawImage(B, LAND ? 0 : W - dx, LAND ? H - dy : 0);
    ctx.fillStyle = K.red; if (LAND) ctx.fillRect(0, H - dy - 6 * K.u, W, 6 * K.u); else ctx.fillRect(W - dx - 6 * K.u, 0, 6 * K.u, H);
  }
  // 叠化：旧镜头慢慢变暗，新镜头渐显
  function fade(ctx, K, p, drawA, drawB) {
    const B = off(drawB), e = clamp(p);
    drawA(ctx); ctx.fillStyle = `rgba(7,11,16,${.6 * Math.sin(e * Math.PI)})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = e; ctx.drawImage(B, 0, 0); ctx.restore();
  }
  // 框放大：新镜头装在中间一个白边小框里，框放大到满屏
  function zoom(ctx, K, p, drawA, drawB) {
    const B = off(drawB), e = eInOutCubic(clamp(p)), s = lerp(.18, 1, e), w = W * s, h = H * s, x = (W - w) / 2, y = (H - h) / 2;
    drawA(ctx); ctx.fillStyle = `rgba(7,11,16,${.5 * e})`; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(B, x, y, w, h);
    if (e < 1) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 8 * K.u * (1 - e); ctx.strokeRect(x, y, w, h); }
  }
  // 闪白：前半段白光盖满，后半段从白光里露出新镜头
  function flash(ctx, K, p, drawA, drawB) {
    const e = clamp(p); if (e < .5) drawA(ctx); else drawB(ctx);
    ctx.fillStyle = `rgba(255,255,255,${1 - Math.abs(e - .5) * 2})`; ctx.fillRect(0, 0, W, H);
  }
  // 开门：中间一条缝向上下（竖屏向左右）张开，缝里是新镜头，缝边两道红线
  function doors(ctx, K, p, drawA, drawB) {
    const B = off(drawB), e = eInOutCubic(clamp(p)), u = K.u;
    drawA(ctx);
    ctx.save(); ctx.beginPath();
    if (LAND) ctx.rect(0, H / 2 * (1 - e), W, H * e); else ctx.rect(W / 2 * (1 - e), 0, W * e, H);
    ctx.clip(); ctx.drawImage(B, 0, 0); ctx.restore();
    ctx.fillStyle = K.red;
    if (LAND) { ctx.fillRect(0, H / 2 * (1 - e) - 8 * u, W, 8 * u); ctx.fillRect(0, H / 2 * (1 + e), W, 8 * u); }
    else { ctx.fillRect(W / 2 * (1 - e) - 8 * u, 0, 8 * u, H); ctx.fillRect(W / 2 * (1 + e), 0, 8 * u, H); }
  }
  // 方块翻：屏幕切成方格，沿对角线一格格翻成新镜头，正在翻的格子是深蓝
  function tiles(ctx, K, p, drawA, drawB) {
    const B = off(drawB), cs = SHORT / 6, nx = Math.ceil(W / cs), ny = Math.ceil(H / cs);
    drawA(ctx);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const d = (i / nx + j / ny) / 2, k = clamp((p * 1.6 - d * .6) / .4), x = i * cs, y = j * cs;
      if (k <= 0) continue;
      const s = Math.abs(Math.cos(k * Math.PI)), cx = x + cs / 2;
      ctx.save(); ctx.beginPath(); ctx.rect(cx - cs / 2 * s, y, cs * s, cs); ctx.clip();
      if (k < .5) { ctx.fillStyle = K.navy; ctx.fillRect(x, y, cs, cs); } else ctx.drawImage(B, x, y, cs, cs, x, y, cs, cs);
      ctx.restore();
    }
  }
  const TRANS = { bar, push, fade, zoom, flash, doors, tiles };
  const transition = bar;                                   // 15 秒片段用的红条擦

  const LAYOUTS = { kenburns, parallax, collage };
  return {
    theme, photo, cover, LAYOUTS, TRANS, transition, tag, bug, headline, chart, note, ticker, subtitle, pop, area,
    coldOpen, slam, points, crawl, chapter, story, compare, satZoom, archive, mapPin, sourceFrame, split, strip,
    bigNumber, bars, line, ring, rank, heatMap, flip, table, delta, versus, thresholds,
    quote, timeline, checklist, qa, relation, glossary, factCheck, proCon, sources, reading, outro,
    bracket, circle, nameplate, label, credit, dust, corner, captions,
  };
})();
