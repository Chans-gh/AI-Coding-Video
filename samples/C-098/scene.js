// C-098 丝网印刷旅行海报：Canvas 2D 在 init 里把每种油墨画成一张不透明的整版离屏层（天空用宽窄渐变的色带代替渐变，文字从最深的一版里挖空露出纸白），每层带 1–3 px 的套印错位和漏墨斑点；draw 时按节拍一版一版用刮板从左往右刮出来，米色纸带纤维和针孔，最后镜头缓推。
// 风格提示词：用丝网印刷旅行海报风格：4–6 种不透明的平涂油墨一色一色印出来，用分层色带代替渐变，各层套印错位 1–3 px、留下一丝纸白缝，米色纸张带纤维和针孔，底部一条深色信息带放地名和数字，信息像印刷一样一层一拍地出现；参考上世纪国家公园丝网海报的做法，不照搬任何真实海报。
// 题材：印刷、版画与装饰 · 适合：旅行指南、活动海报、景点与路线系列
scene({
  id: 'C-098', name: '丝网印刷旅行海报', dur: 4, still: 3.4,
  text: '云岭国家公园海拔湖雪松四季开放',
  fonts: ["900 80px 'Noto Sans SC'", "700 40px 'Noto Sans SC'", "80px 'Bebas Neue'"],
  init() {
    const u = SHORT / 1080, R = mulberry32(98);
    const paper = makePaper('#EEE3C8', { seed: 98, grain: 16, fiber: .7, blot: 6, w: W, h: H });
    const pc = paper.getContext('2d');
    for (let i = 0; i < 70; i++) { pc.fillStyle = `rgba(90,70,40,${.15 + R() * .3})`; pc.beginPath(); pc.arc(R() * W, R() * H, (.6 + R() * 1.4) * u, 0, TAU); pc.fill(); }   // 针孔
    const IH = H * (LAND ? .76 : .78);                      // 画面区，下面是信息带
    const layer = (col, fn, seed) => {
      const c = mk(W, H), g = c.getContext('2d'); g.fillStyle = col; fn(g);
      // 漏墨：随机小斑点挖掉
      const r = mulberry32(seed); g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 900; i++) { g.globalAlpha = .3 + r() * .7; g.fillRect(r() * W, r() * H, (1 + r() * 3) * u, (1 + r() * 2) * u); }
      return c;
    };
    const ridge = (y0, amp, sc, sd, peaks) => { const p = [[0, IH]]; for (let x = 0; x <= W; x += 6 * u) { let y = y0 - amp * fbm(x / (sc * u) + sd, sd, 3); for (const [px, ph, pw] of peaks) y -= ph * u * Math.max(0, 1 - Math.abs(x - px * W) / (pw * u)); p.push([x, y]); } p.push([W, IH]); return p; };
    const fillP = (g, p) => { g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill(); };
    const sun = [W * (LAND ? .68 : .64), IH * (LAND ? .36 : .34)], sr = 120 * u;
    const lakeY = IH * (LAND ? .68 : .7);
    const L = [];
    // 1 浅橙：整片天空和湖面
    L.push(layer('#EFB466', g => { g.fillRect(0, 0, W, IH); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(...sun, sr, 0, TAU); g.fill(); }, 1));
    // 2 朱橙：天空上方的宽窄色带（越往下越细）+ 湖面倒影色带
    L.push(layer('#D9663D', g => {
      let y = 0; for (let i = 0; i < 7; i++) { const h = (70 - i * 9) * u * (LAND ? 1 : 1.4); g.fillRect(0, y, W, h); y += h + (10 + i * 9) * u; }
      for (let i = 0; i < 5; i++) g.fillRect(W * (.1 + i * .05), lakeY + (20 + i * 22) * u, W * (.5 - i * .07), (6 - i) * u);
    }, 2));
    // 3 灰蓝：远山（雪线留纸白）
    L.push(layer('#6E8DA0', g => {
      const rp = ridge(IH * .62, 160, 380, 3, [[.3, 300, 420], [LAND ? .78 : .85, 200, 300]]); fillP(g, rp);
      const near = rp.filter(([x]) => Math.abs(x - W * .3) < 260 * u), top = near.reduce((m, q) => q[1] < m[1] ? q : m), sy = top[1] + 110 * u;
      g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(top[0] - 300 * u, 0); g.lineTo(top[0] + 300 * u, 0);
      for (let k = 0; k <= 12; k++) g.lineTo(top[0] + 300 * u - k * 50 * u, sy + (k % 2 ? 40 : -10) * u + Math.abs(k - 6) * 6 * u);
      g.fill();
      g.beginPath(); g.ellipse(W * .45, lakeY + IH * .08, W * .62, IH * .14, 0, 0, TAU); g.fill();
    }, 3));
    // 4 墨绿：近山、湖岸
    L.push(layer('#2F5B57', g => {
      fillP(g, ridge(IH * .74, 90, 200, 7, [[LAND ? .12 : .05, 120, 260]]));
      g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(W * .45, lakeY + IH * .08, W * .62, IH * .14, 0, 0, TAU); g.fill();
      g.globalCompositeOperation = 'source-over'; g.fillRect(0, IH * .93, W, IH * .07);
    }, 4));
    // 5 深墨：前景松树剪影 + 信息带（字挖空）
    L.push(layer('#1E2833', g => {
      const pine = (x, b, h) => { g.fillRect(x - 4 * u, b - h * .2, 8 * u, h * .2); for (let k = 0; k < 6; k++) { const w = h * (.34 - k * .05), y = b - h * .15 - k * h * .14; g.beginPath(); g.moveTo(x - w, y); g.lineTo(x + w, y); g.lineTo(x, y - h * .26); g.fill(); } };
      [[.04, 520], [.11, 400], [.17, 300], [.88, 460], [.95, 560], [.82, 260]].forEach(([fx, h]) => pine(W * fx, IH + 6 * u, h * u * (LAND ? 1 : 1.1)));
      g.fillRect(0, IH, W, H - IH);
      g.globalCompositeOperation = 'destination-out'; g.textBaseline = 'alphabetic';
      g.font = `900 ${(LAND ? 120 : 112) * u}px 'Noto Sans SC'`; g.textAlign = LAND ? 'left' : 'center';
      const tx = LAND ? 80 * u : W / 2, ty = IH + (LAND ? 150 : 140) * u; g.fillText('云岭国家公园', tx, ty);
      g.font = `${(LAND ? 46 : 44) * u}px 'Bebas Neue'`; g.fillText('YUNLING  NATIONAL  PARK', tx + (LAND ? 6 * u : 0), ty + 62 * u);
    }, 5));
    // 6 朱橙第二遍：信息带里的数字
    L.push(layer('#E0703F', g => {
      g.textAlign = LAND ? 'right' : 'center'; const tx = LAND ? W - 80 * u : W / 2, ty = IH + (LAND ? 150 : 320) * u;
      g.font = `${(LAND ? 128 : 96) * u}px 'Bebas Neue'`; g.fillText('3,412 M', tx, ty);
      g.font = `700 ${34 * u}px 'Noto Sans SC'`; g.fillText('海拔 · 湖 · 雪 · 松 · 四季开放', tx, ty + 56 * u);
    }, 6));
    const off = L.map((_, i) => [(hash1(i * 7) - .5) * 6 * u, (hash1(i * 7 + 3) - .5) * 6 * u]);
    return { paper, L, off, IH };
  },
  draw(ctx, t, s) {
    const u = SHORT / 1080;
    const z = 1 + .035 * eInOutCubic(inv(2.6, 4, t));
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(s.paper, 0, 0);
    const T0 = [.05, .5, .95, 1.4, 1.85, 2.45];
    s.L.forEach((c, i) => {
      const p = eInOutCubic(inv(T0[i], T0[i] + .4, t)); if (p <= 0) return;
      const edge = p * (W + 60 * u);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, edge, H); ctx.clip();
      ctx.drawImage(c, s.off[i][0], s.off[i][1]); ctx.restore();
      if (p < 1) {   // 刮板：一条带影子的竖条
        ctx.fillStyle = 'rgba(30,25,20,.25)'; ctx.fillRect(edge, 0, 26 * u, H);
        ctx.fillStyle = '#3B3B3B'; ctx.fillRect(edge - 8 * u, 0, 10 * u, H);
      }
    });
    ctx.restore();
    // 纸面颗粒压在油墨上，让墨层也带纸纹
    ctx.globalAlpha = .35; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(s.paper, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
});
