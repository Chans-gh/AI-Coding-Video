// C-175 窗光与尘：窗户画在一张小画布上（亮的窗格、暗的窗棂和窗台盆栽的剪影），用仿射变换把它“投”到地板上成为光斑，再在窗和光斑之间插值画几十层淡淡的叠加，就成了带窗棂影子的体积光柱；尘埃在光柱里的亮度直接取光柱图层的值，太阳角度随时间慢慢移动
// 风格提示词：用窗光与尘风格：昏暗安静的室内，一束午后斜阳从百叶窗或格子窗射进来，在空气中形成清晰的体积光柱，光柱里无数细小尘埃缓慢翻滚闪亮，地板和墙上的窗格暖黄光块随时间缓缓移动，阴影是冷灰蓝，镜头静止或极慢推移，只有钟表的滴答声。
// 题材：3D 与实时图形 · 适合：怀旧与回忆、阅读与书房、慢节奏开场
scene({
  id: 'C-175', name: '窗光与尘', dur: 4.5, still: 3.2,
  init() {
    // 窗的“光罩”：窗格透光，窗棂和盆栽挡光（局部坐标 300×420）
    const win = mk(300, 420), g = win.getContext('2d');
    g.fillStyle = 'rgb(255,214,150)'; g.fillRect(0, 0, 300, 420);
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    g.fillRect(0, 0, 300, 10); g.fillRect(0, 410, 300, 10); g.fillRect(0, 0, 10, 420); g.fillRect(290, 0, 10, 420);
    g.fillRect(145, 0, 10, 420); for (const y of [140, 275]) g.fillRect(0, y, 300, 9);
    const R = mulberry32(9);
    g.beginPath(); g.moveTo(205, 420); g.lineTo(215, 380); g.lineTo(265, 380); g.lineTo(275, 420); g.fill();   // 花盆
    for (let k = 0; k < 14; k++) {                                     // 叶子
      const a = -Math.PI / 2 + (R() - .5) * 2.2, l = 50 + 60 * R(), x = 240 + Math.cos(a) * l, y = 378 + Math.sin(a) * l;
      g.save(); g.translate((240 + x) / 2, (378 + y) / 2); g.rotate(a); g.beginPath(); g.ellipse(0, 0, l / 2, 9 + 6 * R(), 0, 0, TAU); g.fill(); g.restore();
    }
    return { win, beam: mk(W / 4, H / 4), dust: Array.from({ length: 520 }, () => ({ x: R(), y: R(), z: R(), ph: R() * TAU, w: .5 + 2 * R() })) };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, yF = H * (LAND ? .64 : .6);
    const wx = LAND ? W * .2 : W * .14, wy = LAND ? H * .12 : H * .18, ww = SHORT * (LAND ? .3 : .42), wh = ww * 1.4;
    const sun = t / 4.5;                                               // 太阳慢慢偏移
    // 地板光斑：窗底边 → 靠墙处，窗顶边 → 靠近镜头处，向右偏
    const near = H * (LAND ? .97 : .93), sh = SHORT * (.42 + .07 * sun);
    const A = [ww * 1.25, 0], B = [-(sh * .35), -(near - yF - 30 * u)];   // 局部 x、y 轴在屏幕上的方向（y 朝墙）
    const P0 = [wx + sh, near];
    const toFloor = [A[0] / 300, A[1] / 300, B[0] / 420, B[1] / 420, P0[0], P0[1]];
    const toWin = [ww / 300, 0, 0, wh / 420, wx, wy];
    // 房间：冷灰蓝的墙和地板
    const z = 1 + .03 * t / 4.5;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    const wall = ctx.createLinearGradient(0, 0, 0, yF); wall.addColorStop(0, '#1d2230'); wall.addColorStop(1, '#2a2f3c');
    ctx.fillStyle = wall; ctx.fillRect(-50, -50, W + 100, yF + 50);
    const floor = ctx.createLinearGradient(0, yF, 0, H); floor.addColorStop(0, '#26221f'); floor.addColorStop(1, '#141210');
    ctx.fillStyle = floor; ctx.fillRect(-50, yF, W + 100, H - yF + 50);
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2 * u;
    for (let k = -12; k <= 12; k++) { ctx.beginPath(); ctx.moveTo(W / 2 + k * 60 * u, yF); ctx.lineTo(W / 2 + k * 260 * u, H + 50); ctx.stroke(); }   // 地板缝
    ctx.fillStyle = '#15171f'; ctx.fillRect(-50, yF - 14 * u, W + 100, 14 * u);      // 踢脚线
    // 窗：本身是亮的
    ctx.fillStyle = '#0d0f15'; ctx.fillRect(wx - 16 * u, wy - 16 * u, ww + 32 * u, wh + 40 * u);
    ctx.save(); ctx.transform(...toWin); ctx.filter = 'brightness(1.35)'; ctx.drawImage(s.win, 0, 0); ctx.restore();
    // 墙上的钟：秒针一秒一跳
    const cx = LAND ? W * .74 : W * .76, cy = LAND ? H * .3 : H * .42, cr = 70 * u;
    ctx.fillStyle = '#d9d2c3'; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a3128'; ctx.lineWidth = 8 * u; ctx.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * cr * .78, cy + Math.sin(a) * cr * .78); ctx.lineTo(cx + Math.cos(a) * cr * .9, cy + Math.sin(a) * cr * .9); ctx.stroke(); }
    const hand = (a, l, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - Math.PI / 2) * l, cy + Math.sin(a - Math.PI / 2) * l); ctx.stroke(); };
    hand(TAU * 4.1 / 12, cr * .5, 6 * u); hand(TAU * 47 / 60, cr * .72, 4 * u);
    ctx.strokeStyle = '#a3322a'; hand(TAU * (12 + Math.floor(t + .5)) / 60, cr * .8, 2 * u);
    // 地板光斑（柔边）和光柱
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = `blur(${4 * u}px)`; ctx.globalAlpha = .75;
    ctx.transform(...toFloor); ctx.drawImage(s.win, 0, 0); ctx.restore();
    const bc = s.beam.getContext('2d'); bc.setTransform(1, 0, 0, 1, 0, 0); bc.clearRect(0, 0, W / 4, H / 4);
    bc.globalCompositeOperation = 'lighter';
    for (let k = 0; k <= 30; k++) {
      const q = k / 30, m = toWin.map((v, i) => lerp(v, toFloor[i], q) / 4);
      bc.setTransform(...m); bc.globalAlpha = .1 * (1 - .5 * q); bc.drawImage(s.win, 0, 0);
    }
    bc.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = `blur(${3 * u}px)`; ctx.drawImage(s.beam, 0, 0, W, H); ctx.restore();
    // 光斑映到四周的暖色反光
    const bx0 = P0[0] + A[0] / 2 + B[0] / 2, by0 = P0[1] + B[1] / 2, bounce = ctx.createRadialGradient(bx0, by0, 0, bx0, by0, SHORT * .7);
    bounce.addColorStop(0, 'rgba(255,170,90,.16)'); bounce.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = bounce; ctx.fillRect(-50, -50, W + 100, H + 100); ctx.restore();
    // 尘埃：亮度取光柱图层
    const bd = bc.getImageData(0, 0, W / 4, H / 4).data;
    for (const d of s.dust) {
      const x = (d.x * 1.1 - .05) * W + (vnoise(d.ph * 7, t * .25) - .5) * 160 * u, y = d.y * H * .95 + (vnoise(d.ph * 5 + 9, t * .2) - .5) * 160 * u - t * 6 * u * d.w;
      const bx = clamp(Math.floor(x / 4), 0, W / 4 - 1), by = clamp(Math.floor(y / 4), 0, H / 4 - 1), lit = bd[(by * W / 4 + bx) * 4 + 3] / 255;
      const sp = .3 + .7 * Math.pow(.5 + .5 * Math.sin(t * d.w * 3 + d.ph), 4);    // 翻滚时一闪一闪
      const a = (.04 + lit * 2.2) * sp; if (a < .03) continue;
      const r = (1 + 2.6 * d.z) * u;
      ctx.fillStyle = `rgba(255,232,190,${Math.min(1, a)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // 冷色阴影 + 暗角
    ctx.fillStyle = 'rgba(30,45,80,.12)'; ctx.globalCompositeOperation = 'multiply'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    vignette(ctx, .7, .3, '5,8,18');
  }
});
