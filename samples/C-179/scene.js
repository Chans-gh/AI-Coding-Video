// C-179 平铺整理（Knolling）：十三件文具各画成一张带正下方柔和阴影的贴图（init 里画一次），按“同类在一起”的网格坐标从最近的画面边缘滑入、略冲过头再落定；2.5 秒起整组按颜色重新排列，最后从每件物品引出细线标名称。竖版把整套坐标转 90°，物品也一起转，仍然横平竖直
// 风格提示词：用平铺整理风格：正上方俯拍一块干净的纯色台面，所有物品按 90 度对齐、等间距排成整齐的网格，同类同色归在一起，物品一件件从画外滑入就位，有时整组重新排序或拆成零件再摆开，每件只有正下方一圈柔和阴影，旁边用细线标出名称，配干脆的落位声。
// 题材：信息讲解与产品发布 · 适合：产品拆解与清单、装备介绍、收纳与旅行准备
function rrf(g, x, y, w, h, r, c) { rr(g, x, y, w, h, r); g.fillStyle = c; g.fill(); }
// 物品：尺寸按竖放（w×h，单位是 1080 短边下的像素）；A 是“按类别”的位置，B 是“按颜色”的位置（横版坐标，原点在画面中心）
const ITEMS = [
  { n: '直尺', e: 'RULER 15CM', w: 64, h: 420, A: [-650, -20], B: [330, 10], d(g, w, h) {
    rrf(g, 0, 0, w, h, 6, 'rgba(250,252,255,.92)'); g.strokeStyle = 'rgba(80,90,110,.5)'; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = '#3d4655'; for (let i = 0; i <= 30; i++) { const y = 20 + i * (h - 40) / 30, l = i % 10 ? (i % 5 ? 12 : 20) : 28; g.beginPath(); g.moveTo(w - 4, y); g.lineTo(w - 4 - l, y); g.stroke(); } } },
  { n: '铅笔', e: 'PENCIL HB', w: 30, h: 380, A: [-560, -20], B: [-430, 10], d(g, w, h) {
    rrf(g, 0, 40, w, h - 80, 3, '#f2c230'); g.fillStyle = '#d9a514'; g.fillRect(w * .62, 40, w * .38, h - 80);
    g.fillStyle = '#e8c9a0'; g.beginPath(); g.moveTo(0, 40); g.lineTo(w / 2, 0); g.lineTo(w, 40); g.fill();
    g.fillStyle = '#333'; g.beginPath(); g.moveTo(w * .35, 12); g.lineTo(w / 2, 0); g.lineTo(w * .65, 12); g.fill();
    g.fillStyle = '#b8bcc4'; g.fillRect(0, h - 40, w, 18); g.fillStyle = '#e88a8a'; rr(g, 0, h - 24, w, 24, 4); g.fill(); } },
  { n: '钢笔', e: 'FOUNTAIN PEN', w: 28, h: 350, A: [-490, -20], B: [-40, 10], d(g, w, h) {
    rrf(g, 0, 60, w, h - 60, 12, '#1f3b73'); g.fillStyle = '#c9a54a'; g.fillRect(0, h * .42, w, 8);
    g.fillStyle = '#c9a54a'; g.beginPath(); g.moveTo(w * .25, 62); g.lineTo(w / 2, 0); g.lineTo(w * .75, 62); g.fill();
    g.fillStyle = '#d8b75e'; rr(g, w * .38, h * .45, w * .24, h * .32, 4); g.fill(); } },
  { n: '剪刀', e: 'SCISSORS', w: 120, h: 280, A: [-380, -20], B: [-610, 190], d(g, w, h) {
    g.fillStyle = '#c9ced6'; g.beginPath(); g.moveTo(w / 2 - 12, 150); g.lineTo(w / 2 - 4, 0); g.lineTo(w / 2 + 16, 160); g.fill();
    g.fillStyle = '#aab0ba'; g.beginPath(); g.moveTo(w / 2 + 12, 150); g.lineTo(w / 2 + 6, 4); g.lineTo(w / 2 - 16, 160); g.fill();
    g.strokeStyle = '#d6453a'; g.lineWidth = 14; g.lineCap = 'round';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + s * 6, 150); g.lineTo(w / 2 + s * 22, h - 120); g.stroke(); }
    g.fillStyle = '#d6453a'; g.lineWidth = 0;
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * 30, h - 70, 30, 58, s * .25, 0, TAU); g.ellipse(w / 2 + s * 30, h - 70, 15, 40, s * .25, 0, TAU, true); g.fill('evenodd'); }
    g.fillStyle = '#555'; g.beginPath(); g.arc(w / 2, 150, 7, 0, TAU); g.fill(); } },
  { n: '笔记本', e: 'NOTEBOOK A5', w: 250, h: 330, A: [-160, -20], B: [-610, -150], d(g, w, h) {
    rrf(g, 0, 0, w, h, 10, '#b8362e'); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(0, 0, 18, h);
    g.fillStyle = '#1d1d1d'; g.fillRect(w - 46, 0, 10, h); g.fillStyle = 'rgba(255,255,255,.85)'; rr(g, 50, 60, 130, 44, 4); g.fill(); } },
  { n: '便利贴', e: 'STICKY NOTES', w: 150, h: 150, A: [110, -250], B: [-230, -200], d(g, w, h) {
    rrf(g, 0, 6, w, h - 6, 3, '#e3b81e'); rrf(g, 0, 0, w, h - 8, 3, '#f7d84a'); g.strokeStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.moveTo(0, 30); g.lineTo(w, 30); g.stroke(); } },
  { n: '胶带', e: 'TAPE', w: 150, h: 150, A: [290, -250], B: [100, -200], d(g, w, h) {
    g.fillStyle = '#2f6fb3'; g.beginPath(); g.arc(w / 2, h / 2, 74, 0, TAU); g.arc(w / 2, h / 2, 44, 0, TAU, true); g.fill('evenodd');
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; g.beginPath(); g.arc(w / 2, h / 2, 60, 0, TAU); g.stroke();
    g.fillStyle = '#ddd'; g.beginPath(); g.arc(w / 2, h / 2, 44, 0, TAU); g.arc(w / 2, h / 2, 38, 0, TAU, true); g.fill('evenodd'); } },
  { n: '耳机盒', e: 'EARBUDS', w: 110, h: 130, A: [460, -250], B: [500, -200], d(g, w, h) {
    rrf(g, 0, 0, w, h, 40, '#f7f7f5'); g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2; g.beginPath(); g.moveTo(6, 42); g.lineTo(w - 6, 42); g.stroke();
    g.fillStyle = '#7bd389'; g.beginPath(); g.arc(w / 2, 70, 4, 0, TAU); g.fill(); } },
  { n: '橡皮', e: 'ERASER', w: 56, h: 100, A: [110, -40], B: [500, -20], d(g, w, h) {
    rrf(g, 0, 0, w, h, 6, '#f4f1ea'); rrf(g, 0, 28, w, 52, 2, '#2f6fb3'); } },
  { n: '钥匙', e: 'KEY', w: 52, h: 150, A: [290, -40], B: [-230, 60], d(g, w, h) {
    g.fillStyle = '#d4a93a'; g.beginPath(); g.arc(w / 2, 26, 26, 0, TAU); g.arc(w / 2, 22, 8, 0, TAU, true); g.fill('evenodd');
    g.fillRect(w / 2 - 7, 46, 14, h - 46); for (const y of [100, 118, 134]) g.fillRect(w / 2 + 6, y, 12, 8); } },
  { n: 'U 盘', e: 'USB 64G', w: 44, h: 120, A: [460, -40], B: [100, 60], d(g, w, h) {
    g.fillStyle = '#c0c4cc'; g.fillRect(8, 0, w - 16, 30); g.fillStyle = '#555'; g.fillRect(14, 8, 6, 6); g.fillRect(w - 20, 8, 6, 6);
    rrf(g, 0, 28, w, h - 28, 8, '#2a5b9c'); } },
  { n: '回形针', e: 'CLIPS ×3', w: 120, h: 80, A: [110, 170], B: [500, 170], d(g, w, h) {
    g.strokeStyle = '#9aa1ab'; g.lineWidth = 4; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const x = 18 + k * 42; g.beginPath(); g.moveTo(x + 8, 62); g.lineTo(x + 8, 18); g.arc(x, 18, 8, 0, Math.PI, true); g.lineTo(x - 8, 70); g.arc(x + 4, 70, 12, Math.PI, 0, true); g.lineTo(x + 16, 12); g.stroke(); } } },
  { n: '硬币', e: 'COINS ×2', w: 130, h: 64, A: [290, 170], B: [330, 290], d(g, w, h) {
    for (const x of [32, 98]) { g.fillStyle = '#c7ccd2'; g.beginPath(); g.arc(x, 32, 30, 0, TAU); g.fill(); g.strokeStyle = '#9aa0a8'; g.lineWidth = 3; g.beginPath(); g.arc(x, 32, 22, 0, TAU); g.stroke(); } } },
];
scene({
  id: 'C-179', name: '平铺整理（Knolling）', dur: 4.5, still: 4.1,
  fonts: ["700 40px 'Noto Sans SC'", "400 20px 'JetBrains Mono'"],
  text: ITEMS.map(i => i.n).join('') + '桌面清单按类别颜色',
  init() {
    const u = SHORT / 1080;
    for (const it of ITEMS) {                       // 贴图：留边放阴影
      const pad = 40, c = mk(Math.ceil((it.w + pad * 2) * u), Math.ceil((it.h + pad * 2) * u)), g = c.getContext('2d');
      g.scale(u, u); g.translate(pad, pad);
      g.shadowColor = 'rgba(70,40,20,.35)'; g.shadowBlur = 18 * u;
      it.d(g, it.w, it.h); g.shadowColor = 'transparent';
      it.d(g, it.w, it.h);                          // 再画一遍压实（阴影只要一圈）
      it.img = c; it.pad = pad;
    }
    const bg = mk(W, H), g = bg.getContext('2d'), R = mulberry32(9);
    g.fillStyle = '#ecd6c0'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) { g.fillStyle = R() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(120,80,50,.05)'; g.fillRect(R() * W, R() * H, 2, 2); }
    return { bg };
  },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, k = LAND ? u * .98 : u * 1.02;
    ctx.drawImage(s.bg, 0, 0);
    // 横版坐标 → 屏幕；竖版整体转 90°
    const S = ([x, y]) => LAND ? [W / 2 + (x + 70) * k, H / 2 + 30 * u + y * k] : [W / 2 - y * k * 1.1, H / 2 + 70 * u + (x + 70) * k * 1.1];
    const rot = LAND ? 0 : Math.PI / 2, sc = LAND ? 1 : 1.1;
    const re = eInOutCubic(inv(2.5, 3.2, t));
    ITEMS.forEach((it, i) => {
      const t0 = .15 + i * .15, p = inv(t0, t0 + .42, t);
      if (p <= 0) return;
      // 位置：A → B 依次错开一点
      const r = eInOutCubic(inv(2.45 + i * .025, 3.05 + i * .025, t));
      let [x, y] = S([lerp(it.A[0], it.B[0], r), lerp(it.A[1], it.B[1], r)]);
      // 从最近的边滑入，冲过头一点再落定
      const dx = x - W / 2, dy = y - H / 2, side = Math.abs(dx) / W > Math.abs(dy) / H ? [Math.sign(dx) || 1, 0] : [0, Math.sign(dy) || 1];
      const e = 1 - eOutBack(p, 1.2), dist = LONG * .7;
      x += side[0] * dist * e; y += side[1] * dist * e;
      const lift = Math.max(0, Math.sin(r * Math.PI)) * .05;             // 换位时略微抬起
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc * (1 + lift), sc * (1 + lift));
      ctx.drawImage(it.img, -it.img.width / 2, -it.img.height / 2);
      ctx.restore();
    });
    // 标注：从每件物品下方引出细线，写名称
    const lp = inv(3.3, 4.1, t);
    if (lp > 0) {
      ctx.lineWidth = 1.2 * u; ctx.textAlign = 'left';
      ITEMS.forEach((it, i) => {
        const a = clamp(lp * 2.2 - i * .1); if (a <= 0) return;
        const hw = (LAND ? it.w : it.h) / 2 * k * sc, hh = (LAND ? it.h : it.w) / 2 * k * sc;
        const [x, y] = S(it.B), x0 = x + hw * .4, y0 = y + hh + 6 * u, x1 = x0 + 22 * u, y1 = y0 + 22 * u;
        ctx.strokeStyle = `rgba(60,40,30,${.7 * a})`; ctx.beginPath(); ctx.moveTo(x0, y0 - 14 * u); ctx.lineTo(x0, y1); ctx.lineTo(x0 + (x1 - x0) * a + 30 * u * a, y1); ctx.stroke();
        ctx.fillStyle = `rgba(50,32,24,${a})`; ctx.font = `700 ${Math.round(20 * u)}px 'Noto Sans SC'`; ctx.fillText(it.n, x0 + 8 * u, y1 - 6 * u);
        ctx.fillStyle = `rgba(50,32,24,${.6 * a})`; ctx.font = `400 ${Math.round(12 * u)}px 'JetBrains Mono'`; ctx.fillText(it.e, x0 + 8 * u, y1 + 14 * u);
      });
    }
    // 页眉
    ctx.fillStyle = 'rgba(50,32,24,.85)'; ctx.textAlign = 'left'; ctx.font = `700 ${Math.round(30 * u)}px 'Noto Sans SC'`;
    const hx = LAND ? 70 * u : 60 * u, hy = LAND ? 80 * u : 110 * u;
    ctx.fillText(t < 2.6 ? '桌面清单 · 按类别' : '桌面清单 · 按颜色', hx, hy);
    ctx.font = `400 ${Math.round(16 * u)}px 'JetBrains Mono'`; ctx.fillStyle = 'rgba(50,32,24,.55)';
    ctx.fillText(`DESK KIT · ${String(ITEMS.filter((_, i) => t > .15 + i * .15 + .42).length).padStart(2, '0')} / ${ITEMS.length}`, hx, hy + 30 * u);
  }
});
