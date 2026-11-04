// 新闻资讯解说风格包（由 T-007 沉淀）：公共领域照片 + 公开数据，做成电视新闻式的解说短片。
// 切换的维度是「画面组织」（照片怎么上屏），不是颜色：同一张分段表、同一套栏目包装和数据图，换一个 layout 参数——
//   kenburns 单图推拉：一次铺满一张，慢推慢移；两张对比用新闻台常见的左右滑杆
//   parallax 2.5D 视差分层：照片按深度图切成远、中、近三层，镜头横移时各层速度不同；没有深度图的（卫星图）当成前后两张卡片
//   collage  多图拼贴分屏：几张照片和数据卡同时上屏，按拍点一格格滑进来
// 依赖 samples/lib/lib.js 的 W H LAND SHORT、inv/lerp/clamp/smooth、缓动、rr()、wrapCJK()、mk()、cueAt()。
// 部件签名都是 (ctx, K, t, …)：K 是 theme() 的结果，t 是部件自己的本地时间（秒，可以为负）。每帧只由 t 决定。
const NB = (() => {
  // 主题：颜色固定（新闻红 + 深蓝），不随画面组织变
  function theme(o = {}) {
    return {
      red: o.red || '#E0313B', navy: '#0E2238', bg: '#070B10', ink: '#F5F7FA', muted: 'rgba(245,247,250,.72)',
      glass: 'rgba(8,14,22,.78)', line: 'rgba(255,255,255,.18)', gold: '#FFC94A',
      head: o.head || "'Noto Sans SC'", num: o.num || "'Bebas Neue'", mono: o.mono || "'JetBrains Mono'",
      u: SHORT / 1080, beat: o.beat || .375,
    };
  }
  const F = (K, w, px, fam = K.head) => `${w} ${Math.round(px * K.u)}px ${fam}`;
  const pop = (t, d = .5) => eOutCubic(clamp(t / d));

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
    return LAND ? [90 * u, H * .5, W * .75, H * .3] : [60 * u, H * .5, W - 120 * u, H * .26];     // headline
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
  const LAYOUTS = { kenburns, parallax, collage };

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
  // 转场：一道红条横扫过去，条后面是下一段
  let OFF = null;
  function transition(ctx, K, p, drawA, drawB) {
    OFF = OFF || mk(W, H); const o = OFF.getContext('2d');
    const e = eInOutCubic(clamp(p)), x = lerp(-.15, 1.15, e) * W, bw = 40 * K.u;
    drawA(ctx);
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); drawB(o);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.max(0, x - bw), H); ctx.clip(); ctx.drawImage(OFF, 0, 0); ctx.restore();
    ctx.fillStyle = K.red; ctx.fillRect(x - bw, 0, bw, H); ctx.fillStyle = '#fff'; ctx.fillRect(x, 0, 6 * K.u, H);
  }

  return { theme, photo, cover, LAYOUTS, tag, bug, headline, chart, note, ticker, subtitle, transition, pop };
})();
