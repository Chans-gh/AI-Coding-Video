// C-142 分析立体主义：咖啡馆桌上的杯子、酒瓶和报纸先画成底图，再在上面撒一百多块歪斜的四边形“面”，每块按底图的明暗换成赭石到灰绿的单色、一头亮一头暗、只描一两条边；底下垫一层同色系的斜向短笔，面一块块浮出，再叠上漏字板字母和报纸碎片，之后每块面沿自己的方向慢慢滑动错位。
// 风格提示词：用分析立体主义风格：同一个物体从几个角度同时看，拆成许多半透明、互相穿插的小平面，颜色压到赭石、灰绿、暗金几种，每个面一头亮一头暗、边缘只勾一两笔，画面里散着漏字板印的字母和报纸碎片，各个面缓慢滑动、错位又重新拼合，转场是画面碎成平面再重组。
// 题材：绘画流派 · 适合：咖啡馆与城市生活、设计和艺术史讲解、音乐 MV
scene({
  id: 'C-142', name: '分析立体主义', dur: 5, still: 4.2,
  fonts: ["400 60px 'Bebas Neue'", "italic 700 40px 'Playfair Display'"],
  text: 'CAFÉ JOUR 1912 BAL',
  init() {
    const u = SHORT / 1080;
    // 构图：横屏杯和瓶并排、报纸在左；竖屏瓶在上、杯在下
    const cx = W / 2, cy = H / 2, k = (LAND ? 1 : 1.1) * u;
    const bottle = LAND ? [cx + 180 * k, cy - 40 * k] : [cx + 90 * k, cy - 300 * k];
    const cup = LAND ? [cx - 120 * k, cy + 120 * k] : [cx - 60 * k, cy + 200 * k];
    const paper = LAND ? [cx - 520 * k, cy - 40 * k] : [cx - 200 * k, cy - 620 * k];
    const M = paintMap(g => {
      g.fillStyle = '#6A5A3A'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#9A8456'; g.beginPath(); g.ellipse(cx, cy + 260 * k, 700 * k, 260 * k, 0, 0, TAU); g.fill();          // 桌面
      g.fillStyle = '#C8B07A'; g.beginPath(); g.ellipse(cx, cy + 230 * k, 620 * k, 210 * k, 0, 0, TAU); g.fill();
      const [bx, by] = bottle;                                                                                             // 瓶
      const bg = g.createLinearGradient(bx - 80 * k, 0, bx + 80 * k, 0); bg.addColorStop(0, '#3A4A36'); bg.addColorStop(.3, '#8A9A72'); bg.addColorStop(1, '#2A3226');
      g.fillStyle = bg; g.beginPath(); g.moveTo(bx - 80 * k, by + 260 * k); g.lineTo(bx - 80 * k, by - 40 * k); g.quadraticCurveTo(bx - 80 * k, by - 120 * k, bx - 26 * k, by - 160 * k); g.lineTo(bx - 26 * k, by - 300 * k); g.lineTo(bx + 26 * k, by - 300 * k); g.lineTo(bx + 26 * k, by - 160 * k); g.quadraticCurveTo(bx + 80 * k, by - 120 * k, bx + 80 * k, by - 40 * k); g.lineTo(bx + 80 * k, by + 260 * k); g.fill();
      const [qx, qy] = cup;                                                                                                // 杯和碟
      g.fillStyle = '#E4D6AE'; g.beginPath(); g.ellipse(qx, qy + 90 * k, 170 * k, 46 * k, 0, 0, TAU); g.fill();
      const cg = g.createLinearGradient(qx - 100 * k, 0, qx + 100 * k, 0); cg.addColorStop(0, '#F2E6C2'); cg.addColorStop(1, '#8A7A52');
      g.fillStyle = cg; g.beginPath(); g.moveTo(qx - 100 * k, qy - 40 * k); g.lineTo(qx + 100 * k, qy - 40 * k); g.quadraticCurveTo(qx + 90 * k, qy + 80 * k, qx, qy + 86 * k); g.quadraticCurveTo(qx - 90 * k, qy + 80 * k, qx - 100 * k, qy - 40 * k); g.fill();
      g.fillStyle = '#3A2A1A'; g.beginPath(); g.ellipse(qx, qy - 40 * k, 100 * k, 26 * k, 0, 0, TAU); g.fill();
      g.strokeStyle = '#B8A478'; g.lineWidth = 18 * k; g.beginPath(); g.ellipse(qx + 120 * k, qy + 10 * k, 34 * k, 44 * k, 0, -1.4, 1.4); g.stroke();
      const [px, py] = paper; g.fillStyle = '#D8CCA8'; g.save(); g.translate(px, py); g.rotate(-.12); g.fillRect(-160 * k, -200 * k, 320 * k, 400 * k); g.restore();
    }, { res: 4, blur: 10 * u });
    // 单色：只按亮度在赭石—灰绿—暗金之间取
    const ramp = ['#2A2418', '#4A4030', '#6E6444', '#8A7A4A', '#A89060', '#B8A878', '#C8BC92', '#E2D6B0'].map(hex2rgb);
    const tone = l => { const x = clamp(l) * (ramp.length - 1), i = Math.min(ramp.length - 2, Math.floor(x)), f = x - i; return ramp[i].map((v, j) => lerp(v, ramp[i + 1][j], f)); };
    const greenish = c => [c[0] * .88, c[1] * .97, c[2] * .86];
    // 底层：同色系斜向短笔（静止，init 里画好）
    const F = flowField({ angle: -.8, noise: .25, scale: .004, res: 30 });
    const S = strokePlan(M, F, { gap: 9 * u, len: [18 * u, 28 * u], width: [11 * u, 14 * u], jitter: .15, spread: .2, seed: 142, tint: (x, y, c, R) => { const t = tone(clamp((M.lum(x, y) - .5) * 1.5 + .5 + (R() - .5) * .08)); return R() < .4 ? greenish(t) : t; } });
    const under = mk(W, H), ug = under.getContext('2d'); ug.fillStyle = '#5A4E34'; ug.fillRect(0, 0, W, H); drawStrokes(ug, S, 1, { style: 'dab' });
    // 面：越靠近物体越密越小
    const R = mulberry32(1912), facets = [];
    const foci = [bottle, cup, paper, [cx, cy]];
    for (let i = 0; i < 170; i++) {
      const f = foci[i % 4], sp = (i % 4 === 3 ? 700 : 220) * k, x = f[0] + (R() - .5) * sp * 2, y = f[1] + (R() - .5) * sp * 1.6;
      const s = (30 + R() * 70) * k * (i % 4 === 3 ? 1.6 : 1), a = (R() - .5) * 1.2 + (R() < .5 ? 0 : Math.PI / 2);
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([px, py]) => { const sx = px * s * (.6 + R() * .7), sy = py * s * (.5 + R() * .9); return [sx * Math.cos(a) - sy * Math.sin(a), sx * Math.sin(a) + sy * Math.cos(a)]; });
      const l = M.lum(clamp(x, 0, W - 1), clamp(y, 0, H - 1)), c = R() < .35 ? greenish(tone(l)) : tone(l), ga = R() * TAU;
      facets.push({ x, y, pts, c0: `rgb(${tone(clamp(l + .25)).map(Math.round)})`, c1: `rgb(${c.map(v => Math.round(v * .7))})`, ga, e: [Math.floor(R() * 4), Math.floor(R() * 4)], dir: R() * TAU, amp: (8 + R() * 22) * k, ph: R() * TAU, view: [(R() - .5) * 50 * k, (R() - .5) * 50 * k], k: i / 170 + R() * .3 });
    }
    facets.sort((a, b) => a.k - b.k);
    // 漏字板字母和报纸碎片
    const letters = [['CAFÉ', LAND ? W * .18 : W * .74, LAND ? H * .2 : H * .2, -.06, 120], ['BAL', LAND ? W * .82 : W * .78, LAND ? H * .78 : H * .88, .04, 90], ['1912', LAND ? W * .6 : W * .3, LAND ? H * .12 : H * .45, 0, 60]];
    // 物体的轮廓：拆成一段段，每段各自错开一点（几个角度同时看）
    const [bx, by] = bottle, [qx, qy] = cup, segs = [];
    const add = pts => { for (let i = 0; i + 1 < pts.length; i += 3) { const sh = [(R() - .5) * 30 * k, (R() - .5) * 30 * k]; segs.push({ pts: pts.slice(i, i + 4), sh, ph: R() * TAU }); } };
    add(resample([[bx - 80 * k, by + 260 * k], [bx - 80 * k, by - 40 * k], [bx - 50 * k, by - 120 * k], [bx - 26 * k, by - 160 * k], [bx - 26 * k, by - 300 * k]], 18).map(p => [p.x, p.y]));
    add(resample([[bx + 80 * k, by + 260 * k], [bx + 80 * k, by - 40 * k], [bx + 50 * k, by - 120 * k], [bx + 26 * k, by - 160 * k], [bx + 26 * k, by - 300 * k]], 18).map(p => [p.x, p.y]));
    add(Array.from({ length: 25 }, (_, i) => [qx + Math.cos(i / 24 * TAU) * 100 * k, qy - 40 * k + Math.sin(i / 24 * TAU) * 26 * k]));
    add(Array.from({ length: 25 }, (_, i) => [qx + Math.cos(i / 24 * TAU) * 170 * k, qy + 90 * k + Math.sin(i / 24 * TAU) * 46 * k]));
    add(Array.from({ length: 13 }, (_, i) => [qx + Math.cos(i / 12 * Math.PI) * 100 * k, qy - 40 * k + Math.sin(i / 12 * Math.PI) * 126 * k]));
    add(Array.from({ length: 13 }, (_, i) => [bx + Math.cos(i / 12 * TAU) * 80 * k, by + 260 * k + Math.sin(i / 12 * TAU) * 22 * k]));
    return { u, k, under, facets, letters, paper, ramp, segs };
  },
  draw(ctx, t, s) {
    const { u, k } = s;
    ctx.drawImage(s.under, 0, 0); ctx.fillStyle = 'rgba(30,26,18,.3)'; ctx.fillRect(0, 0, W, H);
    // 面：先浮出，再沿各自方向慢慢滑动
    const ap = inv(.1, 2.8, t), slide = smooth(2.4, 4, t);
    for (const fc of s.facets) {
      const a = clamp((ap - fc.k * .7) * 4); if (a <= 0) continue;
      const m = fc.amp * (Math.sin(t * 1.3 + fc.ph) * slide + (1 - a) * 2), x = fc.x + Math.cos(fc.dir) * m, y = fc.y + Math.sin(fc.dir) * m;
      ctx.save(); ctx.translate(x, y); 
      const r = 120 * k, gr = ctx.createLinearGradient(-Math.cos(fc.ga) * r, -Math.sin(fc.ga) * r, Math.cos(fc.ga) * r, Math.sin(fc.ga) * r);
      gr.addColorStop(0, fc.c0); gr.addColorStop(1, fc.c1); ctx.fillStyle = gr;
      ctx.beginPath(); fc.pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath();
      ctx.save(); ctx.clip(); ctx.globalAlpha = a; ctx.drawImage(s.under, -x + fc.view[0], -y + fc.view[1]); ctx.restore();   // 面里是换了个角度看的同一幅画
      ctx.globalAlpha = a * .4; ctx.fill();
      // 只描一两条边：一条深、一条亮
      ctx.globalAlpha = a * .85; ctx.lineWidth = 3.5 * u; ctx.lineCap = 'round';
      fc.e.forEach((e, j) => { const [p0, p1] = [fc.pts[e], fc.pts[(e + 1) % 4]]; ctx.strokeStyle = j ? '#EADFB8' : '#1E1A12'; ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke(); });
      ctx.restore();
    }
    // 物体轮廓的碎段
    const cp = inv(.6, 2.6, t);
    ctx.save(); ctx.strokeStyle = '#1E1A12'; ctx.lineWidth = 5 * u; ctx.lineCap = 'round';
    s.segs.forEach((g, i) => { const a = clamp((cp - i / s.segs.length * .7) * 4); if (a <= 0) return; ctx.globalAlpha = a * .8;
      const dx = g.sh[0] * (1 + Math.sin(t * 1.1 + g.ph) * slide * .6), dy = g.sh[1] * (1 + Math.cos(t * 1.1 + g.ph) * slide * .6);
      ctx.beginPath(); g.pts.forEach(([x, y], j) => j ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy)); ctx.stroke(); });
    ctx.restore();
    // 报纸碎片：斜贴的一块，几行假字
    const np = smooth(1.8, 2.6, t);
    if (np > 0) { const [px, py] = s.paper; ctx.save(); ctx.globalAlpha = np * .85; ctx.translate(px + 40 * k, py + 60 * k); ctx.rotate(-.12 + Math.sin(t * .9) * .02 * slide);
      ctx.fillStyle = '#E2D6B0'; ctx.fillRect(-120 * k, -90 * k, 240 * k, 170 * k);
      ctx.fillStyle = '#2A2418'; ctx.font = `italic 700 ${Math.round(40 * k)}px 'Playfair Display'`; ctx.fillText('Le Jour', -104 * k, -46 * k);
      for (let i = 0; i < 6; i++) ctx.fillRect(-104 * k, (-26 + i * 16) * k, (130 + hash1(i) * 80) * k, 5 * k);
      ctx.restore(); }
    // 漏字板字母：字上横着切几道缝
    s.letters.forEach(([txt, x, y, rot, sz], i) => { const p = smooth(2 + i * .35, 2.6 + i * .35, t); if (p <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = p * .9; ctx.font = `400 ${Math.round(sz * k)}px 'Bebas Neue'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#1E1A12'; ctx.fillText(txt, 0, 0);
      const w = ctx.measureText(txt).width; ctx.fillStyle = '#B8A878';
      for (let j = 0; j < txt.length; j++) { const lx = -w / 2 + (j + .5) * w / txt.length; ctx.fillRect(lx - 2.5 * k, -sz * k * .05, 5 * k, sz * k * .1); }   // 漏字板的连桥
      ctx.restore(); });
  }
});
