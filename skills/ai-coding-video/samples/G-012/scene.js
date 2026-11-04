// G-012 水彩绘本朗读：三张 AI 生成的水彩绘本插画（后两张以第一张为参考，小刺猬前后是同一只），代码排成一本摊开的书：左页插画、右页文字（竖版上图下文），翻页时纸张绕书脊转过去带阴影；文字跟着旁白一个字一个字染色，像卡拉 OK 字幕；最后合上一页写「完」
// 素材：生图 ×3、语音合成（青水）；配乐 CC0
scene({
  id: 'G-012', name: '水彩绘本朗读', dur: 13.5, still: 9.2,
  fonts: ["400 40px 'ZCOOL KuaiLe'", "400 40px 'Ma Shan Zheng'", "400 40px 'Noto Sans SC'"],
  text: '小刺猬捡到一片红红的枫叶下雨啦它把枫叶举过头顶当成一把小伞雨停了它和小松鼠坐在叶子下面看见了彩虹完画面生成旁白合成配乐',
  async init() {
    const A = await loadAssets(), vo = A.items.find(i => i.lines), at = +vo.at || 0;
    const L = vo.lines.map(l => ({ text: l.text, t0: at + l.t0, t1: at + l.t1 }));
    // 一页放哪几句：第 1 句 / 第 2–3 句 / 第 4–5 句
    const pages = [[L[0]], [L[1], L[2]], [L[3], L[4]]];
    const turns = [L[1].t0 - .55, L[3].t0 - .55];
    return { A, pages, turns, end: L[4].t1 + .5, img: [await loadImage('p1.jpg'), await loadImage('p2.jpg'), await loadImage('p3.jpg')] };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, TD = .7;
    ctx.fillStyle = '#5b3a2e'; ctx.fillRect(0, 0, W, H);
    // 桌面上的书：横版是摊开的两页，竖版是一页
    const bw = LAND ? W * .9 : W * .88, bh = LAND ? H * .82 : H * .8, bx = (W - bw) / 2, by = (H - bh) / 2;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 40 * u; ctx.shadowOffsetY = 14 * u;
    ctx.fillStyle = '#8e2f2a'; rr(ctx, bx - 16 * u, by - 16 * u, bw + 32 * u, bh + 32 * u, 14 * u); ctx.fill(); ctx.restore();
    const pg = t < s.turns[0] ? 0 : t < s.turns[1] ? 1 : 2;
    const turning = s.turns.findIndex(x => t >= x && t < x + TD);
    const half = LAND ? bw / 2 : bw;
    // 页面内容：横版左页 = 插画、右页 = 文字；竖版一页里上图下文
    const drawLeft = (i, x) => page(ctx, x, by, half, bh, u, () => {
      const m = 50 * u, iw = half - 2 * m, ih = LAND ? bh - 2 * m : iw * .75;
      drawCover(ctx, s.img[i], x + m, by + m, iw, ih, { zoom: lerp(1, 1.04, clamp((t - (i ? s.turns[i - 1] : 0)) / 5, 0, 1)) });
      if (!LAND) text(ctx, s.pages[i], t, x + m, by + m + ih + 150 * u, iw, u, i);
    });
    const drawRight = (i, x) => page(ctx, x, by, half, bh, u, () => text(ctx, s.pages[i], t, x + 70 * u, by + bh * .32, half - 140 * u, u, i));
    if (LAND) {
      if (turning < 0) { drawLeft(pg, bx); drawRight(pg, bx + half); }
      else {
        // 翻页：右页绕书脊往左转，前一半看到旧右页背面变窄，后一半看到新左页展开
        const p = eInOutCubic((t - s.turns[turning]) / TD), a = turning, b = turning + 1, sp = bx + half;
        drawLeft(a, bx); drawRight(b, sp);
        if (p < .5) { const k = 1 - p * 2; ctx.save(); ctx.translate(sp, 0); ctx.scale(k, 1); ctx.translate(-sp, 0); drawRight(a, sp); ctx.restore(); shade(ctx, sp, by, half * k, bh, 1 - k, 1); }
        else { const k = p * 2 - 1; ctx.save(); ctx.translate(sp, 0); ctx.scale(k, 1); ctx.translate(-sp, 0); drawLeft(b, bx); ctx.restore(); shade(ctx, sp - half * k, by, half * k, bh, 1 - k, -1); }
      }
      // 书脊阴影
      const g = ctx.createLinearGradient(bx + half - 40 * u, 0, bx + half + 40 * u, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(60,40,20,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(bx + half - 40 * u, by, 80 * u, bh);
    } else {
      if (turning < 0) drawLeft(pg, bx);
      else {
        const p = eInOutCubic((t - s.turns[turning]) / TD), k = 1 - p;
        drawLeft(turning + 1, bx);
        ctx.save(); ctx.translate(bx, 0); ctx.scale(k, 1); ctx.translate(-bx, 0); drawLeft(turning, bx); ctx.restore();
        shade(ctx, bx, by, bw * k, bh, p, 1);
      }
    }
    // 页码
    ctx.save(); ctx.font = `400 ${22 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(90,70,50,.6)'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (turning < 0) ctx.fillText(`— ${pg + 1} —`, LAND ? bx + bw * .75 : W / 2, by + bh - 30 * u); ctx.restore();
    // 结尾：「完」字落在右下角
    const e = smooth(s.end, s.end + .5, t);
    if (e > 0) {
      ctx.save(); ctx.globalAlpha = e; ctx.translate(LAND ? bx + bw * .75 : W / 2, LAND ? by + bh * .78 : by + bh * .9); ctx.scale(lerp(1.4, 1, eOutCubic(e)), lerp(1.4, 1, eOutCubic(e)));
      ctx.font = `400 ${(LAND ? 120 : 110) * u}px 'Ma Shan Zheng'`; ctx.fillStyle = '#b5452f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('完', 0, 0); ctx.restore();
    }
    ctx.save(); ctx.font = `400 ${15 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,240,220,.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(credits(s.A), W / 2, H - (LAND ? 14 : 40) * u); ctx.restore();
  },
});

// 一页纸：米色底 + 细纸纹，内容画在 clip 里
function page(ctx, x, y, w, h, u, fn) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#fbf5e9'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(160,130,90,.06)';
  for (let i = 0; i < 40; i++) ctx.fillRect(x + hash1(i * 3) * w, y + hash1(i * 3 + 1) * h, 2 * u, 2 * u + hash1(i * 3 + 2) * 30 * u);
  fn(); ctx.restore();
}
// 翻动的纸面上的明暗：越接近竖起来越暗
function shade(ctx, x, y, w, h, d, dir) {
  if (w <= 0) return;
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(dir > 0 ? 0 : 1, `rgba(60,40,20,${.05 + d * .35})`); g.addColorStop(dir > 0 ? 1 : 0, `rgba(60,40,20,${d * .15})`);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}
// 卡拉 OK 文字：说到的字从灰变成深色，正在说的字下面一个小点
function text(ctx, lines, t, x, y, w, u, i) {
  const fs = (LAND ? 78 : 84) * u, lh = fs * 1.45;
  ctx.font = `400 ${fs}px 'ZCOOL KuaiLe'`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  let cy = y;
  for (const l of lines) {
    const chars = [...l.text], n = (t - l.t0) / (l.t1 - l.t0) * chars.length;
    let cx = x;
    chars.forEach((c, j) => {
      const cw = ctx.measureText(c).width;
      if (cx + cw > x + w) { cx = x; cy += lh; }
      const f = clamp(n - j, 0, 1);
      ctx.fillStyle = '#c9bba4'; ctx.fillText(c, cx, cy);
      if (f > 0) { ctx.save(); ctx.beginPath(); ctx.rect(cx, cy - fs, cw * f, fs * 1.3); ctx.clip(); ctx.fillStyle = '#5a3b26'; ctx.fillText(c, cx, cy); ctx.restore(); }
      if (f > 0 && f < 1) { ctx.beginPath(); ctx.arc(cx + cw / 2, cy + 18 * u, 6 * u, 0, Math.PI * 2); ctx.fillStyle = '#d0563b'; ctx.fill(); }
      cx += cw;
    });
    cy += lh * 1.25;
  }
}
