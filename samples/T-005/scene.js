// T-005 默片字幕卡重剪：把 1902 年《月球旅行记》剪成 15 秒的小故事，镜头之间插中文字幕卡（花边框、衬线字），画面加放映机的闪烁、片门晃动和划痕
// 素材：录像（archive.org 上的公共领域影片，一段 40 秒）；配乐 CC0。每个镜头的入点和速度写在 SHOTS 里
scene({
  id: 'T-005', name: '默片字幕卡重剪', dur: 15, still: 8.9,
  fonts: ["900 40px 'Noto Serif SC'", "700 40px 'Noto Serif SC'", "400 40px 'Limelight'"],
  text: '天文学家们决定去月球轰正中月亮的眼睛降落未完待续第一幕二三一九〇二年录像配乐',
  async init() {
    return { A: await loadAssets(), v: await loadVideo('film.mp4') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, f = Math.round(t * FPS);
    // [开始, 结束, 类型, 素材入点 或 字幕, 速度]
    const SHOTS = [
      [0, 1.8, 'card', ['一九〇二年，', '天文学家们决定：去月球！']],
      [1.8, 4.4, 'film', 6.0, 1.0],
      [4.4, 5.4, 'card', ['轰——！']],
      [5.4, 9.6, 'film', 17.0, 2.2],
      [9.6, 10.8, 'card', ['正中月亮的眼睛。']],
      [10.8, 14.0, 'film', 32.5, 1.3],
      [14.0, 15.0, 'card', ['未完待续……']],
    ];
    const sh = SHOTS.find(x => t < x[1]) || SHOTS[SHOTS.length - 1];
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    // 放映机：每帧亮度轻微跳动，画面上下晃一两个像素
    const flick = .92 + .08 * hash1(f * 7 + 3), weave = (hash1(f * 13) - .5) * 4 * u;
    ctx.save(); ctx.translate(0, weave);
    if (sh[2] === 'film') {
      await s.v.at(sh[3] + (t - sh[0]) * sh[4]);
      const box = LAND ? [W * .125, 0, W * .75, H] : [0, (H - W * .75) / 2, W, W * .75];
      ctx.filter = `sepia(.55) contrast(1.15) brightness(${flick})`;
      drawCover(ctx, s.v.el, ...box, { zoom: 1.04 });
      ctx.filter = 'none';
      if (!LAND) {   // 竖屏：上下的黑边里写第几幕
        const act = ['第一幕', '', '第二幕', '', '第三幕'][SHOTS.indexOf(sh) - 1] || '';
        ctx.fillStyle = 'rgba(235,220,190,.8)'; ctx.font = `700 ${44 * u}px 'Noto Serif SC'`; ctx.textAlign = 'center';
        ctx.fillText(act, W / 2, box[1] - 80 * u);
        ctx.font = `400 ${30 * u}px 'Limelight'`; ctx.fillText('LE VOYAGE DANS LA LUNE · 1902', W / 2, box[1] + box[3] + 110 * u);
      }
    } else {
      // 字幕卡：深底、双线花边、四角小花饰、居中衬线字
      ctx.fillStyle = '#0d0b08'; ctx.fillRect(0, 0, W, H);
      const m = (LAND ? 90 : 70) * u, bw = W - 2 * m, bh = LAND ? H - 2 * m : H * .5, by = (H - bh) / 2;
      ctx.strokeStyle = `rgba(230,214,180,${.9 * flick})`; ctx.lineWidth = 3 * u; ctx.strokeRect(m, by, bw, bh);
      ctx.lineWidth = 1.5 * u; ctx.strokeRect(m + 14 * u, by + 14 * u, bw - 28 * u, bh - 28 * u);
      for (const [cx, cy] of [[m, by], [m + bw, by], [m, by + bh], [m + bw, by + bh]]) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4); ctx.fillStyle = 'rgba(230,214,180,.9)';
        ctx.fillRect(-12 * u, -12 * u, 24 * u, 24 * u); ctx.restore();
      }
      const lines = sh[3], a = smooth(sh[0], sh[0] + .25, t) * (1 - smooth(sh[1] - .15, sh[1], t) * (sh[1] < 15 ? 1 : 0));
      ctx.globalAlpha = a; ctx.fillStyle = `rgba(240,226,196,${flick})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const big = lines.length === 1 && lines[0].length <= 4;
      const size = (big ? (LAND ? 150 : 130) : (LAND ? 72 : 62)) * u;
      ctx.font = `900 ${size}px 'Noto Serif SC'`;
      lines.forEach((l, i) => ctx.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * size * 1.4));
      if (sh[1] >= 15) { ctx.font = `400 ${20 * u}px 'Noto Serif SC'`; ctx.globalAlpha = a * .7; ctx.fillText(credits(s.A), W / 2, by + bh - 50 * u); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // 划痕、灰尘、暗角
    const rng = mulberry32(f * 31 + 5);
    ctx.save(); ctx.strokeStyle = 'rgba(255,250,235,.25)'; ctx.lineWidth = 1.5 * u;
    for (let i = 0; i < 2; i++) if (rng() < .5) { const x = rng() * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (rng() - .5) * 20 * u, H); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,250,235,.5)';
    for (let i = 0; i < 6; i++) if (rng() < .4) { ctx.beginPath(); ctx.arc(rng() * W, rng() * H, rng() * 3 * u + .5, 0, 7); ctx.fill(); }
    ctx.restore();
    const vg = ctx.createRadialGradient(W / 2, H / 2, SHORT * .35, W / 2, H / 2, Math.hypot(W, H) * .6);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.75)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    grain(ctx, f, .35);
  },
});
