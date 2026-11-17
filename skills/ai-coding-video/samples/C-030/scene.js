// C-030 剪影剧场：Canvas 2D 的天空是一条三段渐变，三个色标都随 t 从日落的橙红插值到月夜的深蓝；太阳沉下、月亮和星星升起；山、房子、树和走路的小人全是纯黑剪影，小人的腿按步频摆动；两侧和顶上画带褶皱阴影的暗红幕布框住画面，三行短诗依次淡入淡出。
// 风格提示词：用剪影剧场风格：人物、房屋和树全是纯黑剪影，背景是一整片渐变天空，随剧情从日落的橙红慢慢变到月夜的深蓝，暗色幕布框住画面，只有很少几行诗一样的文字。
// 题材：纸艺、材质与定格 · 适合：诗意短片
scene({
  id: 'C-030', name: '剪影剧场', dur: 5, still: 3.6,
  fonts: ["700 40px 'Noto Serif SC'"],
  text: '太阳下山了她还在走月亮替她点了灯',
  init() {
    const R = mulberry32(30), stars = [];
    for (let i = 0; i < 90; i++) stars.push([R(), R() * .6, R()]);
    return { stars };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, k = smooth(.2, 4.4, t);
    const mix = (a, b) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], k))).join(',')})`;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mix([232, 96, 60], [10, 18, 52]));
    sky.addColorStop(.5, mix([250, 160, 80], [30, 46, 100]));
    sky.addColorStop(.85, mix([255, 214, 140], [58, 82, 140]));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // 星星
    s.stars.forEach(([x, y, p]) => { const a = clamp((t - 2 - p * 1.5) / .6) * (.5 + .5 * Math.sin(t * 3 + p * 20)); if (a > 0) { ctx.fillStyle = `rgba(255,255,240,${a})`; ctx.beginPath(); ctx.arc(x * W, y * H, (1 + p * 2) * u, 0, TAU); ctx.fill(); } });
    // 太阳落下、月亮升起
    const hz = LAND ? H * .72 : H * .66;
    const sunY = lerp(hz - 200 * u, hz + 120 * u, smooth(0, 2.6, t)), sunX = W * .7;
    const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 260 * u);
    sg.addColorStop(0, `rgba(255,240,200,${1 - k * .8})`); sg.addColorStop(.35, `rgba(255,170,90,${.7 * (1 - k)})`); sg.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(255,236,190,${1 - k * .6})`; ctx.beginPath(); ctx.arc(sunX, sunY, 90 * u, 0, TAU); ctx.fill();
    const mp = smooth(2.2, 4.6, t), moonX = W * (LAND ? .26 : .3), moonY = lerp(hz, H * (LAND ? .2 : .2), mp);
    if (mp > 0) {
      const mg = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 220 * u); mg.addColorStop(0, `rgba(230,236,255,${.5 * mp})`); mg.addColorStop(1, 'rgba(230,236,255,0)');
      ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(250,248,235,${mp})`; ctx.beginPath(); ctx.arc(moonX, moonY, 70 * u, 0, TAU); ctx.fill();
      ctx.fillStyle = sky; ctx.beginPath(); ctx.arc(moonX + 28 * u, moonY - 16 * u, 62 * u, 0, TAU); ctx.fill();
    }
    // 远山、近山：纯黑剪影（远处带一点天色）
    ctx.fillStyle = mix([90, 40, 40], [16, 20, 40]);
    ctx.beginPath(); ctx.moveTo(0, hz); for (let x = 0; x <= W; x += 20 * u) ctx.lineTo(x, hz - 90 * u - 70 * u * Math.sin(x / W * 5 + 1) * Math.sin(x / W * 2)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = '#050505';
    const ground = x => hz + 40 * u + 30 * u * Math.sin(x / W * 4);
    ctx.beginPath(); ctx.moveTo(0, ground(0)); for (let x = 0; x <= W; x += 20 * u) ctx.lineTo(x, ground(x)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    // 房子：亮窗在月夜点灯
    const hx = W * (LAND ? .72 : .66), hy = ground(hx);
    ctx.beginPath(); ctx.moveTo(hx - 140 * u, hy); ctx.lineTo(hx - 140 * u, hy - 160 * u); ctx.lineTo(hx, hy - 270 * u); ctx.lineTo(hx + 140 * u, hy - 160 * u); ctx.lineTo(hx + 140 * u, hy); ctx.fill();
    ctx.fillRect(hx + 60 * u, hy - 280 * u, 34 * u, 80 * u);
    const lamp = smooth(3.4, 3.7, t);
    if (lamp > 0) {
      const lg = ctx.createRadialGradient(hx - 40 * u, hy - 110 * u, 0, hx - 40 * u, hy - 110 * u, 160 * u); lg.addColorStop(0, `rgba(255,200,100,${.45 * lamp})`); lg.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = lg; ctx.fillRect(hx - 220 * u, hy - 300 * u, 360 * u, 320 * u);
      ctx.fillStyle = `rgba(255,214,120,${lamp})`; ctx.fillRect(hx - 75 * u, hy - 140 * u, 70 * u, 60 * u);
      ctx.fillStyle = '#050505'; ctx.fillRect(hx - 42 * u, hy - 140 * u, 4 * u, 60 * u); ctx.fillRect(hx - 75 * u, hy - 112 * u, 70 * u, 4 * u);
    }
    // 树：分叉的枝 + 叶团
    const tree = (x, sc) => {
      const y = ground(x); ctx.fillStyle = '#050505'; ctx.strokeStyle = '#050505'; ctx.lineCap = 'round';
      const br = (x0, y0, a, len, w, d) => { const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); if (d > 0) { br(x1, y1, a - .45 + Math.sin(t * .8 + d) * .03, len * .72, w * .65, d - 1); br(x1, y1, a + .4, len * .7, w * .65, d - 1); } else { ctx.beginPath(); ctx.arc(x1, y1, len * .9, 0, TAU); ctx.fill(); } };
      br(x, y + 10 * u, -Math.PI / 2, 120 * u * sc, 26 * u * sc, 4);
    };
    tree(W * (LAND ? .12 : .14), LAND ? 1.1 : 1.2); tree(W * (LAND ? .9 : .92), .7);
    // 走路的人：从左走向房子
    const wx = lerp(W * (LAND ? .2 : .2), hx - 200 * u, smooth(.3, 4.6, t)), wy = ground(wx), ph = t * 7;
    ctx.save(); ctx.translate(wx, wy); ctx.fillStyle = '#050505'; ctx.strokeStyle = '#050505'; ctx.lineCap = 'round';
    const sc = (LAND ? 1 : 1.2) * u;
    ctx.lineWidth = 14 * sc;
    [-1, 1].forEach(sd => { const a = Math.sin(ph) * .45 * sd; ctx.beginPath(); ctx.moveTo(0, -95 * sc); ctx.lineTo(Math.sin(a) * 95 * sc, -95 * sc + Math.cos(a) * 95 * sc); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(-26 * sc, -95 * sc); ctx.lineTo(26 * sc, -95 * sc); ctx.lineTo(18 * sc, -190 * sc); ctx.lineTo(-18 * sc, -190 * sc); ctx.closePath(); ctx.fill();   // 长裙
    ctx.beginPath(); ctx.moveTo(-34 * sc, -100 * sc); ctx.lineTo(34 * sc, -100 * sc); ctx.lineTo(16 * sc, -190 * sc); ctx.lineTo(-16 * sc, -190 * sc); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -218 * sc, 24 * sc, 0, TAU); ctx.fill();
    ctx.lineWidth = 10 * sc; ctx.beginPath(); ctx.moveTo(10 * sc, -175 * sc); ctx.lineTo(10 * sc + Math.sin(-ph) * 30 * sc, -110 * sc); ctx.stroke();
    // 手里一盏小提灯
    ctx.beginPath(); ctx.moveTo(-10 * sc, -175 * sc); ctx.lineTo(-40 * sc, -120 * sc); ctx.stroke();
    ctx.fillRect(-52 * sc, -120 * sc, 24 * sc, 30 * sc);
    ctx.restore();
    // 鸟：落日时飞过
    for (let b = 0; b < 4; b++) { const bx = W * (1.1 - (t * .22 + b * .07)), by = H * (.28 + b * .03) + Math.sin(t * 2 + b) * 10 * u, fl = Math.sin(t * 12 + b) * 14 * u; ctx.strokeStyle = '#050505'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.moveTo(bx - 24 * u, by - fl); ctx.quadraticCurveTo(bx - 8 * u, by - 4 * u, bx, by); ctx.quadraticCurveTo(bx + 8 * u, by - 4 * u, bx + 24 * u, by - fl); ctx.stroke(); }
    // 诗：三行依次淡入淡出
    const POEM = [[.3, 1.7, '太阳下山了'], [1.8, 3.2, '她还在走'], [3.4, 5.2, '月亮替她点了灯']];
    ctx.textAlign = 'center'; ctx.font = `700 ${Math.round((LAND ? 64 : 70) * u)}px 'Noto Serif SC'`;
    POEM.forEach(([a, b, txt]) => { const al = smooth(a, a + .4, t) * (1 - smooth(b - .3, b, t)); if (al > 0) { ctx.fillStyle = `rgba(255,246,228,${al})`; ctx.fillText(txt, W / 2, H * (LAND ? .2 : .3) + (1 - al) * 10 * u); } });
    // 幕布：两侧带褶的暗红布 + 顶部垂边
    const cw = (LAND ? 170 : 110) * u;
    [[0, 1], [W, -1]].forEach(([x0, dir]) => {
      for (let f = 0; f < 6; f++) {
        const x = x0 + dir * f * cw / 6, g = ctx.createLinearGradient(x, 0, x + dir * cw / 6, 0);
        g.addColorStop(0, '#2A0508'); g.addColorStop(.5, '#6E0F17'); g.addColorStop(1, '#2A0508');
        ctx.fillStyle = g; ctx.fillRect(Math.min(x, x + dir * cw / 6), 0, cw / 6 + 1, H);
      }
    });
    const vh = (LAND ? 110 : 150) * u;
    ctx.fillStyle = '#4A0A10'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, vh);
    for (let k2 = 12; k2 >= 0; k2--) { const x = k2 / 12 * W; ctx.quadraticCurveTo(x + W / 24, vh + 40 * u, x, vh); }
    ctx.fill();
    ctx.fillStyle = '#C9A04A'; ctx.fillRect(0, vh - 10 * u, W, 6 * u);
    vignette(ctx, .55, .4);
  }
});
