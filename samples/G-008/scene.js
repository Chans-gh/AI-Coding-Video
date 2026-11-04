// G-008 伪纪录片：AI 生成的屋顶纸鹤照片和起飞镜头，代码叠一层野外纪录片的取景器：手持晃动、对焦由虚到实、REC 和走动的时间码、物种名下三分之一字幕、「观察第 37 天」场记、数量估计，最后跟着鹤群起飞收在片名上
// 素材：生图、生视频（以照片为参考）、语音合成；配乐 CC0
scene({
  id: 'G-008', name: '伪纪录片', dur: 13.5, still: 3.4,
  fonts: ["700 40px 'Noto Sans SC'", "400 40px 'Noto Sans SC'", "900 40px 'Noto Serif SC'", "italic 400 40px 'Playfair Display'", "400 40px 'JetBrains Mono'"],
  text: '城市折纸鹤观察第天清晨南迁前集合数量约只野外记录第一缕阳光纸鹤迁徙季画面生成旁白合成配乐',
  async init() {
    const A = await loadAssets(), T = k => cueTime(A, k, 99);
    return { A, roof: await loadImage('roof.jpg'), fly: await loadVideo('fly.mp4'), cut: T('然后一起') - .3, s2: T('它们在') };
  },
  async draw(ctx, t, s) {
    const u = SHORT / 1080;
    // 手持晃动：几条慢正弦叠加
    const sx = (Math.sin(t * 1.3) * 6 + Math.sin(t * 2.9 + 1) * 3) * u, sy = (Math.cos(t * 1.1) * 5 + Math.sin(t * 3.7) * 2) * u, rot = Math.sin(t * .9) * .004;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2 + sx, H / 2 + sy); ctx.rotate(rot); ctx.translate(-W / 2, -H / 2);
    if (t < s.cut) {
      // 对焦：开头和第二句开头各拉一次焦
      const b = Math.max(1 - smooth(.2, 1.4, t), t > s.s2 - .3 ? 1 - smooth(s.s2 - .3, s.s2 + .6, t) * 1 : 0) * 10 * u;
      const zoom = t < s.s2 - .3 ? lerp(1.12, 1.18, t / s.s2) : lerp(1.45, 1.55, inv(s.s2, s.cut, t));
      if (b > .3) ctx.filter = `blur(${b}px)`;
      drawCover(ctx, s.roof, -20 * u, -20 * u, W + 40 * u, H + 40 * u, { zoom, fx: t < s.s2 - .3 ? .5 : .55, fy: t < s.s2 - .3 ? .5 : .45 });
      ctx.filter = 'none';
    } else {
      await s.fly.at(Math.min(t - s.cut, s.fly.dur - .05));
      drawCover(ctx, s.fly.el, -20 * u, -20 * u, W + 40 * u, H + 40 * u, { zoom: 1.08 });
    }
    ctx.restore();
    // 硬切后白闪一下
    const fl = 1 - smooth(s.cut, s.cut + .25, t); if (t > s.cut && fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl * .5})`; ctx.fillRect(0, 0, W, H); }
    grain(ctx, Math.round(t * FPS), .06);
    // 取景器：四角、中心十字、REC、时间码、电量
    const m = (LAND ? 50 : 60) * u, L = 50 * u, ink = 'rgba(255,255,255,.85)';
    ctx.strokeStyle = ink; ctx.lineWidth = 3 * u;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(x, y + L * dy); ctx.lineTo(x, y); ctx.lineTo(x + L * dx, y); ctx.stroke(); });
    ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(W / 2 - 18 * u, H / 2); ctx.lineTo(W / 2 + 18 * u, H / 2); ctx.moveTo(W / 2, H / 2 - 18 * u); ctx.lineTo(W / 2, H / 2 + 18 * u); ctx.stroke();
    ctx.font = `400 ${24 * u}px 'JetBrains Mono'`; ctx.textBaseline = 'middle'; ctx.fillStyle = ink;
    if (Math.floor(t * 2) % 2 === 0) { ctx.beginPath(); ctx.arc(m + 30 * u, m + 40 * u, 9 * u, 0, Math.PI * 2); ctx.fillStyle = '#ff3b30'; ctx.fill(); }
    ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.fillText('REC', m + 48 * u, m + 41 * u);
    const f = Math.floor(t * 25), tc = `06:12:${String(14 + Math.floor(f / 25)).padStart(2, '0')}:${String(f % 25).padStart(2, '0')}`;
    ctx.textAlign = 'right'; ctx.fillText(tc, W - m - 20 * u, m + 41 * u);
    ctx.fillText(t < s.cut ? '400mm  f/5.6' : '200mm  f/4', W - m - 20 * u, m + 76 * u);
    // 场记：观察第 37 天
    const n = smooth(.6, 1.2, t) * (1 - smooth(s.cut - .5, s.cut, t));
    if (n > 0) { ctx.save(); ctx.globalAlpha = n; ctx.textAlign = 'left'; ctx.font = `700 ${30 * u}px 'Noto Sans SC'`; ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 10 * u; ctx.fillText('观察第 37 天 · 清晨', m + 20 * u, m + 90 * u); ctx.restore(); }
    // 下三分之一：物种名
    const lt = inv(1.4, 2.2, t) * (1 - inv(s.s2 + 1.2, s.s2 + 1.7, t));
    if (lt > 0) {
      const x = m + 20 * u, y = H * (LAND ? .62 : .66), k = eOutCubic(lt);
      ctx.save(); ctx.fillStyle = '#f2c14e'; ctx.fillRect(x, y, 420 * u * k, 4 * u);
      ctx.beginPath(); ctx.rect(x, y - 80 * u, 600 * u, 170 * u); ctx.clip();
      ctx.globalAlpha = k; ctx.textAlign = 'left'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 12 * u;
      ctx.fillStyle = '#fff'; ctx.font = `900 ${54 * u}px 'Noto Serif SC'`; ctx.fillText('城市折纸鹤', x, y - 38 * u + (1 - k) * 40 * u);
      ctx.font = `italic 400 ${34 * u}px 'Playfair Display'`; ctx.fillStyle = '#f2c14e'; ctx.fillText('Grus papyracea', x, y + 36 * u - (1 - k) * 40 * u);
      ctx.restore();
    }
    // 第二句：数量估计
    const c = inv(s.s2 + .4, s.s2 + 1.6, t) * (1 - smooth(s.cut - .4, s.cut, t));
    if (c > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, c * 3); ctx.textAlign = 'right'; ctx.font = `400 ${26 * u}px 'JetBrains Mono'`; ctx.fillStyle = '#f2c14e';
      ctx.fillText(`COUNT ≈ ${Math.round(40 * eOutCubic(c))}`, W - m - 20 * u, H * (LAND ? .62 : .66)); ctx.restore();
    }
    // 片尾片名
    const e = smooth(s.cut + 2.6, s.cut + 3.4, t);
    if (e > 0) {
      ctx.fillStyle = `rgba(0,0,0,${e * .35})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = e; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 16 * u;
      ctx.font = `900 ${(LAND ? 84 : 96) * u}px 'Noto Serif SC'`; ctx.fillText('纸鹤迁徙季', W / 2, H * .42);
      ctx.font = `400 ${26 * u}px 'JetBrains Mono'`; ctx.fillStyle = '#f2c14e'; ctx.fillText('A FIELD RECORD · EP.37', W / 2, H * .42 + 80 * u); ctx.restore();
    }
    const cu = cueAt(s.A, t);
    if (cu) caption(ctx, cu.text, { size: LAND ? 36 : 42, bg: null, stroke: 'rgba(0,0,0,.75)', y: H - m - (LAND ? 60 : 160) * u, maxW: W * .86 });
    ctx.save(); ctx.font = `400 ${15 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(credits(s.A), W / 2, H - m + 20 * u); ctx.restore();
  },
});
