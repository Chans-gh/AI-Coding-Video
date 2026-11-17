// C-114 霓虹灯牌：Canvas 2D 先把砖墙预画好；灯管就是字形描边和碗的路径，未通电时描一道暗玻璃，通电后在离屏层上用叠加混合把同一路径从 70 像素宽的淡光一路描到 5 像素的白芯；通电那半秒按帧哈希随机明灭；再用径向渐变把灯色洒到墙上，地面是把灯牌层上下翻转、逐条横向错开的倒影，加雨点涟漪。
// 风格提示词：用霓虹灯牌风格：夜里一面深色砖墙，文字和图标是弯出来的玻璃灯管，未通电时是暗玻璃，通电时先闪烁几下、嗡嗡作响再稳住，管芯白热、外圈是粉、青或黄的光晕，光洒在砖墙上并倒映在湿地面里，一场只挂一块招牌，最多三种灯色。
// 题材：电影年代与屏幕科技 · 适合：品牌口号、夜生活、开业宣传
scene({
  id: 'C-114', name: '霓虹灯牌', dur: 5, still: 3.4,
  fonts: ["400 80px 'ZCOOL KuaiLe'", "80px 'Bebas Neue'"],
  text: '通宵面馆',
  init() {
    const u = SHORT / 1080, wall = mk(W, H), g = wall.getContext('2d'), R = mulberry32(114);
    g.fillStyle = '#100D10'; g.fillRect(0, 0, W, H);
    const bh = 64 * u, bw = 190 * u;
    for (let r = 0, y = 0; y < H; r++, y += bh) for (let x = -(r % 2) * bw / 2; x < W; x += bw) {
      const v = 28 + R() * 16; g.fillStyle = `rgb(${v + 14},${v * .6},${v * .6})`; g.fillRect(x + 4 * u, y + 4 * u, bw - 8 * u, bh - 8 * u);
      for (let k = 0; k < 12; k++) { g.fillStyle = `rgba(0,0,0,${R() * .35})`; g.fillRect(x + R() * bw, y + R() * bh, 3 * u + R() * 10 * u, 2 * u + R() * 4 * u); }
      g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(x + 4 * u, y + 4 * u, bw - 8 * u, 3 * u);
    }
    return { wall, off: mk(W, H) };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, o = s.off.getContext('2d'), fy = LAND ? H * .8 : H * .76;
    const PINK = '255,60,170', CYAN = '40,230,255', YEL = '255,214,60';
    const lvl = (t0, seed) => { if (t < t0) return 0; if (t < t0 + .55) { const fl = hash1(Math.floor(t * 15) * 7.3 + seed); return fl > .55 ? .4 + fl * .6 : fl > .3 ? .15 : 0; } return .95 + .05 * hash1(f * 3.1 + seed); };
    // 招牌三件：字、碗、OPEN
    const EL = [];
    const zh = LAND ? ['通宵面馆'] : ['通宵', '面馆'], fs = (LAND ? 250 : 330) * u;
    const tx = LAND ? W * .58 : W / 2, ty0 = LAND ? H * .4 : H * .4;
    let L1 = lvl(.5, 1);
    if (t > 3.9 && t < 4.15) L1 *= hash1(Math.floor(t * 30) * 1.7) > .5 ? 1 : .2;   // 中途闪一下
    EL.push({ col: PINK, L: L1, cx: tx, cy: ty0, path: (c) => { c.font = `400 ${Math.round(fs)}px 'ZCOOL KuaiLe'`; c.textAlign = 'center'; c.textBaseline = 'middle'; zh.forEach((ln, i) => c.strokeText(ln, tx, ty0 + (i - (zh.length - 1) / 2) * fs * 1.1)); } });
    const bx = LAND ? W * .2 : W / 2, by = LAND ? H * .38 : H * .14, br = (LAND ? 140 : 150) * u;
    EL.push({ col: CYAN, L: lvl(1.3, 2), cx: bx, cy: by, path: (c) => {
      c.beginPath(); c.moveTo(bx - br, by); c.lineTo(bx + br, by); c.arc(bx, by, br, 0, Math.PI); c.closePath();
      c.moveTo(bx - br * .4, by + br * 1.15); c.lineTo(bx + br * .4, by + br * 1.15);
      c.moveTo(bx + br * .2, by - br * .1); c.lineTo(bx + br * 1.1, by - br * .9); c.moveTo(bx + br * .45, by - br * .05); c.lineTo(bx + br * 1.3, by - br * .75);
      for (let k = -1; k <= 1; k++) { const x = bx + k * br * .45 - br * .1; c.moveTo(x, by - br * .2); c.bezierCurveTo(x - br * .2, by - br * .45, x + br * .2, by - br * .6, x, by - br * .9); }
      c.stroke(); } });
    const ox = LAND ? W * .58 : W / 2, oy = LAND ? H * .66 : H * .63, ofs = (LAND ? 130 : 150) * u;
    let L3 = lvl(2.2, 3);
    EL.push({ col: YEL, L: L3, cx: ox, cy: oy, path: (c) => { c.font = `${Math.round(ofs)}px 'Bebas Neue'`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.strokeText('OPEN 24H', ox, oy); c.beginPath(); c.roundRect(ox - ofs * 2.2, oy - ofs * .62, ofs * 4.4, ofs * 1.2, ofs * .3); c.stroke(); } });
    // 砖墙 + 灯色洒在墙上
    ctx.drawImage(s.wall, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    EL.forEach(e => { if (!e.L) return; const r = (LAND ? 620 : 560) * u, g = ctx.createRadialGradient(e.cx, e.cy, 0, e.cx, e.cy, r); g.addColorStop(0, `rgba(${e.col},${.32 * e.L})`); g.addColorStop(1, `rgba(${e.col},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, fy); });
    ctx.globalCompositeOperation = 'source-over';
    // 支架和电源盒
    ctx.fillStyle = '#1B1A1E'; ctx.strokeStyle = '#2E2C33'; ctx.lineWidth = 6 * u;
    const tb = [LAND ? W * .9 : W * .82, LAND ? H * .14 : H * .27]; rr(ctx, tb[0] - 60 * u, tb[1] - 40 * u, 120 * u, 80 * u, 8 * u); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tb[0], tb[1] + 40 * u); ctx.bezierCurveTo(tb[0], tb[1] + 220 * u, tx + 300 * u, ty0 - 260 * u, tx + 200 * u, ty0 - 150 * u); ctx.stroke();
    // 灯管层
    o.clearRect(0, 0, W, H); o.lineCap = o.lineJoin = 'round';
    EL.forEach(e => { o.strokeStyle = 'rgba(70,55,75,.9)'; o.lineWidth = 13 * u; e.path(o); o.strokeStyle = 'rgba(255,255,255,.12)'; o.lineWidth = 4 * u; e.path(o); });
    o.globalCompositeOperation = 'lighter';
    EL.forEach(e => { if (!e.L) return; [[70, .05], [42, .1], [24, .3], [13, 1]].forEach(([w, a]) => { o.strokeStyle = `rgba(${e.col},${a * e.L})`; o.lineWidth = w * u; e.path(o); }); o.strokeStyle = `rgba(255,255,255,${.85 * e.L})`; o.lineWidth = 5 * u; e.path(o); });
    o.globalCompositeOperation = 'source-over';
    ctx.drawImage(s.off, 0, 0);
    // 湿地面 + 倒影
    ctx.fillStyle = '#07070A'; ctx.fillRect(0, fy, W, H - fy);
    ctx.fillStyle = '#1A171C'; ctx.fillRect(0, fy, W, 6 * u);
    const st = 4 * u;
    ctx.globalAlpha = .45;
    for (let y = fy; y < H; y += st) { const d = (y - fy), sy = fy - d * 1.25 - (LAND ? 40 : 60) * u, dx = Math.sin(y * .045 / u + t * 3) * (3 + d / u * .03) * u; if (sy < 0) break; ctx.drawImage(s.off, 0, sy, W, st * 1.25, dx, y, W, st); }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    EL.forEach(e => { if (!e.L) return; const g = ctx.createRadialGradient(e.cx, fy, 0, e.cx, fy, 520 * u); g.addColorStop(0, `rgba(${e.col},${.16 * e.L})`); g.addColorStop(1, `rgba(${e.col},0)`); ctx.fillStyle = g; ctx.fillRect(0, fy, W, H - fy); });
    ctx.globalCompositeOperation = 'source-over';
    // 雨点涟漪 + 细雨
    for (let k = 0; k < 10; k++) { const p = (t * .9 + k * .37) % 1, R = mulberry32(k * 31 + Math.floor(t * .9 + k * .37)); const x = R() * W, y = fy + 30 * u + R() * (H - fy - 40 * u); ctx.strokeStyle = `rgba(200,200,230,${.35 * (1 - p)})`; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.ellipse(x, y, p * 70 * u, p * 16 * u, 0, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(200,210,255,.12)'; ctx.lineWidth = 2 * u;
    for (let k = 0; k < 70; k++) { const x = hash1(k * 3.3) * W, y = ((hash1(k * 7.7) + t * 1.6) % 1) * fy; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6 * u, y + 40 * u); ctx.stroke(); }
    vignette(ctx, .6, .35);
  }
});
