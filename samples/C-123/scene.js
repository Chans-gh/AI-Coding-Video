// C-123 手账剪贴本：Canvas 2D 在牛皮纸桌面上画一张斜放的横线笔记本页，页内所有元素都放在页的局部坐标里、各自再歪 2–8°：拍立得照片（里面是代码画的日落营地）用两条带花纹的和纸胶带贴住，撕边纸条、模切星星贴纸带白边和投影，手写说明按 textReveal 写出，红蓝马克笔的箭头、圈、星星按 drawPartial 画出，橡皮章最后盖下，结尾一张新页从侧边滑过桌面换场。
// 风格提示词：用手账剪贴本风格：牛皮纸桌面上斜放着横线笔记本页，拍立得照片用米色和薄荷色和纸胶带贴住、下面写手写说明，撕边纸条标关键词，模切贴纸和橡皮章标记里程碑，红蓝马克笔画箭头、星星和圈，元素都歪 2–8°，换场时一页新纸滑过桌面。
// 题材：纸艺、材质与定格 · 适合：项目幕后、成长记录、旅行日志
scene({
  id: 'C-123', name: '手账剪贴本', dur: 4, still: 3.1,
  text: '第一次露营星星好多第天完成十月日记',
  fonts: ["40px 'Ma Shan Zheng'", "900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  init() {
    const u = SHORT / 1080;
    const desk = makePaper('#B98A5A', { seed: 123, grain: 22, fiber: .9, blot: 10, w: W, h: H });
    // 拍立得里的照片：日落、山、帐篷
    const pw = Math.round(360 * u), ph = Math.round(300 * u), photo = mk(pw, ph), g = photo.getContext('2d');
    const sk = g.createLinearGradient(0, 0, 0, ph); sk.addColorStop(0, '#5B6FA8'); sk.addColorStop(.5, '#E99A7A'); sk.addColorStop(.75, '#F6CF8E'); g.fillStyle = sk; g.fillRect(0, 0, pw, ph);
    g.fillStyle = '#FBE3A8'; g.beginPath(); g.arc(pw * .62, ph * .62, 40 * u, 0, TAU); g.fill();
    g.fillStyle = '#4C5A78'; g.beginPath(); g.moveTo(0, ph * .7); g.lineTo(pw * .3, ph * .45); g.lineTo(pw * .55, ph * .68); g.lineTo(pw * .8, ph * .5); g.lineTo(pw, ph * .66); g.lineTo(pw, ph); g.lineTo(0, ph); g.fill();
    g.fillStyle = '#2E3A4E'; g.fillRect(0, ph * .82, pw, ph);
    g.fillStyle = '#E8794F'; g.beginPath(); g.moveTo(pw * .2, ph * .9); g.lineTo(pw * .32, ph * .7); g.lineTo(pw * .44, ph * .9); g.fill();
    g.fillStyle = '#FFF2C8'; for (let i = 0; i < 18; i++) g.fillRect(hash1(i) * pw, hash1(i + 30) * ph * .35, 2 * u, 2 * u);
    g.fillStyle = 'rgba(255,240,210,.12)'; g.fillRect(0, 0, pw, ph);
    // 和纸胶带：两种花纹
    const tape = (col, pat, seed) => {
      const w = Math.round(170 * u), h = Math.round(46 * u), c = mk(w, h), q = c.getContext('2d'), R = mulberry32(seed);
      q.beginPath(); q.moveTo(0, 0); for (let y = 0; y <= h; y += 4 * u) q.lineTo((R() * 5) * u, y); for (let y = h; y >= 0; y -= 4 * u) q.lineTo(w - R() * 5 * u, y); q.closePath(); q.fillStyle = col; q.fill(); q.save(); q.clip();
      q.fillStyle = 'rgba(255,255,255,.55)'; if (pat) for (let x = 0; x < w; x += 18 * u) for (let y = 6 * u; y < h; y += 16 * u) { q.beginPath(); q.arc(x + (y / u % 32 ? 9 * u : 0), y, 3.5 * u, 0, TAU); q.fill(); }
      else for (let x = -h; x < w; x += 16 * u) { q.fillRect(x, 0, 6 * u, h); }
      q.restore(); return c;
    };
    return { desk, photo, tA: tape('rgba(240,222,180,.85)', 0, 1), tB: tape('rgba(150,214,196,.85)', 1, 2) };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080, RED = '#D8403A', BLUE = '#2F5FB0';
    ctx.drawImage(s.desk, 0, 0);
    const PW = (LAND ? 1260 : 900) * u, PH = (LAND ? 880 : 1460) * u;
    const sh = (on, k = 1) => { ctx.shadowColor = on ? 'rgba(60,35,15,.35)' : 'transparent'; ctx.shadowBlur = 16 * u * k; ctx.shadowOffsetX = 6 * u * k; ctx.shadowOffsetY = 10 * u * k; };
    const page = (x, y, a, n) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      sh(true, 1.4); ctx.fillStyle = '#FBF7EC'; ctx.fillRect(-PW / 2, -PH / 2, PW, PH); sh(false);
      ctx.strokeStyle = 'rgba(110,150,200,.45)'; ctx.lineWidth = 2 * u;
      for (let yy = -PH / 2 + 110 * u; yy < PH / 2 - 20 * u; yy += 52 * u) { ctx.beginPath(); ctx.moveTo(-PW / 2 + 70 * u, yy); ctx.lineTo(PW / 2 - 20 * u, yy); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(220,90,90,.5)'; ctx.beginPath(); ctx.moveTo(-PW / 2 + 110 * u, -PH / 2); ctx.lineTo(-PW / 2 + 110 * u, PH / 2); ctx.stroke();
      ctx.fillStyle = '#B98A5A'; for (let yy = -PH / 2 + 60 * u; yy < PH / 2; yy += 80 * u) { ctx.beginPath(); ctx.arc(-PW / 2 + 36 * u, yy, 12 * u, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#8A7B66'; ctx.font = `${34 * u}px 'Ma Shan Zheng'`; ctx.textAlign = 'right'; ctx.fillText(n, PW / 2 - 40 * u, -PH / 2 + 80 * u);
    };
    // 页内元素坐标（页中心为原点）
    const L = LAND ? { ph: [-260, -40], strip: [210, -280], cap: [-470, 300], star: [380, -60], st: [360, 230], note: [470, -290] }
      : { ph: [0, -290], strip: [-170, -650], cap: [-300, 160], star: [250, 360], st: [170, 590], note: [-240, 470] };
    const P = k => L[k].map(v => v * u);
    const slide = eInOutCubic(inv(3.35, 3.95, t)), dir = LAND ? [-1, 0] : [0, -1];
    const ox = dir[0] * slide * W * .2, oy = dir[1] * slide * H * .1;
    page(W / 2 + ox, H / 2 + oy, -.05, '十月 · 12');
    // 拍立得 + 胶带
    const pp = eOutBack(inv(.1, .45, t)), PS = LAND ? 1 : 1.4;
    if (pp > 0) {
      const [x, y] = P('ph'), fw = s.photo.width + 40 * u, fh = s.photo.height + 120 * u;
      ctx.save(); ctx.translate(x, y - (1 - pp) * 80 * u); ctx.rotate(-.07 + (1 - pp) * .2); ctx.scale(PS, PS); ctx.globalAlpha = clamp(pp * 2);
      sh(true); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-fw / 2, -fh / 2, fw, fh); sh(false);
      ctx.drawImage(s.photo, -s.photo.width / 2, -fh / 2 + 20 * u);
      ctx.restore();
      const tp = (img, dx, dy, a, t0) => { const q = inv(t0, t0 + .15, t); if (q <= 0) return; ctx.save(); ctx.translate(x + dx * u * PS, y + dy * u * PS); ctx.rotate(a); ctx.globalAlpha = q; ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore(); };
      tp(s.tA, -150, -210, -.6, .45); tp(s.tB, 150, -230, .5, .55);
    }
    // 手写说明：逐字写出
    const cp = inv(.7, 1.5, t);
    if (cp > 0) {
      const [x, y] = P('cap'); ctx.save(); ctx.translate(x, y); ctx.rotate(-.03);
      ctx.fillStyle = '#2A3550'; ctx.font = `${(LAND ? 62 : 70) * u}px 'Ma Shan Zheng'`; textReveal(ctx, '第一次露营！', 0, 0, cp);
      ctx.font = `${(LAND ? 46 : 52) * u}px 'Ma Shan Zheng'`; textReveal(ctx, '星星好多', 30 * u, 70 * u, inv(1.2, 1.7, t)); ctx.restore();
    }
    // 撕边纸条：第 30 天
    const sp = eOutCubic(inv(.9, 1.2, t));
    if (sp > 0) {
      const [x, y] = P('strip'), w = 320 * u, h = 84 * u; ctx.save(); ctx.translate(x + (1 - sp) * 200 * u, y); ctx.rotate(.06); ctx.globalAlpha = sp;
      sh(true, .5); ctx.fillStyle = '#F6D35B'; ctx.beginPath(); resample(rectPts(-w / 2, -h / 2, w, h), 120).forEach((p, i) => { const j = (hash1(i) - .5) * (Math.abs(p.nx) > .5 ? 10 : 3) * u; (i ? ctx.lineTo : ctx.moveTo).call(ctx, p.x + p.nx * j, p.y + p.ny * j); }); ctx.fill(); sh(false);
      ctx.fillStyle = '#2B2A28'; ctx.font = `900 ${44 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('第 30 天', 0, 2 * u); ctx.restore(); ctx.textBaseline = 'alphabetic';
    }
    // 模切星星贴纸：白边 + 投影，弹出
    const stp = eOutBack(inv(1.4, 1.75, t), 2.2);
    if (stp > 0) {
      const [x, y] = P('star'); ctx.save(); ctx.translate(x, y); ctx.rotate(.12); ctx.scale(stp, stp);
      const sp5 = r => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr0 = i % 2 ? r * .45 : r; ctx.lineTo(Math.cos(a) * rr0, Math.sin(a) * rr0); } ctx.closePath(); };
      ctx.lineJoin = 'round'; sh(true, .5); sp5(90 * u); ctx.strokeStyle = '#FFF'; ctx.lineWidth = 26 * u; ctx.stroke(); sh(false);
      sp5(90 * u); ctx.fillStyle = '#F2B632'; ctx.fill(); sp5(54 * u); ctx.fillStyle = '#F7CD5C'; ctx.fill(); ctx.restore();
    }
    // 马克笔：红圈圈住照片里的帐篷、蓝箭头指向星星、红色小星
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const [phx, phy] = P('ph');
    ctx.strokeStyle = RED; ctx.lineWidth = 7 * u; ctx.globalAlpha = .9;
    drawPartial(ctx, circlePts(phx - 50 * u * PS, phy + 30 * u * PS, 70 * u * PS, 40, -.5, -.5 + TAU * 1.08, .3, 2), inv(1.8, 2.3, t));
    const [sx, sy] = P('star'), [cx, cy] = P('cap');
    ctx.strokeStyle = BLUE; ctx.lineWidth = 6 * u;
    const a0 = [cx + (LAND ? 400 : 380) * u, cy - 30 * u], a1 = [sx - 80 * u, sy + (LAND ? 70 : -60) * u], mc = [(a0[0] + a1[0]) / 2 + 40 * u, Math.min(a0[1], a1[1]) - 50 * u], arc = [];
    for (let i = 0; i <= 20; i++) { const q = i / 20; arc.push([(1 - q) * (1 - q) * a0[0] + 2 * q * (1 - q) * mc[0] + q * q * a1[0], (1 - q) * (1 - q) * a0[1] + 2 * q * (1 - q) * mc[1] + q * q * a1[1]]); }
    const ap = inv(2.2, 2.6, t); drawPartial(ctx, arc, ap);
    if (ap >= 1) { const a = Math.atan2(a1[1] - arc[18][1], a1[0] - arc[18][0]); ctx.beginPath(); ctx.moveTo(a1[0] - Math.cos(a - .5) * 30 * u, a1[1] - Math.sin(a - .5) * 30 * u); ctx.lineTo(...a1); ctx.lineTo(a1[0] - Math.cos(a + .5) * 30 * u, a1[1] - Math.sin(a + .5) * 30 * u); ctx.stroke(); }
    ctx.strokeStyle = RED; ctx.lineWidth = 5 * u;
    const st = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI * .8; st.push([P('note')[0] + Math.cos(a) * 34 * u, P('note')[1] + Math.sin(a) * 34 * u]); }
    drawPartial(ctx, st, inv(2.5, 2.8, t)); ctx.globalAlpha = 1;
    // 橡皮章：完成
    const rp = inv(2.85, 3.0, t);
    if (rp > 0) {
      const [x, y] = P('st'), k = 1 + (1 - eOutCubic(rp)) * .8; ctx.save(); ctx.translate(x, y); ctx.rotate(-.15); ctx.scale(k, k); ctx.globalAlpha = .8 * rp;
      ctx.strokeStyle = '#3C7A5A'; ctx.fillStyle = '#3C7A5A'; ctx.lineWidth = 7 * u; ctx.beginPath(); ctx.arc(0, 0, 90 * u, 0, TAU); ctx.stroke(); ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.arc(0, 0, 76 * u, 0, TAU); ctx.stroke();
      ctx.font = `900 ${48 * u}px 'Noto Sans SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('完成', 0, -4 * u); ctx.font = `${28 * u}px 'Bebas Neue'`; ctx.fillText('DAY 30', 0, 42 * u);
      ctx.restore(); ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();   // 页
    // 换场：新的一页滑过桌面
    if (slide > 0) {
      const nx = LAND ? W * 1.6 - slide * W * 1.05 : W / 2, ny = LAND ? H / 2 : H * 1.6 - slide * H * 1.02;
      page(nx, ny, .04, '十月 · 13'); ctx.restore();
    }
  }
});
