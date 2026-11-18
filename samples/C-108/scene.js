// C-108 等距绘本：Canvas 2D 自己写 30° 等距投影，站台、列车、闸机都是只填三个面的方块（顶面、正面、侧面各一档明度，无描边无阴影）；顶棚绕后边缘转 180° 像翻页一样掀开，车门滑开后先下两人，排队的无脸小人再按顺序沿折线路径走进车门；“先下后上”四个衬线大字用仿射变换贴在地面上，一个字一个字从空中落下。
// 风格提示词：用等距绘本风格：30° 真等距、满出画框的一处真实场所（站台、闸机、路口），只用三色阶平涂、无描边无阴影，背对镜头的无脸小人按规则依次走动，屋顶像纸翻页一样掀开，衬线大字一个字一个字落在地面上，配柔和的立式钢琴和颤音琴。
// 题材：信息讲解与产品发布 · 适合：公共礼仪、排队规则、生活常识
scene({
  id: 'C-108', name: '等距绘本', dur: 4, still: 2.9,
  text: '先下后上',
  fonts: ["900 200px 'Noto Serif SC'"],
  draw(ctx, t, s) {
    const u = SHORT / 1080, S = u * (LAND ? 84 : 92), C = Math.cos(Math.PI / 6), Sn = .5;
    const ox = W * (LAND ? .42 : .4), oy = H * (LAND ? .48 : .5);
    const P = (x, y, z) => [ox + (x - y) * C * S, oy + ((x + y) * Sn - z) * S];
    const poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(...P(...q)) : ctx.moveTo(...P(...q))); ctx.closePath(); ctx.fill(); };
    const box = (x0, x1, y0, y1, z0, z1, [a, b, c]) => {
      poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], b);   // 正面（+y）
      poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], c);   // 侧面（+x）
      poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], a);   // 顶面
    };
    ctx.fillStyle = '#C9D9D6'; ctx.fillRect(0, 0, W, H);
    box(-16, 16, -3.4, 30, -.6, 0, ['#EFE4CF', '#D8C7A8', '#C2AE8C']);           // 站台
    poly([[-16, -2.9, 0], [16, -2.9, 0], [16, -2.5, 0], [-16, -2.5, 0]], '#EDBB4C');   // 黄色盲道
    for (let i = 0; i < 4; i++) poly([[-.5, 1.6 + i * 1.3, 0], [.5, 1.6 + i * 1.3, 0], [.5, 1.9 + i * 1.3, 0], [-.5, 1.9 + i * 1.3, 0]], '#DCCBAE');   // 排队线
    // 地面大字
    '先下后上'.split('').forEach((ch, i) => {
      const t0 = 1.0 + i * .22, p = inv(t0, t0 + .35, t); if (p <= 0) return;
      const z = (1 - eOutCubic(p)) * 5, [ex, ey] = P(1.4 + i * 2, 4.2, z);
      ctx.save(); ctx.globalAlpha = Math.min(1, p * 3); ctx.translate(ex, ey); ctx.transform(C * S / 120, Sn * S / 120, -C * S / 120, Sn * S / 120, 0, 0);
      ctx.fillStyle = '#C0533F'; ctx.font = "900 200px 'Noto Serif SC'"; ctx.textAlign = 'center'; ctx.fillText(ch, 0, 0); ctx.restore();
    });
    // 列车：正面开窗，车门滑开
    box(-16, 16, -6, -3.4, .2, 3, ['#E7EEF0', '#6C9BB3', '#4E7E96']);
    poly([[-16, -3.4, 2.4], [16, -3.4, 2.4], [16, -3.4, 2.6], [-16, -3.4, 2.6]], '#EDBB4C');
    for (const wx of [-9, -5, 4, 8]) poly([[wx, -3.4, 1.3], [wx + 2.4, -3.4, 1.3], [wx + 2.4, -3.4, 2.1], [wx, -3.4, 2.1]], '#A9CBDA');
    const op = eInOutCubic(inv(.7, 1.1, t)) * .75;
    poly([[-.8, -3.4, .2], [.8, -3.4, .2], [.8, -3.4, 2.3], [-.8, -3.4, 2.3]], '#2F4B5C');
    poly([[-.8 - op, -3.4, .2], [-op, -3.4, .2], [-op, -3.4, 2.3], [-.8 - op, -3.4, 2.3]], '#8FB6C9');
    poly([[op, -3.4, .2], [.8 + op, -3.4, .2], [.8 + op, -3.4, 2.3], [op, -3.4, 2.3]], '#8FB6C9');
    // 小人：沿折线走，按 x+y 排序
    const path = (pts, d) => { for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= l) return [lerp(a[0], b[0], d / l), lerp(a[1], b[1], d / l)]; d -= l; } return pts[pts.length - 1]; };
    const items = [];
    for (const gx of [-5, -2.6, 1.4, 3.8]) items.push({ k: gx + 1.2, f: () => box(gx, gx + 1.2, .6, 1.2, 0, 1.4, ['#F08A6C', '#D9674C', '#B9503A']) });   // 闸机
    const COL = ['#3E4C6B', '#D9674C', '#5E8C61', '#8C6BA8', '#E0A33E', '#3E4C6B'];
    const man = (x, y, c, ph, a) => items.push({ k: x + y, f: () => {
      const [px, py] = P(x, y, 0), b = Math.abs(Math.sin(ph)) * 4 * u; ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillStyle = c; rr(ctx, px - .3 * S, py - 1.15 * S - b, .6 * S, 1.15 * S, .28 * S); ctx.fill();
      ctx.fillStyle = '#3A2E2A'; ctx.beginPath(); ctx.arc(px, py - 1.42 * S - b, .27 * S, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    } });
    // 先下：两人从车门出来走向右前方
    [0, 1].forEach(i => { const d = (t - 1.0 - i * .35) * 3.2; if (d < 0) return; const [x, y] = path([[0, -4], [0, -2], [9, 0], [16, 1]], d); man(x, y, COL[4 + i], d * 2.4, clamp(d * 3)); });
    // 后上：排队的人等前两人走开后依次进门
    const Q = [[0, 13], [0, 1.6], [0, -4.2]];
    for (let i = 0; i < 6; i++) {
      const d0 = 11.4 - i * 1.3, d = d0 + Math.max(0, t - 1.9) * 3.0, ok = d < 15.6 + .5;
      if (!ok) continue;
      const [x, y] = path(Q, Math.min(d, 15.6)); man(x, y, COL[i], t > 1.9 ? d * 2.4 : 0, d > 14.6 ? clamp(15.6 + .5 - d) * 2 > 1 ? 1 : clamp((16.1 - d) * 2) : 1);
    }
    items.sort((a, b) => a.k - b.k).forEach(o => o.f());
    // 顶棚：绕后边缘翻起来
    const a = eInOutCubic(inv(.05, .85, t)) * Math.PI;
    if (a < Math.PI * .98) {
      const ed = -3.4, zz = 4.2, D = 18, q = d => [ed + d * Math.cos(a), zz + d * Math.sin(a)];
      const [y1, z1] = q(D);
      poly([[-16, ed, zz], [16, ed, zz], [16, y1, z1], [-16, y1, z1]], a < Math.PI / 2 ? '#7A9E8E' : '#5E8273');
      if (a < Math.PI / 2) poly([[16, ed, zz - .3], [16, y1, z1 - .3], [16, y1, z1], [16, ed, zz]], '#4F6F62');
    }
  }
});
