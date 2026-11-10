// 暗色科技发布会风格包（由 C-044 沉淀）：一个主题，段部件（片头、章节卡、讲解、代码、标注、界面框、柱状和大数字、折线、占比环、
// 对比、大数字、引用、信息条、列表、时间线、片尾），层（背景、角标、字幕，转场三种：光边、推移、叠化）。
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

  // ———— 以下是完整演示片（60–90 秒）用的部件：上面五个照旧，15 秒切换片段只用它们 ————
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

  // ⑨ 界面框：应用窗口里一边预览一边渲染，帧数、进度条、胶片格跟着走
  // o = { kicker, title, label, total, start = .6, secs = 3.6 }
  function device(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), ce = pop(t - .15, .7); if (ce <= 0) return;
    const y = b.y + (1 - ce) * 80 * u, p = eInOutCubic(inv(o.start ?? .6, (o.start ?? .6) + (o.secs || 3.6), t));
    ctx.save(); ctx.globalAlpha = ce; glass(ctx, K, b.x, y, b.w, b.h); ctx.clip();
    chrome(ctx, K, b.x, y, null);
    rr(ctx, b.x + 150 * u, y + 20 * u, Math.min(520 * u, b.w - 200 * u), 32 * u, 16 * u); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fill();
    ctx.fillStyle = K.muted; ctx.font = F(K, 700, 18, MONO(K)); ctx.fillText(o.label || 'render', b.x + 172 * u, y + 42 * u);
    ctx.fillStyle = K.faint; ctx.fillRect(b.x, y + 72 * u, b.w, 1.5 * u);
    // 预览：窗口里放一支小片子（标志和三根柱子），播放到哪儿跟着进度
    const pw = LAND ? b.w * .58 : b.w - 80 * u, ph = pw * 9 / 16, px = b.x + 40 * u, py = y + 104 * u;
    rr(ctx, px, py, pw, ph, 16 * u); ctx.fillStyle = K.bg0; ctx.fill(); ctx.strokeStyle = K.faint; ctx.lineWidth = 1.5 * u; ctx.stroke();
    ctx.save(); rr(ctx, px, py, pw, ph, 16 * u); ctx.clip();
    const g = ctx.createRadialGradient(px + pw / 2, py + ph * .4, 0, px + pw / 2, py + ph * .4, pw * .6); g.addColorStop(0, K.a(.22)); g.addColorStop(1, K.a(0));
    ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
    const q = p >= 1 ? 1 : (p * 3) % 1, scene = Math.min(2, Math.floor(p * 3));
    if (scene === 0) logo(ctx, K, px + pw / 2, py + ph / 2, ph * .3, pop(q * 1.6, .5));
    else for (let i = 0; i < 3; i++) {
      const hh = ph * .55 * [.3, .55, 1][i] * eOutCubic(inv(i * .15, i * .15 + .4, q)), bw = pw * .1;
      ctx.fillStyle = i === 2 ? K.a(1) : 'rgba(255,255,255,.3)'; ctx.fillRect(px + pw * (.3 + i * .16), py + ph * .8 - hh, bw, hh);
    }
    if (scene === 2) glowNum(ctx, K, '4.2×', px + pw * .5, py + ph * .3, 90, smooth(.2, .5, q));
    ctx.restore();
    // 右边（竖屏在下）：帧数、画幅、剩余时间
    const total = o.total || 2400, fr = Math.round(total * p);
    const sx = LAND ? px + pw + 50 * u : px, sy = LAND ? py + 10 * u : py + ph + 40 * u;
    const stats = [['FRAMES', `${fr} / ${total}`], ['FORMAT', '1920 × 1080'], ['ETA', `00:${String(Math.ceil(42 * (1 - p))).padStart(2, '0')}`]];
    stats.forEach(([k, v], i) => {
      const yy = LAND ? sy + i * 120 * u : sy, xx = LAND ? sx : sx + i * (pw / 3);
      ctx.fillStyle = K.muted; ctx.font = F(K, 700, 20, MONO(K)); ctx.fillText(k, xx, yy + 24 * u);
      ctx.fillStyle = K.ink; ctx.font = F(K, 400, LAND ? 64 : 54, K.num); ctx.fillText(v, xx, yy + (LAND ? 84 : 76) * u);
    });
    // 进度条和胶片格
    const by = LAND ? py + ph + 40 * u : sy + 120 * u, bw2 = LAND ? b.w - 80 * u : pw;
    ctx.fillStyle = 'rgba(255,255,255,.08)'; rr(ctx, px, by, bw2, 10 * u, 5 * u); ctx.fill();
    ctx.save(); ctx.shadowColor = K.a(.8); ctx.shadowBlur = 20 * u; ctx.fillStyle = K.a(1); rr(ctx, px, by, Math.max(10 * u, bw2 * p), 10 * u, 5 * u); ctx.fill(); ctx.restore();
    ctx.fillStyle = K.ink; ctx.font = F(K, 700, 22, MONO(K)); ctx.textAlign = 'right'; ctx.fillText(`${Math.round(p * 100)}%`, px + bw2, by - 14 * u); ctx.textAlign = 'left';
    const nf = 10, fw = (bw2 - (nf - 1) * 10 * u) / nf, fh = Math.min(fw * 9 / 16, LAND ? 60 * u : 70 * u);
    for (let i = 0; i < nf; i++) {
      const done = (i + 1) / nf <= p + 1e-6;
      ctx.fillStyle = done ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.04)'; rr(ctx, px + i * (fw + 10 * u), by + 30 * u, fw, fh, 6 * u); ctx.fill();
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
    const u = K.u, b = box(K), st = o.start ?? .3, tot = o.items.reduce((s, i) => s + i.v, 0);
    const r = (LAND ? 210 : 230) * u, cx = LAND ? b.x + b.w * .25 : W / 2, cy = LAND ? b.y + b.h / 2 : b.y + r + 30 * u, lw = 46 * u;
    const ce = pop(t - .1, .6); if (ce <= 0) return;
    ctx.save(); ctx.globalAlpha = ce;
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    let a0 = -Math.PI / 2;
    const col = i => i === 0 ? K.a(1) : `rgba(255,255,255,${[.55, .3, .16, .1][(i - 1) % 4]})`;
    o.items.forEach((it, i) => {
      const span = TAU * it.v / tot, e = eOutCubic(inv(st + i * .45, st + i * .45 + .7, t));
      if (e > 0) {
        ctx.save(); if (i === 0) { ctx.shadowColor = K.a(.8); ctx.shadowBlur = 30 * u; }
        ctx.strokeStyle = col(i); ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cx, cy, r, a0 + .02, a0 + Math.max(.02, span * e) - .02); ctx.stroke(); ctx.restore();
      }
      a0 += span;
      // 图例
      const lx = LAND ? b.x + b.w * .55 : b.x + 20 * u, ly = LAND ? b.y + b.h / 2 - (o.items.length - 1) * 70 * u + i * 140 * u : cy + r + 120 * u + i * 104 * u, le = pop(t - st - i * .45 - .2, .5);
      if (le <= 0) return;
      ctx.save(); ctx.globalAlpha = ce * le;
      ctx.fillStyle = col(i); rr(ctx, lx, ly - 22 * u, 44 * u, 44 * u, 10 * u); ctx.fill();
      ctx.fillStyle = i === 0 ? K.ink : K.muted; ctx.font = F(K, 700, LAND ? 46 : 44); ctx.fillText(it.label, lx + 76 * u + (1 - le) * 30 * u, ly + 16 * u);
      ctx.font = F(K, 400, LAND ? 76 : 68, K.num); ctx.textAlign = 'right'; ctx.fillStyle = i === 0 ? K.ink : K.muted;
      ctx.fillText(count(it.v * eOutCubic(inv(0, .8, t - st - i * .45)), 0) + '%', LAND ? b.x + b.w - 40 * u : b.x + b.w - 20 * u, ly + 26 * u); ctx.textAlign = 'left';
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
    const u = K.u, b = box(K), gap = (LAND ? 120 : 70) * u;
    const cw = LAND ? (b.w - gap) / 2 : b.w, ch = LAND ? b.h : (b.h - gap) / 2;
    [o.a, o.b].forEach((it, i) => {
      const e = pop(t - .15 - i * .9, .7); if (e <= 0) return;
      const x = LAND ? b.x + i * (cw + gap) : b.x, y = (LAND ? b.y : b.y + i * (ch + gap)) + (1 - e) * 70 * u, hot = i === 1;
      ctx.save(); ctx.globalAlpha = e; glass(ctx, K, x, y, cw, ch);
      if (hot) { ctx.save(); ctx.shadowColor = K.a(.6); ctx.shadowBlur = 50 * u; rr(ctx, x, y, cw, ch, 28 * u); ctx.strokeStyle = K.a(.9); ctx.lineWidth = 2.5 * u; ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = hot ? K.a(1) : K.muted; ctx.font = F(K, 700, 22, MONO(K)); if ('letterSpacing' in ctx) ctx.letterSpacing = `${3 * u}px`;
      ctx.fillText(it.tag, x + 44 * u, y + 60 * u); if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.fillStyle = K.ink; ctx.font = F(K, 900, LAND ? 52 : 46); ctx.fillText(it.name, x + 44 * u, y + (LAND ? 130 : 118) * u);
      const v = it.value * eOutExpo(inv(.3, 1.3, t - .15 - i * .9)), vy = y + (LAND ? 330 : 238) * u, px = LAND ? 200 : 150;
      ctx.font = F(K, 400, px, K.num); const vs = count(v, it.digits ?? 0), vw = ctx.measureText(vs).width;
      if (hot) glowNum(ctx, K, vs, x + 44 * u, vy, px, 1, 'left'); else { ctx.fillStyle = 'rgba(244,245,248,.82)'; ctx.fillText(vs, x + 44 * u, vy); }
      ctx.fillStyle = hot ? K.ink : K.muted; ctx.font = F(K, 700, LAND ? 44 : 40); ctx.fillText(it.unit, x + 64 * u + vw, vy);
      const bw = (cw - 88 * u) * (it.bar ?? 1) * eOutCubic(inv(.4, 1.3, t - .15 - i * .9)), byy = vy + (LAND ? 50 : 34) * u;
      ctx.fillStyle = 'rgba(255,255,255,.07)'; rr(ctx, x + 44 * u, byy, cw - 88 * u, 12 * u, 6 * u); ctx.fill();
      ctx.fillStyle = hot ? K.a(1) : 'rgba(255,255,255,.45)'; rr(ctx, x + 44 * u, byy, Math.max(12 * u, bw), 12 * u, 6 * u); ctx.fill();
      if (it.note) { ctx.fillStyle = K.muted; ctx.font = F(K, 700, LAND ? 32 : 30); ctx.fillText(it.note, x + 44 * u, byy + (LAND ? 84 : 66) * u); }
      ctx.restore();
    });
    const ve = pop(t - .8, .5); if (ve <= 0) return;
    const vx = LAND ? b.x + cw + gap / 2 : b.x + b.w / 2, vy = LAND ? b.y + b.h / 2 : b.y + ch + gap / 2;
    ctx.save(); ctx.globalAlpha = ve; ctx.fillStyle = K.bg0; ctx.beginPath(); ctx.arc(vx, vy, 44 * u * lerp(.6, 1, ve), 0, TAU); ctx.fill();
    ctx.strokeStyle = K.faint; ctx.lineWidth = 2 * u; ctx.stroke();
    ctx.fillStyle = K.ink; ctx.font = F(K, 700, 26, MONO(K)); ctx.textAlign = 'center'; ctx.fillText(o.vs || 'VS', vx, vy + 9 * u); ctx.restore();
  }

  // ⑬ 大数字：一个数字从 from 数到 to（可加千分位），下面一句说明
  // o = { kicker, from, to, digits, sep, prefix, suffix, label, sub, start = .3 }
  function bigNumber(ctx, K, t, o) {
    const u = K.u, st = o.start ?? .3, p = inv(st, st + 1.4, t), cx = W / 2, ny = H * (LAND ? .58 : .50), px = LAND ? 380 : 330;
    const pulse = smooth(st + 1.0, st + 1.4, t) * (1 - smooth(st + 1.4, st + 2.6, t));
    const gl = ctx.createRadialGradient(cx, ny - px * .35 * u, 0, cx, ny - px * .35 * u, 700 * u); gl.addColorStop(0, K.a(.3 * pulse)); gl.addColorStop(1, K.a(0));
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    if (o.kicker) kicker(ctx, K, o.kicker, cx, ny - px * .9 * u, smooth(0, .4, t), 'center');
    if (p <= 0) return;
    const v = lerp(o.from || 0, o.to, eOutExpo(p)), txt = (o.prefix || '') + count(v, o.digits ?? 0, o.sep) + (o.suffix || '');
    ctx.font = F(K, 400, px, K.num); const fin = (o.prefix || '') + count(o.to, o.digits ?? 0, o.sep) + (o.suffix || '');
    const fit = Math.min(1, W * .86 / ctx.measureText(fin).width);          // 太宽（竖屏、位数多）就按终值整体缩小
    ctx.save(); ctx.translate(cx, ny); const s = fit * lerp(1.25, 1, eOutExpo(inv(0, .5, p))); ctx.scale(s, s);
    glowNum(ctx, K, txt, 0, 0, px, smooth(0, .2, p)); ctx.restore();
    const e = pop(t - st - 1.0, .6);
    ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'center'; ctx.fillStyle = K.ink; ctx.font = F(K, 700, LAND ? 50 : 52);
    ctx.fillText(o.label, cx, ny + 100 * u + (1 - e) * 24 * u);
    if (o.sub) { ctx.fillStyle = K.muted; ctx.font = F(K, 700, 22, MONO(K)); ctx.fillText(o.sub, cx, ny + 160 * u); }
    const lw = 260 * u * pop(t - st - 1.2, .6); ctx.fillStyle = K.a(1); ctx.fillRect(cx - lw / 2, ny + 30 * u, lw, 4 * u);
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

  // ⑯ 列表：4–8 项小卡片按拍一项一项出（横屏两列，竖屏一列），刚出的一项打强调色的勾
  // o = { kicker, title, items: [..], start = .5, every = 2 拍 }
  function list(ctx, K, t, o) {
    head(ctx, K, t, o);
    const u = K.u, b = box(K), n = o.items.length, cols = LAND ? 2 : 1, rows = Math.ceil(n / cols), gap = 26 * u;
    const cw = (b.w - (cols - 1) * gap) / cols, ch = Math.min(LAND ? 150 * u : 132 * u, (b.h - (rows - 1) * gap) / rows);
    const st = o.start ?? .5, every = o.every || K.beat * 2, cur = Math.floor((t - st) / every);
    o.items.forEach((it, i) => {
      const e = pop(t - st - i * every, .5); if (e <= 0) return;
      const c = LAND ? Math.floor(i / rows) : 0, r = LAND ? i % rows : i, x = b.x + c * (cw + gap) + (1 - e) * 40 * u, y = b.y + r * (ch + gap);
      ctx.save(); ctx.globalAlpha = e; glass(ctx, K, x, y, cw, ch, 22);
      const on = i === Math.min(cur, n - 1), cx = x + 64 * u, cy = y + ch / 2;
      ctx.fillStyle = on ? K.a(1) : 'rgba(255,255,255,.14)'; if (on) { ctx.shadowColor = K.a(.8); ctx.shadowBlur = 24 * u; }
      ctx.beginPath(); ctx.arc(cx, cy, 24 * u, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = on ? K.bg0 : K.ink; ctx.lineWidth = 4 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const k = eOutCubic(inv(.1, .45, t - st - i * every)); ctx.beginPath(); ctx.moveTo(cx - 10 * u, cy); ctx.lineTo(cx - 3 * u, cy + 8 * u); if (k > .4) ctx.lineTo(cx - 3 * u + 15 * u * (k - .4) / .6, cy + 8 * u - 17 * u * (k - .4) / .6); ctx.stroke();
      ctx.fillStyle = on ? K.ink : 'rgba(244,245,248,.8)'; ctx.font = F(K, 700, LAND ? 42 : 40); ctx.fillText(it, x + 116 * u, cy + 15 * u);
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.font = F(K, 700, 20, MONO(K)); ctx.textAlign = 'right'; ctx.fillText(String(i + 1).padStart(2, '0'), x + cw - 32 * u, cy + 8 * u); ctx.textAlign = 'left';
      ctx.restore();
    });
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
    const u = K.u, cx = W / 2, ly = H * (LAND ? .22 : .2);
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
      const e = pop(t - .9 - i * K.beat * 2, .5); if (e <= 0) return;
      const x = LAND ? cx - (n * rw + (n - 1) * 30 * u) / 2 + i * (rw + 30 * u) : 90 * u, y = LAND ? ry : ry + i * (rh + 22 * u);
      ctx.save(); ctx.globalAlpha = e; glass(ctx, K, x, y + (1 - e) * 30 * u, rw, rh, 20);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.font = F(K, 700, 22, MONO(K)); ctx.fillText(String(i + 1).padStart(2, '0'), x + 30 * u, y + rh / 2 + 8 * u + (1 - e) * 30 * u);
      ctx.fillStyle = K.ink; ctx.font = F(K, 700, 36); ctx.fillText(s, x + 84 * u, y + rh / 2 + 13 * u + (1 - e) * 30 * u);
      ctx.restore();
    });
    const ce = pop(t - .9 - n * K.beat * 2 - .2, .6); if (ce <= 0) return;
    ctx.save(); ctx.font = F(K, 900, 44); const bw = ctx.measureText(o.cta).width + 120 * u, bh = 96 * u;
    const by = LAND ? ry + rh + 60 * u : ry + n * (rh + 22 * u) + 50 * u;
    ctx.globalAlpha = ce; ctx.translate(cx, by + bh / 2); ctx.scale(lerp(.85, 1, ce), lerp(.85, 1, ce));
    ctx.shadowColor = K.a(.9); ctx.shadowBlur = 50 * u; rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fillStyle = K.a(1); ctx.fill(); ctx.shadowBlur = 0;
    ctx.save(); rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.clip(); sweep(ctx, -bw / 2, -bh / 2, bw, bh, inv(.4, 1.2, t - .9 - n * K.beat * 2 - .2), .5); ctx.restore();
    ctx.fillStyle = K.bg0; ctx.textAlign = 'center'; ctx.fillText(o.cta, 0, 16 * u);
    if (o.foot) { ctx.fillStyle = K.muted; ctx.font = F(K, 700, 22, MONO(K)); ctx.fillText(o.foot, 0, bh / 2 + 56 * u); }
    ctx.restore();
  }

  // 层：角标。左上标志加品牌名，右上当前第几章；al 由分段表算（片头、片尾、章节卡淡出）
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
  let OFF2 = null;
  function dissolve(ctx, K, p, drawA, drawB) {
    const e = eInOutCubic(clamp(p));
    drawA(ctx);
    OFF2 = OFF2 || mk(W, H); const o = OFF2.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); drawB(o);
    ctx.save(); ctx.globalAlpha = e; const s = lerp(1.04, 1, e); ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.drawImage(OFF2, -W / 2, -H / 2); ctx.restore();
  }

  return { theme, backdrop, glass, sweep, kicker, title, explain, data, transition, caption, pop,
    head, logo, chapter, code, callout, device, line, ring, compare, bigNumber, quote, lower, list, timeline, outro, corner, push, dissolve };
})();
