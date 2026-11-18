// C-143 俄国构成主义：Canvas 2D 先在小画布上画一张灰度“照片”（逆光的烟囱厂房和大齿轮），逐格取亮度换成大小不一的黑网点，剪成带白边的照片斜贴；红色楔形从左下刺进黑色大圆，粗体方块字沿对角线逐字像盖章一样砸下（放大 → 1 倍、带一帧抖动），整块拼贴板按节拍用 eOutExpo 快速推近、拉远。
// 风格提示词：用俄国构成主义风格：灰卡纸底上只有黑和红两色大平面与斜放的粗体方块字，代码画出的灰度“照片”经网点化后剪下、带白边贴上去，红色楔形直刺黑色圆形，构图沿对角线冲出画框，标语逐字像盖章一样砸下，镜头在拼贴板上快速推拉。
// 题材：平面设计与动态排版 · 适合：宣言与观点片、工业与工程史、论证型讲解
scene({
  id: 'C-143', name: '俄国构成主义', dur: 4, still: 3.3,
  text: '建设新世界钢铁与电力',
  fonts: ["900 80px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  init() {
    const u = SHORT / 1080, card = makePaper('#BDB5A2', { seed: 143, grain: 18, fiber: .4, blot: 6, w: W, h: H });
    // 灰度照片：天空渐亮、烟囱厂房、齿轮剪影
    const sw = 120, sh = 90, src = mk(sw, sh), g = src.getContext('2d');
    const sk = g.createLinearGradient(0, 0, 0, sh); sk.addColorStop(0, '#555'); sk.addColorStop(.7, '#E8E8E8'); g.fillStyle = sk; g.fillRect(0, 0, sw, sh);
    g.fillStyle = '#B0B0B0'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(30 + i * 14, 20 - i * 3, 14 + i * 3, 7 + i, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#222'; [[20, 18, 8], [38, 10, 7], [56, 26, 6]].forEach(([x, y, w]) => g.fillRect(x, y, w, sh - y));
    g.fillRect(0, 60, 90, 30); g.beginPath(); for (let i = 0; i < 4; i++) { g.moveTo(i * 22, 60); g.lineTo(i * 22 + 22, 46); g.lineTo(i * 22 + 22, 60); } g.fill();
    g.fillStyle = '#333'; g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 26 : 32; g.lineTo(98 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.fill();
    g.fillStyle = '#ccc'; g.beginPath(); g.arc(98, 64, 9, 0, TAU); g.fill();
    const px = g.getImageData(0, 0, sw, sh).data, cs = 7 * u, pw = Math.round(sw * cs), ph = Math.round(sh * cs);
    const photo = mk(pw + Math.round(36 * u), ph + Math.round(36 * u)), q = photo.getContext('2d'), b = 18 * u;
    q.fillStyle = '#F4F1E8'; q.fillRect(0, 0, photo.width, photo.height); q.fillStyle = '#E9E5D8'; q.fillRect(b, b, pw, ph); q.fillStyle = '#151312';
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { const d = 1 - px[(y * sw + x) * 4] / 255, r = Math.sqrt(d) * cs * .62; if (r > .3) { q.beginPath(); q.arc(b + (x + .5 + (y % 2) * .5) * cs, b + (y + .5) * cs, r, 0, TAU); q.fill(); } }
    return { card, photo };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, RED = '#C8261E', BLK = '#141211';
    // 镜头：两次快推、一次拉回
    const z = 1 + .12 * eOutExpo(inv(1.15, 1.45, t)) + .1 * eOutExpo(inv(2.25, 2.55, t)) - .2 * eOutExpo(inv(3.0, 3.4, t));
    const fx = LAND ? W * .55 : W * .5, fy = LAND ? H * .45 : H * .45;
    ctx.save(); ctx.translate(fx, fy); ctx.scale(z, z); ctx.rotate((z - 1) * .08); ctx.translate(-fx, -fy);
    ctx.drawImage(s.card, -W * .1, -H * .1, W * 1.2, H * 1.2);
    // 黑色大圆
    const cx = LAND ? W * .72 : W * .62, cy = LAND ? H * .36 : H * .24, cr = (LAND ? 300 : 330) * u, cp = eOutBack(inv(.0, .4, t));
    ctx.fillStyle = BLK; ctx.beginPath(); ctx.arc(cx, cy, cr * cp, 0, TAU); ctx.fill();
    // 细线和刻度
    ctx.strokeStyle = BLK; ctx.lineWidth = 4 * u; const lp = eOutExpo(inv(.2, .6, t));
    ctx.beginPath(); ctx.moveTo(-50, H * (LAND ? .95 : .7)); ctx.lineTo(lerp(-50, W + 50, lp), lerp(H * (LAND ? .95 : .7), H * (LAND ? -.05 : .1), lp)); ctx.stroke();
    ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.moveTo(-50, H * (LAND ? 1.02 : .76)); ctx.lineTo(lerp(-50, W + 50, lp), lerp(H * (LAND ? 1.02 : .76), H * (LAND ? .02 : .16), lp)); ctx.stroke();
    // 网点照片：白边、斜贴、滑入
    const pp = eOutExpo(inv(.45, .85, t)), ph = s.photo;
    ctx.save(); ctx.translate(LAND ? W * .28 : W * .36, LAND ? H * .34 : H * .56); ctx.translate((1 - pp) * -W * .6, (1 - pp) * H * .3); ctx.rotate(-.18);
    const ps = LAND ? .85 : .92; ctx.scale(ps, ps);
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowOffsetX = 8 * u; ctx.shadowOffsetY = 8 * u; ctx.drawImage(ph, -ph.width / 2, -ph.height / 2); ctx.restore();
    // 红色楔形：从左下刺进黑圆
    const wp = eOutExpo(inv(.7, 1.0, t)), ang = Math.atan2(cy - H * 1.1, cx - W * -.1), tipX = lerp(-W * .2, cx - Math.cos(ang) * cr * .35, wp), tipY = lerp(H * 1.3, cy - Math.sin(ang) * cr * .35, wp);
    const base = 230 * u, bx = tipX - Math.cos(ang) * LONG * .9, by = tipY - Math.sin(ang) * LONG * .9;
    ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(bx - Math.sin(ang) * base, by + Math.cos(ang) * base); ctx.lineTo(bx + Math.sin(ang) * base, by - Math.cos(ang) * base); ctx.fill();
    // 标语：沿对角线逐字砸下
    const stamp = (txt, x, y, a, size, t0, fg, bg) => {
      [...txt].forEach((ch, i) => {
        const t1 = t0 + i * .13, p = inv(t1, t1 + .1, t); if (p <= 0) return;
        const k = 1 + (1 - p) * 1.6, sh = t < t1 + .17 && p >= 1 ? (hash1(i + (t * 30 | 0)) - .5) * 10 * u : 0;
        ctx.save(); ctx.translate(x + Math.cos(a) * i * size * 1.02 + sh, y + Math.sin(a) * i * size * 1.02); ctx.rotate(a); ctx.scale(k, k); ctx.globalAlpha = clamp(p * 1.5);
        if (bg) { ctx.fillStyle = bg; ctx.fillRect(-size * .5, -size * .56, size * 1.04, size * 1.08); }
        ctx.fillStyle = fg; ctx.font = `900 ${size}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, size * .04); ctx.restore();
      });
    };
    const A = -.42;
    if (LAND) { stamp('建设', W * .1, H * .8, A, 170 * u, 1.1, BLK); stamp('新世界', W * .36, H * .83, A, 150 * u, 1.45, '#F2EEE4', RED); }
    else { stamp('建设', W * .14, H * .8, A, 190 * u, 1.1, BLK); stamp('新世界', W * .2, H * .93, A, 170 * u, 1.45, '#F2EEE4', RED); }
    // 小字：钢铁与电力 + 年份
    const sp = inv(2.2, 2.4, t);
    if (sp > 0) {
      ctx.save(); ctx.translate(cx + cr * .4, cy + cr * .12); ctx.rotate(A); ctx.globalAlpha = sp;
      ctx.fillStyle = '#F2EEE4'; ctx.font = `900 ${56 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.fillText('钢铁与电力', 0, 20 * u);
      ctx.fillStyle = RED; ctx.font = `${120 * u}px 'Bebas Neue'`; ctx.fillText('1928', 0, -50 * u); ctx.restore();
    }
    ctx.restore();
  }
});
