// C-136 威尼斯风景画：运河两岸按一点透视算出一排排立面、远处一座圆顶教堂，天空占三分之二，先画成色块底图（含水里的倒影），strokePlan 铺干而快的小笔（天空横、墙竖、水平），再用细直线补窗格、檐口、系船桩，小人是几笔色点；init 里画好整张，每帧只画会动的贡多拉、它的倒影和水纹、水面白色碎光，镜头沿运河慢慢横移。
// 风格提示词：用威尼斯风景画风格：低地平线，银灰色的天空占画面三分之二，运河两岸的建筑按透视排得一丝不苟、窗格和檐口用细直线勾清，墙面和水面用干而快的小笔触扫出，水上有一笔笔白色碎光，岸边和桥上散着用两三笔点成的小人，一条贡多拉慢慢划过，镜头沿运河平稳横移。
// 题材：绘画流派 · 适合：城市与旅行、建筑与历史讲解、慢节奏的风景片头
scene({
  id: 'C-136', name: '威尼斯风景画', dur: 5, still: 4.2,
  fonts: [],
  init() {
    const u = SHORT / 1080;
    // 构图：横屏消失点偏右、左岸长右岸短；竖屏消失点居中、两岸对称
    const hz = LAND ? H * .62 : H * .6, vx = LAND ? W * .6 : W * .5;
    const R = mulberry32(136);
    // 一侧的立面：x 从近到远，水线和檐口都往消失点收
    const side = (x0, near, wl0, top0) => {
      const out = []; let x = x0;
      const wl = xx => lerp(wl0, hz + 6 * u, (xx - x0) / (vx - x0)), tp = xx => lerp(top0, hz - 24 * u, (xx - x0) / (vx - x0));
      while (Math.abs(vx - x) > 40 * u) {
        const w = (near * (1 - Math.abs(x - x0) / Math.abs(vx - x0)) * .9 + 26 * u) * (.7 + R() * .6) * Math.sign(vx - x0), xb = x + w;
        out.push({ xa: x, xb, h: .72 + R() * .4, col: ['#D8B48A', '#E2C9A2', '#C98A6A', '#E8D8B8', '#B9785A', '#D4A27A'][Math.floor(R() * 6)], rows: 2 + Math.floor(R() * 3), cols: 3 + Math.floor(R() * 4), wl, tp });
        x = xb;
      }
      return out;
    };
    const L = side(LAND ? -40 * u : -20 * u, LAND ? 380 * u : 300 * u, H * (LAND ? .9 : .78), hz - (LAND ? 300 : 420) * u);
    const Rt = side(W + 20 * u, LAND ? 300 * u : 300 * u, H * (LAND ? .82 : .78), hz - (LAND ? 260 : 420) * u);
    const quad = (b, flip) => { const ya = b.wl(b.xa), yb = b.wl(b.xb), ta = ya - (ya - b.tp(b.xa)) * b.h, tb = yb - (yb - b.tp(b.xb)) * b.h;
      return flip ? [[b.xa, ya], [b.xb, yb], [b.xb, 2 * yb - tb], [b.xa, 2 * ya - ta]] : [[b.xa, ya], [b.xa, ta], [b.xb, tb], [b.xb, yb]]; };
    const poly = (g, P) => { g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
    const church = [vx + (LAND ? 30 : 0) * u, hz + 4 * u], cs = LAND ? 1.3 : 1;
    const drawChurch = (g, flip) => { const [cx, cy] = church, sg = flip ? -1 : 1;
      const k = cs * u;
      g.fillStyle = '#EDE4CE'; g.fillRect(cx - 70 * k, flip ? cy : cy - 80 * k, 140 * k, 80 * k);
      g.fillStyle = '#9AA4A8'; g.beginPath(); g.ellipse(cx, cy - sg * 80 * k, 56 * k, 70 * k, 0, flip ? 0 : Math.PI, flip ? Math.PI : TAU); g.fill();   // 铅灰圆顶
      g.fillStyle = '#EDE4CE'; g.fillRect(cx - 9 * k, flip ? cy + 146 * k : cy - 176 * k, 18 * k, 30 * k);
      g.fillStyle = '#C97A58'; g.fillRect(cx + 100 * k, flip ? cy : cy - 230 * k, 26 * k, 230 * k);                         // 砖红钟楼
      g.fillStyle = '#7E8A86'; g.beginPath(); g.moveTo(cx + 96 * k, cy - sg * 230 * k); g.lineTo(cx + 113 * k, cy - sg * 280 * k); g.lineTo(cx + 130 * k, cy - sg * 230 * k); g.fill(); };
    const M = paintMap(g => {
      const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#8FA6BE'); sky.addColorStop(.6, '#C6CED4'); sky.addColorStop(1, '#E8E2D2');
      g.fillStyle = sky; g.fillRect(0, 0, W, hz + 10 * u);
      g.filter = `blur(${26 * u}px)`;
      for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#EEEAE0' : '#A9B2BA'; g.beginPath(); g.ellipse(W * hash1(i * 3), hz * (.12 + .5 * hash1(i * 7)), W * (.12 + .1 * hash1(i)), 40 * u, -.05, 0, TAU); g.fill(); }
      g.filter = 'none';
      const wt = g.createLinearGradient(0, hz, 0, H); wt.addColorStop(0, '#9AAAA2'); wt.addColorStop(1, '#4E6A66');
      g.fillStyle = wt; g.fillRect(0, hz, W, H - hz);
      g.globalAlpha = .26; g.filter = `blur(${6 * u}px)`; [...L, ...Rt].forEach(b => { g.fillStyle = b.col; poly(g, quad(b, true)); g.fill(); }); drawChurch(g, true); g.globalAlpha = 1; g.filter = 'none';   // 倒影
      drawChurch(g, false);
      [...L, ...Rt].reverse().forEach(b => { g.fillStyle = b.col; poly(g, quad(b, false)); g.fill(); });
      [L, Rt].forEach(S => { g.fillStyle = '#8A7A66'; g.beginPath(); S.forEach((b, i) => { const q = quad(b, false); i ? g.lineTo(q[0][0], q[0][1] + 3 * u) : g.moveTo(q[0][0], q[0][1] + 3 * u); g.lineTo(q[3][0], q[3][1] + 3 * u); }); S.slice().reverse().forEach(b => { const q = quad(b, false); g.lineTo(q[3][0], q[3][1] + 16 * u); g.lineTo(q[0][0], q[0][1] + 16 * u); }); g.fill(); });   // 岸边石阶
    }, { res: 4, blur: 3 * u });
    const inB = (x, y, S) => S.some(b => { const lo = Math.min(b.xa, b.xb), hi = Math.max(b.xa, b.xb); if (x < lo || x > hi) return false; const y0 = b.wl(x); return y < y0 && y > y0 - (y0 - b.tp(x)) * b.h; });
    const F = flowField({ res: 12, fn: (x, y) => y > hz + 8 * u && !inB(x, y, L) && !inB(x, y, Rt) ? (hash2(Math.floor(x / 30), Math.floor(y / 12)) - .5) * .15 : (inB(x, y, L) || inB(x, y, Rt) ? Math.PI / 2 : -.04) });
    const S = strokePlan(M, F, { gap: 8 * u, len: [16 * u, 32 * u], width: [7 * u, 10 * u], jitter: .08, spread: .15, layers: 2, detail: .05, seed: 136,
      order: (x, y, l) => l * .5 + (y < hz ? y / hz * .3 : .3 + (y - hz) / (H - hz) * .2) + hash2(Math.floor(x / 60), Math.floor(y / 60)) * .2 });
    // 细线：窗格、檐口、系船桩、小人，画在单独一层
    const lines = mk(W, H), lg = lines.getContext('2d');
    lg.lineCap = 'round';
    [...L, ...Rt].forEach(b => { const q = quad(b, false), [a0, a1, b1, b0] = q;
      lg.strokeStyle = 'rgba(70,50,36,.8)'; lg.lineWidth = 1.6 * u; lg.beginPath(); lg.moveTo(...a1); lg.lineTo(...b1); lg.stroke();   // 檐口
      lg.strokeStyle = 'rgba(70,50,36,.35)'; lg.beginPath(); lg.moveTo(...a0); lg.lineTo(...a1); lg.stroke();
      for (let j = 0; j < 2; j++) { const f = .25 + j * .5 + hash1(b.xa | 0) * .2, x = lerp(a1[0], b1[0], f), y = lerp(a1[1], b1[1], f), h = (a0[1] - a1[1]) * .1;   // 漏斗形烟囱
        lg.fillStyle = '#9A6A50'; lg.fillRect(x - h * .1, y - h, h * .2, h); lg.beginPath(); lg.moveTo(x - h * .25, y - h * 1.3); lg.lineTo(x + h * .25, y - h * 1.3); lg.lineTo(x + h * .1, y - h); lg.lineTo(x - h * .1, y - h); lg.fill(); }
      for (let r = 0; r < b.rows; r++) for (let c = 0; c < b.cols; c++) {
        const fx = (c + .5) / b.cols, fy = (r + .7) / (b.rows + .6), x = lerp(a0[0], b0[0], fx), yb = lerp(a0[1], b0[1], fx), yt = lerp(a1[1], b1[1], fx), y = lerp(yt, yb, fy);
        const ww = Math.abs(b0[0] - a0[0]) / b.cols * .26, hh = (yb - yt) / (b.rows + .6) * .4;
        lg.fillStyle = r === 0 && c % 2 ? 'rgba(58,58,62,.8)' : 'rgba(84,66,54,.8)'; lg.beginPath(); lg.moveTo(x - ww / 2, y + hh / 2); lg.lineTo(x - ww / 2, y - hh / 2 + ww / 2); lg.arc(x, y - hh / 2 + ww / 2, ww / 2, Math.PI, TAU); lg.lineTo(x + ww / 2, y + hh / 2); lg.fill();   // 拱顶窗
        lg.fillStyle = 'rgba(240,232,214,.7)'; lg.fillRect(x - ww / 2 - 1 * u, y + hh / 2, ww + 2 * u, 1.4 * u);
      } });
    { const [cx, cy] = church, k = cs * u; lg.strokeStyle = 'rgba(70,60,50,.7)'; lg.lineWidth = 1.4 * u;   // 教堂的细线
      lg.strokeRect(cx - 70 * k, cy - 80 * k, 140 * k, 80 * k); lg.beginPath(); lg.ellipse(cx, cy - 80 * k, 56 * k, 70 * k, 0, Math.PI, TAU); lg.stroke();
      lg.strokeRect(cx + 100 * k, cy - 230 * k, 26 * k, 230 * k); for (let j = 1; j < 4; j++) { lg.beginPath(); lg.moveTo(cx - 70 * k, cy - j * 20 * k); lg.lineTo(cx + 70 * k, cy - j * 20 * k); lg.stroke(); }
      lg.fillStyle = 'rgba(70,60,50,.6)'; for (let j = 0; j < 3; j++) lg.fillRect(cx + 106 * k + j * 5 * k, cy - 214 * k, 3 * k, 18 * k); }
    const poles = Array.from({ length: 9 }, (_, i) => { const S2 = i % 2 ? Rt : L, b = S2[Math.min(S2.length - 1, Math.floor(R() * Math.min(5, S2.length)))], x = lerp(b.xa, b.xb, R()), y = b.wl(x); return [x + (vx - x) * .04, y + 10 * u, (y - hz) * .45 + 20 * u]; });
    poles.forEach(([x, y, h]) => { for (let j = 0; j < 6; j++) { lg.strokeStyle = j % 2 ? '#F2EEE4' : '#2E4A8A'; lg.lineWidth = Math.max(2, h * .05); lg.beginPath(); lg.moveTo(x, y - h + j * h / 6); lg.lineTo(x, y - h + (j + 1) * h / 6); lg.stroke(); } });
    // 岸上的小人：头一点、身子一笔
    for (let i = 0; i < 26; i++) { const S2 = i % 2 ? Rt : L, b = S2[Math.floor(R() * Math.min(6, S2.length))], x = lerp(b.xa, b.xb, R()), y = b.wl(x) + 2 * u, sc = clamp((y - hz) / (H - hz) * 2.4, .25, 1.2);
      lg.fillStyle = ['#7A2A22', '#2A3A5A', '#E8E0D0', '#3A3028', '#B8862A'][i % 5]; lg.fillRect(x - 4 * u * sc, y - 22 * u * sc, 8 * u * sc, 18 * u * sc);
      lg.fillStyle = '#C89A7A'; lg.beginPath(); lg.arc(x, y - 26 * u * sc, 3.6 * u * sc, 0, TAU); lg.fill(); }
    const paint = mk(W, H), pg = paint.getContext('2d');
    pg.fillStyle = '#C6CED4'; pg.fillRect(0, 0, W, H); drawStrokes(pg, S, 1, { style: 'dab', alpha: .92 }); pg.drawImage(lines, 0, 0);
    // 水面白色碎光
    const fl = Array.from({ length: 120 }, (_, i) => { const y = hz + 12 * u + Math.pow(hash1(i * 3), 1.6) * (H - hz), d = (y - hz) / (H - hz); return [W * hash1(i * 5), y, (6 + 26 * d) * u, hash1(i * 7) * TAU]; });
    return { u, hz, vx, S, lines, paint, fl };
  },
  draw(ctx, t, s) {
    const { u, hz } = s;
    // 镜头沿运河横移：放大 6%，从左往右平移
    const sc = 1.06, px = lerp(0, -W * (sc - 1), eInOutCubic(t / 5)), py = -H * (sc - 1) * .5;
    ctx.save(); ctx.translate(px, py); ctx.scale(sc, sc);
    const p = eOutCubic(inv(.1, 2.6, t));
    if (p < 1) { ctx.fillStyle = '#C6CED4'; ctx.fillRect(0, 0, W, H); drawStrokes(ctx, s.S, p, { style: 'dab', alpha: .92 }); ctx.globalAlpha = smooth(1.6, 2.6, t); ctx.drawImage(s.lines, 0, 0); ctx.globalAlpha = 1; }
    else ctx.drawImage(s.paint, 0, 0);
    // 碎光
    ctx.lineCap = 'round';
    s.fl.forEach(([x, y, l, ph]) => { const a = smooth(1.4, 2.4, t) * (.35 + .35 * Math.sin(t * 2.6 + ph)); if (a < .05) return; ctx.globalAlpha = a; ctx.strokeStyle = '#F6F2E6'; ctx.lineWidth = 2.2 * u; ctx.beginPath(); ctx.moveTo(x - l / 2, y); ctx.lineTo(x + l / 2, y); ctx.stroke(); });
    ctx.globalAlpha = 1;
    // 贡多拉：从右往左划过，带倒影、尾波和船夫
    const gp = t / 5, gx = lerp(W * (LAND ? .92 : 1.05), W * (LAND ? .28 : .1), gp), gy = LAND ? H * .8 : H * .74, gs = (LAND ? 1 : 1.1) * u;
    ctx.globalAlpha = .5; ctx.strokeStyle = '#E8ECE6'; ctx.lineWidth = 2 * u;
    for (let i = 1; i < 6; i++) { const wx = gx + i * 46 * gs, wy = gy + 6 * gs; ctx.beginPath(); ctx.moveTo(wx, wy - i * 3 * gs); ctx.lineTo(wx + 34 * gs, wy - i * 5 * gs); ctx.moveTo(wx, wy + i * 3 * gs); ctx.lineTo(wx + 34 * gs, wy + i * 5 * gs); ctx.stroke(); }
    const boat = (sg) => { ctx.beginPath(); ctx.moveTo(gx - 150 * gs, gy - sg * 30 * gs); ctx.quadraticCurveTo(gx - 120 * gs, gy + sg * 4 * gs, gx, gy + sg * 6 * gs); ctx.quadraticCurveTo(gx + 120 * gs, gy + sg * 4 * gs, gx + 150 * gs, gy - sg * 24 * gs); ctx.quadraticCurveTo(gx + 110 * gs, gy - sg * 4 * gs, gx, gy - sg * 4 * gs); ctx.quadraticCurveTo(gx - 110 * gs, gy - sg * 4 * gs, gx - 150 * gs, gy - sg * 30 * gs); ctx.fill(); };
    ctx.globalAlpha = .35; ctx.fillStyle = '#1C2226'; boat(-1);
    const row = Math.sin(t * 2.4);                                                                 // 划桨
    ctx.globalAlpha = .3; ctx.fillStyle = '#1C2226'; ctx.fillRect(gx + 80 * gs, gy + 8 * gs, 10 * gs, 46 * gs);
    ctx.globalAlpha = 1; ctx.fillStyle = '#16191C'; boat(1);
    ctx.fillStyle = '#7A2A22'; ctx.fillRect(gx - 30 * gs, gy - 22 * gs, 44 * gs, 18 * gs);                                    // 船篷
    ctx.fillStyle = '#E8E0D0'; ctx.fillRect(gx + 76 * gs, gy - 58 * gs, 12 * gs, 54 * gs); ctx.fillStyle = '#2A2A2E'; ctx.fillRect(gx + 76 * gs, gy - 34 * gs, 12 * gs, 30 * gs);
    ctx.fillStyle = '#C89A7A'; ctx.beginPath(); ctx.arc(gx + 82 * gs, gy - 64 * gs, 6 * gs, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3A2A1E'; ctx.lineWidth = 3 * gs; ctx.beginPath(); ctx.moveTo(gx + 86 * gs + row * 8 * gs, gy - 50 * gs); ctx.lineTo(gx + 110 * gs - row * 18 * gs, gy + 10 * gs); ctx.stroke();
    ctx.restore();
  }
});
