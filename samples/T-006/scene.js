// T-006 太空站音乐 MV：空间站拍的夜景和日出两段录像、一张极光照片，按节拍切镜头；自写的歌词一字一字浮出，横屏加电影遮幅、竖屏歌词放中间，加漏光和颗粒
// 素材：录像（NASA 空间站地球景观两段）、照片（NASA 空间站极光）；配乐 CC0。歌词是本仓库写的
scene({
  id: 'T-006', name: '轨道 MV', dur: 15, still: 9.4,
  fonts: ["300 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "400 40px 'Playfair Display'"],
  text: '绕着你转一圈九十分钟黑夜刚过去太阳又从边上升起我在高处替你看着轨道录像照片配乐',
  async init() {
    return { A: await loadAssets(), orbit: await loadVideo('orbit.mp4'), sun: await loadVideo('sunrise.mp4'), aur: await loadImage('aurora.jpg') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080, f = Math.round(t * FPS);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    // 镜头表：[开始, 结束, 素材, 素材入点]；极光照片插两次当节拍上的闪切
    const CUTS = [[0, 4.6, 'orbit', 0], [4.6, 5.4, 'aur', 0], [5.4, 11.6, 'sun', .5], [11.6, 15, 'aur', 0]];
    const c = CUTS.find(x => t < x[1]) || CUTS[3], lt = t - c[0];
    if (c[2] === 'aur') {
      drawCover(ctx, s.aur, 0, 0, W, H, { zoom: lerp(1.25, 1.05, inv(c[0], c[1], t)), fx: .5, fy: .55 });
    } else {
      const v = s[c[2]]; await v.at(c[3] + lt);
      drawCover(ctx, v.el, 0, 0, W, H, { zoom: 1.08 + .02 * Math.sin(t * .8), fy: .5 });
    }
    // 切点：一帧白闪 + 漏光
    const since = Math.min(...CUTS.map(x => t - x[0]).filter(d => d >= 0));
    if (since < .12) { ctx.fillStyle = `rgba(255,240,220,${.5 * (1 - since / .12)})`; ctx.fillRect(0, 0, W, H); }
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const lx = W * (.2 + .6 * noise1(t * .3)), lg = ctx.createRadialGradient(lx, H * .2, 0, lx, H * .2, SHORT * .9);
    lg.addColorStop(0, 'rgba(255,140,60,.22)'); lg.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // 歌词：每句的字依次浮上来，句尾慢慢淡掉
    const LYR = [[.6, 4.4, '绕着你转一圈', '九十分钟'], [5.6, 9.0, '黑夜刚过去', '太阳又从边上升起'], [9.2, 11.5, '我在高处', '替你看着']];
    const L = LYR.find(x => t >= x[0] && t < x[1] + .4);
    if (L) {
      const out = 1 - smooth(L[1], L[1] + .4, t);
      ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 18 * u;
      [L[2], L[3]].forEach((line, k) => {
        const size = (k ? 44 : 64) * u * (LAND ? 1 : 1.1);
        ctx.font = `${k ? 300 : 700} ${size}px 'Noto Sans SC'`;
        const w = ctx.measureText(line).width, x0 = LAND ? W * .1 : (W - w) / 2, y0 = LAND ? H * .68 + k * 74 * u : H * .45 + k * 86 * u;
        let x = x0;
        [...line].forEach((ch, i) => {
          const a = smooth(L[0] + k * .5 + i * .07, L[0] + k * .5 + i * .07 + .35, t) * out;
          ctx.globalAlpha = a; ctx.fillStyle = '#fff';
          ctx.fillText(ch, x, y0 + (1 - a) * 18 * u); x += ctx.measureText(ch).width;
        });
      });
      ctx.restore();
    }
    // 片名：最后一个镜头
    const e = smooth(12.0, 12.8, t);
    if (e > 0) {
      ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 24 * u;
      ctx.font = `700 ${(LAND ? 120 : 130) * u}px 'Noto Sans SC'`; ctx.fillText('轨　道', W / 2, H * .5);
      ctx.font = `italic 400 ${36 * u}px 'Playfair Display'`; ctx.fillText('Orbit', W / 2, H * .5 + 70 * u);
      ctx.font = `400 ${17 * u}px 'Noto Sans SC'`; ctx.globalAlpha = e * .75; ctx.fillText(credits(s.A) + ' · 歌词本仓库原创', W / 2, H * .5 + 130 * u);
      ctx.restore();
    }
    // 遮幅（横屏 2.39:1）
    if (LAND) { const bar = (H - W / 2.39) / 2; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar); }
    grain(ctx, f, .25);
  },
});
