// C-121 电影预告片：Canvas 2D 全程上下压黑边留出约 2.6:1 的画框（竖屏把画框加高、黑边照留）；底是暖棕近黑的径向渐变加三层不同速度飘动的尘粒；每张字卡居中，亮度按 t 走“黑—亮—黑”的呼吸曲线，琥珀色小号眉题逐字拉开字距，大号衬线数字用几层 shadowBlur 叠出光晕，青铜细线从中间向两边展开；片名那一刻一道横向镜头光晕扫过并整体轻震。
// 风格提示词：用电影预告片风格：约 2.6:1 的超宽遮幅，上下黑边贯穿全片，暖棕近黑的暗角夜空里飘着极淡的尘粒，每个意思独占一屏、居中，小号字距拉开的琥珀色眉题、发光的大号衬线数字、一道青铜细线，画面像呼吸一样亮起再经黑场溶出，片名处一道横向镜头光晕加重击。
// 题材：电影年代与屏幕科技 · 适合：新品预告、发布日倒数、品牌大片
scene({
  id: 'C-121', name: '电影预告片', dur: 5, still: 3.5,
  fonts: ["900 80px 'Noto Serif SC'", "italic 400 40px 'Playfair Display'", "700 40px 'Noto Sans SC'"],
  text: '今年秋天一次重新想象长夜十一月十一日全球上映',
  init() { const R = mulberry32(121), dust = []; for (let i = 0; i < 160; i++) dust.push([R(), R(), R(), R()]); return { dust }; },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, bandH = LAND ? W / 2.6 : W * .85, top = (H - bandH) / 2, cx = W / 2, cy = H / 2;
    const AMB = '232,170,90', BRZ = '#A9773F';
    // 底：暖棕近黑 + 尘粒
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, LONG * .6); bg.addColorStop(0, '#2A1A10'); bg.addColorStop(1, '#070504');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    s.dust.forEach(([x, y, z, p]) => { const sp = .02 + z * .05, X = ((x + t * sp) % 1) * W, Y = ((y - t * sp * .4 + 1) % 1) * H, a = (.08 + z * .25) * (.6 + .4 * Math.sin(t * 2 + p * 9)); ctx.fillStyle = `rgba(255,220,170,${a})`; ctx.beginPath(); ctx.arc(X, Y, (.6 + z * 2.2) * u, 0, TAU); ctx.fill(); });
    // 呼吸：每张卡从黑亮起、再溶回黑
    const CARD = [[.05, 1.45], [1.55, 2.95], [3.05, 5.2]];
    const ci = CARD.findIndex(([a, b]) => t >= a && t < b), [a0, b0] = ci >= 0 ? CARD[ci] : [0, 0];
    const br = ci < 0 ? 0 : smooth(a0, a0 + .45, t) * (1 - smooth(b0 - .35, b0, t)), lt = t - a0;
    const eyebrow = (txt, y, size) => { const sp = lerp(.1, .6, eOutCubic(clamp(lt / 1.2))); ctx.font = `700 ${Math.round(size)}px 'Noto Sans SC'`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; const cs = [...txt], ws = cs.map(c => ctx.measureText(c).width), tot = ws.reduce((x, y) => x + y, 0) + size * sp * (cs.length - 1); let x = cx - tot / 2; ctx.fillStyle = `rgba(${AMB},${br})`; cs.forEach((c, i) => { ctx.fillText(c, x, y); x += ws[i] + size * sp; }); };
    const glow = (txt, font, y, col, blur) => { ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); [[blur * 2, .35], [blur, .6], [blur * .3, 1]].forEach(([b, a]) => { ctx.shadowColor = `rgba(${AMB},${a * br})`; ctx.shadowBlur = b * u; ctx.fillStyle = col; ctx.globalAlpha = br; ctx.fillText(txt, cx, y); }); ctx.restore(); };
    const line = (y, w) => { const k = eOutCubic(clamp((lt - .3) / .9)) * w / 2; const g = ctx.createLinearGradient(cx - k, 0, cx + k, 0); g.addColorStop(0, 'rgba(169,119,63,0)'); g.addColorStop(.5, BRZ); g.addColorStop(1, 'rgba(169,119,63,0)'); ctx.globalAlpha = br; ctx.fillStyle = g; ctx.fillRect(cx - k, y, k * 2, 2 * u); ctx.globalAlpha = 1; };
    const push = 1 + (t - a0) * .015;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(push, push); ctx.translate(-cx, -cy);
    const NS = Math.round((LAND ? 260 : 300) * u), ES = (LAND ? 30 : 34) * u;
    if (ci === 0) { eyebrow('今 年 秋 天', cy - NS * .62, ES); glow('11.11', `italic 400 ${NS}px 'Playfair Display'`, cy + 10 * u, '#FFE9C4', 40); line(cy + NS * .55, (LAND ? 520 : 600) * u); }
    if (ci === 1) { eyebrow('一 次 重 新 想 象', cy - NS * .62, ES); glow('10×', `italic 400 ${NS}px 'Playfair Display'`, cy + 10 * u, '#FFE9C4', 40); line(cy + NS * .55, (LAND ? 520 : 600) * u); ctx.globalAlpha = br * .8; ctx.font = `700 ${Math.round(ES)}px 'Noto Sans SC'`; ctx.fillStyle = '#D8C7AE'; ctx.textAlign = 'center'; ctx.fillText('更快的每一帧', cx, cy + NS * .55 + 60 * u); ctx.globalAlpha = 1; }
    if (ci === 2) {
      const hit = t - 3.25, shake = hit > 0 && hit < .3 ? Math.sin(hit * 90) * 10 * u * (1 - hit / .3) : 0;
      ctx.translate(0, shake);
      const ts = Math.round((LAND ? 240 : 270) * u), sc = 1 + .12 * (1 - eOutExpo(clamp((t - 3.2) / .5)));
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
      glow('长  夜', `900 ${ts}px 'Noto Serif SC'`, cy - 10 * u, '#F7E6CC', 30);
      ctx.restore();
      line(cy + ts * .62, (LAND ? 700 : 760) * u);
      eyebrow('11 月 11 日  全 球 上 映', cy + ts * .62 + 70 * u, ES);
      // 横向镜头光晕
      const fl = clamp((t - 3.18) / .7); if (fl > 0 && fl < 1) {
        const fx = lerp(-W * .2, W * 1.2, eInOutCubic(fl)), fa = Math.sin(fl * Math.PI);
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, cy, W, cy); g.addColorStop(0, 'rgba(80,160,255,0)'); g.addColorStop(clamp(fx / W - .25), 'rgba(80,160,255,0)'); g.addColorStop(clamp(fx / W), `rgba(170,215,255,${.9 * fa})`); g.addColorStop(clamp(fx / W + .25), 'rgba(80,160,255,0)'); g.addColorStop(1, 'rgba(80,160,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, cy - 3 * u, W, 6 * u); ctx.globalAlpha = .4; ctx.fillRect(0, cy - 14 * u, W, 28 * u); ctx.globalAlpha = 1;
        const rg = ctx.createRadialGradient(fx, cy, 0, fx, cy, 220 * u); rg.addColorStop(0, `rgba(255,240,220,${.8 * fa})`); rg.addColorStop(.2, `rgba(255,200,140,${.25 * fa})`); rg.addColorStop(1, 'rgba(255,200,140,0)'); ctx.fillStyle = rg; ctx.fillRect(fx - 220 * u, cy - 220 * u, 440 * u, 440 * u);
        [-.5, -.25, .3].forEach((k, i) => { const gx = lerp(fx, cx, 1 + k * 2), r = (30 + i * 20) * u; ctx.fillStyle = `rgba(${['120,200,255', '255,170,90', '180,140,255'][i]},${.18 * fa})`; ctx.beginPath(); ctx.arc(gx, cy + (fx - cx) * .05 * k, r, 0, TAU); ctx.fill(); });
        ctx.globalCompositeOperation = 'source-over';
      }
      const fw = clamp(1 - Math.abs(t - 3.25) / .08); if (fw > 0) { ctx.fillStyle = `rgba(255,245,230,${fw * .5})`; ctx.fillRect(0, 0, W, H); }
    }
    ctx.restore();
    // 遮幅黑边
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, top); ctx.fillRect(0, H - top, W, top);
    vignette(ctx, .55, .3);
    grain(ctx, f, .08);
  }
});
