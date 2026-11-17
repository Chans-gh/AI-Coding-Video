// C-035 70 年代电视片头：Canvas 2D 先在离屏画布上画一整屏：慢转的橙褐放射光芒、沿贝塞尔曲线逐段长出的五色平行彩条（每条是同一曲线按法线偏移）、逐字弹入的粗黑体标题外套四层不同颜色的粗描边当投影；再把这屏贴进圆角显像管：红、青两份错开几像素叠出色散，加扫描线、一条往下滚的亮带和暗角，外面是木纹电视壳。
// 风格提示词：用 70 年代电视节目片头风格：橙、褐、芜菇黄的暖色调，放射光线和彩虹条纹，圆润粗衣线字体带多层描边阴影，画面像显像管电视播放（圆角、暗角、轻微扫描线和色散），来一段复古放克配乐。
// 题材：平面设计与动态排版 · 适合：怀旧开场、系列片头
scene({
  id: 'C-035', name: '70 年代电视片头', dur: 5, still: 3.2,
  fonts: ["900 80px 'Noto Sans SC'", "400 60px 'ZCOOL KuaiLe'", "80px 'Limelight'"],
  text: '周末大放送每周六晚七点半准时见',
  init() { return { off: mk(W, H), wood: makePaper('#5A3418', { seed: 35, blot: 0, grain: 26, fiber: .9 }) }; },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, g = s.off.getContext('2d');
    const PAL = ['#5C2E12', '#B5471B', '#E8761E', '#F2B33D', '#F6DFA4'];
    // 外壳：木纹 + 屏幕圆角
    ctx.drawImage(s.wood, 0, 0, W, H);
    ctx.fillStyle = 'rgba(30,14,4,.35)'; for (let y = 0; y < H; y += 9 * u) ctx.fillRect(0, y + Math.sin(y * .02) * 3 * u, W, 2 * u);
    const m = (LAND ? 50 : 40) * u, sx = m, sy = m, sw = W - 2 * m, sh = H - 2 * m - (LAND ? 0 : 0), rad = (LAND ? 90 : 80) * u;
    // —— 离屏：片头本身 ——
    const cx = W / 2, cy = LAND ? H * .48 : H * .45;
    g.fillStyle = '#3B1C0B'; g.fillRect(0, 0, W, H);
    const ray = eOutCubic(clamp(t / .6));
    for (let k = 0; k < 24; k++) { const a = k * TAU / 24 + t * .25; g.fillStyle = k % 2 ? '#6B3214' : '#8A4518'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, LONG * ray, a, a + TAU / 24); g.closePath(); g.fill(); }
    const cg = g.createRadialGradient(cx, cy, 0, cx, cy, LONG * .5); cg.addColorStop(0, 'rgba(255,200,90,.55)'); cg.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = cg; g.fillRect(0, 0, W, H);
    // 五色彩条：同一条曲线按法线偏移
    const P0 = LAND ? [-.1 * W, .95 * H] : [-.15 * W, .9 * H], P1 = LAND ? [.45 * W, .95 * H] : [.6 * W, .95 * H], P2 = LAND ? [.6 * W, .1 * H] : [.75 * W, .55 * H], P3 = LAND ? [1.15 * W, .15 * H] : [1.2 * W, .4 * H];
    const bez = k => { const q = 1 - k; return [q * q * q * P0[0] + 3 * q * q * k * P1[0] + 3 * q * k * k * P2[0] + k * k * k * P3[0], q * q * q * P0[1] + 3 * q * q * k * P1[1] + 3 * q * k * k * P2[1] + k * k * k * P3[1]]; };
    const base = Array.from({ length: 121 }, (_, i) => bez(i / 120)), bw = (LAND ? 46 : 40) * u;
    const nrm = base.map((p, i) => { const a = base[Math.max(0, i - 1)], b = base[Math.min(120, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
    g.lineCap = 'butt'; g.lineJoin = 'round';
    PAL.forEach((c, b) => {
      const off = (b - 2) * bw, pts = base.map((p, i) => [p[0] + nrm[i][0] * off, p[1] + nrm[i][1] * off]);
      g.strokeStyle = c; g.lineWidth = bw + 1; drawPartial(g, pts, eInOutCubic(clamp((t - .15 - b * .06) / .9)));
    });
    // 小星星闪
    for (let k = 0; k < 7; k++) { const R = mulberry32(k + 35), x = R() * W, y = R() * H * .5 + H * .05, p = Math.max(0, Math.sin(t * 4 + k * 1.7)); if (t < 1.2 + k * .1) continue; g.save(); g.translate(x, y); g.rotate(t); g.scale(p, p); g.fillStyle = '#F6DFA4'; g.beginPath(); for (let j = 0; j < 8; j++) { const r = (j % 2 ? 6 : 26) * u, a = j / 8 * TAU; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); }
    // 标题：逐字弹入，四层描边当投影
    const T = LAND ? ['周末大放送'] : ['周末', '大放送'], fs = (LAND ? 210 : 240) * u;
    g.font = `900 ${Math.round(fs)}px 'Noto Sans SC'`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    let ci = 0;
    T.forEach((ln, li) => {
      const chars = [...ln], cwid = fs * 1.02, x0 = cx - (chars.length - 1) * cwid / 2, ly = cy + (li - (T.length - 1) / 2) * fs * 1.15 - (LAND ? 30 : 60) * u;
      chars.forEach((c, i) => {
        const p = clamp((t - .9 - ci * .12) / .35); ci++; if (p <= 0) return;
        const sc = eOutBack(p, 2.6), bob = Math.sin(t * 5 + ci) * 6 * u * clamp(t - 2);
        g.save(); g.translate(x0 + i * cwid, ly + bob); g.rotate((ci % 2 ? -.05 : .05) * (1 - p * .5)); g.scale(sc, sc);
        [[PAL[0], 70, 18], [PAL[1], 54, 13], [PAL[2], 38, 8], [PAL[3], 22, 4]].forEach(([col, lw, d]) => { g.strokeStyle = col; g.lineWidth = lw * u; g.strokeText(c, d * u, d * u); });
        g.fillStyle = '#FFF4D6'; g.fillText(c, 0, 0);
        g.restore();
      });
    });
    // 副标：胶囊牌
    const sp = eOutBack(clamp((t - 2.0) / .4), 2);
    if (sp > 0) {
      const py = LAND ? cy + fs * .85 : cy + fs * 1.55;
      g.save(); g.translate(cx, py); g.scale(sp, sp);
      g.font = `400 ${Math.round((LAND ? 64 : 66) * u)}px 'ZCOOL KuaiLe'`; const tw = g.measureText('每周六晚 7:30 准时见').width + 90 * u;
      rr(g, -tw / 2 + 10 * u, -50 * u + 10 * u, tw, 100 * u, 50 * u); g.fillStyle = PAL[0]; g.fill();
      rr(g, -tw / 2, -50 * u, tw, 100 * u, 50 * u); g.fillStyle = PAL[3]; g.fill(); g.lineWidth = 6 * u; g.strokeStyle = PAL[0]; g.stroke();
      g.fillStyle = PAL[0]; g.fillText('每周六晚 7:30 准时见', 0, 4 * u);
      g.restore();
    }
    // 台标
    const lp = clamp((t - 2.4) / .3);
    if (lp > 0) { g.globalAlpha = lp; g.font = `${Math.round(58 * u)}px 'Limelight'`; g.textAlign = 'left'; g.fillStyle = '#F6DFA4'; g.fillText('CH·7', sx + 70 * u, sy + 90 * u); g.globalAlpha = 1; }
    // —— 贴进显像管：色散 + 扫描线 + 滚动亮带 ——
    ctx.save(); rr(ctx, sx, sy, sw, sh, rad); ctx.clip();
    ctx.drawImage(s.off, 0, 0);
    const ca = 4 * u;
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .2;
    ctx.drawImage(s.off, ca, 0); ctx.drawImage(s.off, -ca, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = sy; y < sy + sh; y += 5 * u) ctx.fillRect(sx, y, sw, 2 * u);
    const by = sy + ((t * .35) % 1) * (sh + 200 * u) - 100 * u, bg = ctx.createLinearGradient(0, by - 80 * u, 0, by + 80 * u);
    bg.addColorStop(0, 'rgba(255,240,210,0)'); bg.addColorStop(.5, 'rgba(255,240,210,.08)'); bg.addColorStop(1, 'rgba(255,240,210,0)'); ctx.fillStyle = bg; ctx.fillRect(sx, by - 80 * u, sw, 160 * u);
    const vg = ctx.createRadialGradient(W / 2, H / 2, SHORT * .3, W / 2, H / 2, LONG * .62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,4,0,.75)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const gl = ctx.createLinearGradient(sx, sy, sx + sw * .5, sy + sh * .5); gl.addColorStop(0, 'rgba(255,255,255,.1)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(sx, sy, sw, sh);
    // 开机：中间一条亮线展开
    const on = clamp(t / .35); if (on < 1) { ctx.fillStyle = '#000'; ctx.fillRect(sx, sy, sw, sh); const hh = sh * eOutCubic(on) * .5; ctx.fillStyle = '#FFF4D6'; ctx.fillRect(sx, H / 2 - Math.max(2 * u, hh * .05), sw, Math.max(4 * u, hh * .1)); }
    grain(ctx, f, .12);
    ctx.restore();
    rr(ctx, sx, sy, sw, sh, rad); ctx.lineWidth = 10 * u; ctx.strokeStyle = '#1E0E04'; ctx.stroke();
  }
});
