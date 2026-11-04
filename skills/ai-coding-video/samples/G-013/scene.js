// G-013 食谱动效卡：生成的成品菜和食材平铺照片画在画布上，语言模型写的四个步骤线条图标（steps.svg）放进盖在上面的 SVG 层，按每一笔的长度用描边虚线一笔一笔描出来；四步出现的时刻从旁白的逐字时间里取，字幕跟着旁白走
// 素材：生图（两张照片 + 一份 SVG 图标）、语音合成（旁白，公开音色）；配乐 CC0
const STEPS = [['番茄切块', '番茄切块'], ['鸡蛋打散', '鸡蛋打散，先炒到嫩黄盛出'], ['番茄炒出汁', '番茄炒出汁，鸡蛋回锅'], ['加盐', '加盐，撒葱花，出锅']];
const INK = '#3b2a1a', RED = '#d9480f';
scene({
  id: 'G-013', name: '食谱动效卡', dur: 14, still: 9.8, dom: true,
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "400 40px 'ZCOOL KuaiLe'", "400 40px 'Bebas Neue'"],
  text: '番茄炒蛋四步上桌切块鸡蛋打散先炒到嫩黄盛出再把炒出汁回锅加盐撒葱花出锅分钟人份第步照片图标生成旁白合成配乐',
  async init() {
    const A = await loadAssets(), hero = await loadImage('hero.jpg'), ing = await loadImage('ingredients.jpg');
    // 把 steps.svg 拆成四个图标：每个 <g id="stepN"> 单独放进一个 viewBox 只框住它那一格的 <svg>
    const doc = new DOMParser().parseFromString(await loadText('steps.svg'), 'image/svg+xml');
    const icons = STEPS.map((_, i) => {
      const svg = el('svg:svg', { viewBox: `${i * 100} 0 100 100`, style: { position: 'absolute', overflow: 'visible' } });
      const g = document.importNode(doc.getElementById(`step${i + 1}`), true);
      svg.appendChild(g);
      const parts = [...g.querySelectorAll('path, line, circle, ellipse, rect, polyline, polygon')].map(p => {
        const len = p.getTotalLength(); p.setAttribute('stroke-dasharray', `${len} ${len}`); return { p, len };
      });
      return { svg, parts };
    });
    const at = STEPS.map(([kw]) => cueTime(A, kw));
    return { A, hero, ing, icons, at };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    ctx.fillStyle = '#fbf3e4'; ctx.fillRect(0, 0, W, H);
    const rng = mulberry32(9); ctx.fillStyle = 'rgba(160,110,60,.06)';
    for (let i = 0; i < 500; i++) ctx.fillRect(rng() * W, rng() * H, 3 * u, 3 * u);
    const [a1, , a3, a4] = s.at, end = 12.6;
    // 照片：开头成品 → 讲步骤时食材 → 回锅以后成品
    const photo = t < a1 - .2 || t >= a4 ? s.hero : s.ing, sw = t < a1 - .2 ? 0 : t < a4 ? a1 - .2 : a4;
    const pr = LAND ? [70 * u, 70 * u, H - 140 * u, H - 140 * u] : [70 * u, 150 * u, W - 140 * u, W - 140 * u];
    const endE = eInOutCubic(inv(end, end + .8, t));
    const box = LAND ? lerpR(pr, [W * .5 - (H - 120 * u) / 2, 60 * u, H - 120 * u, H - 120 * u], endE) : pr;
    ctx.save(); ctx.shadowColor = 'rgba(90,50,20,.25)'; ctx.shadowBlur = 30 * u; ctx.shadowOffsetY = 12 * u;
    ctx.fillStyle = '#fff'; rr(ctx, box[0] - 14 * u, box[1] - 14 * u, box[2] + 28 * u, box[3] + 28 * u, 26 * u); ctx.fill(); ctx.restore();
    ctx.save(); rr(ctx, box[0], box[1], box[2], box[3], 18 * u); ctx.clip();
    drawCover(ctx, photo, box[0], box[1], box[2], box[3], { zoom: 1.04 + .06 * inv(sw, sw + 6, t) });
    const fl = 1 - smooth(sw, sw + .3, t); if (sw > 0 && fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(box[0], box[1], box[2], box[3]); }
    ctx.restore();
    // 标题
    ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    const tx = LAND ? H + 20 * u : 70 * u, ty = LAND ? 150 * u : W + 150 * u;
    const ta = smooth(.2, .6, t) * (1 - smooth(end - .3, end, t));
    ctx.globalAlpha = ta;
    ctx.font = `400 ${(LAND ? 84 : 96) * u}px 'ZCOOL KuaiLe'`; ctx.fillStyle = RED; ctx.fillText('番茄炒蛋', tx, ty);
    ctx.font = `700 ${28 * u}px 'Noto Sans SC'`; ctx.fillStyle = INK; ctx.fillText('4 步 · 15 分钟 · 2 人份', tx + 4 * u, ty + 50 * u);
    ctx.restore();
    // 四个步骤：图标一笔一笔描出来，再弹出编号和一句话
    const cell = LAND ? 150 * u : 150 * u;
    s.icons.forEach((ic, i) => {
      const t0 = s.at[i], d = inv(t0 - .1, t0 + .9, t), shown = smooth(t0 - .15, t0 + .05, t) * (1 - smooth(end - .3, end, t));
      const cur = t >= t0 && (i === 3 || t < s.at[i + 1]);
      const x = LAND ? tx : 70 * u + (i % 2) * (W - 140 * u) / 2, y = LAND ? ty + 100 * u + i * (cell + 34 * u) : ty + 100 * u + Math.floor(i / 2) * (cell + 60 * u);
      // 底板
      ctx.save(); ctx.globalAlpha = shown;
      ctx.fillStyle = cur ? '#fff' : 'rgba(255,255,255,.55)'; rr(ctx, x, y, LAND ? W - tx - 70 * u : (W - 140 * u) / 2 - 20 * u, cell, 18 * u); ctx.fill();
      if (cur) { ctx.strokeStyle = RED; ctx.lineWidth = 3 * u; ctx.stroke(); }
      const nb = eOutBack(inv(t0 + .5, t0 + .8, t));
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x + cell + 30 * u, y + 36 * u, 20 * u * nb, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `400 ${28 * u}px 'Bebas Neue'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = shown * clamp(nb);
      ctx.fillText(i + 1, x + cell + 30 * u, y + 38 * u);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = INK;
      ctx.font = `700 ${(LAND ? 36 : 30) * u}px 'Noto Sans SC'`; ctx.globalAlpha = shown * smooth(t0 + .55, t0 + .85, t);
      const tw = LAND ? W - tx - cell - 150 * u : (W - 140 * u) / 2 - cell - 40 * u;
      wrapCJK(ctx, STEPS[i][1], tw).forEach((l, j) => ctx.fillText(l, x + cell + (LAND ? 60 : 10) * u, y + (LAND ? 56 : 96) * u + j * 42 * u));
      ctx.restore();
      // SVG 图标：位置和描边进度
      Object.assign(ic.svg.style, { left: `${x + 8 * u}px`, top: `${y + 4 * u}px`, width: `${cell - 16 * u}px`, height: `${cell - 8 * u}px`, opacity: shown });
      const n = ic.parts.length;
      ic.parts.forEach(({ p, len }, j) => {
        const pj = clamp(d * n - j);                  // 一笔接一笔
        p.setAttribute('stroke-dashoffset', len * (1 - pj));
        p.setAttribute('stroke', cur ? RED : INK);
      });
    });
    // 结尾：成品推近，写菜名
    if (endE > 0) {
      ctx.save(); ctx.globalAlpha = smooth(end + .4, end + .8, t); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const cy = LAND ? H - 120 * u : box[1] + box[3] + 170 * u;
      if (LAND) { ctx.fillStyle = 'rgba(251,243,228,.92)'; rr(ctx, W / 2 - 300 * u, cy - 90 * u, 600 * u, 130 * u, 24 * u); ctx.fill(); }
      ctx.font = `400 ${(LAND ? 80 : 110) * u}px 'ZCOOL KuaiLe'`; ctx.fillStyle = RED; ctx.fillText('出锅！', W / 2, cy);
      ctx.font = `700 ${26 * u}px 'Noto Sans SC'`; ctx.fillStyle = INK; ctx.fillText('番茄炒蛋 · 15 分钟', W / 2, cy + (LAND ? 34 : 60) * u);
      ctx.restore();
    }
    // 字幕
    const c = cueAt(s.A, t);
    if (c && t < end) caption(ctx, c.text, { size: (LAND ? 38 : 44) * u, color: INK, bg: 'rgba(255,255,255,.85)', y: H - (LAND ? 40 : 150) * u, maxW: W * .8 });
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(90,60,30,.65)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), W - 24 * u, H - 14 * u); ctx.restore();
  },
});
function lerpR(a, b, e) { return a.map((v, i) => lerp(v, b[i], e)); }
