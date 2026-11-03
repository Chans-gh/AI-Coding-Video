// C-067 Demoscene：低分辨率缓冲区里逐像素算隧道（按距离和角度查异或纹理、循环调色板），放大后不做平滑；
// 上面叠铜条、铬金属标志和正弦滚动字幕，都是 90 年代演示场景的老套路。由 opus40 的同名场景改写，横屏重新构图。
scene({
  id: 'C-067', name: 'Demoscene', dur: 3, still: 2.4,
  fonts: ["40px 'Bebas Neue'", "40px 'Press Start 2P'"],
  init() {
    const w = LAND ? 480 : 270, h = LAND ? 270 : 480, lo = mk(w, h), ang = new Float32Array(w * h), dis = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = x - w / 2, dy = y - h * .44; ang[y * w + x] = Math.atan2(dy, dx) / Math.PI; dis[y * w + x] = Math.sqrt(dx * dx + dy * dy); }
    const pal = []; for (let i = 0; i < 256; i++) { const a = i / 256 * TAU; pal.push([128 + 127 * Math.sin(a), 128 + 127 * Math.sin(a + 2.1), 128 + 127 * Math.sin(a + 4.2)]); }
    return { w, h, lo, ang, dis, pal, id: lo.getContext('2d').createImageData(w, h) };
  },
  draw(ctx, t, s) {
    const { w, h } = s, d = s.id.data;
    // 构图：竖屏沿用原版；横屏隧道缓冲区改成横向，铜条、标志、滚动字整体上移
    const P = LAND ? { bar: 690, by: 80, logo: 360, sc: 930 } : { bar: 1180, by: 110, logo: 560, sc: 1400 };
    for (let i = 0; i < w * h; i++) {
      const di = s.dis[i], u = 48 / (di + 1) + t * 1.6, v = s.ang[i] + t * .25 + Math.sin(t) * .1;
      const tx = Math.floor(u * 16) & 31, ty = Math.floor(v * 32) & 31; const c = ((tx ^ ty) * 8 + Math.floor(t * 60)) & 255;
      const sh = Math.min(1, di / 120); const p = s.pal[c];
      d[i * 4] = p[0] * sh; d[i * 4 + 1] = p[1] * sh; d[i * 4 + 2] = p[2] * sh; d[i * 4 + 3] = 255;
    }
    s.lo.getContext('2d').putImageData(s.id, 0, 0);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(s.lo, 0, 0, W, H); ctx.imageSmoothingEnabled = true;
    // copper bars
    ['255,60,60', '60,255,120', '80,140,255', '255,200,60'].forEach((c, k) => {
      const y = P.bar + Math.sin(t * 3 + k * .9) * P.by; const g = ctx.createLinearGradient(0, y - 22, 0, y + 22);
      g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(.5, `rgba(${c},1)`); g.addColorStop(.52, 'rgba(255,255,255,1)'); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(0, y - 22, W, 44);
    });
    // chrome logo
    const lg = ctx.createLinearGradient(0, P.logo - 190, 0, P.logo); lg.addColorStop(0, '#fff'); lg.addColorStop(.48, '#7FB6FF'); lg.addColorStop(.5, '#1B2A6B'); lg.addColorStop(1, '#E9F3FF');
    ctx.textAlign = 'center'; ctx.font = "230px 'Bebas Neue'"; const ly = P.logo + Math.abs(Math.sin(t * Math.PI / (BEAT * 2))) * -40;
    ctx.lineWidth = 12; ctx.strokeStyle = '#000'; ctx.strokeText('CODE', W / 2, ly); ctx.fillStyle = lg; ctx.fillText('CODE', W / 2, ly);
    // sine scroller
    const msg = '*** CODE DEMO *** EVERY PIXEL FROM CODE *** ONE PROMPT EACH *** GREETINGS TO ALL CODERS ***';
    ctx.font = "56px 'Press Start 2P'"; const cw = 58;
    for (let i = 0; i < msg.length; i++) {
      const x = W + 20 + i * cw - t * 520; if (x < -60 || x > W + 60) continue;
      const y = P.sc + Math.sin(x * .012 + t * 6) * 44; ctx.fillStyle = '#000'; ctx.fillText(msg[i], x + 5, y + 5);
      ctx.fillStyle = `hsl(${(x * .4 + t * 200) % 360},100%,65%)`; ctx.fillText(msg[i], x, y);
    }
    ctx.textAlign = 'left';
  }
});
