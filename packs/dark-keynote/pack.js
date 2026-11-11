// 暗色科技发布会风格包（由 C-044 沉淀）：一个主题；45 种分镜（40 种整屏部件 + 5 种叠在别的镜头上的），
// 7 个层（背景、粒子、镜头、转场七种、节拍、角标、字幕；镜头和节拍在 demo/scene.js 里）。清单和调用方式见 README.md。
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
  let OFF2 = null;   // 转场画新画面用的第二张离屏画布（新画面自己可能还要用 OFF）
  const off2 = () => { OFF2 = OFF2 || mk(W, H); const o = OFF2.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); return o; };
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
    const u = K.u, n = o.bars.length, vmax = Math.max(...o.bars.map(b => b.v)), sg = o.every ?? K.beat;
    const cw = LAND ? (o.big ? W * .44 : W * .82) : W - 180 * u, ch = LAND ? 640 * u : 600 * u;
    const ce = pop(t, .7), cx = LAND ? W * .08 : 90 * u, cy = (LAND ? (H - ch) / 2 + 20 * u : H * .45) + (1 - ce) * 80 * u;
    if (ce > 0) {
      ctx.save(); ctx.globalAlpha = ce; glass(ctx, K, cx, cy, cw, ch); ctx.clip();
      chrome(ctx, K, cx, cy, null);
      ctx.fillStyle = K.ink; ctx.font = F(K, 700, 34); ctx.fillText(o.title, cx + 40 * u, cy + 120 * u);
      const bx = cx + 60 * u, bw = cw - 120 * u, base = cy + ch - 90 * u, top = cy + 190 * u, slot = bw / n, w = Math.min(130 * u, slot * .52);
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      for (let k = 0; k <= 3; k++) ctx.fillRect(bx, lerp(base, top, k / 3), bw, 1.5 * u);
      o.bars.forEach((b, i) => {
        const e = eOutCubic(inv(.35 + i * sg, .35 + i * sg + .7, t)), h = (base - top) * b.v / vmax * e;
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
    if (!o.big) { if (o.kicker) kicker(ctx, K, o.kicker, cx + 46 * u, cy - 40 * u, ce); return; }
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

  // ———— 以下是完整演示片用的部件：上面五个照旧，15 秒切换片段只用它们 ————
  // 公共版式：段标题在左上（竖屏同样在上），主体在下面的内容框里；字幕区（横屏底边上方 70，竖屏 86% 处）留空
  const MONO = K => `${K.mono}, ${K.head}`;            // 等宽字体里遇到中文回落到正文字体
  const box = K => LAND ? { x: W * .09, y: H * .30, w: W * .82, h: H * .52 } : { x: 90 * K.u, y: H * .25, w: W - 180 * K.u, h: H * .52 };
  function head(ctx, K, t, o) {
    if (!o.title) return;
    const u = K.u, x = LAND ? W * .09 : 90 * u, y = LAND ? H * .15 : H * .12, e = pop(t, .6);
    if (o.kicker) kicker(ctx, K, o.kicker, x + 46 * u, y, e);
    ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 64 : 72);
    ctx.fillText(o.title, x + (1 - e) * -40 * u, y + 82 * u); ctx.restore();
  }
  // 标志：圆角方块填强调色渐变，里面三条长短不同的横条；p 是入场进度 0–1
  function logo(ctx, K, x, y, s, p = 1) {
    if (p <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(lerp(.8, 1, p), lerp(.8, 1, p)); ctx.globalAlpha *= clamp(p * 1.5);
    rr(ctx, -s / 2, -s / 2, s, s, s * .25);
    const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, K.hi); g.addColorStop(1, K.a(1));
    ctx.fillStyle = g; ctx.fill(); ctx.fillStyle = K.bg0;
    [[.62, -.2], [.44, 0], [.26, .2]].forEach(([l, yy]) => { rr(ctx, -s * .31, yy * s - s * .058, s * l, s * .117, s * .058); ctx.fill(); });
    ctx.restore();
  }
  const count = (v, digits = 0, sep = false) => { const s = v.toFixed(digits); return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s; };
  // 大号渐变数字（白到强调亮色，带辉光），大数字、对比、片尾共用
  function glowNum(ctx, K, txt, x, y, px, al = 1, align = 'center') {
    const u = K.u, g = ctx.createLinearGradient(0, y - px * .75 * u, 0, y); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, K.hi);
    ctx.save(); ctx.globalAlpha = al; ctx.textAlign = align; ctx.font = F(K, 400, px, K.num);
    ctx.shadowColor = K.a(.85); ctx.shadowBlur = 60 * u; ctx.fillStyle = g; ctx.fillText(txt, x, y); ctx.shadowBlur = 0; ctx.fillText(txt, x, y);
    ctx.restore();
  }

  // ⑥ 章节卡：巨大的章号先描边再填满，章名吸附上来，下面一排小格子标出第几章
  // o = { n, of, title, en }
  function chapter(ctx, K, t, o) {
    const u = K.u, cx = W / 2, ny = H * (LAND ? .50 : .44), px = LAND ? 360 : 380;
    const pulse = smooth(0, .4, t) * (1 - .5 * smooth(.6, 1.8, t));
    const gl = ctx.createRadialGradient(cx, ny - px * .35 * u, 0, cx, ny - px * .35 * u, 520 * u); gl.addColorStop(0, K.a(.35 * pulse)); gl.addColorStop(1, K.a(0));
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    kicker(ctx, K, `CHAPTER ${String(o.n).padStart(2, '0')} / ${String(o.of).padStart(2, '0')}`, cx, ny - px * .86 * u, smooth(.1, .45, t), 'center');
    const num = String(o.n).padStart(2, '0'), d = inv(.05, .75, t);
    ctx.save(); ctx.font = F(K, 400, px, K.num); ctx.textAlign = 'center';
    const L = 2400 * u; ctx.setLineDash([L, L]); ctx.lineDashOffset = L * (1 - d);
    ctx.strokeStyle = K.a(1); ctx.lineWidth = 3 * u; ctx.strokeText(num, cx, ny); ctx.setLineDash([]);
    ctx.restore();
    glowNum(ctx, K, num, cx, ny, px, smooth(.55, 1.0, t));
    const e = pop(t - .5, .6);
    ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'center'; ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 92 : 100);
    ctx.fillText(o.title, cx, ny + 130 * u + (1 - e) * 40 * u);
    if (o.en) { ctx.globalAlpha = e * .9; ctx.fillStyle = K.muted; ctx.font = F(K, 700, 24, MONO(K)); ctx.fillText(o.en, cx, ny + 190 * u); }
    ctx.restore();
    const n = o.of, gw = 54 * u, gap = 14 * u, x0 = cx - (n * gw + (n - 1) * gap) / 2, gy = ny + 240 * u;
    for (let i = 0; i < n; i++) {
      const k = pop(t - .7 - i * .06, .4); if (k <= 0) continue;
      ctx.fillStyle = i + 1 === o.n ? K.a(k) : i + 1 < o.n ? `rgba(255,255,255,${.5 * k})` : `rgba(255,255,255,${.12 * k})`;
      ctx.fillRect(x0 + i * (gw + gap), gy, gw * k, 5 * u);
    }
  }

  // ⑦ 代码演示：玻璃编辑器里逐字打出代码，光标是强调色；返回每行的位置，给标注用
  // o = { kicker, title, sub, label, lines: [..], start = .5, cps = 26 }
  function code(ctx, K, t, o) {
    const u = K.u, st = o.start ?? .5, cps = o.cps || 26, n = o.lines.length, lh = (LAND ? 64 : 66) * u, fs = LAND ? 28 : 30;
    const hx = LAND ? W * .09 : 90 * u, hy = LAND ? H * .36 : H * .13, he = pop(t, .6);
    kicker(ctx, K, o.kicker, hx + 46 * u, hy, he);
    ctx.save(); ctx.globalAlpha = he; ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 76 : 80);
    const tl = LAND ? wrapCJK(ctx, o.title, W * .28) : [o.title];
    tl.forEach((l, i) => ctx.fillText(l, hx, hy + (88 + i * 96) * u + (1 - he) * 30 * u));
    if (o.sub) { ctx.fillStyle = K.muted; ctx.font = F(K, 700, 36); (LAND ? wrapCJK(ctx, o.sub, W * .28) : [o.sub]).forEach((l, i) => ctx.fillText(l, hx, hy + (88 + tl.length * 96 + 30 + i * 52) * u)); }
    ctx.restore();
    const cw = LAND ? W * .53 : W - 180 * u, ch = 110 * u + lh * n + 40 * u, ce = pop(t - .15, .7);
    const cx = LAND ? W * .39 : 90 * u, cy = (LAND ? (H - ch) / 2 - 20 * u : H * .30) + (1 - ce) * 80 * u;
    const rows = o.lines.map((_, i) => ({ x: cx + 96 * u, y: cy + 110 * u + i * lh - lh * .62, w: 0, h: lh * .9 }));
    if (ce <= 0) return rows;
    ctx.save(); ctx.globalAlpha = ce; glass(ctx, K, cx, cy, cw, ch); ctx.clip();
    chrome(ctx, K, cx, cy, null);
    if (o.label) { ctx.fillStyle = K.muted; ctx.font = F(K, 700, 20, MONO(K)); ctx.textAlign = 'right'; ctx.fillText(o.label, cx + cw - 32 * u, cy + 43 * u); ctx.textAlign = 'left'; }
    ctx.fillStyle = K.faint; ctx.fillRect(cx, cy + 72 * u, cw, 1.5 * u);
    const KW = /^(const|let|return|function|scene|draw|render|import|from|await)$/;
    let left = Math.max(0, (t - st) * cps), cur = null;
    ctx.font = F(K, 700, fs, MONO(K));
    o.lines.forEach((line, i) => {
      const y = cy + 110 * u + i * lh, x0 = cx + 96 * u;
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.textAlign = 'right'; ctx.fillText(String(i + 1), cx + 62 * u, y); ctx.textAlign = 'left';
      const show = Math.min(line.length, Math.floor(left)); left -= line.length + 4;   // 每行之间停 4 个字的时间
      const toks = line.match(/\/\/.*$|'[^']*'?|\w+|\s+|./g) || [];
      let x = x0, k = 0;
      for (const tk of toks) {
        if (k >= show) break;
        const part = tk.slice(0, show - k); k += tk.length;
        ctx.fillStyle = tk.startsWith('//') ? 'rgba(255,255,255,.4)' : tk.startsWith("'") ? K.hi : KW.test(tk) ? K.ink : 'rgba(244,245,248,.72)';
        ctx.fillText(part, x, y); x += ctx.measureText(part).width;
      }
      rows[i].w = ctx.measureText(line).width;
      if (show > 0 && show <= line.length && (show < line.length || left < 0 || i === n - 1)) cur = [x, y];
    });
    if (cur) {   // 光标：打字时常亮，停下后按拍闪
      const typing = left < 0, on = typing || Math.floor(t / K.beat) % 2 === 0;
      if (on) { ctx.fillStyle = K.a(1); ctx.fillRect(cur[0] + 3 * u, cur[1] - fs * .8 * u, 14 * u, fs * 1.0 * u); }
    }
    sweep(ctx, cx, cy, cw, ch, inv(.3, 1.1, t), .2);
    ctx.restore();
    return rows;
  }

  // ⑧ 标注：在画面上一块区域外描一个强调色圆角框，再拉出一条引线和标签
  // o = { x, y, w, h, label, side: 'right' | 'bottom' | 'top', dx = 0 }（区域用屏幕坐标，常用上一个部件返回的位置）
  function callout(ctx, K, t, o) {
    if (t < 0) return;
    const u = K.u, pd = 14 * u, x = o.x - pd, y = o.y - pd, w = o.w + pd * 2, h = o.h + pd * 2, d = eOutCubic(inv(0, .5, t));
    ctx.save();
    rr(ctx, x, y, w, h, 14 * u); const L = 2 * (w + h);
    ctx.setLineDash([L * d, L]); ctx.strokeStyle = K.a(1); ctx.lineWidth = 3 * u; ctx.shadowColor = K.a(.8); ctx.shadowBlur = 18 * u; ctx.stroke();
    ctx.setLineDash([]); ctx.shadowBlur = 0;
    const side = o.side || 'right', down = side === 'bottom', ln = 70 * u * eOutCubic(inv(.4, .7, t));
    const ax = side === 'right' ? x + w : x + w * .25 + (o.dx || 0), ay = side === 'right' ? y + h / 2 : down ? y + h : y;
    ctx.fillStyle = K.a(1);
    if (side === 'right') ctx.fillRect(ax, ay - 1.5 * u, ln * .6, 3 * u); else ctx.fillRect(ax - 1.5 * u, down ? ay : ay - ln, 3 * u, ln);
    const e = pop(t - .6, .5);
    if (e > 0 && side === 'right') {
      ctx.font = F(K, 700, 30); const pw = ctx.measureText(o.label).width + 48 * u, ph = 58 * u, px = ax + 42 * u + (1 - e) * -12 * u;
      ctx.globalAlpha = e; rr(ctx, px, ay - ph / 2, pw * lerp(.6, 1, e), ph, ph / 2); ctx.fillStyle = K.a(1); ctx.fill();
      ctx.fillStyle = K.bg0; ctx.fillText(o.label, px + 24 * u, ay + 11 * u);
    } else if (e > 0) {
      ctx.font = F(K, 700, 30); const tw = ctx.measureText(o.label).width, pw = tw + 48 * u, ph = 58 * u;
      const py = down ? ay + 70 * u : ay - 70 * u - ph;
      ctx.globalAlpha = e; rr(ctx, ax - 24 * u, py + (1 - e) * (down ? -12 : 12) * u, pw * lerp(.6, 1, e), ph, ph / 2); ctx.fillStyle = K.a(1); ctx.fill();
      ctx.fillStyle = K.bg0; ctx.fillText(o.label, ax, py + ph / 2 + 11 * u + (1 - e) * (down ? -12 : 12) * u);
    }
    ctx.restore();
  }

  // ⑩ 折线图：线从左往右画出来，下面一层强调色渐变，最后一个点放大加数值
  // o = { kicker, title, labels: [..], values: [..], unit, digits, start = .4, secs = 1.8 }
  function line(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), ce = pop(t - .1, .7); if (ce <= 0) return;
    const y0 = b.y + (1 - ce) * 80 * u, n = o.values.length, vmax = Math.max(...o.values) * 1.15;
    ctx.save(); ctx.globalAlpha = ce; glass(ctx, K, b.x, y0, b.w, b.h); ctx.clip();
    const lx = b.x + 110 * u, rx = b.x + b.w - (LAND ? 220 : 70) * u, top = y0 + 60 * u, base = y0 + b.h - 80 * u;
    ctx.font = F(K, 700, 20, MONO(K)); ctx.fillStyle = K.muted; ctx.textAlign = 'right';
    for (let k = 0; k <= 4; k++) {
      const yy = lerp(base, top, k / 4); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(lx, yy, rx - lx, 1.5 * u);
      ctx.fillStyle = K.muted; ctx.fillText((vmax * k / 4).toFixed(0), lx - 18 * u, yy + 7 * u);
    }
    ctx.textAlign = 'center';
    const pts = o.values.map((v, i) => [lerp(lx, rx, i / (n - 1)), lerp(base, top, v / vmax)]);
    o.labels.forEach((l, i) => ctx.fillText(l, pts[i][0], base + 44 * u));
    ctx.textAlign = 'left';
    const st = o.start ?? .4, p = eInOutCubic(inv(st, st + (o.secs || 1.8), t)), xe = lerp(lx, rx, p);
    ctx.save(); ctx.beginPath(); ctx.rect(b.x, y0, xe - b.x, b.h); ctx.clip();
    const ag = ctx.createLinearGradient(0, top, 0, base); ag.addColorStop(0, K.a(.28)); ag.addColorStop(1, K.a(0));
    ctx.beginPath(); ctx.moveTo(pts[0][0], base); pts.forEach(q => ctx.lineTo(q[0], q[1])); ctx.lineTo(pts[n - 1][0], base); ctx.closePath(); ctx.fillStyle = ag; ctx.fill();
    ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
    ctx.strokeStyle = K.a(1); ctx.lineWidth = 5 * u; ctx.lineJoin = 'round'; ctx.shadowColor = K.a(.7); ctx.shadowBlur = 24 * u; ctx.stroke(); ctx.shadowBlur = 0;
    pts.slice(0, -1).forEach(q => { ctx.fillStyle = K.bg0; ctx.beginPath(); ctx.arc(q[0], q[1], 8 * u, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3 * u; ctx.stroke(); });
    ctx.restore();
    // 线头：跟着画线的位置走的亮点；画完后在最后一个点上放数值
    const seg = Math.min(n - 2, Math.floor(p * (n - 1))), f = p * (n - 1) - seg, hx = lerp(pts[seg][0], pts[seg + 1][0], f), hy = lerp(pts[seg][1], pts[seg + 1][1], f);
    if (p > 0) { ctx.fillStyle = K.hi; ctx.shadowColor = K.a(1); ctx.shadowBlur = 30 * u; ctx.beginPath(); ctx.arc(hx, hy, 12 * u, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; }
    const e = pop(t - st - (o.secs || 1.8), .6);
    if (e > 0) {
      const v = o.values[n - 1] * eOutExpo(inv(st + (o.secs || 1.8) - .3, st + (o.secs || 1.8) + .5, t));
      const [qx, qy] = pts[n - 1];
      ctx.globalAlpha = ce * e; ctx.fillStyle = K.ink; ctx.font = F(K, 400, 84, K.num); ctx.textAlign = LAND ? 'left' : 'right';
      ctx.fillText(count(v, o.digits ?? 1) + (o.unit || ''), qx + (LAND ? 30 : -24) * u, qy + (LAND ? 26 : 90) * u);
      ctx.textAlign = 'left';
    }
    ctx.restore();
  }

  // ⑪ 占比环：几段弧依次长出来，第一项用强调色、其余用白的深浅；中间数第一项的百分比，旁边（竖屏在下）是图例
  // o = { kicker, title, items: [{ label, v }], start = .3 }
  function ring(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), st = o.start ?? .3, ev = o.every ?? .45, tot = o.items.reduce((s, i) => s + i.v, 0);
    const r = (LAND ? 210 : 230) * u, cx = LAND ? b.x + b.w * .25 : W / 2, cy = LAND ? b.y + b.h / 2 : b.y + r + 30 * u, lw = 46 * u;
    const ce = pop(t - .1, .6); if (ce <= 0) return;
    ctx.save(); ctx.globalAlpha = ce;
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    let a0 = -Math.PI / 2;
    const col = i => i === 0 ? K.a(1) : `rgba(255,255,255,${[.55, .3, .16, .1][(i - 1) % 4]})`;
    o.items.forEach((it, i) => {
      const span = TAU * it.v / tot, e = eOutCubic(inv(st + i * ev, st + i * ev + .7, t));
      if (e > 0) {
        ctx.save(); if (i === 0) { ctx.shadowColor = K.a(.8); ctx.shadowBlur = 30 * u; }
        ctx.strokeStyle = col(i); ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cx, cy, r, a0 + .02, a0 + Math.max(.02, span * e) - .02); ctx.stroke(); ctx.restore();
      }
      a0 += span;
      // 图例
      const lx = LAND ? b.x + b.w * .55 : b.x + 20 * u, ly = LAND ? b.y + b.h / 2 - (o.items.length - 1) * 70 * u + i * 140 * u : cy + r + 120 * u + i * 104 * u, le = pop(t - st - i * ev - .2, .5);
      if (le <= 0) return;
      ctx.save(); ctx.globalAlpha = ce * le;
      ctx.fillStyle = col(i); rr(ctx, lx, ly - 22 * u, 44 * u, 44 * u, 10 * u); ctx.fill();
      ctx.fillStyle = i === 0 ? K.ink : K.muted; ctx.font = F(K, 700, LAND ? 46 : 44); ctx.fillText(it.label, lx + 76 * u + (1 - le) * 30 * u, ly + 16 * u);
      ctx.font = F(K, 400, LAND ? 76 : 68, K.num); ctx.textAlign = 'right'; ctx.fillStyle = i === 0 ? K.ink : K.muted;
      ctx.fillText(count(it.v * eOutCubic(inv(0, .8, t - st - i * ev)), 0) + '%', LAND ? b.x + b.w - 40 * u : b.x + b.w - 20 * u, ly + 26 * u); ctx.textAlign = 'left';
      ctx.restore();
    });
    const f = o.items[0], e0 = eOutExpo(inv(st, st + 1.2, t));
    ctx.textAlign = 'center'; ctx.fillStyle = K.ink; ctx.font = F(K, 400, 150, K.num); ctx.fillText(count(f.v * e0, 0) + '%', cx, cy + 40 * u);
    ctx.fillStyle = K.muted; ctx.font = F(K, 700, 28); ctx.fillText(f.label, cx, cy + 90 * u); ctx.textAlign = 'left';
    ctx.restore();
  }

  // ⑫ 对比：A、B 两张卡片（横屏左右，竖屏上下），数字各自数上来，下面的条按数值比例；B 是要突出的一边，用强调色
  // o = { kicker, title, a: { tag, name, value, unit, note, bar }, b: {..}, vs = 'VS' }（bar 是 0–1 的条长）
  function compare(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), gap = (LAND ? 120 : 70) * u, st = o.start ?? .15, lag = o.lag ?? .9;
    const cw = LAND ? (b.w - gap) / 2 : b.w, ch = LAND ? b.h : (b.h - gap) / 2;
    [o.a, o.b].forEach((it, i) => {
      const e = pop(t - st - i * lag, .7); if (e <= 0) return;
      const x = LAND ? b.x + i * (cw + gap) : b.x, y = (LAND ? b.y : b.y + i * (ch + gap)) + (1 - e) * 70 * u, hot = i === 1;
      ctx.save(); ctx.globalAlpha = e; glass(ctx, K, x, y, cw, ch);
      if (hot) { ctx.save(); ctx.shadowColor = K.a(.6); ctx.shadowBlur = 50 * u; rr(ctx, x, y, cw, ch, 28 * u); ctx.strokeStyle = K.a(.9); ctx.lineWidth = 2.5 * u; ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = hot ? K.a(1) : K.muted; ctx.font = F(K, 700, 22, MONO(K)); if ('letterSpacing' in ctx) ctx.letterSpacing = `${3 * u}px`;
      ctx.fillText(it.tag, x + 44 * u, y + 60 * u); if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 52 : 46); ctx.fillText(it.name, x + 44 * u, y + (LAND ? 130 : 118) * u);
      const v = it.value * eOutExpo(inv(.3, 1.3, t - st - i * lag)), vy = y + (LAND ? 330 : 238) * u, px = LAND ? 200 : 150;
      ctx.font = F(K, 400, px, K.num); const vs = count(v, it.digits ?? 0), vw = ctx.measureText(vs).width;
      if (hot) glowNum(ctx, K, vs, x + 44 * u, vy, px, 1, 'left'); else { ctx.fillStyle = 'rgba(244,245,248,.82)'; ctx.fillText(vs, x + 44 * u, vy); }
      ctx.fillStyle = hot ? K.ink : K.muted; ctx.font = F(K, 700, LAND ? 44 : 40); ctx.fillText(it.unit, x + 64 * u + vw, vy);
      const bw = (cw - 88 * u) * (it.bar ?? 1) * eOutCubic(inv(.4, 1.3, t - st - i * lag)), byy = vy + (LAND ? 50 : 34) * u;
      ctx.fillStyle = 'rgba(255,255,255,.07)'; rr(ctx, x + 44 * u, byy, cw - 88 * u, 12 * u, 6 * u); ctx.fill();
      ctx.fillStyle = hot ? K.a(1) : 'rgba(255,255,255,.45)'; rr(ctx, x + 44 * u, byy, Math.max(12 * u, bw), 12 * u, 6 * u); ctx.fill();
      if (it.note) { ctx.fillStyle = K.muted; ctx.font = F(K, 700, LAND ? 32 : 30); ctx.fillText(it.note, x + 44 * u, byy + (LAND ? 84 : 66) * u); }
      ctx.restore();
    });
    const ve = pop(t - st - lag * .72, .5); if (ve <= 0) return;
    const vx = LAND ? b.x + cw + gap / 2 : b.x + b.w / 2, vy = LAND ? b.y + b.h / 2 : b.y + ch + gap / 2;
    ctx.save(); ctx.globalAlpha = ve; ctx.fillStyle = K.bg0; ctx.beginPath(); ctx.arc(vx, vy, 44 * u * lerp(.6, 1, ve), 0, TAU); ctx.fill();
    ctx.strokeStyle = K.faint; ctx.lineWidth = 2 * u; ctx.stroke();
    ctx.fillStyle = K.ink; ctx.font = F(K, 700, 26, MONO(K)); ctx.textAlign = 'center'; ctx.fillText(o.vs || 'VS', vx, vy + 9 * u); ctx.restore();
  }

  // ⑬ 大数字：一个数字从 from 数到 to（可加千分位），下面一句说明
  // o = { kicker, from, to, digits, sep, prefix, suffix, label, sub, start = .3 }
  function bigNumber(ctx, K, t, o) {
    const u = K.u, st = o.start ?? .3, sc = (o.secs || 1.4) / 1.4, p = inv(st, st + 1.4 * sc, t), cx = W / 2, ny = H * (LAND ? .58 : .50), px = LAND ? 380 : 330;
    const pulse = smooth(st + 1.0 * sc, st + 1.4 * sc, t) * (1 - smooth(st + 1.4 * sc, st + 2.6 * sc, t));
    const gl = ctx.createRadialGradient(cx, ny - px * .35 * u, 0, cx, ny - px * .35 * u, 700 * u); gl.addColorStop(0, K.a(.3 * pulse)); gl.addColorStop(1, K.a(0));
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    if (o.kicker) kicker(ctx, K, o.kicker, cx, ny - px * .9 * u, smooth(0, .4, t), 'center');
    if (p <= 0) return;
    const v = lerp(o.from || 0, o.to, eOutExpo(p)), txt = (o.prefix || '') + count(v, o.digits ?? 0, o.sep) + (o.suffix || '');
    ctx.font = F(K, 400, px, K.num); const fin = (o.prefix || '') + count(o.to, o.digits ?? 0, o.sep) + (o.suffix || '');
    const fit = Math.min(1, W * .86 / ctx.measureText(fin).width);          // 太宽（竖屏、位数多）就按终值整体缩小
    ctx.save(); ctx.translate(cx, ny); const s = fit * lerp(1.25, 1, eOutExpo(inv(0, .5, p))); ctx.scale(s, s);
    glowNum(ctx, K, txt, 0, 0, px, smooth(0, .2, p)); ctx.restore();
    const e = pop(t - st - 1.0 * sc, .6);
    ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'center'; ctx.fillStyle = K.ink; ctx.font = F(K, 700, LAND ? 50 : 52);
    ctx.fillText(o.label, cx, ny + 100 * u + (1 - e) * 24 * u);
    if (o.sub) { ctx.fillStyle = K.muted; ctx.font = F(K, 700, 22, MONO(K)); ctx.fillText(o.sub, cx, ny + 160 * u); }
    const lw = 260 * u * pop(t - st - 1.2 * sc, .6); ctx.fillStyle = K.a(1); ctx.fillRect(cx - lw / 2, ny + 30 * u, lw, 4 * u);
    ctx.restore();
  }

  // ⑭ 引用：一对强调色引号，金句一个字一个字亮起来，最后出处
  // o = { text, source, start = .4, cps = 9 }
  function quote(ctx, K, t, o) {
    const u = K.u, x = LAND ? W * .14 : 110 * u, w = LAND ? W * .72 : W - 220 * u, y = LAND ? H * .38 : H * .30;
    const qe = pop(t, .6);
    ctx.save(); ctx.globalAlpha = qe; ctx.fillStyle = K.a(1); ctx.font = F(K, 900, LAND ? 220 : 200);
    ctx.shadowColor = K.a(.7); ctx.shadowBlur = 40 * u; ctx.fillText('“', x - 20 * u, y + (1 - qe) * 40 * u); ctx.restore();
    ctx.save(); ctx.font = F(K, 900, LAND ? 76 : 70);
    const lines = wrapCJK(ctx, o.text, w), lh = (LAND ? 104 : 100) * u, st = o.start ?? .4, cps = o.cps || 9;
    let idx = 0;
    lines.forEach((l, j) => {
      let xx = x; const yy = y + 60 * u + j * lh;
      for (const c of l) {
        const e = clamp((t - st) * cps - idx, 0, 1); idx++;
        ctx.globalAlpha = .18 + .82 * e; ctx.fillStyle = K.ink; ctx.fillText(c, xx, yy); xx += ctx.measureText(c).width;
      }
    });
    const se = pop(t - st - idx / cps, .6);
    if (o.source && se > 0) {
      const sy = y + 60 * u + lines.length * lh + 10 * u;
      ctx.globalAlpha = se; ctx.fillStyle = K.a(1); ctx.fillRect(x, sy - 8 * u, 40 * u * se, 3 * u);
      ctx.fillStyle = K.muted; ctx.font = F(K, 700, 24, MONO(K)); ctx.fillText(o.source, x + 60 * u, sy);
    }
    ctx.restore();
  }

  // ⑮ 信息条（下三分之一）：强调色竖条先出，玻璃条向右展开，人名、身份依次吸附；放在字幕上方
  // o = { name, role, tag }
  function lower(ctx, K, t, o) {
    if (t < 0) return;
    const u = K.u, x = LAND ? W * .09 : 90 * u, y = LAND ? H - 300 * u : H * .70, h = 120 * u;
    ctx.save(); ctx.font = F(K, 900, 46); const nw = ctx.measureText(o.name).width; ctx.font = F(K, 700, 24, MONO(K));
    const w = Math.max(nw, ctx.measureText(o.role).width) + 90 * u, e = eOutExpo(inv(.15, .75, t));
    ctx.fillStyle = K.a(1); ctx.fillRect(x, y + h * (1 - eOutExpo(inv(0, .3, t))) / 2, 8 * u, h * eOutExpo(inv(0, .3, t)));
    if (e > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(x + 8 * u, y, w * e, h); ctx.clip();
      ctx.fillStyle = 'rgba(8,8,14,.72)'; ctx.fillRect(x + 8 * u, y, w, h);
      const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x + 8 * u, y, w, h);
      const ne = pop(t - .35, .5), re = pop(t - .5, .5);
      ctx.globalAlpha = ne; ctx.fillStyle = K.ink; ctx.font = F(K, 900, 46); ctx.fillText(o.name, x + 40 * u - (1 - ne) * 30 * u, y + 58 * u);
      ctx.globalAlpha = re; ctx.fillStyle = K.muted; ctx.font = F(K, 700, 24, MONO(K)); ctx.fillText(o.role, x + 40 * u - (1 - re) * 30 * u, y + 96 * u);
      ctx.restore();
    }
    if (o.tag) { const te = pop(t - .7, .5); ctx.globalAlpha = te; ctx.fillStyle = K.a(1); ctx.font = F(K, 700, 20, MONO(K)); ctx.fillText(o.tag, x + 8 * u, y - 18 * u); }
    ctx.restore();
  }

  // ⑰ 时间线：3–6 个节点按拍出现（横屏横排，竖屏竖排），线跟着长；now 那一个用强调色，之后的是虚的
  // o = { kicker, title, steps: [{ when, text }], now, start = .5, every = 2 拍 }
  function timeline(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), n = o.steps.length, st = o.start ?? .5, every = o.every || K.beat * 2;
    const at = i => LAND ? [lerp(b.x + 110 * u, b.x + b.w - 110 * u, i / (n - 1)), b.y + b.h * .48] : [b.x + 70 * u, lerp(b.y + 40 * u, b.y + b.h - 40 * u, i / (n - 1))];
    const prog = clamp((t - st) / every, 0, n - 1), [x0, y0] = at(0), [x1, y1] = at(n - 1);
    ctx.fillStyle = 'rgba(255,255,255,.1)'; LAND ? ctx.fillRect(x0, y0 - 2 * u, x1 - x0, 4 * u) : ctx.fillRect(x0 - 2 * u, y0, 4 * u, y1 - y0);
    const nowP = Math.min(prog, o.now ?? n - 1), [xa, ya] = at(0);
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    if (LAND) ctx.fillRect(xa, ya - 2 * u, (x1 - x0) * nowP / (n - 1), 4 * u); else ctx.fillRect(xa - 2 * u, ya, 4 * u, (y1 - y0) * nowP / (n - 1));
    if (prog > (o.now ?? n)) {   // now 之后：虚线
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3 * u; ctx.setLineDash([10 * u, 12 * u]); ctx.beginPath();
      const [xn, yn] = at(o.now), f = (prog - o.now) / (n - 1);
      if (LAND) { ctx.moveTo(xn, yn); ctx.lineTo(xn + (x1 - x0) * f, yn); } else { ctx.moveTo(xn, yn); ctx.lineTo(xn, yn + (y1 - y0) * f); }
      ctx.stroke(); ctx.restore();
    }
    o.steps.forEach((s, i) => {
      const e = pop(t - st - i * every, .5); if (e <= 0) return;
      const [x, y] = at(i), now = i === o.now, past = i < (o.now ?? n), r = (now ? 22 : 15) * u * lerp(.5, 1, e);
      ctx.save(); ctx.globalAlpha = e;
      if (now) { const k = .5 + .5 * Math.sin(t * 5); ctx.fillStyle = K.a(.25 * k); ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill(); ctx.shadowColor = K.a(1); ctx.shadowBlur = 26 * u; }
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
      if (now) { ctx.fillStyle = K.a(1); ctx.fill(); } else if (past) { ctx.fillStyle = K.ink; ctx.fill(); } else { ctx.fillStyle = K.bg0; ctx.fill(); ctx.setLineDash([5 * u, 5 * u]); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3 * u; ctx.stroke(); ctx.setLineDash([]); }
      ctx.shadowBlur = 0;
      const tx = LAND ? x : x + 64 * u, ta = LAND ? 'center' : 'left';
      ctx.textAlign = ta; ctx.fillStyle = now ? K.a(1) : past ? K.ink : K.muted; ctx.font = F(K, 400, LAND ? 76 : 60, K.num);
      ctx.fillText(s.when, tx, LAND ? y - 56 * u - (1 - e) * 20 * u : y - 4 * u);
      ctx.fillStyle = now ? K.ink : past ? 'rgba(244,245,248,.8)' : K.muted; ctx.font = F(K, 700, LAND ? 40 : 38);
      ctx.fillText(s.text, tx, LAND ? y + 84 * u + (1 - e) * 20 * u : y + 44 * u);
      if (now && o.nowLabel) { ctx.font = F(K, 700, 20, MONO(K)); ctx.fillStyle = K.a(1); ctx.fillText(o.nowLabel, tx, LAND ? y + 132 * u : y + 84 * u); }
      ctx.restore();
    });
  }

  // ⑱ 片尾：标志和产品名居中偏上，要点回顾一条条出，最后行动号召按钮（强调色）
  // o = { kicker, title, recap: [..], cta, foot }
  function outro(ctx, K, t, o) {
    const u = K.u, cx = W / 2, ly = H * (LAND ? .22 : .2), ev = o.every ?? K.beat * 2;
    const pulse = smooth(0, .5, t) * (1 - .4 * smooth(.6, 1.8, t));
    const gl = ctx.createRadialGradient(cx, ly, 0, cx, ly, 460 * u); gl.addColorStop(0, K.a(.4 * pulse)); gl.addColorStop(1, K.a(0));
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    logo(ctx, K, cx, ly, 100 * u, pop(t, .6));
    if (o.kicker) kicker(ctx, K, o.kicker, cx, ly + 110 * u, smooth(.3, .7, t), 'center');
    const te = pop(t - .3, .6);
    ctx.save(); ctx.textAlign = 'center'; ctx.globalAlpha = te; ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 120 : 130);
    ctx.fillText(o.title, cx, ly + (LAND ? 240 : 250) * u + (1 - te) * 40 * u); ctx.restore();
    // 要点回顾：横屏一行三格，竖屏一列
    const n = o.recap.length, ry = ly + (LAND ? 330 : 360) * u, rw = LAND ? Math.min(460 * u, (W * .82 - (n - 1) * 30 * u) / n) : W - 180 * u, rh = 96 * u;
    o.recap.forEach((s, i) => {
      const e = pop(t - .9 - i * ev, .5); if (e <= 0) return;
      const x = LAND ? cx - (n * rw + (n - 1) * 30 * u) / 2 + i * (rw + 30 * u) : 90 * u, y = LAND ? ry : ry + i * (rh + 22 * u);
      ctx.save(); ctx.globalAlpha = e; glass(ctx, K, x, y + (1 - e) * 30 * u, rw, rh, 20);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = F(K, 700, 22, MONO(K)); ctx.fillText(String(i + 1).padStart(2, '0'), x + 30 * u, y + rh / 2 + 8 * u + (1 - e) * 30 * u);
      ctx.fillStyle = K.ink; ctx.font = F(K, 700, 36); ctx.fillText(s, x + 84 * u, y + rh / 2 + 13 * u + (1 - e) * 30 * u);
      ctx.restore();
    });
    const ce = pop(t - .9 - n * ev - .2, .6); if (ce <= 0) return;
    ctx.save(); ctx.font = F(K, 900, 44); const bw = ctx.measureText(o.cta).width + 120 * u, bh = 96 * u;
    const by = LAND ? ry + rh + 60 * u : ry + n * (rh + 22 * u) + 50 * u;
    ctx.globalAlpha = ce; ctx.translate(cx, by + bh / 2); ctx.scale(lerp(.85, 1, ce), lerp(.85, 1, ce));
    ctx.shadowColor = K.a(.9); ctx.shadowBlur = 50 * u; rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fillStyle = K.a(1); ctx.fill(); ctx.shadowBlur = 0;
    ctx.save(); rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.clip(); sweep(ctx, -bw / 2, -bh / 2, bw, bh, inv(.4, 1.2, t - .9 - n * ev - .2), .5); ctx.restore();
    ctx.fillStyle = K.bg0; ctx.textAlign = 'center'; ctx.fillText(o.cta, 0, 16 * u);
    if (o.foot) { ctx.fillStyle = K.muted; ctx.font = F(K, 700, 22, MONO(K)); ctx.fillText(o.foot, 0, bh / 2 + 56 * u); }
    ctx.restore();
  }

  // ———— 演示片里的其余分镜：每种在演示片里只出现一次，节奏按 1.5–2.25 秒一个镜头写，start、every、secs 都能在分镜表里调 ————
  const rnd = (i, k = 0) => hash1(i * 131 + k * 7919 + 17);
  const center = (ctx, s, x, y) => { ctx.textAlign = 'center'; ctx.fillText(s, x, y); ctx.textAlign = 'left'; };
  const NUMF = K => `${K.num}, ${K.head}`;             // 数字字体里没有的字（¥、中文）回落到正文字体

  // 片中片：双设备、放大镜、卡片堆叠、大字透视里放的那支小片子（标志 → 三根柱子 → 4.2×），p 是播放进度 0–1
  function mini(ctx, K, px, py, pw, ph, p) {
    ctx.save(); rr(ctx, px, py, pw, ph, Math.min(pw, ph) * .05); ctx.fillStyle = K.bg0; ctx.fill(); ctx.clip();
    const g = ctx.createRadialGradient(px + pw / 2, py + ph * .4, 0, px + pw / 2, py + ph * .4, Math.max(pw, ph) * .6); g.addColorStop(0, K.a(.24)); g.addColorStop(1, K.a(0));
    ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
    const s = Math.min(pw, ph), q = p >= 1 ? 1 : (p * 3) % 1, sc = Math.min(2, Math.floor(p * 3));
    if (sc === 0) logo(ctx, K, px + pw / 2, py + ph / 2, s * .3, pop(q * 1.6, .5));
    else for (let i = 0; i < 3; i++) {
      const hh = ph * .5 * [.3, .55, 1][i] * eOutCubic(inv(i * .15, i * .15 + .4, q)), bw = pw * .1;
      ctx.fillStyle = i === 2 ? K.a(1) : 'rgba(255,255,255,.3)'; ctx.fillRect(px + pw * (.3 + i * .16), py + ph * .82 - hh, bw, hh);
    }
    if (sc === 2) glowNum(ctx, K, '4.2×', px + pw * .5, py + ph * .32, s * .26 / K.u, smooth(.2, .5, q));
    ctx.restore();
  }

  // 冷开：一团粒子从四面收拢成标志的轮廓，标志填满，一道横向光线闪过，品牌名的字距收紧
  // o = { brand, sub }
  function coldOpen(ctx, K, t, o) {
    const u = K.u, cx = W / 2, cy = H * (LAND ? .40 : .38), s = 170 * u, N = 200, p = eInOutCubic(inv(0, .85, t));
    const fl = smooth(.75, .9, t) * (1 - smooth(.95, 1.8, t));
    const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, 560 * u); gl.addColorStop(0, K.a(.08 + .4 * fl)); gl.addColorStop(1, K.a(0));
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    const pa = 1 - smooth(.8, 1.0, t);
    for (let i = 0; i < N && pa > 0; i++) {
      const a = rnd(i) * TAU, r0 = LONG * (.3 + .45 * rnd(i, 1)), q = i / N * 4, side = Math.floor(q), f = q - side, h = s / 2;
      const [tx, ty] = [[-h + f * s, -h], [h, -h + f * s], [h - f * s, h], [-h, h - f * s]][side];
      const sw = Math.sin(p * Math.PI) * 160 * u * (rnd(i, 2) - .5);
      const x = lerp(cx + Math.cos(a) * r0, cx + tx, p) - Math.sin(a) * sw, y = lerp(cy + Math.sin(a) * r0 * .7, cy + ty, p) + Math.cos(a) * sw, r = (1.6 + 2.6 * rnd(i, 3)) * u;
      ctx.fillStyle = i % 5 ? `rgba(255,255,255,${.8 * pa})` : K.a(pa); ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    logo(ctx, K, cx, cy, s, pop(t - .8, .45));
    if (fl > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createLinearGradient(0, 0, W, 0); lg.addColorStop(0, K.a(0)); lg.addColorStop(.5, `rgba(255,255,255,${.9 * fl})`); lg.addColorStop(1, K.a(0));
      ctx.fillStyle = lg; ctx.fillRect(0, cy - 2 * u, W, 4 * u);
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * .5); bg.addColorStop(0, K.a(.55 * fl)); bg.addColorStop(1, K.a(0));
      ctx.translate(cx, cy); ctx.scale(1, .07); ctx.fillStyle = bg; ctx.fillRect(-W / 2, -W / 2, W, W);
      ctx.restore();
    }
    const e = pop(t - .95, .7); if (e <= 0) return;
    ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 100 : 108); ctx.textAlign = 'center';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${lerp(70, 14, e) * u}px`;
    ctx.fillText(o.brand, cx, cy + s / 2 + 160 * u);
    if (o.sub) { ctx.globalAlpha = smooth(.3, 1, e); ctx.fillStyle = K.muted; ctx.font = F(K, 700, 24, MONO(K)); if ('letterSpacing' in ctx) ctx.letterSpacing = `${6 * u}px`; ctx.fillText(o.sub, cx, cy + s / 2 + 222 * u); }
    ctx.restore();
  }

  // 砸字标题：每个字从 2.6 倍大猛砸到原位，落地时画面一震、一圈冲击波；字母和数字用强调色
  // o = { text, sub, start = .05, every = .12 }
  function slam(ctx, K, t, o) {
    const u = K.u, st = o.start ?? .05, ev = o.every ?? .12, px = LAND ? 290 : 230, cy = H * (LAND ? .54 : .46), chars = [...o.text];
    ctx.font = F(K, 900, px); const ws = chars.map(c => ctx.measureText(c).width), tw = ws.reduce((a, b) => a + b, 0), my = cy - px * .36 * u;
    let shake = 0; chars.forEach((c, i) => { const l = t - st - i * ev - .16; if (l > 0 && c !== ' ') shake += Math.exp(-l * 16) * Math.sin(l * 80) * 14 * u; });
    ctx.save(); ctx.translate(shake, -shake * .6);
    let x = W / 2 - tw / 2;
    chars.forEach((c, i) => {
      const k = inv(st + i * ev, st + i * ev + .16, t), mx = x + ws[i] / 2; x += ws[i];
      if (k <= 0 || c === ' ') return;
      const l = t - st - i * ev - .16, hot = /[0-9A-Za-z]/.test(c);
      if (l > 0 && l < .45) { ctx.save(); ctx.strokeStyle = K.a(.6 * (1 - l / .45)); ctx.lineWidth = 6 * u * (1 - l / .45); ctx.beginPath(); ctx.arc(mx, my, 60 * u + l * 900 * u, 0, TAU); ctx.stroke(); ctx.restore(); }
      const sc = lerp(2.6, 1, k * k);
      ctx.save(); ctx.translate(mx, my); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 3); ctx.font = F(K, 900, px); ctx.textAlign = 'center';
      if (hot) { ctx.shadowColor = K.a(.9); ctx.shadowBlur = 50 * u; ctx.fillStyle = K.a(1); } else ctx.fillStyle = K.ink;
      ctx.fillText(c, 0, px * .36 * u); ctx.restore();
    });
    ctx.restore();
    const e = pop(t - st - chars.length * ev - .1, .5);
    if (o.sub && e > 0) { ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.muted; ctx.font = F(K, 700, LAND ? 48 : 44); center(ctx, o.sub, W / 2, cy + 120 * u + (1 - e) * 20 * u); ctx.restore(); }
  }

  // 关键词快闪：一拍一个词撑满画面，单数拍反白（整屏强调色、字是底色）
  // o = { words: [..], every = 1 拍, kicker }
  function flash(ctx, K, t, o) {
    if (t < 0) return;
    const u = K.u, ev = o.every || K.beat, n = o.words.length, i = clamp(Math.floor(t / ev), 0, n - 1), lt = t - i * ev, rev = i % 2 === 1;
    if (rev) { ctx.fillStyle = K.a(1); ctx.fillRect(-W, -H, W * 3, H * 3); }
    const w = o.words[i]; ctx.font = F(K, 900, LAND ? 240 : 190); const fit = Math.min(1, W * .84 / ctx.measureText(w).width), s = fit * lerp(1.14, 1, eOutCubic(lt / ev));
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = rev ? K.bg0 : K.ink; if (!rev) { ctx.shadowColor = K.a(.7); ctx.shadowBlur = 40 * u; }
    ctx.fillText(w, 0, 0); ctx.restore();
    const m = LAND ? 90 * u : 80 * u; ctx.save(); ctx.font = F(K, 700, 24, MONO(K)); ctx.fillStyle = rev ? 'rgba(5,5,10,.7)' : K.muted;
    ctx.fillText(`${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`, m, m + 20 * u);
    if (o.kicker) { ctx.textAlign = 'right'; ctx.fillText(o.kicker, W - m, m + 20 * u); }
    ctx.fillStyle = rev ? K.bg0 : K.a(1); ctx.fillRect(m, m + 44 * u, (W - 2 * m) * (i + clamp(lt / ev)) / n, 4 * u);
    ctx.restore();
  }

  // 跑马灯：三行巨大的字斜着横穿画面，相邻两行反向；中间一行实心强调色，上下两行只描边
  // o = { rows: [..], speed = 700 }
  function marquee(ctx, K, t, o) {
    const u = K.u, sp = (o.speed || 700) * u, px = LAND ? 200 : 170, lh = px * 1.15 * u, n = o.rows.length;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.1); ctx.font = F(K, 900, px); ctx.textBaseline = 'middle';
    o.rows.forEach((r, i) => {
      const e = pop(t - i * .06, .4); if (e <= 0) return;
      const txt = r + '   ·   ', tw = ctx.measureText(txt).width, dir = i % 2 ? 1 : -1, y = (i - (n - 1) / 2) * lh, hot = i === (n - 1) / 2;
      const off_ = dir * (t * sp + (1 - e) * 500 * u);
      ctx.globalAlpha = e;
      for (let x = -LONG + (((off_ % tw) + tw) % tw) - tw; x < LONG; x += tw) {
        if (hot) { ctx.fillStyle = K.a(1); ctx.shadowColor = K.a(.7); ctx.shadowBlur = 40 * u; ctx.fillText(txt, x, y); ctx.shadowBlur = 0; }
        else { ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2.5 * u; ctx.strokeText(txt, x, y); }
      }
    });
    ctx.restore();
  }

  // 搜索框：一条大输入框，提示词逐字打进去，下面弹出几个联想标签；返回「生成」按钮的位置，给光标点击用
  // o = { kicker, title, query, button = '生成', chips: [..], start = .2, cps = 18 }
  function search(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, st = o.start ?? .2, cps = o.cps || 18, Q = [...o.query], w = LAND ? W * .66 : W - 160 * u, h = 124 * u, x = (W - w) / 2;
    const e = pop(t, .5), y = H * (LAND ? .46 : .40) + (1 - e) * 60 * u;
    ctx.font = F(K, 900, 34); const bw = ctx.measureText(o.button || '生成').width + 84 * u, bh = h - 28 * u, bx = x + w - bw - 14 * u, by = y + 14 * u, R = { x: bx, y: by, w: bw, h: bh };
    if (e <= 0) return R;
    ctx.save(); ctx.globalAlpha = e;
    ctx.shadowColor = K.a(.4); ctx.shadowBlur = 70 * u; rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = 'rgba(16,16,26,.92)'; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = K.a(.75); ctx.lineWidth = 2.5 * u; ctx.stroke();
    ctx.strokeStyle = K.muted; ctx.lineWidth = 4 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x + 62 * u, y + h / 2 - 4 * u, 16 * u, 0, TAU); ctx.moveTo(x + 74 * u, y + h / 2 + 8 * u); ctx.lineTo(x + 86 * u, y + h / 2 + 20 * u); ctx.stroke();
    const n = Math.floor(clamp((t - st) * cps, 0, Q.length)), s = Q.slice(0, n).join('');
    ctx.font = F(K, 700, LAND ? 44 : 38); ctx.fillStyle = K.ink; ctx.fillText(s, x + 112 * u, y + h / 2 + 15 * u);
    if (n < Q.length || Math.floor(t / .25) % 2 === 0) { ctx.fillStyle = K.a(1); ctx.fillRect(x + 116 * u + ctx.measureText(s).width, y + h / 2 - 24 * u, 4 * u, 48 * u); }
    rr(ctx, bx, by, bw, bh, bh / 2); ctx.fillStyle = K.a(1); ctx.fill();
    ctx.fillStyle = K.bg0; ctx.font = F(K, 900, 34); center(ctx, o.button || '生成', bx + bw / 2, by + bh / 2 + 12 * u);
    const done = st + Q.length / cps; let cx = x + 40 * u;
    (o.chips || []).forEach((c, i) => {
      const k = pop(t - done - i * .08, .35); ctx.font = F(K, 700, 26, MONO(K)); const cw = ctx.measureText(c).width + 48 * u, yy = y + h + 36 * u + (1 - k) * 20 * u;
      if (k > 0) {
        ctx.globalAlpha = e * k; rr(ctx, cx, yy, cw, 54 * u, 27 * u); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fill(); ctx.strokeStyle = K.faint; ctx.lineWidth = 1.5 * u; ctx.stroke();
        ctx.fillStyle = K.muted; ctx.fillText(c, cx + 24 * u, yy + 36 * u);
      }
      cx += cw + 18 * u;
    });
    ctx.restore();
    return R;
  }

  // 光标点击（叠加）：鼠标指针从右下滑到目标中间，按下时一缩、目标闪一下、一圈波纹散开
  // o = { x, y, w, h, click = .45 }（目标区域，常用宿主返回的位置）
  function cursor(ctx, K, t, o) {
    if (t < 0) return;
    const u = K.u, ck = o.click ?? .45, tx = o.x + o.w * .55, ty = o.y + o.h * .62, m = eInOutCubic(inv(0, ck - .05, t)), l = t - ck;
    const x = lerp(tx + 320 * u, tx, m), y = lerp(ty + 240 * u, ty, m), dn = l >= 0 && l < .12;
    ctx.save();
    if (l > 0) {
      const f = clamp(l / .5); ctx.strokeStyle = K.a(.8 * (1 - f)); ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.arc(tx, ty, 20 * u + f * 150 * u, 0, TAU); ctx.stroke();
      ctx.globalAlpha = .5 * (1 - clamp(l / .25)); rr(ctx, o.x, o.y, o.w, o.h, o.h / 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.translate(x, y); const s = (dn ? .85 : 1) * 1.7 * u; ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.lineTo(8, 23); ctx.lineTo(13, 34); ctx.lineTo(18, 32); ctx.lineTo(13, 21); ctx.lineTo(23, 21); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#05050A'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  // 聊天对话：我（右，强调色气泡）和 AI（左，玻璃气泡，先冒三个跳动的点）一来一回
  // o = { kicker, title, msgs: [{ who: 'me' | 'ai', text }], start = .15, every = .55 }
  function chat(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, st = o.start ?? .15, ev = o.every ?? .55, cw = LAND ? W * .56 : W - 160 * u, x0 = (W - cw) / 2, lh = 56 * u;
    let y = LAND ? H * .31 : H * .26;
    ctx.save(); ctx.font = F(K, 700, LAND ? 40 : 40);
    o.msgs.forEach((m, i) => {
      const at = st + i * ev, me = m.who === 'me', lines = wrapCJK(ctx, m.text, cw * .7);
      const bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 60 * u, bh = lines.length * lh + 36 * u, ax = me ? x0 + cw - bw : x0 + 84 * u;
      if (!me) logo(ctx, K, x0 + 30 * u, y + 40 * u, 56 * u, pop(t - at + .35, .3));
      if (!me && t > at - .35 && t < at) {
        ctx.globalAlpha = smooth(at - .35, at - .25, t); rr(ctx, ax, y, 150 * u, 80 * u, 40 * u); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fill();
        for (let k = 0; k < 3; k++) { ctx.fillStyle = K.muted; ctx.beginPath(); ctx.arc(ax + 44 * u + k * 31 * u, y + 40 * u - Math.max(0, Math.sin(t * 14 - k)) * 9 * u, 8 * u, 0, TAU); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      const e = pop(t - at, .4);
      if (e > 0) {
        const px = me ? ax + bw : ax;
        ctx.save(); ctx.globalAlpha = e; ctx.translate(px, y + bh); ctx.scale(lerp(.7, 1, e), lerp(.7, 1, e)); ctx.translate(-px, -(y + bh));
        rr(ctx, ax, y, bw, bh, 30 * u);
        if (me) { ctx.fillStyle = K.a(1); ctx.shadowColor = K.a(.5); ctx.shadowBlur = 30 * u; ctx.fill(); ctx.shadowBlur = 0; }
        else { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fill(); ctx.strokeStyle = K.faint; ctx.lineWidth = 1.5 * u; ctx.stroke(); }
        ctx.fillStyle = me ? K.bg0 : K.ink; lines.forEach((l, j) => ctx.fillText(l, ax + 30 * u, y + 18 * u + lh * (j + .5) + 14 * u));
        ctx.restore();
      }
      y += bh + 30 * u;
    });
    ctx.restore();
  }

  // 终端：命令逐字打出，下面一行行冒输出，进度条一格格走满，最后光标停在新的一行闪
  // o = { kicker, title, label, lines: [{ cmd } | { out, hot } | { bar, secs }], start = .1, cps = 60 }
  function terminal(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), ce = pop(t, .5); if (ce <= 0) return;
    const y0 = b.y + (1 - ce) * 60 * u, lh = (LAND ? 64 : 60) * u, fs = LAND ? 30 : 28, cps = o.cps || 60, x = b.x + 50 * u;
    ctx.save(); ctx.globalAlpha = ce; rr(ctx, b.x, y0, b.w, b.h, 24 * u); ctx.fillStyle = 'rgba(6,6,12,.94)'; ctx.fill(); ctx.strokeStyle = K.faint; ctx.lineWidth = 1.5 * u; ctx.stroke(); ctx.clip();
    chrome(ctx, K, b.x, y0, null);
    ctx.fillStyle = K.muted; ctx.font = F(K, 700, 20, MONO(K)); center(ctx, o.label || 'zsh', b.x + b.w / 2, y0 + 43 * u);
    ctx.fillStyle = K.faint; ctx.fillRect(b.x, y0 + 72 * u, b.w, 1.5 * u);
    let at = o.start ?? .1, y = y0 + 134 * u, cur = null;
    ctx.font = F(K, 700, fs, MONO(K));
    for (const l of o.lines) {
      if (t < at) break;
      if (l.cmd != null) {
        const n = Math.floor(clamp((t - at) * cps, 0, l.cmd.length)), s = l.cmd.slice(0, n);
        ctx.fillStyle = K.a(1); ctx.fillText('$', x, y); ctx.fillStyle = K.ink; ctx.fillText(s, x + 40 * u, y);
        cur = n < l.cmd.length ? [x + 40 * u + ctx.measureText(s).width, y] : null; at += l.cmd.length / cps + .08;
      } else if (l.bar != null) {
        const p = eInOutCubic(inv(at, at + (l.secs || .4), t)), cells = 24, k = Math.round(p * cells), bx = x + 140 * u;
        ctx.fillStyle = K.muted; ctx.fillText(l.bar, x, y);
        for (let c = 0; c < cells; c++) { ctx.fillStyle = c < k ? K.a(1) : 'rgba(255,255,255,.1)'; ctx.fillRect(bx + c * 22 * u, y - 24 * u, 16 * u, 28 * u); }
        ctx.fillStyle = K.ink; ctx.fillText(`${Math.round(p * 100)}%`, bx + cells * 22 * u + 22 * u, y); at += l.secs || .4;
      } else {
        ctx.globalAlpha = ce * pop(t - at, .2); ctx.fillStyle = l.hot ? K.hi : K.muted; ctx.fillText(l.out, x, y); ctx.globalAlpha = ce; at += .12;
      }
      y += lh;
    }
    if (!cur && t >= at) { ctx.fillStyle = K.a(1); ctx.fillText('$', x, y); cur = Math.floor(t / .25) % 2 ? null : [x + 40 * u, y]; }
    if (cur) { ctx.fillStyle = K.a(1); ctx.fillRect(cur[0] + 4 * u, cur[1] - fs * .8 * u, 16 * u, fs * u); }
    ctx.restore();
  }

  // 流程图：几个节点依次亮起，虚线流动着连过去、末端一个箭头，之后一颗光点沿每段连线一直跑
  // o = { kicker, title, nodes: [{ label, sub }], start = .1, every = .3 }
  function flow(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), n = o.nodes.length, st = o.start ?? .1, ev = o.every ?? .3, nw = LAND ? 380 * u : b.w * .8, nh = LAND ? 230 * u : 200 * u;
    const pos = i => LAND ? [lerp(b.x + nw / 2, b.x + b.w - nw / 2, i / (n - 1)), b.y + b.h * .48] : [W / 2, lerp(b.y + nh / 2, b.y + b.h - nh / 2, i / (n - 1))];
    for (let i = 0; i < n - 1; i++) {
      const [x1, y1] = pos(i), [x2, y2] = pos(i + 1), t0 = st + i * ev + .12, p = eOutCubic(inv(t0, t0 + ev, t)); if (p <= 0) continue;
      const ax = LAND ? x1 + nw / 2 + 16 * u : x1, ay = LAND ? y1 : y1 + nh / 2 + 16 * u, bx = LAND ? x2 - nw / 2 - 16 * u : x2, by = LAND ? y2 : y2 - nh / 2 - 16 * u;
      ctx.save(); ctx.strokeStyle = K.a(.85); ctx.lineWidth = 4 * u; ctx.setLineDash([14 * u, 10 * u]); ctx.lineDashOffset = -t * 80 * u;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lerp(ax, bx, p), lerp(ay, by, p)); ctx.stroke(); ctx.setLineDash([]);
      if (p >= 1) {
        ctx.fillStyle = K.a(1); ctx.beginPath();
        if (LAND) { ctx.moveTo(bx + 4 * u, by); ctx.lineTo(bx - 18 * u, by - 13 * u); ctx.lineTo(bx - 18 * u, by + 13 * u); } else { ctx.moveTo(bx, by + 4 * u); ctx.lineTo(bx - 13 * u, by - 18 * u); ctx.lineTo(bx + 13 * u, by - 18 * u); }
        ctx.fill();
        const k = ((t - t0 - ev) * 1.8) % 1; ctx.fillStyle = K.hi; ctx.shadowColor = K.a(1); ctx.shadowBlur = 24 * u; ctx.beginPath(); ctx.arc(lerp(ax, bx, k), lerp(ay, by, k), 9 * u, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    o.nodes.forEach((nd, i) => {
      const e = pop(t - st - i * ev, .45); if (e <= 0) return;
      const [x, y] = pos(i), last = i === n - 1;
      ctx.save(); ctx.globalAlpha = e; ctx.translate(x, y); ctx.scale(lerp(.8, 1, e), lerp(.8, 1, e));
      glass(ctx, K, -nw / 2, -nh / 2, nw, nh, 26);
      if (last) { ctx.shadowColor = K.a(.7); ctx.shadowBlur = 40 * u; rr(ctx, -nw / 2, -nh / 2, nw, nh, 26 * u); ctx.strokeStyle = K.a(1); ctx.lineWidth = 3 * u; ctx.stroke(); ctx.shadowBlur = 0; }
      ctx.fillStyle = K.a(1); ctx.font = F(K, 700, 22, MONO(K)); center(ctx, String(i + 1).padStart(2, '0'), 0, -nh / 2 + 52 * u);
      ctx.fillStyle = K.ink; ctx.font = F(K, 900, 54); center(ctx, nd.label, 0, 22 * u);
      if (nd.sub) { ctx.fillStyle = K.muted; ctx.font = F(K, 700, 24, MONO(K)); center(ctx, nd.sub, 0, nh / 2 - 34 * u); }
      ctx.restore();
    });
  }

  // 横竖双设备：一台显示器（16:9）和一部手机（9:16）同时渲染同一支片，下面各一条进度
  // o = { kicker, title, start = .2, secs = 1.3 }
  function devices(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), st = o.start ?? .2, p = eInOutCubic(inv(st, st + (o.secs || 1.3), t)), gap = 100 * u;
    const mh = LAND ? b.h * .76 : b.w * .62 * 9 / 16, mw = mh * 16 / 9, ph = LAND ? mh : b.h * .52, pw = ph * 9 / 16;
    const mx = LAND ? W / 2 - (mw + gap + pw) / 2 : W / 2 - mw / 2, px = LAND ? mx + mw + gap : W / 2 - pw / 2, py = LAND ? b.y : b.y + mh + 150 * u;
    [[mx, b.y, mw, mh, '16 : 9', -1], [px, py, pw, ph, '9 : 16', 1]].forEach(([x, y, w, h, lab, d], i) => {
      const e = pop(t - i * .1, .55); if (e <= 0) return;
      ctx.save(); ctx.globalAlpha = e; ctx.translate(d * (1 - e) * 220 * u, 0);
      rr(ctx, x - 14 * u, y - 14 * u, w + 28 * u, h + 28 * u, (i ? 40 : 22) * u); ctx.fillStyle = '#0d0d16'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2 * u; ctx.stroke();
      mini(ctx, K, x, y, w, h, p);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; rr(ctx, x, y + h + 40 * u, w, 8 * u, 4 * u); ctx.fill();
      ctx.save(); ctx.shadowColor = K.a(.8); ctx.shadowBlur = 16 * u; ctx.fillStyle = K.a(1); rr(ctx, x, y + h + 40 * u, Math.max(8 * u, w * p), 8 * u, 4 * u); ctx.fill(); ctx.restore();
      ctx.fillStyle = K.muted; ctx.font = F(K, 700, 22, MONO(K)); ctx.fillText(lab, x, y + h + 84 * u);
      ctx.textAlign = 'right'; ctx.fillStyle = K.ink; ctx.fillText(`${Math.round(p * 100)}%`, x + w, y + h + 84 * u);
      ctx.restore();
    });
  }

  // 放大镜：一排胶片格（每格是片子的一帧），镜头移到其中一格，镜片撑大看清这一帧，旁边标出第几帧
  // o = { kicker, title, n = 12, pick = 7, label, start = .1 }
  function magnify(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), n = o.n || 12, cols = LAND ? 6 : 3, rows = Math.ceil(n / cols), gap = 18 * u, pk = o.pick ?? 7;
    const tw = (b.w - (cols - 1) * gap) / cols, th = tw * 9 / 16, gy = b.y + (b.h - rows * th - (rows - 1) * gap) / 2;
    const cell = i => [b.x + (i % cols) * (tw + gap), gy + Math.floor(i / cols) * (th + gap)];
    for (let i = 0; i < n; i++) { const e = pop(t - i * .025, .35); if (e <= 0) continue; const [x, y] = cell(i); ctx.save(); ctx.globalAlpha = e * (i === pk ? 1 : .8); mini(ctx, K, x, y + (1 - e) * 30 * u, tw, th, (i + .5) / n); ctx.restore(); }
    const st = o.start ?? .1; if (t < st + .2) return;
    const m = eInOutCubic(inv(st + .2, st + .7, t)), [qx, qy] = cell(pk), tx = qx + tw / 2, ty = qy + th / 2;
    const lx = lerp(b.x + b.w * .1, tx, m), ly = lerp(b.y + b.h + 40 * u, ty, m), z = eOutCubic(inv(st + .65, st + 1.0, t)), R = lerp(90, 230, z) * u, zz = lerp(1.3, 2.5, z);
    ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, R, 0, TAU); ctx.fillStyle = K.bg0; ctx.fill(); ctx.clip();
    mini(ctx, K, lx - tw * zz / 2, ly - th * zz / 2, tw * zz, th * zz, (pk + .5) / n); ctx.restore();
    ctx.save(); ctx.strokeStyle = K.a(1); ctx.lineWidth = 6 * u; ctx.shadowColor = K.a(.8); ctx.shadowBlur = 30 * u; ctx.beginPath(); ctx.arc(lx, ly, R, 0, TAU); ctx.stroke();
    ctx.lineWidth = 18 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lx + R * .72, ly + R * .72); ctx.lineTo(lx + R * 1.05, ly + R * 1.05); ctx.stroke(); ctx.restore();
    const le = pop(t - st - 1.0, .35);
    if (o.label && le > 0) {
      ctx.save(); ctx.globalAlpha = le; ctx.font = F(K, 700, 30); const pw = ctx.measureText(o.label).width + 48 * u, ph = 58 * u, side = lx + R + 40 * u + pw < W - 60 * u ? 1 : -1;
      const x = side > 0 ? lx + R + 30 * u : lx - R - 30 * u - pw, y = ly - R * .7;
      rr(ctx, x + (1 - le) * side * -20 * u, y, pw, ph, ph / 2); ctx.fillStyle = K.a(1); ctx.fill(); ctx.fillStyle = K.bg0; ctx.fillText(o.label, x + 24 * u + (1 - le) * side * -20 * u, y + 40 * u); ctx.restore();
    }
  }

  // 通知弹窗：几条通知从右边滑进来叠成一摞，新的在最上面，旧的往下让
  // o = { kicker, title, items: [{ title, sub }], start = .15, every = .3, when = '刚刚' }
  function toast(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), st = o.start ?? .15, ev = o.every ?? .3, n = o.items.length, cw = LAND ? 820 * u : b.w, ch = 132 * u, gap = 22 * u, x = W / 2 - cw / 2;
    o.items.forEach((it, i) => {
      const e = pop(t - st - i * ev, .45); if (e <= 0) return;
      let k = 0; for (let j = i + 1; j < n; j++) k += pop(t - st - j * ev, .45);
      const y = b.y + 10 * u + k * (ch + gap), xx = x + (1 - e) * 420 * u, newest = k < .5;
      ctx.save(); ctx.globalAlpha = e * (1 - .22 * k);
      ctx.shadowColor = newest ? K.a(.35) : 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40 * u; rr(ctx, xx, y, cw, ch, 26 * u); ctx.fillStyle = 'rgba(22,22,34,.95)'; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = newest ? K.a(.6) : K.faint; ctx.lineWidth = 1.5 * u; ctx.stroke();
      ctx.fillStyle = K.a(1); ctx.beginPath(); ctx.arc(xx + 66 * u, y + ch / 2, 30 * u, 0, TAU); ctx.fill();
      ctx.strokeStyle = K.bg0; ctx.lineWidth = 5 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(xx + 53 * u, y + ch / 2); ctx.lineTo(xx + 62 * u, y + ch / 2 + 10 * u); ctx.lineTo(xx + 80 * u, y + ch / 2 - 10 * u); ctx.stroke();
      ctx.fillStyle = K.ink; ctx.font = F(K, 700, 36); ctx.fillText(it.title, xx + 122 * u, y + 58 * u);
      ctx.fillStyle = K.muted; ctx.font = F(K, 700, 22, MONO(K)); ctx.fillText(it.sub, xx + 122 * u, y + 98 * u);
      ctx.textAlign = 'right'; ctx.fillText(o.when || '刚刚', xx + cw - 34 * u, y + 58 * u);
      ctx.restore();
    });
  }

  // 翻牌数字：机场翻牌式的数字格，每格从 0 一路翻到目标（多翻一圈），全部翻定后数字亮成强调色
  // o = { kicker, value: '00:42', label, start = .15, flip = .05 }
  function flipboard(ctx, K, t, o) {
    const u = K.u, st = o.start ?? .15, fd = o.flip || .05, chars = [...o.value], cw = (LAND ? 180 : 160) * u, chh = cw * 1.42, gap = 18 * u;
    const tw = chars.reduce((s, c) => s + (/\d/.test(c) ? cw : cw * .4) + gap, -gap), y = H * (LAND ? .5 : .44) - chh / 2, e = pop(t, .35);
    let all = true, x = W / 2 - tw / 2;
    if (o.kicker) kicker(ctx, K, o.kicker, W / 2, y - 60 * u, e, 'center');
    const half = (d, x, top, s = 1, hot = false) => {
      ctx.save(); ctx.translate(0, y + chh / 2); ctx.scale(1, s); ctx.translate(0, -(y + chh / 2));
      ctx.beginPath(); ctx.rect(x, top ? y : y + chh / 2, cw, chh / 2); ctx.clip();
      rr(ctx, x, y, cw, chh, 18 * u); ctx.fillStyle = top ? '#1b1b28' : '#161622'; ctx.fill();
      ctx.font = F(K, 400, chh / u * .84, K.num); ctx.fillStyle = hot ? K.hi : K.ink; if (hot) { ctx.shadowColor = K.a(.9); ctx.shadowBlur = 30 * u; }
      center(ctx, String(d), x + cw / 2, y + chh * .8); ctx.restore();
    };
    ctx.save(); ctx.globalAlpha = e;
    chars.forEach((c, i) => {
      if (!/\d/.test(c)) { ctx.fillStyle = K.ink; ctx.font = F(K, 400, chh / u * .7, K.num); center(ctx, c, x + cw * .2, y + chh * .74); x += cw * .4 + gap; return; }
      const tgt = +c, flips = tgt + 10, k = Math.max(0, (t - st - i * .06) / fd), done = k >= flips; if (!done) all = false;
      const cur = done ? tgt : Math.floor(k) % 10, nxt = (cur + 1) % 10, f = done ? 0 : k - Math.floor(k);
      half(done ? cur : nxt, x, true); half(cur, x, false);
      if (!done && f < .5) half(cur, x, true, 1 - 2 * f); else if (!done) half(nxt, x, false, 2 * f - 1);
      ctx.fillStyle = '#05050A'; ctx.fillRect(x, y + chh / 2 - 2 * u, cw, 4 * u);
      x += cw + gap;
    });
    if (all) { x = W / 2 - tw / 2; chars.forEach(c => { if (/\d/.test(c)) { half(+c, x, true, 1, true); half(+c, x, false, 1, true); ctx.fillStyle = '#05050A'; ctx.fillRect(x, y + chh / 2 - 2 * u, cw, 4 * u); x += cw + gap; } else x += cw * .4 + gap; }); }
    const le = pop(t - st - .7, .4);
    if (o.label && le > 0) { ctx.globalAlpha = le; ctx.fillStyle = K.muted; ctx.font = F(K, 700, LAND ? 44 : 42); center(ctx, o.label, W / 2, y + chh + 90 * u + (1 - le) * 20 * u); }
    ctx.restore();
  }

  // 仪表：240° 的刻度盘，指针带回弹甩到读数，扫过的刻度逐个亮起，下面的数字跟着数
  // o = { kicker, label, value, max, unit, start = .15, secs = .8 }
  function gauge(ctx, K, t, o) {
    const u = K.u, st = o.start ?? .15, cx = W / 2, cy = H * (LAND ? .56 : .46), R = (LAND ? 290 : 360) * u, a0 = Math.PI * 5 / 6, span = Math.PI * 4 / 3;
    const e = pop(t, .4), k = eOutBack(inv(st, st + (o.secs || .8), t), 1.3), p = k * o.value / o.max, ang = a0 + span * p;
    if (o.kicker) kicker(ctx, K, o.kicker, cx, cy - R - 50 * u, e, 'center');
    ctx.save(); ctx.globalAlpha = e; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 30 * u; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a0 + span); ctx.stroke();
    if (p > 0) { ctx.save(); ctx.shadowColor = K.a(.9); ctx.shadowBlur = 40 * u; ctx.strokeStyle = K.a(1); ctx.beginPath(); ctx.arc(cx, cy, R, a0, ang); ctx.stroke(); ctx.restore(); }
    ctx.font = F(K, 700, 20, MONO(K)); ctx.textAlign = 'center';
    for (let j = 0; j <= 40; j++) {
      const a = a0 + span * j / 40, on = j / 40 <= p, maj = j % 5 === 0, r1 = R - 44 * u, r2 = r1 - (maj ? 32 : 16) * u;
      ctx.strokeStyle = on ? (maj ? K.ink : K.a(.9)) : 'rgba(255,255,255,.18)'; ctx.lineWidth = (maj ? 4 : 2) * u;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke();
      if (maj) { ctx.fillStyle = on ? K.ink : K.muted; ctx.fillText(String(Math.round(o.max * j / 40)), cx + Math.cos(a) * (r2 - 30 * u), cy + Math.sin(a) * (r2 - 30 * u) + 7 * u); }
    }
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.fillStyle = K.hi; ctx.shadowColor = K.a(1); ctx.shadowBlur = 20 * u;
    ctx.beginPath(); ctx.moveTo(-24 * u, -9 * u); ctx.lineTo(R - 64 * u, 0); ctx.lineTo(-24 * u, 9 * u); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = K.bg0; ctx.beginPath(); ctx.arc(cx, cy, 24 * u, 0, TAU); ctx.fill(); ctx.strokeStyle = K.a(1); ctx.lineWidth = 4 * u; ctx.stroke();
    ctx.restore();
    const v = o.value * clamp(k);
    glowNum(ctx, K, count(v, o.digits ?? 0) + (o.unit || ''), cx, cy + R * .62, LAND ? 150 : 170, e);
    if (o.label) { ctx.save(); ctx.globalAlpha = pop(t - st - .4, .4); ctx.fillStyle = K.muted; ctx.font = F(K, 700, LAND ? 36 : 40); center(ctx, o.label, cx, cy + R * .62 + 60 * u); ctx.restore(); }
  }

  // 排行赛跑：几根横条一起往前长，按当前数值实时换名次，突出的那一根从后面一路追到第一
  // o = { kicker, title, items: [{ label, from, to, hot }], unit, start = .1, secs = 1.4 }
  function race(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), st = o.start ?? .1, p = eInOutCubic(inv(st, st + (o.secs || 1.4), t)), n = o.items.length, ce = pop(t, .4);
    const vs = o.items.map(it => lerp(it.from, it.to, p)), vmax = Math.max(...vs) * 1.08, rh = b.h / n, lw = (LAND ? 270 : 230) * u, bw = b.w - lw - 150 * u;
    o.items.forEach((it, i) => {
      let rank = 0; vs.forEach((v, j) => { if (j !== i) rank += 1 / (1 + Math.exp(-(v - vs[i]) / (vmax * .012))); });
      const y = b.y + rank * rh + rh * .15, h = rh * .62, w = Math.max(h, bw * vs[i] / vmax);
      ctx.save(); ctx.globalAlpha = ce;
      ctx.fillStyle = it.hot ? K.ink : K.muted; ctx.font = F(K, 700, LAND ? 36 : 32); ctx.textAlign = 'right'; ctx.fillText(it.label, b.x + lw - 24 * u, y + h / 2 + 12 * u); ctx.textAlign = 'left';
      if (it.hot) { const g = ctx.createLinearGradient(b.x + lw, 0, b.x + lw + w, 0); g.addColorStop(0, K.a(.4)); g.addColorStop(1, K.hi); ctx.fillStyle = g; ctx.shadowColor = K.a(.8); ctx.shadowBlur = 30 * u; }
      else ctx.fillStyle = 'rgba(255,255,255,.2)';
      rr(ctx, b.x + lw, y, w, h, h / 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = it.hot ? K.ink : K.muted; ctx.font = F(K, 400, LAND ? 60 : 52, K.num); ctx.fillText(count(vs[i], 0) + (o.unit || ''), b.x + lw + w + 20 * u, y + h / 2 + 21 * u);
      ctx.restore();
    });
  }

  // 划掉改写：上面一句铺垫，下面的旧说法被一道强调色的线划掉、往下掉走，新说法从大处砸进来
  // o = { kicker, pre, before, after, tag, start = .25 }
  function strike(ctx, K, t, o) {
    const u = K.u, st = o.start ?? .25, cx = W / 2, y1 = H * (LAND ? .34 : .32), y2 = H * (LAND ? .6 : .5), px = LAND ? 190 : 150, e = pop(t, .4);
    if (o.kicker) kicker(ctx, K, o.kicker, cx, y1 - 100 * u, e, 'center');
    ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.muted; ctx.font = F(K, 700, LAND ? 64 : 56); center(ctx, o.pre, cx, y1); ctx.restore();
    ctx.font = F(K, 900, px); const bw = ctx.measureText(o.before).width;
    const s = eOutCubic(inv(st, st + .22, t)), drop = eInCubic(inv(st + .32, st + .62, t));
    if (drop < 1) {
      ctx.save(); ctx.globalAlpha = e * (1 - drop); ctx.translate(cx, y2 + drop * 180 * u); ctx.rotate(drop * .14);
      ctx.fillStyle = 'rgba(244,245,248,.75)'; ctx.font = F(K, 900, px); center(ctx, o.before, 0, 0);
      if (s > 0) { ctx.fillStyle = K.a(1); ctx.shadowColor = K.a(.9); ctx.shadowBlur = 20 * u; ctx.fillRect(-bw / 2 - 24 * u, -px * .38 * u, (bw + 48 * u) * s, 14 * u); }
      ctx.restore();
    }
    const a = inv(st + .48, st + .66, t);
    if (a > 0) {
      ctx.save(); ctx.translate(cx, y2 - px * .36 * u); const sc = lerp(1.8, 1, a * a); ctx.scale(sc, sc); ctx.globalAlpha = clamp(a * 3);
      ctx.font = F(K, 900, px); ctx.fillStyle = K.a(1); ctx.shadowColor = K.a(.9); ctx.shadowBlur = 60 * u; center(ctx, o.after, 0, px * .36 * u); ctx.restore();
    }
    const te = pop(t - st - .8, .4);
    if (o.tag && te > 0) {
      ctx.save(); ctx.globalAlpha = te; ctx.font = F(K, 700, 30); const pw = ctx.measureText(o.tag).width + 56 * u, ph = 60 * u, ty = y2 + 70 * u + (1 - te) * 16 * u;
      rr(ctx, cx - pw / 2, ty, pw, ph, ph / 2); ctx.strokeStyle = K.a(1); ctx.lineWidth = 2.5 * u; ctx.stroke(); ctx.fillStyle = K.ink; center(ctx, o.tag, cx, ty + 41 * u); ctx.restore();
    }
  }

  // 点阵地图：一片抽象的点阵大陆从左到右亮起（不是真实地图，只是几团高斯斑），几个城市依次脉冲，从中心城市拉出弧线连到其他城市
  // o = { kicker, title, cities: [{ x, y, label }]（0–1，相对内容框）, hub = 0, start = .1 }
  const BLOBS = [[.17, .3, .13, .17], [.28, .72, .07, .17], [.49, .25, .07, .09], [.53, .6, .08, .17], [.7, .3, .17, .15], [.79, .56, .05, .07], [.87, .78, .07, .07]];
  function dotmap(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), st = o.start ?? .1, step = 15 * u, rev = lerp(b.x - 60 * u, b.x + b.w + 60 * u, eOutCubic(inv(0, .55, t))), ds = 5 * u;
    for (let gy = 0, y = b.y; y < b.y + b.h; y += step, gy++) for (let gx = 0, x = b.x; x < b.x + b.w; x += step, gx++) {
      if (x > rev) break;
      const nx = (x - b.x) / b.w, ny = (y - b.y) / b.h; let f = (hash2(gx, gy) - .5) * .35;
      for (const [bx, by, rx, ry] of BLOBS) f += Math.exp(-(((nx - bx) / rx) ** 2 + ((ny - by) / ry) ** 2));
      if (f < .55) continue;
      ctx.fillStyle = rev - x < 60 * u ? K.a(.8) : `rgba(255,255,255,${.22 + .3 * clamp(f - .55)})`; ctx.fillRect(x, y, ds, ds);
    }
    const P = c => [b.x + c.x * b.w, b.y + c.y * b.h], hub = o.hub || 0, [hx, hy] = P(o.cities[hub]);
    o.cities.forEach((c, i) => {
      const lt = t - st - .35 - i * .09, e = pop(lt, .3); if (e <= 0) return;
      const [x, y] = P(c);
      if (i !== hub) {
        const p = eOutCubic(inv(0, .45, lt)), mx = (hx + x) / 2, my = Math.min(hy, y) - Math.hypot(x - hx, y - hy) * .3;
        ctx.save(); ctx.strokeStyle = K.a(.7); ctx.lineWidth = 2.5 * u; ctx.beginPath();
        for (let k = 0; k <= 24 * p; k++) { const s = k / 24, q = 1 - s; const ax = q * q * hx + 2 * q * s * mx + s * s * x, ay = q * q * hy + 2 * q * s * my + s * s * y; k ? ctx.lineTo(ax, ay) : ctx.moveTo(ax, ay); }
        ctx.stroke(); ctx.restore();
      }
      const f = (lt * 1.4) % 1; ctx.strokeStyle = K.a(.7 * (1 - f)); ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.arc(x, y, 10 * u + f * 40 * u, 0, TAU); ctx.stroke();
      ctx.save(); ctx.fillStyle = i === hub ? K.hi : K.a(1); ctx.shadowColor = K.a(1); ctx.shadowBlur = 20 * u; ctx.beginPath(); ctx.arc(x, y, (i === hub ? 12 : 8) * u * e, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.ink; ctx.font = F(K, 700, 26); ctx.fillText(c.label, x + 18 * u, y - 14 * u); ctx.restore();
    });
  }

  // 日历热力格：一周一列，从左到右一列列填上，颜色越深出片越多；右上角总数跟着数
  // o = { kicker, title, weeks = 26, total, unit, start = .1, secs = .9 }
  function heat(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), wk = o.weeks || 26, st = o.start ?? .1, sec = o.secs || .9, gap = 7 * u;
    const cs = Math.min((b.w - (wk - 1) * gap) / wk, (b.h - 90 * u - 6 * gap) / 7), gw = wk * cs + (wk - 1) * gap, x0 = W / 2 - gw / 2, y0 = b.y + 20 * u, p = clamp((t - st) / sec) * (wk + 1);
    for (let c = 0; c < wk; c++) for (let r = 0; r < 7; r++) {
      const k = eOutCubic(clamp(p - c - r * .1)), v = clamp(hash2(c, r) * .75 + c / wk * .6 - .2), x = x0 + c * (cs + gap), y = y0 + r * (cs + gap);
      ctx.fillStyle = 'rgba(255,255,255,.05)'; rr(ctx, x, y, cs, cs, 5 * u); ctx.fill();
      if (k > 0 && v > .06) { ctx.fillStyle = K.a(.15 + .85 * v); rr(ctx, x + (1 - k) * cs / 2, y + (1 - k) * cs / 2, cs * k, cs * k, 5 * u); ctx.fill(); }
    }
    const ly = y0 + 7 * (cs + gap) + 30 * u; ctx.font = F(K, 700, 20, MONO(K)); ctx.fillStyle = K.muted; ctx.textAlign = 'right';
    ctx.fillText('多', x0 + gw, ly + 4 * u); for (let k = 0; k < 5; k++) { ctx.fillStyle = K.a(.15 + .85 * (4 - k) / 4); rr(ctx, x0 + gw - 40 * u - (k + 1) * 30 * u, ly - 18 * u, 22 * u, 22 * u, 4 * u); ctx.fill(); }
    ctx.fillStyle = K.muted; ctx.fillText('少', x0 + gw - 40 * u - 5 * 30 * u - 14 * u, ly + 4 * u); ctx.textAlign = 'left';
    if (o.total) {
      const e = pop(t, .4), v = o.total * eOutCubic(clamp((t - st) / sec)), ny = LAND ? H * .15 + 82 * u : H * .12 + 160 * u, nx = LAND ? x0 + gw : W / 2;
      glowNum(ctx, K, count(v, 0, true), nx - (LAND ? 150 * u : 0), ny, 110, e, LAND ? 'right' : 'center');
      if (o.unit) { ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.muted; ctx.font = F(K, 700, 30); ctx.textAlign = LAND ? 'right' : 'center'; ctx.fillText(o.unit, nx, ny - 6 * u); ctx.restore(); }
    }
  }

  // 散点气泡：坐标轴先画出，一群气泡依次弹出，突出的那一颗最大、用强调色；返回它的位置，给手绘圈注用
  // o = { kicker, title, n = 18, hot: { x, y, r, label }, xl, yl, start = .1 }
  function scatter(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), st = o.start ?? .1, n = o.n || 18, ax = b.x + 60 * u, ay = b.y + b.h - 40 * u, aw = b.w - 100 * u, ah = b.h - 70 * u, ae = eOutCubic(inv(0, .35, t));
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(ax, ay, aw * ae, 2 * u); ctx.fillRect(ax, ay - ah * ae, 2 * u, ah * ae);
    ctx.save(); ctx.globalAlpha = ae; ctx.font = F(K, 700, 22, MONO(K)); ctx.fillStyle = K.muted;
    if (o.xl) { ctx.textAlign = 'right'; ctx.fillText(o.xl, ax + aw, ay + 36 * u); ctx.textAlign = 'left'; }
    if (o.yl) ctx.fillText(o.yl, ax + 18 * u, ay - ah + 10 * u);
    ctx.restore();
    const P = (x, y) => [ax + x * aw, ay - y * ah];
    for (let i = 0; i < n; i++) {
      const x = .06 + .64 * rnd(i, 4), y = .08 + .5 * rnd(i, 5) * (.35 + x), r = (14 + 34 * rnd(i, 6)) * u, e = eOutBack(inv(st + i * .03, st + i * .03 + .3, t));
      if (e <= 0) continue; const [px, py] = P(x, y);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.arc(px, py, r * e, 0, TAU); ctx.fill(); ctx.stroke();
    }
    const h = o.hot, [hx, hy] = P(h.x, h.y), hr = (h.r || 64) * u, he = eOutBack(inv(st + n * .03, st + n * .03 + .35, t));
    if (he > 0) {
      ctx.save(); ctx.shadowColor = K.a(.9); ctx.shadowBlur = 50 * u; const g = ctx.createRadialGradient(hx, hy - hr * .4, 0, hx, hy, hr); g.addColorStop(0, K.hi); g.addColorStop(1, K.a(1));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, hr * he, 0, TAU); ctx.fill(); ctx.restore();
      if (h.label) { ctx.save(); ctx.globalAlpha = clamp(he); ctx.fillStyle = K.bg0; ctx.font = F(K, 900, 28); center(ctx, h.label, hx, hy + 10 * u); ctx.restore(); }
    }
    return { x: hx - hr, y: hy - hr, w: hr * 2, h: hr * 2 };
  }

  // 手绘圈注（叠加）：一圈手画似的椭圆把目标圈出来（多绕一点、首尾不齐），旁边一句斜写的批注加一条弯箭头
  // o = { x, y, w, h, label, side = 'left' }
  function scribble(ctx, K, t, o) {
    if (t < 0) return;
    const u = K.u, cx = o.x + o.w / 2, cy = o.y + o.h / 2, rx = o.w / 2 + 36 * u, ry = o.h / 2 + 28 * u, p = eInOutCubic(inv(0, .4, t)), N = 64, tot = TAU * 1.12, a0 = -2.5;
    ctx.save(); ctx.strokeStyle = K.hi; ctx.lineWidth = 6 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = K.a(.9); ctx.shadowBlur = 16 * u;
    ctx.beginPath();
    for (let k = 0; k <= N * p; k++) { const a = a0 + tot * k / N, w = 1 + .06 * Math.sin(a * 3 + 1) + .05 * k / N, x = cx + Math.cos(a) * rx * w, y = cy + Math.sin(a) * ry * w - k / N * 12 * u; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    const e = pop(t - .4, .35);
    if (e > 0 && o.label) {
      const sd = (o.side || 'left') === 'left' ? -1 : 1, sx = cx + sd * (rx + 20 * u), sy = cy - ry * .2, ex = cx + sd * (rx + 150 * u), ey = cy - ry - 40 * u;
      ctx.beginPath(); ctx.moveTo(ex, ey + 14 * u); ctx.quadraticCurveTo(ex, sy, lerp(ex, sx, e), lerp(ey + 14 * u, sy, e)); ctx.stroke();
      if (e > .9) { ctx.beginPath(); ctx.moveTo(sx + sd * 18 * u, sy - 14 * u); ctx.lineTo(sx, sy); ctx.lineTo(sx + sd * 22 * u, sy + 8 * u); ctx.stroke(); }
      ctx.shadowBlur = 0; ctx.translate(ex, ey - 8 * u); ctx.rotate(-.08); ctx.globalAlpha = e; ctx.font = F(K, 900, 42); ctx.fillStyle = K.hi; center(ctx, o.label, 0, 0);
    }
    ctx.restore();
  }

  // 漏斗：几层梯形自上而下落下，越往下越窄，右边的数字跟着数，每层旁边标出比上一层留下多少；最后一层用强调色
  // o = { kicker, title, steps: [{ label, v }], start = .1, every = .18 }
  function funnel(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), st = o.start ?? .1, ev = o.every ?? .18, n = o.steps.length, gap = 14 * u, th = (b.h - (n - 1) * gap) / n;
    const cx = LAND ? b.x + b.w * .36 : W / 2, mw = LAND ? b.w * .6 : b.w, wd = i => mw * lerp(1, .3, i / n);
    o.steps.forEach((s, i) => {
      const e = pop(t - st - i * ev, .4); if (e <= 0) return;
      const y = b.y + i * (th + gap) - (1 - e) * 60 * u, w1 = wd(i), w2 = wd(i + 1), last = i === n - 1;
      ctx.save(); ctx.globalAlpha = e; ctx.beginPath(); ctx.moveTo(cx - w1 / 2, y); ctx.lineTo(cx + w1 / 2, y); ctx.lineTo(cx + w2 / 2, y + th); ctx.lineTo(cx - w2 / 2, y + th); ctx.closePath();
      if (last) { const g = ctx.createLinearGradient(0, y, 0, y + th); g.addColorStop(0, K.hi); g.addColorStop(1, K.a(1)); ctx.fillStyle = g; ctx.shadowColor = K.a(.8); ctx.shadowBlur = 40 * u; }
      else ctx.fillStyle = `rgba(255,255,255,${.18 - i * .035})`;
      ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = last ? K.bg0 : K.ink; ctx.font = F(K, 700, LAND ? 36 : 32); center(ctx, s.label, cx, y + th / 2 + 13 * u);
      const v = s.v * eOutExpo(inv(0, .6, t - st - i * ev)), nx = LAND ? cx + mw / 2 + 70 * u : b.x + b.w;
      ctx.fillStyle = last ? K.ink : K.muted; ctx.font = F(K, 400, LAND ? 68 : 50, K.num); ctx.textAlign = LAND ? 'left' : 'right'; ctx.fillText(count(v, 0, true), nx, y + th / 2 + 24 * u);
      if (i > 0 && LAND) { const vw = ctx.measureText(count(s.v, 0, true)).width; ctx.textAlign = 'left'; ctx.fillStyle = K.a(1); ctx.font = F(K, 700, 24, MONO(K)); ctx.fillText(`↓ ${Math.round(s.v / o.steps[i - 1].v * 100)}%`, nx + vw + 30 * u, y + th / 2 + 18 * u); }
      ctx.restore();
    });
  }

  // 雷达图：六边形蛛网先张开，旧版本（白）和新版本（强调色）两块多边形依次撑开
  // o = { kicker, title, axes: [..], a: { label, v: [0–1, ..] }, b: {..}, start = .15 }
  function radar(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, bx = box(K), st = o.start ?? .15, n = o.axes.length, R = (LAND ? 225 : 300) * u, cx = LAND ? W * .42 : W / 2, cy = bx.y + bx.h / 2 - (LAND ? 0 : 80 * u);
    const P = (i, r) => { const a = -Math.PI / 2 + TAU * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }, we = eOutCubic(inv(0, .35, t));
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5 * u;
    for (let k = 1; k <= 4; k++) { ctx.beginPath(); for (let i = 0; i <= n; i++) { const [x, y] = P(i % n, R * k / 4 * we); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    for (let i = 0; i < n; i++) { const [x, y] = P(i, R * we); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.globalAlpha = we; ctx.fillStyle = K.muted; ctx.font = F(K, 700, 30);
    o.axes.forEach((l, i) => { const [x, y] = P(i, R + 52 * u); center(ctx, l, x, y + 10 * u); });
    ctx.restore();
    const poly = (v, e, hot) => {
      if (e <= 0) return; ctx.save(); ctx.beginPath(); v.forEach((r, i) => { const [x, y] = P(i, R * r * e); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
      ctx.fillStyle = hot ? K.a(.3) : 'rgba(255,255,255,.1)'; ctx.fill(); ctx.strokeStyle = hot ? K.a(1) : 'rgba(255,255,255,.55)'; ctx.lineWidth = 3 * u;
      if (hot) { ctx.shadowColor = K.a(.9); ctx.shadowBlur = 24 * u; } ctx.stroke(); ctx.shadowBlur = 0;
      if (hot) v.forEach((r, i) => { const [x, y] = P(i, R * r * e); ctx.fillStyle = K.hi; ctx.beginPath(); ctx.arc(x, y, 7 * u, 0, TAU); ctx.fill(); });
      ctx.restore();
    };
    poly(o.a.v, eOutCubic(inv(st, st + .4, t)), false); poly(o.b.v, eOutBack(inv(st + .3, st + .75, t)), true);
    [[o.a, false], [o.b, true]].forEach(([s, hot], i) => {
      const e = pop(t - st - i * .3, .4); if (e <= 0) return;
      const lx = LAND ? W * .66 : bx.x + 40 * u + i * 420 * u, ly = LAND ? cy - 40 * u + i * 90 * u : bx.y + bx.h - 20 * u;
      ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = hot ? K.a(1) : 'rgba(255,255,255,.4)'; rr(ctx, lx, ly - 22 * u, 44 * u, 30 * u, 8 * u); ctx.fill();
      ctx.fillStyle = hot ? K.ink : K.muted; ctx.font = F(K, 700, 40); ctx.fillText(s.label, lx + 70 * u, ly + 4 * u); ctx.restore();
    });
  }

  // 思维导图：中心一个节点，六条分支沿曲线长出去，每条末端一个标签，再分出两片小叶子
  // o = { center, branches: [{ label, leaves: [..] }], start = .15, every = .1 }
  function mindmap(ctx, K, t, o) {
    const u = K.u, cx = W / 2, cy = H * (LAND ? .5 : .47), st = o.start ?? .15, ev = o.every ?? .1, n = o.branches.length, rx = (LAND ? 500 : 330) * u, ry = (LAND ? 260 : 520) * u;
    o.branches.forEach((br, i) => {
      const a = -Math.PI / 2 + TAU * (i + .5) / n, ca = Math.cos(a), sa = Math.sin(a), ex = cx + ca * rx, ey = cy + sa * ry, lt = t - st - i * ev, p = eOutCubic(inv(0, .3, lt));
      if (p <= 0) return;
      const qx = cx + ca * rx * .55, qy = cy + sa * ry * .15;
      ctx.save(); ctx.strokeStyle = K.a(.75); ctx.lineWidth = 4 * u; ctx.lineCap = 'round'; ctx.beginPath();
      for (let k = 0; k <= 20 * p; k++) { const s = k / 20, q = 1 - s; const x = q * q * cx + 2 * q * s * qx + s * s * ex, y = q * q * cy + 2 * q * s * qy + s * s * ey; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
      const e = pop(lt - .2, .35); if (e <= 0) return;
      (br.leaves || []).forEach((lf, j) => {
        const le = pop(lt - .32 - j * .06, .3); if (le <= 0) return;
        const side = ca >= 0 ? 1 : -1, lx = ex + side * 190 * u, ly = ey + (j ? 1 : -1) * 46 * u;
        ctx.save(); ctx.globalAlpha = le; ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(ex + side * 80 * u, ey); ctx.lineTo(lerp(ex + side * 80 * u, lx, le), lerp(ey, ly, le)); ctx.stroke();
        ctx.fillStyle = K.a(1); ctx.beginPath(); ctx.arc(lx, ly, 6 * u, 0, TAU); ctx.fill();
        ctx.fillStyle = K.muted; ctx.font = F(K, 700, 26); ctx.textAlign = side > 0 ? 'left' : 'right'; ctx.fillText(lf, lx + side * 16 * u, ly + 9 * u); ctx.restore();
      });
      ctx.save(); ctx.globalAlpha = e; ctx.font = F(K, 900, 40); const w = ctx.measureText(br.label).width + 60 * u, h = 76 * u;
      ctx.translate(ex, ey); ctx.scale(lerp(.6, 1, e), lerp(.6, 1, e)); rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = '#161622'; ctx.fill();
      ctx.strokeStyle = K.a(.9); ctx.lineWidth = 2.5 * u; ctx.stroke(); ctx.fillStyle = K.ink; center(ctx, br.label, 0, 14 * u); ctx.restore();
    });
    const ce = pop(t, .4); if (ce <= 0) return;
    ctx.save(); ctx.globalAlpha = ce; ctx.font = F(K, 900, 52); const w = ctx.measureText(o.center).width + 150 * u, h = 110 * u;
    ctx.translate(cx, cy); ctx.scale(lerp(.6, 1, ce), lerp(.6, 1, ce)); ctx.shadowColor = K.a(.8); ctx.shadowBlur = 50 * u; rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = K.a(1); ctx.fill(); ctx.shadowBlur = 0;
    logo(ctx, K, -w / 2 + 58 * u, 0, 50 * u); ctx.fillStyle = K.bg0; ctx.fillText(o.center, -w / 2 + 104 * u, 18 * u); ctx.restore();
  }

  // 网格卡片：一组卡片依次翻过来（背面是强调色，翻到一半换成正面），正面一个图标字、一行名字
  // o = { kicker, title, items: [{ icon, label }], start = .1, every = .08 }
  function grid(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), n = o.items.length, cols = LAND ? 3 : 2, rows = Math.ceil(n / cols), gap = 26 * u, st = o.start ?? .1, ev = o.every ?? .08;
    const cw = (b.w - (cols - 1) * gap) / cols, ch = (b.h - (rows - 1) * gap) / rows;
    o.items.forEach((it, i) => {
      if (t < st + i * ev) return;
      const f = eInOutCubic(inv(st + i * ev, st + i * ev + .4, t)), sx = Math.max(.001, Math.abs(Math.cos(Math.PI * (1 - f)))), front = f > .5;
      const x = b.x + (i % cols) * (cw + gap), y = b.y + Math.floor(i / cols) * (ch + gap);
      ctx.save(); ctx.translate(x + cw / 2, y + ch / 2); ctx.transform(sx, (1 - sx) * .14 * (front ? -1 : 1), 0, 1, 0, 0); ctx.translate(-cw / 2, -ch / 2);
      if (!front) { rr(ctx, 0, 0, cw, ch, 24 * u); ctx.fillStyle = K.a(1); ctx.fill(); logo(ctx, K, cw / 2, ch / 2, 60 * u); }
      else {
        glass(ctx, K, 0, 0, cw, ch, 24);
        ctx.fillStyle = K.a(1); ctx.font = F(K, 400, 84, NUMF(K)); ctx.fillText(it.icon, 40 * u, ch * .52);
        ctx.fillStyle = K.ink; ctx.font = F(K, 700, LAND ? 38 : 34); ctx.fillText(it.label, 40 * u, ch - 40 * u);
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.font = F(K, 700, 20, MONO(K)); ctx.textAlign = 'right'; ctx.fillText(String(i + 1).padStart(2, '0'), cw - 30 * u, 44 * u);
      }
      ctx.fillStyle = `rgba(0,0,0,${.45 * (1 - sx)})`; rr(ctx, 0, 0, cw, ch, 24 * u); ctx.fill();
      ctx.restore();
    });
  }

  // 表格逐格填：突出的一列先铺一条强调色底，表头出来，格子按行一格格填上（'✓' 画成勾，'—' 是没有，其余照写）
  // o = { kicker, title, cols: [..], rows: [{ label, cells: [..] }], hot, start = .15, every = .035 }
  function table(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), nc = o.cols.length, nr = o.rows.length + 1, st = o.start ?? .15, ev = o.every ?? .035, hot = o.hot ?? nc - 1;
    const lw = b.w * (LAND ? .3 : .32), cw = (b.w - lw) / nc, rh = b.h / nr, he = eOutCubic(inv(0, .3, t)), cxs = c => b.x + lw + c * cw + cw / 2;
    ctx.save(); rr(ctx, b.x + lw + hot * cw + 8 * u, b.y, cw - 16 * u, b.h * he, 20 * u); ctx.fillStyle = K.a(.14); ctx.fill(); ctx.strokeStyle = K.a(.7 * he); ctx.lineWidth = 2 * u; ctx.stroke(); ctx.restore();
    o.cols.forEach((c, i) => { ctx.save(); ctx.globalAlpha = pop(t - i * .04, .3); ctx.fillStyle = i === hot ? K.ink : K.muted; ctx.font = F(K, 900, LAND ? 34 : 30); center(ctx, c, cxs(i), b.y + rh / 2 + 12 * u); ctx.restore(); });
    o.rows.forEach((r, ri) => {
      const y = b.y + (ri + 1) * rh, re = pop(t - st - ri * nc * ev, .3); if (re <= 0) return;
      ctx.fillStyle = `rgba(255,255,255,${.08 * re})`; ctx.fillRect(b.x, y, b.w * re, 1.5 * u);
      ctx.save(); ctx.globalAlpha = re; ctx.fillStyle = K.ink; ctx.font = F(K, 700, LAND ? 34 : 30); ctx.fillText(r.label, b.x + 20 * u, y + rh / 2 + 12 * u); ctx.restore();
      r.cells.forEach((v, c) => {
        const e = pop(t - st - (ri * nc + c) * ev, .25); if (e <= 0) return;
        const x = cxs(c), cy = y + rh / 2, on = c === hot;
        ctx.save(); ctx.globalAlpha = e;
        if (v === '✓') { ctx.strokeStyle = on ? K.a(1) : K.ink; ctx.lineWidth = 6 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (on) { ctx.shadowColor = K.a(.9); ctx.shadowBlur = 16 * u; }
          ctx.translate(x, cy); ctx.scale(e, e); ctx.beginPath(); ctx.moveTo(-18 * u, 0); ctx.lineTo(-5 * u, 13 * u); ctx.lineTo(20 * u, -15 * u); ctx.stroke(); }
        else if (v === '—') { ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x - 14 * u, cy - 2 * u, 28 * u, 4 * u); }
        else { ctx.fillStyle = on ? K.ink : K.muted; ctx.font = F(K, 700, 30); center(ctx, v, x, cy + 11 * u); }
        ctx.restore();
      });
    });
  }

  // 维恩图：两个圆从两边滑到一起，重叠的那一块亮成强调色，中间的名字弹出来
  // o = { kicker, a, b, mid, start = .1 }
  function venn(ctx, K, t, o) {
    const u = K.u, cx = W / 2, cy = H * (LAND ? .54 : .48), R = (LAND ? 290 : 270) * u, st = o.start ?? .1, m = eInOutCubic(inv(st, st + .55, t)), e = pop(t, .35);
    const d = lerp(LAND ? W * .34 : W * .3, R * .55, m), ax = cx - d, bx = cx + d;
    if (o.kicker) kicker(ctx, K, o.kicker, cx, cy - R - 50 * u, e, 'center');
    ctx.save(); ctx.globalAlpha = e;
    [ax, bx].forEach(x => { ctx.beginPath(); ctx.arc(x, cy, R, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 3 * u; ctx.stroke(); });
    const ov = smooth(st + .45, st + .7, t);
    if (ov > 0) { ctx.save(); ctx.beginPath(); ctx.arc(ax, cy, R, 0, TAU); ctx.clip(); ctx.beginPath(); ctx.arc(bx, cy, R, 0, TAU); ctx.fillStyle = K.a(.9 * ov); ctx.shadowColor = K.a(1); ctx.shadowBlur = 60 * u; ctx.fill(); ctx.restore(); }
    ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 60 : 50); center(ctx, o.a, ax - R * .48, cy + 20 * u); center(ctx, o.b, bx + R * .48, cy + 20 * u);
    const me = pop(t - st - .62, .35);
    if (me > 0) { ctx.save(); ctx.translate(cx, cy); ctx.scale(lerp(.5, 1, me), lerp(.5, 1, me)); ctx.globalAlpha = e * me; ctx.fillStyle = K.bg0; ctx.font = F(K, 900, LAND ? 44 : 38); center(ctx, o.mid, 0, 15 * u); ctx.restore(); }
    ctx.restore();
  }

  // 卡片堆叠翻页：一摞卡片，最上面一张按拍往上翻走（带一点旋转），后面的往前补位
  // o = { cards: [{ tag, title, sub }], start = .25, every = .4 }
  function stack(ctx, K, t, o) {
    const u = K.u, n = o.cards.length, st = o.start ?? .25, ev = o.every ?? .4, cw = (LAND ? 920 : 840) * u, ch = (LAND ? 500 : 640) * u, cx = W / 2, cy = H * (LAND ? .53 : .46), e = pop(t, .4);
    const gone = i => i < n - 1 ? eInCubic(inv(st + i * ev, st + i * ev + .3, t)) : 0;
    for (let i = n - 1; i >= 0; i--) {
      const g = gone(i); if (g >= 1) continue;
      let depth = i; for (let j = 0; j < i; j++) depth -= gone(j);
      ctx.save(); ctx.globalAlpha = e * clamp(1.3 - depth * .3); ctx.translate(cx, cy - depth * 30 * u + (1 - e) * 80 * u - g * H * .8); ctx.rotate(-g * .4); const s = 1 - depth * .05; ctx.scale(s, s);
      rr(ctx, -cw / 2, -ch / 2, cw, ch, 32 * u); ctx.fillStyle = '#14141f'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40 * u; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = depth < .5 ? K.a(.8) : K.faint; ctx.lineWidth = 2 * u; ctx.stroke();
      const c = o.cards[i], x0 = -cw / 2 + 56 * u;
      ctx.fillStyle = K.a(1); ctx.font = F(K, 700, 22, MONO(K)); ctx.fillText(c.tag, x0, -ch / 2 + 74 * u);
      ctx.fillStyle = K.muted; ctx.textAlign = 'right'; ctx.fillText(`${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`, cw / 2 - 56 * u, -ch / 2 + 74 * u); ctx.textAlign = 'left';
      const mw = LAND ? 340 * u : cw - 112 * u, mh = mw * 9 / 16, mx = LAND ? cw / 2 - 56 * u - mw : x0, my = LAND ? -mh / 2 + 20 * u : -ch / 2 + 110 * u;
      mini(ctx, K, mx, my, mw, mh, LAND ? (i + .6) / n : (i + .6) / n);
      const ty = LAND ? 30 * u : my + mh + 110 * u;
      ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 84 : 72); ctx.fillText(c.title, x0, ty);
      ctx.fillStyle = K.muted; ctx.font = F(K, 700, LAND ? 32 : 30); ctx.fillText(c.sub, x0, ty + 66 * u);
      ctx.restore();
    }
  }

  // 问答翻转卡：一张卡正面是问题，到点绕竖轴翻到背面（强调色）是答案
  // o = { q, a, flip = .55 }
  function qa(ctx, K, t, o) {
    const u = K.u, cw = (LAND ? 1040 : 860) * u, ch = (LAND ? 470 : 640) * u, cx = W / 2, cy = H * (LAND ? .52 : .46), fl = o.flip ?? .55;
    const e = pop(t, .4), f = eInOutCubic(inv(fl, fl + .35, t)), sx = Math.max(.001, Math.abs(Math.cos(Math.PI * f))), back = f > .5;
    ctx.save(); ctx.globalAlpha = e; ctx.translate(cx, cy + (1 - e) * 60 * u); ctx.transform(sx, (1 - sx) * .12 * (back ? -1 : 1), 0, 1, 0, 0);
    rr(ctx, -cw / 2, -ch / 2, cw, ch, 36 * u); ctx.shadowColor = back ? K.a(.6) : 'rgba(0,0,0,.6)'; ctx.shadowBlur = 60 * u;
    ctx.fillStyle = back ? K.a(1) : '#14141f'; ctx.fill(); ctx.shadowBlur = 0; if (!back) { ctx.strokeStyle = K.faint; ctx.lineWidth = 2 * u; ctx.stroke(); }
    ctx.fillStyle = back ? 'rgba(5,5,10,.3)' : K.a(1); ctx.font = F(K, 400, 180, K.num); ctx.fillText(back ? 'A' : 'Q', -cw / 2 + 60 * u, -ch / 2 + 190 * u);
    ctx.fillStyle = back ? K.bg0 : K.ink; ctx.font = F(K, 900, LAND ? 70 : 64);
    wrapCJK(ctx, back ? o.a : o.q, cw - 120 * u).forEach((l, j) => ctx.fillText(l, -cw / 2 + 60 * u, (LAND ? 70 : 60) * u + j * 86 * u));
    ctx.fillStyle = `rgba(0,0,0,${.5 * (1 - sx)})`; rr(ctx, -cw / 2, -ch / 2, cw, ch, 36 * u); ctx.fill();
    ctx.restore();
  }

  // 中英对照卡：中文一行被遮罩从左往右擦出来，一条强调色细线伸出，英文带着收紧的字距从右边滑进
  // o = { kicker, zh, en }
  function bilingual(ctx, K, t, o) {
    const u = K.u, x = LAND ? W * .12 : 90 * u, y1 = H * (LAND ? .47 : .42), w = W - x * 2, p = eOutCubic(inv(.05, .45, t));
    if (o.kicker) kicker(ctx, K, o.kicker, x + 46 * u, y1 - (LAND ? 170 : 150) * u, pop(t, .4));
    ctx.save(); ctx.beginPath(); ctx.rect(x - 10 * u, 0, (w + 20 * u) * p, H); ctx.clip();
    ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 136 : 100); ctx.fillText(o.zh, x, y1); ctx.restore();
    if (p > 0 && p < 1) { ctx.fillStyle = K.a(1); ctx.shadowColor = K.a(1); ctx.shadowBlur = 20 * u; ctx.fillRect(x - 10 * u + (w + 20 * u) * p, y1 - 130 * u, 6 * u, 160 * u); ctx.shadowBlur = 0; }
    ctx.fillStyle = K.a(1); ctx.fillRect(x, y1 + 50 * u, w * .25 * pop(t - .3, .4), 5 * u);
    const e = pop(t - .4, .5); if (e <= 0) return;
    ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = K.hi; ctx.font = F(K, 400, LAND ? 120 : 84, K.num); if ('letterSpacing' in ctx) ctx.letterSpacing = `${lerp(40, 6, e) * u}px`;
    ctx.fillText(o.en, x + (1 - e) * 200 * u, y1 + (LAND ? 190 : 150) * u); ctx.restore();
  }

  // 大字透视：一个巨大的词当成窗口，窗口里是正在播放的片子；词从大处慢慢缩回原大，描一圈强调色的边
  // o = { word, sub }
  function reveal(ctx, K, t, o) {
    const u = K.u, cx = W / 2, cy = H * (LAND ? .5 : .45), px = LAND ? 560 : 400, s = lerp(1.35, 1, eOutCubic(inv(0, 1.2, t))), e = pop(t, .3);
    const oc = off(); mini(oc, K, 0, 0, W, H, (t * .45) % 1); oc.globalCompositeOperation = 'source-atop'; sweep(oc, 0, 0, W, H, (t * .9) % 1, .5);
    oc.globalCompositeOperation = 'destination-in'; oc.font = F(K, 400, px, K.num); oc.textAlign = 'center'; oc.textBaseline = 'middle';
    oc.save(); oc.translate(cx, cy); oc.scale(s, s); oc.fillText(o.word, 0, 0); oc.restore(); oc.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha = e; ctx.drawImage(OFF, 0, 0);
    ctx.translate(cx, cy); ctx.scale(s, s); ctx.strokeStyle = K.a(1); ctx.lineWidth = 3 * u / s; ctx.shadowColor = K.a(1); ctx.shadowBlur = 24 * u; ctx.font = F(K, 400, px, K.num); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeText(o.word, 0, 0);
    ctx.restore();
    const se = pop(t - .5, .4);
    if (o.sub && se > 0) { ctx.save(); ctx.globalAlpha = se; ctx.fillStyle = K.ink; ctx.font = F(K, 700, LAND ? 42 : 40); center(ctx, o.sub, cx, cy + px * .42 * u + 40 * u + (1 - se) * 20 * u); ctx.restore(); }
  }

  // 三栏价格方案：卡片依次升起，突出的一张更高、描强调色边、头上一条「推荐」；价格数字跟着数；返回突出那张的位置，给印章用
  // o = { kicker, title, plans: [{ name, price, unit, feats: [..], hot }], ribbon = '推荐', start = .1, every = .12 }
  function plans(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), n = o.plans.length, gap = 30 * u, st = o.start ?? .1, ev = o.every ?? .12;
    const cw = LAND ? (b.w * .9 - (n - 1) * gap) / n : b.w, x0 = LAND ? W / 2 - (n * cw + (n - 1) * gap) / 2 : b.x;
    let hotR = null;
    o.plans.forEach((p, i) => {
      const hot = !!p.hot, ex = LAND && hot ? 24 * u : 0, ch = LAND ? b.h + ex * 2 : (b.h - (n - 1) * gap) / n;
      const x = LAND ? x0 + i * (cw + gap) : x0, y = LAND ? b.y - ex : b.y + i * (ch + gap); if (hot) hotR = { x, y, w: cw, h: ch };
      const e = pop(t - st - i * ev, .45); if (e <= 0) return;
      ctx.save(); ctx.globalAlpha = e; ctx.translate(0, (1 - e) * 90 * u); glass(ctx, K, x, y, cw, ch, 26);
      if (hot) {
        ctx.save(); ctx.shadowColor = K.a(.7); ctx.shadowBlur = 50 * u; rr(ctx, x, y, cw, ch, 26 * u); ctx.strokeStyle = K.a(1); ctx.lineWidth = 3 * u; ctx.stroke(); ctx.restore();
        ctx.font = F(K, 700, 22, MONO(K)); const rw = ctx.measureText(o.ribbon || '推荐').width + 44 * u;
        rr(ctx, x + cw / 2 - rw / 2, y - 22 * u, rw, 44 * u, 22 * u); ctx.fillStyle = K.a(1); ctx.fill(); ctx.fillStyle = K.bg0; center(ctx, o.ribbon || '推荐', x + cw / 2, y + 8 * u);
      }
      ctx.fillStyle = hot ? K.a(1) : K.muted; ctx.font = F(K, 700, 34); ctx.fillText(p.name, x + 40 * u, y + 76 * u);
      const v = count(p.price * eOutExpo(inv(0, .6, t - st - i * ev)), 0);
      if (hot) glowNum(ctx, K, v, x + 40 * u, y + 196 * u, 120, 1, 'left'); else { ctx.fillStyle = K.ink; ctx.font = F(K, 400, 120, K.num); ctx.fillText(v, x + 40 * u, y + 196 * u); }
      ctx.font = F(K, 400, 120, K.num); const vw = ctx.measureText(v).width; ctx.fillStyle = K.muted; ctx.font = F(K, 700, 28); ctx.fillText(p.unit || '', x + 56 * u + vw, y + 196 * u);
      if (LAND) p.feats.forEach((f, j) => {
        const fe = pop(t - st - i * ev - .2 - j * .06, .3), fy = y + 270 * u + j * 60 * u; if (fe <= 0) return;
        ctx.globalAlpha = e * fe; ctx.strokeStyle = hot ? K.a(1) : 'rgba(255,255,255,.5)'; ctx.lineWidth = 4 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(x + 42 * u, fy - 10 * u); ctx.lineTo(x + 52 * u, fy); ctx.lineTo(x + 68 * u, fy - 18 * u); ctx.stroke();
        ctx.fillStyle = hot ? K.ink : K.muted; ctx.font = F(K, 700, 30); ctx.fillText(f, x + 90 * u, fy); ctx.globalAlpha = e;
      });
      ctx.restore();
    });
    return hotR;
  }

  // 打钩印章（叠加）：一个圆章从画面外猛地盖到目标右上角，落下时一抖、溅出几道短线，章里一个大勾和一行字
  // o = { x, y, w, h, label }
  function stamp(ctx, K, t, o) {
    if (t < 0) return;
    const u = K.u, R = 92 * u, cx = o.x + o.w - R * .5, cy = o.y + R * .75, k = inv(0, .14, t), l = t - .14, sh = l > 0 ? Math.exp(-l * 18) * Math.sin(l * 70) * 8 * u : 0;
    if (l > 0 && l < .3) { ctx.save(); ctx.strokeStyle = K.a(.8 * (1 - l / .3)); ctx.lineWidth = 4 * u; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) { const a = TAU * i / 10 + .3, r1 = R + 10 * u + l * 300 * u; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * (r1 + 26 * u), cy + Math.sin(a) * (r1 + 26 * u)); ctx.stroke(); } ctx.restore(); }
    ctx.save(); ctx.translate(cx + sh, cy); ctx.rotate(-.22); const sc = lerp(2.4, 1, k * k); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 2.5);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fillStyle = 'rgba(5,5,10,.7)'; ctx.fill(); ctx.strokeStyle = K.a(1); ctx.lineWidth = 6 * u; ctx.stroke();
    ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(0, 0, R - 14 * u, 0, TAU); ctx.stroke();
    ctx.strokeStyle = K.hi; ctx.lineWidth = 12 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-36 * u, -12 * u); ctx.lineTo(-10 * u, 14 * u); ctx.lineTo(38 * u, -36 * u); ctx.stroke();
    if (o.label) { ctx.fillStyle = K.a(1); ctx.font = F(K, 900, 24); center(ctx, o.label, 0, 54 * u); }
    ctx.restore();
  }

  // 价格标签：一张吊牌从上面荡下来（阻尼摆动），落定时一圈放射线和火花，牌上一个巨大的价格
  // o = { price, label }
  function priceTag(ctx, K, t, o) {
    const u = K.u, cx = W / 2, top = H * (LAND ? .08 : .14), L = (LAND ? 150 : 220) * u, tw = (LAND ? 560 : 600) * u, th = (LAND ? 400 : 440) * u;
    const d = eOutCubic(inv(0, .3, t)), sw = t > .3 ? Math.exp(-(t - .3) * 4.5) * Math.sin((t - .3) * 12) * .3 : .3 * (1 - d), l = t - .3, tcy = top + L + th / 2;
    if (l > 0 && l < .8) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const f = l / .8;
      for (let i = 0; i < 18; i++) { const a = TAU * i / 18, r1 = tw * .5 + f * 360 * u; ctx.strokeStyle = K.a(.7 * (1 - f)); ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, tcy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * (r1 + 70 * u * (1 - f)), tcy + Math.sin(a) * (r1 + 70 * u * (1 - f))); ctx.stroke(); }
      for (let i = 0; i < 28; i++) { const a = rnd(i, 9) * TAU, v = (500 + 700 * rnd(i, 10)) * u, x = cx + Math.cos(a) * v * l, y = tcy + Math.sin(a) * v * l + 900 * u * l * l; ctx.fillStyle = i % 3 ? K.a(1 - f) : `rgba(255,255,255,${1 - f})`; ctx.fillRect(x - 3 * u, y - 3 * u, 6 * u, 6 * u); }
      ctx.restore();
    }
    ctx.save(); ctx.translate(cx, top + lerp(-H * .7, 0, d)); ctx.rotate(sw);
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, L + 44 * u); ctx.stroke();
    ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(0, 0, 9 * u, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(0, L, 0, L + th); g.addColorStop(0, K.hi); g.addColorStop(1, K.a(1));
    ctx.shadowColor = K.a(.8); ctx.shadowBlur = 60 * u; rr(ctx, -tw / 2, L, tw, th, 44 * u); ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = K.bg0; ctx.beginPath(); ctx.arc(0, L + 44 * u, 16 * u, 0, TAU); ctx.fill();
    ctx.font = F(K, 400, LAND ? 250 : 270, NUMF(K)); center(ctx, o.price, 0, L + th * .7);
    if (o.label) { ctx.font = F(K, 900, 40); center(ctx, o.label, 0, L + th - 44 * u); }
    ctx.restore();
  }

  // 层：粒子。一层很淡的微尘缓慢上飘、忽明忽暗，远近两种速度做出纵深（冷开里收拢成标志的那团粒子是冷开自己的）
  function dust(ctx, K, t, o = {}) {
    const u = K.u, n = o.n || 70, hh = H + 40 * u;
    for (let i = 0; i < n; i++) {
      const far = i % 3 !== 0, sp = (far ? 18 : 46) * u, x = rnd(i, 7) * W + Math.sin(t * .3 + i) * 20 * u, y = (((rnd(i, 8) * hh - t * sp) % hh) + hh) % hh - 20 * u;
      const a = (far ? .12 : .26) * (.6 + .4 * Math.sin(t * 2 + i * 1.7)), r = (far ? 1.4 : 2.6) * u;
      ctx.fillStyle = i % 7 ? `rgba(255,255,255,${a})` : K.a(a * 1.6); ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  // 转场四：缩放穿越。旧画面放大冲出、变淡，新画面从小处推到原大，中间一圈放射的速度线
  function zoom(ctx, K, p, drawA, drawB) {
    p = clamp(p);
    ctx.save(); const sa = lerp(1, 1.8, eInCubic(clamp(p * 1.3))); ctx.translate(W / 2, H / 2); ctx.scale(sa, sa); ctx.translate(-W / 2, -H / 2); drawA(ctx); ctx.restore();
    const o = off2(); drawB(o);
    ctx.save(); ctx.globalAlpha = smooth(.25, .7, p); const sb = lerp(.6, 1, eOutCubic(inv(.2, 1, p))); ctx.translate(W / 2, H / 2); ctx.scale(sb, sb); ctx.drawImage(OFF2, -W / 2, -H / 2); ctx.restore();
    const k = Math.sin(Math.PI * p); if (k <= .01) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,255,255,${.35 * k})`; ctx.lineWidth = 2 * K.u;
    for (let i = 0; i < 48; i++) { const a = TAU * i / 48 + rnd(i, 11) * .1, r1 = LONG * (.18 + .1 * rnd(i, 12)), r2 = r1 + LONG * .35 * k; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1); ctx.lineTo(W / 2 + Math.cos(a) * r2, H / 2 + Math.sin(a) * r2); ctx.stroke(); }
    ctx.restore();
  }
  // 转场五：遮罩擦除。新画面从中心一个圆里撑开，圆边是一圈强调色的光
  function wipe(ctx, K, p, drawA, drawB) {
    const e = eInOutCubic(clamp(p)), r = e * Math.hypot(W, H) / 2;
    drawA(ctx); ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, TAU); ctx.clip(); drawB(ctx); ctx.restore();
    ctx.save(); ctx.strokeStyle = K.a(.9 * Math.sin(Math.PI * e)); ctx.lineWidth = 6 * K.u; ctx.shadowColor = K.a(1); ctx.shadowBlur = 30 * K.u; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, TAU); ctx.stroke(); ctx.restore();
  }
  // 转场六：闪白。前半段还是旧画面、后半段已是新画面，切点上一下白闪
  function flashCut(ctx, K, p, drawA, drawB) {
    (p < .5 ? drawA : drawB)(ctx); ctx.fillStyle = `rgba(255,255,255,${.85 * Math.sin(Math.PI * clamp(p))})`; ctx.fillRect(0, 0, W, H);
  }
  // 转场七：翻转（伪三维）。整个画面绕竖轴翻过去：旧画面压扁成一条线，新画面从线展开，用一点斜切和变暗模拟近大远小
  function flip(ctx, K, p, drawA, drawB) {
    const e = eInOutCubic(clamp(p)), a = e < .5, sx = Math.max(.001, Math.abs(Math.cos(Math.PI * e)));
    ctx.fillStyle = K.bg0; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.transform(sx, (1 - sx) * .15 * (a ? 1 : -1), 0, 1, 0, 0); ctx.translate(-W / 2, -H / 2); (a ? drawA : drawB)(ctx);
    ctx.fillStyle = `rgba(0,0,0,${.55 * (1 - sx)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  // 层：角标。左上标志加品牌名，右上当前第几章；al 由分镜表算（片头、片尾、章节卡淡出）
  // o = { brand, ch: { n, of, title } | null, al }
  function corner(ctx, K, t, o) {
    if (!(o.al > 0)) return;
    const u = K.u, m = LAND ? 64 * u : 80 * u, y = LAND ? 64 * u : H * .055;
    ctx.save(); ctx.globalAlpha = o.al;
    logo(ctx, K, m + 17 * u, y, 34 * u);
    ctx.fillStyle = K.ink; ctx.font = F(K, 700, 26); ctx.fillText(o.brand, m + 50 * u, y + 9 * u);
    if (o.ch) {
      ctx.textAlign = 'right'; ctx.font = F(K, 700, 20, MONO(K)); ctx.fillStyle = K.muted;
      const s = `${String(o.ch.n).padStart(2, '0')} / ${String(o.ch.of).padStart(2, '0')}`;
      ctx.fillText(s, W - m, y + 7 * u);
      const sw = ctx.measureText(s).width; ctx.font = F(K, 700, 24); ctx.fillStyle = K.ink; ctx.fillText(o.ch.title, W - m - sw - 22 * u, y + 8 * u);
      ctx.fillStyle = K.a(1); ctx.fillRect(W - m - sw, y + 20 * u, sw * .5, 3 * u);
    }
    ctx.restore();
  }

  // 转场二：推移。旧画面整帧往左（竖屏往上）推走，新画面跟着进来，接缝上一道强调色细线
  function push(ctx, K, p, drawA, drawB) {
    const e = eInOutCubic(clamp(p)), d = LAND ? W : H, o = d * e;
    ctx.save(); LAND ? ctx.translate(-o, 0) : ctx.translate(0, -o); drawA(ctx); ctx.restore();
    ctx.save(); LAND ? ctx.translate(d - o, 0) : ctx.translate(0, d - o); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); drawB(ctx); ctx.restore();
    const k = Math.sin(Math.PI * e); ctx.save(); ctx.fillStyle = K.a(.9 * k); ctx.shadowColor = K.a(1); ctx.shadowBlur = 30 * K.u;
    LAND ? ctx.fillRect(d - o - 2 * K.u, 0, 4 * K.u, H) : ctx.fillRect(0, d - o - 2 * K.u, W, 4 * K.u); ctx.restore();
  }
  // 转场三：叠化。新画面从 1.04 倍缩回原大并淡入，叠在旧画面上；两边都带背景，不会淡到黑
  function dissolve(ctx, K, p, drawA, drawB) {
    const e = eInOutCubic(clamp(p));
    drawA(ctx);
    drawB(off2());
    ctx.save(); ctx.globalAlpha = e; const s = lerp(1.04, 1, e); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.drawImage(OFF2, -W / 2, -H / 2); ctx.restore();
  }

  return { theme, backdrop, glass, sweep, kicker, title, explain, data, transition, caption, pop,
    head, logo, mini, chapter, code, callout, line, ring, compare, bigNumber, quote, lower, timeline, outro,
    coldOpen, slam, flash, marquee, search, cursor, chat, terminal, flow, devices, magnify, toast, flipboard, gauge, race, strike,
    dotmap, heat, scatter, scribble, funnel, radar, mindmap, grid, table, venn, stack, qa, bilingual, reveal, plans, stamp, priceTag,
    corner, dust, push, dissolve, zoom, wipe, flashCut, flip };
})();
