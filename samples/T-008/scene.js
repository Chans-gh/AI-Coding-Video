// T-008 档案灯箱纪录片：三张 1936 年的底片扫描摆在发亮的灯箱上，镜头在底片之间平移，放大镜在每张的细节上停一会儿；左上角的档案卡用打字机效果打出编号和年份，底部字幕跟旁白
// 素材：照片（美国国会图书馆 FSA 档案，Dorothea Lange 1936 年三张）；旁白青水公开音色；配乐 CC0
scene({
  id: 'T-008', name: '档案灯箱', dur: 15, still: 12.2,
  fonts: ["700 40px 'Noto Serif SC'", "400 40px 'Noto Sans SC'", "400 40px 'JetBrains Mono'"],
  text: '年摄影师多萝西娅兰格走访加利福尼亚的流动农工营地帐篷旧车等着吃饭的孩子她用一台相机记下了大萧条里的流离失所档案美国国会图书馆照片旁白配乐',
  async init() {
    const A = await loadAssets();
    const P = await Promise.all(['p1.jpg', 'p2.jpg', 'p3.jpg'].map(loadImage));
    return { A, P };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    // 每张底片：[开始, 结束, 放大镜看的位置 x, y（0–1）, 档案号]
    const SEQ = [[0, 6.2, .3, .45, '2017759546'], [6.2, 10.1, .58, .3, '2017759545'], [10.1, 15, .43, .3, '2017762891']];
    const i = SEQ.findIndex(x => t < x[1]), cur = i < 0 ? 2 : i;
    // 灯箱：中间亮、四周暗的乳白色光板
    const lg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) * .6);
    lg.addColorStop(0, '#f6f3ea'); lg.addColorStop(.7, '#d9d4c6'); lg.addColorStop(1, '#6c675c');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    // 底片在「桌面」上横排（竖屏竖排），镜头在它们之间平移
    const ph = LAND ? H * .72 : W * .82, gapv = (LAND ? W : H) * .62;
    const mv = k => eInOutCubic(inv(SEQ[k][0] - .5, SEQ[k][0] + .4, t));
    const cam = mv(1) + mv(2);
    ctx.save();
    if (LAND) ctx.translate(W / 2 - cam * gapv, H / 2); else ctx.translate(W / 2, H / 2 - cam * gapv);
    ctx.rotate(-.01);
    s.P.forEach((img, k) => {
      const [sw, sh] = srcSize(img), sc = (LAND ? ph / sh : ph / sw), w = sw * sc, h = sh * sc;
      const ox = LAND ? k * gapv : 0, oy = LAND ? 0 : k * gapv, rot = [-.025, .02, -.012][k];
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(rot);
      ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 24 * u; ctx.shadowOffsetY = 8 * u;
      ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2 - 18 * u, -h / 2 - 18 * u, w + 36 * u, h + 36 * u);
      ctx.shadowColor = 'transparent';
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      // 放大镜：在当前那张上，慢慢移到要看的地方
      if (k === cur) {
        const [, , fx, fy] = SEQ[k], lt = t - SEQ[k][0];
        const a = smooth(.9, 1.5, lt) * (1 - smooth(SEQ[k][1] - SEQ[k][0] - .5, SEQ[k][1] - SEQ[k][0] - .1, lt));
        if (a > 0) {
          const lx = -w / 2 + w * (fx + .05 * Math.sin(lt * .7)), ly = -h / 2 + h * (fy + .03 * Math.cos(lt * .6)), r = 150 * u, z = 2.2;
          ctx.save(); ctx.globalAlpha = a;
          ctx.beginPath(); ctx.arc(lx, ly, r, 0, 7); ctx.save(); ctx.clip();
          ctx.drawImage(img, lx - (lx + w / 2) * z, ly - (ly + h / 2) * z, w * z, h * z);
          const sh_ = ctx.createRadialGradient(lx, ly, r * .7, lx, ly, r); sh_.addColorStop(0, 'rgba(0,0,0,0)'); sh_.addColorStop(1, 'rgba(0,0,0,.35)');
          ctx.fillStyle = sh_; ctx.fill(); ctx.restore();
          ctx.lineWidth = 14 * u; ctx.strokeStyle = '#1c1b19'; ctx.stroke();
          ctx.lineWidth = 3 * u; ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(lx, ly, r - 9 * u, 3.6, 4.6); ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
    });
    ctx.restore();
    // 档案卡：打字机效果
    const lt = t - SEQ[cur][0], card = [`LOC ${SEQ[cur][4]}`, '1936 · CALIFORNIA', 'PHOTO: DOROTHEA LANGE'];
    const bx = 40 * u, by = (LAND ? 40 : 120) * u;
    ctx.save(); ctx.fillStyle = 'rgba(244,236,214,.94)'; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 12 * u;
    ctx.fillRect(bx, by, 420 * u, 150 * u); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(180,60,50,.6)'; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(bx + 16 * u, by + 50 * u); ctx.lineTo(bx + 404 * u, by + 50 * u); ctx.stroke();
    ctx.fillStyle = '#2a2622'; ctx.font = `400 ${24 * u}px 'JetBrains Mono'`; ctx.textBaseline = 'alphabetic';
    let left = Math.floor(lt * 28);
    card.forEach((l, k) => { const n = clamp(left, 0, l.length); left -= l.length; ctx.fillText(l.slice(0, n), bx + 20 * u, by + (38 + k * 42) * u); });
    ctx.restore();
    // 字幕、署名、暗角
    const vg = ctx.createRadialGradient(W / 2, H / 2, SHORT * .4, W / 2, H / 2, Math.hypot(W, H) * .62);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const c = cueAt(s.A, t);
    if (c) caption(ctx, c.text, { size: LAND ? 36 : 42, font: "'Noto Serif SC'", bg: 'rgba(20,18,16,.72)' });
    ctx.save(); ctx.font = `400 ${16 * u}px 'Noto Sans SC'`; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textAlign = 'right';
    ctx.fillText(credits(s.A), W - 24 * u, H - 18 * u); ctx.restore();
  },
});
