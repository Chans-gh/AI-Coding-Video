// G-004 大字品牌片：两段 AI 生成的空镜（清晨海岸航拍、倒茶的手）按节拍剪在一起，镜头上压整屏的超大描边品牌字，随镜头慢慢滑动、只露出一部分；口号用细衬线体一句句淡入；结尾黑底上的大字当遮罩，海岸镜头从字里透出来，再落标志
// 素材：生视频 ×2（青水）；配乐 CC0。品牌「远方 FURTHER」是虚构的
scene({
  id: 'G-004', name: '大字品牌片', dur: 12, still: 10.8,
  fonts: ["400 40px 'Bebas Neue'", "700 40px 'Noto Serif SC'", "900 40px 'Noto Serif SC'", "400 40px 'Noto Sans SC'", "italic 400 40px 'Playfair Display'"],
  text: '向远处走也把日子过慢远方户外与生活虚构品牌画面生成配乐',
  async init() {
    const off = document.createElement('canvas'); off.width = W; off.height = H;   // 字形遮罩在这张离屏画布上做
    return { A: await loadAssets(), coast: await loadVideo('coast.mp4'), tea: await loadVideo('tea.mp4'), off };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, CREAM = '#f4ede1';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const C1 = 5.2, C2 = 9.4;                   // 切点
    if (t < C1) {
      await s.coast.at(Math.min(t * .95, s.coast.dur - .05));
      drawCover(ctx, s.coast.el, 0, 0, W, H, { zoom: lerp(1.05, 1.15, t / C1) });
      grade(ctx, .25);
      // 超大描边字：从右往左慢慢滑，只露出一部分
      ctx.save(); ctx.font = `400 ${(LAND ? 620 : 560) * u}px 'Bebas Neue'`; ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(244,237,225,.55)'; ctx.lineWidth = 2.5 * u; ctx.globalAlpha = smooth(.3, 1.4, t);
      ctx.strokeText('FURTHER', lerp(W * .15, -W * (LAND ? .35 : 1.2), t / C1), LAND ? H * .52 : H * .5);
      ctx.restore();
      line(ctx, '向远处走', t, 1.4, C1 - .3, LAND ? W * .08 : W * .1, LAND ? H * .8 : H * .78, u);
    } else if (t < C2) {
      const lt = t - C1;
      await s.tea.at(Math.min(.4 + lt * .9, s.tea.dur - .05));
      drawCover(ctx, s.tea.el, 0, 0, W, H, { zoom: lerp(1.12, 1.04, lt / (C2 - C1)), fx: LAND ? .5 : .6 });
      grade(ctx, .3);
      ctx.save(); ctx.font = `900 ${(LAND ? 520 : 600) * u}px 'Noto Serif SC'`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(244,237,225,.45)'; ctx.lineWidth = 2.5 * u; ctx.globalAlpha = smooth(C1 + .2, C1 + 1.2, t);
      ctx.strokeText('慢', LAND ? lerp(W * .78, W * .7, lt / 4) : W * .5, LAND ? H * .5 : lerp(H * .36, H * .3, lt / 4));
      ctx.restore();
      line(ctx, '也把日子过慢', t, C1 + .6, C2 - .3, LAND ? W * .08 : W * .1, LAND ? H * .8 : H * .78, u);
    } else {
      // 结尾：黑底，大字当遮罩，海岸从字里透出来
      const k = eOutCubic(inv(C2, C2 + 1.2, t));
      await s.coast.at(Math.min(1 + (t - C2) * .8, s.coast.dur - .05));
      const fs = (LAND ? 420 : 300) * u * lerp(1.25, 1, k), cy = LAND ? H * .44 : H * .42;
      const o = s.off.getContext('2d');
      o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, W, H);
      o.font = `900 ${fs}px 'Noto Serif SC'`; o.textAlign = 'center'; o.textBaseline = 'middle';
      o.fillStyle = '#fff'; o.fillText('远方', W / 2, cy);
      o.globalCompositeOperation = 'source-in';
      drawCover(o, s.coast.el, 0, 0, W, H, { zoom: 1.1 });
      ctx.drawImage(s.off, 0, 0);
      const a = smooth(C2 + 1, C2 + 1.8, t);
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.fillStyle = CREAM;
      ctx.font = `400 ${46 * u}px 'Bebas Neue'`; ctx.letterSpacing = `${18 * u}px`; ctx.fillText('FURTHER', W / 2 + 9 * u, cy + fs * .62);
      ctx.letterSpacing = '0px'; ctx.font = `400 ${26 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(244,237,225,.7)'; ctx.fillText('户外与生活', W / 2, cy + fs * .62 + 56 * u);
      ctx.restore();
    }
    // 切点的黑场
    for (const c of [C1, C2]) { const d = 1 - Math.min(1, Math.abs(t - c) / .22); if (d > 0) { ctx.fillStyle = `rgba(0,0,0,${d})`; ctx.fillRect(0, 0, W, H); } }
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.textAlign = 'right';
    ctx.fillText('虚构品牌 · ' + credits(s.A), W - 28 * u, H - 20 * u); ctx.restore();
    grain(ctx, Math.round(t * FPS), .05);
  },
});

// 压暗一点、偏暖，像调过色
function grade(ctx, d) {
  ctx.fillStyle = `rgba(20,12,4,${d})`; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, SHORT * .35, W / 2, H / 2, Math.max(W, H) * .75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// 口号：细衬线体，一个字一个字淡入、上浮，t1 后淡出
function line(ctx, text, t, t0, t1, x, y, u) {
  const out = 1 - smooth(t1 - .4, t1, t);
  ctx.save(); ctx.font = `700 ${(LAND ? 72 : 80) * u}px 'Noto Serif SC'`; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#f4ede1';
  let cx = x;
  [...text].forEach((ch, i) => {
    const k = smooth(t0 + i * .12, t0 + i * .12 + .6, t);
    ctx.globalAlpha = k * out; ctx.fillText(ch, cx, y + (1 - k) * 18 * u); cx += ctx.measureText(ch).width + 10 * u;
  });
  ctx.restore();
}
