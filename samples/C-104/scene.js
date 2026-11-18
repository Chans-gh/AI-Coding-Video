// C-104 1950 年代中世纪卡通：Canvas 2D 把每个形状画两遍：色块整体错开几像素，墨线用虚线画成断开的线，形状的抖动按 12 帧/秒取种子（一拍二的“沸腾”）；讲解人是蛋形头，身体不动，只有手臂按关键角度插值、眨眼和嘴形在三种之间切换，房间是一块芥末黄色面加一条地板线，第 2 秒步骤卡翻面。
// 风格提示词：用 1950 年代中世纪（Mid-century）卡通风格：颜色印得和断开的墨线错开几个像素、按两帧一拍抖动，人物是蛋形头和豆形头的几何造型，讲解人的身体不动、只有手臂、手、眼睛和嘴在动，房间只有一块色面加一条地板线，用温暖的原子时代互补色，配冷爵士小乐队。
// 题材：卡通与动漫 · 适合：操作指南、产品使用步骤、食谱卡、安全提示
scene({
  id: 'C-104', name: '1950 年代中世纪卡通', dur: 4, still: 1.0,
  text: '第一步二拔掉插头等它冷却分钟',
  fonts: ["900 40px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  init() { return {}; },
  draw(ctx, t, s, f) {
    const u = SHORT / 1080, INK = '#2A221E', tb = Math.floor(t * 12);   // 一拍二：12 帧/秒换一次抖动
    const C = { wall: '#E4B54A', floor: '#C98F3A', teal: '#3E9C93', coral: '#E0694A', cream: '#F4E8CC', skin: '#F0C49A', navy: '#2F4E5E' };
    let sid = 0;
    // 一个形状：色块错位填充 + 断开的墨线，整体按一拍二抖动
    const S = (path, fill, lw = 5, stroke = true) => {
      sid++; const jx = (hash2(tb, sid) - .5) * 3 * u, jy = (hash2(tb, sid + 99) - .5) * 3 * u;
      if (fill) { ctx.save(); ctx.translate(jx + 7 * u, jy + 5 * u); ctx.fillStyle = fill; ctx.beginPath(); path(); ctx.fill(); ctx.restore(); }
      if (stroke) { ctx.save(); ctx.translate(jx, jy); ctx.strokeStyle = INK; ctx.lineWidth = lw * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([(60 + hash1(sid) * 80) * u, 9 * u]); ctx.lineDashOffset = hash1(sid * 7) * 100 * u; ctx.beginPath(); path(); ctx.stroke(); ctx.restore(); }
    };
    // 房间：一块色面 + 地板线
    const fy = H * (LAND ? .8 : .84);
    ctx.fillStyle = C.wall; ctx.fillRect(0, 0, W, H); ctx.fillStyle = C.floor; ctx.fillRect(0, fy, W, H - fy);
    S(() => { ctx.moveTo(-20, fy); ctx.lineTo(W + 20, fy); }, null, 6);
    // 原子时代装饰：星芒、回旋镖
    const star = (x, y, r, n) => S(() => { for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, rr0 = i % 2 ? r * .18 : r; ctx.lineTo(x + Math.cos(a) * rr0, y + Math.sin(a) * rr0); } ctx.closePath(); }, C.cream, 3);
    star(W * (LAND ? .1 : .14), H * (LAND ? .16 : .08), 50 * u, 4); star(W * (LAND ? .9 : .88), H * (LAND ? .12 : .06), 36 * u, 4); star(W * (LAND ? .5 : .5), H * (LAND ? .1 : .04), 24 * u, 4);
    const boom = (x, y, a, c) => S(() => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.moveTo(-60 * u, 0); ctx.quadraticCurveTo(0, -50 * u, 60 * u, 0); ctx.quadraticCurveTo(0, -20 * u, -60 * u, 0); ctx.restore(); }, c, 3);
    boom(W * (LAND ? .22 : .82), H * (LAND ? .3 : .16), .3, C.teal); boom(W * (LAND ? .84 : .2), H * (LAND ? .72 : .17), -.4, C.coral);
    // 讲解人：身体固定，只动手臂、眼、嘴
    const k = (LAND ? 1.0 : 1.1) * u, px = W * (LAND ? .3 : .34), py = fy;
    const P = (x, y) => [px + x * k, py + y * k];
    const card = LAND ? [W * .66, H * .42] : [W * .5, H * .25];
    S(() => { ctx.moveTo(...P(-32, 0)); ctx.lineTo(...P(-26, -170)); ctx.moveTo(...P(32, 0)); ctx.lineTo(...P(26, -170)); }, null, 14);
    S(() => { ctx.moveTo(...P(-60, 0)); ctx.lineTo(...P(-14, 0)); ctx.moveTo(...P(14, 0)); ctx.lineTo(...P(60, 0)); }, null, 12);
    S(() => { ctx.moveTo(...P(-95, -400)); ctx.lineTo(...P(95, -400)); ctx.lineTo(...P(70, -165)); ctx.lineTo(...P(-70, -165)); ctx.closePath(); }, C.coral, 5);
    S(() => { ctx.moveTo(...P(0, -398)); ctx.lineTo(...P(14, -360)); ctx.lineTo(...P(0, -280)); ctx.lineTo(...P(-14, -360)); ctx.closePath(); }, C.navy, 3);
    // 左手臂：垂下，第 2.2 秒摊手一下
    const la = -Math.PI / 2 - 2.6 + .5 * Math.sin(Math.PI * inv(2.1, 2.9, t));
    const arm = (sx, sy, a1, a2, pointing) => {
      const [x0, y0] = P(sx, sy), x1 = x0 + Math.cos(a1) * 120 * k, y1 = y0 + Math.sin(a1) * 120 * k, x2 = x1 + Math.cos(a2) * 110 * k, y2 = y1 + Math.sin(a2) * 110 * k;
      S(() => { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); }, null, 16);
      S(() => { ctx.arc(x2, y2, 20 * k, 0, TAU); }, C.skin, 4);
      if (pointing) S(() => { ctx.moveTo(x2, y2); ctx.lineTo(x2 + Math.cos(a2) * 40 * k, y2 + Math.sin(a2) * 40 * k); }, null, 7);
    };
    arm(-90, -390, la + Math.PI * 2, la + Math.PI * 2 + .3, false);
    // 右手臂：0.4 秒抬起指向步骤卡，第 2 秒翻卡时再指一次
    const tgt = Math.atan2(card[1] - P(90, -390)[1], card[0] - P(90, -390)[0]);
    const up = eOutBack(inv(.3, .7, t)) - .6 * Math.sin(Math.PI * inv(1.8, 2.3, t)), a1 = lerp(Math.PI / 2 - .15, tgt + .25, up), a2 = lerp(Math.PI / 2, tgt - .05, up) + .08 * Math.sin(t * 6) * clamp(up);
    arm(90, -390, a1, a2, up > .5);
    // 蛋形头
    S(() => { ctx.ellipse(...P(0, -540), 88 * k, 118 * k, 0, 0, TAU); }, C.skin, 5);
    S(() => { ctx.moveTo(...P(-86, -560)); ctx.quadraticCurveTo(...P(-80, -680), ...P(0, -660)); ctx.quadraticCurveTo(...P(70, -690), ...P(86, -580)); ctx.quadraticCurveTo(...P(30, -620), ...P(-86, -560)); }, INK, 3);
    // 眼：1.3 秒、3.3 秒眨眼，眼珠看向卡片
    const bl = (Math.abs(t - 1.35) < .06 || Math.abs(t - 3.3) < .06) ? .1 : 1, look = clamp(up) * 8;
    for (const ex of [-34, 30]) {
      const [x, y] = P(ex, -560);
      S(() => { ctx.ellipse(x, y, 20 * k, 26 * k * bl, 0, 0, TAU); }, '#FFFFFF', 3);
      if (bl > .5) S(() => { ctx.arc(x + look * k * (LAND ? 1 : .6), y + 4 * k - (LAND ? 0 : look * .6 * k), 8 * k, 0, TAU); }, INK, 2);
    }
    S(() => { ctx.moveTo(...P(-4, -548)); ctx.quadraticCurveTo(...P(22, -515), ...P(0, -505)); }, null, 4);
    // 嘴：说话时在三种嘴形间按 6 帧/秒切换
    const talk = (t > .6 && t < 1.7) || (t > 2.2 && t < 3.6), mo = talk ? Math.floor(hash1(Math.floor(t * 6)) * 3) : 0, [mx, my] = P(4, -470);
    if (mo === 0) S(() => { ctx.moveTo(mx - 26 * k, my); ctx.quadraticCurveTo(mx, my + 18 * k, mx + 26 * k, my); }, null, 5);
    else S(() => { ctx.ellipse(mx, my + 6 * k, (mo === 1 ? 16 : 26) * k, (mo === 1 ? 18 : 12) * k, 0, 0, TAU); }, '#8E2E2A', 4);
    // 步骤卡：第 2 秒翻面
    const fl = inv(1.8, 2.3, t), sx = Math.abs(Math.cos(fl * Math.PI)), step = fl < .5 ? 0 : 1, cw = (LAND ? 620 : 640) * u, chh = (LAND ? 540 : 520) * u;
    const cin = eOutBack(inv(.1, .5, t));
    ctx.save(); ctx.translate(card[0], card[1]); const cs = LAND ? 1 : 1.3; ctx.scale(sx * cin * cs, cin * cs); ctx.rotate(-.03 + step * .05);
    S(() => { rr(ctx, -cw / 2, -chh / 2, cw, chh, 30 * u); }, C.cream, 6);
    S(() => { ctx.arc(-cw / 2 + 80 * u, -chh / 2 + 80 * u, 48 * u, 0, TAU); }, step ? C.teal : C.coral, 4);
    ctx.fillStyle = C.cream; ctx.font = `${70 * u}px 'Bebas Neue'`; ctx.textAlign = 'center'; ctx.fillText(step + 1, -cw / 2 + 80 * u, -chh / 2 + 104 * u);
    ctx.fillStyle = INK; ctx.font = `900 ${54 * u}px 'Noto Sans SC'`; ctx.textAlign = 'left';
    ctx.fillText(step ? '等它冷却' : '拔掉插头', -cw / 2 + 150 * u, -chh / 2 + 100 * u);
    ctx.font = `700 ${30 * u}px 'Noto Sans SC'`; ctx.fillStyle = C.navy; ctx.fillText(step ? '第二步 · 5 分钟' : '第一步', -cw / 2 + 152 * u, -chh / 2 + 146 * u);
    if (!step) {   // 插头和插座
      const pull = eOutCubic(inv(1.0, 1.4, t)) * 70 * u;
      S(() => { rr(ctx, 60 * u, -10 * u, 150 * u, 190 * u, 20 * u); }, '#FFFFFF', 5);
      S(() => { ctx.arc(110 * u, 85 * u, 10 * u, 0, TAU); ctx.moveTo(170 * u, 85 * u); ctx.arc(160 * u, 85 * u, 10 * u, 0, TAU); }, INK, 3);
      S(() => { rr(ctx, -150 * u - pull, 30 * u, 140 * u, 110 * u, 16 * u); }, C.teal, 5);
      S(() => { ctx.moveTo(-10 * u - pull, 70 * u); ctx.lineTo(30 * u - pull, 70 * u); ctx.moveTo(-10 * u - pull, 100 * u); ctx.lineTo(30 * u - pull, 100 * u); }, null, 7);
      S(() => { ctx.moveTo(-150 * u - pull, 85 * u); ctx.bezierCurveTo(-240 * u - pull, 90 * u, -220 * u, 200 * u, -280 * u, 220 * u); }, null, 6);
    } else {       // 烤面包机冒热气
      S(() => { rr(ctx, -170 * u, 20 * u, 300 * u, 180 * u, 50 * u); }, C.coral, 5);
      S(() => { ctx.moveTo(-110 * u, 20 * u); ctx.lineTo(-110 * u, 60 * u); ctx.moveTo(30 * u, 20 * u); ctx.lineTo(30 * u, 60 * u); }, null, 8);
      for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i / 3) % 1; ctx.globalAlpha = Math.sin(ph * Math.PI); S(() => { const x = -100 * u + i * 80 * u, y = 0 - ph * 90 * u; ctx.moveTo(x, y); ctx.bezierCurveTo(x + 20 * u, y - 20 * u, x - 20 * u, y - 40 * u, x, y - 60 * u); }, null, 5); ctx.globalAlpha = 1; }
      S(() => { ctx.arc(220 * u, 110 * u, 60 * u, 0, TAU); }, '#FFFFFF', 5);
      S(() => { const a = -Math.PI / 2 + inv(2.3, 4, t) * TAU * .8; ctx.moveTo(220 * u, 110 * u); ctx.lineTo(220 * u + Math.cos(a) * 44 * u, 110 * u + Math.sin(a) * 44 * u); ctx.moveTo(220 * u, 110 * u); ctx.lineTo(220 * u, 76 * u); }, null, 5);
    }
    ctx.restore();
  }
});
