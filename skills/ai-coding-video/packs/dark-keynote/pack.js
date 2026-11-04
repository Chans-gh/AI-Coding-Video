// 暗色科技发布会风格包（由 C-044 沉淀）：一个主题 + 背景 + 五个部件（片头、讲解、数据、转场、字幕）。
// 依赖 samples/lib/lib.js 的 W H LAND SHORT、inv/lerp/clamp/smooth、缓动、rr()、wrapCJK()。
// 每个部件都是 (ctx, K, t, o)：K 是 theme() 的结果，t 是这个部件自己的本地时间（秒，从 0 起，可以为负），o 是内容。
// 每帧只由 t 决定；换品牌色只改 theme({ accent })，其余颜色都从它推出来。
const DK = (() => {
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

  // 主题：只有一个品牌强调色；底色、高光、辉光都由它推出
  function theme(o = {}) {
    const ac = hex(o.accent || '#8B7BFF');
    return {
      ac, a: (al = 1) => css(ac, al),
      hi: css(mix(ac, [255, 255, 255], .6)),            // 强调色的亮版：大数字渐变的顶端、光边
      bg0: '#05050A', bg1: css(mix([12, 12, 22], ac, .1)),
      ink: '#F4F5F8', muted: 'rgba(244,245,248,.6)', faint: 'rgba(255,255,255,.16)', grid: 'rgba(255,255,255,.045)',
      head: o.head || "'Noto Sans SC'", num: o.num || "'Bebas Neue'", mono: o.mono || "'JetBrains Mono'",
      u: SHORT / 1080, beat: o.beat || .375,
    };
  }
  const F = (K, w, px, fam = K.head) => `${w} ${Math.round(px * K.u)}px ${fam}`;
  const pop = (t, d = .6) => eOutExpo(clamp(t / d));      // 吸附：猛冲后急停，所有进场都用它
  let OFF = null;
  const off = () => { OFF = OFF || mk(W, H); const o = OFF.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); return o; };

  // 背景：近黑径向渐变 + 发丝网格 + 一团缓慢漂移的品牌色柔光
  function backdrop(ctx, K, t) {
    const g = ctx.createRadialGradient(W / 2, H * .38, 0, W / 2, H * .45, LONG * .7);
    g.addColorStop(0, K.bg1); g.addColorStop(1, K.bg0);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const s = 60 * K.u; ctx.strokeStyle = K.grid; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = (W / 2) % s; x <= W; x += s) { ctx.moveTo(Math.round(x) + .5, 0); ctx.lineTo(Math.round(x) + .5, H); }
    for (let y = (H / 2) % s; y <= H; y += s) { ctx.moveTo(0, Math.round(y) + .5); ctx.lineTo(W, Math.round(y) + .5); }
    ctx.stroke();
    const gx = W * (.5 + .22 * Math.sin(t * .35)), gy = H * (.42 + .1 * Math.cos(t * .27)), r = SHORT * .75;
    const gl = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    gl.addColorStop(0, K.a(.16)); gl.addColorStop(1, K.a(0));
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
  }

  // 玻璃卡片：半透明白渐变 + 细白边
  function glass(ctx, K, x, y, w, h, r = 28) {
    rr(ctx, x, y, w, h, r * K.u);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(255,255,255,.09)'); g.addColorStop(1, 'rgba(255,255,255,.025)');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1.5 * K.u; ctx.stroke();
  }
  // 扫光：一条斜的白色光带从左扫到右，p 是进度 0–1；调用前先 clip 到要扫的东西上
  function sweep(ctx, x, y, w, h, p, al = .32) {
    if (p <= 0 || p >= 1) return;
    const sx = lerp(x - h, x + w + h, eInOutCubic(p)), bw = Math.max(120, h * .5);
    const g = ctx.createLinearGradient(sx - bw, 0, sx + bw, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${al})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save(); ctx.fillStyle = g; ctx.translate(0, y); ctx.transform(1, 0, -.35, 1, 0, 0); ctx.fillRect(sx - bw, 0, bw * 2, h); ctx.restore();
  }
  // 窗口头：三个强调色深浅的圆点 + 等宽小标签
  function chrome(ctx, K, x, y, label) {
    [1, .55, .25].forEach((al, i) => { ctx.fillStyle = K.a(al); ctx.beginPath(); ctx.arc(x + 36 * K.u + i * 26 * K.u, y + 36 * K.u, 7 * K.u, 0, TAU); ctx.fill(); });
    if (label) { ctx.fillStyle = K.muted; ctx.font = F(K, 700, 20, K.mono); ctx.textAlign = 'right'; ctx.fillText(label, x - 1, y + 43 * K.u); ctx.textAlign = 'left'; }
  }
  // 小标题：等宽、强调色、字距拉开，前面一条短横
  function kicker(ctx, K, text, x, y, al, align = 'left') {
    ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = K.a(1); ctx.font = F(K, 700, 24, K.mono);
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${4 * K.u}px`;
    ctx.textAlign = align; ctx.fillText(text, x, y);
    if (align === 'left') ctx.fillRect(x - 46 * K.u, y - 9 * K.u, 30 * K.u, 3 * K.u);
    ctx.restore();
  }

  // ① 片头：标志描边再填满 → 小标题 → 标题逐字吸附 → 下划线伸出 → 扫光 → 副标题
  // o = { kicker, title, sub }；约 2 秒全部到位
  function title(ctx, K, t, o) {
    const u = K.u, cx = W / 2, my = H * (LAND ? .27 : .33), ty = H * (LAND ? .56 : .48), sy = ty + 92 * u;
    const pulse = smooth(0, .5, t) * (1 - .35 * smooth(.6, 1.6, t));
    const gl = ctx.createRadialGradient(cx, my, 0, cx, my, 420 * u); gl.addColorStop(0, K.a(.45 * pulse)); gl.addColorStop(1, K.a(0));
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    // 标志：圆角方块先描边，再填强调色，里面三条长短不同的横条（像三帧）
    const ms = 120 * u, d = inv(.05, .55, t), fill = pop(t - .5, .4);
    if (d > 0) {
      ctx.save(); ctx.translate(cx, my); ctx.scale(lerp(.85, 1, pop(t, .6)), lerp(.85, 1, pop(t, .6)));
      rr(ctx, -ms / 2, -ms / 2, ms, ms, 30 * u);
      ctx.strokeStyle = K.a(1); ctx.lineWidth = 4 * u; ctx.setLineDash([ms * 4, ms * 4]); ctx.lineDashOffset = ms * 4 * (1 - d); ctx.stroke(); ctx.setLineDash([]);
      if (fill > 0) {
        const g = ctx.createLinearGradient(0, -ms / 2, 0, ms / 2); g.addColorStop(0, K.hi); g.addColorStop(1, K.a(1));
        ctx.globalAlpha = fill; ctx.fillStyle = g; ctx.fill();
        ctx.fillStyle = K.bg0; [[.62, -.2], [.44, 0], [.26, .2]].forEach(([l, y], i) => {
          const w = ms * l * pop(t - .6 - i * .08, .4); rr(ctx, -ms * .31, y * ms - 7 * u, w, 14 * u, 7 * u); ctx.fill();
        });
      }
      ctx.restore();
    }
    // 小标题
    if (o.kicker) kicker(ctx, K, o.kicker, cx, ty - (LAND ? 200 : 180) * u, smooth(.45, .8, t), 'center');
    // 标题：逐字从下方吸附上来；先画在离屏画布上，扫光用 source-atop 只落在字上
    const oc = off();
    oc.font = F(K, 900, LAND ? 170 : 150); oc.textBaseline = 'alphabetic';
    const chars = [...o.title], ws = chars.map(c => oc.measureText(c).width), tw = ws.reduce((a, b) => a + b, 0);
    let x = cx - tw / 2;
    chars.forEach((c, i) => {
      const e = pop(t - .6 - i * .06, .55);
      oc.globalAlpha = smooth(0, .4, e); oc.fillStyle = K.ink; oc.fillText(c, x, ty + (1 - e) * 60 * u); x += ws[i];
    });
    oc.globalAlpha = 1; oc.globalCompositeOperation = 'source-atop';
    sweep(oc, cx - tw / 2, ty - 160 * u, tw, 200 * u, inv(1.2, 2.0, t), .9);
    oc.globalCompositeOperation = 'source-over';
    ctx.drawImage(OFF, 0, 0);
    // 下划线：强调色，从中间向两边伸出
    const lw = tw * .5 * pop(t - 1.0, .6);
    if (lw > 0) { ctx.fillStyle = K.a(1); ctx.shadowColor = K.a(.8); ctx.shadowBlur = 24 * u; ctx.fillRect(cx - lw / 2, ty + 30 * u, lw, 5 * u); ctx.shadowBlur = 0; }
    // 副标题
    if (o.sub) {
      const e = pop(t - 1.4, .6); ctx.globalAlpha = e; ctx.fillStyle = K.muted; ctx.font = F(K, 700, 46); ctx.textAlign = 'center';
      ctx.fillText(o.sub, cx, sy + 30 * u + (1 - e) * 24 * u); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
  }

  // ② 讲解：左边（竖屏在上）小标题 + 大标题，右边玻璃窗口里按节拍一条条亮起步骤；当前一条高亮，做完的打上强调色
  // o = { kicker, title, steps: [..], label, every = 2 拍, start = .5 }
  function explain(ctx, K, t, o) {
    const u = K.u, every = o.every || K.beat * 2, st = o.start ?? .5, n = o.steps.length;
    const hx = LAND ? W * .09 : 90 * u, hy = LAND ? H * .40 : H * .17;
    const he = pop(t, .6);
    kicker(ctx, K, o.kicker, hx + 46 * u, hy, he);
    ctx.globalAlpha = he; ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 84 : 92);
    const lines = LAND ? wrapCJK(ctx, o.title, W * .32) : [o.title];
    lines.forEach((l, i) => ctx.fillText(l, hx, hy + (90 + i * 104) * u + (1 - he) * 30 * u));
    ctx.globalAlpha = 1;
    // 窗口
    const cw = LAND ? W * .48 : W - 180 * u, rowH = (LAND ? 132 : 160) * u, ch = 110 * u + rowH * n + 40 * u;
    const ce = pop(t - .15, .7), cx = LAND ? W * .44 : 90 * u, cy = (LAND ? (H - ch) / 2 : H * .32) + (1 - ce) * 80 * u;
    if (ce <= 0) return;
    ctx.save(); ctx.globalAlpha = ce; glass(ctx, K, cx, cy, cw, ch); ctx.clip();
    chrome(ctx, K, cx, cy, null);
    if (o.label) { ctx.fillStyle = K.muted; ctx.font = F(K, 700, 20, K.mono); ctx.textAlign = 'right'; ctx.fillText(o.label, cx + cw - 32 * u, cy + 43 * u); ctx.textAlign = 'left'; }
    ctx.fillStyle = K.faint; ctx.fillRect(cx, cy + 72 * u, cw, 1.5 * u);
    const cur = Math.floor((t - st) / every);
    // 竖线连接各步的圆圈，跟着进度长
    const px = cx + 78 * u, y0 = cy + 110 * u + rowH / 2;
    const prog = clamp((t - st) / every, 0, n - 1);
    ctx.fillStyle = K.faint; ctx.fillRect(px - 1.5 * u, y0, 3 * u, rowH * (n - 1));
    ctx.fillStyle = K.a(1); ctx.fillRect(px - 1.5 * u, y0, 3 * u, rowH * Math.max(0, prog - .0));
    o.steps.forEach((s, i) => {
      const lt = t - st - i * every, e = pop(lt, .5), y = y0 + i * rowH;
      if (lt < 0) { ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.arc(px, y, 26 * u, 0, TAU); ctx.fill(); return; }
      const on = i === Math.min(cur, n - 1);
      if (on) { // 当前一条：强调色淡底 + 左边竖条
        ctx.fillStyle = K.a(.12 * e); rr(ctx, cx + 24 * u, y - rowH / 2 + 10 * u, (cw - 48 * u) * e, rowH - 20 * u, 16 * u); ctx.fill();
      }
      ctx.fillStyle = on || i < cur ? K.a(1) : 'rgba(255,255,255,.1)';
      ctx.beginPath(); ctx.arc(px, y, 26 * u * lerp(.6, 1, e), 0, TAU); ctx.fill();
      ctx.fillStyle = K.bg0; ctx.font = F(K, 700, 24, K.mono); ctx.textAlign = 'center'; ctx.fillText(String(i + 1), px, y + 8 * u); ctx.textAlign = 'left';
      ctx.globalAlpha = ce * smooth(0, .4, e); ctx.fillStyle = on ? K.ink : K.muted; ctx.font = F(K, 700, LAND ? 44 : 46);
      ctx.fillText(s, px + 60 * u + (1 - e) * 40 * u, y + 15 * u); ctx.globalAlpha = ce;
    });
    sweep(ctx, cx, cy, cw, ch, inv(.3, 1.1, t), .22);
    ctx.restore();
  }

  // ③ 数据：玻璃卡片里的柱状图按拍长起（只有最后一根用强调色），旁边（竖屏在上）一个巨大数字从 from 数到 to
  // o = { kicker, title, bars: [{ label, v }], unit, digits, big: { from, to, digits, suffix, label, start } }
  function data(ctx, K, t, o) {
    const u = K.u, n = o.bars.length, vmax = Math.max(...o.bars.map(b => b.v));
    const cw = LAND ? W * .44 : W - 180 * u, ch = LAND ? 640 * u : 600 * u;
    const ce = pop(t, .7), cx = LAND ? W * .08 : 90 * u, cy = (LAND ? (H - ch) / 2 + 20 * u : H * .45) + (1 - ce) * 80 * u;
    if (ce > 0) {
      ctx.save(); ctx.globalAlpha = ce; glass(ctx, K, cx, cy, cw, ch); ctx.clip();
      chrome(ctx, K, cx, cy, null);
      ctx.fillStyle = K.ink; ctx.font = F(K, 700, 34); ctx.fillText(o.title, cx + 40 * u, cy + 120 * u);
      const bx = cx + 60 * u, bw = cw - 120 * u, base = cy + ch - 90 * u, top = cy + 190 * u, slot = bw / n, w = Math.min(130 * u, slot * .52);
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      for (let k = 0; k <= 3; k++) ctx.fillRect(bx, lerp(base, top, k / 3), bw, 1.5 * u);
      o.bars.forEach((b, i) => {
        const e = eOutCubic(inv(.35 + i * K.beat, .35 + i * K.beat + .7, t)), h = (base - top) * b.v / vmax * e;
        const x = bx + slot * i + (slot - w) / 2, last = i === n - 1;
        if (h > 0) {
          const g = ctx.createLinearGradient(0, base - h, 0, base);
          if (last) { g.addColorStop(0, K.hi); g.addColorStop(.25, K.a(1)); g.addColorStop(1, K.a(.2)); }
          else { g.addColorStop(0, 'rgba(255,255,255,.34)'); g.addColorStop(1, 'rgba(255,255,255,.06)'); }
          ctx.save(); if (last) { ctx.shadowColor = K.a(.7); ctx.shadowBlur = 40 * u; }
          ctx.fillStyle = g; rr(ctx, x, base - h, w, h, Math.min(14 * u, h / 2)); ctx.fill(); ctx.restore();
          ctx.globalAlpha = ce * smooth(.2, .6, e); ctx.fillStyle = last ? K.ink : K.muted; ctx.font = F(K, 400, 44, K.num); ctx.textAlign = 'center';
          ctx.fillText((b.v * e).toFixed(o.digits ?? 0) + (o.unit || ''), x + w / 2, base - h - 16 * u); ctx.globalAlpha = ce;
        }
        ctx.fillStyle = last ? K.a(1) : K.muted; ctx.font = F(K, 700, 24, K.mono); ctx.textAlign = 'center';
        ctx.fillText(b.label, x + w / 2, base + 46 * u); ctx.textAlign = 'left';
      });
      ctx.fillStyle = K.faint; ctx.fillRect(bx, base, bw, 2 * u);
      sweep(ctx, cx, cy, cw, ch, inv(.25, 1.0, t), .2);
      ctx.restore();
    }
    // 大数字：猛冲后急停，白到强调色的竖向渐变加辉光
    const nb = o.big, ns = nb.start ?? 1.3, p = inv(ns, ns + 1.2, t);
    if (p <= 0) return;
    const nx = LAND ? W * .76 : W / 2, ny = LAND ? H * .56 : H * .32, sz = LAND ? 330 : 320;
    const v = lerp(nb.from, nb.to, eOutExpo(p)), txt = v.toFixed(nb.digits ?? 1) + (nb.suffix || '');
    if (o.kicker) kicker(ctx, K, o.kicker, nx, ny - sz * .82 * u, smooth(0, .3, p), 'center');
    const g = ctx.createLinearGradient(0, ny - sz * .75 * u, 0, ny); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, K.hi);
    ctx.save(); ctx.globalAlpha = smooth(0, .25, p); ctx.textAlign = 'center';
    ctx.shadowColor = K.a(.85); ctx.shadowBlur = 70 * u; ctx.fillStyle = g; ctx.font = F(K, 400, sz, K.num);
    ctx.fillText(txt, nx, ny); ctx.shadowBlur = 0; ctx.fillText(txt, nx, ny);
    ctx.globalAlpha = smooth(.45, .8, p); ctx.fillStyle = K.muted; ctx.font = F(K, 700, 40); ctx.fillText(nb.label, nx, ny + 70 * u);
    ctx.restore();
  }

  // ④ 转场：一道斜的光边从左扫到右，光边左边是新画面 B，右边还是旧画面 A
  // p 是进度 0–1；drawA、drawB 各画一整帧（含背景）
  function transition(ctx, K, p, drawA, drawB) {
    const e = eInOutCubic(clamp(p)), lean = H * .3, x = lerp(-lean - 80, W + 80, e);
    drawA(ctx);
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(x + lean, 0); ctx.lineTo(x, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
    drawB(ctx); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const band = (w, al) => {
      const g = ctx.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, K.a(0)); g.addColorStop(.5, K.a(al)); g.addColorStop(1, K.a(0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + lean - w, 0); ctx.lineTo(x + lean + w, 0); ctx.lineTo(x + w, H); ctx.lineTo(x - w, H); ctx.closePath(); ctx.fill();
    };
    const k = Math.sin(Math.PI * e);
    band(220 * K.u, .35 * k); band(26 * K.u, .9 * k);
    ctx.strokeStyle = `rgba(255,255,255,${.9 * k})`; ctx.lineWidth = 2 * K.u; ctx.beginPath(); ctx.moveTo(x + lean, 0); ctx.lineTo(x, H); ctx.stroke();
    ctx.restore();
  }

  // ⑤ 字幕：底部半透明胶囊，字按说话进度从暗到亮；cues = [{ a, b, text }]（秒，和画面同一条时间轴）
  function caption(ctx, K, t, cues) {
    const c = cues.find(c => t >= c.a - .12 && t < c.b + .12);
    if (!c) return;
    const u = K.u, al = smooth(c.a - .12, c.a + .05, t) * (1 - smooth(c.b - .05, c.b + .12, t));
    ctx.save(); ctx.font = F(K, 700, LAND ? 40 : 44);
    const maxW = W - (LAND ? 400 : 160) * u, lines = wrapCJK(ctx, c.text, maxW), lh = (LAND ? 58 : 64) * u;
    const tw = Math.max(...lines.map(l => ctx.measureText(l).width)), pw = tw + 96 * u, ph = lh * lines.length + 34 * u;
    const by = LAND ? H - 70 * u : H * .86, x0 = W / 2 - pw / 2, y0 = by - ph;
    ctx.globalAlpha = al;
    rr(ctx, x0, y0 + (1 - al) * 10 * u, pw, ph, 18 * u); ctx.fillStyle = 'rgba(8,8,14,.66)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5 * u; ctx.stroke();
    ctx.fillStyle = K.a(1); ctx.fillRect(x0 + 30 * u, y0 + ph / 2 - 12 * u, 4 * u, 24 * u);
    const total = [...c.text].length, k = clamp((t - c.a) / Math.max(.3, (c.b - c.a) * .8)) * total;
    let idx = 0;
    lines.forEach((l, j) => {
      let x = W / 2 - ctx.measureText(l).width / 2 + 10 * u; const y = y0 + 17 * u + lh * (j + .5) + 15 * u * (LAND ? 1 : 1.1);
      for (const ch of l) { ctx.fillStyle = idx < k ? K.ink : 'rgba(244,245,248,.38)'; ctx.fillText(ch, x, y); x += ctx.measureText(ch).width; idx++; }
    });
    ctx.restore();
  }

  return { theme, backdrop, glass, sweep, kicker, title, explain, data, transition, caption, pop };
})();
